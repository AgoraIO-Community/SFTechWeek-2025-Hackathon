import { Intent, Slots, NLUResponse } from '../types/nlu';
import Groq from 'groq-sdk';

export class NLUService {
  private client: Groq;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY || '';
    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    this.client = new Groq({
      apiKey: apiKey,
    });
  }

  async processText(text: string, userId?: string): Promise<NLUResponse> {
    try {
      const chatCompletion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: text
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        max_tokens: 300
      });

      const aiResponse = chatCompletion.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from Groq');
      }

      let parsedResponse: NLUResponse;
      try {
        parsedResponse = JSON.parse(aiResponse);

        // Validate and normalize the response
        parsedResponse = this.validateAndNormalize(parsedResponse);
      } catch (parseError) {
        console.error('Failed to parse Groq response:', parseError);
        console.error('Raw response:', aiResponse);
        // Fallback response
        parsedResponse = this.createFallbackResponse(text);
      }

      return parsedResponse;
    } catch (error) {
      console.error('NLU processing error:', error);
      return this.createFallbackResponse(text);
    }
  }

  async generateResponse(intent: Intent, slots: Slots, marketData: any): Promise<string> {
    try {
      const chatCompletion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: this.getResponseSystemPrompt()
          },
          {
            role: 'user',
            content: `Intent: ${intent.type}
Slots: ${JSON.stringify(slots)}
Market Data: ${JSON.stringify(marketData)}

Generate a natural, conversational response for the AI avatar to speak.`
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 200
      });

      return chatCompletion.choices[0]?.message?.content || this.getDefaultResponse(intent.type);
    } catch (error) {
      console.error('Response generation error:', error);
      return this.getDefaultResponse(intent.type);
    }
  }

  private getSystemPrompt(): string {
    return `You are a financial voice assistant classifier. Analyze the user's speech and return JSON with intent and slots.

Allowed intents:
- market_brief: General market overview or summary
- ticker_stats: Specific stock information
- compare: Compare multiple stocks
- metric_lookup: Specific financial metrics (P/E, market cap, etc.)
- headlines: News about stocks or market

Extract slots:
- tickers: array of stock symbols mentioned (convert to uppercase, e.g. "apple" -> ["AAPL"])
- timeframe: 1d, 5d, 1m, 3m, 6m, ytd, 1y (default to "1d")
- metrics: array of requested metrics (pe, market_cap, volume, etc.)

If uncertain about intent or missing required tickers for ticker_stats/compare, set ask_clarification: true.

Examples:
- "How is Apple doing?" -> {"intent": {"type": "ticker_stats", "confidence": 0.9}, "slots": {"tickers": ["AAPL"], "timeframe": "1d"}}
- "Give me a market update" -> {"intent": {"type": "market_brief", "confidence": 0.95}, "slots": {"timeframe": "1d"}}
- "Compare Apple and Microsoft" -> {"intent": {"type": "compare", "confidence": 0.9}, "slots": {"tickers": ["AAPL", "MSFT"]}}

Return ONLY valid JSON.`;
  }

  private getResponseSystemPrompt(): string {
    return `You are a concise market analyst for a talking avatar. Generate natural, conversational responses for voice delivery.

Requirements:
- Keep responses under 30 words when possible
- Use specific numbers and percentages from the data
- Sound confident and professional
- Avoid hedging language ("might", "could", "perhaps")
- Include context when relevant
- Make it sound natural when spoken aloud

Examples:
- "Apple is trading at $175.50, up 2.3% today with strong volume."
- "The market is mixed today. Tech stocks are leading with the Nasdaq up 1.2%."
- "Tesla outperformed Apple this month, gaining 8% versus Apple's 3%."`;
  }

  private validateAndNormalize(response: any): NLUResponse {
    // Ensure required structure
    if (!response.intent || !response.slots) {
      throw new Error('Invalid response structure');
    }

    // Normalize intent
    const validIntents = ['market_brief', 'ticker_stats', 'compare', 'metric_lookup', 'headlines'];
    if (!validIntents.includes(response.intent.type)) {
      response.intent.type = 'market_brief';
    }

    // Ensure confidence is a number
    if (typeof response.intent.confidence !== 'number') {
      response.intent.confidence = 0.5;
    }

    // Normalize slots
    response.slots.tickers = response.slots.tickers || [];
    response.slots.timeframe = response.slots.timeframe || '1d';

    return response as NLUResponse;
  }

  private createFallbackResponse(text: string): NLUResponse {
    // Simple keyword-based fallback
    const upperText = text.toUpperCase();

    if (upperText.includes('MARKET') || upperText.includes('UPDATE') || upperText.includes('BRIEF')) {
      return {
        intent: { type: 'market_brief', confidence: 0.6 },
        slots: { tickers: [], timeframe: '1d' }
      };
    }

    // Extract potential tickers
    const tickerRegex = /\b[A-Z]{1,5}\b/g;
    const potentialTickers = text.match(tickerRegex) || [];

    return {
      intent: { type: 'ticker_stats', confidence: 0.4 },
      slots: {
        tickers: potentialTickers.slice(0, 3), // Limit to 3 tickers
        timeframe: '1d'
      },
      clarification_question: "I'm not sure I understood. Could you please clarify what market information you need?"
    };
  }

  private getDefaultResponse(intentType: string): string {
    const defaults = {
      market_brief: "The market is showing mixed activity today. Let me get you more specific information.",
      ticker_stats: "Here's the latest information on your requested stock.",
      compare: "I've compared those stocks for you. Here are the key differences.",
      metric_lookup: "Here are the financial metrics you requested.",
      headlines: "Here are the latest headlines affecting the market."
    };

    return defaults[intentType as keyof typeof defaults] || "I have the information you requested.";
  }
}

export const nluService = new NLUService();