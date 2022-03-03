$rootDir = Get-Location
$source = "" + $rootDir + ".\src\frontend"
$dest = "" + $rootDir + ".\dist\frontend"

Copy-Item -Path $source -Destination $dest -recurse -Force