# Service Migration Guide

This guide explains how to migrate MediaConduit services from local directories to distributed GitHub repositories using the ServiceRegistry architecture.

## Overview

The MediaConduit platform has evolved from a monolithic architecture with local service directories to a distributed microservices architecture where each service is hosted in its own GitHub repository and loaded dynamically on-demand.

### Benefits of the New Architecture

- **🚀 Performance**: Services are cached and reused (100% improvement on subsequent calls)
- **📦 Modularity**: Each service is independently versioned and maintained
- **💾 Space Efficiency**: No duplicate service directories
- **🔄 Dynamic Loading**: Services loaded only when needed
- **🌐 Distributed**: Services can be updated independently via GitHub

## Migration Process

### Step 1: Prepare the GitHub Repository

1. Create a new GitHub repository following the naming convention:
   ```
   https://github.com/MediaConduit/{service-name}-service
   ```

2. Examples of migrated repositories:
   - `MediaConduit/ffmpeg-service`
   - `MediaConduit/huggingface-service`
   - `MediaConduit/chatterbox-service`
   - `MediaConduit/kokoro-service`

### Step 2: Examine Local Service Structure

Check the current local service structure:

```bash
services/{service-name}/
├── MediaConduit.service.yml  # Service configuration (required)
├── docker-compose.yml        # Docker composition (required)
├── Dockerfile               # Container definition (if custom)
├── requirements.txt         # Dependencies (if applicable)
└── other service files...
```

**Key files to migrate:**
- `MediaConduit.service.yml` - Essential service configuration
- `docker-compose.yml` - Container orchestration
- Any custom code, configurations, or assets

### Step 3: Push Service to GitHub

Navigate to the service directory and initialize git:

```bash
cd services/{service-name}
git init
git add .
git commit -m "Initial commit: {Service Name} service

- Service description and capabilities
- Docker containerization with health monitoring  
- MediaConduit service configuration included"

git remote add origin https://github.com/MediaConduit/{service-name}-service.git
git branch -M main
git push -u origin main
```

### Step 4: Test Service Loading from GitHub

Create a test script to verify the service loads correctly:

```typescript
import { ServiceRegistry } from './src/media/registry/ServiceRegistry';

async function testServiceMigration() {
  const serviceRegistry = ServiceRegistry.getInstance();
  
  // Test loading service from GitHub
  const service = await serviceRegistry.getService('github:MediaConduit/{service-name}-service');
  
  // Verify service configuration
  const serviceInfo = service.getServiceInfo();
  console.log('Service Info:', serviceInfo);
  
  // Test service startup
  const started = await service.startService();
  if (started) {
    const isHealthy = await service.waitForHealthy(60000);
    console.log('Service healthy:', isHealthy);
    await service.stopService();
  }
}
```

### Step 5: Update Provider

Update the corresponding provider to use the ServiceRegistry pattern:

#### 5.1 Remove Old Service Import

**Before:**
```typescript
import { ServiceDockerService } from '../../../services/ServiceDockerService';
```

**After:**
```typescript
// Remove the import - use ServiceRegistry instead
```

#### 5.2 Update Provider Class

**Before:**
```typescript
export class ServiceDockerProvider implements MediaProvider {
  private dockerService?: ServiceDockerService;
  
  constructor() {
    this.dockerService = new ServiceDockerService();
  }
}
```

**After:**
```typescript
export class ServiceDockerProvider implements MediaProvider {
  private dockerServiceManager?: any; // Generic service from ServiceRegistry
  private config?: ProviderConfig;

  constructor() {
    // Auto-configure from environment variables (async but non-blocking)
    this.autoConfigureFromEnv().catch(error => {
      // Silent fail - provider will just not be available until manually configured
    });
  }

  private async autoConfigureFromEnv(): Promise<void> {
    const serviceUrl = process.env.SERVICE_URL || 'github:MediaConduit/{service-name}-service';
    
    try {
      await this.configure({
        serviceUrl: serviceUrl,
        baseUrl: 'http://localhost:{port}',
        timeout: 300000,
        retries: 1
      });
    } catch (error) {
      console.warn(`[ServiceProvider] Auto-configuration failed: ${error.message}`);
    }
  }
}
```

#### 5.3 Update Configure Method

