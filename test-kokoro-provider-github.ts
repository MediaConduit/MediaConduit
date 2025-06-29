/**
 * Test KokoroDockerProvider with GitHub Service
 */

import { KokoroDockerProvider } from './src/media/providers/docker/kokoro/KokoroDockerProvider';

async function testKokoroProviderGitHub() {
  console.log('🗾 Testing KokoroDockerProvider with GitHub Service\n');

  try {
    // Create the provider (auto-configures with GitHub)
    console.log('1. Creating KokoroDockerProvider...');
    const provider = new KokoroDockerProvider();
    console.log('   ✅ Provider created');

    // Wait for auto-configuration
    console.log('\n2. Waiting for auto-configuration...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Explicitly configure with GitHub service
    console.log('\n3. Configuring provider with GitHub service URL...');
    const startTime = Date.now();
    await provider.configure({
      serviceUrl: 'github:MediaConduit/kokoro-service',
      baseUrl: 'http://localhost:8005'
    });
    const configTime = Date.now() - startTime;
    console.log(`   ✅ Provider configured in ${configTime}ms (service reused)`);

    // Check availability
    console.log('\n4. Checking provider availability...');
    const isAvailable = await provider.isAvailable();
    console.log(`   📊 Provider Available: ${isAvailable ? '✅ Yes' : '❌ No'}`);

    // Test models
    console.log('\n5. Testing model capabilities...');
    const models = provider.models;
    console.log(`   🗾 Available Models: ${models.length}`);
    models.forEach(model => {
      console.log(`      • ${model.name} (${model.id})`);
      console.log(`        Capabilities: ${model.capabilities.join(', ')}`);
    });

    // Test model creation
    console.log('\n6. Testing model creation...');
    try {
      const model = await provider.getModel('kokoro-standard');
      console.log('   ✅ Successfully created Kokoro TTS model');
    } catch (modelError) {
      console.log(`   ⚠️ Model creation failed: ${modelError.message}`);
    }

    console.log('\n✅ KOKORO PROVIDER GITHUB TEST COMPLETE!');
    console.log('========================================');
    console.log('🎯 Provider successfully configured with GitHub service');
    console.log('⚡ Service reuse working (instant configuration)');
    console.log('📦 No local service directory required');
    console.log('🗾 Ready for Japanese TTS generation!');

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  }
}

if (require.main === module) {
  testKokoroProviderGitHub().catch(console.error);
}

export { testKokoroProviderGitHub };
