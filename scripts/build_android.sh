#!/usr/bin/env bash
# Compile l'APK Android signé et crée AuMenuDeLuciole.apk.
set -uo pipefail

annotate() {
  grep -E "error:|^e: |What went wrong|FAILURE|ERR!" -A2 "$1" | sort -u | head -25 | while IFS= read -r line; do
    echo "::error title=$2::${line:0:900}"
  done
  echo "----- fin de $1 -----"; tail -80 "$1"
}

node scripts/set_version.js "$VERSION" "$BUILD"

if ! npx expo prebuild --platform android --clean > prebuild.log 2>&1; then
  annotate prebuild.log "Android (prebuild)"; exit 1
fi

cd android
chmod +x gradlew
if ! ./gradlew assembleRelease --no-daemon --stacktrace > ../gradle.log 2>&1; then
  cd ..; annotate gradle.log "Android"; exit 1
fi
cd ..
cp android/app/build/outputs/apk/release/app-release.apk AuMenuDeLuciole.apk
ls -l AuMenuDeLuciole.apk
