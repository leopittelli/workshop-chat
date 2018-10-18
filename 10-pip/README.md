# Picture-in-Picture (PIP) 📺

Ya tenemos audio, imagen, nos falta video. Pero en este caso no vamos a subir un video nuestro sino usar uno ya creado para embeberlo y poder reproducirlo de manera flotante por sobre todas las ventanas del sistema operativo. En otras palabras: picture in picture:

La mécanica para esta funcionalidad será:

1. Enviar un mensaje con la url de un video.
1. Al detectar que es un video (para simplificar, termina en `.mp4`) vamos a mostrar un reproductor embebido y el botón de `PIP` a su lado.
1. Al clickear el botón de `PIP` pasará a reproducirse en un widget flotante.

    ![Botón](./images/pip.png "Botón")
    
    _Botón_

## Sobre `PIP`

Nuevamente estamos haciendo uso de una API muy nueva con poco soporte.

Para poder usarla en chrome debemos habilitar dos flags desde [chrome://flags/#enable-picture-in-picture](chrome://flags/#enable-picture-in-picture) y desde [chrome://flags/#enable-surfaces-for-videos](chrome://flags/#enable-surfaces-for-videos)

## Implementación

Como es de esperar, en este módulo nos toca editar el archivo **pip.js**

Es un módulo bastante simple así que vamos con todo el código junto.

Lo que vamos a hacer es:

1. Guardar una referencia al video actual en `activeVideo`.
1. Implementar una función `toggle` que:
    1. Chequeará el soporte
    1. Obtendrá el video a mostrar
    1. Activará el video en PIP o cancelará la reproducción actual.
1. Por último devolveremos la función `toggle` para poder usar desde afuera.

```js
const pip = (function() {

    let activeVideo;

    function toggle(id){
        if (!document.pictureInPictureEnabled) {
            chat.notify("Este navegador no soporta web picture in picture");
        }

        const video = document.getElementById(id);

        if (activeVideo === video) {
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture()
                    .catch(error => {
                        // Video failed to enter Picture In Picture mode.
                        console.log(error)
                    });
            }
            activeVideo = false;
        } else {
            activeVideo = video;
            activeVideo.requestPictureInPicture()
                .catch(error => {
                    // Video failed to enter Picture In Picture mode.
                    console.log(error)
                });
        }
    }

    return {
        toggle
    }
})();
```

## Activación de `PIP` desde el chat

Para usarla, desde todos los botones de `PIP` en los mensajes de tipo video, llamaremos a la función `toggle` al hacer click mediante este código que ya está en el archivo **chat-frontend.js**: `onclick="pip.toggle('videoId')"`


## Listo!

Probar el módulo es muy sencillo:

1. Mandar un mensaje con un video. (recordar que tiene que terminar en `.mp4`). Uno para que no tengas que buscar: `http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`
1. Darle play al video.
1. Hacer click en el botón de PIP.
1. Esperar que se abra en una ventana flotante y probar que, cambiando de pestaña y aplicación, podemos seguir viendo el video.


## Próximo modulo
Avanzar al [módulo 11 - Almacenamiento offline 📦](../11-offline-storage)
