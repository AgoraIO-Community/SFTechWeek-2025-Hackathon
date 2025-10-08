/**
 * @principal-ade/ai-brain - Core library for Principal AI
 *
 * Provides GitHub repository parsing, document loading,
 * and LLM services for the Principal AI platform.
 */

export const version = "0.1.0";

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
