## Description

This folder follows the same structure as ONLYOFFICE `sdkjs-plugins`.

## Structure

- `v1/`: ONLYOFFICE plugin SDK files (`plugins.js`, `plugins-ui.js`, `plugins.css`).
- `content/`: plugin source folders used by Plugin Manager catalog.

## Plugin folder minimum

Each plugin folder in `content/<plugin>/` should contain:

- `config.json`
- `index.html`
- `code.js`
- `CHANGELOG.md`

Optionally add styles, translations, icons, screenshots, and other resources.

## Link from plugin pages

Use local SDK links in plugin HTML:

```html
<script type="text/javascript" src="../../v1/plugins.js"></script>
<link rel="stylesheet" href="../../v1/plugins.css">
```
