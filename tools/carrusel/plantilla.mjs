/**
 * Plantilla de carruseles de Instagram (1080×1350) con la identidad de Germán González.
 * Convierte un contenido.json en HTML. Ver tools/carrusel/README.md.
 *
 * Marcado en textos:  *texto* → verde lima · _texto_ → celeste · **texto** → negritas blancas · `texto` → código
 */

const escAttr = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Texto visible: escapa HTML y envuelve emojis (en la versión para Canva, los emojis van en la imagen de fondo). */
const esc = (s = '') => escAttr(s).replace(/\p{Extended_Pictographic}\uFE0F?/gu, (m) => `<span class="emo">${m}</span>`);
export const md = (s = '') =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b class="b">$1</b>')
    .replace(/\*(.+?)\*/g, '<span class="lime">$1</span>')
    .replace(/_(.+?)_/g, '<span class="sky">$1</span>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');

function ui(blocks = []) {
  const html = blocks.map((b) => {
    switch (b.tipo) {
      case 'titulo': return `<div class="ui__title">${esc(b.texto)}</div>`;
      case 'usuario': return `<div class="msg-user">${esc(b.texto)}</div>`;
      case 'ia': {
        const tabla = b.tabla
          ? `<table class="m"><thead><tr>${b.tabla.columnas.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${b.tabla.filas
              .map((f) => `<tr>${f.map((c) => {
                let t = String(c); const alerta = t.startsWith('!'); if (alerta) t = t.slice(1);
                const cls = t.endsWith('↓') ? 'up' : alerta || t.endsWith('↑') ? 'down' : '';
                return `<td class="${cls}">${esc(t)}</td>`;
              }).join('')}</tr>`).join('')}</tbody></table>`
          : '';
        return `<div class="ui__ia">${md(b.texto)}${tabla}</div>`;
      }
      case 'campo': return `<div class="fld${b.resaltar ? ' hl' : ''}"><label>${esc(b.label)}</label><div>${esc(b.valor)}</div></div>`;
      case 'boton': return `<div class="btnui">${esc(b.texto)}</div>`;
      case 'toggle': return `<div class="toggle-row"><span>${esc(b.texto)}</span><span class="tg"></span></div>`;
      default: throw new Error(`Bloque de UI desconocido: ${b.tipo}`);
    }
  }).join('');
  return `<div class="ui"><div class="ui__bar"><i></i><i></i><i></i></div><div class="ui__in">${html}</div></div>`;
}

function body(s) {
  const out = [];
  if (s.eyebrow) out.push(`<div class="eyebrow">${md(s.eyebrow)}</div>`);
  if (s.titulo) out.push(`<h2 style="font-size:${s.tamanoTitulo ?? 82}px">${md(s.titulo)}</h2>`);
  const parrafos = (v) => (Array.isArray(v) ? v : [v]).map((t) => `<p class="lead">${md(t)}</p>`).join('');
  if (s.texto) out.push(`<div class="paras">${parrafos(s.texto)}</div>`);
  if (s.lista) out.push(`<div class="checks">${s.lista.map((t) => `<div class="check"><span class="ck emo">✓</span><span>${md(t)}</span></div>`).join('')}</div>`);
  if (s.pasos) out.push(`<div class="steps">${s.pasos.map((p, i) => `<div class="step"><span class="num">${i + 1}</span><span>${md(p)}</span></div>`).join('')}</div>`);
  if (s.items) out.push(`<div class="prompts">${s.items.map((it) => `<div class="prompt"><span class="ic">${esc(it.icono ?? '•')}</span><div>${it.etiqueta ? `<small>${esc(it.etiqueta)}</small>` : ''}<span>${md(it.texto)}</span></div></div>`).join('')}</div>`);
  if (s.comparar) out.push(`<div class="compare">${s.comparar.map((c) => `<div class="cmp">${c.etiqueta ? `<small>${esc(c.etiqueta)}</small>` : ''}<div class="cmp__row cmp__row--no"><span class="cmp__ic emo">✕</span><span><b class="cmp__k">No vendas:</b> ${md(c.no)}</span></div><div class="cmp__row cmp__row--si"><span class="cmp__ic emo">✓</span><span><b class="cmp__k">Comunica:</b> ${md(c.si)}</span></div></div>`).join('')}</div>`);
  if (s.flujo) out.push(`<div class="flow">${s.flujo.map((f, i) => `${i ? '<span class="flow__arrow emo">↓</span>' : ''}<div class="flow__step"><span class="flow__num">${i + 1}</span><div><strong>${md(f.titulo)}</strong><span>${md(f.texto)}</span></div></div>`).join('')}</div>`);
  if (s.ui) out.push(`<div class="mt">${ui(s.ui)}</div>`);
  if (s.nota) out.push(`<p class="note">${esc(s.nota)}</p>`);
  if (s.textoFinal) out.push(`<div class="paras mt">${parrafos(s.textoFinal)}</div>`);
  if (s.cierre) out.push(`<p class="cierre">${md(s.cierre)}</p>`);
  if (s.dato) out.push(`<div class="dato"><span class="dato__cifra">${esc(s.dato.cifra)}</span><div><span class="dato__texto">${md(s.dato.texto)}</span>${s.dato.fuente ? `<small class="dato__fuente">${esc(s.dato.fuente)}</small>` : ''}</div></div>`);
  if (s.badge) out.push(`<span class="ok">${md(s.badge)}</span>`);
  if (s.alerta) out.push(`<div class="warn"><span class="ic emo">⚠️</span><span>${md(s.alerta)}</span></div>`);
  return out.join('\n');
}

