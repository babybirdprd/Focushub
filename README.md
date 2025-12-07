<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ECHFtCOVK_p4EWvHmiBmszLr1jPNcxBe

## Run Locally

**Prerequisites:** Node.js, pnpm

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   ```bash
   pnpm run dev
   ```

---

## Tauri Desktop Build

```bash
pnpm tauri build
```

---

## Tauri Android Build

### Prerequisites

1. **Install Android Studio** from https://developer.android.com/studio

2. **Install Android SDK components** via Android Studio SDK Manager:
   - Android SDK Platform
   - Android SDK Platform-Tools
   - NDK (Side by side)
   - Android SDK Build-Tools
   - Android SDK Command-line Tools

3. **Set environment variables** (PowerShell - adjust paths to your installation):
   ```powershell
   # Set JAVA_HOME to Android Studio's JBR (JetBrains Runtime)
   [System.Environment]::SetEnvironmentVariable("JAVA_HOME", "D:\Android-studio\jbr", "User")
   
   # Set ANDROID_HOME to your SDK location
   [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "D:\androidsdk", "User")
   
   # Set NDK_HOME (get the version from your ndk folder)
   $VERSION = Get-ChildItem -Name "D:\androidsdk\ndk" | Select-Object -Last 1
   [System.Environment]::SetEnvironmentVariable("NDK_HOME", "D:\androidsdk\ndk\$VERSION", "User")
   ```

4. **Refresh your current terminal session:**
   ```powershell
   [System.Environment]::GetEnvironmentVariables("User").GetEnumerator() | % { Set-Item -Path "Env:\$($_.key)" -Value $_.value }
   ```

5. **Enable Windows Developer Mode** (required for symlinks):
   - Settings → Privacy & security → For developers → Developer Mode → On

6. **Add Android Rust targets:**
   ```bash
   rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
   ```

### Initialize Tauri Android

```bash
cargo tauri android init
```

> ⚠️ If you change the `identifier` in `tauri.conf.json`, delete `src-tauri/gen/android` and re-run `cargo tauri android init`

### Build APK

```bash
pnpm tauri android build
```

Output location: `src-tauri/gen/android/app/build/outputs/apk/universal/release/`

### Signing APK for Sideloading

The build produces an **unsigned** APK. To install via Google Drive or other sideloading methods, you must sign it:

1. **Create a debug keystore** (one-time):
   ```powershell
   & "$env:JAVA_HOME\bin\keytool" -genkey -v -keystore "$env:USERPROFILE\.android\debug.keystore" -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Debug, OU=Debug, O=Debug, L=Debug, S=Debug, C=US"
   ```

2. **Sign the APK:**
   ```powershell
   & "$env:ANDROID_HOME\build-tools\35.0.0\apksigner.bat" sign --ks "$env:USERPROFILE\.android\debug.keystore" --ks-pass pass:android --key-pass pass:android --out "src-tauri\gen\android\app\build\outputs\apk\universal\release\app-signed.apk" "src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release-unsigned.apk"
   ```

3. Upload `app-signed.apk` to your phone

### Quick Testing (USB)

For faster iteration with a connected device:
```bash
pnpm tauri android dev
```
This auto-signs and installs directly to your phone.

### Troubleshooting

| Issue | Solution |
|-------|----------|
| `cargo tauri info` shows no Android | Set `JAVA_HOME`, `ANDROID_HOME`, `NDK_HOME` env vars |
| Symlink creation error | Enable Windows Developer Mode |
| "Package appears to be invalid" | APK is unsigned - sign it with apksigner |
| `frontendDist` not found | Check `tauri.conf.json` - Vite outputs to `dist/`, not `build/` |
| Changed bundle identifier | Delete `src-tauri/gen/android` and re-run `cargo tauri android init` |
