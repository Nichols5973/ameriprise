/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-cutout. Base: hero.
 * Source: https://www.ameriprise.com/ (section.ComplexHero)
 * Generated: 2026-10-01
 *
 * UE model (blocks/hero-cutout/_hero-cutout.json): image (+ imageAlt collapsed), text (richtext)
 *   row 1: <!-- field:image --> cut-out portrait (.ComplexHero-featuredImage)
 *   row 2: <!-- field:text --> h1 + paragraph(s) + CTA link
 * The decorative background facet (.ComplexHero-background / .ComplexHero-topWrapperFacet)
 * is a design shape and is not authored.
 */
function hinted(document, field, nodes) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(n));
  return frag;
}

export default function parse(element, { document }) {
  // Cut-out portrait: featured image; fall back to any non-background image
  const image = element.querySelector('.ComplexHero-featuredImage img')
    || element.querySelector('[class*="featuredImage"] img')
    || [...element.querySelectorAll('.ComplexHero-topWrapper img')]
      .find((img) => !img.closest('.ComplexHero-topWrapperFacet, .ComplexHero-background'));

  const content = element.querySelector('.ComplexHero-content')
    || element.querySelector('.Content')
    || element;

  const heading = content.querySelector('h1, h2, h3');
  const paragraphs = [...content.querySelectorAll('p')].filter((p) => p.textContent.trim());
  const ctas = [...content.querySelectorAll('a.Button, a[class*="Button"]')];

  if (!heading && !paragraphs.length && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const textNodes = [];
  if (heading) textNodes.push(heading);
  paragraphs.forEach((p) => textNodes.push(p));
  ctas.forEach((a) => {
    const p = document.createElement('p');
    p.append(a);
    textNodes.push(p);
  });

  const cells = [];
  // image row (always present; empty cell carries no hint)
  cells.push([image ? hinted(document, 'image', [image]) : '']);
  // text row
  cells.push([textNodes.length ? hinted(document, 'text', textNodes) : '']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-cutout', cells });
  element.replaceWith(block);
}
