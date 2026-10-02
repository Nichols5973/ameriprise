/*
 * Header block — Ameriprise navigation.
 * Content comes from nav.plain.html (4 sections: brand, tools, sections, search).
 * This file only reads that content, builds interactive controls and wires behavior.
 */

const DESKTOP = window.matchMedia('(width >= 900px)');

/**
 * Fetches the nav fragment. Metadata-independent dual fetch:
 * /content/nav.plain.html (local preview) then /nav.plain.html (DA/EDS).
 * @returns {Promise<HTMLElement|null>} container holding the nav sections
 */
async function fetchNavFragment() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  // resolve relative image paths against the fragment location, not the page
  container.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
  });
  return container;
}

function normalizePath(pathname) {
  const p = pathname.replace(/\.html$/, '').replace(/^\/content(?=\/)/, '').replace(/\/index$/, '').replace(/\/$/, '');
  return p || '/';
}

function isCurrentPage(link) {
  try {
    const url = new URL(link.href, window.location.href);
    return normalizePath(url.pathname) === normalizePath(window.location.pathname);
  } catch (e) {
    return false;
  }
}

/**
 * Normalizes authoring differences in the fragment: AEM wraps list-item content in
 * <p> and splits a link holding an image + text into two links with the same href.
 */
function normalizeFragment(container) {
  container.querySelectorAll('li > p').forEach((p) => p.replaceWith(...p.childNodes));
  container.querySelectorAll('li').forEach((li) => {
    const links = [...li.querySelectorAll(':scope > a')];
    links.slice(1).forEach((a) => {
      const first = links[0];
      if (a.getAttribute('href') !== first.getAttribute('href')) return;
      first.append(...a.childNodes);
      a.remove();
    });
  });
}

function closeAll(scope, except) {
  scope.querySelectorAll('[aria-expanded="true"]').forEach((el) => {
    if (el !== except && !el.contains(except)) el.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Wires one dropdown level: every <li> holding a nested <ul> becomes a
 * hover/focus-opened menu on desktop and a tap-to-expand item on mobile.
 */
function decorateMenuLevel(ul, level) {
  ul.classList.add(`nav-level-${level}`);
  if (level === 1) ul.classList.add('nav-list');
  [...ul.children].forEach((li) => {
    const link = li.querySelector(':scope > a');
    const sub = li.querySelector(':scope > ul');
    li.classList.add('nav-item');
    if (level === 1 && link) link.classList.add('nav-trigger');
    if (link && isCurrentPage(link)) li.classList.add('is-active');
    if (!sub || !link) return;

    li.classList.add('nav-has-children');
    link.setAttribute('aria-haspopup', 'true');
    link.setAttribute('aria-expanded', 'false');

    const panel = document.createElement('div');
    panel.className = `nav-panel nav-panel-${level + 1}`;
    sub.replaceWith(panel);
    panel.append(sub);
    decorateMenuLevel(sub, level + 1);

    // mobile: chevron button expands, label navigates
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-expand';
    toggle.setAttribute('aria-label', `Show ${link.textContent.trim()} menu`);
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const open = link.getAttribute('aria-expanded') === 'true';
      closeAll(ul, null);
      link.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
    link.after(toggle);

    let closeTimer;
    const open = () => {
      if (!DESKTOP.matches) return;
      clearTimeout(closeTimer);
      [...ul.children].forEach((sib) => {
        if (sib !== li) sib.querySelector(':scope > a[aria-expanded]')?.setAttribute('aria-expanded', 'false');
      });
      link.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
      if (!DESKTOP.matches) return;
      closeTimer = setTimeout(() => {
        link.setAttribute('aria-expanded', 'false');
        closeAll(panel, null);
      }, 120);
    };
    li.addEventListener('mouseenter', open);
    li.addEventListener('mouseleave', close);
    li.addEventListener('focusin', open);
    li.addEventListener('focusout', (e) => {
      if (!li.contains(e.relatedTarget)) close();
    });
  });
}

function decorateBrand(section) {
  section.className = 'nav-brand';
  const link = section.querySelector('a');
  const picture = section.querySelector('picture') || section.querySelector('img');
  if (!link) return;
  // logo is authored as an image next to the home link; put it inside the link
  if (picture && !link.contains(picture)) {
    const holder = picture.closest('p');
    link.replaceChildren(picture);
    if (holder && holder !== link.closest('p') && !holder.textContent.trim() && !holder.querySelector('img')) holder.remove();
  }
  link.setAttribute('aria-label', section.querySelector('img')?.alt || link.textContent.trim() || 'Home');
}

function decorateTools(section) {
  section.className = 'nav-tools';
  const list = section.querySelector('ul');
  if (list) list.className = 'nav-utility';
  section.querySelectorAll('p').forEach((p) => {
    const a = p.querySelector('a');
    if (!a) return;
    a.classList.add('button');
    if (p.querySelector('strong')) a.classList.add('primary');
    else if (p.querySelector('em')) a.classList.add('secondary');
    p.className = 'button-container';
    p.replaceChildren(a);
  });
}

/**
 * Builds the search toggle + panel. The fragment provides the panel heading and a
 * link whose URL is the search endpoint; the query parameter name is read from it.
 */
function buildSearch(section, nav) {
  const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
  const link = section.querySelector('a');
  if (!link) return { toggle: null, panel: null };
  const url = new URL(link.href, window.location.href);
  const param = [...url.searchParams.keys()][0] || 'q';
  const label = link.textContent.trim() || 'Search';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-search-toggle';
  toggle.textContent = label;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'nav-search-panel');

  const panel = document.createElement('div');
  panel.className = 'nav-search-panel';
  panel.id = 'nav-search-panel';
  panel.hidden = true;

  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.action = `${url.origin}${url.pathname}`;
  form.method = 'get';
  form.setAttribute('role', 'search');

  const inputId = 'nav-search-input';
  const lab = document.createElement('label');
  lab.htmlFor = inputId;
  lab.textContent = heading ? heading.textContent.trim() : label;

  const field = document.createElement('div');
  field.className = 'nav-search-field';
  const input = document.createElement('input');
  input.type = 'search';
  input.id = inputId;
  input.name = param;
  input.autocomplete = 'off';
  field.append(input);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'button primary';
  submit.textContent = label;

  const row = document.createElement('div');
  row.className = 'nav-search-row';
  row.append(field, submit);
  form.append(lab, row);

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nav-search-close';
  close.setAttribute('aria-label', 'Close search');

  const overlay = document.createElement('div');
  overlay.className = 'nav-search-overlay';
  overlay.hidden = true;

  panel.append(form, close);

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.hidden = !open;
    overlay.hidden = !open;
    nav.classList.toggle('search-open', open);
    if (open) {
      closeAll(nav.querySelector('.nav-sections'), null);
      input.focus();
    }
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  close.addEventListener('click', () => { setOpen(false); toggle.focus(); });
  overlay.addEventListener('click', () => setOpen(false));
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { setOpen(false); toggle.focus(); }
  });

  return {
    toggle, panel, overlay, setOpen,
  };
}

