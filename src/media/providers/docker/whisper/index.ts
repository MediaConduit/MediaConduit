/**
 * Whisper Docker Models
 * 
 * Re-exports all Whisper STT Docker-based models
 */

// Export only the new Docker model for dynamic provider architecture
export { WhisperDockerModel } from './WhisperDockerModel';

// Note: WhisperSTTModel is legacy and should not be used in dynamic providers
// It has hardcoded service dependencies that conflict with ServiceRegistry pattern
