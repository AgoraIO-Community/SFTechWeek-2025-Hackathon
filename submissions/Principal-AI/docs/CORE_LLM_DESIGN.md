# @principal/core - LLM Processing Design Document

## Overview

The `@principal/core` package is the brain of the Principal AI system. It handles:
- Loading and parsing GitHub repository documentation
- Managing codebase context for LLM queries
- Integrating with Groq LLM for intelligent responses
- Implementing RAG (Retrieval Augmented Generation) for context-aware answers

**Key Design Principles:**
- Modular: Each component has a single responsibility
- Testable: Pure functions and dependency injection
- Reusable: Can be used in CLI, VSCode extension, or web apps
- Type-safe: Full TypeScript support with strict types

---

## Module Architecture

```
@principal/core/
├── src/
│   ├── index.ts                    # Public API exports
│   ├── types/
│   │   ├── index.ts                # Core type definitions
│   │   ├── github.types.ts         # GitHub-related types
│   │   ├── context.types.ts        # Context management types
│   │   └── llm.types.ts            # LLM service types
│   ├── github/
│   │   ├── loader.ts               # GitHub API client
│   │   ├── parser.ts               # Document parser
│   │   └── utils.ts                # Helper functions
│   ├── context/
│   │   ├── manager.ts              # Context storage & retrieval
│   │   ├── chunker.ts              # Document chunking logic
│   │   └── embeddings.ts           # (Optional) Vector embeddings
│   ├── llm/
│   │   ├── groq-client.ts          # Groq SDK wrapper
│   │   ├── prompt-builder.ts      # System prompt construction
│   │   ├── streaming.ts            # Streaming response handler
│   │   └── error-handler.ts       # Error handling & retries
│   └── rag/
│       ├── retriever.ts            # Context retrieval logic
│       └── ranker.ts               # Relevance ranking
├── tests/
│   ├── github.test.ts
│   ├── context.test.ts
│   └── llm.test.ts
└── package.json
```

---

## Core Type Definitions

### types/index.ts

```typescript
/**
 * Repository metadata and content
 */
export interface Repository {
  url: string;
  owner: string;
  name: string;
  branch: string;
  documents: Document[];
  metadata: RepositoryMetadata;
}

export interface RepositoryMetadata {
  loadedAt: Date;
  totalFiles: number;
  totalSize: number;
  primaryLanguage?: string;
}

/**
 * Parsed documentation file
 */
export interface Document {
  path: string;
  content: string;
  type: DocumentType;
  metadata: DocumentMetadata;
  chunks?: DocumentChunk[];
}

export type DocumentType =
  | 'readme'
  | 'claude-md'
  | 'architecture'
  | 'api-docs'
  | 'markdown'
  | 'code-comment';

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  lastModified?: Date;
  language?: string;
  section?: string;
}

/**
 * Document chunks for context management
 */
export interface DocumentChunk {
  id: string;
  documentPath: string;
  content: string;
  startLine?: number;
  endLine?: number;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  chunkIndex: number;
  totalChunks: number;
  wordCount: number;
  heading?: string;
}

/**
 * LLM Query and Response
 */
export interface LLMQuery {
  message: string;
  sessionId: string;
  repository: Repository;
  conversationHistory?: ConversationMessage[];
}

export interface LLMResponse {
  content: string;
  model: string;
  tokensUsed: number;
  latency: number;
  sources: string[];
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

### types/github.types.ts

```typescript
/**
 * GitHub API configuration
 */
