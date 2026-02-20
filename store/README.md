# Plugin Manager Catalog (R7)

This folder is the ONLYOFFICE-compatible catalog index for Plugin Manager.

## Source of truth

- `store/config.json`
- `sdkjs-plugins/content/<plugin>/config.json`

`store/config.json` is an array of plugin entries:

```json
[
  { "name": "mini-word-counter", "discussion": "" }
]
```

- `name` must match plugin directory name in `sdkjs-plugins/content/<name>/`.
- `discussion` can be empty when rating/discussion links are not used.

## How it works

1. Manager loads `store/config.json`.
2. Manager loads each plugin manifest from `sdkjs-plugins/content/<name>/config.json`.
3. Manager loads plugin files from the same folder.

## How to add a plugin

1. Add plugin folder to `sdkjs-plugins/content/<plugin-name>/`.
2. Ensure required files exist:
   - `config.json`
   - `index.html`
   - `code.js`
   - `CHANGELOG.md`
3. Add `{ "name": "<plugin-name>", "discussion": "" }` to `store/config.json`.
4. Commit and publish.

## Important

Use only this ONLYOFFICE-compatible model.
No parallel registry structure is used in this repository.
