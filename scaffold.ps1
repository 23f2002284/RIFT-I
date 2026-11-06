param (
    [string]$ProjectRoot = "."
)

Write-Host "🚀 Creating project folder structure in: $ProjectRoot" -ForegroundColor Cyan

# Directories to create
$dirs = @(
    "$ProjectRoot/apps/api/app/core",
    "$ProjectRoot/apps/api/app/models",
    "$ProjectRoot/apps/api/app/providers",
    "$ProjectRoot/apps/api/app/services",
    "$ProjectRoot/apps/api/app/routes",
    "$ProjectRoot/apps/api/tests",
    "$ProjectRoot/apps/api/workers",
    "$ProjectRoot/apps/api/log",
    "$ProjectRoot/apps/web"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Python __init__.py files
$initFiles = @(
    "$ProjectRoot/apps/api/app/__init__.py",
    "$ProjectRoot/apps/api/app/core/__init__.py",
    "$ProjectRoot/apps/api/app/models/__init__.py",
    "$ProjectRoot/apps/api/app/providers/__init__.py",
    "$ProjectRoot/apps/api/app/services/__init__.py",
    "$ProjectRoot/apps/api/app/routes/__init__.py",
    "$ProjectRoot/apps/api/tests/__init__.py",
    "$ProjectRoot/apps/api/workers/__init__.py"
)

foreach ($file in $initFiles) {
    if (-not (Test-Path $file)) {
        New-Item -ItemType File -Path $file -Force | Out-Null
    }
}

# .gitkeep in log
$gitKeep = "$ProjectRoot/apps/api/log/.gitkeep"
if (-not (Test-Path $gitKeep)) {
    New-Item -ItemType File -Path $gitKeep -Force | Out-Null
}

Write-Host "✅ Folder structure created successfully!`n" -ForegroundColor Green
Write-Host "apps/"
Write-Host "  api/"
Write-Host "    app/"
Write-Host "      core/"
Write-Host "      models/"
Write-Host "      providers/"
Write-Host "      services/"
Write-Host "      routes/"
Write-Host "    tests/"
Write-Host "    workers/"
Write-Host "    log/"
Write-Host "  web/"
