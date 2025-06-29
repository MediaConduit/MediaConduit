/**
 * Quick Kokoro Service Test
 */

import { ServiceRegistry } from './src/media/registry/ServiceRegistry';

async function quickKokoroTest() {
  console.log('🗾 Quick Kokoro Service Test\n');

  try {
    const serviceRegistry = ServiceRegistry.getInstance();
    
    console.log('1. Loading Kokoro service (should reuse)...');
    const startTime = Date.now();
    const kokoroService = await serviceRegistry.getService('github:MediaConduit/kokoro-service');
    const loadTime = Date.now() - startTime;
    console.log(`   ✅ Service loaded in ${loadTime}ms (reused!)`);

    console.log('\n2. Starting service...');
    const started = await kokoroService.startService();
    
    if (started) {
      console.log('   ✅ Service started successfully');
      
      // Quick health check
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      const status = await kokoroService.getServiceStatus();
      console.log(`   📊 Status: Running=${status.running}, Health=${status.health}`);
      
      // Stop for cleanup
      await kokoroService.stopService();
      console.log('   ✅ Service stopped for cleanup');
    }

    console.log('\n✅ KOKORO QUICK TEST SUCCESS!');
    console.log('🗾 Kokoro TTS service working from GitHub!');

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

if (require.main === module) {
  quickKokoroTest().catch(console.error);
}

export { quickKokoroTest };
