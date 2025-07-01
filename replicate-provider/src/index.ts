/**
 * Replicate Provider - Dynamic Loading Entry Point
 * 
 * Multi-capability provider for Replicate models including:
 * - Text-to-Image (FLUX, SDXL, Playground)
 * - Text-to-Video (Luma Dream Machine, MiniMax)
 * - Text-to-Audio (MusicGen, Bark, Tortoise TTS)
 * - Image-to-Image (Upscaling, enhancement)
 * - Image-to-Video (Stable Video Diffusion)
 */

import { ReplicateProvider } from './ReplicateProvider';

// Export the provider class for dynamic loading
export { ReplicateProvider };
export default ReplicateProvider;

// Export supporting types and models
export { ReplicateClient } from './ReplicateClient';
export type { ReplicateConfig } from './ReplicateClient';
export { ReplicateTextToImageModel } from './ReplicateTextToImageModel';
export { ReplicateTextToVideoModel } from './ReplicateTextToVideoModel';
export { ReplicateTextToAudioModel } from './ReplicateTextToAudioModel';
