/**
 * LLM Service: Combines MemoryPalace context with Groq for intelligent responses
 */

import Groq from "groq-sdk";
import { MemoryPalace } from "@a24z/core-library";
import { GitHubFileSystemAdapter } from "../adapters/GitHubFileSystemAdapter.js";
import { ViewAwareContextBuilder, QuestionIntent, QuestionType } from "./ViewAwareContextBuilder.js";

export interface LLMServiceConfig {
  apiKey: string;
  model?: string;
}

export interface GenerateResponseOptions {
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationResponseOptions {
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export class LLMService {
  private groq: Groq;
  private model: string;

  constructor(config: LLMServiceConfig) {
    this.groq = new Groq({ apiKey: config.apiKey });
    // Default to speech-optimized model for conversational AI
    this.model = config.model || "llama-3.1-8b-instant";
  }

  /**
   * Generate a response to a user question using codebase context
   */
  async generateResponse(
    palace: MemoryPalace,
    question: string,
    options: GenerateResponseOptions = {}
  ): Promise<string> {
    const { stream = false, temperature = 0.7, maxTokens = 2000 } = options;

    // Build system prompt with codebase context
    const systemPrompt = this.buildSystemPrompt(palace);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: question },
    ];

    if (stream) {
      // Streaming response
      const streamResponse = await this.groq.chat.completions.create({
        messages,
        model: this.model,
        stream: true,
        temperature,
        max_tokens: maxTokens,
      });

      let fullResponse = "";
      for await (const chunk of streamResponse) {
        const content = chunk.choices[0]?.delta?.content || "";
        fullResponse += content;
        process.stdout.write(content); // Stream to console
      }
      console.log(); // New line after streaming
      return fullResponse;
    } else {
      // Non-streaming response
      const response = await this.groq.chat.completions.create({
        messages,
        model: this.model,
        temperature,
        max_tokens: maxTokens,
      });

      return response.choices[0]?.message?.content || "";
    }
  }

  /**
   * Build system prompt with MemoryPalace context
   */
  private buildSystemPrompt(palace: MemoryPalace): string {
    const guidance = palace.getFullGuidance();
    const viewMetadata = palace.listViews();

    let prompt = `You are a Principal Engineer AI assistant helping developers understand this codebase.

# Repository Guidance

${guidance.guidance}

# Available Codebase Views

`;

    // Add detailed view information with file references
    viewMetadata.forEach((viewMeta, index) => {
      const view = palace.getView(viewMeta.id);
      if (!view) return;

      prompt += `${index + 1}. **${view.name}** (${view.category})
   ${view.description}

`;

      // Add file references from reference groups
      const refGroups = Object.entries(view.referenceGroups);
      if (refGroups.length > 0) {
        prompt += `   **Relevant Files:**\n`;
        refGroups.forEach(([_groupName, group]) => {
          group.files.forEach((file) => {
            prompt += `   - ${file}\n`;
          });
        });
        prompt += "\n";
      }
    });

    prompt += `
# Your Role

- Answer questions about the codebase architecture, patterns, and implementation details
- **Reference specific files from the views above when discussing implementations**
- Provide clear, concise explanations
- If you don't know something, say so honestly

# Response Guidelines

- Be direct and helpful
- Use markdown for formatting
- Reference view names AND specific files when discussing areas of the code
- When asked "where is X implemented", cite the actual files from the reference groups above
- Explain technical concepts clearly
`;

    return prompt;
  }

