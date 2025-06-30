/**
 * AbstractDockerProvider
 * 
 * Base class for all Docker-based providers using the ServiceRegistry pattern.
 * Eliminates code duplication by providing common service management functionality.
 */

import { DockerComposeService } from '../../../services/DockerComposeService';
import { MediaProvider, ProviderConfig, ProviderModel, ProviderType } from '../../types/provider';
import { MediaCapability } from '../../types/provider';

/**
 * Abstract base class for Docker providers
 */
export abstract class AbstractDockerProvider implements MediaProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly type: ProviderType;
  abstract readonly capabilities: MediaCapability[];

  protected dockerServiceManager?: DockerComposeService;
  private initializationPromise?: Promise<void>;

  constructor() {
    // Immediately start service initialization
    this.initializationPromise = this.initializeService().catch(error => {
      console.error(`Failed to initialize ${this.id}:`, error);
    });
  }

  /**
   * Initialize the service from ServiceRegistry
   */
  private async initializeService(): Promise<void> {
    const serviceUrl = this.getServiceUrl();
    if (!serviceUrl) {
      console.warn(`No service URL provided for ${this.id}`);
      return;
    }

    try {
      const { ServiceRegistry } = await import('../../registry/ServiceRegistry');
      const serviceRegistry = ServiceRegistry.getInstance();
      this.dockerServiceManager = await serviceRegistry.getService(serviceUrl) as any;
      
      console.log(`🔗 ${this.id} initialized with service: ${serviceUrl}`);
      
      // Call hook for additional setup
      await this.onServiceReady();
      
    } catch (error) {
      console.error(`Failed to initialize service for ${this.id}:`, error);
      throw error;
    }
  }

  /**
   * Ensure service is initialized before use
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  /**
   * Hook called after service is ready
   * Override in subclasses to perform additional setup
   */
  protected async onServiceReady(): Promise<void> {
    // Default implementation does nothing
  }

  
  /**
   * Get service URL from environment - override in subclasses
   */
  protected abstract getServiceUrl(): string | undefined;

  /**
   * Get default base URL for the service - override in subclasses
   */
  protected abstract getDefaultBaseUrl(): string;

  /**
   * Get models array for MediaProvider interface
   */
  get models(): ProviderModel[] {
    return this.getModelsForCapability(this.capabilities[0]); // Use first capability by default
  }

  /**
   * Get the Docker service instance from ServiceRegistry
   */
  protected getDockerService(): any {
    if (!this.dockerServiceManager) {
      // Auto-initialize if not configured yet
      this.initializeService().catch(error => {
        console.error(`Failed to auto-initialize service for ${this.id}:`, error);
      });
      throw new Error('Service initializing. Please wait for initialization to complete.');
    }
    return this.dockerServiceManager;
  }

  /**
   * Start the Docker service
   */
  async startService(): Promise<boolean> {
    try {
      // Ensure service is initialized before starting
      await this.ensureInitialized();
      
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
   * Check if the provider is available and ready
   */
  async isAvailable(): Promise<boolean> {
    if (!this.dockerServiceManager) {
      return false;
    }
    try {
      return this.dockerServiceManager.waitForHealthy(30000);
    } catch (error) {
      return false;
    }
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
   * Configure the provider - simplified since initialization happens in constructor
   */
  async configure(config: ProviderConfig): Promise<void> {
    // Service initialization happens in constructor, so this is essentially a no-op
    // Just ensure we're initialized
    await this.ensureInitialized();
    console.log(`✅ ${this.id} configuration verified (service initialized in constructor)`);
  }

  /**
   * Get model - automatically ensure service is initialized
   */
  async getModel(modelId: string): Promise<any> {
    // Ensure service is initialized before getting models
    await this.ensureInitialized();
    return this.createModel(modelId);
  }

  // Abstract methods that subclasses must implement
  abstract getAvailableModels(): string[];
  abstract createModel(modelId: string): Promise<any>;
  abstract getModelsForCapability(capability: MediaCapability): ProviderModel[];
}
