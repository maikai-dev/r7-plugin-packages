# r7-plugin-packages

ONLYOFFICE-compatible catalog repository for R7 Plugin Manager.

This repository keeps a single runtime model, same as ONLYOFFICE:

- `store/config.json`
- `sdkjs-plugins/content/<plugin>/...`
- `sdkjs-plugins/v1/...`

No parallel `plugins/registry/tools` structure is used.

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
```

## How Plugin Manager reads this repo

1. Load `store/config.json`.
2. For each item `name`, load `sdkjs-plugins/content/<name>/config.json`.
3. Load plugin assets from the same folder.
4. Editor backend executes install/update/remove with this manifest.

## Add a new plugin

1. Create `sdkjs-plugins/content/<plugin-name>/`.
2. Add required files: `config.json`, `index.html`, `code.js`, `CHANGELOG.md`.
3. Add the plugin name to `store/config.json`.
4. Commit and publish.

Detailed notes are in `store/README.md`.
