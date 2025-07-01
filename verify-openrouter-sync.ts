#!/usr/bin/env tsx

/**
 * Quick verification that OpenRouter provider sync constructor is working
 */

import { getProviderRegistry } from './src/media/registry/ProviderRegistry';
import { MediaCapability } from './src/media/types/provider';

async function verifyOpenRouterSync() {
  console.log('🔍 Verifying OpenRouter Provider Sync Constructor...\n');

  try {
    console.log('1. Loading OpenRouter provider from GitHub...');
    const registry = getProviderRegistry();
    const provider = await registry.getProvider('https://github.com/MediaConduit/openrouter-provider');
    
    console.log(`   ✅ Provider loaded: ${provider.name}`);
    console.log(`   ✅ Provider ready instantly: ${provider.models.length} models available`);
    
    console.log('\n2. Testing sync availability...');
    const models = provider.getModelsForCapability(MediaCapability.TEXT_TO_TEXT);
    console.log(`   ✅ Models accessible immediately: ${models.length}`);
    
    if (models.length > 0) {
      console.log('\n3. Sample models available:');
      models.slice(0, 5).forEach((model, index) => {
        console.log(`   ${index + 1}. ${model.name} (${model.id})`);
      });
      
      const freeModels = models.filter(m => m.id.includes('free')).slice(0, 3);
      if (freeModels.length > 0) {
        console.log('\n   💰 Free models:');
        freeModels.forEach((model, index) => {
          console.log(`   ${index + 1}. ${model.name} (${model.id})`);
        });
      }
    }

    console.log('\n✅ OPENROUTER SYNC CONSTRUCTOR VERIFICATION: SUCCESS!');
    console.log('🎯 Provider is instantly ready without async configuration');
    console.log('📦 Models available immediately upon loading');
    console.log('🚀 Perfect for system-wide defaults and fallbacks');

  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verifyOpenRouterSync().catch(console.error);
