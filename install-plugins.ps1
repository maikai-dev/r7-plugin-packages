#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Clone, pack, and install R7-Office plugins from r7-plugin-packages.

.DESCRIPTION
    1. Clones (or pulls) the r7-plugin-packages repository
    2. Packs selected plugins using packer/pack.py
    3. Installs .plugin archives into R7-Office user sdkjs-plugins directory

.PARAMETER Plugins
    Comma-separated list of plugin names to install. Default: all 4 custom plugins.

.PARAMETER RepoUrl
    Git clone URL. Default: https://github.com/maikai-dev/r7-plugin-packages.git

.PARAMETER Branch
    Branch to checkout. Default: master

.EXAMPLE
    .\install-plugins.ps1
    .\install-plugins.ps1 -Plugins "cell-statistics,cell-formatter"
#>

param(
    [string]$Plugins = "cell-statistics,cell-formatter,data-generator,cell-converter",
    [string]$RepoUrl = "https://github.com/maikai-dev/r7-plugin-packages.git",
    [string]$Branch = "master"
)

$ErrorActionPreference = "Stop"

# --- Configuration ---
$TempDir = Join-Path $env:TEMP "r7-plugin-install"
$RepoDir = Join-Path $TempDir "r7-plugin-packages"
$R7UserPlugins = Join-Path $env:LOCALAPPDATA "R7-Office\Editors\data\sdkjs-plugins"

# Fallback: try system dir if user dir doesn't exist
if (-not (Test-Path $R7UserPlugins)) {
    $R7UserPlugins = "C:\Program Files\R7-Office\Editors\editors\sdkjs-plugins"
}

$PluginList = $Plugins -split "," | ForEach-Object { $_.Trim() }

Write-Host ""
Write-Host "=== R7-Office Plugin Installer ===" -ForegroundColor Cyan
Write-Host "Plugins:    $($PluginList -join ', ')" -ForegroundColor White
Write-Host "Target dir: $R7UserPlugins" -ForegroundColor White
Write-Host ""

# --- Step 1: Clone or pull ---
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
if (Test-Path (Join-Path $RepoDir ".git")) {
    Write-Host "[1/3] Pulling latest changes..." -ForegroundColor Yellow
    Push-Location $RepoDir
    & git fetch origin $Branch 2>&1 | Out-Null
    & git checkout $Branch 2>&1 | Out-Null
    & git reset --hard "origin/$Branch" 2>&1 | Out-Null
    Pop-Location
} else {
    Write-Host "[1/3] Cloning $RepoUrl ($Branch)..." -ForegroundColor Yellow
    if (Test-Path $RepoDir) { Remove-Item $RepoDir -Recurse -Force }
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
    & git clone --branch $Branch --depth 1 $RepoUrl $RepoDir 2>&1 | Out-Null
}
$ErrorActionPreference = $prevEAP
Write-Host "  Done." -ForegroundColor Green

# --- Step 2: Pack plugins ---
Write-Host "[2/3] Packing plugins..." -ForegroundColor Yellow
$ArtifactsDir = Join-Path $RepoDir "artifacts"
if (Test-Path $ArtifactsDir) { Remove-Item $ArtifactsDir -Recurse -Force }
New-Item -ItemType Directory -Path $ArtifactsDir -Force | Out-Null

Push-Location $RepoDir
python packer/pack.py 2>&1
Pop-Location

# Check what was created
$PackedFiles = Get-ChildItem $ArtifactsDir -Filter "*.plugin" -ErrorAction SilentlyContinue
if (-not $PackedFiles) {
    Write-Host "  ERROR: No .plugin files created!" -ForegroundColor Red
    exit 1
}
Write-Host "  Packed: $($PackedFiles.Name -join ', ')" -ForegroundColor Green

# --- Step 3: Install plugins ---
Write-Host "[3/3] Installing plugins to R7-Office..." -ForegroundColor Yellow

if (-not (Test-Path $R7UserPlugins)) {
    New-Item -ItemType Directory -Path $R7UserPlugins -Force | Out-Null
}

$installed = 0
foreach ($pluginName in $PluginList) {
    $pluginFile = Join-Path $ArtifactsDir "$pluginName.plugin"
    if (-not (Test-Path $pluginFile)) {
        Write-Host "  SKIP: ${pluginName}.plugin not found" -ForegroundColor DarkYellow
        continue
    }

    $tempExtract = Join-Path $env:TEMP "r7-plugin-extract-$pluginName"
    if (Test-Path $tempExtract) { Remove-Item $tempExtract -Recurse -Force }

    $zipCopy = Join-Path $env:TEMP "${pluginName}.zip"
    Copy-Item $pluginFile $zipCopy -Force
    Expand-Archive -Path $zipCopy -DestinationPath $tempExtract -Force
    Remove-Item $zipCopy -Force

    $configFile = Join-Path $tempExtract "config.json"
    if (-not (Test-Path $configFile)) {
        Write-Host "  ERROR: $pluginName no config.json inside archive!" -ForegroundColor Red
        Remove-Item $tempExtract -Recurse -Force
        continue
    }

    $config = Get-Content $configFile -Raw | ConvertFrom-Json
    $guid = $config.guid
    $guidFolder = ""
    if (-not $guid) {
        Write-Host "  WARN: $pluginName has no guid in config.json! Using name instead." -ForegroundColor DarkYellow
        $guidFolder = $config.name -replace "[^a-zA-Z0-9_-]", ""
        if (-not $guidFolder) {
            $guidFolder = $pluginName
        }
    } else {
        $guidFolder = $guid -replace "^asc\.", ""
    }

    $destDir = Join-Path $R7UserPlugins $guidFolder

    if ($guidFolder -eq "" -or $guidFolder -eq $null) {
        Write-Host "  ERROR: Invalid guid folder generated for $pluginName!" -ForegroundColor Red
        continue
    }

    if (Test-Path $destDir) { Remove-Item $destDir -Recurse -Force }
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Move-Item (Join-Path $tempExtract "*") $destDir -Force
    Remove-Item $tempExtract -Recurse -Force
    $installed++
    Write-Host "  Installed: $pluginName -> $guidFolder" -ForegroundColor Green
}

Write-Host ""
if ($installed -gt 0) {
    Write-Host "=== $installed plugin(s) installed successfully! ===" -ForegroundColor Cyan
    Write-Host "Restart R7-Office to see the changes." -ForegroundColor White
} else {
    Write-Host "=== No plugins were installed ===" -ForegroundColor Red
}
