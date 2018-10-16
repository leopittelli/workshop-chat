# Speech recognition 🗣️

Ya podemos enviar audios en nuestro chat pero, ¿Qué pasaría si quisiéramos enviar un texto a partir de nuestra voz?

En este módulo vamos a hacer uso de una funcionalidad experimental de algunos navegadores: La `Web Speech API`.

El funcionamiento será el siguiente:

1. Hacer click en el botón de enviar audio como texto.

    ![Botón](./images/send-speech.png "Botón")
    
    _Botón_
1. Hablar.
1. Aparecerá el texto interpretado como un nuevo mensaje de texto (gracias a la API de `Web Speech`).

La interfaz de `SpeechRecognition` de la `Web Speech API` es la interfaz que controla el servicio de reconocimiento de voz. También maneja el `SpeechRecognitionEvent` enviado por el servicio de reconocimiento.

## Implementación

Vamos a empezar a modificar el archivo **speech-recognition.js**. En esta primera parte del código:

### Definición

1. Accedemos a la API, actualmente solo disponible en chrome bajo el prefijo `webkit`.
1. Instanciamos la API.
1. Seteamos 3 opciones:
    - `continuous`: Controla si obtenemos resultados continuos o solo un resultado al final.
    - `interimResults`: Controla si obtenemos resultados intermedios o solo el resultado final. Los resultados intermedios no son finales.
    - `lang`: El idioma del reconocimiento actual. actual Si no se especifica, por defecto es el valor del atributo `lang` del tag `html` o el lenguaje del navegador.

```js
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'es-AR';
```

### Eventos de reconocimiento

Luego de las definiciones básicas debemos suscribirnos a los eventos de reconocimiento.

Los distintos eventos son:
- `onresult`: Se dispara cuando el servicio de reconocimiento devuelve un resultado. Se pudo reconocer satisfactoriamente una palabra o frase.
- `onend`: Se dispara cuando el servicio de reconocimiento se desconecta.
- `onerror`: Se dispara cuando ocurre algún error en el reconocimiento.

```js
recognition.onresult = function (event) {
    const results = event.results;
    // results es un array de SpeechRecognitionResults
    // cada uno es un array de SpeechRecognitionAlternatives
    let interimTranscript = '';
    for (let i = event.resultIndex; i !== results.length; ++i) {
        let result = results[i];
        // cuando el reconocimiento termina, se dispara un evento SpeechRecognitionEvent
        // con un resultado para el cual isFinal es true
        if (result.isFinal) {
            chat.send({ type: "speech", text: results[0][0].transcript});
            recognition.stop();
            startButton.classList.remove("animated");
        } else {
            interimTranscript += result[0].transcript;
        }
    }
};

recognition.onend = function () {
    started = false;
};

recognition.onerror = function (event) {
    started = false;
    console.log('Error: ' + event.error);
};
```

En nuestro caso, usamos `onend` y `onerror` para setear un flag y todo ocurre en el evento de `onresult` donde a partir de un `SpeechRecognitionResults` obtenemos la transcripción final, la enviamos como un mensaje de tipo `speech` y detenemos el servicio.

El evento de tipo `speech` agregará una aclaración delante del texto mostrando que ese mensaje surgió de una traducción automática.


### Interacción con el usuario

Nos falta agregar la última parte, donde a partir del click en el botón, iniciaremos o detendremos el servicio de reconocimiento

> Nota: Como dijimos antes, también detenemos el servicio automáticamente cuando el reconocimiento finaliza.

```js
const startButton = document.getElementById('speech');
let started = false;
startButton.onclick = function () {
    if (started) {
        recognition.stop();
        startButton.classList.remove("animated");
    } else {
        recognition.start();
        startButton.classList.add("animated");
    }
    started = !started;
};
```

## Listo!
Ahora toca probar lo que hicimos. Enviemos un audio y veamos si el servicio lo transcribe correctamente!

