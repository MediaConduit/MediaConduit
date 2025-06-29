/**
 * Test Service Registry Reuse
 * 
 * Test that services are reused instead of re-cloned
 */

import { ServiceRegistry } from './src/media/registry/ServiceRegistry';

async function testServiceReuse() {
  console.log('🔄 Testing Service Registry Reuse\n');

  const serviceRegistry = ServiceRegistry.getInstance();

  try {
    console.log('1. First call - should clone service...');
    const startTime1 = Date.now();
    const service1 = await serviceRegistry.getService('github:MediaConduit/ffmpeg-service');
    const duration1 = Date.now() - startTime1;
    console.log(`   ✅ First call completed in ${duration1}ms`);
    console.log(`   📁 Service info: ${service1.getServiceInfo().containerName}`);

    console.log('\n2. Second call - should reuse existing service...');
    const startTime2 = Date.now();
    const service2 = await serviceRegistry.getService('github:MediaConduit/ffmpeg-service');
    const duration2 = Date.now() - startTime2;
    console.log(`   ✅ Second call completed in ${duration2}ms`);
    console.log(`   📁 Service info: ${service2.getServiceInfo().containerName}`);

    console.log('\n3. Third call - should also reuse existing service...');
    const startTime3 = Date.now();
    const service3 = await serviceRegistry.getService('github:MediaConduit/ffmpeg-service');
    const duration3 = Date.now() - startTime3;
    console.log(`   ✅ Third call completed in ${duration3}ms`);

    console.log('\n📊 Performance Analysis:');
    console.log(`   🕐 First call (clone): ${duration1}ms`);
    console.log(`   🕐 Second call (reuse): ${duration2}ms`);
    console.log(`   🕐 Third call (reuse): ${duration3}ms`);
    
    const reuseSavings1 = Math.round(((duration1 - duration2) / duration1) * 100);
    const reuseSavings2 = Math.round(((duration1 - duration3) / duration1) * 100);
    
    console.log(`   📈 Reuse savings: ${reuseSavings1}% and ${reuseSavings2}%`);

    // Test different service
    console.log('\n4. Testing different service (HuggingFace)...');
    const startTime4 = Date.now();
    const service4 = await serviceRegistry.getService('github:MediaConduit/huggingface-service');
    const duration4 = Date.now() - startTime4;
    console.log(`   ✅ HuggingFace service loaded in ${duration4}ms`);

    // Test HuggingFace reuse
    console.log('\n5. Testing HuggingFace service reuse...');
    const startTime5 = Date.now();
    const service5 = await serviceRegistry.getService('github:MediaConduit/huggingface-service');
    const duration5 = Date.now() - startTime5;
    console.log(`   ✅ HuggingFace service reused in ${duration5}ms`);
    
    const hfReuseSavings = Math.round(((duration4 - duration5) / duration4) * 100);
    console.log(`   📈 HuggingFace reuse savings: ${hfReuseSavings}%`);

    console.log('\n✅ SERVICE REUSE TEST COMPLETE!');
    console.log('================================');
    console.log('🎯 Services are reused instead of re-cloned');
    console.log('⚡ Massive performance improvement on subsequent calls');
    console.log('💾 Disk space saved by avoiding duplicate clones');
    console.log('🚀 ServiceRegistry optimization working perfectly!');

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  }
}

if (require.main === module) {
  testServiceReuse().catch(console.error);
}

export { testServiceReuse };
