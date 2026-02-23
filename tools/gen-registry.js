const fs = require('fs');
const path = require('path');

const repo = process.cwd();
const base = 'https://maikai.gitverse.site/r7-plugin-packages/';
const storeConfigPath = path.join(repo, 'store', 'config.json');
const manifestsRoot = path.join(repo, 'sdkjs-plugins', 'content');
const registryRoot = path.join(repo, 'store', 'registry');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function pickLocale(dict, fallback) {
  if (!dict || typeof dict !== 'object') return fallback;
  return dict.ru || dict.en || dict['ru-RU'] || dict['en-US'] || fallback;
}

function resolveIcon(slug, variation) {
  const basePath = `${base}sdkjs-plugins/content/${slug}/`;
  if (variation && variation.store && variation.store.icons && variation.store.icons.light) {
    return `${basePath}${variation.store.icons.light}/icon.png`;
  }
  if (variation && Array.isArray(variation.icons2) && variation.icons2.length) {
    const light = variation.icons2.find((x) => x && x.style === 'light') || variation.icons2[0];
    if (light && light['100%'] && light['100%'].normal) return `${basePath}${light['100%'].normal}`;
    if (light && light['*'] && light['*'].normal) return `${basePath}${light['*'].normal}`;
  }
  if (variation && Array.isArray(variation.icons) && variation.icons.length && typeof variation.icons[0] === 'string') {
    return `${basePath}${variation.icons[0]}`;
  }
  return `${basePath}resources/img/icon.png`;
}

const rawList = readJson(storeConfigPath);
const slugs = rawList.map((x) => (typeof x === 'string' ? x : x.name)).filter(Boolean);

const full = [];
for (const slug of slugs) {
  const manifestPath = path.join(manifestsRoot, slug, 'config.json');
  if (!fs.existsSync(manifestPath)) continue;

  const mf = readJson(manifestPath);
  const vr = Array.isArray(mf.variations) && mf.variations.length ? mf.variations[0] : {};
  const category = (vr.store && Array.isArray(vr.store.categories) && vr.store.categories[0]) ? vr.store.categories[0] : 'misc';

  full.push({
    id: mf.guid || slug,
    guid: mf.guid || slug,
    slug,
    name: pickLocale(mf.nameLocale, mf.name || slug),
    version: mf.version || '0.0.0',
    description: pickLocale(vr.descriptionLocale, vr.description || ''),
    category,
    compatibility: mf.minVersion || '',
    package_url: `${base}artifacts/${slug}.plugin`,
    checksum: '',
    icon: resolveIcon(slug, vr)
  });
}

full.sort((a, b) => a.name.localeCompare(b.name));

const categories = {};
for (const item of full) {
  const cat = item.category || 'misc';
  if (!categories[cat]) categories[cat] = [];
  categories[cat].push(item);
}

const categoriesIndex = Object.keys(categories).sort().map((cat) => ({
  id: cat,
  title: cat,
  url: `${base}store/registry/categories/${cat}.json`,
  count: categories[cat].length
}));

const stamp = new Date().toISOString().slice(0, 10);

writeJson(path.join(registryRoot, 'v1-full.json'), full);
writeJson(path.join(registryRoot, 'v2-slugs.json'), slugs);
writeJson(path.join(registryRoot, 'categories', 'index.json'), categoriesIndex);
for (const [cat, list] of Object.entries(categories)) {
  writeJson(path.join(registryRoot, 'categories', `${cat}.json`), list);
}
writeJson(path.join(registryRoot, 'versioned', 'latest.json'), {
  version: `registry-${stamp}`,
  generated_at: new Date().toISOString(),
  url: `${base}store/registry/versioned/plugins.${stamp}.json`
});
writeJson(path.join(registryRoot, 'versioned', `plugins.${stamp}.json`), full);

fs.writeFileSync(
  path.join(registryRoot, 'v5-global.js'),
  `window.__R7PM_REGISTRY__ = ${JSON.stringify(full, null, 2)};\n`,
  'utf8'
);

console.log(`Generated ${full.length} plugins`);
