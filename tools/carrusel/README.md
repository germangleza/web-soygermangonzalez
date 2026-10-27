# Plantilla de carruseles (Instagram 1080×1350)

Un carrusel = una carpeta en `docs/carrusel/<slug>/` con un `contenido.json` (y, si quieres, imágenes de fondo).

```bash
npm run carrusel -- <slug>
```

Genera en esa carpeta:
- `slide-1.png … slide-N.png` → listas para publicar.
- `carrusel.pdf` → texto real (no imagen): se importa a Canva como diseño **editable**.

Requisito local (una sola vez): `npm i -D playwright && npx playwright install chromium`.

## Layouts

| `layout` | Para qué | Campos |
|---|---|---|
| `portada` | Lámina 1 | `pill`, `eyebrow`, `titulo`, `texto`, `diagrama` {de, a, etiqueta}, `fondo`, `fondoPosicion`, `fondoOscuro` |
| `contenido` | Explicar, pasos, listas, maquetas | `pill`, `eyebrow`, `tamanoEyebrow`, `titulo`, `tamanoTitulo`, `texto`, `pasos[]`, `items[]` {icono, etiqueta, texto}, `ui[]`, `nota`, `badge`, `alerta`, `cierre`, `tamanoCierre`, `grande` (todo más grande), `centrar` (tarjetas centradas entre título y cierre), `imagen` {src, posicion} (foto que llena el espacio libre), `logo` {src, alto} (logo arriba del título), `vertical` (todo el bloque centrado) |
| `frase` | Payoff / idea grande | `pill`, `titulo`, `alerta` |
| `cta` | Cierre | `pill`, `previo`, `antes`, `palabra`, `despues` |
| `foto` | **Portada** y **penúltima** con foto a sangre | `fondo` (la foto), `fondoPosicion`, `eyebrow`, `titulo`, `tamanoTitulo`, `texto` (subtítulo abajo), `tamanoTexto` **o** `etiquetas[{texto, color: azul\|lima}]`, `tituloOscuro` (foto clara), `sinDegradado`, `tituloAbajo` (título y texto juntos abajo), `degradadoFuerte` (fotos claras o con mucho detalle), `recorte` {src, ancho, derecha} (PNG sin fondo abajo a la derecha), `logo` {src, ancho, x, y} (centro del logo en px), `conPie` (muestra @usuario y Desliza aunque haya `sinMarco`) |

`meta.sinMarco: true` quita el logo, la etiqueta y el pie de todas las láminas.

`ui[]` (maqueta de chat o pantalla): `{tipo: "usuario"|"ia"|"titulo"|"campo"|"boton"|"toggle", texto, label, valor, resaltar, tabla: {columnas, filas}}`. Las maquetas son ilustrativas: márcalas con `nota`.

**Marcado en textos:** `*verde lima*`, `_celeste_`, `**negritas**`, `` `código` ``, `\n` = salto de línea.

## Láminas con foto (portadas)

Desde octubre 2026 la **portada** y la **penúltima** lámina usan foto de Germán a sangre (layout `foto`):
- Título Poppins Black arriba: blanco, `_azul_` y `*lima*` para resaltar.
- Abajo, un subtítulo blanco (`texto`) o etiquetas redondeadas azul y lima (`etiquetas`).
- Pie: `@germangleza` a la izquierda y `Desliza ->` a la derecha. El usuario sale de `meta.usuario`.

Por carrusel llegan 1 o 2 fotos: **foto 1 → portada**, **foto 2 → penúltima** (si solo hay una, se usa en ambas con otro encuadre). Ejemplo: `docs/carrusel/_plantilla-foto/`.

## Imagen de fondo en la portada (estilo anterior)

1. Copia la imagen (JPG/PNG, idealmente vertical ≥1080×1350) a la carpeta del carrusel.
2. En la portada: `"fondo": "mi-foto.jpg"`. Opcional: `"fondoPosicion": "70% center"` para encuadrar y `"fondoOscuro": true` si la foto es muy clara.
3. Se aplica un degradado azul de marca para que el texto siempre se lea.

Ejemplo completo con todos los layouts y fondo: `docs/carrusel/_plantilla/`.

## Canva

- **Editar un carrusel:** importa su `carrusel.pdf` a Canva (Crear diseño → Importar archivo). Los textos quedan editables.
- **Plantilla en Canva:** importa `docs/carrusel/_plantilla/carrusel.pdf` y, con Canva Pro/Teams, conviértelo en *Plantilla de marca* (Compartir → Plantilla de marca). Duplícala para cada tip nuevo.
- La tipografía de títulos es Inter Display (libre). Si licencias Nimbus Sans, se cambia en `tools/carrusel/estilos.css` y en Canva.
