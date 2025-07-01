/**
 * Replicate Provider for Dynamic Loading
 * 
 * Multi-capability provider that dynamically discovers and supports:
 * - Text-to-Image models (FLUX, SDXL, Midjourney, etc.)
 * - Text-to-Video models (Luma Dream Machine, Runway, etc.)
 * - Text-to-Audio models (Voice cloning, music generation)
 * - Image-to-Image models (Upscaling, enhancement, style transfer)
 * - Video-to-Video models (Video enhancement, style transfer)
 */

import { 
  MediaProvider,
  ProviderType,
  MediaCapability,
  ProviderModel,
  ProviderConfig,
  GenerationRequest,
  GenerationResult
} from '@mediaconduit/mediaconduit/src/media/types/provider';
import { ReplicateClient, ReplicateConfig, ReplicateModelMetadata } from './ReplicateClient';
import { ReplicateTextToImageModel } from './ReplicateTextToImageModel';
import { ReplicateTextToVideoModel } from './ReplicateTextToVideoModel';
import { ReplicateTextToAudioModel } from './ReplicateTextToAudioModel';

export class ReplicateProvider implements MediaProvider {
  readonly id = 'replicate';
  readonly name = 'Replicate';
  readonly type = ProviderType.REMOTE;
  readonly capabilities = [
    MediaCapability.TEXT_TO_IMAGE,
    MediaCapability.TEXT_TO_VIDEO, 
    MediaCapability.TEXT_TO_AUDIO,
    MediaCapability.IMAGE_TO_IMAGE,
    MediaCapability.IMAGE_TO_VIDEO,
    MediaCapability.VIDEO_TO_VIDEO
  ];

  private config?: ProviderConfig;
  private client?: ReplicateClient;
  private discoveredModels = new Map<string, ProviderModel>();

  constructor() {
    // Initialize with well-known Replicate models immediately (sync constructor pattern)
    this.initializeKnownReplicateModels();
    
    // Auto-configure from environment variables if available
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (apiKey) {
      const replicateConfig: ReplicateConfig = {
        apiKey,
        timeout: 600000, // Longer timeout for AI model processing
        retries: 2,
        discovery: {
          maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
          cacheDir: './cache'
        }
      };

      this.client = new ReplicateClient(replicateConfig);
      this.config = { apiKey };
    }
    // Provider will be available with known models even without API configuration
  }

  get models(): ProviderModel[] {
    return Array.from(this.discoveredModels.values());
  }

  async configure(config: ProviderConfig): Promise<void> {
    this.config = config;

    if (!config.apiKey) {
      throw new Error('Replicate API token is required');
    }

    const replicateConfig: ReplicateConfig = {
      apiKey: config.apiKey,
      timeout: config.timeout || 600000,
      retries: config.retries || 2,
      discovery: {
        maxCacheAge: 24 * 60 * 60 * 1000,
        cacheDir: './cache' // Use default cache directory
      }
    };

    this.client = new ReplicateClient(replicateConfig);

    // Initialize known models if not already done
    if (this.discoveredModels.size === 0) {
      this.initializeKnownReplicateModels();
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      return await this.client.testConnection();
    } catch (error) {
      console.warn('Replicate availability check failed:', error);
      return false;
    }
  }

  getModelsForCapability(capability: MediaCapability): ProviderModel[] {
    return this.models.filter(model => 
      model.capabilities.includes(capability)
    );
  }

  async getHealth() {
    const isAvailable = await this.isAvailable();

    return {
      status: isAvailable ? 'healthy' as const : 'unhealthy' as const,
      uptime: process.uptime(),
      activeJobs: 0,
      queuedJobs: 0,
      lastError: isAvailable ? undefined : 'API connection failed'
    };
  }

  async getModel(modelId: string): Promise<any> {
    if (!this.client) {
      throw new Error('Provider not configured - set REPLICATE_API_TOKEN environment variable or call configure()');
    }

    // Determine model type and create appropriate model instance
    const model = this.discoveredModels.get(modelId);
    if (!model) {
      throw new Error(`Model '${modelId}' not found in known models`);
    }

    const capabilities = model.capabilities;
    
    if (capabilities.includes(MediaCapability.TEXT_TO_IMAGE)) {
      return this.createTextToImageModel(modelId);
    }
    if (capabilities.includes(MediaCapability.TEXT_TO_VIDEO)) {
      return this.createTextToVideoModel(modelId);
    }
    if (capabilities.includes(MediaCapability.TEXT_TO_AUDIO)) {
      return this.createTextToAudioModel(modelId);
    }
    
    // Fallback: assume text-to-image for unknown models
    return this.createTextToImageModel(modelId);
  }

