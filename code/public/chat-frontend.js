const chat = (function () {
    let connection;
    let conectionError = false;
    let myName = false;
    const content = document.getElementById('content');
    const inner = document.getElementById('inner');
    const input = document.getElementById('input');
    const sendButton = document.getElementById('send');
    const mainTitle = document.getElementById('main-title');

    function scrollBottom() {
        inner.scrollTop = content.offsetHeight;
    }

    function onRecieve(message) {
        content.insertAdjacentHTML('beforeend', buildHTML(message));

        scrollBottom();
    }

    function buildMessageHTML(message) {
        switch (message.type) {
            case 'text':
                return `<span>${message.text} <button class="message-button read" title="Leer" onclick="synthesis.speak('${message.text}')"></button></span>`;
            case 'speech':
                return `<span>SPEECH: ${message.text} <button class="message-button read" title="Leer" onclick="synthesis.speak('${message.text}')"></button></span>`;
            case 'image':
                return `<img id="image-${ message.time }" src="${ message.url }" /> <button class="message-button face" title="Detectar caras" onclick="shape.detect('image-${ message.time }')"></button>`;
            case 'video':
                return `<video id="video-${ message.time }" src="${ message.url }" controls></video> <button class="message-button pip" title="Picture in picture" onclick="pip.toggle('video-${ message.time }')"></button>`;
            case 'audio':
                return `<audio controls src="${ message.url }" />`;
            default:
                return '';
        }
    }

    function buildHTML(message) {
        const authorClass = message.author === myName ? "me" : "them";

        return `<div class="${'message-wrapper ' + authorClass }">
            <div class="circle-wrapper animated bounceIn">${ message.author.charAt(0) }</div>
            <div class="text-wrapper animated fadeIn">${ buildMessageHTML(message) }</div>
        </div>`;
    }

    function checkIfVideoURL(text) {
        return /^https?:\/\/[a-z\d-_\/.]*\.mp4$/i.test(text);
    }

    function send(message) {
        if (validate(message)) {
            message.time = new Date().getTime();

            if (checkIfVideoURL(message.text)) {
                message.type = "video";
                message.url = message.text;
            }

            if (conectionError) {
                offlineStorage.save(message);
            } else {
                connection.send(JSON.stringify(message));
                if (!myName) {
                    myName = message.text;
                    mainTitle.textContent = myName;
                }
            }
        }
    }

    function notify(text) {
        receive({type: "text", text: text, author: "admin"});
    }

    function receive(message) {
        if (validate(message)) {
            onRecieve(message);
        }
    }

    function validate(message) {
        switch (message.type) {
            case 'text':
                return message.text.length;
            case 'image':
                return message.url.length;
            case 'video':
                return message.url.length;
            case 'speech':
                return message.text.length;
            case 'audio':
                return message.url.length;
            default:
                return false;
        }
    }

    function sendTextMessage() {
        send({type: "text", text: input.value});

        input.value = '';
        input.focus();
    }

    function bindEvents() {
        input.focus();

        sendButton.addEventListener('click', function(e) {
            sendTextMessage();
        });

        input.addEventListener('keydown', function(e) {
            let key = e.which || e.keyCode;

            if (key === 13) { // enter key
                e.preventDefault();

                sendTextMessage();
            }
        });
    }

    function init() {
        window.WebSocket = window.WebSocket || window.MozWebSocket;

        if (!window.WebSocket) {
            notify("Este navegador no soporta web sockets");
            return;
        }

        connection = new WebSocket('ws://127.0.0.1:1337');

        connection.onopen = function () {
            notify('Escribe tu nombre:');
        };

        connection.onerror = function (error) {
            notify('Error de conexión');
        };

        connection.onmessage = function (message) {
            let json;
            try {
                json = JSON.parse(message.data);
            } catch (e) {
                console.log('This doesn\'t look like a valid JSON: ', message.data);
                return;
            }

            if (json.type === 'history') {
                for (let i=0; i < json.data.length; i++) {
                    receive(json.data[i]);
                }
            } else {
                receive(json.data);
            }
        };

        bindEvents();

        setInterval(function() {
            if (connection.readyState !== 1) {
                if (!conectionError) notify('Error de conexión');
                conectionError = true;
            } else {
                conectionError = false;
            }
        }, 3000);
    }

    init();

    return {
        send,
        notify
    }
})();
