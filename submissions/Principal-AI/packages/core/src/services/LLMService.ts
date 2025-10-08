/**
 * LLM Service: Combines MemoryPalace context with Groq for intelligent responses
 */

import Groq from "groq-sdk";
import { MemoryPalace } from "@a24z/core-library";

export interface LLMServiceConfig {
  apiKey: string;
  model?: string;
}

export interface GenerateResponseOptions {
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export class LLMService {
  private groq: Groq;
  private model: string;

  constructor(config: LLMServiceConfig) {
    this.groq = new Groq({ apiKey: config.apiKey });
    this.model = config.model || "llama-3.3-70b-versatile";
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
}
