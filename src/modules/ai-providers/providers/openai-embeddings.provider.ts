import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { AppConfigService } from 'src/config/config.service';
import {
  IEmbeddingsProvider,
  EmbeddingsResponse,
} from '../interfaces/embeddings-provider.interface';
import { _500 } from 'src/common/constants/error.constant';

/**
 * OpenAI embeddings provider
 * Supports text-embedding-ada-002 (1536 dims) and text-embedding-3-* models
 */
@Injectable()
export class OpenAiEmbeddingsProvider implements IEmbeddingsProvider {
  readonly providerName = 'openai';
  readonly dimensions: number;
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: AppConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.embeddings.apiKey,
    });
    this.model = this.configService.embeddings.model;
    // Default to 1536 for ada-002, can be configured for text-embedding-3-*
    this.dimensions = this.configService.embeddings.dimensions ?? 1536;
  }

  async embed(input: string): Promise<EmbeddingsResponse> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: input,
      });

      return {
        embedding: response.data[0].embedding,
        model: response.model,
        dimensions: response.data[0].embedding.length,
      };
    } catch (error) {
      console.error('Error in OpenAI embeddings creation:', error);
      throw new InternalServerErrorException(_500.DEFAULT_500);
    }
  }

  async embedBatch(inputs: string[]): Promise<EmbeddingsResponse[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: inputs,
      });

      return response.data.map((item) => ({
        embedding: item.embedding,
        model: response.model,
        dimensions: item.embedding.length,
      }));
    } catch (error) {
      console.error('Error in OpenAI batch embeddings creation:', error);
      throw new InternalServerErrorException(_500.DEFAULT_500);
    }
  }
}