  /**
   * Initialize with well-known Replicate models (no API calls needed)
   * These are popular, stable models across all capabilities
   */
  private initializeKnownReplicateModels(): void {
    const knownModels = [
      // Text-to-Image models (most popular)
      {
        id: 'black-forest-labs/flux-schnell',
        name: 'FLUX.1 Schnell',
        description: 'Fast and high-quality text-to-image generation',
        capabilities: [MediaCapability.TEXT_TO_IMAGE]
      },
      {
        id: 'black-forest-labs/flux-dev',
        name: 'FLUX.1 Dev', 
        description: 'FLUX.1 development model for text-to-image',
        capabilities: [MediaCapability.TEXT_TO_IMAGE]
      },
      {
        id: 'stability-ai/sdxl',
        name: 'Stable Diffusion XL',
        description: 'Stable Diffusion XL for high-quality images',
        capabilities: [MediaCapability.TEXT_TO_IMAGE]
      },
      {
        id: 'bytedance/sdxl-lightning-4step',
        name: 'SDXL Lightning',
        description: 'Ultra-fast SDXL in 4 steps',
        capabilities: [MediaCapability.TEXT_TO_IMAGE]
      },
      {
        id: 'playgroundai/playground-v2.5-1024px-aesthetic',
        name: 'Playground v2.5',
        description: 'Aesthetic-focused image generation',
        capabilities: [MediaCapability.TEXT_TO_IMAGE]
      },

      // Text-to-Video models  
      {
        id: 'lumalabs/dream-machine',
        name: 'Luma Dream Machine',
        description: 'High-quality text-to-video generation',
        capabilities: [MediaCapability.TEXT_TO_VIDEO]
      },
      {
        id: 'minimax/video-01',
        name: 'MiniMax Video-01',
        description: 'Advanced text-to-video model',
        capabilities: [MediaCapability.TEXT_TO_VIDEO]
      },
      {
        id: 'genmo/mochi-1-preview',
        name: 'Mochi-1 Preview',
        description: 'High-quality video generation model',
        capabilities: [MediaCapability.TEXT_TO_VIDEO]
      },

      // Text-to-Audio/Music models
      {
        id: 'meta/musicgen',
        name: 'MusicGen',
        description: 'Meta\'s music generation model',
        capabilities: [MediaCapability.TEXT_TO_AUDIO]
      },
      {
        id: 'suno-ai/bark',
        name: 'Bark',
        description: 'Text-to-speech with voice cloning',
        capabilities: [MediaCapability.TEXT_TO_AUDIO]
      },
      {
        id: 'afiaka87/tortoise-tts',
        name: 'Tortoise TTS',
        description: 'High-quality text-to-speech',
        capabilities: [MediaCapability.TEXT_TO_AUDIO]
      },

      // Image-to-Image models
      {
        id: 'nightmareai/real-esrgan',
        name: 'Real-ESRGAN',
        description: 'Image upscaling and enhancement',
        capabilities: [MediaCapability.IMAGE_TO_IMAGE]
      },
      {
        id: 'tencentarc/gfpgan',
        name: 'GFPGAN',
        description: 'Face restoration and enhancement',
        capabilities: [MediaCapability.IMAGE_TO_IMAGE]
      },

      // Image-to-Video models
      {
        id: 'stability-ai/stable-video-diffusion',
        name: 'Stable Video Diffusion',
        description: 'Generate videos from images',
        capabilities: [MediaCapability.IMAGE_TO_VIDEO]
      }
    ];

    knownModels.forEach(modelDef => {
      const providerModel: ProviderModel = {
        id: modelDef.id,
        name: modelDef.name,
        description: modelDef.description,
        capabilities: modelDef.capabilities,
        parameters: {
          prompt: { type: 'string', description: 'Text prompt for generation' },
          width: { type: 'number', min: 128, max: 2048, default: 1024 },
          height: { type: 'number', min: 128, max: 2048, default: 1024 },
          num_inference_steps: { type: 'number', min: 1, max: 100, default: 50 },
          guidance_scale: { type: 'number', min: 0, max: 20, default: 7.5 }
        }
      };
      this.discoveredModels.set(modelDef.id, providerModel);
    });

    console.log(`[ReplicateProvider] Initialized ${knownModels.length} known Replicate models`);
  }

  // TextToImageProvider methods
  async createTextToImageModel(modelId: string): Promise<any> {
    if (!this.client) {
      throw new Error('Provider not configured');
    }

    const modelMetadata = await this.getModelMetadata(modelId);
    
    return new ReplicateTextToImageModel({
      client: this.client,
      modelMetadata,
      replicateClient: await this.getReplicateClient()
    });
  }

  getSupportedTextToImageModels(): string[] {
    return this.getModelsForCapability(MediaCapability.TEXT_TO_IMAGE).map(m => m.id);
  }

