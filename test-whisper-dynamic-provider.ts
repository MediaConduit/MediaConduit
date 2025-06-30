/**
 * Test the Whisper Dynamic Provider from GitHub
 */

import { ProviderRegistry } from './src/media/registry/ProviderRegistry';

async function testWhisperDynamicProvider() {
  try {
    console.log('🧪 Testing Whisper Dynamic Provider from GitHub...');
    
    // Get the provider registry
    const registry = ProviderRegistry.getInstance();
    
    // Load the provider dynamically from GitHub
    const provider = await registry.getProvider('github:MediaConduit/whisper-provider');
    
    // Check provider properties
    console.log('📋 Provider details:', {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      capabilities: provider.capabilities,
      models: provider.models?.map(m => ({ id: m.id, name: m.name })) || 'No models property'
    });
    

    
    // Start the Docker service
    if (typeof (provider as any).startService === 'function') {
      console.log('🚀 Starting Docker service...');
      const serviceStarted = await (provider as any).startService();
      console.log('🏁 Service started:', serviceStarted);
    } else {
      console.log('⚠️ No startService method available');
    }
    
    // Check availability
    const isAvailable = await provider.isAvailable();
    console.log('🏥 Provider available:', isAvailable);
    
    // Check if provider has getModels method (our custom method)
    if (typeof (provider as any).getModels === 'function') {
      const models = await (provider as any).getModels();
      console.log('🤖 Available models:', models.map((m: any) => ({ id: m.id, name: m.name })));
    } else {
      console.log('🤖 Using models property:', provider.models?.map(m => ({ id: m.id, name: m.name })));
    }
    
    // Get a specific model
    const whisperBase = await provider.getModel('whisper-base');
    console.log('🎯 Whisper Base model:', whisperBase);
    
    console.log('✅ Whisper Dynamic Provider test completed successfully!');
    
  } catch (error) {
    console.error('❌ Whisper Dynamic Provider test failed:', error);
    process.exit(1);
  }
}

// Run the test
testWhisperDynamicProvider();
