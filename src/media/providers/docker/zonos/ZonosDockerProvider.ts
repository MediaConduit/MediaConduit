/**
 * ZonosDockerProvider
 * 
 * Provider for Zonos TTS models via Docker containers.
 * Migrated to use ServiceRegistry pattern for distributed service management.
 */

import { MediaProvider, ProviderConfig, ProviderModel, ProviderType } from '../../../types/provider';
import { TextToAudioProvider } from '../../../capabilities/interfaces/TextToAudioProvider';
import { TextToAudioModel } from '../../../models/abstracts/TextToAudioModel';
import { MediaCapability } from '../../../types/provider';
import { ZonosTextToAudioModel } from './ZonosTextToAudioModel';
import { ZonosAPIClient } from './ZonosAPIClient';

/**
 * Provider for Zonos TTS models via Docker
 */
export class ZonosDockerProvider implements MediaProvider, TextToAudioProvider {
  readonly id = 'zonos-docker';
  readonly name = 'Zonos TTS (Docker)';
  readonly type = ProviderType.LOCAL;
  readonly capabilities = [MediaCapability.TEXT_TO_AUDIO];
  
  private dockerServiceManager?: any; // Generic service from ServiceRegistry
  private config?: ProviderConfig;
  private apiClient?: ZonosAPIClient;
  private isConfiguring = false; // Prevent concurrent configuration

  constructor() {
    // Auto-configure from environment variables (async but non-blocking)
    // Use setTimeout to ensure this runs after any immediate configure() calls
    setTimeout(() => {
      this.autoConfigureFromEnv().catch(error => {
        // Silent fail - provider will just not be available until manually configured
      });
    }, 100);
  }

  private async autoConfigureFromEnv(): Promise<void> {
    // Skip if already configuring or configured
    if (this.isConfiguring || this.dockerServiceManager) {
      return;
    }
    
    const serviceUrl = process.env.ZONOS_SERVICE_URL || 'github:MediaConduit/zonos-service';
    
    try {
      await this.configure({
        serviceUrl: serviceUrl,
        baseUrl: 'http://localhost:7860',
        timeout: 300000,
        retries: 1
      });
    } catch (error) {
      console.warn(`[ZonosProvider] Auto-configuration failed: ${error.message}`);
    }
  }

  /**
   * Get models array for MediaProvider interface
   */
  get models(): ProviderModel[] {
    return this.getModelsForCapability(MediaCapability.TEXT_TO_AUDIO);
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
  async getServiceStatus(): Promise<{
    running: boolean;
    healthy: boolean;
    error?: string;
  }> {
    try {
      const dockerService = this.getDockerService();
      if (dockerService && typeof dockerService.getServiceStatus === 'function') {
        const status = await dockerService.getServiceStatus();
        return {
          running: status.running || false,
          healthy: status.health === 'healthy',
          error: status.state === 'error' ? status.state : undefined
        };
      } else {
        return { running: false, healthy: false };
      }
    } catch (error) {
      console.error('Failed to get service status:', error);
      return { running: false, healthy: false };
    }
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
   * Check if the provider is available and ready
   */
  async isAvailable(): Promise<boolean> {
    if (!this.dockerServiceManager) {
      return false;
    }
    return this.dockerServiceManager.isServiceHealthy();
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

  /**
   * Get provider health status
   */
  async getHealth() {
    const status = await this.getServiceStatus();
    return {
      status: status.healthy ? 'healthy' as const : 'unhealthy' as const,
      uptime: process.uptime(),
      activeJobs: 0,
      queuedJobs: 0,
    };
  }

  /**
   * Configure the provider with ServiceRegistry
   */
  async configure(config: ProviderConfig): Promise<void> {
    // Skip if already configured with the same service URL
    if (this.dockerServiceManager && this.config?.serviceUrl === config.serviceUrl) {
      console.log('♻️ Service already configured, reusing existing configuration');
      return;
    }

    // If configuration is in progress, wait for it to complete
    if (this.isConfiguring) {
      console.log('⏳ Waiting for configuration to complete...');
      let attempts = 0;
      while (this.isConfiguring && attempts < 50) { // Max 5 seconds
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      if (this.dockerServiceManager) {
        console.log('♻️ Using completed auto-configuration');
        return;
      }
    }

    this.isConfiguring = true;
    
    try {
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
          this.apiClient = new ZonosAPIClient({ baseUrl: `http://localhost:${port}` });
        }
        
        console.log(`🔗 ZonosProvider configured to use service: ${config.serviceUrl}`);
        return;
      }
      
      // Fallback to direct configuration (legacy)
      if (config.baseUrl && !this.apiClient) {
        this.apiClient = new ZonosAPIClient({ baseUrl: config.baseUrl });
      }
    } finally {
      this.isConfiguring = false;
    }
  }
}

import { ProviderRegistry } from '../../../registry/ProviderRegistry';
ProviderRegistry.getInstance().register('zonos', ZonosDockerProvider);
