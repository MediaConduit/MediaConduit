import { AbstractDockerProvider } from '../AbstractDockerProvider';
import { MediaCapability, ProviderModel, ProviderType } from '../../../types/provider';
import { CowsayDockerModel } from './CowsayDockerModel';

export class CowsayDockerProvider extends AbstractDockerProvider {
  readonly id: string = 'cowsay-docker-provider';
  readonly name: string = 'Cowsay Docker Provider';
  readonly type: ProviderType = ProviderType.TextToText;
  readonly capabilities: MediaCapability[] = [MediaCapability.TextToText];

  protected getServiceUrl(): string | undefined {
    return process.env.COWSAY_SERVICE_URL || 'https://github.com/MediaConduit/cowsay-service';
  }

  protected getDefaultBaseUrl(): string {
    return 'http://localhost:80/'; // Default port for cowsay service
  }

  getAvailableModels(): string[] {
    return ['cowsay-default']; // Only one model for now
  }

  async createModel(modelId: string): Promise<ProviderModel> {
    if (modelId === 'cowsay-default') {
      return new CowsayDockerModel(this.getDockerService());
    }
    throw new Error(`Model ${modelId} not supported by Cowsay Docker Provider.`);
  }

  getModelsForCapability(capability: MediaCapability): ProviderModel[] {
    if (capability === MediaCapability.TextToText) {
      // In a real scenario, you might dynamically fetch available models from the Docker service
      return [{ id: 'cowsay-default', name: 'Cowsay Default', capabilities: [MediaCapability.TextToText] }];
    }
    return [];
  }

  async getModel(modelId: string): Promise<ProviderModel> {
    if (modelId === 'cowsay-default') {
      return new CowsayDockerModel(this.getDockerService());
    }
    throw new Error(`Model ${modelId} not found.`);
  }
}
