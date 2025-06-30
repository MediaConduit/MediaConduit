/**
 * Provider Registry for Elegant Provider Management
 * 
 * Implements the singleton pattern with constructor-based registration
 * for lazy instantiation and auto-configuration of providers.
 */

import { MediaProvider, MediaCapability, ProviderType, MediaConduitProviderConfig } from '../types/provider';
import { DockerMediaProvider } from '../providers/docker/DockerMediaProvider';
import { getServiceRegistry, MediaConduitServiceConfig, DockerService } from '../registry/ServiceRegistry';
import * as yaml from 'yaml';
import { URL } from 'url';
import * as path from 'path';
import * as fs from 'fs/promises';
import { execSync } from 'child_process';

/**
 * Provider constructor type
 */
export type ProviderConstructor = new () => MediaProvider;

/**
 * Parsed provider identifier for dynamic loading
 */
interface ParsedProviderIdentifier {
  type: 'npm' | 'github' | 'file';
  packageName?: string;
  version?: string;
  owner?: string;
  repo?: string;
  ref?: string;
  path?: string;
  defaultService?: string; // Name of the service within docker-compose.yml to manage
}

/**
 * Error thrown when a provider is not found
 */
export class ProviderNotFoundError extends Error {
  constructor(id: string) {
    super(`Provider '${id}' not found in registry`);
    this.name = 'ProviderNotFoundError';
  }
}

/**
 * Error thrown when a provider cannot be created
 */
export class ProviderCreationError extends Error {
  constructor(id: string, reason: string) {
    super(`Failed to create provider '${id}': ${reason}`);
    this.name = 'ProviderCreationError';
  }
}

/**
 * Provider Registry - Singleton for managing provider constructors
 * 
 * Supports:
 * - Lazy instantiation via constructors
 * - Auto-configuration from environment
 * - Error handling and graceful fallbacks
 * - Type-safe provider access
 */
