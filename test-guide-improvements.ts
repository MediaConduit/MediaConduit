/**
 * Test the improved Dynamic Provider Migration Guide
 * 
 * This follows the "Quick Start" section to verify the guide improvements work
 */

import { getProviderRegistry } from './src/media/registry/ProviderRegistry';

async function testGuideImprovements() {
  console.log('🧪 Testing Dynamic Provider Migration Guide Improvements...');
  
  try {
    console.log('\n📋 Following Quick Start Section...');
    
    const registry = getProviderRegistry();
    
    // Load Ollama provider from GitHub (as per guide)
    console.log('🔄 Loading Ollama provider from GitHub...');
    const provider = await registry.getProvider('https://github.com/MediaConduit/ollama-provider');
    console.log('✅ Provider loaded:', provider.name);
    
    // Check if provider is available
    const isAvailable = await provider.isAvailable();
    console.log('✅ Provider available:', isAvailable);
    
    if (!isAvailable) {
      console.log('⚠️  Provider not available - this is normal if Ollama service isn\'t running');
      return;
    }
    
    // Configure the provider (learned this was necessary!)
    console.log('\n🔧 Configuring provider...');
    await provider.configure({});
    console.log('✅ Provider configured');
    
    // Get a model (this will auto-pull if needed)
    console.log('\n🔄 Getting model (will auto-pull if needed)...');
    const model = await provider.getModel('llama3.2:1b'); // Small 1.3GB model as per guide
    console.log('✅ Model ready:', model.getId()); // Using getId() as per guide improvements
    
    // Use the model
    console.log('\n📝 Testing text generation...');
    const result = await model.transform("Write a haiku about testing guides"); // Using transform() as per guide
    
    console.log('✅ Generated response:');
    console.log('📄 Content:', result.content);
    console.log('🔍 Has generation_prompt:', !!result.metadata?.generation_prompt);
    
    if (result.metadata?.generation_prompt) {
      console.log('🎯 Generation history preserved correctly!');
      console.log('   Input:', result.metadata.generation_prompt.input);
      console.log('   Model:', result.metadata.generation_prompt.modelId);
      console.log('   Provider:', result.metadata.generation_prompt.provider);
    }
    
    console.log('\n🎉 Guide improvements test successful!');
    console.log('💡 The guide now provides clear patterns that actually work!');
    
  } catch (error: any) {
    console.error('\n💥 Test failed:', error.message);
    
    // Provide helpful debugging as per guide improvements
    if (error.message.includes('@mediaconduit/mediaconduit')) {
      console.log('💡 Quick fix: Start Verdaccio: docker run -d -p 4873:4873 verdaccio/verdaccio');
    }
    
    if (error.message.includes('Docker')) {
      console.log('💡 Quick fix: Check Docker is running: docker ps');
    }
    
    if (error.message.includes('generateText')) {
      console.log('💡 Quick fix: Use model.transform() not generateText()');
    }
    
    if (error.message.includes('model.id')) {
      console.log('💡 Quick fix: Use model.getId() not model.id');
    }
  }
}

// Run the test
testGuideImprovements().catch(console.error);
