/**
 * ViewAwareContextBuilder - Smart context building based on question intent
 *
 * This service implements a two-stage approach:
 * 1. Analyze question intent and identify relevant views
 * 2. Build enriched context with markdown overviews and optional source code
 */

import { MemoryPalace, CodebaseView } from "@a24z/core-library";
import { GitHubFileSystemAdapter } from "../adapters/GitHubFileSystemAdapter.js";
import { ConversationMessage } from "./LLMService.js";

export type QuestionType = 'overview' | 'implementation' | 'usage' | 'comparison';

export interface QuestionIntent {
  type: QuestionType;
  confidence: number;
  relevantViews: string[];        // View IDs
  needsFileContent: boolean;
  relevantFiles: string[];        // Specific files to load
  keywords: string[];             // Extracted from question
}

export interface IntentAnalysisResult {
  type: QuestionType;
  confidence: number;
  relevantViews: string[];
  needsFileContent: boolean;
  keywords: string[];
}

export class ViewAwareContextBuilder {
  constructor(
    private palace: MemoryPalace,
    private fsAdapter: GitHubFileSystemAdapter
  ) {}

  /**
   * Analyze question and determine intent (Stage 1)
   * This is a simplified version that doesn't require LLM call
   */
  analyzeQuestionSimple(
    question: string,
    _conversationHistory?: ConversationMessage[]
  ): QuestionIntent {
    const lowerQuestion = question.toLowerCase();

    // Detect question type based on keywords
    const intent: IntentAnalysisResult = this.detectQuestionType(lowerQuestion);

    // Extract keywords
    intent.keywords = this.extractKeywords(lowerQuestion);

    // Find relevant views based on keywords
    intent.relevantViews = this.findRelevantViews(intent.keywords, intent.type);

    // Determine if we need file content
    intent.needsFileContent = this.shouldLoadFileContent(intent.type, lowerQuestion);

    // Discover relevant files
    const relevantFiles = this.discoverRelevantFiles(
      intent.relevantViews,
      intent.keywords,
      intent.needsFileContent
    );

    return {
      ...intent,
      relevantFiles
    };
  }

  /**
   * Detect question type based on patterns
   */
  private detectQuestionType(question: string): IntentAnalysisResult {
    // Implementation questions
    if (
      question.includes('how does') ||
      question.includes('how do') ||
      question.includes('show me') ||
      question.includes('implementation') ||
      question.includes('code for') ||
      question.includes('method') ||
      question.includes('function')
    ) {
      return {
        type: 'implementation',
        confidence: 0.9,
        relevantViews: [],
        needsFileContent: true,
        keywords: []
      };
    }

    // Comparison questions
    if (
      question.includes('difference between') ||
      question.includes('compare') ||
      question.includes('vs ') ||
      question.includes('versus') ||
      question.includes('or ') ||
      question.includes('when should i use')
    ) {
      return {
        type: 'comparison',
        confidence: 0.85,
        relevantViews: [],
        needsFileContent: true,
        keywords: []
      };
    }

    // Usage questions
    if (
      question.includes('how to') ||
      question.includes('how do i') ||
      question.includes('use ') ||
      question.includes('example') ||
      question.includes('getting started') ||
      question.includes('tutorial')
    ) {
      return {
        type: 'usage',
        confidence: 0.85,
        relevantViews: [],
        needsFileContent: false,
        keywords: []
      };
    }

    // Default to overview
    return {
      type: 'overview',
      confidence: 0.7,
      relevantViews: [],
      needsFileContent: false,
      keywords: []
    };
  }

  /**
   * Extract technical keywords from question
   */
  private extractKeywords(question: string): string[] {
    const views = this.palace.listViews();
    const keywords: string[] = [];

    // Extract view names mentioned in question
    views.forEach(view => {
      const viewNameLower = view.name.toLowerCase();
      if (question.includes(viewNameLower)) {
        keywords.push(view.name);
      }

      // Check for words from view name
      view.name.split(/\s+/).forEach(word => {
        if (word.length > 3 && question.includes(word.toLowerCase())) {
          keywords.push(word);
        }
      });
    });

    // Extract common technical terms
    const technicalTerms = [
      'adapter', 'service', 'llm', 'github', 'memory', 'palace',
      'view', 'guidance', 'note', 'file', 'repository', 'codebase',
      'cache', 'fetch', 'load', 'generate', 'response', 'conversation'
    ];

    technicalTerms.forEach(term => {
      if (question.includes(term)) {
        keywords.push(term);
      }
    });

    // Deduplicate and return
    return Array.from(new Set(keywords));
  }

  /**
   * Find relevant views based on keywords and question type
   */
  private findRelevantViews(keywords: string[], questionType: QuestionType): string[] {
    const views = this.palace.listViews();
    const scored: Array<{ id: string; score: number }> = [];

    views.forEach(view => {
      let score = 0;
      const searchText = `${view.name} ${view.description} ${view.category}`.toLowerCase();

      // Score based on keyword matches
      keywords.forEach(keyword => {
        if (searchText.includes(keyword.toLowerCase())) {
          score += 2;
        }
      });

      // Boost based on question type
      if (questionType === 'overview' && view.category === 'architecture') {
        score += 3;
      }
      if (questionType === 'usage' && view.category === 'guide') {
        score += 3;
      }

      // Check reference group names
      Object.keys(view.referenceGroups).forEach(groupName => {
        keywords.forEach(keyword => {
          if (groupName.toLowerCase().includes(keyword.toLowerCase())) {
            score += 1;
          }
        });
      });

      if (score > 0) {
        scored.push({ id: view.id, score });
      }
    });

    // Sort by score and take top 3
    scored.sort((a, b) => b.score - a.score);
    const topViews = scored.slice(0, 3).map(item => item.id);

    // If no views found, use first architecture view as fallback
    if (topViews.length === 0) {
      const archView = views.find(v => v.category === 'architecture');
      if (archView) {
        topViews.push(archView.id);
      }
    }

    return topViews;
  }

