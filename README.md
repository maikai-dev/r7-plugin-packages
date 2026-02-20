# r7-plugin-packages

ONLYOFFICE-compatible repository for the R7 Plugin Manager catalog.

This repository follows the same backend layout as `onlyoffice.github.io`:

- `store/config.json` - catalog index consumed by Plugin Manager.
- `sdkjs-plugins/content/<plugin>/config.json` - plugin manifest consumed by Plugin Manager and editor runtime.
- `sdkjs-plugins/content/<plugin>/` - plugin files (`index.html`, `code.js`, `style.css`, `CHANGELOG.md`, icons/resources).
- `sdkjs-plugins/v1/` - ONLYOFFICE plugin SDK assets (`plugins.js`, `plugins-ui.js`, `plugins.css`, ...).

## Repository layout

```text
store/
  config.json
  README.md
sdkjs-plugins/
  README.md
  v1/
  content/
    mini-date-inserter/
    mini-random-quote/
    mini-text-case/
    mini-word-counter/
plugins/
registry/
tools/
```

`plugins/`, `registry/`, and `tools/` are left as legacy/internal folders.
Runtime catalog for Plugin Manager is `store/config.json` + `sdkjs-plugins/content/*`.

## How Plugin Manager reads this repo

1. Plugin Manager loads `store/config.json`.
2. For each `name`, it loads `sdkjs-plugins/content/<name>/config.json`.
3. It then loads plugin resources from the same folder.
4. Install/update actions are executed by editor backend using that manifest.

## Publish to GitVerse Pages

Expected public base URL for manager backend:

- `https://maikai.gitverse.site/r7-plugin-packages/`

Required files on Pages:

- `https://maikai.gitverse.site/r7-plugin-packages/store/config.json`
- `https://maikai.gitverse.site/r7-plugin-packages/sdkjs-plugins/content/<plugin>/config.json`

## Add a new plugin

Use the same flow as ONLYOFFICE:

1. Create `sdkjs-plugins/content/<plugin-name>/`.
2. Add required files: `config.json`, `index.html`, `code.js`, `CHANGELOG.md` (and styles/resources).
3. Add plugin entry to `store/config.json`.
4. Commit and publish.

Detailed instructions are in `store/README.md`.
