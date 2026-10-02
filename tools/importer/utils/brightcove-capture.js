/* eslint-disable */
/**
 * Copies Brightcove props (account / player / video / playlist / policy key) from the
 * live React fibers of .HorizontalTabs video containers onto data-bc-* attributes.
 *
 * Call from the import script's onLoad hook: html2md rebuilds DOM nodes before parsers
 * run, which drops the fibers. The tabs-promo parser reads these attributes.
 */
const BC_ATTRS = {
  accountId: 'data-bc-account',
  playerId: 'data-bc-player',
  videoId: 'data-bc-video',
  playlistId: 'data-bc-playlist',
  policyKey: 'data-bc-policy',
};

function readFiberProps(node) {
  const found = {};
  if (!node) return found;
  const key = Object.keys(node).find((k) => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
  let fiber = key ? node[key] : null;
  for (let i = 0; fiber && i < 30; i += 1, fiber = fiber.return) {
    const p = fiber.memoizedProps;
    if (p && typeof p === 'object') {
      Object.keys(BC_ATTRS).forEach((k) => {
        if (!found[k] && p[k] && typeof p[k] === 'string') found[k] = p[k];
      });
    }
    if (found.accountId && (found.videoId || found.playlistId)) break;
  }
  return found;
}

export default function captureVideoProps(document) {
  document.querySelectorAll('.HorizontalTabs .vc-video-container').forEach((c) => {
    const props = { ...readFiberProps(c), ...readFiberProps(c.querySelector('.video-poster')) };
    Object.entries(BC_ATTRS).forEach(([k, attr]) => {
      if (props[k]) c.setAttribute(attr, props[k]);
    });
  });
}
