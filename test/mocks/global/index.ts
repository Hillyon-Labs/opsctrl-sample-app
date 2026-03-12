/**
 * Global Mocks Index
 * Export all global mocks from a single location
 */

// LLM Provider Mock
export {
  createMockLlmProvider,
  createMockPodDiagnosisResponse,
  createMockStackDiagnosisResponse,
  createMockHelmReleaseInferenceResponse,
  mockLlmProvider,
  type MockLlmProvider,
  type MockPodDiagnosisResponse,
  type MockStackDiagnosisResponse,
  type MockHelmReleaseInferenceResponse,
} from './llm-provider.mock';

// Embeddings Provider Mock
export {
  createMockEmbeddingsProvider,
  mockEmbeddingsProvider,
  type MockEmbeddingsProvider,
  type EmbeddingResult,
} from './embeddings.mock';

// Utility function to reset all mocks
export const resetAllMocks = (): void => {
  const { mockLlmProvider } = require('./llm-provider.mock');
  const { mockEmbeddingsProvider } = require('./embeddings.mock');

  mockLlmProvider.reset();
  mockEmbeddingsProvider.reset();
};