  /**
   * Generate streaming response (returns async generator)
   */
  async *generateStreamingResponse(
    palace: MemoryPalace,
    question: string,
    options: GenerateResponseOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const { temperature = 0.7, maxTokens = 2000 } = options;

    const systemPrompt = this.buildSystemPrompt(palace);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: question },
    ];

    const stream = await this.groq.chat.completions.create({
      messages,
      model: this.model,
      stream: true,
      temperature,
      max_tokens: maxTokens,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        yield content;
      }
    }
  }

  /**
   * Generate a conversational response with history
   * Returns the assistant's response that should be added to history
   */
  async generateConversationResponse(
    palace: MemoryPalace,
    message: string,
    conversationHistory: ConversationMessage[] = [],
    options: ConversationResponseOptions = {}
  ): Promise<string> {
    const { stream = false, temperature = 0.7, maxTokens = 2000 } = options;

    // Build system prompt with codebase context
    const systemPrompt = this.buildSystemPrompt(palace);

    // Build messages array: system + history + new message
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    if (stream) {
      // Streaming response
      const streamResponse = await this.groq.chat.completions.create({
        messages,
        model: this.model,
        stream: true,
        temperature,
        max_tokens: maxTokens,
      });

      let fullResponse = "";
      for await (const chunk of streamResponse) {
        const content = chunk.choices[0]?.delta?.content || "";
        fullResponse += content;
        process.stdout.write(content); // Stream to console
      }
      console.log(); // New line after streaming
      return fullResponse;
    } else {
      // Non-streaming response
      const response = await this.groq.chat.completions.create({
        messages,
        model: this.model,
        temperature,
        max_tokens: maxTokens,
      });

      return response.choices[0]?.message?.content || "";
    }
  }

  /**
   * Generate streaming conversational response (returns async generator)
   */
  async *generateConversationStreamingResponse(
    palace: MemoryPalace,
    message: string,
    conversationHistory: ConversationMessage[] = [],
    options: ConversationResponseOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const { temperature = 0.7, maxTokens = 2000 } = options;

    const systemPrompt = this.buildSystemPrompt(palace);

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    const stream = await this.groq.chat.completions.create({
      messages,
      model: this.model,
      stream: true,
      temperature,
      max_tokens: maxTokens,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        yield content;
      }
    }
  }

  /**
   * Two-stage view-aware response generation
   * This provides smarter context loading based on question intent
   */
  async generateViewAwareResponse(
    palace: MemoryPalace,
    fsAdapter: GitHubFileSystemAdapter,
    question: string,
    conversationHistory: ConversationMessage[] = [],
    options: ConversationResponseOptions = {}
  ): Promise<{ response: string; intent: QuestionIntent }> {
    const { stream = false, temperature = 0.7, maxTokens = 2000 } = options;

    // Initialize context builder
    const contextBuilder = new ViewAwareContextBuilder(palace, fsAdapter);

    // Stage 1: Analyze question
    console.log('🔍 Stage 1: Analyzing question intent...');
    const intent = contextBuilder.analyzeQuestionSimple(question, conversationHistory);

    console.log(`   Type: ${intent.type}`);
    console.log(`   Confidence: ${(intent.confidence * 100).toFixed(0)}%`);
    console.log(`   Relevant views: ${intent.relevantViews.length}`);
    console.log(`   Needs file content: ${intent.needsFileContent}`);
    console.log(`   Files to load: ${intent.relevantFiles.length}`);

    // Stage 2: Build enriched context
    console.log('\n📚 Stage 2: Building enriched context...');
    const enrichedContext = await contextBuilder.buildEnrichedContext(intent);

    console.log(`   Context size: ${Math.round(enrichedContext.length / 1024)}KB`);

    // Stage 3: Generate response
    console.log('\n💬 Stage 3: Generating response...\n');
    const response = await this.generateResponseWithContext(
      palace,
      question,
      conversationHistory,
      enrichedContext,
      intent,
      { stream, temperature, maxTokens }
    );

    return { response, intent };
  }

  /**
   * Generate response with pre-built context
   */
  private async generateResponseWithContext(
    palace: MemoryPalace,
    question: string,
    conversationHistory: ConversationMessage[],
    enrichedContext: string,
    intent: QuestionIntent,
    options: ConversationResponseOptions
  ): Promise<string> {
    const { stream = false, temperature = 0.7, maxTokens = 2000 } = options;

    // Build specialized system prompt based on intent
    const systemPrompt = this.buildIntentAwarePrompt(intent, enrichedContext, palace);

    // Build messages
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: question },
    ];

    if (stream) {
      const streamResponse = await this.groq.chat.completions.create({
        messages,
        model: this.model,
        stream: true,
        temperature,
        max_tokens: maxTokens,
      });

      let fullResponse = "";
      for await (const chunk of streamResponse) {
        const content = chunk.choices[0]?.delta?.content || "";
        fullResponse += content;
        process.stdout.write(content);
      }
      console.log();
      return fullResponse;
    } else {
      const response = await this.groq.chat.completions.create({
        messages,
        model: this.model,
        temperature,
        max_tokens: maxTokens,
      });

      return response.choices[0]?.message?.content || "";
    }
  }

  /**
   * Build system prompt tailored to question intent
   */
  private buildIntentAwarePrompt(
    intent: QuestionIntent,
    enrichedContext: string,
    palace: MemoryPalace
  ): string {
    const guidance = palace.getFullGuidance();

    const basePrompt = `You are a Principal Engineer AI helping developers understand this codebase.

# Repository Guidance

${guidance.guidance}

# Context for this Question (${intent.type})

${enrichedContext}

# Your Role

Based on the question type (${intent.type}), provide:
`;

    const roleGuidance: Record<QuestionType, string> = {
      overview: `
- High-level architectural explanation
- Reference the codebase views and their relationships
- Explain the purpose and design philosophy
- Keep it conceptual, not implementation details
- Be concise and suitable for voice delivery`,

      implementation: `
- Detailed explanation of how things work
- Reference specific code from the files provided above
- Explain methods, parameters, and logic flow
- Include code snippets when relevant
- Walk through the implementation step-by-step`,

      usage: `
- Step-by-step usage instructions
- Provide code examples from the implementation
- Reference relevant documentation from the views
- Highlight best practices
- Make it actionable and practical`,

      comparison: `
- Side-by-side comparison
- Explain use cases for each option
- Discuss trade-offs and when to use each
- Provide recommendation based on the codebase context
- Be balanced and fair to both options`
    };

    return basePrompt + roleGuidance[intent.type] + `

# Response Format Guidelines

- Be concise but thorough
- Use markdown formatting
- Reference specific files and views when applicable
- For voice delivery: use clear, natural language
- Structure with numbered steps when appropriate
- If you reference code, explain it clearly in words
`;
  }
}
