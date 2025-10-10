/**
 * @principal-ade/ai-brain - Core library for Principal AI
 *
 * Provides GitHub repository parsing, document loading,
 * and LLM services for the Principal AI platform.
 */

export const version = "0.3.3";

// Adapters for GitHub integration
export { GitHubFileSystemAdapter } from "./adapters/GitHubFileSystemAdapter";
export { GitHubGlobAdapter } from "./adapters/GitHubGlobAdapter";

// LLM Service
export { LLMService } from "./services/LLMService";
export type {
  LLMServiceConfig,
  GenerateResponseOptions,
  ConversationMessage,
  ConversationResponseOptions
} from "./services/LLMService";

// View-Aware Context Builder
export { ViewAwareContextBuilder } from "./services/ViewAwareContextBuilder";
export type {
  QuestionIntent,
  QuestionType,
  IntentAnalysisResult
} from "./services/ViewAwareContextBuilder";

// Response Parser & Structured Response Types
export { ResponseParser } from "./utils/ResponseParser";
export type {
  FileReference,
  StructuredResponse,
  StreamingChunk
} from "./types/StructuredResponse";

// Diagram Generator
export { DiagramGenerator } from "./services/DiagramGenerator";
export type {
  ExcalidrawElement,
  ExcalidrawScene,
  DiagramGenerationOptions
} from "./services/DiagramGenerator";
