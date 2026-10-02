/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-icon. Base: cards.
 * Source: https://www.ameriprise.com/ (section.Categories .Categories-blocks)
 * Generated: 2026-10-01 (library convention: cards, 2 cells per row)
 *
 * Container block (xwalk), item model cards-icon-item: image (+ imageAlt collapsed), text.
 * One row per item: [ <!-- field:image --> icon | <!-- field:text --> bold label (+ body) ].
 * Iterates the inner .Categories-block wrappers (stable block-level element).
 * Icons are sprite <svg><use href="...#id"></svg> references converted into standalone
 * SVG images (data URI).
 */

function hinted(document, field, nodes) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(n));
  return frag;
}

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

function iconColor(document, svg) {
  const win = document.defaultView;
  if (!win || !win.getComputedStyle) return null;
  const cs = win.getComputedStyle(svg);
  if (cs.stroke && cs.stroke !== 'none') return cs.stroke;
  if (cs.fill && cs.fill !== 'none') return cs.fill;
  return null;
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
    const color = iconColor(document, node);
    const body = symbol.innerHTML;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${color ? ` fill="${color}"` : ''}>${body}</svg>`;
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

export default function parse(element, { document }) {
  let items = [...element.querySelectorAll('.Categories-block')];
  if (!items.length) items = [...element.querySelectorAll(':scope > div')];
  items = items.filter((it) => it.textContent.trim() || it.querySelector('svg, img'));

  if (!items.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  items.forEach((item) => {
    const icon = toIconImage(document, item.querySelector('svg.BrandIcon, svg, img'));

    const textNodes = [];
    const labelEl = item.querySelector('.Categories-heading [class*="Type-"], .Categories-heading, h2, h3, h4');
    const label = labelEl ? labelEl.textContent.trim() : '';
    if (label) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = label;
      p.append(strong);
      textNodes.push(p);
    }
    const body = item.querySelector('.Categories-content');
    if (body && body.textContent.trim()) {
      const paras = [...body.querySelectorAll('p')];
      if (paras.length) paras.forEach((p) => textNodes.push(p));
      else {
        const p = document.createElement('p');
        p.append(...body.childNodes);
        textNodes.push(p);
      }
    }

    cells.push([
      icon ? hinted(document, 'image', [icon]) : '',
      textNodes.length ? hinted(document, 'text', textNodes) : '',
    ]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-icon', cells });
  element.replaceWith(block);
}
