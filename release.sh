#!/bin/bash
# Usage ./release.sh major|minor|patch
set -e
npm version "$1"
git push
git push --tags