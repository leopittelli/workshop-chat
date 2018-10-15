"use strict";

const path = require("path");
const webSocketServer = require('websocket').server;
const express = require('express');
const multer  = require('multer');
const imageUploads = multer({ dest: 'uploads/images/' });
const audioUploads = multer({ dest: 'uploads/audios/' });
const app = express();

// Puerto donde va a correr el servidor de websocket
const webSocketsServerPort = 1337;

// Almacenamiento en memoria de mensajes
let history = [];
// Lista de clientes conectados
let clients = [];

/**
 * Helper para escapear textos
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Servidor HTTP
 */
app.use('/public', express.static(path.join(__dirname, 'public')));
express.static.mime.define({'application/wasm': ['wasm']});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/views/frontend.html');
});

app.post('/images', imageUploads.single('image'), function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ url: req.protocol + '://' + req.get('host') + '/' + req.file.path }));
});

app.post('/audios', audioUploads.single('audio'), function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ url: req.protocol + '://' + req.get('host') + '/' + req.file.path }));
});

const server = app.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Servidor escuchando en el puerto " + webSocketsServerPort);
});

/**
 * Servidor WebSocket
 */
const wsServer = new webSocketServer({
    // El server de WebSocket se crea relacionado a un server HTTP.
    httpServer: server
});

// Este callback se ejecuta cada vez que alguien se conecta al servidor de WebSockets
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Conexión desde el origen: ' + request.origin + '.');

    // Aceptamos la conexión - Deberíamos validar el 'request.origin' para asegurar
    // que el cliente se esté conectando desde nuestro sitio (http://en.wikipedia.org/wiki/Same_origin_policy)
    const connection = request.accept(null, request.origin);
    // Guardamos el cliente para removerlo cuando se desconecte
    const index = clients.push(connection) - 1;
    let userName = false;

    console.log((new Date()) + ' Conexión aceptada.');

    // Mandamos el historial de mensajes
    if (history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }

    // Un usuario manda un mensaje
    connection.on('message', function(message) {
        if (message.type === 'utf8') { // Aceptamos solo texto
            const messageData = JSON.parse(message.utf8Data);

            if (userName === false) { // Usamos el primer mensaje como nombre del usuario
                userName = htmlEntities(messageData.text);
                console.log((new Date()) + ' Usuario conocido como: ' + userName);

            } else { // Guardamos el mensaje y se lo mandamos a todos los usuarios
                console.log((new Date()) + ' Mensaje recibido de: ' + userName + ': ' + messageData);

                const obj = {
                    time: (new Date()).getTime(),
                    author: userName,
                    type: messageData.type
                };

                if (messageData.type === "image") {
                    obj.url = messageData.url;
                } else if (messageData.type === "video") {
                    obj.url = messageData.url;
                } else if (messageData.type === "audio") {
                    obj.url = messageData.url;
                } else if (messageData.type === "speech") {
                    obj.text = messageData.text;
                } else {
                    obj.text = htmlEntities(messageData.text);
                    obj.type = 'text';
                }

                history.push(obj);
                history = history.slice(-100);

                // Mandamos el mensaje a todos los clientes conectados
                const json = JSON.stringify({ type: 'message', data: obj });
                for (let i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
            }
        }
    });

    // Se desconecta el usuario
    connection.on('close', function(connection) {
        if (userName !== false) {
            console.log((new Date()) + " Usuario " + connection.remoteAddress + " desconectado.");
            // Lo removemos de la lista de usuarios conectados
            clients.splice(index, 1);
        }
    });

});