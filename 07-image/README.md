# Enviando imágenes 🤳

Ya tenemos mensajes de texto, mensajes de audio y varias funcionalidades relacionadas. Necesitamos selfies!

En este módulo entonces vamos a hacer uso de la cámara para enviar mensajes con imágenes.

La mécanica para esto será:

1. Hacer click en el botón de la cámara

    ![Botón](./images/capture-image.png "Botón")
    
    _Botón_
1. Aceptar el permiso de acceso a la cámara.
1. Se va a abrir un modal con nuestra imagen.
1. Hacer click en el botón _Tomar foto_
1. Aparecerá el nuevo mensaje.

Por detrás estaremos haciendo algo parecido a lo que hicimos con los audios:

1. Enviar la imagen a nuestro servidor.
1. Al guardar el archivo con éxito, mandaremos un mensaje de tipo `imagen` con la url de la misma a todos los usuarios conectados.
1. Al recibir el mensaje de tipo `imagen`, mostraremos la misma con un tag `img` tradicional.


## Conceptos

Ya hablamos `canvas` en el módulo de [conceptos](../03-conceptos).

Y de `getUserMedia` y `blob` en el módulo de [audio](../04-audio).

Vamos a volver a hacer uso de esos 3 conceptos por lo cual, si te salteaste esas secciones, te recomiendo que vuelvas (al menos a leer esas partes).


## Implementación

A modificar el archivo **capture-image.js**!

### Inicialización y código base

Lo primero, muchas constantes. 

- `video`: nuestro elemento de video para tener acceso a la cámara.
- `canvas`: el lugar donde vamos a sumar algunas magias procesando la imagen.
- `sendImageButton`: el botón para abrir la cámara.
- `sendImageModal`: el modal que va a aparecer a pantalla completa cuando querramos enviar una imagen.
- `takePictureButton`: el nombre lo dice todo.
- `closeModalButton`: el nombre lo dice todo.
- Algunas otras variables que usaremos para calcular las dimensiones de la imagen
- Y unos misteriosos `emptyFilter` e `imageFilter` que van para un módulo más adelante.

```js
const video             = document.getElementById('video'),
    canvas              = document.getElementById('canvas'),
    sendImageButton     = document.getElementById('send-image'),
    sendImageModal      = document.getElementById('send-image-modal'),
    takePictureButton   = document.getElementById('take-picture'),
    closeModalButton    = document.querySelector('#send-image-modal .close');
let ratio, width, height;

const emptyFilter = data => data;
let imageFilter = emptyFilter;
```

### Bindeando eventos

Tenemos muchos elementos que se muestran y ocultan. Para eso vamos a necesitar las siguientes funciones y `eventListeners`

- `closeModal`: La usaremos para cerrar el modal. Al mismo tiempo cortaremos el acceso al video.
- `takePictureButton.click`: Llamaremos a la función `takePicture` definida más abajo para sacar la foto.
- `sendImageButton.click`: Es el click en el bontón principal, pedimos acceso a la cámara.
- `closeModalButton.click`: Es el click en el botón para cerrar el modal.
- `video.loadedmetadata`: Seteamos las dimensiones del canvas respetando la relación de aspecto del video cuando ya se cargó. También renderizamos la imagen usando la función `renderSource` que definimos más abajo.

```js
function closeModal() {
    const track = video.srcObject.getTracks()[0];
    track.stop();
    sendImageModal.style.display = 'none';
}

takePictureButton.addEventListener('click', function(ev){
    takepicture();
    ev.preventDefault();
}, false);

sendImageButton.addEventListener('click', function(ev){
    getMedia();
    ev.preventDefault();
}, false);

closeModalButton.addEventListener('click', function(ev){
    closeModal();
    ev.preventDefault();
}, false);

video.addEventListener('loadedmetadata', function() {
    ratio = video.videoWidth / video.videoHeight;
    width = 640;
    height = parseInt(width / ratio, 10);

    canvas.width = width;
    canvas.height = height;

    requestAnimationFrame(_ => renderSource(video, canvas));
}, false);
```

### Uso de `getUserMedia`

También parecido al caso del audio. 

Cuando hagamos el pedido a `getUserMedia` el usuario va a ser consultado para darnos el permiso. Si lo hace, seteamos la cámara como fuente en el elemento de video que inicializamos en el paso anterior y mostramos el modal.

```js
function getMedia() {
    navigator.mediaDevices.getUserMedia({
        video: true
    })
        .then(function(stream) {
            video.srcObject = stream;
            sendImageModal.style.display = 'block';
        })
        .catch(function(error) {
            console.log('error', error);
        });
}
```

### Mostrando el video

Vamos a mostrar el video dibujando frame a frame del mismo en el `canvas`, esto nos va a permitir transformar la imagen cuando la mostramos.

Por el momento, el filtro solo devuelve el mismo valor que le pasamos. (Es el `emptyFilter` que definimos más arriba). 

```js
function renderSource(source, destination) {
    const context = destination.getContext('2d');
    context.drawImage(source, 0, 0, destination.width, destination.height);

    const imageData = context.getImageData(0, 0, destination.width, destination.height);
    imageData.data.set(imageFilter(imageData));
    context.putImageData(imageData, 0, 0);

    requestAnimationFrame(_ => renderSource(source, destination));
}
```

### Sacando la foto

Finalmente llegó el momento de sacar la foto, para eso, en el click del botón vamos a ejecutar la función `takePicture`.

Allí vamos a:
1. Cerrar el modal
1. Crear un formulario con un blob (igual que cuando mandábamos el audio).
1. Enviar el formulario.
1. En la respuesta del servidor enviar un mensaje de tipo `image` con la url de la imagen que acabamos de subir y que nos devolvió el servidor.
1. Si hubo un error mostramos una notificación.

```js
function takepicture() {
    closeModal();
    canvas.toBlob(function(blob) {
        const form = new FormData();

        form.append('image', blob, 'newPhoto.png');

        fetch('/images', {
            method: 'POST',
            body: form
        })
            .then((response) =>  {
                if (response.status >= 200 && response.status <= 302) {
                    return response
                } else {
                    let error = new Error(response.statusText);
                    error.response = response;
                    throw error
                }
            })
            .then(response => response.json())
            .then((data) => {
                chat.send({ type: "image", url: data.url});
            })
            .catch((error) => {
                chat.notify("Error enviando la imagen");
            })
    })
}
```

### Extras

Por ahora no los vamos a usar. Pero ya que estamos definimos dos funciones y las retornamos para poder utilizarlas desde afuera.

Son las que modifican el `imageFilter` del que hablamos antes.

```js
function setFilter(filter) {
    imageFilter = filter;
}

function removeFilter() {
    imageFilter = emptyFilter;
}

return {
    setFilter,
    removeFilter
}
```

## Listo!

Ahora toca probar lo que hicimos. Enviemos una imagen y veamos que aparece como un nuevo mensaje.

¿Esperabas otro bonus track? Los siguientes dos módulos completos son de bonus... 😏