export interface GitHubConfig {
  token?: string;
  apiUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * GitHub file content
 */
export interface GitHubFile {
  path: string;
  name: string;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
  size: number;
  sha: string;
}

/**
 * Files to load from repository
 */
export interface LoadOptions {
  includePaths?: string[];
  excludePaths?: string[];
  filePatterns?: string[];
  maxFileSize?: number;
}
```

### types/context.types.ts

```typescript
/**
 * Context retrieval request
 */
export interface ContextQuery {
  query: string;
  repository: Repository;
  maxChunks?: number;
  relevanceThreshold?: number;
}

/**
 * Retrieved context with relevance scores
 */
export interface RetrievedContext {
  chunks: ScoredChunk[];
  totalRelevance: number;
}

export interface ScoredChunk extends DocumentChunk {
  relevanceScore: number;
  reasoning?: string;
}

/**
 * Chunking strategy configuration
 */
export interface ChunkingConfig {
  maxChunkSize: number;      // Max words per chunk
  overlapSize: number;        // Overlap between chunks
  strategy: ChunkingStrategy;
}

export type ChunkingStrategy =
  | 'fixed-size'      // Fixed word count
  | 'semantic'        // Based on sections/headings
  | 'hybrid';         // Combination
```

### types/llm.types.ts

```typescript
/**
 * Groq LLM configuration
 */
export interface GroqConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

/**
 * LLM request parameters
 */
export interface LLMRequest {
  messages: ChatMessage[];
  systemPrompt?: string;
  config?: Partial<GroqConfig>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Streaming callback
 */
export type StreamCallback = (chunk: string) => void | Promise<void>;
```

---

## Component Implementation Details

### 1. GitHub Loader (`github/loader.ts`)

**Purpose:** Fetch repository contents via GitHub API

```typescript
import { Octokit } from '@octokit/rest';
import type { Repository, GitHubConfig, LoadOptions, GitHubFile } from '../types';

export class GitHubLoader {
  private octokit: Octokit;
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = {
      apiUrl: 'https://api.github.com',
      timeout: 30000,
      maxRetries: 3,
      ...config,
    };

    this.octokit = new Octokit({
      auth: config.token,
      baseUrl: this.config.apiUrl,
      request: {
        timeout: this.config.timeout,
      },
    });
  }

  /**
   * Load repository from GitHub URL
   */
  async loadRepository(repoUrl: string, options?: LoadOptions): Promise<Repository> {
    const { owner, name, branch } = this.parseRepoUrl(repoUrl);

    // Fetch repository tree
    const tree = await this.fetchRepoTree(owner, name, branch);

    // Filter files based on options
    const filesToLoad = this.filterFiles(tree, options);

    // Load file contents
    const documents = await this.loadDocuments(owner, name, branch, filesToLoad);

    return {
      url: repoUrl,
      owner,
      name,
      branch,
      documents,
      metadata: {
        loadedAt: new Date(),
        totalFiles: documents.length,
        totalSize: documents.reduce((sum, doc) => sum + doc.content.length, 0),
      },
    };
  }

  /**
   * Parse GitHub URL into components
   */
  private parseRepoUrl(url: string): { owner: string; name: string; branch: string } {
    // Handle formats:
    // - https://github.com/owner/repo
    // - https://github.com/owner/repo/tree/branch
    // - owner/repo
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/);

    if (match) {
      return {
        owner: match[1],
        name: match[2].replace('.git', ''),
        branch: match[3] || 'main',
      };
    }

    // Handle simple owner/repo format
    const simpleMatch = url.match(/^([^\/]+)\/([^\/]+)$/);
    if (simpleMatch) {
      return {
        owner: simpleMatch[1],
        name: simpleMatch[2],
        branch: 'main',
      };
    }

    throw new Error(`Invalid GitHub URL: ${url}`);
  }

  /**
   * Fetch repository file tree
   */
  private async fetchRepoTree(
    owner: string,
    name: string,
    branch: string
  ): Promise<GitHubFile[]> {
    const { data: tree } = await this.octokit.git.getTree({
      owner,
      repo: name,
      tree_sha: branch,
      recursive: 'true',
    });

    return tree.tree.map(item => ({
      path: item.path!,
      name: item.path!.split('/').pop()!,
      type: item.type as 'file' | 'dir',
      size: item.size || 0,
      sha: item.sha!,
    }));
  }

  /**
   * Filter files based on options
   */
  private filterFiles(files: GitHubFile[], options?: LoadOptions): GitHubFile[] {
    const {
      includePaths = [],
      excludePaths = ['node_modules', '.git', 'dist', 'build'],
      filePatterns = ['**/*.md', 'CLAUDE.md', 'README.md'],
      maxFileSize = 1024 * 1024, // 1MB default
    } = options || {};

    return files.filter(file => {
      // Only load files, not directories
      if (file.type !== 'file') return false;

      // Check size limit
      if (file.size > maxFileSize) return false;

      // Check exclude paths
      if (excludePaths.some(pattern => file.path.includes(pattern))) {
        return false;
      }

      // Check include paths (if specified)
      if (includePaths.length > 0) {
        return includePaths.some(pattern => file.path.includes(pattern));
      }

      // Check file patterns (simple glob matching)
      return filePatterns.some(pattern => {
        if (pattern.includes('**/*')) {
          const ext = pattern.split('.').pop();
          return file.path.endsWith(`.${ext}`);
        }
        return file.path.endsWith(pattern) || file.path.includes(pattern);
      });
    });
  }

