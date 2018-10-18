# 8. Aplicando filtros a la imagen 📸 -> 🌆 -> 🌇

Es el turno del primero de los bonus track de la captura de imágenes.

Como están de moda las aplicaciones con filtros para imágenes, nuestro chat no puede ser menos y vamos a agregarle filtros.

La mécanica para esto será:

1. Hacer click en el botón de la cámara

    ![Botón](./images/capture-image.png "Botón")
    
    _Botón_
1. Aceptar el permiso de acceso a la cámara. (Si no lo aceptamos en el módulo anterior).
1. Se va a abrir el modal con nuestra imagen.
1. Hacer click en el botón de aplicar filtro.

    ![Botón para aplicar filtro](./images/apply-filter.png "Botón para aplicar filtro")
    
    _Botón para aplicar filtro_
1. El filtro se aplicará sobre la imagen.
1. Hacer click en el botón _Tomar foto_.
1. Aparecerá el nuevo mensaje con la foto con el filtro aplicado.

Por detrás, a lo que hicimos en el paso anterior para la imagen le estaremos agregando un filtro que modificará la imagen antes de mostrarla en el `canvas`.

La parte más interesante de todo esto es que para el filtro estaremos usando **`WebAssembly`**.

## Sobre WebAssembly

¿Pero qué es `WebAssembly`?

`WebAssembly` es un nuevo tipo de código que puede correr en navegadores modernos (actualmente con un muy buen [soporte](https://caniuse.com/#feat=wasm)).

Es un código de bajo nivel tipo `assembler` con un binario compacto que permite una excelente performance y que lenguajes como C o C++ puedan ser ejecutados en la web.

## Implementación

En este módulo nos toca editar el archivo **wasm.js**

Los conceptos necesarios como `async/await` fueron repasados en módulo 3. Te invito a leerlos si crees que te hace falta.

### Inicialización y código base

Como venimos haciendo hasta ahora, tenemos algunas referencias globales al módulo:
- `filterButton`: una referencia al botón que aplica los filtros.
- `wasmModule`: una referencia al módulo de `WebAssembly`.
- `filtering`: un flag que nos servirá para activar y desactivar el filtro.

```js
const filterButton = document.getElementById('apply-filter');
let wasmModule;
let filtering = false;
```

### Bindeando eventos

Lo primero que vamos a hacer es registrar un `event listener` para el clic en el botón que activará y desactivará el filtro.

Al activar y desactivar, la función `toggleFiltering` cambia el texto del botón y setea o elimina el filtro con los métodos que dejamos disponibles en el final del módulo anterior.

```js
filterButton.addEventListener('click', toggleFiltering, false);

function toggleFiltering(e) {
    filtering = !filtering;

    if (filtering) {
        filterButton.textContent = 'Cancelar filtro';
        captureImage.setFilter(filter);
    } else {
        filterButton.textContent = 'Aplicar filtro';
        captureImage.removeFilter();
    }

    e.preventDefault();
}
```

### Definición del filtro

El filtro en sí va a recibir la data de la imagen actual (la que entrega la cámara) y la va a transformar llamando a la función `outline_c` del módulo de `WebAssembly` que cargaremos a continuación.

El resto del código hace al manejo de memoria y la manera en la que nos comunicamos con el módulo de `WebAssembly` de ida y de vuelta.

```js
function filter(imageData) {
    const bufferPointerIn = 1024,
        {data, width, height} = imageData,
        bufferIn = new Uint8Array(wasmModule.memory.buffer, bufferPointerIn, width * height * 4),
        bufferPointerOut = 2048 + width * height * 4,
        bufferOut = new Uint8Array(wasmModule.memory.buffer, bufferPointerOut, width * height * 4);

    bufferIn.set(data);
    wasmModule.outline_c(bufferPointerIn, bufferPointerOut, width, height);
    data.set(bufferOut);
    return data;
}
```

### Cargando el módulo

Al cargar este módulo vamos a intentar cargar nuestro archivo `.wasm` que no es ni más ni menos que nuestro binario compilado y el encargado de aplicar el filtro. Si eso funciona, habilitaremos el botón en el modal.

Si te interesa saber cómo generarlo, te recomiendo este [link](https://webassembly.org/getting-started/developers-guide/) y este otro [link](http://kripken.github.io/emscripten-site/docs/getting_started/Tutorial.html).

> **Nota:** Puede no ser sencillo generar el binario. Por eso y, para evitar instalar muchas cosas que dependen de cada Sistema Operativo, vamos a evitar la compilación manual en este workshop.

```js
async function loadWasm() {
    const response = await fetch('/public/wasm-filter.wasm'),
        wasmFile = await response.arrayBuffer(),
        compiledModule = await WebAssembly.compile(wasmFile),
        wasmModule = await WebAssembly.instantiate(compiledModule, {
            env: {
                random: max => Math.floor(Math.random() * max),
                logInt: console.log
            }
        });

    return wasmModule.exports;
}

async function main() {
    wasmModule = await loadWasm();
    filterButton.style.display = 'inline-block';
}


main()
    .catch(console.error);
```

Si te estás preguntando de dónde salió el nombre de la función `outline_c` que usamos para aplicar el filtro, la respuesta la vas a encontrar en el código `C` original que generó el `.wasm` que estamos usando:

```C
unsigned int random(unsigned int max);

const int outline_kernel[10] = {
    -1, -1, -1,
    -1,  8, -1,
    -1, -1, -1,
    1
};

// Para forzar al compilador a reservar la memoria necesaria para el módulo
unsigned char buffer[640*480*4*6] = {0};


unsigned char clamp(int value, int scale)
{
    value /= scale;
    if (value < 0)
    {
        return 0;
    }
    if (value > 255)
    {
        return 255;
    }
    return (unsigned char)(value);
}

void applyKernel(unsigned char* buffer_in, unsigned char* buffer_out, int x, int y, unsigned int width, unsigned int height, const int kernel[10])
{
    int sum = 0;
    int kernelIndex = 0;

    for (int i = -1; i <= 1; ++i)
    {
        for (int k = -1; k <= 1; ++k)
        {
            int posX = x + k;
            int posY = y + i;
            if (posX >= 0 && posX < width && posY >= 0 && posY < height)
            {
                int index = posY * width + posX;
                sum += (int)buffer_in[index * 4] * (int)kernel[kernelIndex];
            }
            kernelIndex += 1;
        }
    }
    int index = y * width + x;
    unsigned char clampedSum = clamp(sum, kernel[9]);
    buffer_out[index * 4 + 0] = clampedSum;
    buffer_out[index * 4 + 1] = clampedSum;
    buffer_out[index * 4 + 2] = clampedSum;
    buffer_out[index * 4 + 3] = 255;
}

void outline_c(unsigned char* buffer_in, unsigned char* buffer_out, unsigned int width, unsigned int height)
{
    for (int y = 0; y < (int)height; ++y)
    {
        for (int x = 0; x < (int)width; ++x)
        {
            applyKernel(buffer_in, buffer_out, x, y, width, height, outline_kernel);
        }
    }
}
```

Como verás, allí está nuestra función `outline_c` que recibe 4 parámetros como nosotros usamos donde nosotros la estamos llamando.

## Listo!

Ahora si! Es el momento de probar si toda esta magia anduvo!

Clickeá en sacar una foto a ver si aparece el nuevo botón y aplica el filtro!

## Próximo modulo
Avanzar al [módulo 9 - Detectando caras en las fotos 🤦‍♀️ 🤦‍♂️](../09-shape-detection)
