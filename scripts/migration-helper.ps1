# MediaConduit Repository Migration Script (PowerShell)
# This script helps prepare the project for migration to the new repository structure

Write-Host "MediaConduit Repository Migration Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Check if the package.json has the correct name
$packageContent = Get-Content "package.json" -Raw
if ($packageContent -notmatch '"name": "mediaconduit"') {
    Write-Host "❌ Error: Project name in package.json is not 'mediaconduit'" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project name verified: MediaConduit" -ForegroundColor Green

# Verify repository structure
Write-Host ""
Write-Host "Checking current structure..." -ForegroundColor Yellow

if (Test-Path "src/media/providers") {
    Write-Host "✅ Providers directory found" -ForegroundColor Green
    $providerCount = (Get-ChildItem "src/media/providers" -Directory).Count
    Write-Host "   Found $providerCount provider directories"
} else {
    Write-Host "❌ Providers directory not found" -ForegroundColor Red
}

if (Test-Path "src/services") {
    Write-Host "✅ Services directory found" -ForegroundColor Green
    $serviceCount = (Get-ChildItem "src/services" -Directory).Count
    Write-Host "   Found $serviceCount service directories"
} else {
    Write-Host "❌ Services directory not found" -ForegroundColor Red
}

# List providers for extraction
Write-Host ""
Write-Host "Providers ready for extraction:" -ForegroundColor Magenta
if (Test-Path "src/media/providers") {
    Get-ChildItem "src/media/providers" -Directory | ForEach-Object {
        $providerName = $_.Name
        Write-Host "   - $providerName → mediaconduit-$providerName-provider"
    }
}

# List services for extraction
Write-Host ""
Write-Host "Services ready for extraction:" -ForegroundColor Magenta
if (Test-Path "src/services") {
    Get-ChildItem "src/services" -Directory | ForEach-Object {
        $serviceName = $_.Name
        Write-Host "   - $serviceName → mediaconduit-$serviceName-service"
    }
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Create GitHub organization 'MediaConduit'"
Write-Host "2. Move this repository to github.com/MediaConduit/MediaConduit"
Write-Host "3. Use the extraction tools to split providers and services"
Write-Host "4. Update CI/CD pipelines for multi-repository setup"
Write-Host ""
Write-Host "Tip: Run this script after each major change to verify the migration readiness" -ForegroundColor Yellow
