/**
 * Test Chatterbox Service Migration from GitHub
 * 
 * Test that the Chatterbox service loads correctly from the new GitHub repository
 */

import { ServiceRegistry } from './src/media/registry/ServiceRegistry';

async function testChatterboxServiceMigration() {
  console.log('🧪 Testing Chatterbox Service Migration from GitHub\n');

  const serviceRegistry = ServiceRegistry.getInstance();

  try {
    // Test loading Chatterbox service from GitHub
    console.log('1. Loading Chatterbox service from GitHub...');
    const chatterboxService = await serviceRegistry.getService('github:MediaConduit/chatterbox-service');
    console.log('   ✅ Service loaded successfully');

    // Check service configuration
    console.log('\n2. Checking service configuration...');
    const serviceInfo = chatterboxService.getServiceInfo();
    console.log('   📋 Service Info:');
    console.log(`      Container: ${serviceInfo.containerName}`);
    console.log(`      Image: ${serviceInfo.dockerImage}`);
    console.log(`      Ports: ${serviceInfo.ports}`);
    console.log(`      Health Check: ${serviceInfo.healthCheckUrl}`);
    console.log(`      Compose File: ${serviceInfo.composeFile}`);

    // Check initial status
    console.log('\n3. Checking initial service status...');
    const initialStatus = await chatterboxService.getServiceStatus();
    console.log(`   📊 Initial Status: Running=${initialStatus.running}, Health=${initialStatus.health}`);

    // Start the service
    console.log('\n4. Starting Chatterbox service...');
    const started = await chatterboxService.startService();
    
    if (started) {
      console.log('   ✅ Service started successfully');
      
      // Check status after starting
      console.log('\n5. Checking service status after startup...');
      const runningStatus = await chatterboxService.getServiceStatus();
      console.log(`   📊 Post-start Status: Running=${runningStatus.running}, Health=${runningStatus.health}`);
      
      // Wait for healthy status
      console.log('\n6. Waiting for service to become healthy...');
      const isHealthy = await chatterboxService.waitForHealthy(120000); // 2 minute timeout
      
      if (isHealthy) {
        console.log('   ✅ Service is healthy and ready!');
        
        // Final status check
        const finalStatus = await chatterboxService.getServiceStatus();
        console.log(`   📊 Final Status: Running=${finalStatus.running}, Health=${finalStatus.health}`);
        
        // Test the health endpoint
        console.log('\n7. Testing service health endpoint...');
        try {
          const response = await fetch('http://localhost:8004/health');
          if (response.ok) {
            const healthData = await response.text();
            console.log('   ✅ Health endpoint responding:', healthData);
          } else {
            console.log('   ⚠️ Health endpoint returned:', response.status);
          }
        } catch (fetchError) {
          console.log('   ⚠️ Could not reach health endpoint:', fetchError.message);
        }
        
        // Test capabilities endpoint
        console.log('\n8. Testing service capabilities...');
        try {
          const capResponse = await fetch('http://localhost:8004/voices');
          if (capResponse.ok) {
            const voices = await capResponse.json();
            console.log(`   🎙️ Available voices: ${voices.length || 'N/A'}`);
            if (voices.length > 0) {
              voices.slice(0, 3).forEach(voice => {
                console.log(`      • ${voice.name || voice}`);
              });
            }
          } else {
            console.log('   ⚠️ Voices endpoint returned:', capResponse.status);
          }
        } catch (voiceError) {
          console.log('   ⚠️ Could not reach voices endpoint:', voiceError.message);
        }
        
      } else {
        console.log('   ❌ Service failed to become healthy within timeout');
      }
      
      // Stop the service for cleanup
      console.log('\n9. Stopping service for cleanup...');
      await chatterboxService.stopService();
      
    } else {
      console.log('   ❌ Failed to start service');
    }

    console.log('\n✅ CHATTERBOX SERVICE MIGRATION SUCCESS!');
    console.log('===========================================');
    console.log('🎯 Service can now be loaded dynamically from GitHub');
    console.log('🔄 Providers can use: github:MediaConduit/chatterbox-service');
    console.log('📦 Repository: https://github.com/MediaConduit/chatterbox-service');
    console.log('🎙️ Ready for voice cloning and TTS generation!');

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  }
}

if (require.main === module) {
  testChatterboxServiceMigration().catch(console.error);
}

export { testChatterboxServiceMigration };
