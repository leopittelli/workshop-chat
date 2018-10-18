# 12. Final 🔚

Hemos recorrido una gran cantidad de APIs modernas. Algunas de ellas experimentales. Otras con bastante buen soporte.

Todas ellas son muestra de la evolución que está sufriendo la web y que no da señales de detenerse. Por el contrario, cada día crece más.

De la mano de las progressive web apps, las aplicaciones en la web son cada día más complejas y pueden llevar a cabo más y más cosas.

## Otras ideas
Si te quedaste con ganas de más, te invito a que agregues más funcionalidades y evolucionemos este workshop.

La aplicación completa está subida [acá](https://github.com/leopittelli/web-chat).

Si te interesa agregar alguna funcionalidad extra, te propongo que envíes un PR en ese repo y, luego, una explicación con otro PR a este repo.

Algunas ideas:
- WebRTC P2P. Conexión Peer-to-peer entre usuarios del chat para transferir archivos por ejemplo.
- Agregar más filtros de imagen o stickers o marcos usando `WebAssembly`.
- Push notifications para los mensajes.
- Background sync. Para reenviar los mensajes que quedaron en la base de datos al recuperar la conexión.
- Soporte Offline. Hacer que todo el chat funcione offline y se deshabiliten las partes para las que no sea posible.
- Más voces en Speech. Hacer uso de otras voces de la API de `SpeechSynthesis` y permitir elegirlas desde la UI. (El bonus track del módulo 6).

## Feedback
Se agradece completar la [encuesta](https://goo.gl/forms/SKgULXu5JPILZ9rr1) anónima para transmitir feedback con el objetivo de mejorar el workshop.

## Referencias
* Documentación y recursos para desarrolladores web. [MDN.](https://developer.mozilla.org/es/)
* Infaltable para chequear soporte en navegadores. [CanIUse](https://caniuse.com/)
* La UI del chat está basada en este [codepen.](https://codepen.io/blaketarter/pen/emWbYm)
* La base de websockets del chat tomada de este [post.](https://medium.com/@martin.sikora/node-js-websocket-simple-chat-tutorial-2def3a841b61)
* El filtro de `WebAssembly` es tomado de este [repo.](https://github.com/migerh/wasm-filter)
