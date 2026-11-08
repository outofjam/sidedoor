# addons.mozilla.org listing copy

Paste these into the AMO submission form. Not packaged into the extension.

**Name:** Sidedoor for X Links

**Summary** (250 characters max):
Opens x.com and twitter.com links in a viewer of your choice, so you can read public posts without the login wall. Pick from built-in viewers or add your own. No data collection.

**Categories:** Social & Communication; Privacy & Security

**Tags:** twitter, x, viewer, redirect, login wall, nitter, privacy

**Homepage:** https://github.com/outofjam/sidedoor
**Support site:** https://github.com/outofjam/sidedoor/issues
**License:** MIT
**Privacy policy:** paste the contents of PRIVACY.md

**Description:**

Tired of hitting a login wall every time someone shares an X post? Sidedoor sends x.com and twitter.com links to a viewer site that shows public posts without an account.

What it does:
• Rewrites X links on every website, so hovering, copying and clicking all use your viewer
• Redirects x.com pages you open directly, from bookmarks, typed URLs or other apps
• Lets you choose your viewer: TwitterViewer, XCancel and Nitter are built in, and you can add any other site with a simple URL pattern
• Right-click any link to "Open original on X" or "Open with" a different viewer, which is handy when one site is down
• Turns off with one click from the toolbar

Privacy: Sidedoor collects nothing. It runs entirely in your browser, makes no network requests of its own, and has no analytics. When you open a link you're visiting the viewer site you picked, and that site's own privacy policy applies.

Sidedoor isn't affiliated with X Corp. or any viewer site. Viewer sites are run by third parties and may change or go offline; if one stops working, switch to another in the toolbar menu.

Open source: https://github.com/outofjam/sidedoor

**Notes to reviewer:**

No build step, no minified or third-party code; the submitted files are the source. The content script runs on all sites only to find anchors whose href points at x.com or twitter.com and swap the href; original values are kept in a data attribute so they can be restored. Blocking webRequest is limited to main_frame requests on x.com and twitter.com, to redirect them to the user's chosen viewer. No remote code, no network requests made by the extension. To test: load it, open https://x.com/NASA and you should land on twitterviewer.net/NASA; right-click a rewritten link and choose "Open original on X" to reach X without being redirected.