function buildHamburger(nav) {
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-controls', 'nav');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', 'Open navigation');
  btn.innerHTML = '<span class="nav-hamburger-icon"></span>';
  btn.addEventListener('click', () => {
    const open = nav.getAttribute('aria-expanded') !== 'true';
    nav.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    document.body.style.overflowY = open ? 'hidden' : '';
  });
  hamburger.append(btn);
  return hamburger;
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNavFragment();
  if (!fragment) return;
  normalizeFragment(fragment);
  block.textContent = '';

  const [brand, tools, sections, search] = [...fragment.children];

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');
  nav.setAttribute('aria-expanded', 'false');

  const topBar = document.createElement('div');
  topBar.className = 'nav-top';
  const menuBar = document.createElement('div');
  menuBar.className = 'nav-menu';

  if (brand) decorateBrand(brand);
  if (tools) decorateTools(tools);
  if (sections) {
    sections.className = 'nav-sections';
    const list = sections.querySelector('ul');
    if (list) decorateMenuLevel(list, 1);
  }
  const searchUi = search ? buildSearch(search, nav) : {};

  const hamburger = buildHamburger(nav);
  const topInner = document.createElement('div');
  topInner.className = 'nav-inner';
  topInner.append(...[brand, hamburger, tools].filter(Boolean));
  topBar.append(topInner);

  const menuInner = document.createElement('div');
  menuInner.className = 'nav-inner';
  menuInner.append(...[sections, searchUi.toggle].filter(Boolean));
  menuBar.append(menuInner);

  nav.append(topBar, menuBar, ...[searchUi.panel, searchUi.overlay].filter(Boolean));

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (nav.getAttribute('aria-expanded') === 'true') hamburger.querySelector('button').click();
    if (sections) closeAll(sections, null);
  });

  // reset state when crossing the desktop/mobile breakpoint
  DESKTOP.addEventListener('change', () => {
    nav.setAttribute('aria-expanded', 'false');
    hamburger.querySelector('button').setAttribute('aria-expanded', 'false');
    document.body.style.overflowY = '';
    if (sections) closeAll(sections, null);
    if (searchUi.setOpen) searchUi.setOpen(false);
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(nav);
  block.append(wrapper);
}
