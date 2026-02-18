#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const OWNER = process.env.REGISTRY_OWNER || "Maikai";
const REPO = process.env.REGISTRY_REPO || "r7-plugin-packages";
const BRANCH = process.env.REGISTRY_BRANCH || "master";
const PROVIDER = "gitverse";
const BASE_RAW = `https://gitverse.ru/${OWNER}/${REPO}/raw/${BRANCH}`;

const ROOT = path.resolve(__dirname, "..");
const PLUGINS_DIR = path.join(ROOT, "plugins");
const REGISTRY_FILE = path.join(ROOT, "registry", "plugins-index.json");

const syncChecksums = process.argv.includes("--sync-checksums");
const profileArg = process.argv.find((arg) => arg.startsWith("--profile="));
const profile = ((profileArg && profileArg.split("=")[1]) || "compact").trim().toLowerCase();

function getSchemaVersion(currentProfile) {
  return currentProfile === "full" ? "1.0.0" : "2.0.0";
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function readCanonicalTextBuffer(filePath) {
  const text = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  return Buffer.from(text, "utf8");
}

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function semverToTuple(version) {
  const match = /^([0-9]+)\.([0-9]+)\.([0-9]+)$/.exec(version);
  assert(match, `Invalid semver: ${version}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareSemver(a, b) {
  const aa = semverToTuple(a);
  const bb = semverToTuple(b);
  for (let i = 0; i < 3; i += 1) {
    if (aa[i] > bb[i]) return 1;
    if (aa[i] < bb[i]) return -1;
  }
  return 0;
}

function stable(value) {
  if (Array.isArray(value)) {
    return value.map(stable);
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stable(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function ensureUrl(basePath) {
  return `${BASE_RAW}/${toPosix(basePath)}`;
}

function buildPluginEntry(pluginDirName, currentProfile) {
  const pluginDir = path.join(PLUGINS_DIR, pluginDirName);
  const manifestPath = path.join(pluginDir, "plugin-manifest.json");
  assert(fs.existsSync(manifestPath), `Missing manifest: ${manifestPath}`);

  const manifest = readJson(manifestPath);
  assert(manifest.plugin_id === pluginDirName, `plugin_id mismatch in ${manifestPath}`);
  assert(manifest.versions && typeof manifest.versions === "object", `versions missing in ${manifestPath}`);

  const versions = Object.keys(manifest.versions).sort((a, b) => compareSemver(b, a));
  assert(versions.length > 0, `No versions in ${manifestPath}`);
  assert(manifest.latest_version, `latest_version missing in ${manifestPath}`);
  assert(manifest.versions[manifest.latest_version], `latest_version not found in versions for ${manifestPath}`);

  let manifestChanged = false;
  const versionEntries = versions.map((version) => {
    const versionMeta = manifest.versions[version] || {};
    const packagePath = versionMeta.package_path;
    assert(packagePath, `package_path missing for ${manifest.plugin_id}@${version}`);

    const normalizedRelativePackagePath = packagePath.replace(/^\.\//, "");
    const absolutePackagePath = path.join(pluginDir, normalizedRelativePackagePath);
    assert(fs.existsSync(absolutePackagePath), `Missing package file: ${absolutePackagePath}`);

    const checksum = sha256(readCanonicalTextBuffer(absolutePackagePath));

    if (!versionMeta.checksum_sha256 || versionMeta.checksum_sha256 !== checksum) {
      if (syncChecksums) {
        versionMeta.checksum_sha256 = checksum;
        manifest.versions[version] = versionMeta;
        manifestChanged = true;
      } else {
        throw new Error(`Checksum mismatch for ${manifest.plugin_id}@${version}. Run with --sync-checksums`);
      }
    }

    return {
      version,
      package_url: ensureUrl(path.posix.join("plugins", pluginDirName, normalizedRelativePackagePath.replace(/\\/g, "/"))),
      checksum: {
        algorithm: "sha256",
        value: checksum
      },
      release_date: versionMeta.release_date || "1970-01-01",
      min_manager_version: versionMeta.min_manager_version || "0.1.0",
      r7_compatibility: versionMeta.r7_compatibility || manifest.compatibility || { min: "7.5.0", max: "9.x" },
      changelog: versionMeta.changelog || ""
    };
  });

  if (manifestChanged) {
    writeJson(manifestPath, manifest);
    console.log(`Synced checksums: ${toPosix(path.relative(ROOT, manifestPath))}`);
  }

  const latestEntry = versionEntries.find((item) => item.version === manifest.latest_version);
  assert(latestEntry, `Latest version entry not generated for ${manifest.plugin_id}`);

  const iconPath = (manifest.icon_path || "").replace(/^\.\//, "");
  const changelogPath = (manifest.changelog_path || "").replace(/^\.\//, "");

  const compactEntry = {
    plugin_id: manifest.plugin_id,
    guid: manifest.guid,
    name: manifest.name,
    summary: manifest.summary,
    category: manifest.category || "misc",
    tags: manifest.tags || [],
    icon_url: iconPath ? ensureUrl(path.posix.join("plugins", pluginDirName, iconPath)) : "",
    manifest_url: ensureUrl(path.posix.join("plugins", pluginDirName, "plugin-manifest.json")),
    changelog_url: changelogPath ? ensureUrl(path.posix.join("plugins", pluginDirName, changelogPath)) : "",
    homepage_url: manifest.homepage_url || `https://gitverse.ru/${OWNER}/${REPO}`,
    latest_version: manifest.latest_version,
    min_manager_version: (manifest.versions[manifest.latest_version] || {}).min_manager_version || "0.1.0",
    compatibility: manifest.compatibility || { r7_min: "7.5.0", r7_max: "9.x" },
    release_date: latestEntry.release_date,
    updated_at: `${latestEntry.release_date}T00:00:00.000Z`
  };

  if (currentProfile === "compact") {
    return compactEntry;
  }

  return {
    ...compactEntry,
    package_url: latestEntry.package_url,
    checksum: latestEntry.checksum,
    versions: versionEntries
  };
}

function main() {
  assert(["compact", "full"].includes(profile), `Unsupported profile: ${profile}. Use compact or full`);
  assert(fs.existsSync(PLUGINS_DIR), `Missing plugins dir: ${PLUGINS_DIR}`);

  const pluginIds = fs
    .readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const plugins = pluginIds.map((pluginId) => buildPluginEntry(pluginId, profile));

  const registry = {
    schema_version: getSchemaVersion(profile),
    generated_at: new Date().toISOString(),
    source: {
      provider: PROVIDER,
      owner: OWNER,
      repo: REPO,
      branch: BRANCH,
      plugins_root: "plugins"
    },
    total: plugins.length,
    plugins
  };

  const registryHash = sha256(Buffer.from(JSON.stringify(stable(registry)), "utf8"));
  const finalRegistry = {
    ...registry,
    registry_sha256: registryHash
  };

  fs.mkdirSync(path.dirname(REGISTRY_FILE), { recursive: true });
  writeJson(REGISTRY_FILE, finalRegistry);
  console.log(`Generated ${toPosix(path.relative(ROOT, REGISTRY_FILE))} (${plugins.length} plugins, profile=${profile})`);
}

main();
