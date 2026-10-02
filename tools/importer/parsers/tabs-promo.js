/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-promo. Base: tabs.
 * Source: https://www.ameriprise.com/ (.HorizontalTabs)
 * Generated: 2026-10-01
 *
 * Container block (xwalk), item model tabs-promo-item. One row per tab, 4 cells:
 *   1. <!-- field:title -->            tab label (.HorizontalTabs-tabLabel, by index)
 *   2. <!-- field:content_heading -->  h3 heading
 *      <!-- field:content_richtext --> body paragraph(s)
 *   3. <!-- field:media_image -->      image / video poster
 *      <!-- field:media_video -->      Brightcove player link (optional)
 *   4. <!-- field:footer -->           footer line (optional)
 * content_headingType / media_imageAlt are collapsed (no hints).
 *
 * All panels are included, including those hidden on load (tabs 2 and 3).
 * Iterates .HorizontalTabs-panel (block-level wrappers); labels are read from the tab
 * buttons by index (the buttons are never iterated for content).
 *
 * Video: the source renders a Brightcove player in React; account and playlist/video ids
 * live in the component props, not in DOM attributes. They are read from the React fiber
 * (fallbacks: window.BRIGHTCOVE_ACC, poster URL path). When a playlist id is found the
 * playback API is queried (sync) for the concrete video id; otherwise the playlist player
 * URL is used.
 */

function hinted(document, field, nodes) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(n));
  return frag;
}

/** Walk the React fiber tree upwards collecting Brightcove-related props. */
function readVideoProps(node) {
  const found = {};
  if (!node) return found;
  const key = Object.keys(node).find((k) => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
  let fiber = key ? node[key] : null;
  for (let i = 0; fiber && i < 30; i += 1, fiber = fiber.return) {
    const p = fiber.memoizedProps;
    if (p && typeof p === 'object') {
      ['accountId', 'playerId', 'videoId', 'playlistId', 'policyKey'].forEach((k) => {
        if (!found[k] && p[k] && typeof p[k] === 'string') found[k] = p[k];
      });
    }
    if (found.accountId && (found.videoId || found.playlistId)) break;
  }
  return found;
}

const BC_ATTRS = {
  accountId: 'data-bc-account',
  playerId: 'data-bc-player',
  videoId: 'data-bc-video',
  playlistId: 'data-bc-playlist',
  policyKey: 'data-bc-policy',
};

// data-bc-* attributes are written by ../utils/brightcove-capture.js (import onLoad hook),
// because the importer rebuilds DOM nodes before parsers run, dropping the React fibers.
function readCapturedProps(container) {
  const found = {};
  if (!container) return found;
  Object.entries(BC_ATTRS).forEach(([k, attr]) => {
    if (container.getAttribute(attr)) found[k] = container.getAttribute(attr);
  });
  return found;
}

function resolveVideoUrl(document, panel, posterImg) {
  const win = document.defaultView || (typeof window !== 'undefined' ? window : {});
  const holder = panel.querySelector('.video-poster, .vc-video-container, .video-player');
  if (!holder) return null;
  let props = readCapturedProps(panel.querySelector('.vc-video-container'));
  if (!props.playlistId && !props.videoId) props = { ...readVideoProps(holder), ...props };
  let account = props.accountId || win.BRIGHTCOVE_ACC;
  if (!account && posterImg) {
    const m = (posterImg.getAttribute('src') || '').match(/\/v1\/static\/(\d+)\//);
    if (m) [, account] = m;
  }
  const player = props.playerId || 'default_default';
  let { videoId } = props;
  const { playlistId } = props;
  const policyKey = props.policyKey || win.BRIGHTCOVE_PK;

  // Resolve the concrete video from the playlist (single-video playlists on this site)
  if (!videoId && playlistId && account && policyKey && win.XMLHttpRequest) {
    try {
      const xhr = new win.XMLHttpRequest();
      xhr.open('GET', `https://edge.api.brightcove.com/playback/v1/accounts/${account}/playlists/${playlistId}`, false);
      xhr.setRequestHeader('Accept', `application/json;pk=${policyKey}`);
      xhr.send();
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        if (data && data.videos && data.videos.length === 1) videoId = data.videos[0].id;
      }
    } catch (e) { /* fall back to playlist URL */ }
  }

  if (!account) return null;
  if (videoId) return `https://players.brightcove.net/${account}/${player}/index.html?videoId=${videoId}`;
  if (playlistId) return `https://players.brightcove.net/${account}/${player}/index.html?playlistId=${playlistId}`;
  return null;
}

export default function parse(element, { document }) {
  const labels = [...element.querySelectorAll('.HorizontalTabs-tabLabel')]
    .map((l) => l.textContent.trim());
  const panels = [...element.querySelectorAll('.HorizontalTabs-panel')];

  if (!panels.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  panels.forEach((panel, index) => {
    const label = labels[index] || '';

    // --- content: text side of the Promo (the Promo-content without media)
    const contentPanels = [...panel.querySelectorAll('.Promo-content')];
    const mediaPanel = contentPanels.find((c) => c.querySelector('img, picture, .video-poster'));
    const textPanel = contentPanels.find((c) => c !== mediaPanel) || panel;

    const heading = textPanel.querySelector('h1, h2, h3, h4, h5, h6');
    const paras = [...textPanel.querySelectorAll('p')].filter((p) => p.textContent.trim());
    const ctas = [...textPanel.querySelectorAll('a.Button, a[class*="Button"]')]
      .filter((a) => !paras.some((p) => p.contains(a)));

    const contentCell = [];
    if (heading) {
      const h = document.createElement(heading.tagName.toLowerCase());
      h.textContent = heading.textContent.trim();
      contentCell.push(hinted(document, 'content_heading', [h]));
    }
    const rich = [...paras];
    ctas.forEach((a) => {
      const p = document.createElement('p');
      p.append(a);
      rich.push(p);
    });
    if (rich.length) contentCell.push(hinted(document, 'content_richtext', rich));

    // --- media: image / video poster + optional video link
    const mediaCell = [];
    const img = mediaPanel ? mediaPanel.querySelector('img') : null;
    let videoUrl = null;
    if (mediaPanel && mediaPanel.querySelector('.video-poster, .vc-video-container, .video-player')) {
      videoUrl = resolveVideoUrl(document, panel, img);
    }
    if (img) {
      if ((!img.alt || /^video poster$/i.test(img.alt)) && heading) img.alt = heading.textContent.trim();
      mediaCell.push(hinted(document, 'media_image', [img]));
    }
    if (videoUrl) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.textContent = videoUrl;
      mediaCell.push(hinted(document, 'media_video', [a]));
    }

    // --- footer line
    const footerCell = [];
    const footer = panel.querySelector(':scope > footer, footer');
    if (footer && footer.textContent.trim()) {
      const inner = footer.querySelector('.Disclaimer-text') || footer.querySelector('.Content > div') || footer.querySelector('.Content') || footer;
      const p = document.createElement('p');
      p.append(...inner.childNodes);
      footerCell.push(hinted(document, 'footer', [p]));
    }

    if (!label && !contentCell.length && !mediaCell.length) return;

    const titleCell = [];
    if (label) {
      const p = document.createElement('p');
      p.textContent = label;
      titleCell.push(hinted(document, 'title', [p]));
    }

    cells.push([
      titleCell.length ? titleCell : '',
      contentCell.length ? contentCell : '',
      mediaCell.length ? mediaCell : '',
      footerCell.length ? footerCell : '',
    ]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-promo', cells });
  element.replaceWith(block);
}
