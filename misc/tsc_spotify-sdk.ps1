$rootDir = Get-Location

$moduleDir = ""+ $rootDir+ "/node_modules/spotify-playback-sdk-node/"

Set-Location $moduleDir
& tsc