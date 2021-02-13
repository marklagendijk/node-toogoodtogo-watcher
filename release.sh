#!/bin/bash
# Usage ./release.sh major|minor|patch
set -e
echo "Going to release the following version:"
npm version "$1"
git push
git push --tags