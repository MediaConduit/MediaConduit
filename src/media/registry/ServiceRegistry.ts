/**
 * Service Registry for Configuration-Driven Docker Services
 * 
 * Simple approach:
 * 1. Clone repo from GitHub URL
 * 2. Read MediaConduit.service.yml configuration
 * 3. Return DockerService configured with that yml
 */

import { DockerComposeService } from '../../services/DockerComposeService';
import * as path from 'path';

/**
 * Docker service interface
 */
export interface DockerService {
  startService(): Promise<boolean>;
  stopService(): Promise<boolean>;
  restartService(): Promise<boolean>;
  getServiceStatus(): Promise<ServiceStatus>;
  isServiceHealthy(): Promise<boolean>;
  isServiceRunning(): Promise<boolean>;
  waitForHealthy(timeoutMs?: number): Promise<boolean>;
  getDockerComposeService(): DockerComposeService;
  getServiceInfo(): ServiceInfo;
}

/**
 * Service status interface
 */
export interface ServiceStatus {
  running: boolean;
  health: 'healthy' | 'unhealthy' | 'starting' | 'none';
  state: string;
  containerId?: string;
}

/**
 * Service information interface
 */
export interface ServiceInfo {
  containerName: string;
  dockerImage: string;
  ports: number[];
  composeService: string;
  composeFile: string;
  healthCheckUrl: string;
  network: string;
  serviceDirectory: string;
}

/**
 * MediaConduit Service Configuration (from MediaConduit.service.yml)
 */
export interface MediaConduitServiceConfig {
  name: string;
  version: string;
  description?: string;
  docker: {
    composeFile: string;
    serviceName: string;
    image?: string;
    ports?: number[]; // Made optional since not all services define ports
    healthCheck?: {
      url?: string;
      endpoint?: string; // Alternative to url for relative endpoints
      interval?: string;
      timeout?: string;
      retries?: number;
    };
    environment?: Record<string, string>;
    volumes?: string[];
  };
  capabilities?: string[];
  requirements?: {
    gpu?: boolean;
    memory?: string;
    cpu?: string;
  };
}

/**
 * Error thrown when a service is not found
 */
export class ServiceNotFoundError extends Error {
  constructor(id: string) {
    super(`Service '${id}' not found in registry`);
    this.name = 'ServiceNotFoundError';
  }
}

/**
 * Error thrown when a service cannot be created
 */
export class ServiceCreationError extends Error {
  constructor(id: string, reason: string) {
    super(`Failed to create service '${id}': ${reason}`);
    this.name = 'ServiceCreationError';
  }
}

