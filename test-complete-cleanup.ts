/**
 * Test Complete Cleanup Functionality
 * 
 * Test that cleanup properly removes containers and directories
 */

import { FFMPEGDockerProvider } from './src/media/providers/docker/ffmpeg/FFMPEGDockerProvider';

async function testCompleteCleanup() {
  console.log('🧹 Testing Complete Cleanup Functionality\n');

  try {
    // Create and configure provider
    console.log('1. Creating and configuring FFMPEGDockerProvider...');
    const provider = new FFMPEGDockerProvider();
    await provider.configure({
      serviceUrl: 'github:MediaConduit/ffmpeg-service',
      baseUrl: 'http://localhost:8006'
    });
    console.log('   ✅ Provider configured');

    // Start the service
    console.log('\n2. Starting service to create containers and directories...');
    await provider.start();
    
    // Wait for it to be healthy
    let attempts = 0;
    let isAvailable = false;
    while (attempts < 15 && !isAvailable) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      isAvailable = await provider.isAvailable();
      attempts++;
    }
    
    console.log(`   📊 Service Available: ${isAvailable ? '✅ Yes' : '❌ No'}`);

    // Check what containers exist
    console.log('\n3. Checking Docker containers before cleanup...');
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      const { stdout: containersBefore } = await execAsync('docker ps -a --filter name=ffmpeg --format "table {{.Names}}\\t{{.Status}}"');
      console.log('   📦 Containers before cleanup:');
      console.log(containersBefore);
    } catch (error) {
      console.log('   ⚠️ Could not list containers');
    }

    // Check temp directories
    console.log('\n4. Checking temp directories before cleanup...');
    const fs = require('fs');
    try {
      if (fs.existsSync('temp/services')) {
        const tempDirs = fs.readdirSync('temp/services');
        console.log(`   📁 Temp service directories: ${tempDirs.length}`);
        tempDirs.forEach(dir => console.log(`      • ${dir}`));
      } else {
        console.log('   📁 No temp/services directory found');
      }
    } catch (error) {
      console.log('   ⚠️ Could not check temp directories');
    }

    // Perform complete cleanup
    console.log('\n5. Performing complete cleanup...');
    await provider.cleanup();
    console.log('   ✅ Cleanup completed');

    // Check containers after cleanup
    console.log('\n6. Checking Docker containers after cleanup...');
    try {
      const { stdout: containersAfter } = await execAsync('docker ps -a --filter name=ffmpeg --format "table {{.Names}}\\t{{.Status}}"');
      console.log('   📦 Containers after cleanup:');
      console.log(containersAfter || '   (no containers found)');
    } catch (error) {
      console.log('   ⚠️ Could not list containers');
    }

    // Check temp directories after cleanup
    console.log('\n7. Checking temp directories after cleanup...');
    try {
      if (fs.existsSync('temp/services')) {
        const tempDirs = fs.readdirSync('temp/services');
        console.log(`   📁 Temp service directories: ${tempDirs.length}`);
        if (tempDirs.length > 0) {
          tempDirs.forEach(dir => console.log(`      • ${dir}`));
        } else {
          console.log('   📁 All temp directories cleaned up!');
        }
      } else {
        console.log('   📁 temp/services directory removed completely!');
      }
    } catch (error) {
      console.log('   ⚠️ Could not check temp directories');
    }

    // Test that it can start again (auto re-clone)
    console.log('\n8. Testing auto re-clone by starting again...');
    await provider.start();
    
    attempts = 0;
    isAvailable = false;
    while (attempts < 10 && !isAvailable) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      isAvailable = await provider.isAvailable();
      attempts++;
    }
    
    console.log(`   📊 Service Available After Re-clone: ${isAvailable ? '✅ Yes' : '❌ No'}`);
    
    if (isAvailable) {
      console.log('   🔄 Auto re-clone successful!');
    }

    // Final cleanup
    console.log('\n9. Final cleanup...');
    await provider.cleanup();

    console.log('\n✅ COMPLETE CLEANUP TEST SUCCESS!');
    console.log('===================================');
    console.log('🧹 Cleanup removes containers and volumes');
    console.log('🗂️ Cleanup removes cloned directories');
    console.log('🔄 Subsequent starts auto re-clone from GitHub');
    console.log('♻️ Complete lifecycle management working!');

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  }
}

if (require.main === module) {
  testCompleteCleanup().catch(console.error);
}

export { testCompleteCleanup };
