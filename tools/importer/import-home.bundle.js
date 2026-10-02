/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-cutout.js
  function hinted(document2, field, nodes) {
    const frag = document2.createDocumentFragment();
    frag.appendChild(document2.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function parse(element, { document: document2 }) {
    const image = element.querySelector(".ComplexHero-featuredImage img") || element.querySelector('[class*="featuredImage"] img') || [...element.querySelectorAll(".ComplexHero-topWrapper img")].find((img) => !img.closest(".ComplexHero-topWrapperFacet, .ComplexHero-background"));
    const content = element.querySelector(".ComplexHero-content") || element.querySelector(".Content") || element;
    const heading = content.querySelector("h1, h2, h3");
    const paragraphs = [...content.querySelectorAll("p")].filter((p) => p.textContent.trim());
    const ctas = [...content.querySelectorAll('a.Button, a[class*="Button"]')];
    if (!heading && !paragraphs.length && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const textNodes = [];
    if (heading) textNodes.push(heading);
    paragraphs.forEach((p) => textNodes.push(p));
    ctas.forEach((a) => {
      const p = document2.createElement("p");
      p.append(a);
      textNodes.push(p);
    });
    const cells = [];
    cells.push([image ? hinted(document2, "image", [image]) : ""]);
    cells.push([textNodes.length ? hinted(document2, "text", textNodes) : ""]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-cutout", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-spotlight.js
  function resolveSpriteSymbol(document2, href) {
    const [spritePath, id] = href.split("#");
    if (!id) return null;
    const inline = spritePath ? null : document2.getElementById(id);
    if (inline) return inline;
    const win = document2.defaultView || (typeof window !== "undefined" ? window : null);
    if (!win || !win.XMLHttpRequest) return null;
    win.__amprSpriteCache = win.__amprSpriteCache || {};
    const cache = win.__amprSpriteCache;
    if (!(spritePath in cache)) {
      cache[spritePath] = null;
      const candidates = [spritePath];
      try {
        candidates.push(new URL(spritePath, "https://www.ameriprise.com").href);
      } catch (e) {
      }
      for (const url of candidates) {
        try {
          const xhr = new win.XMLHttpRequest();
          xhr.open("GET", url, false);
          xhr.send();
          if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText.includes("<symbol")) {
            cache[spritePath] = new win.DOMParser().parseFromString(xhr.responseText, "image/svg+xml");
            break;
          }
        } catch (e) {
        }
      }
    }
    const sprite = cache[spritePath];
    return sprite ? sprite.getElementById(id) : null;
  }
  function iconPaint(document2, svg) {
    const win = document2.defaultView;
    if (!win || !win.getComputedStyle) return "";
    const cs = win.getComputedStyle(svg);
    let attrs = "";
    if (cs.fill && cs.fill !== "none") attrs += ` fill="${cs.fill}"`;
    if (cs.stroke && cs.stroke !== "none") {
      attrs += ` stroke="${cs.stroke}"`;
      if (cs.strokeWidth) attrs += ` stroke-width="${cs.strokeWidth.replace("px", "")}"`;
    }
    return attrs;
  }
  function toIconImage(document2, node) {
    if (!node) return null;
    if (node.tagName && node.tagName.toLowerCase() === "img") return node;
    const use = node.querySelector("use");
    const href = use && (use.getAttribute("href") || use.getAttribute("xlink:href"));
    if (!href) return null;
    const id = href.split("#")[1] || "";
    const symbol = resolveSpriteSymbol(document2, href);
    const img = document2.createElement("img");
    img.alt = node.getAttribute("aria-label") || "";
    if (symbol) {
      const viewBox = symbol.getAttribute("viewBox") || "0 0 100 100";
      const paint = iconPaint(document2, node);
      const body = symbol.innerHTML;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${paint}>${body}</svg>`;
      const b64 = btoa(unescape(encodeURIComponent(svg)));
      img.src = `data:image/svg+xml;base64,${b64}`;
    } else {
      let abs = href;
      try {
        abs = new URL(href, "https://www.ameriprise.com").href;
      } catch (e) {
      }
      img.src = abs;
    }
    if (id) img.setAttribute("data-icon", id);
    return img;
  }
  function buildColumn(document2, item) {
    const nodes = [];
    const iconSrc = item.querySelector(":scope > svg, :scope > img") || item.querySelector("svg.BrandIcon") || item.querySelector("img");
    const icon = toIconImage(document2, iconSrc);
    if (icon) {
      const p = document2.createElement("p");
      p.append(icon);
      nodes.push(p);
    }
    const heading = item.querySelector("h1, h2, h3, h4, h5, h6");
    if (heading) nodes.push(heading);
    [...item.querySelectorAll("p")].filter((p) => p.textContent.trim()).forEach((p) => nodes.push(p));
    item.querySelectorAll('a.Button, a[class*="Button"]').forEach((a) => {
      const p = document2.createElement("p");
      p.append(a);
      nodes.push(p);
    });
    return nodes;
  }
  function parse2(element, { document: document2 }) {
    let items = [...element.querySelectorAll(":scope > div")];
    if (!items.length) items = [...element.querySelectorAll('[class*="size1of2"]')];
    items = items.filter((it) => it.textContent.trim());
    if (!items.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const row = items.map((item) => buildColumn(document2, item));
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-spotlight", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-promo.js
  function parse3(element, { document: document2 }) {
    var _a;
    const panels = [...element.querySelectorAll(".Promo-content")];
    const imagePanel = panels.find((p) => p.querySelector("img, picture")) || ((_a = element.querySelector(".Promo-image")) == null ? void 0 : _a.closest("div"));
    const textPanel = panels.find((p) => p !== imagePanel && p.textContent.trim()) || [...element.querySelectorAll("div")].find((d) => d.querySelector("h1, h2, h3, h4") && !d.querySelector("img"));
    const textNodes = [];
    if (textPanel) {
      const heading = textPanel.querySelector("h1, h2, h3, h4, h5, h6");
      const ctas = [...textPanel.querySelectorAll('a.Button, a[class*="Button"]')];
      const paras = [...textPanel.querySelectorAll("p")].filter((p) => p.textContent.trim() && !ctas.some((a) => p.contains(a) && p.textContent.trim() === a.textContent.trim()));
      const eyebrows = heading ? paras.filter((p) => p.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING) : [];
      const body = paras.filter((p) => !eyebrows.includes(p));
      eyebrows.forEach((p) => textNodes.push(p));
      if (heading) textNodes.push(heading);
      body.forEach((p) => textNodes.push(p));
      ctas.forEach((a) => {
        const p = document2.createElement("p");
        p.append(a);
        textNodes.push(p);
      });
    }
    const image = imagePanel ? imagePanel.querySelector("img") : null;
    if (!textNodes.length && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const imageCell = image ? [image] : "";
    const textCell = textNodes.length ? textNodes : "";
    let imageLeft = false;
    if (imagePanel) {
      const cls = imagePanel.classList;
      imageLeft = cls.contains("u-flexOrderFirst") || cls.contains("Promo-borderRadiusLeft");
    }
    const cells = [imageLeft ? [imageCell, textCell] : [textCell, imageCell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-icon.js
  function hinted2(document2, field, nodes) {
    const frag = document2.createDocumentFragment();
    frag.appendChild(document2.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function resolveSpriteSymbol2(document2, href) {
    const [spritePath, id] = href.split("#");
    if (!id) return null;
    const inline = spritePath ? null : document2.getElementById(id);
    if (inline) return inline;
    const win = document2.defaultView || (typeof window !== "undefined" ? window : null);
    if (!win || !win.XMLHttpRequest) return null;
    win.__amprSpriteCache = win.__amprSpriteCache || {};
    const cache = win.__amprSpriteCache;
    if (!(spritePath in cache)) {
      cache[spritePath] = null;
      const candidates = [spritePath];
      try {
        candidates.push(new URL(spritePath, "https://www.ameriprise.com").href);
      } catch (e) {
      }
      for (const url of candidates) {
        try {
          const xhr = new win.XMLHttpRequest();
          xhr.open("GET", url, false);
          xhr.send();
          if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText.includes("<symbol")) {
            cache[spritePath] = new win.DOMParser().parseFromString(xhr.responseText, "image/svg+xml");
            break;
          }
        } catch (e) {
        }
      }
    }
    const sprite = cache[spritePath];
    return sprite ? sprite.getElementById(id) : null;
  }
  function iconColor(document2, svg) {
    const win = document2.defaultView;
    if (!win || !win.getComputedStyle) return null;
    const cs = win.getComputedStyle(svg);
    if (cs.stroke && cs.stroke !== "none") return cs.stroke;
    if (cs.fill && cs.fill !== "none") return cs.fill;
    return null;
  }
  function toIconImage2(document2, node) {
    if (!node) return null;
    if (node.tagName && node.tagName.toLowerCase() === "img") return node;
    const use = node.querySelector("use");
    const href = use && (use.getAttribute("href") || use.getAttribute("xlink:href"));
    if (!href) return null;
    const id = href.split("#")[1] || "";
    const symbol = resolveSpriteSymbol2(document2, href);
    const img = document2.createElement("img");
    img.alt = node.getAttribute("aria-label") || "";
    if (symbol) {
      const viewBox = symbol.getAttribute("viewBox") || "0 0 100 100";
      const color = iconColor(document2, node);
      const body = symbol.innerHTML;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${color ? ` fill="${color}"` : ""}>${body}</svg>`;
      const b64 = btoa(unescape(encodeURIComponent(svg)));
      img.src = `data:image/svg+xml;base64,${b64}`;
    } else {
      let abs = href;
      try {
        abs = new URL(href, "https://www.ameriprise.com").href;
      } catch (e) {
      }
      img.src = abs;
    }
    if (id) img.setAttribute("data-icon", id);
    return img;
  }
  function parse4(element, { document: document2 }) {
    let items = [...element.querySelectorAll(".Categories-block")];
    if (!items.length) items = [...element.querySelectorAll(":scope > div")];
    items = items.filter((it) => it.textContent.trim() || it.querySelector("svg, img"));
    if (!items.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    items.forEach((item) => {
      const icon = toIconImage2(document2, item.querySelector("svg.BrandIcon, svg, img"));
      const textNodes = [];
      const labelEl = item.querySelector('.Categories-heading [class*="Type-"], .Categories-heading, h2, h3, h4');
      const label = labelEl ? labelEl.textContent.trim() : "";
      if (label) {
        const p = document2.createElement("p");
        const strong = document2.createElement("strong");
        strong.textContent = label;
        p.append(strong);
        textNodes.push(p);
      }
      const body = item.querySelector(".Categories-content");
      if (body && body.textContent.trim()) {
        const paras = [...body.querySelectorAll("p")];
        if (paras.length) paras.forEach((p) => textNodes.push(p));
        else {
          const p = document2.createElement("p");
          p.append(...body.childNodes);
          textNodes.push(p);
        }
      }
      cells.push([
        icon ? hinted2(document2, "image", [icon]) : "",
        textNodes.length ? hinted2(document2, "text", textNodes) : ""
      ]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-icon", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-promo.js
  function hinted3(document2, field, nodes) {
    const frag = document2.createDocumentFragment();
    frag.appendChild(document2.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function readVideoProps(node) {
    const found = {};
    if (!node) return found;
    const key = Object.keys(node).find((k) => k.startsWith("__reactFiber") || k.startsWith("__reactInternalInstance"));
    let fiber = key ? node[key] : null;
    for (let i = 0; fiber && i < 30; i += 1, fiber = fiber.return) {
      const p = fiber.memoizedProps;
      if (p && typeof p === "object") {
        ["accountId", "playerId", "videoId", "playlistId", "policyKey"].forEach((k) => {
          if (!found[k] && p[k] && typeof p[k] === "string") found[k] = p[k];
        });
      }
      if (found.accountId && (found.videoId || found.playlistId)) break;
    }
    return found;
  }
  var BC_ATTRS = {
    accountId: "data-bc-account",
    playerId: "data-bc-player",
    videoId: "data-bc-video",
    playlistId: "data-bc-playlist",
    policyKey: "data-bc-policy"
  };
  function readCapturedProps(container) {
    const found = {};
    if (!container) return found;
    Object.entries(BC_ATTRS).forEach(([k, attr]) => {
      if (container.getAttribute(attr)) found[k] = container.getAttribute(attr);
    });
    return found;
  }
  function resolveVideoUrl(document2, panel, posterImg) {
    const win = document2.defaultView || (typeof window !== "undefined" ? window : {});
    const holder = panel.querySelector(".video-poster, .vc-video-container, .video-player");
    if (!holder) return null;
    let props = readCapturedProps(panel.querySelector(".vc-video-container"));
    if (!props.playlistId && !props.videoId) props = __spreadValues(__spreadValues({}, readVideoProps(holder)), props);
    let account = props.accountId || win.BRIGHTCOVE_ACC;
    if (!account && posterImg) {
      const m = (posterImg.getAttribute("src") || "").match(/\/v1\/static\/(\d+)\//);
      if (m) [, account] = m;
    }
    const player = props.playerId || "default_default";
    let { videoId } = props;
    const { playlistId } = props;
    const policyKey = props.policyKey || win.BRIGHTCOVE_PK;
    if (!videoId && playlistId && account && policyKey && win.XMLHttpRequest) {
      try {
        const xhr = new win.XMLHttpRequest();
        xhr.open("GET", `https://edge.api.brightcove.com/playback/v1/accounts/${account}/playlists/${playlistId}`, false);
        xhr.setRequestHeader("Accept", `application/json;pk=${policyKey}`);
        xhr.send();
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          if (data && data.videos && data.videos.length === 1) videoId = data.videos[0].id;
        }
      } catch (e) {
      }
    }
    if (!account) return null;
    if (videoId) return `https://players.brightcove.net/${account}/${player}/index.html?videoId=${videoId}`;
    if (playlistId) return `https://players.brightcove.net/${account}/${player}/index.html?playlistId=${playlistId}`;
    return null;
  }
  function parse5(element, { document: document2 }) {
    const labels = [...element.querySelectorAll(".HorizontalTabs-tabLabel")].map((l) => l.textContent.trim());
    const panels = [...element.querySelectorAll(".HorizontalTabs-panel")];
    if (!panels.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    panels.forEach((panel, index) => {
      const label = labels[index] || "";
      const contentPanels = [...panel.querySelectorAll(".Promo-content")];
      const mediaPanel = contentPanels.find((c) => c.querySelector("img, picture, .video-poster"));
      const textPanel = contentPanels.find((c) => c !== mediaPanel) || panel;
      const heading = textPanel.querySelector("h1, h2, h3, h4, h5, h6");
      const paras = [...textPanel.querySelectorAll("p")].filter((p) => p.textContent.trim());
      const ctas = [...textPanel.querySelectorAll('a.Button, a[class*="Button"]')].filter((a) => !paras.some((p) => p.contains(a)));
      const contentCell = [];
      if (heading) {
        const h = document2.createElement(heading.tagName.toLowerCase());
        h.textContent = heading.textContent.trim();
        contentCell.push(hinted3(document2, "content_heading", [h]));
      }
      const rich = [...paras];
      ctas.forEach((a) => {
        const p = document2.createElement("p");
        p.append(a);
        rich.push(p);
      });
      if (rich.length) contentCell.push(hinted3(document2, "content_richtext", rich));
      const mediaCell = [];
      const img = mediaPanel ? mediaPanel.querySelector("img") : null;
      let videoUrl = null;
      if (mediaPanel && mediaPanel.querySelector(".video-poster, .vc-video-container, .video-player")) {
        videoUrl = resolveVideoUrl(document2, panel, img);
      }
      if (img) {
        if ((!img.alt || /^video poster$/i.test(img.alt)) && heading) img.alt = heading.textContent.trim();
        mediaCell.push(hinted3(document2, "media_image", [img]));
      }
      if (videoUrl) {
        const a = document2.createElement("a");
        a.href = videoUrl;
        a.textContent = videoUrl;
        mediaCell.push(hinted3(document2, "media_video", [a]));
      }
      const footerCell = [];
      const footer = panel.querySelector(":scope > footer, footer");
      if (footer && footer.textContent.trim()) {
        const inner = footer.querySelector(".Disclaimer-text") || footer.querySelector(".Content > div") || footer.querySelector(".Content") || footer;
        const p = document2.createElement("p");
        p.append(...inner.childNodes);
        footerCell.push(hinted3(document2, "footer", [p]));
      }
      if (!label && !contentCell.length && !mediaCell.length) return;
      const titleCell = [];
      if (label) {
        const p = document2.createElement("p");
        p.textContent = label;
        titleCell.push(hinted3(document2, "title", [p]));
      }
      cells.push([
        titleCell.length ? titleCell : "",
        contentCell.length ? contentCell : "",
        mediaCell.length ? mediaCell : "",
        footerCell.length ? footerCell : ""
      ]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/utils/brightcove-capture.js
  var BC_ATTRS2 = {
    accountId: "data-bc-account",
    playerId: "data-bc-player",
    videoId: "data-bc-video",
    playlistId: "data-bc-playlist",
    policyKey: "data-bc-policy"
  };
  function readFiberProps(node) {
    const found = {};
    if (!node) return found;
    const key = Object.keys(node).find((k) => k.startsWith("__reactFiber") || k.startsWith("__reactInternalInstance"));
    let fiber = key ? node[key] : null;
    for (let i = 0; fiber && i < 30; i += 1, fiber = fiber.return) {
      const p = fiber.memoizedProps;
      if (p && typeof p === "object") {
        Object.keys(BC_ATTRS2).forEach((k) => {
          if (!found[k] && p[k] && typeof p[k] === "string") found[k] = p[k];
        });
      }
      if (found.accountId && (found.videoId || found.playlistId)) break;
    }
    return found;
  }
  function captureVideoProps(document2) {
    document2.querySelectorAll(".HorizontalTabs .vc-video-container").forEach((c) => {
      const props = __spreadValues(__spreadValues({}, readFiberProps(c)), readFiberProps(c.querySelector(".video-poster")));
      Object.entries(BC_ATTRS2).forEach(([k, attr]) => {
        if (props[k]) c.setAttribute(attr, props[k]);
      });
    });
  }

  // tools/importer/parsers/columns-advisor.js
  function resolveSpriteSymbol3(document2, href) {
    const [spritePath, id] = href.split("#");
    if (!id) return null;
    const inline = spritePath ? null : document2.getElementById(id);
    if (inline) return inline;
    const win = document2.defaultView || (typeof window !== "undefined" ? window : null);
    if (!win || !win.XMLHttpRequest) return null;
    win.__amprSpriteCache = win.__amprSpriteCache || {};
    const cache = win.__amprSpriteCache;
    if (!(spritePath in cache)) {
      cache[spritePath] = null;
      const candidates = [spritePath];
      try {
        candidates.push(new URL(spritePath, "https://www.ameriprise.com").href);
      } catch (e) {
      }
      for (const url of candidates) {
        try {
          const xhr = new win.XMLHttpRequest();
          xhr.open("GET", url, false);
          xhr.send();
          if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText.includes("<symbol")) {
            cache[spritePath] = new win.DOMParser().parseFromString(xhr.responseText, "image/svg+xml");
            break;
          }
        } catch (e) {
        }
      }
    }
    const sprite = cache[spritePath];
    return sprite ? sprite.getElementById(id) : null;
  }
  function iconColor2(document2, svg) {
    const win = document2.defaultView;
    if (!win || !win.getComputedStyle) return null;
    const cs = win.getComputedStyle(svg);
    if (cs.stroke && cs.stroke !== "none") return cs.stroke;
    if (cs.fill && cs.fill !== "none") return cs.fill;
    return null;
  }
  function toIconImage3(document2, node) {
    if (!node) return null;
    if (node.tagName && node.tagName.toLowerCase() === "img") return node;
    const use = node.querySelector("use");
    const href = use && (use.getAttribute("href") || use.getAttribute("xlink:href"));
    if (!href) return null;
    const id = href.split("#")[1] || "";
    const symbol = resolveSpriteSymbol3(document2, href);
    const img = document2.createElement("img");
    img.alt = node.getAttribute("aria-label") || "";
    if (symbol) {
      const viewBox = symbol.getAttribute("viewBox") || "0 0 100 100";
      const color = iconColor2(document2, node);
      const body = symbol.innerHTML;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${color ? ` fill="${color}"` : ""}>${body}</svg>`;
      const b64 = btoa(unescape(encodeURIComponent(svg)));
      img.src = `data:image/svg+xml;base64,${b64}`;
    } else {
      let abs = href;
      try {
        abs = new URL(href, "https://www.ameriprise.com").href;
      } catch (e) {
      }
      img.src = abs;
    }
    if (id) img.setAttribute("data-icon", id);
    return img;
  }
  function parse6(element, { document: document2 }) {
    var _a;
    const headingWrap = element.querySelector(".DynamicAdvisor-heading") || ((_a = element.querySelector("h2, h3")) == null ? void 0 : _a.parentElement);
    const searchForm = element.querySelector(".DynamicAdvisor-searchForm");
    const disclosureWrap = element.querySelector(".DynamicAdvisor-disclosure");
    const introCell = [];
    if (headingWrap) {
      const icon = toIconImage3(document2, headingWrap.querySelector("svg.BrandIcon, svg, img"));
      if (icon) {
        const p = document2.createElement("p");
        p.append(icon);
        introCell.push(p);
      }
      const heading = headingWrap.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading) introCell.push(heading);
    }
    const searchCell = [];
    if (searchForm) {
      const label = [...searchForm.querySelectorAll("label")].find((l) => !l.closest(".Input-group") && l.textContent.trim());
      if (label) {
        const p = document2.createElement("p");
        p.textContent = label.textContent.trim();
        searchCell.push(p);
      }
      [...searchForm.querySelectorAll("p")].filter((p) => p.textContent.trim() && !p.closest(".Input-group")).forEach((p) => searchCell.push(p));
    }
    if (disclosureWrap) {
      const paras = [...disclosureWrap.querySelectorAll("p")].filter((p) => p.textContent.trim());
      if (paras.length) paras.forEach((p) => searchCell.push(p));
      else if (disclosureWrap.textContent.trim()) {
        const p = document2.createElement("p");
        p.append(...disclosureWrap.childNodes);
        searchCell.push(p);
      }
    }
    if (!introCell.length && !searchCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[introCell.length ? introCell : "", searchCell.length ? searchCell : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-advisor", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/ameriprise-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var KEEP_IF_CONTAINS = "img, picture, video, table, hr, a, iframe, svg, input, button";
  function removeEmptyWrappers(root) {
    const candidates = Array.from(root.querySelectorAll("div, span, section")).reverse();
    candidates.forEach((el) => {
      if (el === root || !el.isConnected) return;
      if (el.textContent.trim() !== "") return;
      if (el.querySelector(KEEP_IF_CONTAINS)) return;
      el.remove();
    });
  }
  function removeComments(root) {
    const doc = root.ownerDocument || document;
    const walker = doc.createTreeWalker(
      root,
      128
      /* NodeFilter.SHOW_COMMENT */
    );
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach((c) => c.remove());
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        // <div id="onetrust-consent-sdk"> OneTrust cookie preference center
        ".QSIFeedbackButton",
        // <div class="QSIFeedbackButton"> Qualtrics feedback button
        "#ZN_37spM9cCMVfV1MV",
        // <div id="ZN_37spM9cCMVfV1MV"> Qualtrics intercept target
        "#app-store-banner-element"
        // <div id="app-store-banner-element"> app download banner
      ]);
      WebImporter.DOMUtils.remove(element, ["div.LoginClient"]);
    }
    if (hookName === TransformHook.afterTransform) {
      const skipLink = element.querySelector("#skipToMainContent");
      if (skipLink) {
        const skipNav = skipLink.closest("nav");
        if (skipNav) skipNav.remove();
      }
      WebImporter.DOMUtils.remove(element, [
        "#app-header",
        // <header id="app-header" class="header">
        "footer.footer",
        // <footer class="footer"> (contains ameriprise-footer + FooterDisclaimer)
        "nav.BackToTop"
        // <nav class="BackToTop ...">
      ]);
      WebImporter.DOMUtils.remove(element, [
        'img[src*="tags.w55c.net"]',
        'img[src*="crwdcntrl.net"]',
        'img[src*="adsrvr.org"]',
        'img[src*="bat.bing.com"]',
        'img[src*="facebook.com/tr"]',
        'img[src*="doubleclick.net"]',
        'img[width="1"][height="1"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        "iframe",
        "script",
        "noscript",
        "style",
        "link",
        "template"
      ]);
      removeComments(element);
      element.querySelectorAll("[onclick], [data-track], [data-analytics]").forEach((el) => {
        el.removeAttribute("onclick");
        el.removeAttribute("data-track");
        el.removeAttribute("data-analytics");
      });
      removeEmptyWrappers(element);
    }
  }

  // tools/importer/transformers/ameriprise-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-home.js
  var PAGE_TEMPLATE = {
    name: "home",
    description: "Ameriprise homepage: hero, spotlights, promo panels, ratings highlights, resource tabs, advisor locator and disclosures",
    urls: [
      "https://www.ameriprise.com/"
    ],
    blocks: [
      {
        name: "hero-cutout",
        instances: ["section.ComplexHero"]
      },
      {
        name: "columns-spotlight",
        instances: [".Spotlight-component .Spotlight > .Grid"]
      },
      {
        name: "columns-promo",
        instances: [".component-wrapper > .component-loaded > div > section.Promo-redesign"]
      },
      {
        name: "cards-icon",
        instances: ["section.Categories .Categories-blocks"]
      },
      {
        name: "tabs-promo",
        instances: [".HorizontalTabs"]
      },
      {
        name: "columns-advisor",
        instances: ["#advisor-locator"]
      }
    ],
    sections: [
      {
        id: "rc2",
        name: "hero",
        selector: [".ComplexHero-container"],
        style: null,
        blocks: ["hero-cutout"],
        defaultContent: []
      },
      {
        id: "rc4",
        name: "spotlights",
        selector: [".Spotlight-component"],
        style: null,
        blocks: ["columns-spotlight"],
        defaultContent: []
      },
      {
        id: "rc5",
        name: "time-award-promo",
        selector: [".component-wrapper > .component-loaded > div > section.Promo-redesign:has(.u-bgColorStone)"],
        style: null,
        blocks: ["columns-promo"],
        defaultContent: []
      },
      {
        id: "rc6",
        name: "top-ratings",
        selector: ["section.Categories"],
        style: null,
        blocks: ["cards-icon"],
        defaultContent: ["section.Categories .Content.u-paddingTop48"]
      },
      {
        id: "rc7",
        name: "retirement-quiz-promo",
        selector: [".component-wrapper > .component-loaded > div > section.Promo-redesign:has(.u-bgColorPurpleLight10)"],
        style: null,
        blocks: ["columns-promo"],
        defaultContent: []
      },
      {
        id: "rc8",
        name: "insights-tabs",
        selector: [".component-wrapper:has(.HorizontalTabs)"],
        style: null,
        blocks: ["tabs-promo"],
        defaultContent: [".component-wrapper:has(.HorizontalTabs) > section > header"]
      },
      {
        id: "rc9",
        name: "advisor-locator",
        selector: ["#advisor-locator"],
        style: null,
        blocks: ["columns-advisor"],
        defaultContent: []
      },
      {
        id: "rc11",
        name: "disclosures",
        selector: ["section.SimpleContent"],
        style: "disclaimer",
        blocks: [],
        defaultContent: ["section.SimpleContent .Content.content-block"]
      }
    ]
  };
  var parsers = {
    "hero-cutout": parse,
    "columns-spotlight": parse2,
    "columns-promo": parse3,
    "cards-icon": parse4,
    "tabs-promo": parse5,
    "columns-advisor": parse6
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_home_default = {
    // Runs on the live page before html2md rebuilds the DOM (React props still available)
    onLoad: (_0) => __async(void 0, [_0], function* ({ document: document2 }) {
      try {
        captureVideoProps(document2);
      } catch (e) {
        console.warn("captureVideoProps failed:", e);
      }
    }),
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
