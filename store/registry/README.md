# R7 Plugin Registry Variants

This folder contains 5 catalog delivery variants for the R7 Plugin Manager.

1. `v1-full.json`
- Full normalized registry in one JSON file.
- Contains all fields needed by UI and installer links.

2. `v2-slugs.json`
- Lightweight slug list.
- Manager loads each plugin manifest from `sdkjs-plugins/content/<slug>/config.json`.

3. `categories/index.json` + `categories/*.json`
- Sharded registry by category.
- `index.json` points to category files.

4. `versioned/latest.json` + `versioned/plugins.<date>.json`
- Versioned immutable registry.
- `latest.json` points to a dated snapshot file.

5. `v5-global.js`
- CORS-safe script payload for `file://` host context.
- Exposes `window.__R7PM_REGISTRY__ = [...]`.