  supportsTextToImageModel(modelId: string): boolean {
    const model = this.discoveredModels.get(modelId);
    return model?.capabilities.includes(MediaCapability.TEXT_TO_IMAGE) || false;
  }

  // TextToVideoProvider methods
  async createTextToVideoModel(modelId: string): Promise<any> {
    if (!this.client) {
      throw new Error('Provider not configured');
    }

    const modelMetadata = await this.getModelMetadata(modelId);
    
    return new ReplicateTextToVideoModel({
      client: this.client,
      modelMetadata,
      replicateClient: await this.getReplicateClient()
    });
  }

  getSupportedTextToVideoModels(): string[] {
    return this.getModelsForCapability(MediaCapability.TEXT_TO_VIDEO).map(m => m.id);
  }

  supportsTextToVideoModel(modelId: string): boolean {
    const model = this.discoveredModels.get(modelId);
    return model?.capabilities.includes(MediaCapability.TEXT_TO_VIDEO) || false;
  }

  // TextToAudioProvider methods
  async createTextToAudioModel(modelId: string): Promise<any> {
    if (!this.client) {
      throw new Error('Provider not configured');
    }

    const modelMetadata = await this.getModelMetadata(modelId);
    
    return new ReplicateTextToAudioModel({
      client: this.client,
      modelMetadata,
      replicateClient: await this.getReplicateClient()
    });
  }

  getSupportedTextToAudioModels(): string[] {
    return this.getModelsForCapability(MediaCapability.TEXT_TO_AUDIO).map(m => m.id);
  }

  supportsTextToAudioModel(modelId: string): boolean {
    const model = this.discoveredModels.get(modelId);
    return model?.capabilities.includes(MediaCapability.TEXT_TO_AUDIO) || false;
  }

  // Service management
  async startService(): Promise<boolean> {
    return await this.isAvailable();
  }

  async stopService(): Promise<boolean> {
    // Remote API - no service to stop
    return true;
  }

  async getServiceStatus(): Promise<{ running: boolean; healthy: boolean; error?: string }> {
    const isAvailable = await this.isAvailable();
    return {
      running: true, // Remote APIs are always "running"
      healthy: isAvailable,
      error: isAvailable ? undefined : 'API connection failed'
    };
  }

  // Helper methods
  private async getModelMetadata(modelId: string): Promise<ReplicateModelMetadata> {
    if (!this.client) {
      throw new Error('Provider not configured');
    }

    // First check if we have it as a known model
    const knownModel = this.discoveredModels.get(modelId);
    if (knownModel) {
      // Convert ProviderModel to ReplicateModelMetadata format
      return {
        id: modelId,
        owner: modelId.split('/')[0] || 'unknown',
        name: knownModel.name,
        description: knownModel.description || 'Replicate model',
        category: this.getCategoryFromCapabilities(knownModel.capabilities),
        tags: [],
        visibility: 'public' as const,
        run_count: 0,
        parameters: this.convertParameters(knownModel.parameters || {}),
        capabilities: knownModel.capabilities.map(c => c.toString()),
        pricing: 'usage-based',
        lastUpdated: Date.now()
      };
    }

    // Fall back to API discovery
    return await this.client.getModelMetadata(modelId);
  }

  private getCategoryFromCapabilities(capabilities: MediaCapability[]): string {
    if (capabilities.includes(MediaCapability.TEXT_TO_IMAGE)) return 'text-to-image';
    if (capabilities.includes(MediaCapability.TEXT_TO_VIDEO)) return 'text-to-video';
    if (capabilities.includes(MediaCapability.TEXT_TO_AUDIO)) return 'text-to-audio';
    if (capabilities.includes(MediaCapability.IMAGE_TO_IMAGE)) return 'image-to-image';
    if (capabilities.includes(MediaCapability.IMAGE_TO_VIDEO)) return 'image-to-video';
    if (capabilities.includes(MediaCapability.VIDEO_TO_VIDEO)) return 'video-to-video';
    return 'other';
  }

  private async getReplicateClient() {
    if (!this.config?.apiKey) {
      throw new Error('Provider not configured with API key');
    }

    const Replicate = (await import('replicate')).default;
    return new Replicate({ auth: this.config.apiKey });
  }

  private convertParameters(parameters: Record<string, any>): Record<string, any> {
    // Convert ProviderModel parameters to ReplicateModelMetadata format
    const converted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'object' && value !== null) {
        converted[key] = {
          type: value.type || 'string',
          description: value.description || `${key} parameter`,
          required: value.required || false,
          default: value.default,
          minimum: value.min,
          maximum: value.max,
          enum: value.enum
        };
      } else {
        converted[key] = {
          type: 'string',
          description: `${key} parameter`,
          default: value
        };
      }
    }
    
    return converted;
  }
}
