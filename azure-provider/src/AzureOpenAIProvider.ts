/**
 * Azure OpenAI Provider with TextToText Support
 * 
 * Provider that integrates with Azure's OpenAI service.
 * Provides access to GPT models deployed on Azure infrastructure.
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
import { AzureOpenAIAPIClient, AzureOpenAIConfig } from './AzureOpenAIAPIClient';
import { TextToTextProvider } from '@mediaconduit/mediaconduit/src/media/capabilities';
import { AzureOpenAITextToTextModel } from './AzureOpenAITextToTextModel';

export class AzureOpenAIProvider implements MediaProvider, TextToTextProvider {
  readonly id = 'azure-openai';
  readonly name = 'Azure OpenAI';
  readonly type = ProviderType.REMOTE;
  readonly capabilities = [MediaCapability.TEXT_TO_TEXT];

  private config?: ProviderConfig;
  private apiClient?: AzureOpenAIAPIClient;
  private discoveredModels = new Map<string, ProviderModel>();

  constructor() {
    // Sync configuration from environment variables
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const baseUrl = process.env.AZURE_OPENAI_BASE_URL || process.env.AZURE_OPENAI_ENDPOINT;
    
    // Initialize known models regardless of environment configuration
    this.initializeKnownAzureModels();
    
    if (apiKey && baseUrl) {
      const azureConfig: AzureOpenAIConfig = {
        apiKey,
        baseUrl,
        ...(process.env.AZURE_OPENAI_API_VERSION && { apiVersion: process.env.AZURE_OPENAI_API_VERSION }),
        ...(process.env.AZURE_OPENAI_TIMEOUT && { timeout: parseInt(process.env.AZURE_OPENAI_TIMEOUT) })
      };

      this.apiClient = new AzureOpenAIAPIClient(azureConfig);
      this.config = { apiKey, baseUrl };
    }
    // Provider will be available with known models even without API configuration
  }

  get models(): ProviderModel[] {
    return Array.from(this.discoveredModels.values());
  }

  async configure(config: ProviderConfig): Promise<void> {
    this.config = config;

    if (!config.apiKey || !config.baseUrl) {
      throw new Error('Azure OpenAI API key and base URL are required');
    }

    const azureConfig: AzureOpenAIConfig = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      apiVersion: config.apiVersion,
      timeout: config.timeout
    };

    this.apiClient = new AzureOpenAIAPIClient(azureConfig);

    // Initialize known models if not already done
    if (this.discoveredModels.size === 0) {
      this.initializeKnownAzureModels();
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiClient) {
      return false;
    }

    try {
      return await this.apiClient.testConnection();
    } catch (error) {
      console.warn('Azure OpenAI availability check failed:', error);
      return false;
    }
  }

  getModelsForCapability(capability: MediaCapability): ProviderModel[] {
    if (capability === MediaCapability.TEXT_TO_TEXT) {
      return this.models;
    }
    return [];
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

  async createTextToTextModel(modelId: string): Promise<any> {
    if (!this.apiClient) {
      throw new Error('Provider not configured');
    }

    if (!this.supportsTextToTextModel(modelId)) {
      throw new Error(`Model '${modelId}' is not supported by Azure OpenAI provider`);
    }

    return new AzureOpenAITextToTextModel({ apiClient: this.apiClient, modelId });
  }

  async getModel(modelId: string): Promise<any> {
    if (!this.apiClient) {
      throw new Error('Provider not configured - set AZURE_OPENAI_API_KEY and AZURE_OPENAI_BASE_URL environment variables or call configure()');
    }

    return this.createTextToTextModel(modelId);
  }

  /**
   * Initialize with well-known Azure OpenAI models (no API calls needed)
   * These are standard Azure OpenAI deployment names
   */
  private initializeKnownAzureModels(): void {
    // Well-known Azure OpenAI models - common deployment names
    const knownModels = [
      // GPT-4 series (latest and most capable)
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-4-32k',
      
      // GPT-3.5 series (fast and cost-effective)
      'gpt-35-turbo',
      'gpt-35-turbo-16k',
      'gpt-35-turbo-instruct',
      
      // Legacy models (for compatibility)
      'text-davinci-003',
      'text-davinci-002',
      'text-curie-001',
      'text-babbage-001',
      'text-ada-001'
    ];

    knownModels.forEach(id => {
      const providerModel: ProviderModel = {
        id,
        name: this.getModelDisplayName(id),
        description: `Azure OpenAI model: ${id}`,
        capabilities: [MediaCapability.TEXT_TO_TEXT],
        parameters: {
          temperature: { type: 'number', min: 0, max: 2, default: 0.7 },
          max_tokens: { type: 'number', min: 1, max: 128000, default: 1024 },
          top_p: { type: 'number', min: 0, max: 1, default: 1 }
        }
      };
      this.discoveredModels.set(id, providerModel);
    });

    console.log(`[AzureOpenAIProvider] Initialized ${knownModels.length} known Azure OpenAI models`);
  }
  
  private getModelDisplayName(modelId: string): string {
    // Convert model IDs to friendly names
    const nameMap: { [key: string]: string } = {
      'gpt-4o': 'GPT-4o (Latest)',
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4-turbo-preview': 'GPT-4 Turbo Preview',
      'gpt-4': 'GPT-4',
      'gpt-4-32k': 'GPT-4 32K',
      'gpt-35-turbo': 'GPT-3.5 Turbo',
      'gpt-35-turbo-16k': 'GPT-3.5 Turbo 16K',
      'gpt-35-turbo-instruct': 'GPT-3.5 Turbo Instruct',
      'text-davinci-003': 'Text Davinci 003',
      'text-davinci-002': 'Text Davinci 002',
      'text-curie-001': 'Text Curie 001',
      'text-babbage-001': 'Text Babbage 001',
      'text-ada-001': 'Text Ada 001'
    };
    
    return nameMap[modelId] || modelId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  supportsTextToTextModel(modelId: string): boolean {
    return this.discoveredModels.has(modelId);
  }

  // Missing TextToTextProvider methods
  getSupportedTextToTextModels(): string[] {
    return Array.from(this.discoveredModels.keys()).filter(id => 
      this.discoveredModels.get(id)?.capabilities.includes(MediaCapability.TEXT_TO_TEXT)
    );
  }

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
    };
  }
}