/**
 * Service Registry - Configuration-driven Docker service loading
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private serviceCache = new Map<string, DockerService>();

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Get a service by URL or ID
   * 
   * Simple process:
   * 1. Clone repo from GitHub URL
   * 2. Read MediaConduit.service.yml
   * 3. Return DockerService configured with that yml
   */
  public async getService(identifier: string, config?: any): Promise<DockerService> {
    // Check cache first
    const cached = this.serviceCache.get(identifier);
    if (cached) {
      return cached;
    }

    console.log(`🔄 Loading service: ${identifier}`);

    try {
      // Parse identifier to determine loading method
      if (this.isGitHubUrl(identifier)) {
        return await this.loadServiceFromGitHub(identifier, config);
      } else {
        throw new ServiceNotFoundError(identifier);
      }
    } catch (error) {
      console.error(`❌ Failed to load service ${identifier}:`, error);
      throw new ServiceCreationError(identifier, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Check if identifier is a GitHub URL
   */
  private isGitHubUrl(identifier: string): boolean {
    return identifier.startsWith('https://github.com/') || 
           identifier.startsWith('github:');
  }

  /**
   * Load service from GitHub repository
   * 1. Clone repo
   * 2. Read MediaConduit.service.yml  
   * 3. Return configured DockerService
   */
  private async loadServiceFromGitHub(identifier: string, userConfig?: any): Promise<DockerService> {
    const { owner, repo, ref } = this.parseGitHubUrl(identifier);
    
    console.log(`📥 Cloning service repository: ${owner}/${repo}@${ref}`);

    const path = await import('path');
    const fs = await import('fs/promises');
    
    // Use repo name instead of random hex for reusability
    const serviceDirName = `${owner}-${repo}`;
    const tmpDir = path.join(process.cwd(), 'temp', 'services', serviceDirName);
    const configPath = path.join(tmpDir, 'MediaConduit.service.yml');
    
    try {
      // Check if service directory already exists and is valid
      let needsClone = true;
      
      try {
        const stats = await fs.stat(tmpDir);
        if (stats.isDirectory()) {
          // Check if it's a valid service directory
          try {
            await fs.access(configPath);
            console.log(`📂 Service directory already exists: ${tmpDir}`);
            needsClone = false;
          } catch {
            console.log(`🧹 Invalid service directory found, will re-clone`);
            await fs.rm(tmpDir, { recursive: true, force: true });
          }
        }
      } catch (statError: any) {
        if (statError.code !== 'ENOENT') {
          console.warn(`⚠️ Directory stat warning: ${statError.message}`);
        }
      }

      if (needsClone) {
        await fs.mkdir(tmpDir, { recursive: true });

        // Clone the repository
        console.log(`📥 Cloning service repository: ${owner}/${repo}@${ref}`);
        const { execSync } = await import('child_process');
        const repoUrl = `https://github.com/${owner}/${repo}.git`;
        const cloneCommand = `git clone --depth 1 --branch ${ref} "${repoUrl}" "${tmpDir}"`;
        
        try {
          execSync(cloneCommand, { stdio: 'pipe', timeout: 180000 });
          console.log(`✅ Repository cloned successfully`);
        } catch (gitError: any) {
          console.error(`Git clone failed with branch ${ref}: ${gitError.stderr.toString()}`);
          // Fallback: try without branch specification
          const fallbackCommand = `git clone --depth 1 "${repoUrl}" "${tmpDir}"`;
          try {
            execSync(fallbackCommand, { stdio: 'pipe', timeout: 180000 });
            console.log(`✅ Repository cloned successfully (fallback)`);
          } catch (fallbackGitError: any) {
            console.error(`Git clone fallback failed: ${fallbackGitError.stderr.toString()}`);
            throw fallbackGitError; // Re-throw the error if both attempts fail
          }
        }
      }

      // Read MediaConduit.service.yml configuration
      console.log(`📋 Reading service configuration from MediaConduit.service.yml`);
      const configContent = await fs.readFile(configPath, 'utf-8');
      
      // Parse YAML configuration
      const yaml = await import('yaml');
      const serviceConfig: MediaConduitServiceConfig = yaml.parse(configContent);
      console.log('DEBUG: Parsed serviceConfig (before ConfigurableDockerService):', serviceConfig);
      console.log(`✅ Loaded service config: ${serviceConfig.name} v${serviceConfig.version}`);

      // Create DockerService with the configuration
      const dockerService = new ConfigurableDockerService(tmpDir, serviceConfig, userConfig);
      
      // Initialize port detection
      await dockerService.initializePorts();
      
      // Cache the service
      this.serviceCache.set(identifier, dockerService);
      
      console.log(`✅ Service ready: ${serviceConfig.name}`);
      return dockerService;

    } catch (error) {
      // Cleanup on error
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }

  /**
   * Parse GitHub URL into components
   */
  private parseGitHubUrl(identifier: string): { owner: string; repo: string; ref: string } {
    if (identifier.startsWith('https://github.com/')) {
      const url = identifier.replace('https://github.com/', '');
      const [ownerRepo, ref] = url.split('@');
      const [owner, repo] = ownerRepo.split('/');
      return { owner, repo, ref: ref || 'main' };
    } else if (identifier.startsWith('github:')) {
      const url = identifier.replace('github:', '');
      const [ownerRepo, ref] = url.split('@');
      const [owner, repo] = ownerRepo.split('/');
      return { owner, repo, ref: ref || 'main' };
    } else {
      throw new Error(`Invalid GitHub URL: ${identifier}`);
    }
  }

  /**
   * Clear the service cache and optionally clean up directories
   */
  public clearCache(forceReload: boolean = false): void {
    this.serviceCache.clear();
    
    if (forceReload) {
      console.log('🔄 Forcing reload of all cached services on next access');
    }
  }

  /**
   * Force refresh a specific service (clears cache and re-downloads)
   */
  public async refreshService(identifier: string): Promise<void> {
    // Remove from cache
    this.serviceCache.delete(identifier);
    
    // Clean up service directory
    if (this.isGitHubUrl(identifier)) {
      try {
        const { owner, repo } = this.parseGitHubUrl(identifier);
        const path = await import('path');
        const fs = await import('fs/promises');
        const serviceDirName = `${owner}-${repo}`;
        const tmpDir = path.join(process.cwd(), 'temp', 'services', serviceDirName);
        
        await fs.rm(tmpDir, { recursive: true, force: true });
        console.log(`🧹 Cleared service directory for refresh: ${tmpDir}`);
      } catch (error) {
        console.warn(`⚠️ Failed to clean up service directory:`, error);
      }
    }
  }
}

/**
 * ConfigurableDockerService - Generic Docker service configured from MediaConduit.service.yml
 */
class ConfigurableDockerService implements DockerService {
  private dockerComposeService: DockerComposeService;
  private serviceConfig: MediaConduitServiceConfig;
  private serviceDirectory: string;
  private assignedPorts: number[] = []; // Track dynamically assigned ports
  private detectedPorts: number[] = []; // Track detected running ports

  constructor(serviceDirectory: string, serviceConfig: MediaConduitServiceConfig, userConfig?: any) {
    this.serviceDirectory = serviceDirectory;
    this.serviceConfig = serviceConfig;
    
    // CRITICAL FIX: Handle services with or without predefined ports
    if (!this.serviceConfig.docker.ports || !Array.isArray(this.serviceConfig.docker.ports)) {
      console.log(`🎯 Service configured for pure dynamic port assignment`);
      this.serviceConfig.docker.ports = []; // Empty array for dynamic-only
    }
    
    // Assign dynamic ports (empty if no predefined ports)
    this.assignedPorts = this.assignDynamicPorts(this.serviceConfig.docker.ports);
    
    // Create DockerComposeService with the configuration
    const composeFilePath = path.resolve(serviceDirectory, this.serviceConfig.docker.composeFile);
    const healthCheckUrl = this.buildHealthCheckUrl();
    
    this.dockerComposeService = new DockerComposeService({
      composeFile: composeFilePath,
      serviceName: this.serviceConfig.docker.serviceName,
      containerName: `${this.serviceConfig.name}-${this.serviceConfig.docker.serviceName}`,
      healthCheckUrl: healthCheckUrl,
      workingDirectory: serviceDirectory
    });
  }
  
  /**
   * Initialize port detection - should be called after construction
   */
  async initializePorts(): Promise<void> {
    await this.detectRunningPorts();
  }

  private assignDynamicPorts(configuredPorts: number[]): number[] {
    // For services without predefined ports, use dynamic port assignment
    if (!configuredPorts || !Array.isArray(configuredPorts) || configuredPorts.length === 0) {
      console.log('🎯 Service configured for dynamic port assignment (no predefined ports)');
      return []; // Empty array indicates dynamic-only port assignment
    }
    
    return configuredPorts.map(port => {
      if (port === 0) {
        // Assign a random available port
        const dynamicPort = this.findAvailablePort();
        console.log(`🔄 Dynamic port assignment: 0 → ${dynamicPort}`);
        return dynamicPort;
      }
      return port;
    });
  }

  private async findAvailablePortAsync(): Promise<number> {
    const net = await import('net');
    
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.listen(0, () => {
        const port = (server.address() as any)?.port;
        server.close(() => {
          if (port) {
            resolve(port);
          } else {
            reject(new Error('Could not determine assigned port'));
          }
        });
      });
    });
  }

  private findAvailablePort(): number {
    // For now, use a simple random port in the range 30000-40000
    // In a production environment, you'd want to check if the port is actually available
    const minPort = 30000;
    const maxPort = 40000;
    
    // Try to find an available port by checking if it's in use
    for (let attempts = 0; attempts < 10; attempts++) {
      const port = Math.floor(Math.random() * (maxPort - minPort + 1)) + minPort;
      
      // Simple check - in a real implementation you'd use net.createServer() to test
      // For now, just ensure we don't reuse ports in the same session
      if (!this.isPortInUse(port)) {
        this.markPortAsUsed(port);
        return port;
      }
    }
    
    // Fallback if we can't find an available port
    const fallbackPort = Math.floor(Math.random() * (maxPort - minPort + 1)) + minPort;
    this.markPortAsUsed(fallbackPort);
    return fallbackPort;
  }

  private isPortInUse(port: number): boolean {
    // Simple session-based port tracking
    // In production, you'd check actual port availability using net module
    return ConfigurableDockerService.usedPorts.has(port);
  }

  private markPortAsUsed(port: number): void {
    ConfigurableDockerService.usedPorts.add(port);
  }

  // Static set to track used ports across all service instances
  private static usedPorts = new Set<number>();

  private buildHealthCheckUrl(): string {
    // Check for full URL first
    if (this.serviceConfig.docker.healthCheck?.url) {
      let url = this.serviceConfig.docker.healthCheck.url;
      
      // Replace __PORT__ placeholder with the actual assigned port
      if (url.includes('__PORT__') && this.assignedPorts.length > 0) {
        url = url.replace('__PORT__', this.assignedPorts[0].toString());
      }
      
      return url;
    }
    
    // Check for endpoint (relative path) - this handles the Whisper service case
    if (this.serviceConfig.docker.healthCheck?.endpoint) {
      const port = this.assignedPorts[0] || (this.serviceConfig.docker.ports?.[0]) || 8080;
      const endpoint = this.serviceConfig.docker.healthCheck.endpoint;
      return `http://localhost:${port}${endpoint}`;
    }
    
    // Fallback to default health check URL
    const port = this.assignedPorts[0] || (this.serviceConfig.docker.ports?.[0]) || 8080;
    return `http://localhost:${port}/health`;
  }

  /**
   * Detect and update ports for already running services
   */
  private async detectRunningPorts(): Promise<void> {
    try {
      const runningPorts = await this.dockerComposeService.getRunningContainerPorts();
      
      if (runningPorts.length > 0) {
        console.log(`🔍 Detected running container ports: ${runningPorts.join(', ')}`);
        this.detectedPorts = runningPorts; // Store detected ports
        this.assignedPorts = runningPorts;
        
        // Update environment variable with detected port
        if (runningPorts.length > 0) {
          const serviceNameUpper = this.serviceConfig.docker.serviceName.toUpperCase();
          process.env[`${serviceNameUpper}_HOST_PORT`] = runningPorts[0].toString();
          console.log(`🌍 Updated environment variable ${serviceNameUpper}_HOST_PORT=${runningPorts[0]} (detected)`);
        }
      } else {
        // Service not running - use dynamic port assignment (0) instead of configured ports
        console.log(`🔍 Service not running, will use dynamic ports for startup`);
        this.detectedPorts = []; // Clear detected ports
        this.assignedPorts = [0]; // Force dynamic port assignment
        
        const serviceNameUpper = this.serviceConfig.docker.serviceName.toUpperCase();
        process.env[`${serviceNameUpper}_HOST_PORT`] = '0';
        console.log(`🌍 Set environment variable ${serviceNameUpper}_HOST_PORT=0 (dynamic)`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to detect running ports for ${this.serviceConfig.name}:`, error);
      // Even on error, use dynamic ports for new services
      this.assignedPorts = [0];
      const serviceNameUpper = this.serviceConfig.docker.serviceName.toUpperCase();
      process.env[`${serviceNameUpper}_HOST_PORT`] = '0';
      console.log(`🌍 Set environment variable ${serviceNameUpper}_HOST_PORT=0 (fallback)`);
    }
  }

  async startService(): Promise<boolean> {
    // Check if service is already running
    try {
      const status = await this.getServiceStatus();
      if (status.running) {
        console.log(`🔄 Service ${this.serviceConfig.name} is already running`);
        
        // Detect actual running ports and update our assigned ports
        await this.detectRunningPorts();
        
        return true;
      }
    } catch (error) {
      console.log(`🔍 Service status check failed, proceeding with startup: ${error}`);
    }

    // Set environment variables for dynamic ports before starting
    if (this.assignedPorts.length > 0) {
      const serviceNameUpper = this.serviceConfig.docker.serviceName.toUpperCase();
      process.env[`${serviceNameUpper}_HOST_PORT`] = this.assignedPorts[0].toString();
      console.log(`🌍 Set environment variable ${serviceNameUpper}_HOST_PORT=${this.assignedPorts[0]}`);
    }
    
    console.log(`🚀 Starting service ${this.serviceConfig.name}...`);
    const startResult = await this.dockerComposeService.startService();
    
    // If service started successfully, detect the actual assigned ports
    if (startResult) {
      console.log(`🔍 Service started, detecting actual assigned ports...`);
      await this.detectRunningPorts();
    }
    
    return startResult;
  }

  async stopService(): Promise<boolean> {
    return this.dockerComposeService.stopService();
  }

  async restartService(): Promise<boolean> {
    return this.dockerComposeService.restartService();
  }

  async getServiceStatus(): Promise<ServiceStatus> {
    const status = await this.dockerComposeService.getServiceStatus();
    return {
      running: status.running,
      health: (status.health as 'healthy' | 'unhealthy' | 'starting' | 'none') || 'none',
      state: status.state || 'unknown',
      containerId: status.containerName
    };
  }

  async isServiceHealthy(): Promise<boolean> {
    const status = await this.getServiceStatus();
    return status.running && status.health === 'healthy';
  }

  async isServiceRunning(): Promise<boolean> {
    const status = await this.getServiceStatus();
    return status.running;
  }

  async waitForHealthy(timeoutMs: number = 120000): Promise<boolean> {
    return this.dockerComposeService.waitForHealthy(timeoutMs);
  }

  getDockerComposeService(): DockerComposeService {
    return this.dockerComposeService;
  }

  getServiceInfo(): ServiceInfo {
    // Prioritize detected running ports, then assigned ports, then configured ports
    const effectivePorts = this.detectedPorts.length > 0 ? this.detectedPorts :
                          this.assignedPorts.length > 0 ? this.assignedPorts :
                          (this.serviceConfig.docker.ports || []);
    
    return {
      containerName: `${this.serviceConfig.name}-${this.serviceConfig.docker.serviceName}`,
      dockerImage: this.serviceConfig.docker.image || 'unknown',
      ports: effectivePorts,
      composeService: this.serviceConfig.docker.serviceName,
      composeFile: this.serviceConfig.docker.composeFile,
      healthCheckUrl: this.buildHealthCheckUrl(),
      network: `${this.serviceConfig.name}-network`,
      serviceDirectory: this.serviceDirectory
    };
  }

  async cleanup(): Promise<boolean> {
    return this.dockerComposeService.cleanup();
  }
}

/**
 * Convenience function to get the registry instance
 */
export function getServiceRegistry(): ServiceRegistry {
  return ServiceRegistry.getInstance();
}

export default ServiceRegistry;
