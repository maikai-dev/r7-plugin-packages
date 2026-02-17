# r7-plugin-packages

Каталог и пакетный реестр мини-плагинов для R7 Plugin Manager.

## Структура

- `registry/plugins-index.json` — сгенерированный индекс для менеджера.
- `plugins/<pluginId>/plugin-manifest.json` — манифест плагина.
- `plugins/<pluginId>/<version>/config.json` — install-конфиг версии.
- `plugins/<pluginId>/<version>/...` — файлы версии плагина.
- `plugins/<pluginId>/CHANGELOG.md` — история изменений.
- `tools/generate_registry.js` — генератор индекса.

## Обновление индекса локально

```bash
node tools/generate_registry.js --sync-checksums
```

## CI

Workflow `/.gitverse/workflows/generate-registry.yml` перегенерирует индекс при изменениях в `plugins/**`.
Если CI не может пушить в `master`, индекс коммитится вручную в PR.
