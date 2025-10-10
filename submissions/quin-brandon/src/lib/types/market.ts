export interface Quote {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  timestamp: string;
}

export interface CompanyMetrics {
  symbol: string;
  pe_ratio: number;
  market_cap: number;
  eps: number;
  dividend_yield: number;
}

export interface NewsHeadline {
  headline: string;
  summary: string;
  source: string;
  url: string;
  published_at: string;
}

export interface MarketDataResponse {
  quotes?: Quote[];
  metrics?: CompanyMetrics[];
  headlines?: NewsHeadline[];
  market_indices?: Quote[];
}

export interface WatchlistItem {
  user_id: string;
  symbol: string;
  display_name: string;
  created_at: string;
}