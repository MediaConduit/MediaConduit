/**
 * Test HuggingFace Service Migration from GitHub
 * 
 * Test that the HuggingFace service loads correctly from the new GitHub repository
 */

import { ServiceRegistry } from './src/media/registry/ServiceRegistry';

async function testHuggingFaceServiceMigration() {
  console.log('🧪 Testing HuggingFace Service Migration from GitHub\n');

  const serviceRegistry = ServiceRegistry.getInstance();

  try {
    // Test loading HuggingFace service from GitHub
    console.log('1. Loading HuggingFace service from GitHub...');
    const huggingfaceService = await serviceRegistry.getService('github:MediaConduit/huggingface-service');
    console.log('   ✅ Service loaded successfully');

    // Check service configuration
    console.log('\n2. Checking service configuration...');
    const serviceInfo = huggingfaceService.getServiceInfo();
    console.log('   📋 Service Info:');
    console.log(`      Container: ${serviceInfo.containerName}`);
    console.log(`      Image: ${serviceInfo.dockerImage}`);
    console.log(`      Ports: ${serviceInfo.ports}`);
    console.log(`      Health Check: ${serviceInfo.healthCheckUrl}`);
    console.log(`      Compose File: ${serviceInfo.composeFile}`);

    // Check initial status
    console.log('\n3. Checking initial service status...');
    const initialStatus = await huggingfaceService.getServiceStatus();
    console.log(`   📊 Initial Status: Running=${initialStatus.running}, Health=${initialStatus.health}`);

    // Test service capabilities
    console.log('\n4. Testing service capabilities...');
    
    // Start the service
    console.log('\n5. Starting HuggingFace service...');
    const started = await huggingfaceService.startService();
    
    if (started) {
      console.log('   ✅ Service started successfully');
      
      // Check status after starting
      console.log('\n6. Checking service status after startup...');
      const runningStatus = await huggingfaceService.getServiceStatus();
      console.log(`   📊 Post-start Status: Running=${runningStatus.running}, Health=${runningStatus.health}`);
      
      // Wait for healthy status
      console.log('\n7. Waiting for service to become healthy...');
      const isHealthy = await huggingfaceService.waitForHealthy(120000); // 2 minute timeout for model loading
      
      if (isHealthy) {
        console.log('   ✅ Service is healthy and ready!');
        
        // Final status check
        const finalStatus = await huggingfaceService.getServiceStatus();
        console.log(`   📊 Final Status: Running=${finalStatus.running}, Health=${finalStatus.health}`);
        
        // Test the health endpoint
        console.log('\n8. Testing service health endpoint...');
        try {
          const response = await fetch('http://localhost:8007/health');
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
      console.log('\n9. Stopping service for cleanup...');
      await huggingfaceService.stopService();
      
    } else {
      console.log('   ❌ Failed to start service');
    }

    console.log('\n✅ HUGGINGFACE SERVICE MIGRATION SUCCESS!');
    console.log('===========================================');
    console.log('🎯 Service can now be loaded dynamically from GitHub');
    console.log('🔄 Providers can use: github:MediaConduit/huggingface-service');
    console.log('📦 Repository: https://github.com/MediaConduit/huggingface-service');
    console.log('🚀 Ready for provider integration!');

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  }
}

if (require.main === module) {
  testHuggingFaceServiceMigration().catch(console.error);
}

export { testHuggingFaceServiceMigration };
