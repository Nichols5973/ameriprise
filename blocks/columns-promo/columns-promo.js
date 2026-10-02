/*
 * Columns Promo block
 * Rounded split promo panel: text (eyebrow? + heading + paragraph? + CTA?)
 * beside a half-width image.
 *
 * Authored structure: one row, two cells. One cell holds the image, the other the text.
 * The image side follows authoring order (image first = image left, image second = image right).
 * A short paragraph placed before the heading in the text cell is treated as an eyebrow.
 *
 * Options (block classes): `stone` (default) | `purple-light` — panel background colour.
 * When no option is authored, image-left panels get `purple-light` and image-right
 * panels get `stone`.
 */

const OPTION_CLASSES = ['stone', 'purple-light'];

function isImageOnly(cell) {
  if (!cell.querySelector('picture')) return false;
  const clone = cell.cloneNode(true);
  clone.querySelectorAll('picture').forEach((p) => p.remove());
  return !clone.textContent.trim();
}

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  [...block.children].forEach((row) => {
    row.classList.add('columns-promo-row');
    const cells = [...row.children];

    cells.forEach((cell, index) => {
      if (isImageOnly(cell)) {
        cell.classList.add('columns-promo-media');
        if (index === 0 && cells.length > 1) row.classList.add('columns-promo-image-left');
        else row.classList.add('columns-promo-image-right');
        return;
      }

      cell.classList.add('columns-promo-content');
      // eyebrow: paragraph(s) before the first heading that are not buttons
      const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        let prev = heading.previousElementSibling;
        while (prev) {
          if (prev.tagName === 'P' && !prev.classList.contains('button-container')) {
            prev.classList.add('columns-promo-eyebrow');
          }
          prev = prev.previousElementSibling;
        }
      }

      const ctas = [...cell.querySelectorAll('.button-container')];
      if (ctas.length) {
        const actions = document.createElement('div');
        actions.className = 'columns-promo-actions';
        ctas.forEach((cta) => actions.append(cta));
        cell.append(actions);
      }

      // statement panel: the text cell holds only heading(s) (e.g. award callout)
      const children = [...cell.children];
      if (children.length && children.every((el) => /^H[1-6]$/.test(el.tagName))) {
        row.classList.add('columns-promo-statement');
      }
    });

    if (!row.querySelector('.columns-promo-media')) row.classList.add('columns-promo-no-media');
  });

  // panel colour fallback when no option class is authored
  if (!active.length) {
    const firstRow = block.querySelector('.columns-promo-row');
    const imageLeft = firstRow && firstRow.classList.contains('columns-promo-image-left');
    block.classList.add(imageLeft ? 'purple-light' : 'stone');
  }
}
