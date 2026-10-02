/*
 * Tabs Promo block
 * Horizontal tabs; each panel is a split text | media promo with an optional footer line.
 *
 * Authored structure (collection): one row per tab.
 *   cell 1: tab label
 *   cell 2: content - heading + rich text
 *   cell 3: media  - image (video poster) and/or an optional video link
 *                    (Brightcove, YouTube, Vimeo or .mp4)
 *   cell 4: footer - optional line shown below the panel (e.g. "Read more insights" link)
 * Tolerant of missing cells: pictures and video links found in the content cell are moved
 * to the media column.
 */

const OPTION_CLASSES = [];

let blockCount = 0;

function isVideoUrl(href) {
  if (!href) return false;
  return /(players\.brightcove\.net|bcove\.video|brightcove\.com|youtube\.com|youtu\.be|youtube-nocookie\.com|vimeo\.com)/i.test(href)
    || /\.(mp4|webm|mov)(\?|#|$)/i.test(href);
}

function getEmbedUrl(href) {
  const url = new URL(href, window.location.href);
  const host = url.hostname;
  if (host.includes('youtu')) {
    const id = host.includes('youtu.be') ? url.pathname.slice(1) : (url.searchParams.get('v') || url.pathname.split('/').pop());
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  }
  if (host.includes('vimeo.com') && !host.includes('player.')) {
    return `https://player.vimeo.com/video/${url.pathname.split('/').filter(Boolean).pop()}?autoplay=1`;
  }
  if (host.includes('players.brightcove.net')) {
    if (!url.searchParams.has('autoplay')) url.searchParams.set('autoplay', 'true');
    return url.toString();
  }
  return url.toString();
}

function buildPlayer(href, title) {
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(href)) {
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.src = href;
    return video;
  }
  const iframe = document.createElement('iframe');
  iframe.src = getEmbedUrl(href);
  iframe.title = title || 'Video';
  iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture');
  iframe.loading = 'lazy';
  return iframe;
}

/**
 * Turns a media cell holding an optional poster picture and a video link into a
 * click-to-play video. Without a video link the picture is left as a plain image.
 */
function decorateMedia(media, title) {
  const link = [...media.querySelectorAll('a')].find((a) => isVideoUrl(a.href));
  if (!link) return;

  const { href } = link;
  const linkHolder = link.closest('.button-container') || link.closest('p') || link;
  const picture = media.querySelector('picture');

  const wrapper = document.createElement('div');
  wrapper.className = 'tabs-promo-video';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tabs-promo-video-poster';
  button.setAttribute('aria-label', `Play video${title ? `: ${title}` : ''}`);
  if (picture) {
    const holder = picture.parentElement && picture.parentElement.tagName === 'P'
      ? picture.parentElement : picture;
    button.append(picture);
    if (holder !== picture) holder.remove();
  }
  const play = document.createElement('span');
  play.className = 'tabs-promo-video-play';
  play.setAttribute('aria-hidden', 'true');
  button.append(play);

  button.addEventListener('click', () => {
    wrapper.replaceChildren(buildPlayer(href, title));
    wrapper.classList.add('tabs-promo-video-playing');
  });

  wrapper.append(button);
  // keep the authored link (with its UE instrumentation) in the DOM but hidden
  linkHolder.classList.add('tabs-promo-video-source');
  media.prepend(wrapper);
}

function activate(block, index, focus = false) {
  const tabs = block.querySelectorAll('.tabs-promo-tab');
  const panels = block.querySelectorAll('.tabs-promo-panel');
  tabs.forEach((tab, i) => {
    const selected = i === index;
    tab.setAttribute('aria-selected', selected);
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  panels.forEach((panel, i) => {
    panel.setAttribute('aria-hidden', i !== index);
    // stop any playing video in panels that are being hidden
    if (i !== index) {
      panel.querySelectorAll('.tabs-promo-video-playing video').forEach((v) => v.pause());
    }
  });
}

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  blockCount += 1;

  const tablist = document.createElement('div');
  tablist.className = 'tabs-promo-list';
  tablist.setAttribute('role', 'tablist');

  const panels = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const [titleCell, contentCell, mediaCell, footerCell] = cells;
    const label = titleCell ? titleCell.textContent.trim() : '';
    if (!label) {
      row.classList.add('tabs-promo-empty');
      return;
    }
    const index = panels.length;
    const id = `tabs-promo-${blockCount}-${index + 1}`;

    // panel = the authored row, so UE instrumentation stays on the item
    const panel = row;
    panel.className = 'tabs-promo-panel';
    panel.id = `${id}-panel`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `${id}-tab`);

    titleCell.classList.add('tabs-promo-title');

    const content = contentCell || document.createElement('div');
    content.classList.add('tabs-promo-content');
    const media = mediaCell || document.createElement('div');
    media.classList.add('tabs-promo-media');

    // tolerate pictures / video links authored inside the content cell
    content.querySelectorAll('picture').forEach((pic) => {
      const holder = pic.parentElement && pic.parentElement.tagName === 'P'
        && pic.parentElement.children.length === 1 ? pic.parentElement : pic;
      media.append(holder);
    });
    content.querySelectorAll('a').forEach((a) => {
      if (!isVideoUrl(a.href)) return;
      const holder = a.closest('.button-container') || (a.parentElement.tagName === 'P' && a.parentElement.textContent.trim() === a.textContent.trim() ? a.parentElement : a);
      media.append(holder);
    });

    const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
    decorateMedia(media, heading ? heading.textContent.trim() : label);

    const inner = document.createElement('div');
    inner.className = 'tabs-promo-panel-inner';
    inner.append(content);
    if (media.children.length) inner.append(media);
    else inner.classList.add('tabs-promo-no-media');

    panel.replaceChildren(titleCell, inner);
    if (footerCell && (footerCell.textContent.trim() || footerCell.children.length)) {
      footerCell.classList.add('tabs-promo-footer');
      panel.append(footerCell);
    }
    cells.slice(4).forEach((extra) => panel.append(extra));

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-promo-tab';
    tab.id = `${id}-tab`;
    tab.textContent = label;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    tab.addEventListener('click', () => activate(block, index));
    tablist.append(tab);
    panels.push(panel);
  });

  tablist.addEventListener('keydown', (e) => {
    const tabs = [...tablist.querySelectorAll('.tabs-promo-tab')];
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    let next = null;
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    if (next !== null) {
      e.preventDefault();
      activate(block, next, true);
    }
  });

  // tab buttons are built from text only, so they carry no UE instrumentation
  block.prepend(tablist);
  if (panels.length) activate(block, 0);
}
