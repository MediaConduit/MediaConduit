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

  protected dockerServiceManager?: DockerComposeService; // Generic service from ServiceRegistry
  protected config?: ProviderConfig;
  protected isConfiguring = false; // Prevent concurrent configuration

  constructor() {
    // Auto-configure from environment variables (async but non-blocking)
    this.autoConfigureFromEnv().catch(error => {
      // Silent fail - provider will just not be available until manually configured
    });
  }

  /**
   * Auto-configure from environment variables
   * Override in subclasses to provide service-specific configuration
   */
  protected async autoConfigureFromEnv(): Promise<void> {
    // Skip if already configuring or configured
    if (this.isConfiguring || this.dockerServiceManager) {
      return;
    }
    
    const serviceUrl = this.getServiceUrl();
    if (!serviceUrl) return;
    
    try {
      await this.configure({
        serviceUrl: serviceUrl,
        baseUrl: this.getDefaultBaseUrl(),
        timeout: 300000,
        retries: 1
      });
    } catch (error) {
      console.warn(`[${this.id}] Auto-configuration failed: ${error.message}`);
    }
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
        const { ServiceRegistry } = await import('../../registry/ServiceRegistry');
        const serviceRegistry = ServiceRegistry.getInstance();
        this.dockerServiceManager = await serviceRegistry.getService(config.serviceUrl, config.serviceConfig) as any;
        
        // Post-configuration hook for subclasses
        await this.onServiceConfigured();
        
        console.log(`🔗 ${this.id} configured to use service: ${config.serviceUrl}`);
        return;
      }
      
      // Fallback configuration hook for subclasses
      await this.onFallbackConfiguration(config);
    } finally {
      this.isConfiguring = false;
    }
  }

  /**
   * Hook called after service is configured via ServiceRegistry
   * Override in subclasses to perform additional setup
   */
  protected async onServiceConfigured(): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Hook called for fallback configuration (when no serviceUrl)
   * Override in subclasses to handle direct configuration
   */
  protected async onFallbackConfiguration(config: ProviderConfig): Promise<void> {
    // Default implementation does nothing
  }

  // Abstract methods that subclasses must implement
  abstract getAvailableModels(): string[];
  abstract createModel(modelId: string): Promise<any>;
  abstract getModelsForCapability(capability: MediaCapability): ProviderModel[];
  abstract getModel(modelId: string): Promise<any>;
}
