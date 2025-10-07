export interface Intent {
  type: 'market_brief' | 'ticker_stats' | 'compare' | 'metric_lookup' | 'headlines';
  confidence: number;
}

export interface Slots {
  tickers: string[];
  timeframe?: '1d' | '5d' | '1m' | '3m' | '6m' | 'ytd' | '1y';
  metrics?: string[];
  ask_clarification?: boolean;
}

export interface NLUResponse {
  intent: Intent;
  slots: Slots;
  clarification_question?: string;
}

export interface VoiceInput {
  text: string;
  confidence: number;
  timestamp: string;
}

export interface ConversationTurn {
  id: string;
  user_input: string;
  ai_response: string;
  intent: Intent;
  slots: Slots;
  timestamp: string;
}