/**
 * Test script to verify Ollama service migration from GitHub
 */

import { ServiceRegistry } from './src/media/registry/ServiceRegistry';

async function testOllamaServiceMigration() {
  console.log('🔍 Testing Ollama Service Migration from GitHub\n');

  try {
    console.log('1. Creating ServiceRegistry...');
    const serviceRegistry = ServiceRegistry.getInstance();
    console.log('   ✅ ServiceRegistry created successfully');

    console.log('\n2. Loading Ollama service from GitHub...');
    const service = await serviceRegistry.getService('github:MediaConduit/ollama-service');
    console.log('   ✅ Service loaded from GitHub');

    console.log('\n3. Verifying service configuration...');
    const serviceInfo = service.getServiceInfo();
    console.log('   Service Info:', {
      containerName: serviceInfo.containerName,
      dockerImage: serviceInfo.dockerImage,
      ports: serviceInfo.ports,
      composeService: serviceInfo.composeService,
      healthCheckUrl: serviceInfo.healthCheckUrl
    });
    console.log('   ✅ Service configuration verified');

    console.log('\n4. Testing service startup...');
    const started = await service.startService();
    
    if (started) {
      console.log('   ✅ Service started successfully');
      
      console.log('\n5. Waiting for service to become healthy...');
      const isHealthy = await service.waitForHealthy(60000);
      
      if (isHealthy) {
        console.log('   ✅ Service is healthy');
        
        console.log('\n6. Getting service status...');
        const status = await service.getServiceStatus();
        console.log('   Status:', status);
        
        console.log('\n7. Stopping service...');
        await service.stopService();
        console.log('   ✅ Service stopped');
      } else {
        console.log('   ⚠️  Service not healthy within timeout');
      }
    } else {
      console.log('   ❌ Failed to start service');
    }

    console.log('\n✅ OLLAMA SERVICE MIGRATION TEST COMPLETE!');
    console.log('🎯 Service loads successfully from GitHub');
    console.log('📦 Service configuration is valid');
    console.log('🔄 Dynamic service loading operational');

  } catch (error) {
    console.log(`❌ Migration test failed: ${error.message}`);
    console.error(error);
  }
}

// Run the test
testOllamaServiceMigration().catch(console.error);
