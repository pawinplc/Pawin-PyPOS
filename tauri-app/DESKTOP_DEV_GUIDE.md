# Pawin PyPOS Desktop — Developer Guide

> **Tauri 2.0 + React 19 + Supabase**  
> A cross-platform desktop POS application for stationery inventory management.

---

## Table of Contents, Contents

- [Prerequisites](#prerequisites)
- [Running Locally (Dev Mode)](#running-locally-dev-mode)
- [Building for Production](#building-for-production)
- [GitHub Actions — Automated Builds](#github-actions--automated-builds)
- [Triggering a Release Build](#triggering-a-release-build)
- [Downloading the Built Installer](#downloading-the-built-installer)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### All Platforms
| Tool | Version | Install |
|:-----|:--------|:--------|
| Node.js | ≥ 18.x (LTS) | [nodejs.org](https://nodejs.org) or via `nvm` |
| Rust | stable | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Tauri CLI | v2 | included via `npm run tauri` |

### Linux (Ubuntu / Linux Mint)
Install required system libraries:
```bash
sudo apt update && sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  libglib2.0-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

### Windows
Install the following:
- [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) *(usually pre-installed on Windows 10/11)*

### macOS
```bash
xcode-select --install
```

---

## Running Locally (Dev Mode)

> The dev server runs the React frontend and the native Tauri window simultaneously.

### Step 1 — Install dependencies
```bash
cd tauri-app
npm install --legacy-peer-deps
```

### Step 2 — Start the dev server
```bash
npm run tauri dev
```

**What happens:**
1. Vite starts the React dev server at `http://localhost:1420`
2. Rust compiles the Tauri backend *(first run takes 3–5 minutes)*
3. A native desktop window opens with hot-reload enabled

> [!TIP]
> If you get `Error: Port 1420 is already in use`, run:
> ```bash
> fuser -k 1420/tcp   # Linux/macOS
> ```

> [!NOTE]
> The **splash screen** is only visible in the packaged app (production build). In dev mode, the main window opens directly.

---

## Building for Production

> Produces a platform-native installer (`.exe` on Windows, `.deb`/`.AppImage` on Linux).

```bash
cd tauri-app
npm run tauri build
```

Output location:
```
tauri-app/src-tauri/target/release/bundle/
├── msi/          ← Windows installer (.msi)
├── nsis/         ← Windows setup (.exe)
├── deb/          ← Debian package (.deb)
└── appimage/     ← Portable Linux binary (.AppImage)
```

> [!IMPORTANT]
> You can only build for the **current platform** (e.g., you cannot build a Windows `.exe` from Linux). Use GitHub Actions to build for multiple platforms simultaneously.

---

## GitHub Actions — Automated Builds

The workflow file is located at:
```
.github/workflows/tauri-build.yml
```

### What it does
On every version tag push (e.g., `v1.0.0`), GitHub spins up:
- **Windows runner** → builds Windows `.exe` / `.msi`
- **Ubuntu runner** → builds Linux `.deb`

Both installers are automatically attached to a **GitHub Draft Release**.

### Workflow Summary
```yaml
Trigger:  push to tag matching v*  OR  manual dispatch
Runners:  windows-latest, ubuntu-22.04
Steps:
  1. Checkout repo
  2. Setup Node.js 20
  3. Install Rust (stable)
  4. Install Linux system deps  (Ubuntu only)
  5. npm install --legacy-peer-deps
  6. tauri-apps/tauri-action → builds & uploads release assets
```

---

## Triggering a Release Build

### Option 1 — Push a Version Tag (Recommended)

```bash
# 1. Make your changes and commit
git add .
git commit -m "Your changes"
git push

# 2. Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will start automatically within seconds.

### Option 2 — Manual Trigger

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **"Build Tauri App"** from the left panel
4. Click **"Run workflow"** → **"Run workflow"**

---

## Downloading the Built Installer

Once the build finishes (≈ 5–10 minutes):

1. Go to **GitHub → Releases** tab
2. Find the new **draft release** matching your tag
3. Download the installer from **Assets**:

| File | Platform |
|:-----|:---------|
| `Pawin-PyPOS_x.x.x_x64-setup.exe` | Windows (NSIS installer) |
| `Pawin-PyPOS_x.x.x_x64.msi` | Windows (MSI package) |
| `pawin-py-pos_x.x.x_amd64.deb` | Debian / Ubuntu / Mint |

4. After testing, **publish** the draft release to make it public.

---

## Troubleshooting

### `glib-2.0` / `gobject-2.0` not found (Linux)
```bash
sudo apt install libglib2.0-dev
```

### `libwebkit2gtk-4.0-dev` not found (Ubuntu 24.04+)
```bash
# Use the 4.1 package instead:
sudo apt install libwebkit2gtk-4.1-dev
```

### Port 1420 already in use
```bash
fuser -k 1420/tcp
npm run tauri dev
```

### Rust compilation errors
```bash
rustup update stable
rustup default stable
```

### Splash screen stuck (production build only)
- Ensure `close_splashscreen` command is registered in `lib.rs`
- The handoff fires after **1.8 seconds** via `invoke('close_splashscreen')`

### First build is slow
> Rust compiles hundreds of crates on the first run. Subsequent builds are much faster thanks to caching. GitHub Actions also caches the Rust registry between runs.

---

## Project Structure

```
tauri-app/
├── splash.html              ← Splash screen HTML
├── index.html               ← App entry point
├── src/
│   ├── main.jsx             ← React root + splash handoff
│   ├── App.jsx              ← Routes & layout
│   ├── pages/               ← POS, Dashboard, Inventory...
│   ├── components/          ← Sidebar, Layout, etc.
│   └── services/
│       └── supabase.js      ← All Supabase API calls
└── src-tauri/
    ├── src/
    │   └── lib.rs           ← Rust commands (close_splashscreen, etc.)
    ├── tauri.conf.json      ← App metadata, window config, icons
    ├── Cargo.toml           ← Rust dependencies
    └── icons/               ← All platform icons (auto-generated)
```

---

*© 2026 PawinPLC — Pawin PyPOS Desktop v0.1.x*
