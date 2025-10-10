# System Architecture & Data Flow

## Package Structure

```
┌─────────────────────────────────────────────────────────────┐
│                 BROWSER (Client-Side)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Next.js UI  │  │  Agora SDK   │  │  HeyGen SDK  │      │
│  │   (React)    │  │  (WebRTC)    │  │  (Streaming) │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘              │
│                           │                                 │
│                  HTTP POST/GET (REST API)                   │
└───────────────────────────┼─────────────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │   Next.js       │
                   │  API Routes     │
                   │  (/api/chat)    │
                   └────────┬────────┘
                            │
                   ┌────────▼────────────────┐
                   │  NPM PACKAGE            │
                   │ @principal-ade/ai-brain │
                   │  (v0.2.0)               │
                   │                         │
                   │ • GitHub Adapters       │
                   │ • MemoryPalace Access   │
                   │ • LLM Service (Groq)    │
                   │ • Context Management    │
                   └─────────────────────────┘
```

## Data Flow Diagram

### Initial Setup Flow (MemoryPalace Integration)

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Enter GitHub URL
     ▼
┌─────────────────┐
│  Next.js UI     │
└────┬────────────┘
     │ 2. POST /api/load-repo (PLANNED)
     ▼
┌──────────────────────┐
│  Next.js API Route   │
└────┬─────────────────┘
     │ 3. Call @principal-ade/ai-brain
     ▼
┌─────────────────────────────────────┐
│    @principal-ade/ai-brain          │
│  ┌──────────────────────┐           │
│  │ GitHubFileSystem     │           │
│  │ Adapter              │           │
│  └────┬─────────────────┘           │
│       │ 4. Fetch .alexandria/       │
│       │    directory structure      │
│       ▼                             │
│  ┌──────────────────────┐           │
│  │ In-Memory Cache      │           │
│  └────┬─────────────────┘           │
│       │ 5. Cache all files          │
│       ▼                             │
│  ┌──────────────────────┐           │
│  │ MemoryPalace         │           │
│  │ (@a24z/core-library) │           │
│  └────┬─────────────────┘           │
│       │ 6. Parse views, notes       │
│       │    guidance docs            │
└───────┼─────────────────────────────┘
        │ 7. Return MemoryPalace instance
        ▼
┌──────────────────────┐
│  Session Store       │
│  (In-Memory/Future)  │
│  • Palace instance   │
│  • Conversation hist │
└──────────────────────┘
```

### Voice Conversation Flow (Planned Implementation)

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Speaks question
     ▼
┌─────────────────────────────────┐
│      BROWSER (Client-Side)      │
│  ┌──────────────────┐           │
│  │  Agora SDK       │           │
│  │  (v4.24.0)       │           │
│  └────┬─────────────┘           │
│       │ 2. Speech-to-Text       │
│       ▼                         │
│  ┌──────────────────┐           │
│  │  Text transcript │           │
│  └────┬─────────────┘           │
└───────┼─────────────────────────┘
        │ 3. POST /api/chat
        ▼
┌──────────────────────┐
│  Next.js API Route   │
│  /api/chat           │
└────┬─────────────────┘
     │ 4. Text + Conversation History
     ▼
┌─────────────────────────────────────┐
│    @principal-ade/ai-brain          │
│  ┌──────────────────────┐           │
│  │ MemoryPalace         │           │
│  │ Instance             │           │
│  └────┬─────────────────┘           │
│       │ 5. Get codebase context     │
│       ▼                             │
│  ┌──────────────────────┐           │
│  │ LLMService           │◄──────────┤ Views,
│  │ (Groq API)           │  6. Inject│ Notes,
│  │ llama-3.1-8b-instant │   context │ Guidance
│  └────┬─────────────────┘           │
│       │ 7. Generate response        │
└───────┼─────────────────────────────┘
        │ 8. Text response
        ▼
┌─────────────────────────────────┐
│      BROWSER (Client-Side)      │
│  ┌──────────────────┐           │
│  │ ElevenLabs API   │           │
│  │ (TTS - PLANNED)  │           │
│  └────┬─────────────┘           │
│       │ 9. Audio stream         │
│       ▼                         │
│  ┌──────────────────┐           │
│  │  HeyGen SDK      │           │
│  │  (v2.1.0)        │           │
│  │  Avatar+Lipsync  │           │
│  └────┬─────────────┘           │
│       │ 10. Render video        │
│       ▼                         │
│  ┌──────────────────┐           │
│  │  Video Display   │           │
│  └──────────────────┘           │
└─────────────────────────────────┘
```

