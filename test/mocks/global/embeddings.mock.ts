/**
 * Embeddings Provider Mock
 * Mocks the embeddings service for vector-based testing
 */

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  dimensions: number;
}

// Default embedding dimension (matches text-embedding-3-large)
const DEFAULT_EMBEDDING_DIMENSION = 3072;

// Generate a deterministic mock embedding based on input text
// This ensures the same text always produces the same embedding
const generateDeterministicEmbedding = (
  text: string,
  dimension: number = DEFAULT_EMBEDDING_DIMENSION,
): number[] => {
  // Simple hash-based approach for deterministic embeddings
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const embedding: number[] = [];
  for (let i = 0; i < dimension; i++) {
    // Generate pseudo-random but deterministic value
    const seed = hash + i * 31;
    const value = Math.sin(seed) * 0.5;
    embedding.push(value);
  }

  // Normalize to unit vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map((val) => val / magnitude);
};

// Generate random embedding (non-deterministic)
const generateRandomEmbedding = (
  dimension: number = DEFAULT_EMBEDDING_DIMENSION,
): number[] => {
  const embedding: number[] = [];
  for (let i = 0; i < dimension; i++) {
    embedding.push((Math.random() - 0.5) * 2);
  }

  // Normalize to unit vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map((val) => val / magnitude);
};

// Create the mock embeddings provider
export const createMockEmbeddingsProvider = (dimension: number = DEFAULT_EMBEDDING_DIMENSION) => {
  return {
    providerName: 'mock-embeddings',
    dimensions: dimension,

    embed: jest.fn().mockImplementation(
      async (text: string): Promise<EmbeddingResult> => ({
        embedding: generateDeterministicEmbedding(text, dimension),
        model: 'mock-embedding-model',
        dimensions: dimension,
      }),
    ),

    embedBatch: jest.fn().mockImplementation(
      async (texts: string[]): Promise<EmbeddingResult[]> =>
        texts.map((text) => ({
          embedding: generateDeterministicEmbedding(text, dimension),
          model: 'mock-embedding-model',
          dimensions: dimension,
        })),
    ),

    // Helper to set a specific embedding for next call
    mockSetEmbedding: function (embedding: number[]) {
      this.embed.mockResolvedValueOnce({
        embedding,
        model: 'mock-embedding-model',
        dimensions: embedding.length,
      });
    },

    // Helper to simulate embeddings failure
    mockFailure: function (error: Error = new Error('Embeddings service unavailable')) {
      this.embed.mockRejectedValueOnce(error);
    },

    // Helper to simulate timeout
    mockTimeout: function () {
      this.mockFailure(new Error('Request timeout'));
    },

    // Helper to get embedding dimension
    getDimension: function (): number {
      return dimension;
    },

    // Generate a random embedding (useful for testing similarity)
    generateRandom: function (): number[] {
      return generateRandomEmbedding(dimension);
    },

    // Generate deterministic embedding for a text
    generateDeterministic: function (text: string): number[] {
      return generateDeterministicEmbedding(text, dimension);
    },

    // Reset all mocks
    reset: function () {
      this.embed.mockReset();
      this.embedBatch.mockReset();
      this.embed.mockImplementation(
        async (text: string): Promise<EmbeddingResult> => ({
          embedding: generateDeterministicEmbedding(text, dimension),
          model: 'mock-embedding-model',
          dimensions: dimension,
        }),
      );
      this.embedBatch.mockImplementation(
        async (texts: string[]): Promise<EmbeddingResult[]> =>
          texts.map((text) => ({
            embedding: generateDeterministicEmbedding(text, dimension),
            model: 'mock-embedding-model',
            dimensions: dimension,
          })),
      );
    },
  };
};

// Singleton instance
export const mockEmbeddingsProvider = createMockEmbeddingsProvider();

// Type export
export type MockEmbeddingsProvider = ReturnType<typeof createMockEmbeddingsProvider>;
