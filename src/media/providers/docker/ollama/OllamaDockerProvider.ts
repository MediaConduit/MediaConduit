import {
  MediaProvider,
  ProviderType,
  MediaCapability,
  ProviderModel,
  ProviderConfig,
} from '../../../types/provider';
import { OllamaAPIClient } from './OllamaAPIClient';
import { TextToTextProvider } from '../../../capabilities';
import { TextToTextModel } from '../../../models/abstracts/TextToTextModel';
import { OllamaTextToTextModel } from './OllamaTextToTextModel';

export class OllamaDockerProvider implements MediaProvider, TextToTextProvider {
  readonly id = 'ollama-docker';
  readonly name = 'Ollama Docker Provider';
  readonly type = ProviderType.LOCAL;
  readonly capabilities = [MediaCapability.TEXT_TO_TEXT];
  readonly models: ProviderModel[] = [];

  private dockerServiceManager?: any; // Generic service from ServiceRegistry
  private config?: ProviderConfig;
  private apiClient?: OllamaAPIClient;
  private isConfiguring = false; // Prevent concurrent configuration
  private cachedModels: string[] = []; // Cache for available models
  private modelsLastFetched = 0; // Timestamp of last model fetch
  private readonly MODEL_CACHE_TTL = 300000; // 5 minutes cache TTL

  constructor() {
    // Auto-configure from environment variables (async but non-blocking)
    // Use setTimeout to ensure this runs after any immediate configure() calls
    setTimeout(() => {
      this.autoConfigureFromEnv().catch(error => {
        // Silent fail - provider will just not be available until manually configured
      });
    }, 100);
    
    // Start background model cache refresh (don't wait for it)
    setTimeout(() => {
      this.refreshModelsCache().catch(() => {});
    }, 1000);
  }

  private async autoConfigureFromEnv(): Promise<void> {
    // Skip if already configuring or configured
    if (this.isConfiguring || this.dockerServiceManager) {
      return;
    }
    
    const serviceUrl = process.env.OLLAMA_SERVICE_URL || 'github:MediaConduit/ollama-service';
    
    try {
      await this.configure({
        serviceUrl: serviceUrl,
        baseUrl: 'http://localhost:11434',
        timeout: 300000,
        retries: 1
      });
    } catch (error) {
      console.warn(`[OllamaProvider] Auto-configuration failed: ${error.message}`);
    }
  }

  protected async getAPIClient(): Promise<OllamaAPIClient> {
    if (!this.apiClient) {
      this.apiClient = new OllamaAPIClient();
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

  async getServiceStatus(): Promise<{ running: boolean; healthy: boolean; error?: string }> {
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

  private async refreshModelsCache(): Promise<void> {
    const now = Date.now();
    if (now - this.modelsLastFetched < this.MODEL_CACHE_TTL && this.cachedModels.length > 0) {
      return; // Cache is still fresh
    }

    try {
      const apiClient = await this.getAPIClient();
      const connected = await apiClient.testConnection();
      if (!connected) {
        console.warn('[OllamaProvider] Service not available for model refresh');
        return;
      }
      
      const installedModels = await apiClient.getInstalledModels();
      this.cachedModels = installedModels;
      this.modelsLastFetched = now;
      
      console.log(`🔄 Refreshed Ollama models cache: ${installedModels.length} models found`);
    } catch (error) {
      console.warn(`[OllamaProvider] Failed to refresh models cache: ${error.message}`);
    }
  }

  getAvailableModels(): string[] {
    // Return cached models immediately, refresh in background
    this.refreshModelsCache().catch(() => {}); // Non-blocking refresh
    return this.cachedModels;
  }

  supportsTextToTextModel(modelId: string): boolean {
    if (!modelId || typeof modelId !== 'string' || modelId.length === 0) {
      return false;
    }
    
    const availableModels = this.getAvailableModels();
    return availableModels.includes(modelId);
  }

  getSupportedTextToTextModels(): string[] {
    return this.getAvailableModels();
  }

  async createTextToTextModel(modelId: string): Promise<TextToTextModel> {
    const apiClient = await this.getAPIClient();
    
    // Ensure the model is available (pull if necessary)
    const isAvailable = await apiClient.ensureModelAvailable(modelId);
    if (!isAvailable) {
      throw new Error(`Failed to ensure model ${modelId} is available. Check Ollama connectivity and model name.`);
    }
    
    // Refresh cache after potentially pulling a new model
    this.modelsLastFetched = 0; // Force cache refresh
    await this.refreshModelsCache();
    
    return new OllamaTextToTextModel({ apiClient, modelId });
  }

  async isAvailable(): Promise<boolean> {
    if (!this.dockerServiceManager) {
      return false;
    }
    return this.dockerServiceManager.isServiceHealthy();
  }

  getModelsForCapability(capability: MediaCapability): ProviderModel[] {
    if (capability === MediaCapability.TEXT_TO_TEXT) {
      const availableModels = this.getAvailableModels();
      return availableModels.map(id => ({
        id,
        name: `Ollama ${id}`,
        description: `Local Ollama model: ${id}`,
        capabilities: [MediaCapability.TEXT_TO_TEXT],
        parameters: {},
        pricing: { inputCost: 0, outputCost: 0, currency: 'USD' },
      }));
    }
    return [];
  }

  async getModel(modelId: string): Promise<any> {
    return this.createTextToTextModel(modelId);
  }

  async getHealth() {
    const status = await this.getServiceStatus();
    return {
      status: status.healthy ? 'healthy' as const : 'unhealthy' as const,
      uptime: process.uptime(),
      activeJobs: 0,
      queuedJobs: 0,
    };
  }

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
          this.apiClient = new OllamaAPIClient({ baseUrl: `http://localhost:${port}` });
        }
        
        console.log(`🔗 OllamaProvider configured to use service: ${config.serviceUrl}`);
        return;
      }
      
      // Fallback to direct configuration (legacy)
      if (config.baseUrl && !this.apiClient) {
        this.apiClient = new OllamaAPIClient({ baseUrl: config.baseUrl });
      }
    } finally {
      this.isConfiguring = false;
    }
  }
}

import { ProviderRegistry } from '../../../registry/ProviderRegistry';
ProviderRegistry.getInstance().register('ollama', OllamaDockerProvider);
