#!/usr/bin/env bash
# Compile l'app iPhone sans signature (SideStore la signe sur l'iPhone) et crée AuMenuDeLuciole.ipa.
# Les erreurs sont remontées en annotations GitHub (visibles sur la page de l'exécution).
set -uo pipefail

annotate() { # annotate <fichier log> <titre>
  grep -E "error:|Error:|fatal|ERR!|\[!\]" "$1" | sort -u | head -25 | while IFS= read -r line; do
    echo "::error title=$2::${line:0:900}"
  done
  echo "----- fin de $1 -----"; tail -80 "$1"
}

xcodebuild -version | head -1

# Xcode 26.2/26.3 refuse deux annotations inutiles d'expo-modules-jsi (corrigé dans Xcode 26.4+).
# On les retire : la classe est déjà déclarée SWIFT_SHARED_REFERENCE, ça ne change rien au comportement.
H=node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI-Cxx/include/RuntimeScheduler.h
if [ -f "$H" ] && grep -q SWIFT_RETURNS_RETAINED "$H"; then
  sed -i '' 's/[[:space:]]*SWIFT_RETURNS_RETAINED//g' "$H"
  echo "Correctif appliqué : $H"
fi

node scripts/set_version.js "$VERSION" "$BUILD"

if ! npx expo prebuild --platform ios --clean > prebuild.log 2>&1; then
  annotate prebuild.log "iPhone (prebuild)"; exit 1
fi
tail -20 prebuild.log

WS=$(ls -d ios/*.xcworkspace | head -1)
SCHEME=$(basename "$WS" .xcworkspace)
echo "Workspace : $WS — scheme : $SCHEME"

xcodebuild \
  -workspace "$WS" -scheme "$SCHEME" \
  -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' \
  -derivedDataPath build \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" \
  build > xcodebuild.log 2>&1
STATUS=$?
grep -E "BUILD (SUCCEEDED|FAILED)" xcodebuild.log || true

APP=$(ls -d build/Build/Products/Release-iphoneos/*.app 2>/dev/null | head -1)
EXE=""
[ -n "$APP" ] && EXE=$(/usr/libexec/PlistBuddy -c 'Print CFBundleExecutable' "$APP/Info.plist" 2>/dev/null)
if [ $STATUS -ne 0 ] || [ -z "$EXE" ] || [ ! -f "$APP/$EXE" ] || [ ! -f "$APP/main.jsbundle" ]; then
  echo "::error title=iPhone::Compilation échouée (code $STATUS, app=${APP:-absente}, exécutable=${EXE:-absent})"
  annotate xcodebuild.log "iPhone"
  exit 1
fi

rm -rf Payload && mkdir -p Payload
cp -R "$APP" Payload/
zip -qry AuMenuDeLuciole.ipa Payload
SIZE=$(stat -f%z AuMenuDeLuciole.ipa)
echo "IPA : $SIZE octets"
if [ "$SIZE" -lt 1000000 ]; then
  echo "::error title=iPhone::IPA anormalement petite ($SIZE octets)"; exit 1
fi