## Component Responsibilities

### Browser (Client-Side) - Next.js Frontend
**Status: Foundation Built, Integration Tests In Progress**

- **Next.js UI (React 19)**:
  - GitHub URL input forms
  - Avatar display container
  - Conversation UI
  - Test pages for each integration

- **Agora SDK (v4.24.0)**:
  - Real-time voice I/O via WebRTC
  - Speech-to-text (browser-based)
  - Test page: `/agora-test`

- **HeyGen SDK (v2.1.0)**:
  - Avatar rendering with streaming
  - Video streaming via WebRTC
  - Lip-sync synchronization
  - Test page: `/heygen-test`

- **ElevenLabs API**:
  - Text-to-speech audio generation
  - Called from browser
  - Test page: `/elevenlabs-test`

- **Theme System**:
  - `@a24z/industry-theme` for consistent UI
  - `themed-markdown` for documentation display

### Next.js API Routes (Serverless)
**Status: Partially Implemented**

- **REST Endpoints**: Simple HTTP POST/GET (no WebSockets)
- **Session Management**: Planned - store/retrieve conversation state
- **Request Routing**: Coordinate between frontend and @principal-ade/ai-brain
- **Implemented Routes**:
  - `/api/chat` - Basic chat endpoint (in development)

### NPM Package (@principal-ade/ai-brain v0.2.0)
**Status: Core Functionality Complete, Published**

- **GitHub Adapters**:
  - `GitHubFileSystemAdapter` - Pre-fetch & cache repo files
  - `GitHubGlobAdapter` - File tree fetching with glob patterns

- **MemoryPalace Integration**:
  - Access `.alexandria/` directory structure
  - Load codebase views, notes, and guidance
  - Leverages `@a24z/core-library` for context management

- **LLM Service**:
  - Groq API integration (llama-3.1-8b-instant)
  - Speech-optimized model for conversational AI
  - Conversation history support
  - Streaming and non-streaming responses
  - Context injection from MemoryPalace

- **Response Generator**:
  - Build system prompts with codebase context
  - Reference specific files from views
  - Multi-turn conversation support

## API Endpoints

### `/api/load-repo` (PLANNED)
```typescript
POST /api/load-repo
Body: { repoUrl: string }

Flow:
1. Validate GitHub URL
2. Call @principal-ade/ai-brain adapters to fetch .alexandria/
3. Initialize MemoryPalace instance
4. Store Palace instance in session (in-memory or Redis)
5. Return session ID + metadata

Response: {
  sessionId: string,
  repoName: string,
  views: Array<ViewMetadata>,
  guidanceLoaded: boolean
}
```

### `/api/chat` (IN DEVELOPMENT)
```typescript
POST /api/chat
Body: {
  sessionId: string,
  message: string,
  conversationHistory?: Array<ConversationMessage>
}

Flow:
1. Retrieve MemoryPalace instance from session
2. Call LLMService.generateConversationResponse()
   - Inject codebase context from MemoryPalace
   - Include conversation history
   - Generate response via Groq API
3. Return text response
4. Frontend handles TTS + Avatar separately

Response: {
  text: string,
  conversationId: string
}
```

### Client-Side SDKs (No Server-Side Streaming Needed)

**Agora SDK** (Browser):
- Handles voice input/output via WebRTC
- Built-in speech-to-text
- No server-side streaming required

**HeyGen SDK** (Browser):
- Receives text and audio from ElevenLabs
- Renders avatar with lip-sync
- WebRTC-based, runs entirely client-side

**Flow**: Browser → Agora STT → POST /api/chat → Response → ElevenLabs → HeyGen → Display

## Technology Integration Points

