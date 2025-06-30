/**
 * Test Dynamic Port Assignment for Cowsay Provider
 * 
 * This test verifies that the Cowsay provider can use dynamic port assignment
 * instead of hardcoded port 80.
 */

import { ProviderRegistry } from './src/media/registry/ProviderRegistry';

async function testCowsayDynamicPorts() {
  console.log('🧪 Testing Cowsay provider with dynamic port assignment...');

  try {
    const registry = ProviderRegistry.getInstance();
    
    console.log('🔄 Loading Cowsay provider from GitHub...');
    const provider = await registry.getProvider('https://github.com/MediaConduit/cowsay-provider');
    console.log(`✅ Provider loaded: ${provider.name}`);
    
    // Start the service and check if it gets a dynamic port
    console.log('🐳 Starting Cowsay service...');
    const serviceStarted = await (provider as any).startService();
    console.log(`🐳 Service started: ${serviceStarted}`);
    
    if (serviceStarted) {
      // Get service info to see the assigned port
      if ('dockerService' in provider && provider.dockerService) {
        try {
          const serviceInfo = (provider as any).dockerService.getServiceInfo();
          console.log(`📊 Service Info:`, {
            ports: serviceInfo.ports,
            healthCheckUrl: serviceInfo.healthCheckUrl,
            containerName: serviceInfo.containerName
          });
          
          if (serviceInfo.ports && serviceInfo.ports.length > 0) {
            const assignedPort = serviceInfo.ports[0];
            if (assignedPort !== 80) {
              console.log(`✅ SUCCESS: Dynamic port assignment working! Assigned port: ${assignedPort}`);
            } else {
              console.log(`⚠️ WARNING: Port is still 80. Dynamic assignment may not be working.`);
            }
          }
        } catch (serviceInfoError) {
          console.warn('⚠️ Could not get service info:', serviceInfoError);
        }
      }
      
      // Wait for service to be ready
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Test model creation and usage
      try {
        const model = await provider.getModel('cowsay-default');
        const available = await model.isAvailable();
        console.log(`🔍 Model available: ${available}`);
        
        if (available) {
          const result = await model.generate('Testing dynamic ports!');
          console.log('📤 Generated cowsay:');
          console.log(result.content);
          console.log('\n✅ Dynamic port assignment test completed successfully!');
        } else {
          console.log('❌ Model not available - service may not be running correctly');
        }
      } catch (modelError) {
        console.error('❌ Model test failed:', modelError);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCowsayDynamicPorts().catch(console.error);
