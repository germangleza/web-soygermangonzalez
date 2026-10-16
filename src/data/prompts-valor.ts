/**
 * Recurso gratuito «3 prompts para vender beneficios, no características» (Builder Lab).
 * Ruta: /builder-lab/recursos/3-prompts-valor
 * Única fuente del copy: la vista y el botón de copiar leen el mismo texto (no duplicar).
 * Los prompts se copian TAL CUAL (con saltos de línea); no editar sin validar con Germán.
 */

export const RESOURCE_ID = '3-prompts-valor';
export const RESOURCE_PATH = `/builder-lab/recursos/${RESOURCE_ID}`;

export const PAGE = {
  eyebrow: 'Recurso gratuito · Builder Lab',
  title: '3 prompts para vender beneficios, no características',
  subtitle: 'Convierte lo que hace tu producto en razones por las que tus clientes deberían elegirlo.',
  intro:
    'Un producto puede tener muchas características, pero lo que conecta con el cliente es lo que puede lograr gracias a ellas. Estos tres prompts te ayudan a identificar beneficios reales, construir tu propuesta de valor y convertirla en mensajes de venta.',
  instruction: 'Úsalos en una misma conversación de ChatGPT y en este orden:',
  steps: ['Beneficios', 'Propuesta de valor', 'Mensajes comerciales'],
  closingTitle: 'Ahora ponlos a trabajar',
  closingText:
    'Completa los datos de tu negocio en el primer prompt. Después usa el resultado para desarrollar el segundo y el tercero, sin salir de la conversación. Ajusta los mensajes a lo que tu producto realmente puede cumplir.',
  note: 'La IA puede ayudarte a explorar mejores mensajes, pero valida los beneficios, diferenciadores y promesas antes de publicarlos.',
  footer: 'Por Germán González · Business Builder — Builder Lab: Exploramos. Probamos. Construimos.',
  seoTitle: '3 prompts para vender beneficios, no características | Builder Lab',
  seoDescription:
    'Recurso gratuito: 3 prompts de ChatGPT para convertir las características de tu producto en beneficios, propuesta de valor y mensajes para anuncios y tu web.',
} as const;

export interface ValuePrompt {
  number: 1 | 2 | 3;
  label: string;
  title: string;
  description: string;
  content: string;
}

export const VALUE_PROMPTS: ValuePrompt[] = [
  {
    number: 1,
    label: 'Beneficios',
    title: 'Descubre qué compra realmente tu cliente',
    description: 'Convierte características en beneficios concretos y emocionales.',
    content: `Actúa como un estratega de marketing. Mi producto o servicio es [PRODUCTO] y mi cliente ideal es [CLIENTE].

Estas son sus principales características: [CARACTERÍSTICAS].

Convierte cada característica en un beneficio concreto para mi cliente. Explica qué problema resuelve, qué resultado permite conseguir y qué beneficio emocional puede generar.

Preséntalo en una tabla y evita beneficios genéricos o promesas que no podamos demostrar.`,
  },
  {
    number: 2,
    label: 'Propuesta de valor',
    title: 'Construye una propuesta de valor que conecte',
    description: 'Explica con claridad por qué alguien debería elegirte.',
    content: `Usando los beneficios identificados, crea 5 propuestas de valor para mi producto.

Cada propuesta debe comunicar:
- A quién ayudo.
- Qué problema resuelvo.
- Qué beneficio principal obtiene.
- Por qué mi solución es diferente.

Escríbelas en lenguaje sencillo, sin tecnicismos ni frases como "somos líderes" o "la mejor calidad".

Recomienda la más convincente y explica por qué.`,
  },
  {
    number: 3,
    label: 'Mensajes comerciales',
    title: 'Transforma los beneficios en publicidad',
    description: 'Lleva tu propuesta de valor a Reels, anuncios y tu página web.',
    content: `Actúa como un copywriter especializado en publicidad.

Con la propuesta de valor que elegimos, crea:

1. Cinco hooks para Reels de Instagram.
2. Tres anuncios cortos para Meta Ads.
3. Tres titulares para mi página web.

En todos, comunica el beneficio que obtiene el cliente antes de mencionar características del producto.

Utiliza un tono natural, específico y convincente. Evita exageraciones y promesas no verificables.`,
  },
];
