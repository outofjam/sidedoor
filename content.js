// Rewrites x.com / twitter.com links on web pages so hovering, copying and
// clicking all use the chosen viewer. Originals are kept so links can be
// restored instantly when the extension is switched off.
(function () {
  var ORIG = "data-sidedoor-orig";
  var SELECTOR = 'a[href*="x.com"], a[href*="twitter.com"], a[' + ORIG + "]";
  var written = new WeakMap(); // anchor -> href we last wrote
  var template = null;
  var observer = null;

  function rewrite(a) {
    var cur = a.href;
    // If the page changed the link after we rewrote it, treat the new value as the original.
    var orig = written.get(a) === cur ? a.getAttribute(ORIG) : cur;
    var target = orig && sdConvert(orig, template);
    if (!target) return;
    a.setAttribute(ORIG, orig);
    if (cur !== target) a.href = target;
    written.set(a, a.href);
  }

  function scan(root) {
    if (root.matches && root.matches(SELECTOR)) rewrite(root);
    if (root.querySelectorAll) root.querySelectorAll(SELECTOR).forEach(rewrite);
  }

  function restoreAll() {
    document.querySelectorAll("a[" + ORIG + "]").forEach(function (a) {
      a.href = a.getAttribute(ORIG);
      a.removeAttribute(ORIG);
      written.delete(a);
    });
  }

  function apply(state) {
    var on = state.enabled && state.rewrite;
    if (!on) {
      if (observer) { observer.disconnect(); observer = null; }
      restoreAll();
      return;
    }
    template = sdActiveViewer(state).template;
    scan(document);
    if (!observer) {
      observer = new MutationObserver(function (mutations) {
        for (var m of mutations) {
          if (m.type === "attributes") {
            if (m.target.matches && m.target.matches("a")) rewrite(m.target);
          } else {
            m.addedNodes.forEach(function (n) { if (n.nodeType === 1) scan(n); });
          }
        }
      });
      observer.observe(document.documentElement, {
        childList: true, subtree: true, attributes: true, attributeFilter: ["href"]
      });
    }
  }

  function load() { browser.storage.local.get(SD_DEFAULTS).then(apply); }
  load();
  browser.storage.onChanged.addListener(load);

  // Right-click menu asks which original URL sits behind the clicked link.
  browser.runtime.onMessage.addListener(function (msg) {
    if (!msg || msg.type !== "sidedoor-original") return;
    var el = browser.menus.getTargetElement(msg.targetElementId);
    var a = el && el.closest ? el.closest("a") : null;
    return Promise.resolve(a ? (a.getAttribute(ORIG) || a.href) : null);
  });
})();
