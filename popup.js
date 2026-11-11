var $ = function (id) { return document.getElementById(id); };

browser.storage.local.get(SD_DEFAULTS).then(function (s) {
  $("enabled").checked = s.enabled;
  sdViewers(s).forEach(function (v) {
    var o = document.createElement("option");
    o.value = v.id;
    o.textContent = v.name;
    $("viewer").appendChild(o);
  });
  $("viewer").value = sdActiveViewer(s).id;
});

$("enabled").addEventListener("change", function () {
  browser.storage.local.set({ enabled: $("enabled").checked });
});

$("viewer").addEventListener("change", function () {
  browser.storage.local.set({ active: $("viewer").value });
});

$("settings").addEventListener("click", function (e) {
  e.preventDefault();
  browser.runtime.openOptionsPage();
  window.close();
});

document.querySelectorAll("a.ext").forEach(function (a) {
  a.addEventListener("click", function (e) {
    e.preventDefault();
    browser.tabs.create({ url: a.href });
    window.close();
  });
});