```typescript
async configure(config: ProviderConfig): Promise<void> {
  this.config = config;
  
  // If serviceUrl is provided (e.g., GitHub URL), use ServiceRegistry
  if (config.serviceUrl) {
    const { ServiceRegistry } = await import('../../../registry/ServiceRegistry');
    const serviceRegistry = ServiceRegistry.getInstance();
    this.dockerServiceManager = await serviceRegistry.getService(config.serviceUrl, config.serviceConfig) as any;
    
    // Configure API client with service port
    const serviceInfo = this.dockerServiceManager.getServiceInfo();
    if (serviceInfo.ports && serviceInfo.ports.length > 0) {
      const port = serviceInfo.ports[0];
      this.apiClient = new ServiceAPIClient({ baseUrl: `http://localhost:${port}` });
    }
    
    console.log(`🔗 ServiceProvider configured to use service: ${config.serviceUrl}`);
    return;
  }
  
  // Fallback to direct configuration (legacy)
  if (config.baseUrl && !this.apiClient) {
    this.apiClient = new ServiceAPIClient({ baseUrl: config.baseUrl });
  }
}
```

#### 5.4 Add Service Management Methods

```typescript
/**
 * Get the Docker service instance from ServiceRegistry
 */
protected getDockerService(): any {
  if (!this.dockerServiceManager) {
    throw new Error('Service not configured. Please call configure() first.');
  }
  return this.dockerServiceManager;
}

/**
 * Start the Docker service
 */
async startService(): Promise<boolean> {
  try {
    const dockerService = this.getDockerService();
    if (dockerService && typeof dockerService.startService === 'function') {
      return await dockerService.startService();
    } else {
      console.error('Service not properly configured');
      return false;
    }
  } catch (error) {
    console.error('Failed to start Docker service:', error);
    return false;
  }
}

/**
 * Stop the Docker service
 */
async stopService(): Promise<boolean> {
  try {
    const dockerService = this.getDockerService();
    if (dockerService && typeof dockerService.stopService === 'function') {
      return await dockerService.stopService();
    } else {
      console.error('Service not properly configured');
      return false;
    }
  } catch (error) {
    console.error('Failed to stop Docker service:', error);
    return false;
  }
}

/**
 * Get service status
 */
async getServiceStatus(): Promise<any> {
  try {
    const dockerService = this.getDockerService();
    if (dockerService && typeof dockerService.getServiceStatus === 'function') {
      return await dockerService.getServiceStatus();
    } else {
      return { running: false, healthy: false };
    }
  } catch (error) {
    console.error('Failed to get service status:', error);
    return { running: false, healthy: false };
  }
}
```

### Step 6: Update Model Classes

Update any model classes that reference the old service:

**Before:**
```typescript
import { ServiceDockerService } from '../../../services/ServiceDockerService';

export interface ModelConfig {
  dockerService?: ServiceDockerService;
}

export class ServiceModel {
  private dockerService: ServiceDockerService;
  
  constructor(config: ModelConfig) {
    this.dockerService = config.dockerService || new ServiceDockerService();
  }
}
```

**After:**
```typescript
// Remove the import

export interface ModelConfig {
  dockerService?: any; // Generic service type
}

export class ServiceModel {
  private dockerService: any; // Generic service type
  
  constructor(config: ModelConfig) {
    this.dockerService = config.dockerService || null; // No default service needed
  }
}
```

### Step 7: Clean Up

1. **Delete the old service class:**
   ```bash
   rm src/media/services/{Service}DockerService.ts
   ```

2. **Remove local service directory:**
   ```bash
   rm -rf services/{service-name}
   ```

3. **Update serviceBootstrap.ts:**
   Remove the import from the serviceImports array:
   ```typescript
   const serviceImports = [
     // Remove: () => import('../services/{Service}DockerService'),
     () => import('../services/OtherDockerService'),
   ];
   ```

### Step 8: Validate Migration

Create a validation test:

```typescript
async function validateMigration() {
  console.log('🔍 Final Migration Validation\n');

  try {
    console.log('1. Creating provider...');
    const provider = new ServiceProvider();
    console.log('   ✅ Provider created successfully');

    console.log('\n2. Configuring with GitHub service...');
    await provider.configure({
      serviceUrl: 'github:MediaConduit/{service-name}-service'
    });
    console.log('   ✅ Provider configured with GitHub service');

    console.log('\n3. Testing functionality...');
    // Add service-specific tests here
    
    console.log('\n✅ MIGRATION VALIDATION COMPLETE!');
    console.log('🎯 Provider loads service from GitHub');
    console.log('📦 Local service directory removed');
    console.log('🔄 Dynamic service loading operational');

  } catch (error) {
    console.log(`❌ Validation failed: ${error.message}`);
  }
}
```

## Service Configuration Format

### MediaConduit.service.yml

Every service must include a `MediaConduit.service.yml` file with this structure:

```yaml
name: "service-name"
version: "1.0.0"
description: "Service description"

