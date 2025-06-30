import { ProviderRegistry } from './src/media/registry/ProviderRegistry';

async function testDynamicCowsayProvider() {
  console.log('🧪 Testing dynamic cowsay provider loading...\n');

  try {
    const registry = ProviderRegistry.getInstance();
    
    // Test local file loading first (before pushing to GitHub)
    // const localProviderPath = `file://${process.cwd()}/cowsay-provider-repo`;
    // console.log(`📁 Testing local provider loading from: ${localProviderPath}`);
    
    // const provider = await registry.getProvider(localProviderPath);
    // console.log(`✅ Provider loaded: ${provider.name} (${provider.id})`);
    // console.log(`🎯 Type: ${provider.type}`);
    // console.log(`⚡ Capabilities: ${provider.capabilities.join(', ')}`);
    
    // // List available models
    // const models = provider.models.map(m => m.id);
    // console.log(`🤖 Available models: ${models.join(', ')}`);
    
    // // Test creating a model
    // if (models.length > 0) {
    //   const model = await provider.getModel(models[0]);
    //   console.log(`🎯 Model created: ${model.name}`);
      
    //   // Test availability (this will likely fail if Docker service isn't running)
    //   const isAvailable = await model.isAvailable();
    //   console.log(`🔍 Model available: ${isAvailable}`);
      
    //   if (isAvailable) {
    //     // Test generation
    //     const result = await model.generate('Hello from dynamic provider test!');
    //     console.log('📤 Generated result:');
    //     console.log(result.content);
    //   } else {
    //     console.log('⚠️  Service not running - skipping generation test');
    //   }
    // }
    
    // console.log('\n✅ Local provider test completed successfully!');
    
    // Test GitHub loading (repo is now available!)
    console.log('\n🐙 Testing GitHub provider loading...');
    try {
      const githubProvider = await registry.getProvider('https://github.com/MediaConduit/cowsay-provider');
      console.log(`✅ GitHub provider loaded: ${githubProvider.name} (${githubProvider.id})`);
      console.log(`🎯 Type: ${githubProvider.type}`);
      console.log(`⚡ Capabilities: ${githubProvider.capabilities.join(', ')}`);
      
      // Start the Docker service
      console.log(`🐳 Starting cowsay Docker service...`);
      const serviceStarted = await (githubProvider as any).startService();
      console.log(`� Service start result: ${serviceStarted}`);
      
      // Wait a moment for service to be ready
      if (serviceStarted) {
        console.log(`⏳ Waiting for service to be ready...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Test GitHub provider models
      const githubModels = githubProvider.models.map(m => m.id);
      console.log(`🤖 GitHub models: ${githubModels.join(', ')}`);
      
      if (githubModels.length > 0) {
        const githubModel = await githubProvider.getModel(githubModels[0]);
        console.log(`🎯 GitHub model created: ${githubModel.name}`);
        
        const isGithubAvailable = await githubModel.isAvailable();
        console.log(`🔍 GitHub model available: ${isGithubAvailable}`);
        
        if (isGithubAvailable) {
          const githubResult = await githubModel.generate('Hello from GitHub dynamic provider!');
          console.log('📤 GitHub provider result:');
          console.log(githubResult.content);
        } else {
          console.log('⚠️  GitHub service not running - skipping generation test');
        }
      }
      
      console.log('\n✅ GitHub provider test completed successfully!');
    } catch (error) {
      console.error('❌ GitHub provider test failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testDynamicCowsayProvider().catch(console.error);