  /**
   * Load file contents
   */
  private async loadDocuments(
    owner: string,
    name: string,
    branch: string,
    files: GitHubFile[]
  ): Promise<Document[]> {
    const documents: Document[] = [];

    // Load files in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const promises = batch.map(file => this.loadFile(owner, name, branch, file));
      const results = await Promise.allSettled(promises);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          documents.push(result.value);
        } else if (result.status === 'rejected') {
          console.warn(`Failed to load ${batch[index].path}:`, result.reason);
        }
      });
    }

    return documents;
  }

  /**
   * Load single file content
   */
  private async loadFile(
    owner: string,
    name: string,
    branch: string,
    file: GitHubFile
  ): Promise<Document | null> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo: name,
        path: file.path,
        ref: branch,
      });

      if ('content' in data && data.type === 'file') {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');

        return {
          path: file.path,
          content,
          type: this.detectDocumentType(file.path),
          metadata: {
            fileName: file.name,
            fileSize: file.size,
          },
        };
      }

      return null;
    } catch (error) {
      console.error(`Error loading ${file.path}:`, error);
      return null;
    }
  }

  /**
   * Detect document type from path
   */
  private detectDocumentType(path: string): DocumentType {
    const lower = path.toLowerCase();

    if (lower.includes('claude.md')) return 'claude-md';
    if (lower.includes('readme')) return 'readme';
    if (lower.includes('architecture')) return 'architecture';
    if (lower.includes('api')) return 'api-docs';
    if (lower.endsWith('.md')) return 'markdown';

    return 'markdown';
  }
}
```

---

### 2. Document Parser (`github/parser.ts`)

**Purpose:** Parse markdown documents and extract structure

```typescript
import type { Document, DocumentChunk, ChunkingConfig } from '../types';

export class DocumentParser {
  private config: ChunkingConfig;

  constructor(config?: Partial<ChunkingConfig>) {
    this.config = {
      maxChunkSize: 500,      // 500 words per chunk
      overlapSize: 50,        // 50 words overlap
      strategy: 'semantic',
      ...config,
    };
  }

  /**
   * Parse and chunk a document
   */
  parseDocument(document: Document): Document {
    const chunks = this.chunkDocument(document);
    return {
      ...document,
      chunks,
    };
  }

  /**
   * Parse multiple documents
   */
  parseDocuments(documents: Document[]): Document[] {
    return documents.map(doc => this.parseDocument(doc));
  }

  /**
   * Chunk document based on strategy
   */
  private chunkDocument(document: Document): DocumentChunk[] {
    switch (this.config.strategy) {
      case 'semantic':
        return this.semanticChunking(document);
      case 'fixed-size':
        return this.fixedSizeChunking(document);
      case 'hybrid':
        return this.hybridChunking(document);
      default:
        return this.semanticChunking(document);
    }
  }

  /**
   * Semantic chunking - split by headings and sections
   */
  private semanticChunking(document: Document): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const lines = document.content.split('\n');
    let currentChunk: string[] = [];
    let currentHeading = '';
    let chunkIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect markdown headings
      if (line.match(/^#{1,6}\s+/)) {
        // Save previous chunk if it exists
        if (currentChunk.length > 0) {
          chunks.push(this.createChunk(
            document,
            currentChunk.join('\n'),
            chunkIndex++,
            currentHeading
          ));
          currentChunk = [];
        }

        // Update current heading
        currentHeading = line.replace(/^#{1,6}\s+/, '').trim();
      }

      currentChunk.push(line);

      // If chunk is getting too large, split it
      const wordCount = currentChunk.join(' ').split(/\s+/).length;
      if (wordCount >= this.config.maxChunkSize) {
        chunks.push(this.createChunk(
          document,
          currentChunk.join('\n'),
          chunkIndex++,
          currentHeading
        ));

        // Keep overlap
        const overlapLines = this.getOverlapLines(currentChunk, this.config.overlapSize);
        currentChunk = overlapLines;
      }
    }

    // Add final chunk
    if (currentChunk.length > 0) {
      chunks.push(this.createChunk(
        document,
        currentChunk.join('\n'),
        chunkIndex++,
        currentHeading
      ));
    }

    return chunks;
  }

