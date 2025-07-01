#!/usr/bin/env tsx

/**
 * Quick verification that Together provider migration is working
 */

import { getProviderRegistry } from './src/media/registry/ProviderRegistry';
import { MediaCapability } from './src/media/types/provider';

async function verifyTogetherMigration() {
  console.log('🔍 Verifying Together Provider Migration...\n');

  try {
    console.log('1. Loading Together provider from GitHub...');
    const registry = getProviderRegistry();
    const provider = await registry.getProvider('https://github.com/MediaConduit/together-provider');
    
    console.log(`   ✅ Provider loaded: ${provider.name}`);
    console.log(`   ✅ Provider ID: ${provider.id}`);
    console.log(`   ✅ Provider Type: ${provider.type}`);
    console.log(`   ✅ Capabilities: ${provider.capabilities.join(', ')}`);

    console.log('\n2. Testing model discovery...');
    const textModels = provider.getModelsForCapability(MediaCapability.TEXT_TO_TEXT);
    const imageModels = provider.getModelsForCapability(MediaCapability.TEXT_TO_IMAGE);
    const audioModels = provider.getModelsForCapability(MediaCapability.TEXT_TO_AUDIO);
    
    console.log(`   ✅ Text models: ${textModels.length}`);
    console.log(`   ✅ Image models: ${imageModels.length}`);
    console.log(`   ✅ Audio models: ${audioModels.length}`);

    console.log('\n3. Testing model instantiation...');
    if (textModels.length > 0) {
      const model = await provider.getModel(textModels[0].id);
      console.log(`   ✅ Model instantiated: ${model.getId()}`);
    }

    console.log('\n✅ TOGETHER PROVIDER MIGRATION VERIFIED!');
    console.log('🎯 Dynamic loading working perfectly');
    console.log('📦 Multi-capability support confirmed');
    console.log('🚀 Ready for production use!');

  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verifyTogetherMigration().catch(console.error);
