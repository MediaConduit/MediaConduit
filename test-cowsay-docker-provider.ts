/**
 * Test the Cowsay Docker Provider
 *
 * This script tests the complete Cowsay TTS Docker integration
 */

import { CowsayDockerProvider } from './src/media/providers/docker/cowsay/CowsayDockerProvider';
import { Text } from './src/media/assets/roles';
import { ServiceRegistry } from './src/media/registry/ServiceRegistry';

async function testCowsayProvider() {
  console.log('🧪 Testing Cowsay Docker Provider...\n');

  const provider = new CowsayDockerProvider();
  
  await provider.configure({
    serviceUrl: 'github:MediaConduit/cowsay-service'
  });
  await provider.startService();

  // Wait for the provider to be available
  console.log('Waiting for Cowsay Docker Provider to be available...');
  let attempts = 0;
  while (!(await provider.isAvailable()) && attempts < 10) { // Max 120 seconds wait
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  if (!(await provider.isAvailable())) {
    console.error('Cowsay Docker Provider did not become available in time.');
    return;
  }
  console.log('Cowsay Docker Provider is now available.');

  try {
    // Test 1: Provider Info
    console.log('📋 Provider Info:');
    console.log(`   Name: ${provider.name}`);
    console.log(`   Type: ${provider.type}`);
    console.log(`   Capabilities: ${provider.capabilities.join(', ')}`);
    console.log('');

    // Test 2: Check availability
    console.log('🔍 Checking availability...');
    const available = await provider.isAvailable();
    console.log(`   Available: ${available}`);
    console.log('');

    // Test 3: Start service
    console.log('🚀 Starting Cowsay Docker service...');
    const started = await provider.startService();
    console.log(`   Service started: ${started}`);
    
    if (!started) {
      console.log('⚠️  Service failed to start. Please check Docker setup.');
      return;
    }
    console.log('');

    // Test 4: Service status
    console.log('📊 Checking service status...');
    const status = await provider.getServiceStatus();
    console.log(`   Running: ${status.running}`);
    console.log(`   Healthy: ${status.healthy}`);
    if (status.error) {
      console.log(`   Error: ${status.error}`);
    }
    console.log('');

    // Test 5: Available models
    console.log('💬 Available models:');
    const models = provider.getAvailableModels();
    models.forEach(model => console.log(`   - ${model}`));
    console.log('');

    // Test 6: Create model instance
    console.log('🔧 Creating model instance...');
    const model = await provider.createModel('cowsay-default');
    console.log(`   Model created: ${model.getName()}`);
    console.log('');

    // Test 7: Check model availability
    console.log('✅ Checking model availability...');
    const modelAvailable = await model.isAvailable();
    console.log(`   Model available: ${modelAvailable}`);
    console.log('');

    // Test 8: Generate Cowsay output
    if (modelAvailable) {
      console.log('🐄 Generating test cowsay output...');
      
      const textInput = new Text('Hello from Gemini CLI!');

      try {
        const cowsayOutput = await model.transform(textInput);

        console.log(`   ✅ Cowsay output generated successfully!`);
        console.log(`\n${cowsayOutput.content}\n`);
        
      } catch (error) {
        console.log(`   ❌ Cowsay generation failed: ${error.message}`);
      }
    } else {
      console.log('⚠️  Model not available, skipping cowsay generation test');
    }
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('🏁 Cowsay Docker Provider is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Optional: Stop service after tests
    console.log('\n🛑 Stopping service...');
    try {
      await provider.stopService();
      console.log('✅ Service stopped successfully');
    } catch (error) {
      console.log(`⚠️  Error stopping service: ${error.message}`);
    }
  }
}

// Run the test
if (require.main === module) {
  testCowsayProvider().catch(console.error);
}

export { testCowsayProvider };