  /**
   * Fixed size chunking - split by word count
   */
  private fixedSizeChunking(document: Document): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const words = document.content.split(/\s+/);
    let chunkIndex = 0;

    for (let i = 0; i < words.length; i += this.config.maxChunkSize - this.config.overlapSize) {
      const chunkWords = words.slice(i, i + this.config.maxChunkSize);
      const content = chunkWords.join(' ');

      chunks.push(this.createChunk(
        document,
        content,
        chunkIndex++
      ));
    }

    return chunks;
  }

  /**
   * Hybrid chunking - combine semantic and fixed size
   */
  private hybridChunking(document: Document): DocumentChunk[] {
    // First do semantic chunking
    const semanticChunks = this.semanticChunking(document);

    // Then split any oversized chunks
    const finalChunks: DocumentChunk[] = [];
    let chunkIndex = 0;

    for (const chunk of semanticChunks) {
      const wordCount = chunk.content.split(/\s+/).length;

      if (wordCount <= this.config.maxChunkSize) {
        finalChunks.push({
          ...chunk,
          metadata: { ...chunk.metadata, chunkIndex: chunkIndex++ },
        });
      } else {
        // Split oversized chunk
        const words = chunk.content.split(/\s+/);
        for (let i = 0; i < words.length; i += this.config.maxChunkSize - this.config.overlapSize) {
          const subChunkWords = words.slice(i, i + this.config.maxChunkSize);
          finalChunks.push(this.createChunk(
            { path: chunk.documentPath, content: subChunkWords.join(' ') } as Document,
            subChunkWords.join(' '),
            chunkIndex++,
            chunk.metadata.heading
          ));
        }
      }
    }

    return finalChunks;
  }

  /**
   * Create a document chunk
   */
  private createChunk(
    document: Document,
    content: string,
    index: number,
    heading?: string
  ): DocumentChunk {
    const wordCount = content.split(/\s+/).length;

    return {
      id: `${document.path}-chunk-${index}`,
      documentPath: document.path,
      content: content.trim(),
      metadata: {
        chunkIndex: index,
        totalChunks: 0, // Will be updated later
        wordCount,
        heading,
      },
    };
  }

  /**
   * Get overlap lines from chunk
   */
  private getOverlapLines(lines: string[], overlapWords: number): string[] {
    const text = lines.join(' ');
    const words = text.split(/\s+/);
    const overlapText = words.slice(-overlapWords).join(' ');
    return overlapText.split('\n');
  }
}
```

---

### 3. Context Manager (`context/manager.ts`)

**Purpose:** Store and retrieve relevant context for queries

```typescript
import type {
  Repository,
  Document,
  DocumentChunk,
  ContextQuery,
  RetrievedContext,
  ScoredChunk
} from '../types';

export class ContextManager {
  private repository: Repository | null = null;
  private chunkIndex: Map<string, DocumentChunk> = new Map();

  /**
   * Initialize with repository data
   */
  initialize(repository: Repository): void {
    this.repository = repository;
    this.buildChunkIndex(repository);
  }

  /**
   * Build searchable index of all chunks
   */
  private buildChunkIndex(repository: Repository): void {
    this.chunkIndex.clear();

    for (const document of repository.documents) {
      if (document.chunks) {
        for (const chunk of document.chunks) {
          this.chunkIndex.set(chunk.id, chunk);
        }
      }
    }

    console.log(`Indexed ${this.chunkIndex.size} chunks from ${repository.documents.length} documents`);
  }

