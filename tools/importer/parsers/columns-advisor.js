/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-advisor. Base: columns.
 * Source: https://www.ameriprise.com/ (#advisor-locator)
 * Generated: 2026-10-01 (library convention: columns)
 *
 * Columns block (xwalk): no field hints. One row, two cells:
 *   cell 1: icon image + h3 heading (.DynamicAdvisor-heading)
 *   cell 2: paragraphs in order - search label, appointment link line, BrokerCheck disclosure
 * NOT authored: ZIP input, floating label, "Find my location" and "Search" buttons
 * (rendered by the block JS), and the decorative facet background image.
 * The icon is a sprite <svg><use href="...#handshake"></svg>, converted into a standalone
 * SVG image (data URI).
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
  const headingWrap = element.querySelector('.DynamicAdvisor-heading')
    || element.querySelector('h2, h3')?.parentElement;
  const searchForm = element.querySelector('.DynamicAdvisor-searchForm');
  const disclosureWrap = element.querySelector('.DynamicAdvisor-disclosure');

  // --- cell 1: icon + heading
  const introCell = [];
  if (headingWrap) {
    const icon = toIconImage(document, headingWrap.querySelector('svg.BrandIcon, svg, img'));
    if (icon) {
      const p = document.createElement('p');
      p.append(icon);
      introCell.push(p);
    }
    const heading = headingWrap.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) introCell.push(heading);
  }

  // --- cell 2: search label, appointment line, disclosure
  const searchCell = [];
  if (searchForm) {
    // first label is the search prompt; the floating "Enter 5-digit ZIP Code" label sits
    // inside .Input-group and is excluded
    const label = [...searchForm.querySelectorAll('label')].find((l) => !l.closest('.Input-group') && l.textContent.trim());
    if (label) {
      const p = document.createElement('p');
      p.textContent = label.textContent.trim();
      searchCell.push(p);
    }
    [...searchForm.querySelectorAll('p')]
      .filter((p) => p.textContent.trim() && !p.closest('.Input-group'))
      .forEach((p) => searchCell.push(p));
  }
  if (disclosureWrap) {
    const paras = [...disclosureWrap.querySelectorAll('p')].filter((p) => p.textContent.trim());
    if (paras.length) paras.forEach((p) => searchCell.push(p));
    else if (disclosureWrap.textContent.trim()) {
      const p = document.createElement('p');
      p.append(...disclosureWrap.childNodes);
      searchCell.push(p);
    }
  }

  if (!introCell.length && !searchCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[introCell.length ? introCell : '', searchCell.length ? searchCell : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-advisor', cells });
  element.replaceWith(block);
}
