#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory)]
    [ValidateSet("patch", "minor", "major")]
    [string] $VersionType
)

echo "Going to release the following version:"
npm version "$VersionType"
git push
git push --tags
