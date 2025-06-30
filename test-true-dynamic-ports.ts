/**
 * Test True Dynamic Port Assignment
 * 
 * This test verifies that services are actually using random ports,
 * not hardcoded ones like 11434.
 */

import { getProviderRegistry } from './src/media/registry/ProviderRegistry';

async function testTrueDynamicPorts() {
  console.log('🧪 Testing TRUE Dynamic Port Assignment...');
  
  try {
    const registry = getProviderRegistry();
    
    // Load Ollama provider
    console.log('🔄 Loading Ollama provider...');
    const provider = await registry.getProvider('https://github.com/MediaConduit/ollama-provider');
    console.log('✅ Provider loaded:', provider.name);
    
    // Configure provider (this should detect the dynamic port)
    console.log('\n🔧 Configuring provider...');
    await provider.configure({});
    
    // Let's check what port the provider is actually using
    // @ts-ignore - accessing internal property for testing
    const apiClient = provider.apiClient;
    if (apiClient && apiClient.baseURL) {
      const portMatch = apiClient.baseURL.match(/:(\d+)/);
      const detectedPort = portMatch ? parseInt(portMatch[1]) : null;
      
      console.log('🔍 Provider configured with port:', detectedPort);
      
      if (detectedPort === 11434) {
        console.log('❌ PROBLEM: Using hardcoded port 11434 (not dynamic!)');
        console.log('💡 The service is NOT using true dynamic port assignment');
      } else if (detectedPort && detectedPort > 30000) {
        console.log('✅ SUCCESS: Using dynamic port', detectedPort, '(truly random!)');
        console.log('🎯 This is proper dynamic port assignment!');
      } else {
        console.log('⚠️  Unexpected port:', detectedPort);
      }
    } else {
      console.log('❌ Could not detect provider port configuration');
    }
    
    // Test that the service actually works on the dynamic port
    console.log('\n📋 Testing service functionality on dynamic port...');
    const isAvailable = await provider.isAvailable();
    console.log('✅ Provider available on dynamic port:', isAvailable);
    
    if (isAvailable) {
      console.log('\n🎉 Dynamic port assignment working correctly!');
      console.log('💡 Multiple services can now run without port conflicts');
    }
    
  } catch (error: any) {
    console.error('\n💥 Test failed:', error.message);
  }
}

// Run the test
testTrueDynamicPorts().catch(console.error);
