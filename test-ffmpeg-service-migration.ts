/**
 * Test Dynamic FFMPEG Service Loading
 * 
 * Test loading the FFMPEG service from the new GitHub repository
 */

import { ServiceRegistry } from './src/media/registry/ServiceRegistry';

async function testFFMPEGServiceMigration() {
  console.log('🧪 Testing FFMPEG Service Migration\n');

  const serviceRegistry = ServiceRegistry.getInstance();

  console.log('📦 TESTING DYNAMIC SERVICE LOADING:');
  console.log('===================================');

  try {
    // Test loading FFMPEG service from GitHub
    console.log('1. Loading FFMPEG service from GitHub repository...');
    const ffmpegService = await serviceRegistry.getService('github:MediaConduit/ffmpeg-service');
    
    console.log(`   ✅ Service loaded successfully`);
    
    // Get service info
    const serviceInfo = ffmpegService.getServiceInfo();
    console.log(`   📋 Service Info:`);
    console.log(`      Container: ${serviceInfo.containerName}`);
    console.log(`      Image: ${serviceInfo.dockerImage}`);
    console.log(`      Ports: ${serviceInfo.ports.join(', ')}`);
    console.log(`      Health Check: ${serviceInfo.healthCheckUrl}`);
    console.log(`      Compose File: ${serviceInfo.composeFile}`);

    // Test service status (without actually starting it)
    console.log('\n2. Checking service status...');
    const status = await ffmpegService.getServiceStatus();
    console.log(`   📊 Service Status:`);
    console.log(`      Running: ${status.running}`);
    console.log(`      Health: ${status.health}`);
    console.log(`      State: ${status.state}`);

    console.log('\n✅ FFMPEG SERVICE MIGRATION SUCCESS!');
    console.log('====================================');
    console.log('🎯 The service can now be loaded dynamically from GitHub');
    console.log('🔄 Providers can use: github:MediaConduit/ffmpeg-service');
    console.log('📦 Repository: https://github.com/MediaConduit/ffmpeg-service');

  } catch (error) {
    console.log(`   ❌ Service loading failed: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
  }

  console.log('\n🚀 NEXT STEPS:');
  console.log('===============');
  console.log('1. Update FFMPEGDockerProvider to use GitHub URL');
  console.log('2. Remove local services/ffmpeg directory'); 
  console.log('3. Test provider integration with dynamic service');
  console.log('4. Migrate remaining services');
}

if (require.main === module) {
  testFFMPEGServiceMigration().catch(console.error);
}

export { testFFMPEGServiceMigration };
