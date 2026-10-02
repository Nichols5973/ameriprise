/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Ameriprise site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html (https://www.ameriprise.com/).
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Elements that may legitimately be "empty" of text but still carry authorable content.
const KEEP_IF_CONTAINS = 'img, picture, video, table, hr, a, iframe, svg, input, button';

function removeEmptyWrappers(root) {
  // Walk deepest-first so nested empty wrappers collapse fully.
  const candidates = Array.from(root.querySelectorAll('div, span, section')).reverse();
  candidates.forEach((el) => {
    if (el === root || !el.isConnected) return;
    if (el.textContent.trim() !== '') return;
    if (el.querySelector(KEEP_IF_CONTAINS)) return;
    el.remove();
  });
}

function removeComments(root) {
  const doc = root.ownerDocument || document;
  const walker = doc.createTreeWalker(root, 128 /* NodeFilter.SHOW_COMMENT */);
  const comments = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach((c) => c.remove());
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / consent / feedback widgets that may interfere with block parsing.
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk', // <div id="onetrust-consent-sdk"> OneTrust cookie preference center
      '.QSIFeedbackButton', // <div class="QSIFeedbackButton"> Qualtrics feedback button
      '#ZN_37spM9cCMVfV1MV', // <div id="ZN_37spM9cCMVfV1MV"> Qualtrics intercept target
      '#app-store-banner-element', // <div id="app-store-banner-element"> app download banner
    ]);

    // Login widget (functional app, excluded from migration) sits next to the hero.
    // <div class="LoginClient u-sm-hidden u-md-hidden">
    WebImporter.DOMUtils.remove(element, ['div.LoginClient']);
  }

  if (hookName === TransformHook.afterTransform) {
    // Skip-links nav: <nav class="u-posAbsolute u-sizeFull"> containing <a id="skipToMainContent">
    const skipLink = element.querySelector('#skipToMainContent');
    if (skipLink) {
      const skipNav = skipLink.closest('nav');
      if (skipNav) skipNav.remove();
    }

    // Global chrome.
    WebImporter.DOMUtils.remove(element, [
      '#app-header', // <header id="app-header" class="header">
      'footer.footer', // <footer class="footer"> (contains ameriprise-footer + FooterDisclaimer)
      'nav.BackToTop', // <nav class="BackToTop ...">
    ]);

    // Tracking pixels (images) from captured DOM.
    WebImporter.DOMUtils.remove(element, [
      'img[src*="tags.w55c.net"]',
      'img[src*="crwdcntrl.net"]',
      'img[src*="adsrvr.org"]',
      'img[src*="bat.bing.com"]',
      'img[src*="facebook.com/tr"]',
      'img[src*="doubleclick.net"]',
      'img[width="1"][height="1"]',
    ]);

    // Analytics / sync iframes (all iframes on the page are non-authorable:
    // demdex, adsrvr, crwdcntrl, tmx_tags_iframe, ot-text-resize), plus scripts/styles/links.
    WebImporter.DOMUtils.remove(element, [
      'iframe',
      'script',
      'noscript',
      'style',
      'link',
      'template',
    ]);

    removeComments(element);

    // Strip inline event handlers / tracking attributes.
    element.querySelectorAll('[onclick], [data-track], [data-analytics]').forEach((el) => {
      el.removeAttribute('onclick');
      el.removeAttribute('data-track');
      el.removeAttribute('data-analytics');
    });

    removeEmptyWrappers(element);
  }
}
