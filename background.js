// Redirects x.com page loads, runs the toolbar badge and the right-click menu.
var state = Object.assign({}, SD_DEFAULTS);

// URLs / tabs the user explicitly asked to open on X; don't bounce them back.
var bypassUrls = new Map(); // canonical url -> expiry
var bypassTabs = new Map(); // tabId -> expiry
var BYPASS_MS = 15000;

function load() {
  return browser.storage.local.get(SD_DEFAULTS).then(function (s) {
    state = s;
    updateBadge();
    buildMenus();
  });
}

browser.storage.onChanged.addListener(load);
load();

browser.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") browser.runtime.openOptionsPage();
});

// ---- Redirect -------------------------------------------------------------

function isBypassed(details) {
  var now = Date.now();
  var t = bypassTabs.get(details.tabId);
  if (t && t > now) return true;
  var canon = sdCanonicalX(details.url);
  var u = canon && bypassUrls.get(canon);
  if (u && u > now) {
    bypassUrls.delete(canon);
    if (details.tabId >= 0) bypassTabs.set(details.tabId, now + BYPASS_MS);
    return true;
  }
  return false;
}

browser.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (!state.enabled || !state.redirect) return {};
    if (isBypassed(details)) return {};
    var target = sdConvert(details.url, sdActiveViewer(state).template);
    return target ? { redirectUrl: target } : {};
  },
  {
    urls: ["*://x.com/*", "*://*.x.com/*", "*://twitter.com/*", "*://*.twitter.com/*"],
    types: ["main_frame"]
  },
  ["blocking"]
);

browser.tabs.onRemoved.addListener(function (tabId) { bypassTabs.delete(tabId); });

// ---- Toolbar badge --------------------------------------------------------

function updateBadge() {
  browser.browserAction.setBadgeText({ text: state.enabled ? "" : "off" });
  browser.browserAction.setBadgeBackgroundColor({ color: "#6b7280" });
  browser.browserAction.setTitle({
    title: state.enabled
      ? "Sidedoor: on (" + sdActiveViewer(state).name + ")"
      : "Sidedoor: off"
  });
}

// ---- Right-click menu -----------------------------------------------------

var X_PATTERNS = ["*://x.com/*", "*://*.x.com/*", "*://twitter.com/*", "*://*.twitter.com/*"];

function viewerPatterns() {
  var seen = {};
  return sdViewers(state).map(function (v) { return sdHostPattern(v.template); })
    .filter(function (p) { return p && !seen[p] && (seen[p] = true); });
}

function buildMenus() {
  browser.menus.removeAll().then(function () {
    var linkPatterns = X_PATTERNS.concat(viewerPatterns());

    browser.menus.create({
      id: "open-x-link",
      title: "Open original on X",
      contexts: ["link"],
      targetUrlPatterns: linkPatterns
    });
    browser.menus.create({
      id: "open-with-link",
      title: "Open with",
      contexts: ["link"],
      targetUrlPatterns: linkPatterns
    });
    sdViewers(state).forEach(function (v) {
      browser.menus.create({
        id: "viewer-link:" + v.id,
        parentId: "open-with-link",
        title: v.name,
        contexts: ["link"],
        targetUrlPatterns: linkPatterns
      });
    });

    browser.menus.create({
      id: "open-x-page",
      title: "Open this page on X",
      contexts: ["page"],
      documentUrlPatterns: viewerPatterns()
    });
    browser.menus.create({
      id: "open-with-page",
      title: "Open this page with",
      contexts: ["page"],
      documentUrlPatterns: viewerPatterns()
    });
    sdViewers(state).forEach(function (v) {
      browser.menus.create({
        id: "viewer-page:" + v.id,
        parentId: "open-with-page",
        title: v.name,
        contexts: ["page"],
        documentUrlPatterns: viewerPatterns()
      });
    });
  });
}

function originalFor(info, tab) {
  if (!info.linkUrl) return Promise.resolve(sdToX(info.pageUrl, state));
  var fallback = sdToX(info.linkUrl, state);
  if (info.targetElementId == null || !tab) return Promise.resolve(fallback);
  return browser.tabs.sendMessage(
    tab.id,
    { type: "sidedoor-original", targetElementId: info.targetElementId },
    { frameId: info.frameId }
  ).then(function (orig) {
    return sdToX(orig, state) || fallback;
  }, function () { return fallback; });
}

function openUrl(url, info, tab) {
  if (info.linkUrl) {
    return browser.tabs.create({ url: url, index: tab.index + 1, openerTabId: tab.id });
  }
  return browser.tabs.update(tab.id, { url: url });
}

browser.menus.onClicked.addListener(function (info, tab) {
  var id = String(info.menuItemId);
  originalFor(info, tab).then(function (xUrl) {
    if (!xUrl) return;
    if (id === "open-x-link" || id === "open-x-page") {
      bypassUrls.set(xUrl, Date.now() + BYPASS_MS);
      if (!info.linkUrl) bypassTabs.set(tab.id, Date.now() + BYPASS_MS);
      return openUrl(xUrl, info, tab);
    }
    var vid = id.replace(/^viewer-(?:link|page):/, "");
    var viewer = sdViewers(state).filter(function (v) { return v.id === vid; })[0];
    var target = viewer && sdConvert(xUrl, viewer.template);
    if (target) return openUrl(target, info, tab);
  });
});
