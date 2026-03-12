/**
 * LLM Provider Mock
 * Mocks the AI/LLM provider for diagnosis testing
 */

// Types matching the actual LLM provider interface
export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

// Mock diagnosis response structure
export interface MockPodDiagnosisResponse {
  diagnosis: {
    summary: string;
    severity: string;
    category: string;
  };
  likelyCause: {
    description: string;
    evidence: string[];
    confidence: number;
  };
  suggestedFix: {
    immediate: string[];
    commands: string[];
    preventive: string[];
  };
  suggestedRemediations: Array<{
    type: string;
    description: string;
    command: string;
    parameters: Record<string, string>;
    risk: string;
    automated: boolean;
    estimatedDowntime: string;
  }>;
  affectedResources: {
    containers: string[];
    configMaps?: string[];
    secrets?: string[];
    services?: string[];
  };
  metadata: {
    analysisTimestamp: string;
    dataQuality: string;
    requiresHumanReview: boolean;
  };
}

export interface MockStackDiagnosisResponse {
  stackOverview: {
    summary: string;
    healthScore: number;
    totalComponents: number;
    affectedComponents: number;
    components: Array<{
      name: string;
      status: string;
      issues: string[];
    }>;
  };
  rootCauseAnalysis: {
    primaryCause: string;
    failureCascade: string[];
    confidence: number;
  };
  recommendations: {
    immediateFix: string[];
    preventRecurrence: string[];
    improvements: string[];
  };
  verification: {
    commands: string[];
    healthyIndicators: string[];
  };
  metadata: {
    analysisTimestamp: string;
    dataQuality: string;
    alternativeCauses: string[];
  };
}

export interface MockHelmReleaseInferenceResponse {
  releaseName: string;
  confidence: number;
  detectionMethod:
    | 'label'
    | 'annotation'
    | 'naming_convention'
    | 'owner_reference'
    | 'none';
  evidence: {
    labelFound?: string;
    annotationFound?: string;
    namingPattern?: string;
  };
}

// Default mock responses
export const createMockPodDiagnosisResponse = (
  overrides: Partial<MockPodDiagnosisResponse> = {},
): MockPodDiagnosisResponse => ({
  diagnosis: {
    summary:
      'Pod is experiencing CrashLoopBackOff due to application startup failure',
    severity: 'high',
    category: 'crash_loop',
    ...overrides.diagnosis,
  },
  likelyCause: {
    description:
      'Application fails to start due to missing environment variable',
    evidence: ['Exit code 1', 'Error: REQUIRED_VAR not set'],
    confidence: 0.85,
    ...overrides.likelyCause,
  },
  suggestedFix: {
    immediate: ['Check environment variable configuration'],
    commands: ['kubectl describe pod test-pod -n default'],
    preventive: ['Add startup probes', 'Validate env vars in CI'],
    ...overrides.suggestedFix,
  },
  suggestedRemediations: [
    {
      type: 'restart_pod',
      description: 'Restart the pod after fixing configuration',
      command: 'kubectl delete pod test-pod -n default',
      parameters: { targetPod: 'test-pod', targetNamespace: 'default' },
      risk: 'low',
      automated: true,
      estimatedDowntime: '< 1 minute',
    },
    ...(overrides.suggestedRemediations || []),
  ],
  affectedResources: {
    containers: ['main-container'],
    ...overrides.affectedResources,
  },
  metadata: {
    analysisTimestamp: new Date().toISOString(),
    dataQuality: 'high',
    requiresHumanReview: false,
    ...overrides.metadata,
  },
});

export const createMockStackDiagnosisResponse = (
  overrides: Partial<MockStackDiagnosisResponse> = {},
): MockStackDiagnosisResponse => ({
  stackOverview: {
    summary: 'Multiple components affected by database connectivity issues',
    healthScore: 45,
    totalComponents: 3,
    affectedComponents: 2,
    components: [
      {
        name: 'api-server',
        status: 'unhealthy',
        issues: ['Connection timeout'],
      },
      { name: 'worker', status: 'unhealthy', issues: ['Connection refused'] },
      { name: 'redis', status: 'healthy', issues: [] },
    ],
    ...overrides.stackOverview,
  },
  rootCauseAnalysis: {
    primaryCause: 'Database pod is unavailable',
    failureCascade: ['Database down', 'API cannot connect', 'Workers fail'],
    confidence: 0.9,
    ...overrides.rootCauseAnalysis,
  },
  recommendations: {
    immediateFix: ['Check database pod status', 'Verify network policies'],
    preventRecurrence: [
      'Add connection retry logic',
      'Implement circuit breaker',
    ],
    improvements: ['Add health checks for database dependency'],
    ...overrides.recommendations,
  },
  verification: {
    commands: [
      'kubectl get pods -l app=database',
      'kubectl logs -l app=api-server',
    ],
    healthyIndicators: ['All pods Running', 'No connection errors in logs'],
    ...overrides.verification,
  },
  metadata: {
    analysisTimestamp: new Date().toISOString(),
    dataQuality: 'high',
    alternativeCauses: ['Network partition', 'Resource exhaustion'],
    ...overrides.metadata,
  },
});

