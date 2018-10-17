# Detectando caras en las fotos 🤦‍♀️ 🤦‍♂️

Para esta altura, puede que hayas notado que al lado de cada mensaje de tipo imagen aparece un botón con un cara.

Ese botón nos va a permitir detectar las caras presentes en la imagen.

¿De qué nos sirve? Este ejemplo no sirve para mucho pero al menos probamos la `Shape Detection API`. 

La mécanica para esta funcionalidad será:

1. Hacer click en el botón de la cara en un mensaje con imagen

    ![Botón](./images/detect-faces.png "Botón")
    
    _Botón_
1. Si logramos detectar una imagen en la cara se debería marcar un recuadro rojo alrededor.

## Sobre la `Shape Detection API`

Esta API permite acceder a detección de texto, caras, códigos de barra o QR aceleradas por hardware.

El soporte es muy reducido, en chrome se espera que esté disponible solo para prueba bajo api key en dominios espécificos a partir de la versión 70. (Estable el 16 de octubre de 2018).

Además, el soporte depende de la aceleración por hardware que varían en cada sistema operativo:
- **BarcodeDetector:** Android, macOS (mejor certeza en 10.13+)
- **FaceDetector:** Android, macOS (mejor certeza en 10.13+), Windows 10
- **TextDetector**: Android, macOS 10.11+, Windows 10

En nuestro caso, vamos a usar el `FaceDetector`, para eso tenemos que habilitar un flag en chrome desde [chrome://flags/#enable-experimental-web-platform-features](chrome://flags/#enable-experimental-web-platform-features)


## Implementación

En este módulo nos toca editar el archivo **shape-detection.js**

Es un módulo bastante simple así que vamos con todo el código junto.

Lo que vamos a hacer es:

1. Guardar una referencia a un `canvas`.
1. Implementar una función `detect` que:
    1. Chequeará el soporte
    1. Obtendrá la imagen para la que queremos detectar las caras
    1. Se la pasará a la API
    1. Dibujará la imagen en el `canvas`
    1. Dibujará un rectángulo sobre la imagen dibujada anteriormente para cada una de las caras detectadas
    1. Obtendrá el resultado del `canvas`
    1. Actualizará el contenido de la imagen
1. Por último devolveremos la función `detect` para poder usar desde afuera.

```js
const shape = (function() {
    const canvas = document.getElementById('canvas-shape');

    function detect(id) {
        if (!window.FaceDetector) {
            chat.notify("Este navegador no soporta web face detection");
            return;
        }

        const image = document.getElementById(id);

        const faceDetector = new FaceDetector();
        faceDetector.detect(image)
            .then(faces => {
                canvas.height = image.naturalHeight;
                canvas.width = image.naturalWidth;

                const ctx = canvas.getContext('2d');

                ctx.drawImage(image,
                    0, 0, canvas.width, canvas.height,
                    0, 0, canvas.width, canvas.height);

                ctx.lineWidth = 2;
                ctx.strokeStyle = 'red';
                for(let face of faces) {
                    face = face.boundingBox;
                    ctx.rect(face.x, face.y, face.width, face.height);
                    ctx.stroke();
                }

                image.src = canvas.toDataURL();
            })
            .catch((e) => {
                chat.notify("Error detectando las caras");
            });
    }

    return {
        detect
    }

})();
```

## Detección desde el chat

Para usarla, desde todos los botones con el ícono de la cara, llamaremos a la función `detect` al hacer click mediante este código que ya está en el archivo **chat-frontend.js**: `onclick="shape.detect('imageId')"`


## Listo!

Probemos lo que acabamos de hacer. Es fácil:

1. Mandar un mensaje con foto.
1. Hacer click en el botón de la cara.
1. Esperar que se actualice la imagen con el recuadro.