  /**
   * Retrieve relevant context for a query
   */
  async retrieve(query: ContextQuery): Promise<RetrievedContext> {
    if (!this.repository) {
      throw new Error('ContextManager not initialized. Call initialize() first.');
    }

    const {
      query: userQuery,
      maxChunks = 5,
      relevanceThreshold = 0.3,
    } = query;

    // Score all chunks by relevance
    const scoredChunks: ScoredChunk[] = [];

    for (const chunk of this.chunkIndex.values()) {
      const score = this.calculateRelevance(userQuery, chunk);

      if (score >= relevanceThreshold) {
        scoredChunks.push({
          ...chunk,
          relevanceScore: score,
        });
      }
    }

    // Sort by relevance score (descending)
    scoredChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Take top N chunks
    const topChunks = scoredChunks.slice(0, maxChunks);

    return {
      chunks: topChunks,
      totalRelevance: topChunks.reduce((sum, chunk) => sum + chunk.relevanceScore, 0),
    };
  }

  /**
   * Calculate relevance score between query and chunk
   * Simple keyword-based scoring (can be enhanced with embeddings)
   */
  private calculateRelevance(query: string, chunk: DocumentChunk): number {
    const queryWords = this.tokenize(query.toLowerCase());
    const chunkWords = this.tokenize(chunk.content.toLowerCase());

    // Calculate term frequency
    const chunkWordSet = new Set(chunkWords);
    let matchCount = 0;

    for (const word of queryWords) {
      if (chunkWordSet.has(word)) {
        matchCount++;
      }
    }

    // Basic relevance score: matched words / total query words
    const baseScore = matchCount / queryWords.length;

    // Boost score based on document type
    const typeBoost = this.getTypeBoost(chunk.documentPath);

    // Boost score if heading matches query
    const headingBoost = chunk.metadata.heading &&
      this.tokenize(chunk.metadata.heading.toLowerCase()).some(word =>
        queryWords.includes(word)
      ) ? 0.2 : 0;

    return Math.min(1.0, baseScore + typeBoost + headingBoost);
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .split(/\s+/)
      .map(word => word.replace(/[^\w]/g, ''))
      .filter(word => word.length > 2); // Filter short words
  }

  /**
   * Get relevance boost based on document type
   */
  private getTypeBoost(path: string): number {
    if (path.includes('CLAUDE.md')) return 0.3;
    if (path.includes('README')) return 0.2;
    if (path.includes('ARCHITECTURE')) return 0.15;
    if (path.includes('API')) return 0.1;
    return 0;
  }

  /**
   * Get full document by path
   */
  getDocument(path: string): Document | undefined {
    return this.repository?.documents.find(doc => doc.path === path);
  }

  /**
   * Get all chunks for a document
   */
  getDocumentChunks(path: string): DocumentChunk[] {
    const document = this.getDocument(path);
    return document?.chunks || [];
  }

  /**
   * Get repository metadata
   */
  getRepositoryMetadata() {
    return this.repository?.metadata;
  }
}
```

---

### 4. LLM Service (`llm/groq-client.ts`)

**Purpose:** Interface with Groq LLM API

```typescript
import Groq from 'groq-sdk';
import type {
  GroqConfig,
  LLMRequest,
  LLMResponse,
  ChatMessage,
  StreamCallback
} from '../types';

export class GroqClient {
  private client: Groq;
  private config: GroqConfig;

  constructor(config: GroqConfig) {
    this.config = {
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1.0,
      stream: false,
      ...config,
    };

    this.client = new Groq({
      apiKey: config.apiKey,
    });
  }

