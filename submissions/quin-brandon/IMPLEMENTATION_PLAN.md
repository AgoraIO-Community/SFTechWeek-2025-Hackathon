# AI Market Avatar - Implementation Plan

## Overview
A Next.js TypeScript web app with HeyGen avatar delivering real-time market insights via voice interaction.

## Tech Stack

### Core Framework
- **Next.js 14** with TypeScript
- **App Router** for file-based routing
- **Tailwind CSS** for styling

### Partner APIs
- **Agora**: Real-time voice capture and STT
- **Groq**: LLM for intent parsing and response generation
- **ElevenLabs**: Streaming TTS
- **HeyGen**: Live avatar video streaming
- **AppWrite**: Auth, database, and hosting
- **Finnhub**: Market data (60 free calls/min)

## Architecture Flow

```
User Voice → Agora STT → Groq NLU → Finnhub Data → Groq Response → ElevenLabs TTS → HeyGen Avatar
```

## Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── market/
│   │   │   │   └── route.ts           # Market data endpoints
│   │   │   ├── nlu/
│   │   │   │   └── route.ts           # Groq NLU processing
│   │   │   ├── tts/
│   │   │   │   └── route.ts           # ElevenLabs TTS
│   │   │   └── avatar/
│   │   │       └── route.ts           # HeyGen session management
│   │   ├── dashboard/
│   │   │   └── page.tsx               # Main avatar interface
│   │   ├── auth/
│   │   │   └── page.tsx               # Login/signup
│   │   └── layout.tsx                 # Root layout
│   ├── components/
│   │   ├── Avatar/
│   │   │   ├── AvatarPlayer.tsx       # HeyGen video player
│   │   │   ├── VoiceControls.tsx      # Mic controls
│   │   │   └── LiveCaptions.tsx       # Speech captions
│   │   ├── Market/
│   │   │   ├── WatchlistManager.tsx   # Watchlist CRUD
│   │   │   └── MarketBrief.tsx        # Market overview
│   │   └── Common/
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   ├── lib/
│   │   ├── services/
│   │   │   ├── MarketService.ts       # Finnhub wrapper
│   │   │   ├── NLUService.ts          # Groq integration
│   │   │   ├── TTSService.ts          # ElevenLabs integration
│   │   │   ├── AvatarService.ts       # HeyGen integration
│   │   │   └── AgoraService.ts        # Voice capture
│   │   ├── database/
│   │   │   └── appwrite.ts            # AppWrite client
│   │   ├── types/
│   │   │   ├── market.ts              # Market data types
│   │   │   ├── nlu.ts                 # Intent/slots types
│   │   │   └── avatar.ts              # Avatar session types
│   │   └── utils/
│   │       ├── audio.ts               # Audio utilities
│   │       └── validation.ts          # Input validation
│   └── hooks/
│       ├── useAgora.ts                # Agora voice hooks
│       ├── useAvatar.ts               # Avatar state management
│       └── useMarketData.ts           # Market data fetching
├── public/
│   └── avatars/                       # Avatar assets
├── .env.local                         # Environment variables
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## API Environment Variables

```env
# Agora
NEXT_PUBLIC_AGORA_APP_ID=
AGORA_APP_CERTIFICATE=

# Groq
GROQ_API_KEY=

# ElevenLabs
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=

# HeyGen
HEYGEN_API_KEY=
HEYGEN_AVATAR_ID=

# Finnhub
FINNHUB_API_KEY=

# AppWrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=
NEXT_PUBLIC_APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=
```

## AppWrite Database Schema

### Collections

**users**
```typescript
{
  id: string;
  email: string;
  name: string;
  created_at: string;
}
```

**preferences**
```typescript
{
  user_id: string;
  units: 'usd' | 'percentage';
  default_timeframe: '1d' | '5d' | '1m' | '3m' | '6m' | 'ytd' | '1y';
  created_at: string;
}
```

**watchlist_items**
```typescript
{
  user_id: string;
  symbol: string;
  display_name: string;
  created_at: string;
}
```

**sessions**
```typescript
{
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'ended';
}
```

**logs**
```typescript
{
  session_id: string;
  type: 'stt' | 'nlu' | 'market' | 'tts' | 'error';
  payload: Record<string, any>;
  timestamp: string;
}
```

## Data Types

### NLU Types
```typescript
interface Intent {
  type: 'market_brief' | 'ticker_stats' | 'compare' | 'metric_lookup' | 'headlines';
  confidence: number;
}

interface Slots {
  tickers: string[];
  timeframe?: '1d' | '5d' | '1m' | '3m' | '6m' | 'ytd' | '1y';
  metrics?: string[];
  ask_clarification?: boolean;
}

interface NLUResponse {
  intent: Intent;
  slots: Slots;
  clarification_question?: string;
}
```

### Market Data Types
```typescript
interface Quote {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  timestamp: string;
}

interface CompanyMetrics {
  symbol: string;
  pe_ratio: number;
  market_cap: number;
  eps: number;
  dividend_yield: number;
}

interface NewsHeadline {
  headline: string;
  summary: string;
  source: string;
  url: string;
  published_at: string;
}
```

## API Endpoints

### POST /api/nlu
```typescript
Request: { text: string; user_id: string }
Response: NLUResponse
```

### POST /api/market/query
```typescript
Request: { intent: Intent; slots: Slots; user_id: string }
Response: {
  quotes?: Quote[];
  metrics?: CompanyMetrics[];
  headlines?: NewsHeadline[];
  market_indices?: Quote[];
}
```

### POST /api/tts/generate
```typescript
Request: { text: string; voice_id?: string }
Response: { audio_url: string; duration: number }
```

