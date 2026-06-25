# Building the Yaar Mohammad Tola Android APK

## Why there's no `.apk` file in this download

An APK is a compiled binary that requires the **Android SDK + Gradle + a JDK**
actually running the build — there's no way to hand-author that binary as a text
file. What's included instead is a **complete, correct Capacitor Android project**:
every Gradle file, the manifest, real generated app icons, signing config, and a
one-command build script. On any machine with Android Studio installed, this
produces a real installable `.apk` in a few minutes — no app-building knowledge
required beyond running the commands below.

If you don't want to install anything locally, skip to **Option B (cloud build)** —
GitHub will build the APK for you and hand you a download link.

---

## What's already done for you

```
frontend/
├── capacitor.config.ts          ✅ app id, name, splash/status-bar config
├── android/
│   ├── build.gradle              ✅ root Gradle config
│   ├── settings.gradle           ✅ module wiring
│   ├── gradle.properties         ✅ AndroidX flags + signing property slots
│   ├── gradlew / gradlew.bat     ✅ Gradle wrapper launcher scripts
│   ├── gradle/wrapper/
│   │   └── gradle-wrapper.properties  ✅ pins Gradle 8.4
│   └── app/
│       ├── build.gradle          ✅ SDK versions, signing config, ProGuard
│       ├── proguard-rules.pro    ✅ release minification rules
│       ├── capacitor.build.gradle ✅ plugin wiring placeholder
│       └── src/main/
│           ├── AndroidManifest.xml      ✅ permissions, FCM service, FileProvider
│           ├── java/.../MainActivity.java  ✅ entry point
│           └── res/
│               ├── mipmap-{m,h,xh,xxh,xxxh}dpi/
│               │   ├── ic_launcher.png         ✅ REAL generated PNG icon
│               │   └── ic_launcher_round.png   ✅ REAL generated PNG icon
│               ├── mipmap-anydpi-v26/   ✅ adaptive icon XML (Android 8+)
│               ├── drawable/
│               │   ├── splash.png              ✅ REAL generated splash image
│               │   ├── ic_launcher_foreground.xml
│               │   └── ic_launcher_background.xml
│               ├── values/ & values-night/      ✅ theme, colors, dark mode
│               └── xml/file_paths.xml           ✅ camera/file-upload provider
├── android-assets/
│   └── play-store-icon-1024.png  ✅ REAL 1024×1024 master icon for Play listing
└── package.json                  ✅ android:* build scripts already wired in
```

**One thing is intentionally missing:** `gradle-wrapper.jar`, a ~60KB compiled
binary that Gradle's own wrapper script downloads on first run. You don't create
this by hand — `gradlew` fetches it automatically the first time you run it, *or*
Android Studio writes it the moment you open the project. Either path below
handles this with zero extra effort from you.

---

## Option A — Build locally (Android Studio, ~15 min one-time setup)

### 1. Install Android Studio
Download from https://developer.android.com/studio — it bundles the JDK, Android
SDK, platform tools, and an emulator. Just click through the default installer.

### 2. Open the project once (this generates the missing wrapper jar)
```bash
cd frontend
npx cap add android      # only if the android/ folder doesn't already exist
npx cap sync android
npx cap open android     # launches Android Studio with this project
```
Let Android Studio finish its first Gradle sync (progress bar at the bottom).
That sync step is what writes `gradle-wrapper.jar` for you automatically.

### 3. Build the APK
**From Android Studio:** `Build → Build Bundle(s)/APK(s) → Build APK(s)`
The finished file appears at:
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

**Or from the terminal** (after step 2 has run once):
```bash
cd frontend
./build-apk.sh debug
```
This script checks for Node/Java/Android SDK, builds the Next.js static export,
syncs it into the Android project, and runs the Gradle build — printing the
final APK path and an `adb install` command when done.

### 4. Install on your phone
```bash
adb install -r frontend/android/app/build/outputs/apk/debug/app-debug.apk
```
Or just copy the `.apk` file to your phone and tap it (enable
"Install unknown apps" for your file manager first).

---

## Option B — Build in the cloud (no local install needed)

A ready-to-use GitHub Actions workflow is included at
`.github/workflows/android-build.yml`. It spins up Ubuntu + JDK + Android SDK,
builds the app, and uploads the APK as a downloadable artifact.

1. Push this project to a GitHub repository.
2. In the repo, set `Settings → Secrets and variables → Actions` →
   add `NEXT_PUBLIC_API_URL` = your deployed backend URL.
3. Go to the **Actions** tab → select **Build Android APK** → **Run workflow**.
4. When it finishes (~4–6 min), open the run → scroll to **Artifacts** →
   download `yaar-mohammad-tola-debug.zip` → unzip → install the `.apk`.

No Android Studio, no SDK, nothing installed on your own machine.

---

## Building a signed RELEASE apk (for the Play Store)

A release build must be cryptographically signed with a keystore you control —
this proves all future updates come from you.

### Generate the keystore (one time, keep it forever)
```bash
keytool -genkey -v -keystore ymt-release.keystore \
  -alias ymt-key -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Yaar Mohammad Tola, OU=App, O=YMT Village, L=Bihar, S=Bihar, C=IN"
```
You'll be prompted for a store password and key password — **write these down
somewhere safe**. If you lose this keystore, you can never publish an update to
the same Play Store listing again; you'd have to create a brand-new app entry.

### Build, locally
```bash
export YMT_STORE_PASSWORD="the password you chose"
export YMT_KEY_PASSWORD="the password you chose"
cd frontend
./build-apk.sh release
```
Output: `frontend/android/app/build/outputs/apk/release/app-release.apk`

### Build, via GitHub Actions
1. Base64-encode your keystore: `base64 -i ymt-release.keystore | pbcopy` (or `xclip`/just redirect to a file on Linux).
2. Add 4 repo secrets: `YMT_KEYSTORE_BASE64`, `YMT_STORE_PASSWORD`, `YMT_KEY_ALIAS` (`ymt-key`), `YMT_KEY_PASSWORD`.
3. Run the workflow manually, choosing **release** as the build type.

---

## Before your first real build — two things to edit

**1. Point the app at your live backend.**
Open `frontend/capacitor.config.ts` and set the `server.url` to wherever you've
deployed the Next.js frontend + API (see `SETUP.md` for deployment steps):
```ts
server: {
  url: 'https://yourdomain.com',
  ...
}
```
*(Alternatively, remove the entire `server` block to bundle the app fully
offline — Capacitor will then serve the static `out/` build directly from
inside the APK instead of loading a live URL. Good for slow/unreliable
village internet, but you'll need a separate update mechanism since content
won't auto-refresh from your server.)*

**2. Firebase push notifications (optional).**
If you want push notifications to work, download `google-services.json` from
your Firebase project console and place it at `frontend/android/app/google-services.json`.
Without it, the app builds and runs fine — push notifications are simply inactive.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `SDK location not found` | Set `ANDROID_HOME` env var to your SDK path, or create `android/local.properties` with `sdk.dir=/path/to/Android/Sdk` |
| `gradlew: Permission denied` | `chmod +x frontend/android/gradlew` |
| Gradle sync fails on first open | Just retry — first sync downloads the wrapper jar and can be flaky on slow connections |
| White screen on app launch | Check `capacitor.config.ts` → `server.url` is reachable from the phone; check `adb logcat` for the actual WebView error |
| Push notifications not received | Confirm `google-services.json` is present and `FIREBASE_*` env vars are set on the backend |