  /**
   * Generate a response from the LLM
   */
  async generate(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const messages = this.buildMessages(request);
      const config = { ...this.config, ...request.config };

      const response = await this.client.chat.completions.create({
        messages,
        model: config.model!,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        stream: false,
      });

      const latency = Date.now() - startTime;
      const choice = response.choices[0];

      return {
        content: choice.message.content || '',
        model: response.model,
        tokensUsed: response.usage?.total_tokens || 0,
        latency,
        sources: [], // Will be populated by caller
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Generate a streaming response
   */
  async generateStream(
    request: LLMRequest,
    callback: StreamCallback
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    let fullContent = '';

    try {
      const messages = this.buildMessages(request);
      const config = { ...this.config, ...request.config };

      const stream = await this.client.chat.completions.create({
        messages,
        model: config.model!,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullContent += delta;
          await callback(delta);
        }
      }

      const latency = Date.now() - startTime;

      return {
        content: fullContent,
        model: config.model!,
        tokensUsed: 0, // Not available in streaming mode
        latency,
        sources: [],
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Build messages array with system prompt
   */
  private buildMessages(request: LLMRequest): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // Add system prompt if provided
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt,
      });
    }

    // Add conversation messages
    messages.push(...request.messages);

    return messages;
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown): void {
    if (error instanceof Groq.APIError) {
      console.error(`Groq API Error [${error.status}]:`, error.message);

      // Log additional error details
      if (error.status === 429) {
        console.error('Rate limit exceeded. Consider implementing backoff strategy.');
      } else if (error.status === 401) {
        console.error('Authentication failed. Check your API key.');
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }

  /**
   * Test connection to Groq API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        messages: [{ role: 'user', content: 'test' }],
        model: this.config.model!,
        max_tokens: 5,
      });
      return true;
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }
}
```

---

### 5. Prompt Builder (`llm/prompt-builder.ts`)

**Purpose:** Construct system prompts with context

```typescript
import type { RetrievedContext, ConversationMessage } from '../types';

export class PromptBuilder {
  /**
   * Build system prompt with retrieved context
   */
  buildSystemPrompt(context: RetrievedContext): string {
    const contextText = this.formatContext(context);

    return `You are a Principal Engineer AI assistant with deep knowledge of software architecture, design patterns, and best practices.

Your role is to help developers understand and work with their codebase by answering questions based on the repository documentation provided below.

## Guidelines:
- Answer questions clearly and concisely
- Cite specific files and sections when referencing documentation
- If information is not in the provided context, say so honestly
- Provide actionable advice and suggestions
- Use technical terminology appropriately
- Consider both immediate solutions and long-term implications

## Codebase Context:

${contextText}

## Instructions:
Answer the user's question using ONLY the context provided above. If the answer requires information not present in the context, clearly state that you don't have that information in the current documentation.`;
  }

  /**
   * Format retrieved context into readable text
   */
  private formatContext(context: RetrievedContext): string {
    if (context.chunks.length === 0) {
      return '(No relevant documentation found)';
    }

    return context.chunks
      .map((chunk, index) => {
        const heading = chunk.metadata.heading ? `\n### ${chunk.metadata.heading}` : '';
        const source = `**Source:** \`${chunk.documentPath}\` (relevance: ${(chunk.relevanceScore * 100).toFixed(0)}%)`;

        return `---
## Context ${index + 1}${heading}
${source}

${chunk.content.trim()}`;
      })
      .join('\n\n');
  }

  /**
   * Build conversation messages
   */
  buildConversationMessages(
    userMessage: string,
    history?: ConversationMessage[]
  ): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // Add conversation history (keep last N messages)
    if (history && history.length > 0) {
      const recentHistory = history.slice(-10); // Keep last 10 messages
      messages.push(...recentHistory);
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    return messages;
  }

  /**
   * Build follow-up prompt for clarification
   */
  buildClarificationPrompt(originalQuery: string, context: RetrievedContext): string {
    return `The user asked: "${originalQuery}"

The following documentation was found with low relevance scores:
${context.chunks.map(c => `- ${c.documentPath} (${(c.relevanceScore * 100).toFixed(0)}%)`).join('\n')}

Please provide a helpful response that:
1. Acknowledges the question
2. Explains what documentation is available that might be related
3. Suggests how the user could rephrase their question for better results`;
  }
}
```

---

## RAG Implementation Strategy

### Overview

The RAG (Retrieval Augmented Generation) implementation follows this flow:

```
User Query → Context Retrieval → Prompt Building → LLM Generation → Response
```

### Implementation (`rag/retriever.ts`)

```typescript
import type {
  Repository,
  LLMQuery,
  LLMResponse,
  ConversationMessage
} from '../types';
import { ContextManager } from '../context/manager';
import { PromptBuilder } from '../llm/prompt-builder';
import { GroqClient } from '../llm/groq-client';

export class RAGRetriever {
  private contextManager: ContextManager;
  private promptBuilder: PromptBuilder;
  private llmClient: GroqClient;

  constructor(
    contextManager: ContextManager,
    promptBuilder: PromptBuilder,
    llmClient: GroqClient
  ) {
    this.contextManager = contextManager;
    this.promptBuilder = promptBuilder;
    this.llmClient = llmClient;
  }

  /**
   * Process a query using RAG
   */
  async processQuery(query: LLMQuery): Promise<LLMResponse> {
    // Step 1: Retrieve relevant context
    const retrievedContext = await this.contextManager.retrieve({
      query: query.message,
      repository: query.repository,
      maxChunks: 5,
      relevanceThreshold: 0.3,
    });

    console.log(`Retrieved ${retrievedContext.chunks.length} relevant chunks`);

    // Step 2: Build system prompt with context
    const systemPrompt = this.promptBuilder.buildSystemPrompt(retrievedContext);

    // Step 3: Build conversation messages
    const messages = this.promptBuilder.buildConversationMessages(
      query.message,
      query.conversationHistory
    );

    // Step 4: Generate response with LLM
    const response = await this.llmClient.generate({
      systemPrompt,
      messages,
    });

    // Step 5: Add source citations
    response.sources = retrievedContext.chunks.map(chunk => chunk.documentPath);

    return response;
  }

  /**
   * Process a streaming query using RAG
   */
  async processStreamingQuery(
    query: LLMQuery,
    onChunk: (chunk: string) => void | Promise<void>
  ): Promise<LLMResponse> {
    // Step 1: Retrieve context (same as non-streaming)
    const retrievedContext = await this.contextManager.retrieve({
      query: query.message,
      repository: query.repository,
      maxChunks: 5,
      relevanceThreshold: 0.3,
    });

    // Step 2: Build prompts (same as non-streaming)
    const systemPrompt = this.promptBuilder.buildSystemPrompt(retrievedContext);
    const messages = this.promptBuilder.buildConversationMessages(
      query.message,
      query.conversationHistory
    );

    // Step 3: Generate streaming response
    const response = await this.llmClient.generateStream(
      {
        systemPrompt,
        messages,
      },
      onChunk
    );

    // Step 4: Add source citations
    response.sources = retrievedContext.chunks.map(chunk => chunk.documentPath);

    return response;
  }
}
```

---

## Public API (`src/index.ts`)

```typescript
/**
 * @principal/core - Public API
 *
 * Main entry point for the Principal AI core library
 */

// Export types
export * from './types';

// Export core classes
export { GitHubLoader } from './github/loader';
export { DocumentParser } from './github/parser';
export { ContextManager } from './context/manager';
export { GroqClient } from './llm/groq-client';
export { PromptBuilder } from './llm/prompt-builder';
export { RAGRetriever } from './rag/retriever';

// Export convenience factory
import { GitHubLoader } from './github/loader';
import { DocumentParser } from './github/parser';
import { ContextManager } from './context/manager';
import { GroqClient } from './llm/groq-client';
import { PromptBuilder } from './llm/prompt-builder';
import { RAGRetriever } from './rag/retriever';
import type { GitHubConfig, GroqConfig } from './types';

export interface PrincipalAIConfig {
  github?: GitHubConfig;
  groq: GroqConfig;
}

/**
 * Create a fully configured Principal AI instance
 */
export function createPrincipalAI(config: PrincipalAIConfig) {
  const githubLoader = new GitHubLoader(config.github || {});
  const documentParser = new DocumentParser();
  const contextManager = new ContextManager();
  const groqClient = new GroqClient(config.groq);
  const promptBuilder = new PromptBuilder();
  const ragRetriever = new RAGRetriever(contextManager, promptBuilder, groqClient);

  return {
    githubLoader,
    documentParser,
    contextManager,
    groqClient,
    promptBuilder,
    ragRetriever,

    /**
     * Load and process a repository
     */
    async loadRepository(repoUrl: string) {
      // Load from GitHub
      const repository = await githubLoader.loadRepository(repoUrl);

      // Parse documents and create chunks
      repository.documents = documentParser.parseDocuments(repository.documents);

      // Initialize context manager
      contextManager.initialize(repository);

      return repository;
    },

    /**
     * Query the loaded repository
     */
    async query(message: string, sessionId: string, conversationHistory?: any[]) {
      if (!contextManager.getRepositoryMetadata()) {
        throw new Error('No repository loaded. Call loadRepository() first.');
      }

      return ragRetriever.processQuery({
        message,
        sessionId,
        repository: contextManager['repository']!,
        conversationHistory,
      });
    },

    /**
     * Query with streaming response
     */
    async queryStream(
      message: string,
      sessionId: string,
      onChunk: (chunk: string) => void,
      conversationHistory?: any[]
    ) {
      if (!contextManager.getRepositoryMetadata()) {
        throw new Error('No repository loaded. Call loadRepository() first.');
      }

      return ragRetriever.processStreamingQuery(
        {
          message,
          sessionId,
          repository: contextManager['repository']!,
          conversationHistory,
        },
        onChunk
      );
    },
  };
}

// Export version
export const version = '0.1.0';
```

---

## Usage Example

```typescript
import { createPrincipalAI } from '@principal/core';

// Initialize
const ai = createPrincipalAI({
  groq: {
    apiKey: process.env.GROQ_API_KEY!,
  },
  github: {
    token: process.env.GITHUB_TOKEN, // Optional
  },
});

// Load repository
console.log('Loading repository...');
const repo = await ai.loadRepository('https://github.com/facebook/react');
console.log(`Loaded ${repo.documents.length} documents`);

// Query the codebase
console.log('\nQuerying...');
const response = await ai.query(
  'What is the architecture of this project?',
  'session-123'
);

console.log('Response:', response.content);
console.log('Sources:', response.sources);
console.log('Tokens:', response.tokensUsed);
console.log('Latency:', response.latency, 'ms');

// Streaming query
console.log('\n\nStreaming query...');
await ai.queryStream(
  'Explain the main components',
  'session-123',
  (chunk) => process.stdout.write(chunk)
);
```

---

## Error Handling Strategy

### API Errors
- Groq API errors (rate limits, auth failures)
- GitHub API errors (not found, rate limits)
- Network timeouts

### Implementation
```typescript
// In llm/error-handler.ts
export class LLMErrorHandler {
  async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    backoff = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(2, i)));
      }
    }
    throw new Error('Max retries exceeded');
  }
}
```

---

## Testing Strategy

### Unit Tests
- Test each module in isolation
- Mock external dependencies (GitHub API, Groq API)

### Integration Tests
- Test full pipeline with sample data
- Test error handling and edge cases

### Example Test (`tests/github.test.ts`)
```typescript
import { GitHubLoader } from '../src/github/loader';