```
┌─────────────────────────────────────────────────┐
│              BROWSER (Client-Side)              │
│                                                 │
│  ┌──────────────┐                              │
│  │  Agora SDK   │                              │
│  │  (WebRTC)    │                              │
│  └──────┬───────┘                              │
│         │ STT                                  │
│         ▼                                      │
│  ┌──────────────┐     HTTP POST               │
│  │     Text     │────────────────┐            │
│  └──────────────┘                │            │
└──────────────────────────────────┼────────────┘
                                   │
                                   ▼
                          ┌────────────────┐
                          │ Appwrite Fn    │
                          │ /api/chat      │
                          └────────┬───────┘
                                   │
                                   ▼
                          ┌────────────────┐
                          │ @principal/core│
                          │ + Groq LLM     │
                          └────────┬───────┘
                                   │ Response
┌──────────────────────────────────┼────────────┐
│              BROWSER             │            │
│                                  ▼            │
│                          ┌────────────────┐   │
│                          │  ElevenLabs    │   │
│                          │  (TTS API)     │   │
│                          └────────┬───────┘   │
│                                   │ Audio     │
│                                   ▼           │
│                          ┌────────────────┐   │
│                          │  HeyGen SDK    │   │
│                          │  (Avatar)      │   │
│                          └────────┬───────┘   │
│                                   │           │
│                                   ▼           │
│                          ┌────────────────┐   │
│                          │  Video Display │   │
│                          └────────────────┘   │
└──────────────────────────────────────────────┘
```

## Implementation Status

### ✅ Completed
1. **@principal-ade/ai-brain package (v0.2.0)**
   - GitHub adapters for fetching .alexandria/ directories
   - MemoryPalace integration via @a24z/core-library
   - LLM Service with Groq API (llama-3.1-8b-instant)
   - Conversation history support
   - Published to npm as public package

2. **Next.js Frontend Foundation**
   - Project scaffolding with React 19
   - Theme system integration (@a24z/industry-theme)
   - Test pages for each partner technology
   - Dependencies installed (Agora, HeyGen, ElevenLabs)

### 🔄 In Progress
1. **Integration Testing**
   - Individual SDK test pages created
   - Testing voice I/O with Agora
   - Testing avatar rendering with HeyGen
   - Testing TTS with ElevenLabs

2. **API Routes**
   - `/api/chat` endpoint started
   - Session management architecture planned

### 📋 Planned
1. **User Experience Integration**
   - Connect all components into cohesive UX
   - Implement full conversation flow
   - Build main application UI

2. **Deployment**
   - Deploy to production hosting
   - Environment configuration
   - Production testing

## Why This Architecture?

### @principal-ade/ai-brain as separate NPM package:
✅ **Reusable** - Works across different frontends (CLI, VSCode extension, web)
✅ **Testable** - Unit tests for parsing, LLM calls in isolation
✅ **Versioned** - Published independently with semantic versioning
✅ **Clear Contract** - Well-defined API between UI and AI logic
✅ **Swappable** - Easy to change LLM providers or parsing strategies
✅ **Published** - Available as @principal-ade/ai-brain on npm

### Browser-based architecture:
✅ **Serverless** - No server-side WebSocket infrastructure needed
✅ **WebRTC** - Real-time audio/video via Agora + HeyGen SDKs
✅ **Simple APIs** - REST endpoints deployable anywhere
✅ **Scalable** - No persistent connections to manage
✅ **Fast** - Direct browser-to-service communication

### MemoryPalace Integration:
✅ **Structured Context** - Leverage .alexandria/ codebase views
✅ **Rich Documentation** - Access notes, guidance, and file references
✅ **Proven Pattern** - Uses established @a24z/core-library
✅ **Intelligent Responses** - LLM gets structured codebase knowledge

## Development Workflow (Completed & Ongoing)

### Phase 1: Core Package ✅ COMPLETE
   - Built GitHub adapters for .alexandria/ fetching
   - Integrated MemoryPalace from @a24z/core-library
   - Connected Groq LLM (llama-3.1-8b-instant)
   - Tested with sample repositories
   - Published to npm

### Phase 2: Frontend Foundation ✅ COMPLETE
   - Created Next.js app with React 19
   - Integrated theme system
   - Installed all partner SDKs
   - Created test pages for each integration

### Phase 3: Integration Testing 🔄 IN PROGRESS
   - Testing Agora voice I/O
   - Testing HeyGen avatar rendering
   - Testing ElevenLabs TTS
   - Testing LLM conversation flow

### Phase 4: User Experience 📋 NEXT
   - Design main application UI
   - Connect all components
   - Implement end-to-end conversation flow
   - Polish user interactions

### Phase 5: Deployment 📋 PLANNED
   - Deploy to production hosting
   - Configure production environment
   - Final testing and demo preparation
