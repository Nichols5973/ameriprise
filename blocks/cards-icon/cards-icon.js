/*
 * Cards Icon block
 * A row of small highlight items, each: line icon + bold label.
 *
 * Authored structure (collection): one row per item.
 *   cell 1: icon image
 *   cell 2: label text (rich text)
 */
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const OPTION_CLASSES = [];

function optimize(img) {
  // only re-encode same-origin images; external/DM assets are left untouched
  try {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || url.pathname.endsWith('.svg')) return;
    const picture = createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]);
    moveInstrumentation(img, picture.querySelector('img'));
    img.closest('picture').replaceWith(picture);
  } catch (e) {
    // keep the authored picture if the URL can't be parsed
  }
}

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div) => {
      const onlyPicture = div.querySelector('picture')
        && !div.textContent.trim();
      div.className = onlyPicture ? 'cards-icon-card-image' : 'cards-icon-card-body';
    });

    // skip completely empty items
    if (!li.textContent.trim() && !li.querySelector('picture')) return;
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach(optimize);
  block.replaceChildren(ul);
}
