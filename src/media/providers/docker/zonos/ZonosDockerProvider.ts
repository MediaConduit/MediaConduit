/**
 * ZonosDockerProvider
 * 
 * Provider for Zonos TTS models via Docker containers.
 * Now extends AbstractDockerProvider to eliminate code duplication.
 */

import { ProviderModel } from '../../../types/provider';
import { TextToAudioProvider } from '../../../capabilities/interfaces/TextToAudioProvider';
import { TextToAudioModel } from '../../../models/abstracts/TextToAudioModel';
import { MediaCapability, ProviderType } from '../../../types/provider';
import { ZonosTextToAudioModel } from './ZonosTextToAudioModel';
import { ZonosAPIClient } from './ZonosAPIClient';
import { AbstractDockerProvider } from '../AbstractDockerProvider';

/**
 * Provider for Zonos TTS models via Docker
 */
export class ZonosDockerProvider extends AbstractDockerProvider implements TextToAudioProvider {
  readonly id = 'zonos-docker';
  readonly name = 'Zonos TTS (Docker)';
  readonly type = ProviderType.LOCAL;
  readonly capabilities = [MediaCapability.TEXT_TO_AUDIO];
  
  private apiClient?: ZonosAPIClient;

  /**
   * Get service URL from environment
   */
  protected getServiceUrl(): string | undefined {
    return process.env.ZONOS_SERVICE_URL || 'github:MediaConduit/zonos-service';
  }

  /**
   * Get default base URL for the service
   */
  protected getDefaultBaseUrl(): string {
    return 'http://localhost:7860';
  }

  /**
   * Hook called after service is configured via ServiceRegistry
   */
  protected async onServiceConfigured(): Promise<void> {
    // Configure API client with service port
    const serviceInfo = this.dockerServiceManager.getServiceInfo();
    if (serviceInfo.ports && serviceInfo.ports.length > 0) {
      const port = serviceInfo.ports[0];
      this.apiClient = new ZonosAPIClient({ baseUrl: `http://localhost:${port}` });
    }
  }

  /**
   * Hook called for fallback configuration (when no serviceUrl)
   */
  protected async onFallbackConfiguration(config: any): Promise<void> {
    if (config.baseUrl && !this.apiClient) {
      this.apiClient = new ZonosAPIClient({ baseUrl: config.baseUrl });
    }
  }

  /**
   * Get API client instance (lazy initialization)
   */
  private getAPIClient(): ZonosAPIClient {
    if (!this.apiClient) {
      this.apiClient = new ZonosAPIClient();
    }
    return this.apiClient;
  }

  /**
   * Get available models from this provider
   */
  getAvailableModels(): string[] {
    return [
      'zonos-tts',
      'zonos-docker-tts',
      'zonos-styletts2'
    ];
  }

  /**
   * Create a model instance
   */
  async createModel(modelId: string): Promise<TextToAudioModel> {
    return this.createTextToAudioModel(modelId);
  }

  /**
   * Create a text-to-speech model instance (TextToAudioProvider interface)
   */
  async createTextToAudioModel(modelId: string): Promise<TextToAudioModel> {
    const apiClient = this.getAPIClient();
    return new ZonosTextToAudioModel({ apiClient, modelId });
  }

  /**
   * Check if the provider supports a given model ID
   */
  supportsTextToAudioModel(modelId: string): boolean {
    return this.getAvailableModels().includes(modelId);
  }

  /**
   * Get supported model IDs
   */
  getSupportedTextToAudioModels(): string[] {
    return this.getAvailableModels();
  }

  /**
   * Get models for a specific capability
   */
  getModelsForCapability(capability: MediaCapability): ProviderModel[] {
    if (capability === MediaCapability.TEXT_TO_AUDIO) {
      return this.getAvailableModels().map(id => ({
        id,
        name: `Zonos ${id}`,
        description: `High-quality text-to-speech model: ${id}`,
        capabilities: [MediaCapability.TEXT_TO_AUDIO],
        parameters: {
          'speed': { type: 'number', default: 1.0, range: [0.5, 2.0] },
          'pitch': { type: 'number', default: 0, range: [-12, 12] },
          'voice': { type: 'string', default: 'default' }
        },
        pricing: { inputCost: 0, outputCost: 0, currency: 'USD' },
      }));
    }
    return [];
  }

  /**
   * Get a model by ID
   */
  async getModel(modelId: string): Promise<any> {
    return this.createTextToAudioModel(modelId);
  }
}

import { ProviderRegistry } from '../../../registry/ProviderRegistry';
ProviderRegistry.getInstance().register('zonos', ZonosDockerProvider);
