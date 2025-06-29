# MediaConduit Restructuring Plan

## Overview
This document outlines the plan to restructure the MediaConduit project from a monolithic repository into a service/provider model architecture with multiple repositories under the `gh/MediaConduit` organization.

## Current State
- **Project Name**: MediaConduit (formerly AutoMarket/Prizm)
- **Repository**: Single monolithic repository
- **Architecture**: Unified codebase with providers, services, and core functionality

## Target Architecture

### Core Repository Structure
```
gh/MediaConduit/
├── MediaConduit/                 # Core SDK and API (this repo)
├── providers/                    # Provider implementations
│   ├── elevenlabs-provider/
│   ├── replicate-provider/
│   ├── openai-provider/
│   ├── falai-provider/
│   └── ...
├── services/                     # Service implementations
│   ├── ffmpeg-service/
│   ├── docker-compose-service/
│   ├── huggingface-service/
│   └── ...
├── tools/                        # Development and utility tools
│   ├── mediaconduit-cli/
│   ├── provider-generator/
│   └── service-generator/
└── examples/                     # Example implementations
    ├── basic-usage/
    ├── advanced-workflows/
    └── custom-providers/
```

## Restructuring Steps

### Phase 1: Core Repository Preparation
- [x] Rename project to MediaConduit
- [x] Update all references from Prizm/AutoMarket to MediaConduit
- [x] Update package.json with new repository information
- [x] Update configuration files (mediaconduit.service.yml instead of prizm.service.yml)
- [ ] Create GitHub organization `MediaConduit`
- [ ] Move repository to `gh/MediaConduit/MediaConduit`

### Phase 2: Provider Extraction
Each provider will be extracted into its own repository:

#### Target Provider Repositories:
- `elevenlabs-provider` - ElevenLabs text-to-speech provider
- `replicate-provider` - Replicate image/video generation provider
- `openai-provider` - OpenAI text and image generation provider
- `falai-provider` - Fal.ai animation and image provider
- `huggingface-provider` - Hugging Face model provider
- `together-provider` - Together AI provider
- `anthropic-provider` - Anthropic Claude provider
- `runway-provider` - Runway ML video generation provider

#### Provider Structure Template:
```
provider-name/
├── src/
│   ├── models/          # Model implementations
│   ├── transformers/    # Transform logic
│   └── index.ts        # Provider entry point
├── tests/
├── docs/
├── mediaconduit.provider.yml  # Provider configuration
├── package.json
└── README.md
```

### Phase 3: Service Extraction
Services will be extracted to handle infrastructure concerns:

#### Target Service Repositories:
- `ffmpeg-service` - Video/audio processing service
- `docker-compose-service` - Container orchestration service
- `huggingface-service` - Hugging Face model hosting service
- `file-storage-service` - Asset storage and management service

#### Service Structure Template:
```
service-name/
├── src/
│   ├── handlers/        # Request handlers
│   ├── utils/          # Utility functions
│   └── index.ts        # Service entry point
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── tests/
├── docs/
├── mediaconduit.service.yml  # Service configuration
├── package.json
└── README.md
```

### Phase 4: Core SDK Refinement
The core MediaConduit repository will focus on:
- Provider registry and loading
- Service orchestration
- API endpoints
- Type definitions and interfaces
- Dynamic loading system
- Configuration management

### Phase 5: Tooling and Development Support
- CLI tool for managing providers and services
- Generator tools for creating new providers/services
- Testing frameworks
- Documentation generators

## Configuration Changes

### New Configuration Files

#### mediaconduit.provider.yml
```yaml
name: provider-name
version: 1.0.0
description: Provider description
capabilities:
  - text-to-speech
  - image-generation
models:
  - name: model-name
    capability: text-to-speech
    parameters:
      voice_id: string
      stability: number
dependencies:
  services:
    - name: audio-processing-service
      version: "^1.0.0"
      url: "github:MediaConduit/audio-processing-service"
exports:
  provider: "./src/index.ts"
```

#### mediaconduit.service.yml
```yaml
name: service-name
version: 1.0.0
description: Service description
docker:
  composeFile: docker/docker-compose.yml
  serviceName: service-name
  image: mediaconduit/service-name:latest
  ports:
    - 8080
  healthCheck:
    url: http://localhost:8080/health
    interval: 30s
    timeout: 10s
api:
  endpoints:
    - path: /process
      method: POST
      description: Process media
```

## Benefits of This Architecture

1. **Modularity**: Each provider/service can be developed independently
2. **Scalability**: Services can be scaled individually
3. **Maintainability**: Smaller, focused repositories are easier to maintain
4. **Community Contributions**: Easier for contributors to focus on specific providers
5. **Versioning**: Independent versioning for each component
6. **Testing**: Isolated testing environments
7. **Deployment**: Flexible deployment options

## Migration Timeline

- **Week 1**: Complete core repository restructuring
- **Week 2**: Extract 2-3 major providers (ElevenLabs, Replicate, OpenAI)
- **Week 3**: Extract core services (FFmpeg, Docker Compose)
- **Week 4**: Update documentation and examples
- **Week 5**: Community testing and feedback
- **Week 6**: Full migration completion

## Next Steps

1. Create GitHub organization `MediaConduit`
2. Set up repository templates for providers and services
3. Begin extracting providers one by one
4. Update CI/CD pipelines for multi-repository setup
5. Create migration scripts for existing configurations
6. Update documentation to reflect new architecture
