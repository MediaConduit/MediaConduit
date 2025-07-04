/**
 * ChatterboxTTSModel - Concrete Implementation
 *
 * Concrete implementation of TextToAudioModel using Chatterbox TTS.
 * Coordinates ChatterboxAPIClient and ChatterboxDockerService for speech synthesis.
 */

import { TextToAudioModel, TextToAudioOptions } from '../../../models/abstracts/TextToAudioModel';
import { ModelMetadata } from '../../../models/abstracts/Model';
import { Text, Audio, TextRole, AudioRole } from '../../../assets/roles';
import { ChatterboxAPIClient } from './ChatterboxAPIClient';
// Use generic service type for better compatibility
// import { ChatterboxDockerService } from '../../../services/ChatterboxDockerService';
import * as fs from 'fs';
import * as path from 'path';
import { createGenerationPrompt, extractInputContent } from '../../../utils/GenerationPromptHelper';

// Extended options for Chatterbox TTS
export interface ChatterboxTTSOptions extends TextToAudioOptions {
  voice?: string;
  voiceFile?: string;
}

// Voice information interface
export interface VoiceInfo {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  age: 'child' | 'young' | 'adult' | 'elderly';
  style: string[];
  emotions: string[];
}

export interface ChatterboxTextToAudioModelConfig {
  apiClient?: ChatterboxAPIClient;
  dockerService?: any; // Generic service type
  baseUrl?: string;
  timeout?: number;
  tempDir?: string;
}

/**
 * Concrete Chatterbox TTS model implementation
 */
export class ChatterboxTextToAudioModel extends TextToAudioModel {
  private apiClient: ChatterboxAPIClient;
  private dockerService: any; // Generic service type
  private tempDir: string;

