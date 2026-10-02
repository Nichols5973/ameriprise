/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-promo. Base: columns.
 * Source: https://www.ameriprise.com/ (section.Promo-redesign)
 * Generated: 2026-10-01
 *
 * Columns block (xwalk): no field hints. One row, two cells: text | image.
 * Cell order follows the visual layout (the block decorates image-first as image-left):
 *   - image right: image wrapper has Promo-borderRadiusRight / no u-flexOrderFirst
 *   - image left:  image wrapper has u-flexOrderFirst (desktop) or Promo-borderRadiusLeft
 * Text cell: eyebrow paragraph? + heading + paragraph(s)? + CTA link(s)?
 */
export default function parse(element, { document }) {
  const panels = [...element.querySelectorAll('.Promo-content')];
  const imagePanel = panels.find((p) => p.querySelector('img, picture'))
    || element.querySelector('.Promo-image')?.closest('div');
  const textPanel = panels.find((p) => p !== imagePanel && p.textContent.trim())
    || [...element.querySelectorAll('div')].find((d) => d.querySelector('h1, h2, h3, h4') && !d.querySelector('img'));

  const textNodes = [];
  if (textPanel) {
    const heading = textPanel.querySelector('h1, h2, h3, h4, h5, h6');
    const ctas = [...textPanel.querySelectorAll('a.Button, a[class*="Button"]')];
    // eyebrow + body paragraphs, in document order
    const paras = [...textPanel.querySelectorAll('p')].filter((p) => p.textContent.trim() && !ctas.some((a) => p.contains(a) && p.textContent.trim() === a.textContent.trim()));
    const eyebrows = heading ? paras.filter((p) => p.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING) : [];
    const body = paras.filter((p) => !eyebrows.includes(p));
    eyebrows.forEach((p) => textNodes.push(p));
    if (heading) textNodes.push(heading);
    body.forEach((p) => textNodes.push(p));
    ctas.forEach((a) => {
      const p = document.createElement('p');
      p.append(a);
      textNodes.push(p);
    });
  }

  const image = imagePanel ? imagePanel.querySelector('img') : null;

  if (!textNodes.length && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const imageCell = image ? [image] : '';
  const textCell = textNodes.length ? textNodes : '';

  let imageLeft = false;
  if (imagePanel) {
    const cls = imagePanel.classList;
    imageLeft = cls.contains('u-flexOrderFirst') || cls.contains('Promo-borderRadiusLeft');
  }

  const cells = [imageLeft ? [imageCell, textCell] : [textCell, imageCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (promo)', cells });
  element.replaceWith(block);
}
