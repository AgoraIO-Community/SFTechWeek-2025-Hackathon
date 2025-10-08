# System Architecture & Data Flow

## Package Structure

```
┌─────────────────────────────────────────────────────────────┐
│                 BROWSER (Client-Side)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │  Agora SDK   │  │  HeyGen SDK  │      │
│  │              │  │  (WebRTC)    │  │  (WebRTC)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘              │
│                           │                                 │
│                  HTTP POST (REST API)                       │
└───────────────────────────┼─────────────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │ Appwrite        │
                   │ Functions       │
                   │ (API Routes)    │
                   └────────┬────────┘
                            │
                   ┌────────▼────────┐
                   │  EXTERNAL PKG   │
                   │ @principal/core │
                   │                 │
                   │ • GitHub Parser │
                   │ • Doc Loader    │
                   │ • LLM Service   │
                   │ • Context Mgmt  │
                   └─────────────────┘
```

## Data Flow Diagram

### Initial Setup Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Enter GitHub URL
     ▼
┌─────────────────┐
│  Next.js UI     │
└────┬────────────┘
     │ 2. POST /api/load-repo
     ▼
┌──────────────────────┐
│  API Orchestrator    │
└────┬─────────────────┘
     │ 3. Call @principal/core
     ▼
┌─────────────────────────────────┐
│    @principal/core              │
│  ┌──────────────────┐           │
│  │ GitHub Loader    │           │
│  └────┬─────────────┘           │
│       │ 4. Fetch repo files     │
│       │    (CLAUDE.md, README)  │
│       ▼                         │
│  ┌──────────────────┐           │
│  │ Document Parser  │           │
│  └────┬─────────────┘           │
│       │ 5. Parse & chunk docs   │
│       ▼                         │
│  ┌──────────────────┐           │
│  │ Context Store    │           │
│  └────┬─────────────┘           │
└───────┼─────────────────────────┘
        │ 6. Return codebase context
        ▼
┌──────────────────────┐
│  Appwrite Database   │
│  • Repo metadata     │
│  • Parsed docs       │
│  • Session state     │
└──────────────────────┘
```

### Voice Conversation Flow (Browser-Based)

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
│  │  (WebRTC)        │           │
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
│  Appwrite Function   │
│  /api/chat           │
└────┬─────────────────┘
     │ 4. Text + Session ID
     ▼
┌─────────────────────────────────┐
│    @principal/core              │
│  ┌──────────────────┐           │
│  │ Context Retriever│           │
│  └────┬─────────────┘           │
│       │ 5. Get relevant docs    │
│       ▼                         │
│  ┌──────────────────┐           │
│  │ LLM Service      │◄──────────┤ Codebase
│  │ (Groq)           │  6. Inject│ Context
│  └────┬─────────────┘   context │
│       │ 7. Generate response    │
└───────┼─────────────────────────┘
        │ 8. Text response
        ▼
┌─────────────────────────────────┐
│      BROWSER (Client-Side)      │
│  ┌──────────────────┐           │
│  │ ElevenLabs API   │           │
│  │ (TTS)            │           │
│  └────┬─────────────┘           │
│       │ 9. Audio stream         │
│       ▼                         │
│  ┌──────────────────┐           │
│  │  HeyGen SDK      │           │
│  │  (Avatar+Lipsync)│           │
│  └────┬─────────────┘           │
│       │ 10. Render video        │
│       ▼                         │
│  ┌──────────────────┐           │
│  │  Video Display   │           │
│  └──────────────────┘           │
└─────────────────────────────────┘
```

## Component Responsibilities

### Browser (Client-Side)
- **React UI**: GitHub URL input, avatar display, conversation UI
- **Agora SDK (WebRTC)**: Real-time voice I/O, speech-to-text (browser-based)
- **HeyGen SDK (WebRTC)**: Avatar rendering, video streaming, lip-sync (browser-based)
- **ElevenLabs API**: Text-to-speech audio generation (called from browser)

### Appwrite Functions (Serverless)
- **API Routes**: Simple REST endpoints (no WebSockets needed)
- **Session Management**: Store/retrieve conversation state
- **Request Routing**: Coordinate between frontend and @principal/core

### External Package (@principal/core)
- **GitHub Loader**: Fetch repo contents via GitHub API
- **Document Parser**: Extract and structure docs (CLAUDE.md, README, etc.)
- **Context Manager**: Store, retrieve, and chunk documentation
- **LLM Service**: Groq API integration, prompt engineering
- **Response Generator**: Context injection + response generation

## API Endpoints

### `/api/load-repo`
```typescript
POST /api/load-repo
Body: { repoUrl: string }

Flow:
1. Validate GitHub URL
2. Call @principal/core.loadRepository(url)
3. Store context in Appwrite
4. Return session ID + metadata

Response: { sessionId, repoName, filesProcessed }
```

### `/api/chat`
```typescript
POST /api/chat
Body: { sessionId: string, message: string }

Flow:
1. Retrieve session context from Appwrite
2. Call @principal/core.generateResponse(context, message)
3. Return text response
4. Frontend handles TTS + Avatar separately

Response: { text: string, conversationId: string }
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

## Why This Split?

### @principal/core as separate package:
✅ Reusable across different frontends (CLI, VSCode extension, web)
✅ Testable in isolation (unit tests for parsing, LLM calls)
✅ Can be published privately and versioned independently
✅ Clear API contract between UI and AI logic
✅ Easier to swap LLM providers or parsing strategies

### Browser-based architecture:
✅ No server-side WebSocket infrastructure needed
✅ WebRTC handles real-time audio/video (Agora + HeyGen SDKs)
✅ Simple REST APIs deployable to Appwrite Functions
✅ Scalable serverless deployment with no persistent connections

## Development Workflow

1. **Develop @principal/core first**
   - Build GitHub loader
   - Implement doc parser
   - Connect Groq LLM
   - Test with sample repos

2. **Build Next.js frontend**
   - Create basic UI
   - Integrate Agora SDK (browser)
   - Add HeyGen SDK (browser)
   - Wire up ElevenLabs API

3. **Connect the pieces**
   - Install @principal/core in Next.js project
   - Implement REST API routes
   - Test end-to-end flow

4. **Deploy**
   - Deploy Next.js app to Appwrite Functions (serverless)
   - All voice/video processing happens client-side (browser)