  constructor(config: ChatterboxTextToAudioModelConfig = {}) {
    const metadata: ModelMetadata = {
      id: 'chatterbox-tts',
      name: 'Chatterbox Text-to-Speech',
      description: 'Chatterbox TTS model for high-quality speech synthesis with voice cloning',
      version: '1.0.0',
      provider: 'chatterbox-docker',
      capabilities: ['text-to-speech', 'speech-synthesis', 'voice-cloning'],
      inputTypes: ['text'],
      outputTypes: ['audio']
    };

    super(metadata);

    // Initialize API client and Docker service
    this.apiClient = config.apiClient || new ChatterboxAPIClient(config.baseUrl, config.timeout);
    this.dockerService = config.dockerService || null; // No default service needed
    this.tempDir = config.tempDir || path.join(process.cwd(), 'temp', 'chatterbox');

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Transform text to audio using Chatterbox TTS
   */
  async transform(input: TextRole | TextRole[] | string | string[], options?: ChatterboxTTSOptions): Promise<Audio> {
    const startTime = Date.now();

    let textRole: TextRole;
    if (Array.isArray(input)) {
      textRole = typeof input[0] === 'string' ? Text.fromString(input[0]) : input[0];
    } else {
      textRole = typeof input === 'string' ? Text.fromString(input) : input;
    }

    // Get text from the TextRole
    const text = await textRole.asRole(Text);

    // Validate text data
    if (!text.isValid()) {
      throw new Error('Invalid text data provided');
    }

    // Extract voice cloning audio from options
    let voiceAudio: AudioRole | undefined;
    if (options?.voiceToClone) {
      voiceAudio = options.voiceToClone;
    }

    try {
      // Ensure Docker service is running
      const serviceStarted = await this.dockerService.startService();
      if (!serviceStarted) {
        throw new Error('Failed to start Chatterbox Docker service');
      }

      // Wait for service to be healthy
      const isHealthy = await this.dockerService.waitForHealthy(30000);
      if (!isHealthy) {
        throw new Error('Chatterbox service is not healthy');
      }

      // Handle voice cloning if voice audio is provided
      let referenceAudioFilename: string | undefined;
      let voiceFilePath: string | undefined;
      
      // Handle voice cloning from voiceToClone AudioRole
      if (voiceAudio) {
        console.log(`[ChatterboxTTS] Voice cloning requested with AudioRole`);
        console.log(`[ChatterboxTTS] Force upload option: ${options?.forceUpload}`);
        
        try {
          // Convert AudioRole to Audio and save to temporary file
          const voice = await voiceAudio.asRole(Audio);
          const timestamp = Date.now();
          const format = voice.getFormat();
          const tempFileName = `voice_clone_${timestamp}.${format}`;
          voiceFilePath = path.join(this.tempDir, tempFileName);
          
          // Write audio data to temporary file
          fs.writeFileSync(voiceFilePath, voice.data);
          console.log(`[ChatterboxTTS] Wrote voice audio to temp file: ${voiceFilePath}`);
          
          const localFilename = path.basename(voiceFilePath);
          console.log(`[ChatterboxTTS] Local filename: ${localFilename}`);

          // Check if file already exists on server (unless force upload is requested)
          if (!options?.forceUpload) {
            console.log(`[ChatterboxTTS] Checking if file already exists on server...`);
            try {
              const existingFiles = await this.apiClient.getReferenceFiles();
              console.log(`[ChatterboxTTS] Existing files on server:`, existingFiles);
              if (existingFiles.includes(localFilename)) {
                console.log(`[ChatterboxTTS] Reference file '${localFilename}' already exists on server, skipping upload`);
                referenceAudioFilename = localFilename;
              } else {
                console.log(`[ChatterboxTTS] File '${localFilename}' not found on server, will upload`);
              }
            } catch (error) {
              console.warn('[ChatterboxTTS] Could not check existing files, proceeding with upload:', error);
            }
          } else {
            console.log(`[ChatterboxTTS] Force upload enabled, will upload regardless of existing files`);
          }

          // Upload if file doesn't exist or force upload is requested
          if (!referenceAudioFilename || options?.forceUpload) {
            console.log(`[ChatterboxTTS] ${options?.forceUpload ? 'Force uploading' : 'Uploading'} reference file: ${voiceFilePath}`);
            const uploadResult = await this.apiClient.uploadReferenceAudio(voiceFilePath);
            console.log(`[ChatterboxTTS] Upload successful, filename: ${uploadResult.filename}`);
            referenceAudioFilename = uploadResult.filename;
          } else {
            console.log(`[ChatterboxTTS] Skipping upload, using existing file: ${referenceAudioFilename}`);
          }
        } catch (error) {
          console.error('[ChatterboxTTS] Upload error:', error);
          throw new Error(`Failed to upload reference audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } 
      // Handle voice cloning from legacy voiceFile path (if still provided in options)
      else if (options?.voiceFile) {
        console.log(`[ChatterboxTTS] Voice cloning requested with file: ${options.voiceFile}`);
        console.log(`[ChatterboxTTS] Force upload option: ${options.forceUpload}`);
        
        try {
          const localFilename = path.basename(options.voiceFile);
          console.log(`[ChatterboxTTS] Local filename: ${localFilename}`);

          // Check if file already exists on server (unless force upload is requested)
          if (!options.forceUpload) {
            console.log(`[ChatterboxTTS] Checking if file already exists on server...`);
            try {
              const existingFiles = await this.apiClient.getReferenceFiles();
              console.log(`[ChatterboxTTS] Existing files on server:`, existingFiles);
              if (existingFiles.includes(localFilename)) {
                console.log(`[ChatterboxTTS] Reference file '${localFilename}' already exists on server, skipping upload`);
                referenceAudioFilename = localFilename;
              } else {
                console.log(`[ChatterboxTTS] File '${localFilename}' not found on server, will upload`);
              }
            } catch (error) {
              console.warn('[ChatterboxTTS] Could not check existing files, proceeding with upload:', error);
            }
          } else {
            console.log(`[ChatterboxTTS] Force upload enabled, will upload regardless of existing files`);
          }

          // Upload if file doesn't exist or force upload is requested
          if (!referenceAudioFilename || options.forceUpload) {
            console.log(`[ChatterboxTTS] ${options.forceUpload ? 'Force uploading' : 'Uploading'} reference file: ${options.voiceFile}`);
            const uploadResult = await this.apiClient.uploadReferenceAudio(options.voiceFile);
            console.log(`[ChatterboxTTS] Upload successful, filename: ${uploadResult.filename}`);
            referenceAudioFilename = uploadResult.filename;
          } else {
            console.log(`[ChatterboxTTS] Skipping upload, using existing file: ${referenceAudioFilename}`);
          }
        } catch (error) {
          console.error('[ChatterboxTTS] Upload error:', error);
          throw new Error(`Failed to upload reference audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        console.log(`[ChatterboxTTS] No voice file specified, using default voice`);
      }

      // Create TTS request
      console.log(`[ChatterboxTTS] Creating TTS request with options:`, {
        voice: options?.voice,
        speed: options?.speed,
        voiceFile: voiceFilePath || options?.voiceFile,
        outputFormat: options?.format as 'mp3' | 'wav' || 'mp3'
      });

      const request = this.apiClient.createTTSRequest(text.content, {
        voice: options?.voice,
        speed: options?.speed,
        voiceFile: voiceFilePath || options?.voiceFile, // Pass voiceFile to set correct voice_mode
        outputFormat: options?.format as 'mp3' | 'wav' || 'mp3'
      });

      // Set reference audio filename if uploaded
      if (referenceAudioFilename) {
        console.log(`[ChatterboxTTS] Setting reference_audio_filename to: ${referenceAudioFilename}`);
        request.reference_audio_filename = referenceAudioFilename;
      }
      
      console.log(`[ChatterboxTTS] Final TTS request:`, request);

      // Generate output file path
      const timestamp = Date.now();
      const outputFormat = request.output_format;
      const outputPath = path.join(this.tempDir, `chatterbox_${timestamp}.${outputFormat}`);

      try {
        // Perform TTS generation
        const response = await this.apiClient.generateTTS(request, outputPath);

        // Read generated audio file
        const audioData = fs.readFileSync(outputPath);

        // Process response
        const processingTime = Date.now() - startTime;

        // Create Audio result with clean interface
        const audio = new Audio(
          audioData,
          text.sourceAsset, // Preserve source Asset reference
          {
            format: 'mp3' as any,
            generation_prompt: createGenerationPrompt({
              input: input, // RAW input object to preserve generation chain
              options: options,
              modelId: 'chatterbox',
              modelName: 'Chatterbox TTS',
              provider: 'chatterbox-docker',
              transformationType: 'text-to-audio',
              processingTime: Date.now() - startTime
            })
          }
        );

        return audio;

      } finally {
        // Clean up temporary files
        this.cleanupTempFile(outputPath);
        if (voiceFilePath) {
          this.cleanupTempFile(voiceFilePath);
        }
      }

    } catch (error) {
      throw new Error(`Chatterbox TTS failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ensure service is running
   */
  private async ensureServiceRunning(): Promise<boolean> {
    try {
      const serviceStarted = await this.dockerService.startService();
      if (!serviceStarted) {
        return false;
      }

      const isHealthy = await this.dockerService.waitForHealthy(30000);
      return isHealthy;
    } catch {
      return false;
    }
  }

  /**
   * Get provider name
   */
  getProvider(): string {
    return 'chatterbox-docker';
  }

  /**
   * Check if the model is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Check if Docker service is healthy
      const isHealthy = await this.dockerService.isServiceHealthy();
      if (!isHealthy) {
        return false;
      }

      // Check if API client can reach the service
      return await this.apiClient.checkHealth();
    } catch {
      return false;
    }
  }

  /**
   * Get detailed voice information
   */
  async getVoiceInfo(): Promise<VoiceInfo[]> {
    // Chatterbox has predefined voices - this would typically come from the API
    return [
      {
        id: 'Abigail.wav',
        name: 'Abigail',
        language: 'en-US',
        gender: 'female',
        age: 'adult',
        style: ['conversational', 'friendly'],
        emotions: ['neutral', 'happy', 'calm']
      },
      {
        id: 'Emma.wav',
        name: 'Emma',
        language: 'en-US',
        gender: 'female',
        age: 'young',
        style: ['conversational', 'energetic'],
        emotions: ['neutral', 'excited', 'happy']
      },
      {
        id: 'David.wav',
        name: 'David',
        language: 'en-US',
        gender: 'male',
        age: 'adult',
        style: ['formal', 'news'],
        emotions: ['neutral', 'calm']
      }
    ];
  }

  /**
   * Get supported voices (simple list)
   */
  async getSupportedVoices(): Promise<string[]> {
    const voiceInfo = await this.getVoiceInfo();
    return voiceInfo.map(voice => voice.id);
  }

  /**
   * Get supported emotions
   */
  getSupportedEmotions(): string[] {
    return ['neutral', 'happy', 'sad', 'excited', 'calm'];
  }

  /**
   * Get supported speaking styles
   */
  getSupportedStyles(): string[] {
    return ['conversational', 'news', 'formal', 'casual'];
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<string[]> {
    return ['en-US', 'en-GB', 'auto'];
  }

  /**
   * Get supported output formats
   */
  getSupportedFormats(): string[] {
    return ['mp3', 'wav'];
  }

  /**
   * Check if voice cloning is supported
   */
  supportsVoiceCloning(): boolean {
    return true;
  }

  /**
   * Check if SSML markup is supported
   */
  supportsSSML(): boolean {
    return false; // Chatterbox doesn't support SSML in this implementation
  }

  /**
   * Get default voice
   */
  getDefaultVoice(): string {
    return 'Abigail.wav';
  }

  /**
   * Get maximum text length
   */
  getMaxTextLength(): number {
    return 5000; // 5000 characters
  }

  /**
   * Clean up temporary file
   */
  private cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`Failed to cleanup temp file ${filePath}:`, error);
    }
  }

  /**
   * Get Docker service for advanced operations
   */
  getDockerService(): any {
    return this.dockerService;
  }

  /**
   * Get API client for direct access
   */
  getAPIClient(): ChatterboxAPIClient {
    return this.apiClient;
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
      const status = await this.dockerService.getServiceStatus();
      return {
        running: status.running,
        healthy: status.health === 'healthy',
        error: status.health === 'unhealthy' ? 'Service is unhealthy' : undefined
      };
    } catch (error) {
      return {
        running: false,
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Start the underlying Docker service
   */
  async startService(): Promise<boolean> {
    return await this.dockerService.startService();
  }

  /**
   * Stop the underlying Docker service
   */
  async stopService(): Promise<boolean> {
    return await this.dockerService.stopService();
  }

  /**
   * Restart the underlying Docker service
   */
  async restartService(): Promise<boolean> {
    return await this.dockerService.restartService();
  }

  /**
   * Get service logs
   */
  async getServiceLogs(lines: number = 100): Promise<string> {
    return await this.dockerService.getLogs(lines);
  }

  /**
   * Get container stats
   */
  async getContainerStats(): Promise<{
    cpuUsage?: string;
    memoryUsage?: string;
    networkIO?: string;
    error?: string;
  }> {
    return await this.dockerService.getContainerStats();
  }

  /**
   * Get the input schema for this model
   */
  getInputSchema(): any {
    return {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          maxLength: this.getMaxTextLength(),
          description: 'Text content to convert to speech'
        }
      },
      required: ['content']
    };
  }

  /**
   * Get the output schema for this model
   */
  getOutputSchema(): any {
    return {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          format: 'binary',
          description: 'Generated audio data'
        },
        format: {
          type: 'string',
          enum: this.getSupportedFormats(),
          description: 'Audio format'
        }
      },
      required: ['data', 'format']
    };
  }

  /**
   * Get available voices for this model
   */
  async getAvailableVoices(): Promise<string[]> {
    // Return standard voices supported by Chatterbox TTS
    return [
      'en-US-AriaNeural',
      'en-US-DavisNeural', 
      'en-US-GuyNeural',
      'en-US-JennyNeural',
      'en-GB-SoniaNeural',
      'en-AU-NatashaNeural'
    ];
  }
}
