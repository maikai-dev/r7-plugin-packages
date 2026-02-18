# r7-plugin-packages

Registry and package source for R7 Plugin Manager.

## Structure

- `registry/plugins-index.json` - generated catalog index
- `plugins/<pluginId>/plugin-manifest.json` - version source of truth
- `plugins/<pluginId>/<version>/config.json` - install config for version
- `tools/generate_registry.js` - index generator

## Registry Output Policy

Generator emits mirror/proxy-friendly refs:

- relative `manifest_path` / `manifest_url`
- relative `icon_path` / `icon_url`
- relative `changelog_path` / `changelog_url`
- relative `package_path` / `package_url` (legacy/full)

No absolute `gitverse.ru` runtime URLs are embedded in generated index.

## Generate Registry

```bash
node tools/generate_registry.js --sync-checksums
```

Legacy full profile:

```bash
node tools/generate_registry.js --profile=full --sync-checksums
```

## Notes

- `compact` profile (`2.0.0`) is default.
- `full` profile (`1.0.0`) remains for backward compatibility.
