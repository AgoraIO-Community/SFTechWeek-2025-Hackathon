/**
 * Response Parser - Extract structured data from LLM responses
 *
 * This utility parses markdown responses to extract:
 * - File references (with line numbers)
 * - Code snippets
 */

import { FileReference, StructuredResponse } from '../types/StructuredResponse.js';

export class ResponseParser {
  /**
   * Parse a complete response into structured format
   */
  static parseResponse(text: string, relatedViews?: string[]): StructuredResponse {
    return {
      text,
      metadata: {
        fileReferences: this.extractFileReferences(text),
        codeSnippets: this.extractCodeSnippets(text),
        relatedViews: relatedViews || [],
      },
    };
  }

  /**
   * Extract file references from markdown text
   * Supports formats:
   * - `src/file.ts`
   * - `src/file.ts:123`
   * - [link](src/file.ts)
   * - See `src/file.ts` for details
   */
  static extractFileReferences(text: string): FileReference[] {
    const references: FileReference[] = [];
    const seen = new Set<string>();

    // Pattern 1: Backtick-wrapped file paths (with optional line numbers)
    // Example: `src/services/LLMService.ts:45`
    const backtickPattern = /`([a-zA-Z0-9_\-./]+\.(ts|tsx|js|jsx|py|java|go|rs|cpp|c|h))(?::(\d+))?`/g;
    let match;

    while ((match = backtickPattern.exec(text)) !== null) {
      const path = match[1];
      const lineNumber = match[3] ? parseInt(match[3], 10) : undefined;
      const key = `${path}:${lineNumber || ''}`;

      if (!seen.has(key)) {
        seen.add(key);
        references.push({
          path,
          lineNumber,
          relevance: this.determineRelevance(text, path, match.index),
        });
      }
    }

    // Pattern 2: Markdown links to files
    // Example: [LLMService](src/services/LLMService.ts)
    const linkPattern = /\[([^\]]+)\]\(([a-zA-Z0-9_\-./]+\.(ts|tsx|js|jsx|py|java|go|rs|cpp|c|h))(?::(\d+))?\)/g;

    while ((match = linkPattern.exec(text)) !== null) {
      const path = match[2];
      const lineNumber = match[4] ? parseInt(match[4], 10) : undefined;
      const key = `${path}:${lineNumber || ''}`;

      if (!seen.has(key)) {
        seen.add(key);
        references.push({
          path,
          lineNumber,
          relevance: this.determineRelevance(text, path, match.index),
          context: match[1], // The link text provides context
        });
      }
    }

    return references;
  }

  /**
   * Determine if a file reference is primary, secondary, or just mentioned
   */
  private static determineRelevance(
    text: string,
    filePath: string,
    position: number
  ): FileReference['relevance'] {
    // Check surrounding context (100 chars before and after)
    const start = Math.max(0, position - 100);
    const end = Math.min(text.length, position + 100);
    const context = text.substring(start, end).toLowerCase();

    // Primary indicators
    const primaryIndicators = [
      'implemented in',
      'see',
      'found in',
      'defined in',
      'located in',
      'check',
      'look at',
    ];

    if (primaryIndicators.some((indicator) => context.includes(indicator))) {
      return 'primary';
    }

    // Count occurrences of this file in the text
    const occurrences = (text.match(new RegExp(filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

    if (occurrences >= 3) {
      return 'primary';
    } else if (occurrences >= 2) {
      return 'secondary';
    }

    return 'mentioned';
  }

  /**
   * Extract code snippets from code blocks
   */
  static extractCodeSnippets(text: string): Array<{ language: string; code: string; description?: string }> {
    const snippets: Array<{ language: string; code: string; description?: string }> = [];

    // Pattern: ```language ... ```
    const codeBlockPattern = /```(\w+)\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockPattern.exec(text)) !== null) {
      const language = match[1];
      const code = match[2].trim();

      snippets.push({
        language,
        code,
      });
    }

    return snippets;
  }

  /**
   * Extract file references incrementally from streaming text
   * Useful for updating UI as text streams in
   */
  static extractFileReferencesIncremental(
    previousText: string,
    newText: string
  ): FileReference[] {
    const allRefs = this.extractFileReferences(newText);
    const prevRefs = this.extractFileReferences(previousText);

    // Return only new references
    const prevKeys = new Set(prevRefs.map((ref) => `${ref.path}:${ref.lineNumber || ''}`));

    return allRefs.filter((ref) => {
      const key = `${ref.path}:${ref.lineNumber || ''}`;
      return !prevKeys.has(key);
    });
  }
}
