/**
 * Debug the port detection system
 */

import { getProviderRegistry } from './src/media/registry/ProviderRegistry';

async function debugPortDetection() {
  console.log('🔍 Debugging Port Detection...');
  
  try {
    const registry = getProviderRegistry();
    const provider = await registry.getProvider('https://github.com/MediaConduit/ollama-provider');
    
    // Access the internal docker service to see what ports it thinks it has
    const dockerService = (provider as any).dockerService;
    
    if (dockerService) {
      console.log('\n📋 Docker Service Info:');
      const serviceInfo = dockerService.getServiceInfo();
      console.log('Service Info:', JSON.stringify(serviceInfo, null, 2));
      
      console.log('\n🔍 Checking different port detection methods:');
      
      // Method 1: Service info ports
      if (serviceInfo.ports) {
        console.log('📊 Service Info Ports:', serviceInfo.ports);
      }
      
      // Method 2: Try to detect running ports
      if (dockerService.detectRunningPorts) {
        const runningPorts = await dockerService.detectRunningPorts();
        console.log('🔍 Detected Running Ports:', runningPorts);
      }
      
      // Method 2.5: Check assigned ports
      console.log('📋 Assigned Ports:', dockerService.assignedPorts);
      console.log('📋 Assigned Ports Length:', dockerService.assignedPorts?.length || 'undefined');
      
      // Method 3: Check service status
      if (dockerService.getServiceStatus) {
        const status = await dockerService.getServiceStatus();
        console.log('📈 Service Status:', JSON.stringify(status, null, 2));
      }
      
      // Method 4: Check environment variables
      console.log('\n🌍 Environment Variables:');
      console.log('OLLAMA_HOST_PORT:', process.env.OLLAMA_HOST_PORT);
      
    } else {
      console.log('❌ No docker service found');
    }
    
  } catch (error: any) {
    console.error('💥 Debug failed:', error.message);
  }
}

debugPortDetection().catch(console.error);