describe('GitHubLoader', () => {
  it('should parse GitHub URL correctly', () => {
    const loader = new GitHubLoader({ token: 'test' });
    const result = loader['parseRepoUrl']('https://github.com/owner/repo');

    expect(result.owner).toBe('owner');
    expect(result.name).toBe('repo');
    expect(result.branch).toBe('main');
  });

  // More tests...
});
```

---

## Performance Optimizations

### Caching
- Cache GitHub API responses
- Cache parsed documents
- Cache context retrievals

### Batching
- Batch file loads from GitHub
- Batch LLM requests when possible

### Lazy Loading
- Load documents on-demand
- Stream large files

---

## Next Steps

1. **Implement Core Modules**
   - Start with types and interfaces
   - Implement GitHubLoader
   - Implement ContextManager
   - Implement GroqClient

2. **Add Dependencies**
   ```bash
   cd packages/core
   bun add groq-sdk @octokit/rest
   bun add -d @types/node bun-types
   ```

3. **Write Tests**
   - Unit tests for each module
   - Integration tests for RAG flow

4. **Optimize**
   - Add caching layer
   - Implement better relevance scoring
   - Consider vector embeddings for semantic search

5. **Document**
   - Add JSDoc comments
   - Create API documentation
   - Write usage examples

---

## Future Enhancements

### Vector Embeddings
- Use OpenAI embeddings or local models
- Implement semantic search with vector database
- Improve relevance scoring

### Advanced Features
- Multi-repository support
- Code-level analysis (AST parsing)
- Conversation memory and personalization
- Fine-tuned models for specific codebases

### Performance
- WebWorker/Worker threads for parsing
- Streaming file processing
- Progressive context loading
