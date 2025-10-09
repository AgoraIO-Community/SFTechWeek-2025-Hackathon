/**
 * Structured Response Types
 *
 * These types enable rich responses with file references
 * and other metadata that can be rendered in the UI.
 */

export interface FileReference {
  path: string;
  lineNumber?: number;
  relevance: 'primary' | 'secondary' | 'mentioned';
  context?: string; // Why this file is relevant
}

export interface StructuredResponse {
  // The main text response (markdown)
  text: string;

  // Extracted metadata
  metadata: {
    fileReferences: FileReference[];
    codeSnippets?: Array<{
      language: string;
      code: string;
      description?: string;
    }>;
    relatedViews?: string[]; // View IDs that were used
  };

  // Original question intent (if available)
  intent?: {
    type: string;
    confidence: number;
  };
}

export interface StreamingChunk {
  // Delta content for streaming
  delta: string;

  // Accumulated metadata (updates as stream progresses)
  metadata?: Partial<StructuredResponse['metadata']>;

  // Flag indicating if this is the final chunk
  done: boolean;
}