### POST /api/avatar/session
```typescript
Request: { user_id: string }
Response: { session_id: string; rtc_token: string }
```

## Implementation Phases

### Phase 1: Foundation (Day 1)
1. **Project Setup**
   - Next.js 14 with TypeScript
   - Install dependencies (Agora, AppWrite, etc.)
   - Configure environment variables

2. **AppWrite Setup**
   - Create project and database
   - Set up collections and permissions
   - Implement auth wrapper

3. **Basic UI Shell**
   - Main dashboard layout
   - Avatar video placeholder
   - Mic controls component

4. **HeyGen Integration**
   - Avatar session creation
   - WebRTC video player
   - Basic session management

### Phase 2: Voice Pipeline (Day 2)
1. **Agora Voice Capture**
   - Real-time audio streaming
   - STT integration
   - Voice activity detection

2. **Groq NLU Service**
   - Intent classification
   - Slot extraction
   - Clarification handling

3. **Finnhub Market Service**
   - Quote fetching
   - Company metrics
   - News headlines API

4. **Basic Flow Test**
   - Voice → STT → NLU → Market Data → Response

### Phase 3: Audio Output (Day 3)
1. **ElevenLabs TTS**
   - Text to speech generation
   - Audio streaming
   - Voice consistency

2. **Avatar Speech Integration**
   - TTS → HeyGen pipeline
   - Lip sync coordination
   - Audio/video synchronization

3. **Response Templates**
   - Market brief script
   - Ticker stats format
   - Comparison responses
   - Metrics readouts
   - Headlines summaries

### Phase 4: Features (Day 4)
1. **All Intent Types**
   - Market brief with watchlist
   - Ticker statistics
   - Stock comparisons
   - Metric lookups
   - News headlines

2. **Watchlist Management**
   - Add/remove tickers
   - Persistent storage
   - Default selections

3. **Error Handling**
   - Fallback responses
   - Service outage handling
   - Clarification prompts

4. **Live Features**
   - Real-time captions
   - Interruption handling
   - Session management

## Response Templates

### Market Brief
```
"The S&P 500 is {direction} {percentage}. {top_performer} is leading your watchlist, {direction} {percentage}. {notable_mover} is {direction} {percentage} on {volume_context}."
```

### Ticker Stats
```
"{symbol} is {direction} {percentage} over {timeframe}, {context}. Average volume is {volume}."
```

### Comparison
```
"{symbol1} {outperformed/underperformed} {symbol2} {timeframe}, {direction} {percentage1} versus {percentage2}."
```

### Metrics
```
"{company}'s trailing P/E is {pe_ratio} and market cap is {market_cap}."
```

### Headlines
```
"{count} headlines for {company}. One, {headline1}. Two, {headline2}."
```

## Groq Prompts

### Intent Classifier
```
You are a financial voice assistant classifier. Analyze the user's speech and return JSON with intent and slots.

Allowed intents: market_brief, ticker_stats, compare, metric_lookup, headlines

Extract slots:
- tickers: array of stock symbols mentioned
- timeframe: 1d, 5d, 1m, 3m, 6m, ytd, 1y
- metrics: array of requested metrics (pe, market_cap, volume, etc.)

If uncertain about intent or missing required slots, set ask_clarification: true.

User: "{user_text}"

Return only valid JSON.
```

### Response Writer
```
You are a concise market analyst for a talking avatar. Draft 1-3 sentences for voice delivery.

Requirements:
- Keep under 8 seconds when spoken
- Use specific numbers and percentages
- Avoid hedging language
- Sound confident and professional
- Include context when relevant

Data: {market_data}
Intent: {intent}

Draft response:
```

## Testing Strategy

### Unit Tests
- MarketService API calls
- NLU response parsing
- Audio utility functions
- Validation helpers

### Integration Tests
- Voice → STT → NLU flow
- Market data → Response generation
- TTS → Avatar speech pipeline
- AppWrite database operations

### Demo Scenarios
1. **Cold Start**: "Give me a market update"
2. **Ticker Lookup**: "Show TSLA for the last six months"
3. **Comparison**: "Compare NVDA and AMD year to date"
4. **Metrics**: "What is Apple's P/E and market cap"
5. **Headlines**: "What's going on with NVDA today"

## Performance Targets

- **Cold Start**: Avatar active within 3 seconds
- **Voice Response**: Under 2 seconds for metrics, under 3 seconds for headlines
- **Audio Quality**: Clear TTS with natural timing
- **Error Recovery**: Graceful fallbacks for all service failures
- **Session Persistence**: Watchlist remembered across refreshes

## Deployment

### AppWrite Hosting
- Build: `npm run build`
- Deploy: AppWrite CLI or dashboard upload
- Environment variables via AppWrite console
- Custom domain configuration

### Environment Setup
- Development: `.env.local`
- Production: AppWrite environment variables
- API rate limiting and caching strategies
- Error monitoring and logging

## Success Metrics

### Technical
- < 2 second average response time
- > 95% uptime for core features
- Error rate < 5%
- STT accuracy > 90%

### User Experience
- Smooth avatar lip sync
- Natural conversation flow
- Accurate market data
- Intuitive voice commands

## Risk Mitigation

### API Rate Limits
- Finnhub: 60 calls/min (cache aggressively)
- ElevenLabs: Character limits (optimize text)
- Groq: Request limits (batch where possible)

### Service Outages
- Cached market data fallbacks
- Generic avatar responses
- Graceful error messages
- Manual override capabilities

### Audio/Video Sync
- Buffer management for TTS
- WebRTC connection monitoring
- Fallback to text responses
- Session recovery mechanisms