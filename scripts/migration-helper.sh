#!/bin/bash
# MediaConduit Repository Migration Script
# This script helps prepare the project for migration to the new repository structure

echo "🚀 MediaConduit Repository Migration Helper"
echo "============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if the package.json has the correct name
if ! grep -q '"name": "mediaconduit"' package.json; then
    echo "❌ Error: Project name in package.json is not 'mediaconduit'"
    exit 1
fi

echo "✅ Project name verified: MediaConduit"

# Verify repository structure
echo ""
echo "📁 Checking current structure..."

if [ -d "src/media/providers" ]; then
    echo "✅ Providers directory found"
    provider_count=$(find src/media/providers -type d -maxdepth 1 | wc -l)
    echo "   Found $((provider_count - 1)) provider directories"
else
    echo "❌ Providers directory not found"
fi

if [ -d "src/services" ]; then
    echo "✅ Services directory found"
    service_count=$(find src/services -type d -maxdepth 1 | wc -l)
    echo "   Found $((service_count - 1)) service directories"
else
    echo "❌ Services directory not found"
fi

# List providers for extraction
echo ""
echo "🔧 Providers ready for extraction:"
if [ -d "src/media/providers" ]; then
    for provider in src/media/providers/*/; do
        if [ -d "$provider" ]; then
            provider_name=$(basename "$provider")
            echo "   - $provider_name → mediaconduit-$provider_name-provider"
        fi
    done
fi

# List services for extraction
echo ""
echo "⚙️  Services ready for extraction:"
if [ -d "src/services" ]; then
    for service in src/services/*/; do
        if [ -d "$service" ]; then
            service_name=$(basename "$service")
            echo "   - $service_name → mediaconduit-$service_name-service"
        fi
    done
fi

echo ""
echo "📋 Next Steps:"
echo "1. Create GitHub organization 'MediaConduit'"
echo "2. Move this repository to github.com/MediaConduit/MediaConduit"
echo "3. Use the extraction tools to split providers and services"
echo "4. Update CI/CD pipelines for multi-repository setup"
echo ""
echo "💡 Tip: Run this script after each major change to verify the migration readiness"
