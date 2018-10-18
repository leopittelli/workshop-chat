# Almacenamiento offline 📦

¿Qué pasaría si intentáramos enviar un mensaje y no tuviéramos conexión (o el server hubiese dejado de funcionar)?

Sería ideal que podamos almacenar los mensajes en algún tipo de almacenamiento offline para enviarlos cuando recuperemos la conexión.

Si repasamos nuestro archivo **chat-frontend.js**. La función `send`, luego de realizar un par de validaciones del mensaje, intenta mandarlo. Pero tenemos un `if` que anticipa lo que vamos a hacer en este módulo del workshop:

```js
if (connectionError) {
    offlineStorage.save(message);
} else {
    connection.send(JSON.stringify(message));
    if (!myName) {
        myName = message.text;
        mainTitle.textContent = myName;
    }
}    
```

Si tenemos un error de conexión, lo intentamos guardar en el almacenamiento que vamos a construir. Sino, lo enviamos normalmente. 

La mécanica para esta funcionalidad será:

1. Detener el servidor.
1. Enviar un mensaje. Deberíamos ver la notificación de que fue almacenado correctamente.
1. Volver a correr el servidor. Podríamos fingir la desconexión utilizando la opción de `offline` de las chrome `dev tools` pero tiene un [bug](https://bugs.chromium.org/p/chromium/issues/detail?id=423246) que los web sockets no se desconectan al usar esa opción.
1. Refrescar la página y escribir nuestro nombre.
1. Al clickear el botón de sincronizar mensajes (en la esquina superior derecha), deberían enviarse los mensajes pendientes.

    ![Botón](./images/send-messages.png "Botón")
    
    _Botón_ 

## Sobre `IndexedDB`

`IndexedDB` es una API de bajo nivel que ofrece almacenamiento en el cliente de cantidades significativas de datos estructurados, incluyendo archivos y blobs. Usa índices para búsquedas de alto rendimiento en esos datos.

Todas las operaciones son asincrónicas. Originalmente, `IndexedDB` incluía también una API sincrónica pero fue removida de la especificación.

Para tener acceso a la base de datos, debemos llamar `call()` sobre el atributo `IndexedDB` del objeto `window`. Ese método devuelve un objeto de tipo `IDBRequest` que se usa para la comunicación con la misma disparando eventos sobre el mismo.

El método `open` recibe dos parámetros. El primero es el nombre de la base de datos, el segundo es la versión de la misma.

Si la base de datos no existe, es creada y se dispara un evento de `onupgradeneeded` donde debemos crear el `schema`.
Si existe pero la versión que indicamos es más alta, también se dispara el evento `onupgradeneeded` para que ejecutemos las actualizaciones necesarias sobre el `schema`.

### IDBRequest

Es una interfaz que provee acceso a los resultados de los request asincrónicos sobre `databases` y `database objects`. Cada operación de lectura o escritura se ejecuta usando un `IDBRequest`.

#### Eventos

Los `IDBRequest` tienen 2 eventos bastante autoexplicativos: `IDBRequest.onerror` y `IDBRequest.onsuccess`.

### IDBObjectStore

La interfaz `IDBObjectStore` representa un objeto almacenado en la base de datos. Los registros dentro de un `IDBObjectStore` se guardan ordenados por sus `keys`.

#### Métodos

Un `IDBObjectStore` tiene varios métodos disponibles. Algunos de ellos son:

- `IDBObjectStore.add()`: Agrega nuevos registros a un object store.
- `IDBObjectStore.clear()`: Elimina todos los registros de un object store.
- `IDBObjectStore.count()`: Devuelve la cantidad de registros de un store.
- `IDBObjectStore.delete()`: Elimina el registro del store coincidente con la clave indicada.
- `IDBObjectStore.get()`: Devuelve el registro coincidente con la clave especificada.
- `IDBObjectStore.getAll()`: Devuelve todos los registros del store.
- `IDBObjectStore.openCursor()`: Permite iterar sobre los registros del store.
- `IDBObjectStore.put()`: Actualiza un registro del store.

### IDBTransaction

Todas las lecturas y escrituras sobre la base de datos son realizadas a través de la interfaz `IDBTransaction`. Se usa `IDBTransaction` para iniciar la transacción y `IDBTransaction` para setear el modo (`readonly` o `readwrite`) y acceder al `IDBObjectStore` para realizar el request.


## Implementación

Vamos al código! Modificaremos el archivo **offline-storate.js**

### Inicialización

```js
const button = document.getElementById("upload-messages-icon");
const request = window.indexedDB.open("web-chat", 1);

let db;

request.onerror = function(event) {
    chat.notify("Ocurrió un error iniciando el almacenamiento");
};
request.onsuccess = function(event) {
    db = request.result;

    const count = db.transaction("messages", "readonly").objectStore("messages").count();
    count.onsuccess = function(e) {
        if (count.result > 0) {
            button.style.display = "block";
        }
    };
};

request.onupgradeneeded = function(event) {
    var db = event.target.result;
    if (!db.objectStoreNames.contains('messages')) {
        db.createObjectStore('messages', {autoIncrement: true});
    }
};
```

El primer paso, una referencia al botón de sincronización.

Luego de eso, abrimos la base de datos y tenemos tres posibles situaciones:
- `onerror`: mostramos una notificación en caso de error.
- `onsucces`: si hay mensajes pendientes, mostramos el botón. Notar que para hacer la cuenta debemos iniciar otro request.
- `onupgradeneeded`: si no existe el store `messages` lo creamos.

### Guardando mensajes

Ya tenemos la base de datos lista con nuestro object store creado.

No toca crear la función `save` donde:
- Iniciamos una transacción de escritura.
- Agregamos al `object store` de `messages` nuestro mensaje.
- Mostramos el botón de sincronización y un mensaje de éxito.

```js
const save = function(message) {
    const transaction = db.transaction(["messages"], "readwrite");
    transaction.onerror = function(event) {
        chat.notify("Error guardando el mensaje");
    };

    const objectStore = transaction.objectStore("messages");

    const request = objectStore.add(message);
    request.onsuccess = function(event) {
        button.style.display = "block";
        chat.notify("Mensaje almacenado correctamente");
    };
};
```

### Enviando mensajes

Ya guardamos los mensajes en la base. Ahora nos toca poder enviarlos con nuestra función `sendStoredMessages`.

Los pasos serán:
- Crear una transacción de escritura.
- Abrir un cursor.
- Recorrer todo el store de mensajes enviando el mensaje y eliminándolo.
- Cuando terminamos, ocultamos el mensaje .

```js
const sendStoredMessages = function() {
    const objectStore = db.transaction("messages", "readwrite").objectStore("messages");

    objectStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            chat.send(cursor.value);
            const request = cursor.delete();
            request.onsuccess = function() {
                cursor.continue();
            };
        } else {
            button.style.display = "none";
        }
    };
};

return {
    save,
    sendStoredMessages
}
```

Finalmente, devolvemos las funciones `save` y `sendStoredMessages` para poder usar desde el resto de la aplicación.

## Listo!

Para probar lo que acabamos de hacer podemos seguir la mecánica que detallamos al principio del módulo.

Para chequear si la base de datos y su contenido se crean correctamente podemos usar las `dev tools` en el panel `application` -> `IndexedDB`

![IndexedDB](./images/indexeddb.png "IndexedDB")

_IndexedDB_ 

## Próximo modulo
Avanzar al [módulo 12 - Final](../12-end)
