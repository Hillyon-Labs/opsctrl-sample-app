import { Module, DynamicModule, Provider } from '@nestjs/common';
import { AppConfigModule } from 'src/config/config.module';
import { AppConfigService } from 'src/config/config.service';
import { LLM_PROVIDER, EMBEDDINGS_PROVIDER } from './interfaces';
import { ClaudeLlmProvider } from './providers/claude-llm.provider';
import { OpenAiLlmProvider } from './providers/openai-llm.provider';
import { OpenAiEmbeddingsProvider } from './providers/openai-embeddings.provider';

export type LlmProviderType = 'claude' | 'openai';
export type EmbeddingsProviderType = 'openai';

export interface AiProvidersModuleOptions {
  llmProvider?: LlmProviderType;
  embeddingsProvider?: EmbeddingsProviderType;
}

/**
 * AI Providers Module
 *
 * Provides abstracted LLM and embeddings services that can be swapped
 * without changing consumer code.
 *
 * Usage:
 * ```typescript
 * // In your module
 * imports: [AiProvidersModule.register({ llmProvider: 'claude' })]
 *
 * // In your service
 * constructor(
 *   @Inject(LLM_PROVIDER) private readonly llm: ILlmProvider,
 *   @Inject(EMBEDDINGS_PROVIDER) private readonly embeddings: IEmbeddingsProvider,
 * ) {}
 * ```
 */
@Module({})
export class AiProvidersModule {
  /**
   * Register with explicit provider selection
   */
  static register(options?: AiProvidersModuleOptions): DynamicModule {
    const llmProviderFactory: Provider = {
      provide: LLM_PROVIDER,
      useFactory: (configService: AppConfigService) => {
        const providerType =
          options?.llmProvider ??
          configService.aiProviders?.llmProvider ??
          'claude';

        switch (providerType) {
          case 'claude':
            return new ClaudeLlmProvider(configService);
          case 'openai':
            return new OpenAiLlmProvider(configService);
          default:
            return new ClaudeLlmProvider(configService);
        }
      },
      inject: [AppConfigService],
    };

    const embeddingsProviderFactory: Provider = {
      provide: EMBEDDINGS_PROVIDER,
      useFactory: (configService: AppConfigService) => {
        const providerType =
          options?.embeddingsProvider ??
          configService.aiProviders?.embeddingsProvider ??
          'openai';

        switch (providerType) {
          case 'openai':
          default:
            return new OpenAiEmbeddingsProvider(configService);
        }
      },
      inject: [AppConfigService],
    };

    return {
      module: AiProvidersModule,
      imports: [AppConfigModule],
      providers: [llmProviderFactory, embeddingsProviderFactory],
      exports: [LLM_PROVIDER, EMBEDDINGS_PROVIDER],
      global: false,
    };
  }

  /**
   * Register as global module (available everywhere without importing)
   */
  static forRoot(options?: AiProvidersModuleOptions): DynamicModule {
    const dynamicModule = this.register(options);
    return {
      ...dynamicModule,
      global: true,
    };
  }
}
