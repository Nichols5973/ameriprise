/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-spotlight. Base: columns.
 * Source: https://www.ameriprise.com/ (.Spotlight-component .Spotlight > .Grid)
 * Generated: 2026-10-01
 *
 * Columns block (xwalk): no field hints. One row, one cell per spotlight item.
 * Each cell: icon image + h3 heading + paragraph + CTA link.
 *
 * Icons on the source are <svg class="BrandIcon"><use href="...icon-sprite.svg#id"></svg>
 * sprite references; they are converted into standalone SVG images (data URI) so the
 * icon survives the import as an authorable image.
 */

function resolveSpriteSymbol(document, href) {
  const [spritePath, id] = href.split('#');
  if (!id) return null;
  const inline = spritePath ? null : document.getElementById(id);
  if (inline) return inline;
  const win = document.defaultView || (typeof window !== 'undefined' ? window : null);
  if (!win || !win.XMLHttpRequest) return null;
  win.__amprSpriteCache = win.__amprSpriteCache || {};
  const cache = win.__amprSpriteCache;
  if (!(spritePath in cache)) {
    cache[spritePath] = null;
    const candidates = [spritePath];
    try { candidates.push(new URL(spritePath, 'https://www.ameriprise.com').href); } catch (e) { /* ignore */ }
    for (const url of candidates) {
      try {
        const xhr = new win.XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.send();
        if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText.includes('<symbol')) {
          cache[spritePath] = new win.DOMParser().parseFromString(xhr.responseText, 'image/svg+xml');
          break;
        }
      } catch (e) { /* try next */ }
    }
  }
  const sprite = cache[spritePath];
  return sprite ? sprite.getElementById(id) : null;
}

/** Presentation attributes (fill + stroke) matching how the source renders the icon. */
function iconPaint(document, svg) {
  const win = document.defaultView;
  if (!win || !win.getComputedStyle) return '';
  const cs = win.getComputedStyle(svg);
  let attrs = '';
  if (cs.fill && cs.fill !== 'none') attrs += ` fill="${cs.fill}"`;
  if (cs.stroke && cs.stroke !== 'none') {
    attrs += ` stroke="${cs.stroke}"`;
    if (cs.strokeWidth) attrs += ` stroke-width="${cs.strokeWidth.replace('px', '')}"`;
  }
  return attrs;
}

/** Convert an inline sprite <svg> (or keep an existing <img>) into an <img>. */
function toIconImage(document, node) {
  if (!node) return null;
  if (node.tagName && node.tagName.toLowerCase() === 'img') return node;
  const use = node.querySelector('use');
  const href = use && (use.getAttribute('href') || use.getAttribute('xlink:href'));
  if (!href) return null;
  const id = href.split('#')[1] || '';
  const symbol = resolveSpriteSymbol(document, href);
  const img = document.createElement('img');
  img.alt = node.getAttribute('aria-label') || '';
  if (symbol) {
    const viewBox = symbol.getAttribute('viewBox') || '0 0 100 100';
    const paint = iconPaint(document, node);
    const body = symbol.innerHTML;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${paint}>${body}</svg>`;
    const b64 = btoa(unescape(encodeURIComponent(svg)));
    img.src = `data:image/svg+xml;base64,${b64}`;
  } else {
    let abs = href;
    try { abs = new URL(href, 'https://www.ameriprise.com').href; } catch (e) { /* keep */ }
    img.src = abs;
  }
  if (id) img.setAttribute('data-icon', id);
  return img;
}

function buildColumn(document, item) {
  const nodes = [];
  const iconSrc = item.querySelector(':scope > svg, :scope > img')
    || item.querySelector('svg.BrandIcon')
    || item.querySelector('img');
  const icon = toIconImage(document, iconSrc);
  if (icon) {
    const p = document.createElement('p');
    p.append(icon);
    nodes.push(p);
  }
  const heading = item.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) nodes.push(heading);
  [...item.querySelectorAll('p')].filter((p) => p.textContent.trim()).forEach((p) => nodes.push(p));
  item.querySelectorAll('a.Button, a[class*="Button"]').forEach((a) => {
    const p = document.createElement('p');
    p.append(a);
    nodes.push(p);
  });
  return nodes;
}

export default function parse(element, { document }) {
  // Each spotlight is a direct child div of .Grid (block-level wrapper, safe to iterate)
  let items = [...element.querySelectorAll(':scope > div')];
  if (!items.length) items = [...element.querySelectorAll('[class*="size1of2"]')];
  items = items.filter((it) => it.textContent.trim());

  if (!items.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const row = items.map((item) => buildColumn(document, item));
  const cells = [row];

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (spotlight)', cells });
  element.replaceWith(block);
}
