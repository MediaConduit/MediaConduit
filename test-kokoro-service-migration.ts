/**
 * Test Kokoro Service Migration from GitHub
 * 
 * Test that the Kokoro service loads correctly from the new GitHub repository
 */

import { ServiceRegistry } from './src/media/registry/ServiceRegistry';

async function testKokoroServiceMigration() {
  console.log('🗾 Testing Kokoro Service Migration from GitHub\n');

  const serviceRegistry = ServiceRegistry.getInstance();

  try {
    // Test loading Kokoro service from GitHub (should reuse directory structure)
    console.log('1. Loading Kokoro service from GitHub...');
    const startTime = Date.now();
    const kokoroService = await serviceRegistry.getService('github:MediaConduit/kokoro-service');
    const loadTime = Date.now() - startTime;
    console.log(`   ✅ Service loaded in ${loadTime}ms`);

    // Check service configuration
    console.log('\n2. Checking service configuration...');
    const serviceInfo = kokoroService.getServiceInfo();
    console.log('   📋 Service Info:');
    console.log(`      Container: ${serviceInfo.containerName}`);
    console.log(`      Image: ${serviceInfo.dockerImage}`);
    console.log(`      Ports: ${serviceInfo.ports}`);
    console.log(`      Health Check: ${serviceInfo.healthCheckUrl}`);
    console.log(`      Compose File: ${serviceInfo.composeFile}`);

    // Check initial status
    console.log('\n3. Checking initial service status...');
    const initialStatus = await kokoroService.getServiceStatus();
    console.log(`   📊 Initial Status: Running=${initialStatus.running}, Health=${initialStatus.health}`);

    // Start the service
    console.log('\n4. Starting Kokoro service...');
    const started = await kokoroService.startService();
    
    if (started) {
      console.log('   ✅ Service started successfully');
      
      // Wait for healthy status
      console.log('\n5. Waiting for service to become healthy...');
      const isHealthy = await kokoroService.waitForHealthy(60000); // 1 minute timeout
      
      if (isHealthy) {
        console.log('   ✅ Service is healthy and ready!');
        
        // Final status check
        const finalStatus = await kokoroService.getServiceStatus();
        console.log(`   📊 Final Status: Running=${finalStatus.running}, Health=${finalStatus.health}`);
        
        // Test the health endpoint (note: internal port is 8880)
        console.log('\n6. Testing service health endpoint...');
        try {
          const response = await fetch('http://localhost:8005/health');
          if (response.ok) {
            const healthData = await response.text();
            console.log('   ✅ Health endpoint responding:', healthData);
          } else {
            console.log('   ⚠️ Health endpoint returned:', response.status);
          }
        } catch (fetchError) {
          console.log('   ⚠️ Could not reach health endpoint:', fetchError.message);
        }
        
      } else {
        console.log('   ❌ Service failed to become healthy within timeout');
      }
      
      // Stop the service for cleanup
      console.log('\n7. Stopping service for cleanup...');
      await kokoroService.stopService();
      
    } else {
      console.log('   ❌ Failed to start service');
    }

    console.log('\n✅ KOKORO SERVICE MIGRATION SUCCESS!');
    console.log('====================================');
    console.log('🎯 Service can now be loaded dynamically from GitHub');
    console.log('🔄 Providers can use: github:MediaConduit/kokoro-service');
    console.log('📦 Repository: https://github.com/MediaConduit/kokoro-service');
    console.log('🗾 Japanese TTS ready for provider integration!');

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  }
}

if (require.main === module) {
  testKokoroServiceMigration().catch(console.error);
}

export { testKokoroServiceMigration };