  /**
   * Determine if file content should be loaded
   */
  private shouldLoadFileContent(questionType: QuestionType, question: string): boolean {
    // Always load for implementation and comparison
    if (questionType === 'implementation' || questionType === 'comparison') {
      return true;
    }

    // Load for usage if asking for examples
    if (questionType === 'usage' && (question.includes('example') || question.includes('code'))) {
      return true;
    }

    // Don't load for overview
    return false;
  }

  /**
   * Discover relevant files from selected views
   */
  private discoverRelevantFiles(
    viewIds: string[],
    keywords: string[],
    needsContent: boolean
  ): string[] {
    if (!needsContent) return [];

    const allFiles = new Set<string>();
    const scoredFiles: Array<{ file: string; score: number }> = [];

    for (const viewId of viewIds) {
      const view = this.palace.getView(viewId);
      if (!view) continue;

      // Collect all files from reference groups
      Object.entries(view.referenceGroups).forEach(([groupName, cell]) => {
        cell.files.forEach(file => {
          if (!allFiles.has(file)) {
            allFiles.add(file);
            const score = this.scoreFile(file, groupName, keywords);
            scoredFiles.push({ file, score });
          }
        });
      });
    }

    // Sort by score and limit to top 5
    scoredFiles.sort((a, b) => b.score - a.score);
    return scoredFiles.slice(0, 5).map(item => item.file);
  }

  /**
   * Score a file based on keyword matches
   */
  private scoreFile(file: string, groupName: string, keywords: string[]): number {
    if (keywords.length === 0) return 1;

    let score = 0;
    const searchText = `${file} ${groupName}`.toLowerCase();

    keywords.forEach(keyword => {
      if (searchText.includes(keyword.toLowerCase())) {
        score += 1;
      }
    });

    // Prefer TypeScript files
    if (file.endsWith('.ts')) {
      score += 0.5;
    }

    // Penalize test files
    if (file.includes('test') || file.includes('spec')) {
      score -= 2;
    }

    return score;
  }

  /**
   * Build enriched context for response generation (Stage 2)
   */
  async buildEnrichedContext(intent: QuestionIntent): Promise<string> {
    let context = '';

    // 1. Add markdown overviews from relevant views
    context += await this.buildViewContext(intent.relevantViews);

    // 2. Add actual file contents if needed
    if (intent.needsFileContent && intent.relevantFiles.length > 0) {
      context += await this.buildFileContext(intent.relevantFiles);
    }

    return context;
  }

  /**
   * Build context from view markdown overviews
   */
  private async buildViewContext(viewIds: string[]): Promise<string> {
    let context = '# Codebase Views\n\n';

    for (const viewId of viewIds) {
      const view = this.palace.getView(viewId);
      if (!view) continue;

      context += `## View: ${view.name}\n\n`;
      context += `**Category:** ${view.category}\n\n`;
      context += `**Description:** ${view.description}\n\n`;

      // Load markdown overview
      const overviewContent = await this.loadMarkdownOverview(view);
      if (overviewContent) {
        context += `### Overview\n\n${overviewContent}\n\n`;
      }

      // List reference groups
      context += `### Reference Groups\n\n`;
      Object.entries(view.referenceGroups).forEach(([groupName, cell]) => {
        context += `**${groupName}:**\n`;
        context += cell.files.map(f => `- ${f}`).join('\n');
        context += '\n\n';
      });

      context += '---\n\n';
    }

    return context;
  }

  /**
   * Build context from source code files
   */
  private async buildFileContext(files: string[]): Promise<string> {
    let context = '# Implementation Files\n\n';

    for (const file of files) {
      try {
        const content = await this.fsAdapter.readFile(file);

        // Truncate very long files
        const truncatedContent = content.length > 3000
          ? content.substring(0, 3000) + '\n\n... (truncated)'
          : content;

        context += `## ${file}\n\n`;
        context += '```typescript\n';
        context += truncatedContent;
        context += '\n```\n\n';

      } catch {
        context += `## ${file}\n\n`;
        context += '(File not accessible)\n\n';
      }
    }

    return context;
  }

  /**
   * Load markdown overview file
   */
  private async loadMarkdownOverview(view: CodebaseView): Promise<string | null> {
    try {
      const content = await this.fsAdapter.readFile(view.overviewPath);
      return content;
    } catch {
      return null;
    }
  }

  /**
   * Summarize conversation history for context
   */
  summarizeHistory(history: ConversationMessage[]): string {
    if (!history || history.length === 0) {
      return 'No previous conversation.';
    }

    // Take last 3 turns (6 messages)
    const recentHistory = history.slice(-6);
    return recentHistory
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`)
      .join('\n');
  }
}
