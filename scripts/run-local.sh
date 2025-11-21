#!/usr/bin/env bash
# Run the kiosk app end-to-end locally: mock backend, metro, emulator, build, install, and show logs.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
MOCK_DIR="$ROOT_DIR/mock-backend"
# Allow optional environment override; otherwise auto-select the first available AVD
AVD_NAME="${AVD_NAME:-}"

# If no AVD_NAME provided, pick the first available AVD
if [ -z "$AVD_NAME" ]; then
  FIRST_AVD=$(emulator -list-avds | head -n 1 || true)
  if [ -n "$FIRST_AVD" ]; then
    AVD_NAME="$FIRST_AVD"
    echo "No AVD_NAME provided; auto-selecting AVD: $AVD_NAME"
  else
    echo "No AVD_NAME provided and no AVDs found. Create an AVD in Android Studio AVD Manager or pass AVD_NAME env var."
    exit 1
  fi
fi

mkdir -p "$LOG_DIR"

echo "Project root: $ROOT_DIR"
echo "Logs: $LOG_DIR"

PIDS=()
function cleanup() {
  echo "Cleaning up..."
  for pid in "${PIDS[@]:-}"; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "Killing $pid"; kill "$pid" || true
    fi
  done
}
trap cleanup EXIT

echo "Starting mock backend... (logs: $LOG_DIR/mock.log)"
cd "$MOCK_DIR"
if [ ! -d node_modules ]; then
  echo "Installing mock-backend deps (npm install)..."
  npm install
fi
node server.js > "$LOG_DIR/mock.log" 2>&1 &
PIDS+=("$!")
sleep 0.6

echo "Starting Metro bundler... (logs: $LOG_DIR/metro.log)"
cd "$ROOT_DIR"
if [ ! -d node_modules ]; then
  echo "Installing project deps..."
  # prefer npm ci when lockfile present, otherwise npm install
  if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then
    npm ci
  else
    npm install
  fi
fi
npx react-native start > "$LOG_DIR/metro.log" 2>&1 &
PIDS+=("$!")
sleep 0.6

echo "Checking emulator "$AVD_NAME"..."
if ! adb devices | grep -q emulator; then
  echo "No emulator running. Starting AVD: $AVD_NAME"
  emulator -avd "$AVD_NAME" -no-window -gpu swiftshader_indirect > "$LOG_DIR/emulator.log" 2>&1 &
  PIDS+=("$!")
else
  echo "Emulator already running."
fi

echo "Waiting for device to be ready..."
adb wait-for-device

echo "Waiting for boot to complete (may take 30-60s)..."
BOOTED=0
for i in {1..60}; do
  if adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' | grep -q "1"; then
    BOOTED=1; break
  fi
  sleep 1
done
if [ "$BOOTED" -ne 1 ]; then
  echo "Emulator did not boot in time."; exit 1
fi

if [ -d "$ROOT_DIR/android" ]; then
  echo "Building and installing app (gradle)..."
  cd "$ROOT_DIR/android"
  ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug

  echo "Installing and launching the app..."
  cd "$ROOT_DIR"
  npx react-native run-android
else
  echo "No android/ directory found. Skipping Gradle build and app install."
  echo "If you intended to run the Android app, add the native Android project under 'android/' or initialize a bare React Native app."
  echo "See README.md for setup notes."
fi

echo "Tailing device logs (filtered). Press Ctrl+C to stop." 
echo "Logs written to $LOG_DIR"
adb logcat | grep "\[terminal\]\|\[KioskWebView\]\|\[App\]\|\[test-page\]"