function slide(s, i, total, meta, fondoUrl) {
  const n = i + 1;
  const alt = n % 2 === 0;
  const dots = Array.from({ length: total }, (_, k) => `<i${k === i ? ' class="on"' : ''}></i>`).join('');
  const last = n === total;
  const foot = `<div class="foot"><span>${esc(last ? meta.urlFinal ?? meta.url : meta.url)}</span><div class="dots">${dots}</div><span class="${last ? '' : 'next'}">${esc(last ? meta.autor : s.desliza ?? 'Desliza →')}</span></div>`;
  const top = `<div class="top"><img src="assets/logo-blanco.png" alt=""><span class="pill">${esc(s.pill ?? '')}</span></div>`;
  const bg = fondoUrl ? `<div class="bg${s.fondoOscuro ? ' bg--fuerte' : ''}" style="background-image:url('${fondoUrl}');background-position:${escAttr(s.fondoPosicion ?? 'center')}"></div>` : '';
  const cls = `slide${alt ? ' slide--alt' : ''}${fondoUrl ? ' has-bg' : ''}`;
  if (s.layout === 'foto') return slideFoto(s, n, last, meta, fondoUrl);
  let inner;
  switch (s.layout) {
    case 'portada': {
      const d = s.diagrama;
      inner = `<div class="body">
        ${s.eyebrow ? `<div class="eyebrow">${md(s.eyebrow)}</div>` : ''}
        <h1 style="font-size:${s.tamanoTitulo ?? 132}px">${md(s.titulo)}</h1>
        ${s.texto ? `<p class="lead" style="margin-top:44px">${md(s.texto)}</p>` : ''}
        ${d ? `<div class="connect"><div class="node node--a">${esc(d.de)}</div><div class="wire" data-label="${escAttr(d.etiqueta ?? '')}"></div><div class="node node--b">${esc(d.a)}</div></div>` : ''}
      </div>`;
      break;
    }
    case 'frase':
      inner = `<div class="body" style="margin-top:150px"><p class="display" style="font-size:${s.tamanoTitulo ?? 104}px">${md(s.titulo)}</p>${s.alerta ? `<div class="warn"><span class="ic emo">⚠️</span><span>${md(s.alerta)}</span></div>` : ''}</div>`;
      break;
    case 'cta':
      inner = `<div class="body" style="margin-top:${s.previo ? 90 : 150}px">${s.previo ? `<p class="display previo">${md(s.previo)}</p>` : ''}<p class="display" style="font-size:96px">${md(s.antes ?? 'Comenta')}</p><div><span class="ads">${esc(s.palabra)}</span></div><p class="display" style="font-size:66px;line-height:1.12">${md(s.despues ?? '')}</p></div>`;
      break;
    case 'contenido':
      inner = `<div class="body${s.grande ? ' body--lg' : ''}" style="margin-top:90px">${body(s)}</div>`;
      break;
    default:
      throw new Error(`Lámina ${n}: layout desconocido "${s.layout}" (usa portada | contenido | frase | cta)`);
  }
  return `<section class="${cls}" id="s${n}">${bg}${top}${inner}${foot}</section>`;
}

/**
 * Lámina con foto a sangre (portada y penúltima). Estilo de las portadas de Germán:
 * título Poppins Black arriba, subtítulo o etiquetas abajo, pie «@usuario · Desliza ->».
 */
function slideFoto(s, n, last, meta, fondoUrl) {
  if (!fondoUrl) throw new Error(`Lámina ${n}: el layout "foto" necesita "fondo" (la foto)`);
  const etiquetas = (s.etiquetas ?? []).map((e) => `<span class="fx-tag fx-tag--${e.color === 'lima' ? 'lima' : 'azul'}">${md(e.texto)}</span>`).join('');
  const abajo = s.texto || etiquetas
    ? `<div class="fx-bottom">${s.texto ? `<p class="fx-sub">${md(s.texto)}</p>` : ''}${etiquetas ? `<div class="fx-tags">${etiquetas}</div>` : ''}</div>`
    : '';
  const cls = `slide slide--foto${s.tituloOscuro ? ' fx-oscuro' : ''}${s.sinDegradado ? ' fx-limpio' : ''}`;
  return `<section class="${cls}" id="s${n}">
    <div class="fx-photo" style="background-image:url('${fondoUrl}');background-position:${escAttr(s.fondoPosicion ?? 'center')}"></div>
    <h1 class="fx-title" style="font-size:${s.tamanoTitulo ?? 112}px">${md(s.titulo ?? '')}</h1>
    ${abajo}
    <div class="fx-foot"><span>${esc(meta.usuario ?? '@germangleza')}</span><span>${last ? '' : esc(s.desliza ?? 'Desliza ->')}</span></div>
  </section>`;
}

/** @param {object} data contenido.json · @param {(file: string) => string} resolveFondo ruta → URL */
export function renderCarrusel(data, resolveFondo = (f) => f) {
  const meta = { url: 'soygermangonzalez.com', autor: 'Germán González', ...data.meta };
  const total = data.laminas.length;
  const slides = data.laminas.map((s, i) => slide(s, i, total, meta, s.fondo ? resolveFondo(s.fondo) : '')).join('\n');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escAttr(data.titulo ?? 'Carrusel')}</title>
<link rel="stylesheet" href="estilos.css"></head><body>${slides}</body></html>`;
}
