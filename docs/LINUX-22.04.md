# Subscription Lens 3.1.1 — Ubuntu 22.04 x64

This desktop build uses the 3.1.1 Tauri host and embedded CC Switch provider manager. It targets Ubuntu 22.04 (amd64), with system WebKitGTK 4.1. It is not a headless CLI.

## Install / 安装 / Installeren

```bash
sudo apt update
sudo apt install ./Subscription-Lens-3.1.1-ubuntu22.04-amd64.deb
```

EN: Open **Subscription Lens** from the application menu. No terminal window is required. Use a regular desktop session, not sudo. The package installs the required WebKitGTK and Secret Service tools. R2 keys are stored in your system login keyring, which must be unlocked. Codex account queries require an installed Codex executable. Local statistics do not require a login.

中文：安装后从应用菜单打开 **Subscription Lens**，无需终端窗口。请在普通桌面用户会话中运行，不要使用 sudo 启动。安装包会声明 WebKitGTK 和系统密钥库工具依赖。R2 密钥保存在系统登录密钥库中，使用时需解锁。查询 Codex 套餐需要已安装 Codex 程序；本地统计无需登录。

NL: Open **Subscription Lens** via het toepassingsmenu; een terminalvenster is niet nodig. Start de app als gewone desktopgebruiker, niet met sudo. Het pakket installeert de benodigde WebKitGTK- en Secret Service-hulpmiddelen. R2-sleutels worden opgeslagen in de ontgrendelde aanmeldsleutelbos. Voor Codex-accountgegevens moet Codex geïnstalleerd zijn; lokale statistieken vereisen geen aanmelding.

## Rebuild

Build on Ubuntu 22.04 x86_64 with Node.js 24, Rust and pnpm 10.12.3. Initialize the pinned `native/cc-switch-runtime` submodule.

```bash
sudo apt install build-essential curl pkg-config libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev librsvg2-dev patchelf libssl-dev \
  libsecret-tools gnome-keyring
bash scripts/build-tauri-linux.sh
```

The script applies the checked-in Subscription Lens runtime patches and embeds the original CC Switch renderer. Output: `work/linux-target/release/bundle/deb/`. The source patches preserve the upstream MIT license; see `THIRD-PARTY-NOTICES.md`.

This build does not change macOS packaging. Other Linux distributions and ARM builds are outside this validation scope.
