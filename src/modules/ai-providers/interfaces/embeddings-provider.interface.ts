/**
 * Response from embeddings generation
 */
export interface EmbeddingsResponse {
  embedding: number[];
  model: string;
  dimensions: number;
}

/**
 * Abstract interface for embeddings providers (OpenAI, Voyage, Cohere, etc.)
 * Allows swapping embedding backends without changing service layer code
 */
export interface IEmbeddingsProvider {
  /**
   * Unique identifier for this provider
   */
  readonly providerName: string;

  /**
   * The dimension of vectors produced by this provider
   * Important for vector database configuration
   */
  readonly dimensions: number;

  /**
   * Generate embeddings for the given text
   * @param input - Text to embed
   * @returns The embedding response with vector
   */
  embed(input: string): Promise<EmbeddingsResponse>;

  /**
   * Generate embeddings for multiple texts (batch)
   * @param inputs - Array of texts to embed
   * @returns Array of embedding responses
   */
  embedBatch(inputs: string[]): Promise<EmbeddingsResponse[]>;
}

/**
 * Injection token for the embeddings provider
 */
export const EMBEDDINGS_PROVIDER = Symbol('EMBEDDINGS_PROVIDER');
