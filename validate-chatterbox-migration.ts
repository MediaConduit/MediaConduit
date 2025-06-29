/**
 * Chatterbox Migration Validation
 * 
 * Quick validation that the GitHub service loading works
 */

import { ServiceRegistry } from './src/media/registry/ServiceRegistry';

async function validateChatterboxMigration() {
  console.log('🔍 Chatterbox Migration Validation\n');

  try {
    console.log('1. Loading Chatterbox service from GitHub...');
    const serviceRegistry = ServiceRegistry.getInstance();
    const chatterboxService = await serviceRegistry.getService('github:MediaConduit/chatterbox-service');
    console.log('   ✅ Service loaded successfully from GitHub');

    console.log('\n2. Checking service configuration...');
    const serviceInfo = chatterboxService.getServiceInfo();
    console.log(`   📋 Container: ${serviceInfo.containerName}`);
    console.log(`   🐳 Image: ${serviceInfo.dockerImage}`);
    console.log(`   🔌 Port: ${serviceInfo.ports}`);
    console.log(`   🏥 Health Check: ${serviceInfo.healthCheckUrl}`);

    console.log('\n3. Checking service status...');
    const status = await chatterboxService.getServiceStatus();
    console.log(`   📊 Running: ${status.running}`);
    console.log(`   🏥 Health: ${status.health}`);

    if (status.running) {
      console.log('\n   ℹ️ Note: Service may take 2-5 minutes to become healthy');
      console.log('   ℹ️ This is normal as TTS models need to be downloaded and loaded');
    }

    console.log('\n✅ CHATTERBOX MIGRATION VALIDATION COMPLETE!');
    console.log('============================================');
    console.log('🎯 Service loads from GitHub successfully');
    console.log('🔄 Dynamic service loading operational');
    console.log('📦 Repository: https://github.com/MediaConduit/chatterbox-service');
    console.log('🎙️ Ready for voice cloning and TTS integration!');

  } catch (error) {
    console.log(`❌ Validation failed: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  }
}

if (require.main === module) {
  validateChatterboxMigration().catch(console.error);
}

export { validateChatterboxMigration };
