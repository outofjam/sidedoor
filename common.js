// Shared by the background, content, options and popup scripts.
//
// A viewer is { id, name, template }. Template placeholders:
//   {path}  -> path after the domain, no leading slash   (e.g. "NASA/status/123")
//   {query} -> query string including "?", or empty      (e.g. "?q=hello")
//   {url}   -> the full original x.com URL, URI-encoded  (for sites that take ?url=...)

var SD_BUILTIN_VIEWERS = [
  { id: "twitterviewer", name: "TwitterViewer (twitterviewer.net)", template: "https://twitterviewer.net/{path}{query}" },
  { id: "xcancel",       name: "XCancel (xcancel.com)",             template: "https://xcancel.com/{path}{query}" },
  { id: "nitter",        name: "Nitter (nitter.net)",               template: "https://nitter.net/{path}{query}" }
];

var SD_DEFAULTS = {
  enabled: true,      // master switch (toolbar)
  rewrite: true,      // rewrite links on web pages
  redirect: true,     // redirect x.com page loads
  active: "twitterviewer",
  custom: []          // user-added viewers
};

var SD_X_HOST_RE = /^(?:www\.|mobile\.)?(?:x|twitter)\.com$/i;

// X infrastructure pages that aren't content; never redirect these.
var SD_SKIP_RE = /^\/(?:i\/flow|i\/oauth2|login|logout|signup|settings|intent|share|oauth|account|tos|privacy)(?:\/|$)/i;

var SD_TRACKING_PARAMS = ["s", "t", "ref_src", "ref_url", "src"];

function sdViewers(state) {
  return SD_BUILTIN_VIEWERS.concat((state && state.custom) || []);
}

function sdActiveViewer(state) {
  var all = sdViewers(state);
  for (var i = 0; i < all.length; i++) if (all[i].id === state.active) return all[i];
  return all[0];
}

function sdParseX(href) {
  var u;
  try { u = new URL(href); } catch (e) { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (!SD_X_HOST_RE.test(u.hostname)) return null;
  SD_TRACKING_PARAMS.forEach(function (p) { u.searchParams.delete(p); });
  return u;
}

// x.com/twitter.com URL -> viewer URL, or null if it isn't a convertible X link.
function sdConvert(href, template) {
  var u = sdParseX(href);
  if (!u || SD_SKIP_RE.test(u.pathname)) return null;
  var path = u.pathname.replace(/^\/+/, "");
  var query = u.searchParams.toString();
  var clean = "https://x.com/" + path + (query ? "?" + query : "");
  return template
    .replace(/\{path\}/g, path)
    .replace(/\{query\}/g, query ? "?" + query : "")
    .replace(/\{url\}/g, encodeURIComponent(clean));
}

// Any X URL -> canonical https://x.com/... URL (no tracking params), or null.
function sdCanonicalX(href) {
  var u = sdParseX(href);
  if (!u) return null;
  var query = u.searchParams.toString();
  return "https://x.com" + u.pathname + (query ? "?" + query : "");
}

// Viewer URL -> original x.com URL, for templates of the form "<prefix>{path}[{query}]".
function sdReverse(href, template) {
  var m = /^(.*)\{path\}(\{query\})?$/.exec(template);
  if (!m || href.indexOf(m[1]) !== 0) return null;
  var rest = href.slice(m[1].length).split("#")[0];
  if (!m[2]) rest = rest.split("?")[0];
  return rest ? "https://x.com/" + rest : null;
}

// Best effort: whatever this link/page is, find the x.com URL behind it.
function sdToX(href, state) {
  if (!href) return null;
  var c = sdCanonicalX(href);
  if (c) return c;
  var all = sdViewers(state);
  for (var i = 0; i < all.length; i++) {
    var r = sdReverse(href, all[i].template);
    if (r) return r;
  }
  return null;
}

// Returns an error message, or null if the template is usable.
function sdValidateTemplate(t) {
  if (!t) return "Enter a URL pattern.";
  if (!/\{path\}|\{url\}/.test(t)) return "The pattern needs {path} or {url} in it.";
  var u;
  try { u = new URL(t.replace(/\{(?:path|query|url)\}/g, "")); } catch (e) { return "That isn't a valid URL."; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return "The pattern must start with https:// or http://.";
  if (SD_X_HOST_RE.test(u.hostname)) return "The viewer can't be x.com or twitter.com itself.";
  return null;
}

function sdHostPattern(template) {
  try { return "*://" + new URL(template.replace(/\{(?:path|query|url)\}/g, "")).hostname + "/*"; }
  catch (e) { return null; }
}
