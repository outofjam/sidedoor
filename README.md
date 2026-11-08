# Sidedoor for X Links

A Firefox extension that opens x.com and twitter.com links in a viewer of your choice, so you can read public posts without the login wall.

- **Rewrites links on every page.** Hovering, copying and clicking an X link all use the viewer version. Links that load in later (infinite scroll, comments) are caught too.
- **Redirects x.com directly.** Typed URLs, bookmarks and links from other apps go to your viewer.
- **Choose your viewer.** Comes with TwitterViewer, XCancel and Nitter. Add any other site with a URL pattern.
- **Easy way back.** Right-click any link for **Open original on X** or **Open with ▸** another viewer. On a viewer page, right-click for **Open this page on X**.
- **One-click off switch** from the toolbar.
- **No data collection.** Everything runs locally. See [PRIVACY.md](PRIVACY.md).

## Install

- **From Mozilla Add-ons:** *(link coming once it's approved)*
- **For development:** open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on…**, and pick `manifest.json` from this folder.

## Adding a viewer

In Settings, add a name and a URL pattern:

| Placeholder | Becomes | Example |
|---|---|---|
| `{path}` | everything after `x.com/` | `NASA/status/123` |
| `{query}` | the query string, with `?` | `?q=hello` |
| `{url}` | the full x.com link, encoded | `https%3A%2F%2Fx.com%2FNASA` |

Most viewers mirror X's paths, so `https://example.com/{path}{query}` usually works. For sites that take a link as a parameter, use something like `https://example.com/view?url={url}`.

Know a viewer that works well? Open an issue or a pull request adding it to `SD_BUILTIN_VIEWERS` in [`common.js`](common.js).

## Build

```sh
./build.sh          # writes dist/sidedoor-<version>.xpi
```

With Mozilla's [`web-ext`](https://github.com/mozilla/web-ext) installed, `web-ext lint` checks the extension against addons.mozilla.org rules.

## Disclaimer

Sidedoor isn't affiliated with X Corp. or any of the viewer sites. It only changes where links point; it doesn't fetch, scrape or host any content. Viewer sites are run by third parties and can change or go offline at any time.

## License

[MIT](LICENSE)
