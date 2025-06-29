/**
 * Test Directory Cleanup Specifically
 */

import { FFMPEGDockerProvider } from './src/media/providers/docker/ffmpeg/FFMPEGDockerProvider';

async function testDirectoryCleanup() {
  console.log('🗂️ Testing Directory Cleanup Specifically\n');

  try {
    const provider = new FFMPEGDockerProvider();
    await provider.configure({
      serviceUrl: 'github:MediaConduit/ffmpeg-service',
      baseUrl: 'http://localhost:8006'
    });

    // Start service to create directory
    console.log('1. Starting service to create directory...');
    await provider.start();

    // Count directories before
    const fs = require('fs');
    const beforeCount = fs.existsSync('temp/services') ? fs.readdirSync('temp/services').length : 0;
    console.log(`   📁 Temp directories before cleanup: ${beforeCount}`);

    // Cleanup
    console.log('\n2. Running cleanup...');
    await provider.cleanup();

    // Count directories after
    const afterCount = fs.existsSync('temp/services') ? fs.readdirSync('temp/services').length : 0;
    console.log(`   📁 Temp directories after cleanup: ${afterCount}`);

    if (afterCount < beforeCount) {
      console.log('   ✅ Directory cleanup working!');
    } else {
      console.log('   ⚠️ Directory cleanup may not be working');
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

if (require.main === module) {
  testDirectoryCleanup().catch(console.error);
}

export { testDirectoryCleanup };
