#!/bin/bash
# Usage ./release.sh major|minor|patch

npm version $1
git push
git push --tags