export const createMockHelmReleaseInferenceResponse = (
  overrides: Partial<MockHelmReleaseInferenceResponse> = {},
): MockHelmReleaseInferenceResponse => ({
  releaseName: 'my-release',
  confidence: 0.95,
  detectionMethod: 'label',
  evidence: {
    labelFound: 'app.kubernetes.io/instance=my-release',
  },
  ...overrides,
});

// Create the mock LLM provider
export const createMockLlmProvider = () => {
  const defaultPodDiagnosis = createMockPodDiagnosisResponse();
  const defaultStackDiagnosis = createMockStackDiagnosisResponse();
  const defaultHelmInference = createMockHelmReleaseInferenceResponse();

  return {
    providerName: 'mock-llm',

    complete: jest.fn().mockResolvedValue({
      content: 'Mock LLM response text',
      model: 'mock-llm',
      stopReason: 'end_turn',
    }),

    completeWithStructuredOutput: jest
      .fn()
      .mockImplementation(
        async <T>(
          _messages: LlmMessage[],
          tool: ToolDefinition,
          _options?: LlmCompletionOptions,
        ): Promise<T> => {
          // Return appropriate mock based on tool name
          if (
            tool.name === 'pod_diagnosis' ||
            tool.name === 'podDiagnosisTool'
          ) {
            return defaultPodDiagnosis as T;
          }
          if (
            tool.name === 'stack_diagnosis' ||
            tool.name === 'stackDiagnosisTool'
          ) {
            return defaultStackDiagnosis as T;
          }
          if (
            tool.name === 'helm_release_inference' ||
            tool.name === 'helmReleaseInferenceTool'
          ) {
            return defaultHelmInference as T;
          }
          return defaultPodDiagnosis as T;
        },
      ),

    // Helper to mock specific diagnosis response
    mockPodDiagnosis: function (response: Partial<MockPodDiagnosisResponse>) {
      const fullResponse = createMockPodDiagnosisResponse(response);
      this.completeWithStructuredOutput.mockResolvedValueOnce(fullResponse);
    },

    // Helper to mock stack diagnosis response
    mockStackDiagnosis: function (
      response: Partial<MockStackDiagnosisResponse>,
    ) {
      const fullResponse = createMockStackDiagnosisResponse(response);
      this.completeWithStructuredOutput.mockResolvedValueOnce(fullResponse);
    },

    // Helper to mock Helm inference response
    mockHelmInference: function (
      response: Partial<MockHelmReleaseInferenceResponse>,
    ) {
      const fullResponse = createMockHelmReleaseInferenceResponse(response);
      this.completeWithStructuredOutput.mockResolvedValueOnce(fullResponse);
    },

    // Helper to simulate LLM failure
    mockFailure: function (
      error: Error = new Error('LLM service unavailable'),
    ) {
      this.completeWithStructuredOutput.mockRejectedValueOnce(error);
    },

    // Helper to simulate timeout
    mockTimeout: function () {
      this.mockFailure(new Error('Request timeout'));
    },

    // Reset all mocks to defaults
    reset: function () {
      this.complete.mockReset();
      this.completeWithStructuredOutput.mockReset();
      this.complete.mockResolvedValue({
        content: 'Mock LLM response text',
        model: 'mock-llm',
        stopReason: 'end_turn',
      });
      this.completeWithStructuredOutput.mockImplementation(
        async <T>(
          _messages: LlmMessage[],
          tool: ToolDefinition,
        ): Promise<T> => {
          if (
            tool.name === 'pod_diagnosis' ||
            tool.name === 'podDiagnosisTool'
          ) {
            return createMockPodDiagnosisResponse() as T;
          }
          if (
            tool.name === 'stack_diagnosis' ||
            tool.name === 'stackDiagnosisTool'
          ) {
            return createMockStackDiagnosisResponse() as T;
          }
          if (
            tool.name === 'helm_release_inference' ||
            tool.name === 'helmReleaseInferenceTool'
          ) {
            return createMockHelmReleaseInferenceResponse() as T;
          }
          return createMockPodDiagnosisResponse() as T;
        },
      );
    },
  };
};

// Singleton instance
export const mockLlmProvider = createMockLlmProvider();

// Type export
export type MockLlmProvider = ReturnType<typeof createMockLlmProvider>;
