#!/usr/bin/env sh
# Packages the extension into dist/sidedoor-<version>.xpi
set -e
cd "$(dirname "$0")"
VERSION=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' manifest.json | head -1)
mkdir -p dist
OUT="dist/sidedoor-$VERSION.xpi"
rm -f "$OUT"
zip -q -r "$OUT" manifest.json common.js background.js content.js \
  popup.html popup.js options.html options.js style.css icons
echo "Built $OUT"
