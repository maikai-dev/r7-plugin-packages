# Plugin Manager Catalog (R7)

This folder is the ONLYOFFICE-compatible catalog index for Plugin Manager.

## Source of truth

- `store/config.json`

`config.json` is an array of plugin entries:

```json
[
  { "name": "mini-word-counter", "discussion": "" }
]
```

- `name` must match plugin folder name in `sdkjs-plugins/content/<name>/`.
- `discussion` is optional. Keep empty if you do not use discussion/rating pages.

## How it works

Plugin Manager reads `store/config.json`, then loads each plugin manifest from:

- `sdkjs-plugins/content/<name>/config.json`

## How to add a plugin

1. Add plugin folder to `sdkjs-plugins/content/<plugin-name>/`.
2. Ensure plugin folder contains:
   - `config.json`
   - `index.html`
   - `code.js`
   - `CHANGELOG.md`
3. Add `{ "name": "<plugin-name>", "discussion": "" }` to `store/config.json`.
4. Publish repository updates.

## Notes

This repository intentionally mirrors ONLYOFFICE catalog backend structure.
No custom runtime index format is required for Plugin Manager operation.
