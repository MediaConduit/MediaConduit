import { getProviderRegistry } from './src/media/registry/ProviderRegistry';

async function testDynamicProviderLoading() {
  const providerRegistry = getProviderRegistry();
  try {
    const cowsayProvider = await providerRegistry.getProvider('file:///C:/Users/T/Projects/AutoMarket/temp/external_repos/cowsay-provider');
    console.log('Successfully loaded provider:', cowsayProvider.id, cowsayProvider.name);
    console.log('Provider capabilities:', cowsayProvider.capabilities);
    const isAvailable = await cowsayProvider.isAvailable();
    console.log('Is provider available:', isAvailable);
  } catch (error) {
    console.error('Failed to load provider:', error);
  }
}

testDynamicProviderLoading();