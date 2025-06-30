/**
 * CowsayAPIClient
 * 
 * API client for communicating with the Cowsay Docker service.
 * Handles HTTP requests to the cowsay service endpoints.
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface CowsayDockerConfig {
  baseUrl?: string;
  timeout?: number;
}

export interface CowsayRequest {
  text: string;
}

export interface CowsayResponse {
  cowsayOutput: string;
}

export interface ServiceHealthResponse {
  status: 'healthy' | 'unhealthy';
  service: string;
  version: string;
  timestamp: number;
}

/**
 * API client for Cowsay Docker service
 */
export class CowsayAPIClient {
  private client: AxiosInstance;
  private config: CowsayDockerConfig;

  constructor(config: CowsayDockerConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:80',
      timeout: config.timeout || 30000 // 30 seconds
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[CowsayAPIClient] Request failed:', error.message);
        
        // Extract detailed error message from response body if available
        if (error.response?.data?.error) {
          const enhancedError = new Error(error.response.data.error);
          enhancedError.name = error.name;
          enhancedError.stack = error.stack;
          return Promise.reject(enhancedError);
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate cowsay ASCII art from text
   */
  async generateCowsay(text: string): Promise<string> {
    try {
      const response: AxiosResponse<CowsayResponse> = await this.client.post('/cowsay', {
        text
      });
      
      return response.data.cowsayOutput;
    } catch (error) {
      throw new Error(`Cowsay generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if the service is healthy and ready
   */
  async healthCheck(): Promise<ServiceHealthResponse> {
    try {
      const response: AxiosResponse<ServiceHealthResponse> = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test if the service is reachable
   */
  async isServiceReachable(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      return false;
    }
  }
}