export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers = new Map<string, ProviderConstructor>();
  private providerCache = new Map<string, MediaProvider>();

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  /**
   * Register a provider constructor
   */
  public register(id: string, providerClass: ProviderConstructor): void {
    this.providers.set(id, providerClass);
  }

  /**
   * Get available provider IDs
   */
  public getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is registered
   */
  public hasProvider(id: string): boolean {
    return this.providers.has(id);
  }
  /**
   * Get a provider by ID or URL with lazy instantiation
   */
  public async getProvider<T extends MediaProvider>(identifier: string): Promise<T> {
    // Handle static providers (existing behavior)
    if (this.providers.has(identifier)) {
      // Check cache first
      const cached = this.providerCache.get(identifier);
      if (cached) {
        return cached;
      }

      // Get constructor
      const ProviderClass = this.providers.get(identifier)!;
      try {
        // Create provider instance
        const provider = new ProviderClass();
        
        // Cache for future use
        this.providerCache.set(identifier, provider);
        
        return provider;
      } catch (error) {
        throw new ProviderCreationError(identifier, error instanceof Error ? error.message : String(error));
      }
    }

    // Handle dynamic providers (new behavior)
    if (this.isDynamicIdentifier(identifier)) {
      return this.loadDynamicProvider(identifier) as unknown as T;
    }

    throw new ProviderNotFoundError(identifier);
  }

  /**
   * Check if identifier is a dynamic provider (URL, package name, etc.)
   */
  private isDynamicIdentifier(identifier: string): boolean {
    return identifier.startsWith('http') || 
           identifier.startsWith('@') || 
           identifier.includes('/') ||
           identifier.startsWith('npm:') ||
           identifier.startsWith('github:') ||
           identifier.startsWith('file:');
  }

  /**
   * Load a dynamic provider from URL, package, etc.
   */
  private async loadDynamicProvider(identifier: string): Promise<MediaProvider> {
    // Check cache first
    const cached = this.providerCache.get(identifier);
    if (cached) {
      return cached;
    }

    console.log(`🔄 Loading dynamic provider: ${identifier}`);

    try {
      // Parse the identifier
      const parsed = this.parseIdentifier(identifier);
      
      // Load based on type
      let provider: MediaProvider;
      switch (parsed.type) {
        case 'npm':
          provider = await this.loadNpmProvider(parsed);
          break;
        case 'github':
          provider = await this.loadGitHubProvider(parsed);
          break;
        case 'file':
          provider = await this.loadFileProvider(parsed);
          break;
        default:
          throw new Error(`Unsupported provider type: ${parsed.type}`);
      }

      // Validate provider implements interface
      await this.validateProvider(provider);

      // Cache the provider
      this.providerCache.set(identifier, provider);

      console.log(`✅ Dynamic provider loaded: ${identifier}`);
      return provider;

    } catch (error) {
      console.error(`❌ Failed to load dynamic provider ${identifier}:`, error);
      throw new ProviderCreationError(identifier, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Parse provider identifier into type and details
   */
  private parseIdentifier(identifier: string): ParsedProviderIdentifier {    // npm: @scope/package@version or npm:package@version
    if (identifier.startsWith('@') || identifier.startsWith('npm:')) {
      const cleanId = identifier.replace(/^npm:/, '');
      
      if (cleanId.startsWith('@')) {
        // Handle @scope/package@version
        const parts = cleanId.split('@');
        if (parts.length >= 3) {
          // @scope/package@version -> ['', 'scope/package', 'version']
          const packageName = `@${parts[1]}`;
          const version = parts[2];
          return { type: 'npm', packageName, version };
        } else {
          // @scope/package -> ['', 'scope/package']
          const packageName = `@${parts[1]}`;
          return { type: 'npm', packageName, version: 'latest' };
        }
      } else {
        // Handle regular package@version
        const [packageName, version] = cleanId.split('@');
        return { type: 'npm', packageName, version: version || 'latest' };
      }
    }

    // GitHub: https://github.com/owner/repo or github:owner/repo@ref
    if (identifier.startsWith('https://github.com/') || identifier.startsWith('github:')) {
      let cleanId = identifier;
      if (identifier.startsWith('https://github.com/')) {
        cleanId = identifier.replace('https://github.com/', '');
      } else {
        cleanId = identifier.replace('github:', '');
      }
      
      const [ownerRepo, ref] = cleanId.split('@');
      const [owner, repo] = ownerRepo.split('/');
      
      return {
        type: 'github',
        owner,
        repo,
        ref: ref || 'main'
      };
    }

    // File: file:///path/to/provider
    if (identifier.startsWith('file:')) {
      return {
        type: 'file',
        path: identifier.replace('file://', '')
      };
    }

    throw new Error(`Cannot parse provider identifier: ${identifier}`);
  }
  /**
   * Load provider from npm package
   */
  private async loadNpmProvider(parsed: ParsedProviderIdentifier): Promise<MediaProvider> {
    const { packageName, version } = parsed;
    
    if (!packageName) {
      throw new Error('Package name is required for npm provider');
    }
    
    // For now, attempt dynamic import (assumes package is already installed)
    try {
      const providerModule = await import(packageName);
      const ProviderClass = providerModule.default || providerModule[Object.keys(providerModule)[0]];
      
      if (!ProviderClass) {
        throw new Error('No default export found in provider package');
      }

      return new ProviderClass();
    } catch (error) {
      throw new Error(`Failed to load npm provider ${packageName}@${version}: ${error.message}`);
    }
  }  /**
   * Load provider from GitHub repository
   */
  private async loadGitHubProvider(parsed: ParsedProviderIdentifier): Promise<MediaProvider> {
    const { owner, repo, ref } = parsed;
    
    if (!owner || !repo) {
      throw new Error('Owner and repo are required for GitHub provider');
    }

    console.log(`📥 Downloading GitHub provider: ${owner}/${repo}@${ref}`);

    const serviceDirName = `${owner}-${repo}`;
    const tmpDir = path.join(process.cwd(), 'temp', 'providers', serviceDirName);
    const providerConfigPath = path.join(tmpDir, 'MediaConduit.provider.yml');

    try {
      // Check if provider directory already exists and is valid
      let needsClone = true;
      let needsInstall = true;
      
      try {
        const stats = await fs.stat(tmpDir);
        if (stats.isDirectory()) {
          // Check if it's a valid provider directory
          try {
            await fs.access(providerConfigPath);
            console.log(`📂 Provider directory already exists: ${tmpDir}`);
            needsClone = false;
            
            // Check if node_modules exists
            try {
              await fs.access(path.join(tmpDir, 'node_modules'));
              needsInstall = false;
              console.log(`📦 Dependencies already installed`);
            } catch {
              console.log(`📦 Dependencies need to be installed`);
            }
          } catch {
            console.log(`🧹 Invalid provider directory found, will re-clone`);
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
        console.log(`📥 Cloning provider repository: ${owner}/${repo}@${ref}`);
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

      // Install dependencies only if needed
      if (needsInstall) {
        console.log(`📦 Installing provider dependencies...`);
        try {
          execSync('npm install', { cwd: tmpDir, stdio: 'pipe', timeout: 180000 });
          console.log(`✅ Dependencies installed successfully`);
        } catch (installError: any) {
          console.warn(`⚠️ Failed to install dependencies: ${installError.message}`);
          // Continue anyway - some providers might not need dependencies
        }
      }

      // Read MediaConduit.provider.yml configuration
      console.log(`📋 Reading provider configuration from MediaConduit.provider.yml`);
      const configContent = await fs.readFile(providerConfigPath, 'utf-8');
      
      // Parse YAML configuration
      const providerConfig: MediaConduitProviderConfig = yaml.parse(configContent);
      console.log(`✅ Loaded provider config: ${providerConfig.name} (${providerConfig.id})`);
      console.log(`🔍 Provider config type: ${providerConfig.type} (${typeof providerConfig.type})`);
      console.log(`🔍 Provider config serviceUrl: ${providerConfig.serviceUrl} (${typeof providerConfig.serviceUrl})`);
      console.log(`🔍 ProviderType.LOCAL: ${ProviderType.LOCAL} (${typeof ProviderType.LOCAL})`);
      console.log(`🔍 Type match: ${providerConfig.type === ProviderType.LOCAL}`);
      console.log(`🔍 ServiceUrl exists: ${!!providerConfig.serviceUrl}`);
      console.log(`🔍 Condition result: ${providerConfig.type === ProviderType.LOCAL && providerConfig.serviceUrl}`);

      let providerInstance: MediaProvider;

      // Dynamically import the provider's main class
      const providerModulePath = path.join(tmpDir, 'src', 'index.ts'); // Assuming main entry is src/index.ts
      const providerModuleUrl = new URL(`file://${providerModulePath}`).href;
      const providerModule = await import(providerModuleUrl);
      const ProviderClass = providerModule.default || providerModule[providerConfig.id]; // Assuming default export or named export matching ID

      if (!ProviderClass) {
        throw new Error(`Could not find provider class for ID: ${providerConfig.id} in ${providerModulePath}`);
      }

      // Instantiate the provider based on its type and configuration
      if (providerConfig.type === ProviderType.LOCAL && providerConfig.serviceUrl) {
        // For Docker-based providers, get the service from ServiceRegistry
        console.log(`🔧 Loading Docker service from ServiceRegistry: ${providerConfig.serviceUrl}`);
        console.log(`🔧 Service config:`, providerConfig.serviceConfig);
        
        const serviceRegistry = getServiceRegistry();
        console.log(`🔧 ServiceRegistry obtained:`, serviceRegistry.constructor.name);
        
        try {
          const dockerService = await serviceRegistry.getService(providerConfig.serviceUrl, providerConfig.serviceConfig) as DockerService;
          console.log(`🔧 Docker service obtained:`, dockerService?.constructor?.name || 'undefined');
          providerInstance = new ProviderClass(dockerService);
        } catch (error) {
          console.error(`❌ Failed to get Docker service:`, error);
          throw error;
        }
      } else {
        // For other types of providers, instantiate directly (or with other configs)
        console.log(`🔧 Instantiating provider directly (no Docker service needed)`);
        providerInstance = new ProviderClass();
      }
      
      // Cache the provider
      this.providerCache.set(providerConfig.id, providerInstance);
      
      console.log(`✅ Provider ready: ${providerConfig.name}`);
      return providerInstance;

    } catch (error) {
      // Cleanup on error
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      throw new Error(`Failed to load GitHub provider ${owner}/${repo}@${ref}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  /**
   * Load provider from local file
   */
  private async loadFileProvider(parsed: ParsedProviderIdentifier): Promise<MediaProvider> {
    const { path: providerPath } = parsed;
    
    if (!providerPath) {
      throw new Error('File path is required for file provider');
    }
    
    try {
      const fs = await import('fs/promises');

      const serviceDirectory = providerPath; // Use providerPath directly as it's already absolute
      const providerConfigPath = path.join(serviceDirectory, 'MediaConduit.provider.yml');

      // Read MediaConduit.provider.yml configuration
      console.log(`📋 Reading provider configuration from MediaConduit.provider.yml at ${providerConfigPath}`);
      const configContent = await fs.readFile(providerConfigPath, 'utf-8');
      
      // Parse YAML configuration
      const providerConfig: MediaConduitProviderConfig = yaml.parse(configContent);
      console.log(`✅ Loaded provider config: ${providerConfig.name} (${providerConfig.id})`);

      let providerInstance: MediaProvider;

      // Dynamically import the provider's main class
      const providerModulePath = path.join(serviceDirectory, 'src', 'index.ts'); // Assuming main entry is src/index.ts
      const providerModuleUrl = new URL(`file://${providerModulePath}`).href;
      const providerModule = await import(providerModuleUrl);
      const ProviderClass = providerModule.default || providerModule[providerConfig.id]; // Assuming default export or named export matching ID

      if (!ProviderClass) {
        throw new Error(`Could not find provider class for ID: ${providerConfig.id} in ${providerModulePath}`);
      }

      // Instantiate the provider based on its type and configuration
      if (providerConfig.type === ProviderType.LOCAL && providerConfig.serviceUrl) {
        // For Docker-based providers, get the service from ServiceRegistry
        const serviceRegistry = getServiceRegistry();
        const dockerService = await serviceRegistry.getService(providerConfig.serviceUrl, providerConfig.serviceConfig) as DockerService;
        providerInstance = new ProviderClass(dockerService); // Assuming constructor takes DockerService
      } else {
        // For other types of providers, instantiate directly (or with other configs)
        providerInstance = new ProviderClass();
      }
      
      // Cache the provider
      this.providerCache.set(providerConfig.id, providerInstance);
      
      console.log(`✅ Provider ready: ${providerConfig.name}`);
      return providerInstance;

    } catch (error) {
      throw new Error(`Failed to load file provider from ${providerPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate that a loaded provider implements the MediaProvider interface
   */
  private async validateProvider(provider: any): Promise<void> {
    // Check if provider implements the required MediaProvider interface methods
    const requiredMethods = ['configure', 'isAvailable', 'getModelsForCapability', 'getModel', 'getHealth'];
    const requiredProperties = ['id', 'name', 'type', 'capabilities', 'models'];
    
    // Check required properties
    for (const prop of requiredProperties) {
      if (!(prop in provider)) {
        throw new Error(`Loaded provider is missing required property: ${prop}`);
      }
    }
    
    // Check required methods
    for (const method of requiredMethods) {
      if (typeof provider[method] !== 'function') {
        throw new Error(`Loaded provider is missing required method: ${method}`);
      }
    }
    
    // For Docker providers, also check for Docker service management methods
    if (provider.type === 'local' && typeof provider.startService === 'function') {
      console.log(`✅ Docker provider validation passed for: ${provider.name}`);
    } else {
      console.log(`✅ Provider validation passed for: ${provider.name}`);
    }
  }
  /**
   * Get providers by capability with priority ordering
   */  public async getProvidersByCapability(capability: MediaCapability): Promise<MediaProvider[]> {
    const providers: MediaProvider[] = [];

    // Define priority order for text-to-image providers
    const textToImagePriority = [
      'huggingface-docker', // #1 Priority - Dynamic model loading
      'falai',
      'together',
      'replicate'
    ];

    // For TEXT_TO_IMAGE capability, use priority order
    if (capability === MediaCapability.TEXT_TO_IMAGE) {
      // First, add providers in priority order
      for (const priorityId of textToImagePriority) {
        if (this.providers.has(priorityId)) {
          try {
            const provider = await this.getProvider(priorityId);
            if (provider.capabilities && provider.capabilities.includes(capability)) {
              providers.push(provider);
            }
          } catch (error) {
            console.warn(`Failed to create priority provider ${priorityId}:`, error);
          }
        }
      }

      // Then add any remaining providers not in priority list
      for (const [id] of Array.from(this.providers)) {
        if (!textToImagePriority.includes(id)) {
          try {
            const provider = await this.getProvider(id);
            if (provider.capabilities && provider.capabilities.includes(capability)) {
              providers.push(provider);
            }
          } catch (error) {
            console.warn(`Failed to create provider ${id}:`, error);
          }
        }
      }
    } else {
      // For other capabilities, use default order
      for (const [id] of Array.from(this.providers)) {
        try {
          const provider = await this.getProvider(id);
          if (provider.capabilities && provider.capabilities.includes(capability)) {
            providers.push(provider);
          }
        } catch (error) {
          console.warn(`Failed to create provider ${id}:`, error);
        }
      }
    }

    return providers;
  }

  /**
   * Get all providers as instances (for compatibility with old API)
   */
  public async getProviders(): Promise<MediaProvider[]> {
    const providers: MediaProvider[] = [];
    
    for (const [id] of Array.from(this.providers)) {
      try {
        const provider = await this.getProvider(id);
        providers.push(provider);
      } catch (error) {
        console.warn(`Failed to create provider ${id}:`, error);
      }
    }
    
    return providers;
  }

  /**
   * Find the best provider for a capability based on availability and criteria
   */
  public async findBestProvider(capability: MediaCapability, criteria?: {
    maxCost?: number;
    preferLocal?: boolean;
    excludeProviders?: string[];
  }): Promise<MediaProvider | undefined> {
    const providers = await this.getProvidersByCapability(capability);

    if (criteria?.excludeProviders) {
      const filtered = providers.filter(p => !criteria.excludeProviders!.includes(p.id));
      if (filtered.length > 0) return filtered[0];
    }

    // Special handling for text-to-image: prefer HuggingFace if available
    if (capability === MediaCapability.TEXT_TO_IMAGE) {
      const hfProvider = providers.find(p => p.id === 'huggingface-docker');
      if (hfProvider && await hfProvider.isAvailable()) {
        return hfProvider;
      }
    }

    if (criteria?.preferLocal) {
      const localProvider = providers.find(p => p.type === 'local');
      if (localProvider) return localProvider;
    }

    return providers[0]; // Return first available (already prioritized)
  }

  /**
   * Clear the provider cache and optionally force reload from source
   */
  public clearCache(forceReload: boolean = false): void {
    this.providerCache.clear();
    
    if (forceReload) {
      console.log('🔄 Forcing reload of all cached providers on next access');
      // Note: Actual directories will be cleaned up on next load
    }
  }

  /**
   * Force refresh a specific provider (clears cache and re-downloads)
   */
  public async refreshProvider(identifier: string): Promise<void> {
    // Remove from cache
    this.providerCache.delete(identifier);
    
    // If it's a dynamic provider, clean up its directory
    if (this.isDynamicIdentifier(identifier)) {
      try {
        const parsed = this.parseIdentifier(identifier);
        if (parsed.type === 'github') {
          const path = await import('path');
          const fs = await import('fs/promises');
          const serviceDirName = `${parsed.owner}-${parsed.repo}`;
          const tmpDir = path.join(process.cwd(), 'temp', 'providers', serviceDirName);
          
          await fs.rm(tmpDir, { recursive: true, force: true });
          console.log(`🧹 Cleared provider directory for refresh: ${tmpDir}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to clean up provider directory:`, error);
      }
    }
  }

  /**
   * Get registry statistics
   */
  public getStats(): {
    totalProviders: number;
    cachedProviders: number;
  } {
    return {
      totalProviders: this.providers.size,
      cachedProviders: this.providerCache.size
    };
  }
}

/**
 * Convenience function to get the registry instance
 */
export function getProviderRegistry(): ProviderRegistry {
  return ProviderRegistry.getInstance();
}

export default ProviderRegistry;