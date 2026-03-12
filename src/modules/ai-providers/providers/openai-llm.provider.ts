import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
} from 'openai/resources/index';
import { AppConfigService } from 'src/config/config.service';
import {
  ILlmProvider,
  ChatMessage,
  LlmCompletionOptions,
  LlmCompletionResponse,
  ToolCall,
  ToolDefinition,
} from '../interfaces/llm-provider.interface';
import { _500 } from 'src/common/constants/error.constant';

@Injectable()
export class OpenAiLlmProvider implements ILlmProvider {
  readonly providerName = 'openai';
  private readonly client: OpenAI;
  private readonly defaultModel: string;

  constructor(private readonly configService: AppConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.openAi.apiKey,
    });
    this.defaultModel = this.configService.openAi.model;
  }

  async complete(
    messages: ChatMessage[],
    options?: LlmCompletionOptions,
  ): Promise<LlmCompletionResponse> {
    try {
      // Build OpenAI tools from our tool definitions
      const openaiTools: ChatCompletionTool[] | undefined = options?.tools?.map(
        (tool) => ({
          type: 'function' as const,
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema as Record<string, unknown>,
          },
        }),
      );

      // Map tool choice
      let toolChoice: ChatCompletionToolChoiceOption | undefined;
      if (options?.toolChoice) {
        if (options.toolChoice === 'auto') {
          toolChoice = 'auto';
        } else if (options.toolChoice === 'required') {
          toolChoice = 'required';
        } else if (typeof options.toolChoice === 'object') {
          toolChoice = {
            type: 'function' as const,
            function: { name: options.toolChoice.name },
          };
        }
      }

      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: messages as ChatCompletionMessageParam[],
        ...(options?.temperature !== undefined && {
          temperature: options.temperature,
        }),
        ...(options?.maxTokens !== undefined && {
          max_tokens: options.maxTokens,
        }),
        ...(options?.topP !== undefined && { top_p: options.topP }),
        ...(openaiTools?.length && { tools: openaiTools }),
        ...(toolChoice && { tool_choice: toolChoice }),
      });

      const choice = response.choices[0];
      const content = choice?.message?.content ?? null;

      // Extract tool calls (filter for function type only)
      const toolCalls: ToolCall[] =
        choice?.message?.tool_calls
          ?.filter((tc) => tc.type === 'function')
          ?.map((tc) => ({
            toolName: tc.function.name,
            toolInput: JSON.parse(tc.function.arguments) as Record<
              string,
              unknown
            >,
          })) ?? [];

      return {
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        model: response.model,
        stopReason: this.mapStopReason(choice?.finish_reason),
        usage: response.usage
          ? {
              inputTokens: response.usage.prompt_tokens,
              outputTokens: response.usage.completion_tokens,
            }
          : undefined,
      };
    } catch (error) {
      console.error('Error in OpenAI chat completion:', error);
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
    reason: string | null | undefined,
  ): LlmCompletionResponse['stopReason'] {
    switch (reason) {
      case 'stop':
        return 'end_turn';
      case 'tool_calls':
        return 'tool_use';
      case 'length':
        return 'max_tokens';
      default:
        return undefined;
    }
  }
}
