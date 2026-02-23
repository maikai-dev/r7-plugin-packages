const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const R7_CDP_URL = 'http://127.0.0.1:9223';
const PLUGINS_TO_INSTALL = [
    'cell-statistics.plugin',
    'cell-formatter.plugin',
    'data-generator.plugin',
    'cell-converter.plugin'
];

async function main() {
    console.log('=== R7-Office Instant Plugin Installer ===\n');

    // Step 1: Pack the plugins
    console.log('[1/3] Packing plugins using packer/pack.py...');
    try {
        // Run the python script
        execSync('python packer/pack.py', {
            stdio: 'inherit',
            cwd: __dirname
        });
    } catch (error) {
        console.error('❌ Failed to pack plugins:', error.message);
        process.exit(1);
    }

    // Check if artifacts were created
    const artifactsDir = path.join(__dirname, 'artifacts');
    if (!fs.existsSync(artifactsDir)) {
        console.error('❌ Artifacts directory not found!');
        process.exit(1);
    }

    const packedFiles = fs.readdirSync(artifactsDir).filter(f => f.endsWith('.plugin'));
    if (packedFiles.length === 0) {
        console.error('❌ No .plugin files found in artifacts directory!');
        process.exit(1);
    }
    console.log(`✅ Packed ${packedFiles.length} plugins.\n`);

    // Step 2: Connect to R7-Office DevTools
    console.log('[2/3] Connecting to R7-Office via browser protocol...');
    let browser;
    try {
        browser = await puppeteer.connect({
            browserURL: R7_CDP_URL,
            defaultViewport: null
        });
        console.log('✅ Connected to R7-Office.');
    } catch (error) {
        console.error(`\n❌ Failed to connect to R7-Office at ${R7_CDP_URL}`);
        console.error('Make sure R7-Office is running with: --remote-debugging-port=9222');
        process.exit(1);
    }

    // Step 3: Find the editor page and inject install commands
    console.log('\n[3/3] Installing plugins instantly...');
    try {
        const pages = await browser.pages();
        // Usually the main editor is one of the first few inspectable pages
        // We try to find a page that has the AscDesktopEditor object
        let targetPage = null;

        for (const page of pages) {
            if (page.url().startsWith('chrome-extension://')) continue;

            try {
                const hasApi = await page.evaluate(() => {
                    return typeof window.AscDesktopEditor !== 'undefined' &&
                        typeof window.AscDesktopEditor.PluginInstall === 'function';
                });

                if (hasApi) {
                    targetPage = page;
                    break;
                }
            } catch (e) {
                // Ignore pages we can't evaluate on
            }
        }

        if (!targetPage) {
            // Fallback to first regular page if we couldn't detect the API cleanly
            targetPage = pages.find(p => !p.url().startsWith('devtools://') && !p.url().startsWith('chrome-extension://')) || pages[0];
            console.log('⚠️ Could not definitively verify API presence, using default window.');
        }

        let installedCount = 0;
        for (const pluginFile of PLUGINS_TO_INSTALL) {
            if (!packedFiles.includes(pluginFile)) {
                console.log(`  ⏭️  Skipping ${pluginFile} (not compiled)`);
                continue;
            }

            const absolutePath = path.join(artifactsDir, pluginFile).replace(/\\/g, '\\\\');
            console.log(`  ⚙️  Injecting: ${pluginFile}...`);

            try {
                await targetPage.evaluate((path) => {
                    if (typeof window.AscDesktopEditor === 'undefined') {
                        throw new Error("AscDesktopEditor object not found in this window context.");
                    }
                    window.AscDesktopEditor.PluginInstall(path);
                }, absolutePath.replace(/\\\\/g, '\\')); // Pass clean string, Puppeteer serializes it

                console.log(`  ✅ Installed ${pluginFile}`);
                installedCount++;

                // Brief pause between installs just to be safe
                await new Promise(r => setTimeout(r, 500));
            } catch (err) {
                console.error(`  ❌ Failed to install ${pluginFile}:`, err.message);
            }
        }

        console.log(`\n🎉 Successfully installed ${installedCount} plugins!`);
        console.log('Check the R7-Office Plugins tab (no restart required!).');
    } catch (err) {
        console.error('❌ Error during installation phase:', err);
    } finally {
        await browser.disconnect();
    }
}

main();
