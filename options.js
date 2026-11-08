var $ = function (id) { return document.getElementById(id); };
var SAMPLE = "https://x.com/NASA/status/1234567890";
var state;

function flash(msg) {
  $("status").textContent = msg;
  clearTimeout(flash.t);
  flash.t = setTimeout(function () { $("status").textContent = ""; }, 2000);
}

function save(patch) {
  return browser.storage.local.set(patch).then(function () { flash("Saved"); });
}

function render() {
  $("enabled").checked = state.enabled;
  $("rewrite").checked = state.rewrite;
  $("redirect").checked = state.redirect;

  var box = $("viewers");
  box.textContent = "";
  var active = sdActiveViewer(state).id;
  sdViewers(state).forEach(function (v) {
    var row = document.createElement("label");
    row.className = "viewer";

    var radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "viewer";
    radio.checked = v.id === active;
    radio.addEventListener("change", function () { save({ active: v.id }); });

    var text = document.createElement("div");
    var name = document.createElement("div");
    name.textContent = v.name;
    var ex = document.createElement("div");
    ex.className = "muted small mono";
    ex.textContent = sdConvert(SAMPLE, v.template);
    text.append(name, ex);

    row.append(radio, text);

    if (v.id.indexOf("custom-") === 0) {
      var del = document.createElement("button");
      del.textContent = "Remove";
      del.className = "link";
      del.addEventListener("click", function (e) {
        e.preventDefault();
        var custom = state.custom.filter(function (c) { return c.id !== v.id; });
        var patch = { custom: custom };
        if (state.active === v.id) patch.active = SD_DEFAULTS.active;
        save(patch);
      });
      row.append(del);
    }
    box.append(row);
  });
}

function load() {
  return browser.storage.local.get(SD_DEFAULTS).then(function (s) { state = s; render(); });
}

["enabled", "rewrite", "redirect"].forEach(function (k) {
  $(k).addEventListener("change", function () {
    var p = {}; p[k] = $(k).checked; save(p);
  });
});

function previewNew() {
  var t = $("new-template").value.trim();
  var err = t ? sdValidateTemplate(t) : null;
  $("new-error").textContent = err || "";
  $("new-preview").textContent = t && !err ? "Example: " + sdConvert(SAMPLE, t) : "";
}
$("new-template").addEventListener("input", previewNew);

$("add").addEventListener("click", function () {
  var name = $("new-name").value.trim();
  var t = $("new-template").value.trim();
  var err = sdValidateTemplate(t) || (name ? null : "Give the viewer a name.");
  if (err) { $("new-error").textContent = err; return; }
  var v = { id: "custom-" + Date.now(), name: name, template: t };
  save({ custom: (state.custom || []).concat(v), active: v.id }).then(function () {
    $("new-name").value = "";
    $("new-template").value = "";
    previewNew();
  });
});

browser.storage.onChanged.addListener(load);
load();
