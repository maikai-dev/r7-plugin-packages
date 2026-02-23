# Debugging Plugin Installation: Post-Mortem

## The Problem
After updating the plugin installation mechanism to support GitHub URLs natively, we encountered an issue where the `zotero` plugin successfully installed via the R7-Office / ONLYOFFICE desktop application store, but our custom `cell-statistics`, `cell-formatter`, `data-generator`, and `cell-converter` plugins failed with a silent error (a spinning wheel that reverted to the "Install" button).

## Investigation and False Hypotheses
- **CORS and `?_v=` Cache Buster**: We initially suspected CORS issues or that the `?_v=...` timestamp parameter attached to the `config.json` URL was causing problems for the R7-Office C++ core downloader. We removed the query parameter, ensuring a clean URL was sent to the `InstallPlugin` call. This did not fix the problem.
- **GitHub URL Rewriting**: We assumed the ONLYOFFICE C++ core could not download from `maikai-dev.github.io` directly and required a rewrite to `github.com/.../tree/master/`, which we experimented with, but later reversed.
- **`langs.json` 404 Errors**: We noticed 404 requests in the DevTools console trying to fetch `langs.json` for all 4 custom plugins. We hypothesized this missing file might abort the installation sequence. However, this turned out to be noise and merely a UX glitch, not the root cause for blocking installation.

## The Root Cause
The real reason the custom plugins failed to install, while Zotero succeeded, was uncovered by analyzing the ONLYOFFICE Desktop SDK native C++ code (`client_renderer_wrapper.cpp`) and the successful `danula-ded/PluginManager` architecture.

When setting a URL for installation, the R7/ONLYOFFICE core:
1. Validates the `baseUrl` from the passed plugin config.
2. Automatically appends the plugin name and the `.plugin` extension to construct an archive URL (`<baseUrl>/<name>.plugin`).
3. Attempts to download this `.plugin` zip archive.
4. Extracts and installs it.

If the `.plugin` archive is absent (HTTP 404), the installation gracefully fails and returns `false`. 
Our repository had `zotero/deploy/zotero.plugin`, which meant Zotero installed smoothly. However, we had not generated or pushed the `.plugin` archives for the 4 newly created custom cell plugins. 

*Why `danula-ded`'s PluginManager Worked:*
Their manager uses a Node.js backend (`server.js`) that dynamically intercepts requests to `/api/plugins/:id/download` and seamlessly packages the plugin folder into a `.plugin` zip payload on the fly. 

## The Fix
1. We generated the corresponding `<plugin>.plugin` Zip archives for all custom cell plugins locally.
2. We placed these `.plugin` files in each plugin's `deploy/` directory alongside `config.json` or at the expected root depending on the layout.
3. We committed and pushed these `.plugin` archives to our public hosting remote.
4. We can now ensure that any new plugins added to the catalog *must* include the `.plugin` bundled archive.

## Checklist for Future Custom Plugins
- [ ] Create the plugin UI (`index.html`, `code.js`, `style.css`).
- [ ] Create a valid `config.json`.
- [ ] **Crucial:** Package the entire plugin folder (excluding the source `deploy` directory if recursive) into a `<plugin-name>.plugin` ZIP archive.
- [ ] Place the `.plugin` file in the correct location accessible via `baseUrl`.
- [ ] Add the plugin to the central catalog `store/config.json`.
