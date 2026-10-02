/*
 * Hero Cutout block
 * Page-intro hero: heading + paragraph + CTA on one side, a cut-out portrait on the other.
 *
 * Authored structure (xwalk model "hero-cutout", or DA table):
 *   row 1: image (cut-out portrait, optional)
 *   row 2: rich text (h1 + paragraph + CTA link)
 * Rows may be in either order; cells without a picture are treated as text.
 */

const OPTION_CLASSES = [];

export default function decorate(block) {
  // collected once so future options compose cleanly (see block-options.md §2)
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const rows = [...block.children];
  const content = document.createElement('div');
  content.className = 'hero-cutout-content';
  const media = document.createElement('div');
  media.className = 'hero-cutout-media';

  rows.forEach((row) => {
    [...row.children].forEach((cell) => {
      const picture = cell.querySelector('picture');
      const hasText = [...cell.children].some((el) => !el.querySelector('picture') && el.tagName !== 'PICTURE' && el.textContent.trim());
      if (picture && !hasText) {
        media.append(...cell.childNodes);
      } else if (cell.textContent.trim() || cell.children.length) {
        // pictures embedded alongside text go to the media column
        cell.querySelectorAll('picture').forEach((pic) => {
          const wrapper = pic.parentElement && pic.parentElement.tagName === 'P' && pic.parentElement.children.length === 1
            ? pic.parentElement : pic;
          media.append(wrapper);
        });
        content.append(...cell.childNodes);
      }
    });
    // keep the row element (UE instrumentation lives on it) but empty
    row.remove();
  });

  // CTA: authored links that were turned into buttons are the hero's actions
  const ctas = content.querySelectorAll('.button-container');
  if (ctas.length) {
    const actions = document.createElement('div');
    actions.className = 'hero-cutout-actions';
    ctas.forEach((cta) => actions.append(cta));
    content.append(actions);
  }

  const inner = document.createElement('div');
  inner.className = 'hero-cutout-inner';
  inner.append(content);
  if (media.children.length) {
    inner.append(media);
  } else {
    block.classList.add('hero-cutout-no-media');
  }
  block.append(inner);
}
