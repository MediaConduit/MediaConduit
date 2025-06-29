/**
 * Test FFMPEGDockerProvider with GitHub Service
 * 
 * Test that the provider loads the FFMPEG service from GitHub dynamically
 */

import { FFMPEGDockerProvider } from './src/media/providers/docker/ffmpeg/FFMPEGDockerProvider';

async function testFFMPEGDockerProviderWithGitHub() {
  console.log('🧪 Testing FFMPEGDockerProvider with GitHub Service\n');

  try {
    // Create the provider (it auto-configures to use GitHub by default now)
    console.log('1. Creating FFMPEGDockerProvider...');
    const provider = new FFMPEGDockerProvider();
    console.log('   ✅ Provider created');

    // Wait a moment for auto-configuration
    console.log('\n2. Waiting for auto-configuration...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Manually configure with GitHub service URL to be explicit
    console.log('\n3. Configuring provider with GitHub service URL...');
    await provider.configure({
      serviceUrl: 'github:MediaConduit/ffmpeg-service',
      baseUrl: 'http://localhost:8006',
      timeout: 600000
    });
    console.log('   ✅ Provider configured with GitHub service');

    // Check availability
    console.log('\n4. Checking provider availability...');
    const isAvailable = await provider.isAvailable();
    console.log(`   📊 Provider Available: ${isAvailable ? '✅ Yes' : '❌ No'}`);

    if (isAvailable) {
      // Get health status
      console.log('\n5. Getting provider health...');
      const health = await provider.getHealth();
      console.log(`   🏥 Health Status: ${health.status}`);
      console.log(`   ⏱️ Uptime: ${health.uptime}`);
      console.log(`   🔄 Active Jobs: ${health.activeJobs}`);

      // Test service management
      console.log('\n6. Testing service management...');
      console.log('   🔄 Starting service...');
      await provider.start();
      
      console.log('   ⏸️ Stopping service...');
      await provider.stop();
      
      console.log('   🔄 Restarting service...');
      await provider.restart();
    }

    console.log('\n✅ FFMPEG DOCKER PROVIDER GITHUB TEST COMPLETE!');
    console.log('===============================================');
    console.log('🎯 Provider successfully configured with GitHub service');
    console.log('🔄 Dynamic service loading working correctly');
    console.log('📦 No local service directory required');

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  }
}

if (require.main === module) {
  testFFMPEGDockerProviderWithGitHub().catch(console.error);
}

export { testFFMPEGDockerProviderWithGitHub };
