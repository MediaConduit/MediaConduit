# 🚀 Service Repository Migration Guide

This guide outlines the process for extracting services from the main AutoMarket repository into individual repositories for dynamic loading.

## 📦 Services Ready for Migration

| Service | Current Port | Repository Target | Status |
|---------|-------------|-------------------|---------|
| FFMPEG | 8006 | `mediaconduit/ffmpeg-service` | ✅ Ready |
| HuggingFace | 8007 | `mediaconduit/huggingface-service` | ✅ Ready |
| Chatterbox | 8004 | `mediaconduit/chatterbox-service` | ✅ Ready |
| Kokoro | 8005 | `mediaconduit/kokoro-service` | ✅ Ready |
| Whisper | 9000 | `mediaconduit/whisper-service` | ✅ Ready |
| Ollama | 11434 | `mediaconduit/ollama-service` | ✅ Ready |
| Zonos | 7860 | `mediaconduit/zonos-service` | ✅ Ready |

## 🔧 Migration Process

### 1. Create New Repository

For each service, create a new GitHub repository:

```bash
# Example for FFMPEG service
git clone https://github.com/mediaconduit/ffmpeg-service.git
cd ffmpeg-service
```

### 2. Copy Service Files

Copy the entire service directory to the new repository:

```bash
# Copy all files from services/ffmpeg/ to new repo root
cp -r /path/to/AutoMarket/services/ffmpeg/* ./
```

### 3. Repository Structure

Each service repository should have:

```
service-repo/
├── MediaConduit.service.yml  ✅ Created
├── docker-compose.yml        ✅ Exists
├── Dockerfile               ✅ Exists (where applicable)
├── README.md                📝 Need to create
├── .gitignore               📝 Need to create
├── src/                     ✅ Exists (where applicable)
├── package.json             ✅ Exists (where applicable)
└── requirements.txt         ✅ Exists (where applicable)
```

### 4. Update Main Repository

After migrating services to separate repositories:

1. **Remove service directories** from `services/`
2. **Update provider configurations** to use GitHub URLs:

```typescript
// Before (local service)
await provider.configure({
  serviceUrl: 'ffmpeg-docker'
});

// After (GitHub service)
await provider.configure({
  serviceUrl: 'github:mediaconduit/ffmpeg-service@v1.0.0'
});
```

3. **Update documentation** with new service URLs
4. **Remove static service registrations** from DockerService classes

## 🎯 Benefits After Migration

### **Dynamic Loading**
```typescript
// Load any service version from GitHub
const service = await serviceRegistry.getService('github:mediaconduit/ffmpeg-service@v2.1.0');
```

### **Version Control**
```typescript
// Different environments can use different versions
const serviceUrl = process.env.NODE_ENV === 'production'
  ? 'github:mediaconduit/ffmpeg-service@v1.0.0'  // Stable
  : 'github:mediaconduit/ffmpeg-service@main';   // Latest
```

### **Provider Flexibility**
```typescript
// Providers can specify their exact service needs
await provider.configure({
  serviceUrl: 'github:company/custom-ffmpeg-service@gpu-optimized',
  serviceConfig: {
    enableGPU: true,
    maxConcurrent: 8
  }
});
```

## 🔄 Testing Dynamic Loading

After migration, test that services load correctly:

```typescript
import { ServiceRegistry } from './src/media/registry/ServiceRegistry';

const registry = ServiceRegistry.getInstance();

// Test loading from GitHub
const ffmpegService = await registry.getService('github:mediaconduit/ffmpeg-service');
const started = await ffmpegService.startService();
const healthy = await ffmpegService.waitForHealthy();

console.log('Service loaded and healthy:', healthy);
```

## 📋 Next Steps

1. **Create GitHub repositories** for each service
2. **Copy service files** with MediaConduit.service.yml
3. **Test dynamic loading** from new repositories
4. **Update provider configurations** to use GitHub URLs
5. **Remove local service directories** from main repo
6. **Update documentation** with new architecture

## 🎉 Result

After migration, the MediaConduit platform will have:
- **Fully decentralized services** loadable from any GitHub repository
- **Version-controlled deployments** with semantic versioning
- **Community-extensible architecture** where anyone can create services
- **Zero-configuration setup** through URL-based service dependencies
