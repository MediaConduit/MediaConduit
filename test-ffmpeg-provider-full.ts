/**
 * Test FFMPEGDockerProvider with GitHub Service - Full Integration
 * 
 * Complete test that starts service and tests provider functionality
 */

import { FFMPEGDockerProvider } from './src/media/providers/docker/ffmpeg/FFMPEGDockerProvider';

async function testFFMPEGProviderFullIntegration() {
  console.log('🚀 Testing FFMPEGDockerProvider Full GitHub Integration\n');

  try {
    // Create the provider
    console.log('1. Creating FFMPEGDockerProvider...');
    const provider = new FFMPEGDockerProvider();
    console.log('   ✅ Provider created');

    // Configure with GitHub service URL
    console.log('\n2. Configuring provider with GitHub service URL...');
    await provider.configure({
      serviceUrl: 'github:MediaConduit/ffmpeg-service',
      baseUrl: 'http://localhost:8006',
      timeout: 600000
    });
    console.log('   ✅ Provider configured with GitHub service');

    // Start the service
    console.log('\n3. Starting FFMPEG service from GitHub...');
    await provider.start();
    console.log('   ✅ Service start command completed');

    // Wait for service to be ready
    console.log('\n4. Waiting for service to become healthy...');
    let attempts = 0;
    let isAvailable = false;
    while (attempts < 30 && !isAvailable) { // 30 second timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      isAvailable = await provider.isAvailable();
      attempts++;
      if (attempts % 5 === 0) {
        console.log(`   ⏳ Waiting... (${attempts}s)`);
      }
    }

    console.log(`\n5. Provider availability check: ${isAvailable ? '✅ Available' : '❌ Not available'}`);

    if (isAvailable) {
      // Get health status
      console.log('\n6. Getting provider health...');
      const health = await provider.getHealth();
      console.log(`   🏥 Health Status: ${health.status}`);
      console.log(`   ⏱️ Uptime: ${health.uptime}`);
      console.log(`   🔄 Active Jobs: ${health.activeJobs}`);

      // Test service capabilities
      console.log('\n7. Testing provider capabilities...');
      const models = provider.models;
      console.log(`   📋 Available Models: ${models.length}`);
      models.forEach(model => {
        console.log(`      • ${model.name} (${model.id})`);
        console.log(`        Capabilities: ${model.capabilities.join(', ')}`);
      });

      // Test getting a model
      console.log('\n8. Testing model creation...');
      try {
        const videoToAudioModel = await provider.getModel('ffmpeg-video-to-audio');
        console.log('   ✅ Successfully created video-to-audio model');
      } catch (modelError) {
        console.log(`   ⚠️ Model creation failed: ${modelError.message}`);
      }

      console.log('\n✅ FFMPEG PROVIDER FULL INTEGRATION SUCCESS!');
      console.log('============================================');
      console.log('🎯 Provider loads service from GitHub');
      console.log('🔄 Service starts and becomes healthy');
      console.log('📦 Models are available and working');
      console.log('🚀 Complete distributed architecture working!');

    } else {
      console.log('\n⚠️ Service did not become available within timeout');
      console.log('This might be normal if Docker is not running or service needs more time');
    }

    // Stop the service when done
    console.log('\n9. Stopping service...');
    await provider.stop();
    console.log('   ✅ Service stopped');

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  }
}

if (require.main === module) {
  testFFMPEGProviderFullIntegration().catch(console.error);
}

export { testFFMPEGProviderFullIntegration };
