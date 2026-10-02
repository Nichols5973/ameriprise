/*
 * Columns Spotlight block
 * Side-by-side feature spotlights, each: icon + heading + paragraph + CTA,
 * separated by a vertical divider on desktop.
 *
 * Authored structure: one row, N cells (typically 2). Each cell holds an icon image,
 * a heading, a paragraph and a button link. Extra rows are laid out the same way.
 */

const OPTION_CLASSES = [];

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const firstRow = block.firstElementChild;
  const colCount = firstRow ? firstRow.children.length : 0;
  block.classList.add(`columns-spotlight-${colCount}-cols`);

  [...block.children].forEach((row) => {
    row.classList.add('columns-spotlight-row');
    [...row.children].forEach((col) => {
      col.classList.add('columns-spotlight-item');

      // icon: the first picture in the cell, unwrapped from its <p>
      const picture = col.querySelector('picture');
      if (picture) {
        const holder = picture.parentElement && picture.parentElement !== col
          && picture.parentElement.tagName === 'P' && picture.parentElement.children.length === 1
          ? picture.parentElement : picture;
        const icon = document.createElement('div');
        icon.className = 'columns-spotlight-icon';
        holder.replaceWith(icon);
        icon.append(holder);
      }

      // group buttons at the bottom so CTAs align across columns
      const ctas = [...col.querySelectorAll('.button-container')];
      if (ctas.length) {
        const actions = document.createElement('div');
        actions.className = 'columns-spotlight-actions';
        ctas.forEach((cta) => actions.append(cta));
        col.append(actions);
      }

      if (!col.textContent.trim() && !col.querySelector('picture')) {
        col.classList.add('columns-spotlight-empty');
      }
    });
  });
}
