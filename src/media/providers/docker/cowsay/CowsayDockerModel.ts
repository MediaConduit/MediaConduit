import { TextToTextModel, TextToTextOptions } from '../../../models/abstracts/TextToTextModel';
import { Text, TextRole } from '../../../assets/roles';
import { MediaCapability } from '../../../types/provider';
import { CowsayAPIClient, CowsayDockerConfig } from './CowsayAPIClient';

export class CowsayDockerModel extends TextToTextModel {
  readonly id: string = 'cowsay-default';
  readonly name: string = 'Cowsay Default';
  readonly capabilities: MediaCapability[] = [MediaCapability.TEXT_TO_TEXT];

  private dockerService: any;
  private apiClient: CowsayAPIClient;

  constructor(dockerService: any) {
    super({
      id: 'cowsay-default',
      name: 'Cowsay Default',
      description: 'A simple text-to-text model that generates ASCII art of a cow saying your text.',
      version: '1.0.0',
      provider: 'cowsay-docker',
      capabilities: ['text-to-text'],
      inputTypes: ['text'],
      outputTypes: ['text']
    });
    this.dockerService = dockerService;
    
    // Create API client for the cowsay service
    this.apiClient = new CowsayAPIClient({
      baseUrl: 'http://localhost:80'
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check both Docker service health and API client reachability
      const dockerServiceHealthy = this.dockerService && this.dockerService.isServiceHealthy ? 
        await this.dockerService.isServiceHealthy() : true;
      
      const apiClientReachable = await this.apiClient.isServiceReachable();
      
      return dockerServiceHealthy && apiClientReachable;
    } catch (error) {
      console.error('Error checking cowsay model availability:', error);
      return false;
    }
  }

  async transform(input: TextRole | TextRole[], options?: TextToTextOptions): Promise<Text> {
    const startTime = Date.now();

    // Handle both array and single input
    const inputRole = Array.isArray(input) ? input[0] : input;
    
    // Use asRole<Text> to get Text from TextRole input
    const text = await inputRole.asRole(Text);

    // Validate text data
    if (!text.isValid()) {
      throw new Error('Invalid text data provided');
    }

    try {
      // Generate cowsay output using API client
      const cowsayOutput = await this.apiClient.generateCowsay(text.content);
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      // Return a new Text object with the cowsay output
      return Text.fromString(
        cowsayOutput,
        text.language || 'auto',
        1.0, // High confidence for successful generation
        {
          processingTime,
          model: this.id,
          provider: 'cowsay-docker',
          transformationType: 'text-to-text'
        },
        text.sourceAsset // Preserve source Asset reference
      );
    } catch (error) {
      console.error('Error transforming text with Cowsay Docker service:', error);
      throw new Error(`Failed to transform text with Cowsay: ${error.message}`);
    }
  }

  // Implement TextToTextModel specific methods
  async generate(prompt: string, options?: TextToTextOptions): Promise<Text> {
    const textInput = new Text(prompt);
    return this.transform(textInput, options);
  }

  async chat(messages: { role: string; content: string; }[], options?: TextToTextOptions): Promise<Text> {
    // For a simple cowsay model, chat can be a direct transformation of the last message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      throw new Error('No message to process for chat.');
    }
    const textInput = new Text(lastMessage.content);
    return this.transform(textInput, options);
  }
}
