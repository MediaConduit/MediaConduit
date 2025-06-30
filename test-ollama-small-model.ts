import { getProviderRegistry } from './src/media/registry/ProviderRegistry';
import { MediaCapability } from './src/media/types/provider';

async function testOllamaSmallModel() {
  console.log('🧪 Testing Ollama Provider with Small Model...');
  
  try {
    // Load the dynamic Ollama provider
    console.log('📋 Test 1: Loading Ollama Provider');
    const providerRegistry = getProviderRegistry();
    const provider = await providerRegistry.getProvider('https://github.com/MediaConduit/ollama-provider');
    
    if (!provider) {
      throw new Error('Failed to load Ollama provider');
    }
    
    console.log('✅ Provider loaded:', provider.name);
    
    // Check if provider is available
    console.log('\n📋 Test 2: Checking Provider Availability');
    const isAvailable = await provider.isAvailable();
    console.log('✅ Provider available:', isAvailable);
    
    if (!isAvailable) {
      throw new Error('Provider not available');
    }
    
    // Configure the provider
    console.log('\n📋 Test 3: Configuring Provider');
    await provider.configure({});
    console.log('✅ Provider configured');
    
    // Try to get a small model (llama3.2:1b is about 1.3GB)
    console.log('\n📋 Test 4: Getting Small Model (llama3.2:1b)');
    console.log('⚠️  This will download ~1.3GB if not already present...');
    
    let model;
    try {
      model = await provider.getModel('llama3.2:1b');
      console.log('✅ Model acquired:', model.getId());
    } catch (error: any) {
      console.error('❌ Failed to get model:', error.message);
      
      // Try an even smaller model if llama3.2:1b fails
      console.log('\n📋 Fallback: Trying qwen2.5:0.5b (smaller model)');
      try {
        model = await provider.getModel('qwen2.5:0.5b');
        console.log('✅ Fallback model acquired:', model.getId());
      } catch (fallbackError: any) {
        console.error('❌ Fallback also failed:', fallbackError.message);
        throw new Error('Unable to acquire any model');
      }
    }
    
    // Test text generation
    console.log('\n📋 Test 5: Text Generation');
    const prompt = "Hello! Can you tell me a very short joke?";
    console.log('📝 Prompt:', prompt);
    
    try {
      const startTime = Date.now();
      const response = await model.transform(prompt, {
        maxOutputTokens: 100,
        temperature: 0.7
      });
      const endTime = Date.now();
      
      console.log('✅ Generated response:');
      console.log('📄 Response:', response.content);
      console.log('⏱️  Generation time:', `${endTime - startTime}ms`);
      console.log('📊 Metadata:', response.metadata || 'none');
      
    } catch (genError: any) {
      console.error('❌ Text generation failed:', genError.message);
      throw genError;
    }
    
    // Test another prompt
    console.log('\n📋 Test 6: Second Generation (Coding Question)');
    const codePrompt = "Write a simple Python function to add two numbers:";
    console.log('📝 Prompt:', codePrompt);
    
    try {
      const startTime = Date.now();
      const response = await model.transform(codePrompt, {
        maxOutputTokens: 150,
        temperature: 0.3
      });
      const endTime = Date.now();
      
      console.log('✅ Generated response:');
      console.log('📄 Response:', response.content);
      console.log('⏱️  Generation time:', `${endTime - startTime}ms`);
      
    } catch (genError: any) {
      console.error('❌ Second generation failed:', genError.message);
    }
    
    // Check current models
    console.log('\n📋 Test 7: Available Models After Pull');
    const textModels = provider.getModelsForCapability(MediaCapability.TEXT_TO_TEXT);
    console.log('✅ Available text models:', textModels.length);
    textModels.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.name} (${m.id})`);
    });
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error: any) {
    console.error('\n💥 Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testOllamaSmallModel().catch(console.error);
