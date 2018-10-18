# 6. Speech synthesis 👂

Hace un rato que venimos enviando mensajes y, al lado de cada uno, aparece un ícono del que todavía no hemos hablado.

Llegó el momento de descubrir de qué se trata.

![Botón misterioso](./images/speech-synthesis.png "Botón misterioso")
    
_Botón misterioso_

Nuestro botón misterioso nos va a permitir escuchar un mensaje de texto, haciendo uso nuevamente de la `Web Speech API`.

En esta oportunidad, a través de su interfaz `SpeechSynthesis`. Nuevamente se trata de una API con un [soporte](https://caniuse.com/#feat=speech-synthesis) limitado aunque bastante más decente que la `SpeechRecognition`.

El funcionamiento será el siguiente:

1. Al lado de todos los mensajes de texto aparecerá el botón que acabamos de ver.
1. Al hacer click en él, escucharemos el texto del mensaje.


## Implementación

Vamos a modificar el archivo **speech-synthesis.js**. Es un módulo muy simple así que vamos con todo el código a la vez.

Lo que vamos a hacer es:

1. Accedemos a la API desde `window.speechSynthesis`.
1. Definimos una función `speak` que recibe un texto y donde creamos un objeto `SpeechSynthesisUtterance`
1. Devolvemos la función `speak` para usarla desde afuera.

```js
const synthesis = (function() {

    const synth = window.speechSynthesis;
    
    function speak(text) {
        const utterThis = new SpeechSynthesisUtterance(text);
        synth.speak(utterThis);
    }

    return {
        speak
    }

})();
```

Para usarla, desde todos los botones llamamos a la API al hacer click mediante este código que ya está en el archivo **chat-frontend.js**: `onclick="synthesis.speak('Texto a leer')"`

### SpeechSynthesisUtterance

El objeto `SpeechSynthesisUtterance` que creamos anteriormente requiere una mención especial por ser donde ocurre toda la magia.

Un `SpeechSynthesisUtterance` representa un pedido de speech. Tiene todo el contenido que queremos que lea el servicio de speech y toda la información necesaria para indicar la forma de lectura (idioma, pitch y volumen).

Las propiedades son:
- `lang`: idioma. Si no está seteado, usa el idioma declarado en el tag de `html` o el idioma por defecto del browser.
- `pitch`: El valor del tono a usar. Por defecto es 1 y varía entre 0 y 2.
- `rate`: La velocidad a la cuando hablará. Por defecto es 1. Varía a de 0.1 a 10 siendo porcentajes (ejemplo: 0.5 será la mitad de rápido y 2 el doble de rápido de lo normal).
- `text`: El texto a leer.
- `voice`: La voz con la cual se leerá el mensaje.
- `volume`: El volumen al cual se leerá el mensaje. Siendo 0 el mínimo, 1 el máximo y 0.5 el valor por defecto.

## Listo!
Ahora toca probar lo que hicimos. Enviemos un mensaje de texto, hagamos click en el botón que aparece a su lado y escuchemos el audio correspondiente!

## Bonus track

![Aún hay más!!](./images/aunhaymas.jpg "Aún hay más!!")
    
_Aún hay más!!_

Una feature interesante es la posibilidad de cambiar la voz de nuestro `Utterance`. El siguiente código permite recorrer todas las voces disponibles para el idioma español en alguna de sus variantes.

```js
const synth = window.speechSynthesis;

voices = synth.getVoices().filter(v => v.lang.startsWith('es'));

for(let i = 0; i < voices.length ; i++) {
    let voice = voices[i].name + ' (' + voices[i].lang + ')';

    if(voices[i].default) {
        voice += ' -- DEFAULT';
    }

    console.log(voice)
}
```

Haciendo uso de ese código, te invito a agregar un selector de voces en la UI y permitir al usuario cambiar la voz que quiere usar antes de que un mensaje sea leído.

> Nota: No te olvides de cambiar la `voice` en el objeto `SpeechSynthesisUtterance` con: `utterThis.voice = selectedVoice` antes de pasárselo al `synth.speak`.

## Próximo modulo
Avanzar al [módulo 7 - Enviando imágenes 🤳️](../07-image)
