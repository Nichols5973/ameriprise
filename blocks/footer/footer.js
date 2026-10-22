/*
 * Footer block — reads footer.plain.html (one <div> per band) and decorates it.
 * All copy, links and images come from the fragment; this file only adds structure.
 */

import { getMetadata } from '../../scripts/aem.js';

/**
 * Candidate footer locations, in order: `footer` metadata, /content/footer (local preview),
 * then each ancestor folder of the page, e.g. /language-masters/en/footer,
 * /language-masters/footer, /footer (published AEM sites keep footer under the language tree).
 * @returns {string[]} paths without extension
 */
function footerCandidates() {
  const meta = getMetadata('footer');
  const paths = meta ? [new URL(meta, window.location).pathname.replace(/(\.plain)?\.html$/, '')] : [];
  paths.push('/content/footer');
  const segments = window.location.pathname.replace(/\.html$/, '').split('/').filter(Boolean);
  for (let i = segments.length; i >= 0; i -= 1) {
    paths.push(`/${[...segments.slice(0, i), 'footer'].join('/')}`);
  }
  return [...new Set(paths)];
}

/**
 * Fetches the footer fragment from the first candidate location that responds.
 * @returns {Promise<HTMLElement|null>}
 */
async function fetchFooterFragment() {
  let resp;
  // eslint-disable-next-line no-restricted-syntax
  for (const path of footerCandidates()) {
    // eslint-disable-next-line no-await-in-loop
    resp = await fetch(`${path}.plain.html`);
    if (resp.ok) break;
  }
  if (!resp?.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  // resolve relative image paths against the fragment location, not the page
  container.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
  });
  return container;
}

const onlyChild = (el, selector) => el.children.length === 1
  && el.firstElementChild.matches(selector)
  && el.textContent.trim() === el.firstElementChild.textContent.trim();

/** Turns a heading that holds a link + the paragraph after it into one linked card. */
function buildLinkCard(heading) {
  const link = heading.querySelector('a');
  const text = heading.nextElementSibling;
  const card = document.createElement('a');
  card.href = link.href;
  card.className = 'footer-card';
  const title = document.createElement('span');
  title.className = 'footer-card-title';
  title.append(...link.childNodes);
  card.append(title);
  if (text && text.tagName === 'P') {
    const body = document.createElement('span');
    body.className = 'footer-card-text';
    body.append(...text.childNodes);
    card.append(body);
    text.remove();
  }
  const col = document.createElement('div');
  col.className = 'footer-column';
  col.append(card);
  heading.replaceWith(col);
}

function decorateSection(section, index, total) {
  section.className = `footer-section footer-section-${index + 1}`;
  if (index === total - 1) section.classList.add('footer-legal');

  section.querySelectorAll('p').forEach((p) => {
    if (onlyChild(p, 'img, picture')) p.className = 'footer-brand';
    else if (onlyChild(p, 'a')) {
      p.className = 'footer-cta';
      p.firstElementChild.classList.add('button');
    } else if (!p.querySelector('a')) p.className = 'footer-text';
  });

  section.querySelectorAll('ul').forEach((ul) => {
    const iconOnly = [...ul.children].every((li) => li.querySelector('a') && onlyChild(li.querySelector('a'), 'img, picture'));
    ul.className = iconOnly ? 'footer-social' : 'footer-list';
    if (!iconOnly && !section.classList.contains('footer-legal')) {
      const col = document.createElement('div');
      col.className = 'footer-column';
      ul.replaceWith(col);
      col.append(ul);
    }
  });

  section.querySelectorAll('h1 > a, h2 > a, h3 > a, h4 > a, h5 > a, h6 > a').forEach((a) => buildLinkCard(a.parentElement));

  // a list link that duplicates a card's destination is the compact (mobile) variant
  section.querySelectorAll('.footer-card').forEach((card) => {
    section.querySelectorAll('.footer-list a').forEach((a) => {
      if (new URL(a.href).pathname === new URL(card.href).pathname) a.closest('li').classList.add('footer-mobile-only');
    });
    card.closest('.footer-column').classList.add('footer-desktop-only');
  });

  const inner = document.createElement('div');
  inner.className = 'footer-inner';
  inner.append(...section.childNodes);
  section.append(inner);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooterFragment();
  if (!fragment) return;
  block.textContent = '';
  const sections = [...fragment.children];
  sections.forEach((section, i) => decorateSection(section, i, sections.length));
  block.append(...sections);
}