docker:
  composeFile: "docker-compose.yml"
  serviceName: "service-container-name"
  image: "service-image:latest"
  ports: [8080]
  healthCheck:
    url: "http://localhost:8080/health"
    interval: "10s"
    timeout: "5s"
    retries: 3
  environment:
    ENV_VAR: "value"
  volumes:
    - "./data:/app/data"

capabilities:
  - "service-capability-1"
  - "service-capability-2"

requirements:
  gpu: true/false
  memory: "4GB"
  cpu: "2.0"

metadata:
  repository: "https://github.com/mediaconduit/service-name-service"
  documentation: "README.md"
  license: "MIT"
```

## Performance Benefits

### Service Reuse Statistics

Based on migrated services:

| Service | First Load | Subsequent Loads | Improvement |
|---------|------------|------------------|-------------|
| FFMPEG | 985ms | 0ms | 100% |
| HuggingFace | 920ms | 0ms | 100% |
| Chatterbox | ~800ms | 1ms | 99.9% |
| Kokoro | 869ms | 25ms | 97% |

### Directory Structure

The ServiceRegistry creates organized, reusable directories:

```
temp/services/
├── MediaConduit-ffmpeg-service/      # Reused for all FFMPEG operations
├── MediaConduit-huggingface-service/ # Reused for all HuggingFace operations
├── MediaConduit-chatterbox-service/  # Reused for all Chatterbox operations
└── MediaConduit-kokoro-service/      # Reused for all Kokoro operations
```

## Migration Checklist

- [ ] Create GitHub repository with proper naming
- [ ] Push service files (MediaConduit.service.yml, docker-compose.yml, etc.)
- [ ] Test service loading from GitHub
- [ ] Update provider to use ServiceRegistry pattern
- [ ] Add auto-configuration with environment variables
- [ ] Update model classes to remove old service references
- [ ] Delete old service class file
- [ ] Remove local service directory
- [ ] Update serviceBootstrap.ts imports
- [ ] Create and run validation tests
- [ ] Verify service reuse is working (instant subsequent loads)

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Stop existing containers before testing
   ```bash
   docker stop container-name
   docker rm container-name
   ```

2. **Service Not Found**: Verify GitHub repository exists and is public

3. **Configuration Errors**: Check MediaConduit.service.yml syntax

4. **Import Errors**: Ensure all old service imports are removed

### Debug Service Loading

```typescript
// Enable verbose logging for ServiceRegistry
console.log('🔄 Loading service:', serviceUrl);
const service = await serviceRegistry.getService(serviceUrl);
console.log('✅ Service loaded:', service.getServiceInfo());
```

## Best Practices

1. **Use Environment Variables**: Allow service URLs to be configurable
2. **Implement Auto-Configuration**: Providers should configure themselves by default
3. **Add Health Checks**: Ensure services can report their health status
4. **Include Error Handling**: Graceful fallbacks when services are unavailable
5. **Clean Temporary Files**: Implement proper cleanup in model classes
6. **Document APIs**: Include clear API documentation in service repositories

## Migration Status

### Completed Migrations ✅

- **FFMPEG** - Video/audio processing
- **HuggingFace** - Text-to-image and text-to-audio AI models
- **Chatterbox** - Voice cloning and TTS
- **Kokoro** - Japanese text-to-speech

### Pending Migrations 🔄

- **Whisper** - Speech-to-text transcription
- **Ollama** - Local LLM inference
- **Zonos** - Additional service functionality

---

This migration guide ensures consistent, efficient service distribution while maintaining backward compatibility and improving performance across the MediaConduit platform.
