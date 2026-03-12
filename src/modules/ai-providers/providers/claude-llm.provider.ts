import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AppConfigService } from 'src/config/config.service';
import {
  ILlmProvider,
  ChatMessage,
  LlmCompletionOptions,
  LlmCompletionResponse,
  ToolDefinition,
  ToolCall,
} from '../interfaces/llm-provider.interface';
import { _500 } from 'src/common/constants/error.constant';

@Injectable()
export class ClaudeLlmProvider implements ILlmProvider {
  readonly providerName = 'claude';
  private readonly client: Anthropic;
  private readonly defaultModel: string;

  constructor(private readonly configService: AppConfigService) {
    this.client = new Anthropic({
      apiKey: this.configService.claude.apiKey,
    });
    this.defaultModel = this.configService.claude.model;
  }

  async complete(
    messages: ChatMessage[],
    options?: LlmCompletionOptions,
  ): Promise<LlmCompletionResponse> {
    try {
      // Extract system message (Claude handles system differently)
      const systemMessage = messages.find((m) => m.role === 'system');
      const nonSystemMessages = messages.filter((m) => m.role !== 'system');

      // Build Anthropic tools from our tool definitions
      const anthropicTools = options?.tools?.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema as Anthropic.Tool['input_schema'],
      }));

      // Map tool choice
      let toolChoice: Anthropic.MessageCreateParams['tool_choice'];
      if (options?.toolChoice) {
        if (options.toolChoice === 'auto') {
          toolChoice = { type: 'auto' as const };
        } else if (options.toolChoice === 'required') {
          toolChoice = { type: 'any' as const };
        } else if (typeof options.toolChoice === 'object') {
          toolChoice = {
            type: 'tool' as const,
            name: options.toolChoice.name,
          };
        }
      }

      const response = await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: options?.maxTokens ?? 4096,
        ...(systemMessage && { system: systemMessage.content }),
        messages: nonSystemMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        ...(options?.temperature !== undefined && {
          temperature: options.temperature,
        }),
        ...(options?.topP !== undefined && { top_p: options.topP }),
        ...(anthropicTools?.length && { tools: anthropicTools }),
        ...(toolChoice && { tool_choice: toolChoice }),
      });

      // Extract text content
      const textContent = response.content.find(
        (block) => block.type === 'text',
      );
      const content = textContent?.type === 'text' ? textContent.text : null;

      // Extract tool calls
      const toolCalls: ToolCall[] = response.content
        .filter((block) => block.type === 'tool_use')
        .map((block) => {
          if (block.type === 'tool_use') {
            return {
              toolName: block.name,
              toolInput: block.input as Record<string, unknown>,
            };
          }
          return null;
        })
        .filter((tc): tc is ToolCall => tc !== null);

      return {
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        model: response.model,
        stopReason: this.mapStopReason(response.stop_reason),
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error('Error in Claude chat completion:', error);
      throw new InternalServerErrorException(_500.DEFAULT_500);
    }
  }

  async completeWithStructuredOutput<T = Record<string, unknown>>(
    messages: ChatMessage[],
    tool: ToolDefinition,
    options?: Omit<LlmCompletionOptions, 'tools' | 'toolChoice'>,
  ): Promise<T> {
    const response = await this.complete(messages, {
      ...options,
      tools: [tool],
      toolChoice: { name: tool.name },
    });

    if (!response.toolCalls?.length) {
      throw new InternalServerErrorException(
        'Expected structured output but received none',
      );
    }

    return response.toolCalls[0].toolInput as T;
  }

  private mapStopReason(
    reason: string | null,
  ): LlmCompletionResponse['stopReason'] {
    switch (reason) {
      case 'end_turn':
        return 'end_turn';
      case 'tool_use':
        return 'tool_use';
      case 'max_tokens':
        return 'max_tokens';
      case 'stop_sequence':
        return 'stop_sequence';
      default:
        return undefined;
    }
  }
}
