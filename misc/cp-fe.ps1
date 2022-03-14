$rootDir = Get-Location
$source = "" + $rootDir + ".\src\frontend"
$dest = "" + $rootDir + ".\dist\"

# Get-ChildItem -Path $dest -Recurse | Remove-Item -force -recurse
Copy-Item -Path $source -Destination $dest -recurse -Force