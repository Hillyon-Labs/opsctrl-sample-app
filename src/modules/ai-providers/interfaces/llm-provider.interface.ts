/**
 * Message format for LLM chat completions
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * JSON Schema definition for tool parameters
 * Uses index signature for compatibility with OpenAI SDK's FunctionParameters
 */
export interface JsonSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, JsonSchema & { description?: string }>;
  items?: JsonSchema;
  required?: string[];
  enum?: string[];
  description?: string;
  [key: string]: unknown;
}

/**
 * Tool definition for structured outputs
 * Works with Claude's tool_use and OpenAI's function calling
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
}

/**
 * Tool choice configuration
 */
export type ToolChoice =
  | 'auto' // Let the model decide
  | 'required' // Must use a tool (any tool)
  | { name: string }; // Must use specific tool

/**
 * Options for LLM completion requests
 */
export interface LlmCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  tools?: ToolDefinition[];
  toolChoice?: ToolChoice;
}

/**
 * Tool call result from the model
 */
export interface ToolCall {
  toolName: string;
  toolInput: Record<string, unknown>;
}

/**
 * Response from LLM completion
 */
export interface LlmCompletionResponse {
  content: string | null;
  toolCalls?: ToolCall[];
  model: string;
  stopReason?: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence';
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Abstract interface for LLM providers (OpenAI, Claude, etc.)
 * Allows swapping LLM backends without changing service layer code
 */
export interface ILlmProvider {
  /**
   * Unique identifier for this provider
   */
  readonly providerName: string;

  /**
   * Run a chat completion with the given messages
   * @param messages - Array of chat messages (system, user, assistant)
   * @param options - Optional completion parameters (including tools for structured output)
   * @returns The completion response with content and/or tool calls
   */
  complete(
    messages: ChatMessage[],
    options?: LlmCompletionOptions,
  ): Promise<LlmCompletionResponse>;

  /**
   * Convenience method: Run completion and extract structured JSON from tool call
   * @param messages - Array of chat messages
   * @param tool - Tool definition for the expected response structure
   * @param options - Optional completion parameters
   * @returns Parsed JSON object matching the tool's input schema
   */
  completeWithStructuredOutput<T = Record<string, unknown>>(
    messages: ChatMessage[],
    tool: ToolDefinition,
    options?: Omit<LlmCompletionOptions, 'tools' | 'toolChoice'>,
  ): Promise<T>;
}

/**
 * Injection token for the LLM provider
 */
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
