#!/usr/bin/env tsx

/**
 * Quick test for error handling fix
 */

import { getProviderRegistry } from './src/media/registry/ProviderRegistry';

async function testErrorHandling() {
  console.log('🧪 Testing Ollama Provider Error Handling...\n');

  try {
    // Load provider
    const providerRegistry = getProviderRegistry();
    const provider = await providerRegistry.getProvider('https://github.com/MediaConduit/ollama-provider');
    
    console.log('✅ Provider loaded successfully');
    
    // Configure provider
    await provider.configure({});
    console.log('✅ Provider configured');
    
    // Test error handling with definitely non-existent model
    console.log('\n📋 Testing Error Handling:');
    try {
      console.log('🔄 Attempting to get non-existent model: definitely-non-existent-model-12345');
      await provider.getModel('definitely-non-existent-model-12345');
      console.log('❌ ERROR: Should have thrown an error for non-existent model!');
    } catch (error: any) {
      console.log(`✅ SUCCESS: Correctly handled non-existent model error: ${error.message}`);
    }
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  }
}

testErrorHandling().catch(console.error);
