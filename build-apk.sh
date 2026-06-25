#!/usr/bin/env bash
#
# build-apk.sh — builds a real, installable Android APK for Yaar Mohammad Tola.
#
# Run this on a machine that has: Node 18+, JDK 17, Android SDK (cmdline-tools + platform 34
# + build-tools 34), and ANDROID_HOME set. Android Studio installs all of this for you —
# easiest path is "install Android Studio, open this android/ folder once, then run this script".
#
# Usage:
#   ./build-apk.sh debug      # unsigned/debug-signed APK, install directly for testing
#   ./build-apk.sh release    # signed release APK, for distribution / Play Store
#
set -euo pipefail

MODE="${1:-debug}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "🕌  Yaar Mohammad Tola — Android APK build (${MODE})"
echo "─────────────────────────────────────────────────"

command -v node >/dev/null || { echo "❌ Node.js not found. Install Node 18+ first."; exit 1; }
command -v java >/dev/null || { echo "❌ Java not found. Install JDK 17 first."; exit 1; }
[ -n "${ANDROID_HOME:-}" ] || { echo "❌ ANDROID_HOME is not set. Install Android Studio / SDK and export ANDROID_HOME."; exit 1; }

cd "$FRONTEND_DIR"

echo "📦  Installing frontend dependencies..."
npm install

echo "🔧  Building static export (CAPACITOR_BUILD=true next build)..."
npm run export

if [ ! -d "android" ] || [ ! -f "android/app/build.gradle" ]; then
  echo "⚙️   No Capacitor android project detected — running cap add android..."
  npx cap add android
fi

echo "🔄  Syncing web assets + plugins into the Android project..."
npx cap sync android

cd android
chmod +x gradlew

if [ "$MODE" = "release" ]; then
  if [ ! -f "../../ymt-release.keystore" ] && [ ! -f "ymt-release.keystore" ]; then
    echo ""
    echo "⚠️   No release keystore found. Generating one now (you'll be prompted for passwords)."
    echo "    Keep ymt-release.keystore and its passwords SAFE — losing them means you"
    echo "    can never update this app on the Play Store under the same listing again."
    echo ""
    keytool -genkey -v -keystore ../../ymt-release.keystore \
      -alias ymt-key -keyalg RSA -keysize 2048 -validity 10000 \
      -dname "CN=Yaar Mohammad Tola, OU=App, O=YMT Village, L=Bihar, S=Bihar, C=IN"
  fi

  echo "🏗️   Building signed release APK..."
  ./gradlew assembleRelease \
    -PYMT_STORE_PASSWORD="${YMT_STORE_PASSWORD:?Set YMT_STORE_PASSWORD env var}" \
    -PYMT_KEY_PASSWORD="${YMT_KEY_PASSWORD:?Set YMT_KEY_PASSWORD env var}"

  APK_PATH="app/build/outputs/apk/release/app-release.apk"
else
  echo "🏗️   Building debug APK..."
  ./gradlew assembleDebug
  APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
fi

echo ""
if [ -f "$APK_PATH" ]; then
  echo "✅  Build succeeded!"
  echo "📱  APK: $FRONTEND_DIR/android/$APK_PATH"
  echo ""
  echo "Install on a connected device/emulator with:"
  echo "  adb install -r \"$FRONTEND_DIR/android/$APK_PATH\""
else
  echo "❌  Build finished but APK was not found at expected path: $APK_PATH"
  exit 1
fi
