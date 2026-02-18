# r7-plugin-packages

Каталог и реестр мини-плагинов для R7 Plugin Manager.

## Структура

- `registry/plugins-index.json` - сгенерированный индекс для менеджера.
- `plugins/<pluginId>/plugin-manifest.json` - manifest плагина (источник версий, `package_path`, `checksum_sha256`).
- `plugins/<pluginId>/<version>/config.json` - install-конфиг версии.
- `plugins/<pluginId>/<version>/...` - файлы версии плагина.
- `plugins/<pluginId>/CHANGELOG.md` - история изменений.
- `tools/generate_registry.js` - генератор индекса.

## Профили генерации реестра

- По умолчанию: `compact` (`schema_version: 2.0.0`) - только карточки + `manifest_url`.
- Legacy: `full` (`schema_version: 1.0.0`) - включает `package_url/checksum/versions`.

## Обновление индекса локально

```bash
node tools/generate_registry.js --sync-checksums
```

Для legacy-профиля:

```bash
node tools/generate_registry.js --profile=full --sync-checksums
```

## CI

Workflow `/.gitverse/workflows/generate-registry.yml` перегенерирует индекс при изменениях в `plugins/**`.
Если CI не может пушить в `master`, индекс коммитится вручную в PR.
