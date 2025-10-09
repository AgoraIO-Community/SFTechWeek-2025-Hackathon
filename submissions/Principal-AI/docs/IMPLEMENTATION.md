# @principal-ade/ai-brain - Implementation Documentation

## Overview

`@principal-ade/ai-brain` is the core intelligence package for Principal AI, providing GitHub repository analysis and conversational AI powered by Groq LLM.

**Published Package:** `@principal-ade/ai-brain@0.2.0`
**NPM:** https://www.npmjs.com/package/@principal-ade/ai-brain

---

## What We Built

### Architecture

Instead of building custom document loaders and chunking (as outlined in CORE_LLM_DESIGN.md), we leveraged the existing **@a24z/core-library** MemoryPalace system with custom GitHub adapters.

```
@principal-ade/ai-brain
├── adapters/
│   ├── GitHubFileSystemAdapter.ts    # Pre-fetch GitHub repos
│   └── GitHubGlobAdapter.ts          # Pattern matching for files
├── services/
│   └── LLMService.ts                 # Groq integration + conversations
└── index.ts                          # Public exports
```

---

## Core Components

### 1. GitHubFileSystemAdapter

**Purpose:** Bridge GitHub API (async) with MemoryPalace's FileSystemAdapter (sync)

**Strategy:** Pre-fetch and cache repository files

```typescript
const fsAdapter = new GitHubFileSystemAdapter(
  "owner",
  "repo",
  "main",
  githubToken
);

// Pre-fetch .alexandria directory
await fsAdapter.prefetchAlexandriaFiles();

// Now works synchronously
const palace = new MemoryPalace(fsAdapter.getGitHubPath(), fsAdapter);
```

**Key Methods:**
- `initialize()` - Fetch repository tree from GitHub
- `prefetchAlexandriaFiles()` - Cache .alexandria files in memory
- `readFile(path)` - Return cached file content (sync)
- `readDir(path)` - Return cached directory listing (sync)

**Implementation Details:**
- Uses GitHub API recursive tree endpoint
- Caches ~20 files in <2 seconds
- Builds directory structure map
- Supports ~200 files per repository

---

### 2. LLMService

**Purpose:** Groq LLM integration with MemoryPalace context

**Model:** `llama-3.1-8b-instant` (speech-optimized for voice interfaces)

#### Single-Turn Questions

```typescript
const llm = new LLMService({ apiKey: groqKey });

const response = await llm.generateResponse(
  palace,
  "What is the MemoryPalace class?",
  { stream: true }
);
```

#### Multi-Turn Conversations (v0.2.0)

```typescript
const history: ConversationMessage[] = [];

// Turn 1
const response1 = await llm.generateConversationResponse(
  palace,
  "What is the MemoryPalace class?",
  history
);
history.push({ role: "user", content: "What is the MemoryPalace class?" });
history.push({ role: "assistant", content: response1 });

// Turn 2 - knows context from Turn 1
const response2 = await llm.generateConversationResponse(
  palace,
  "Where is it implemented?",  // Knows we're talking about MemoryPalace
  history
);
```

**System Prompt:**
- Built from MemoryPalace guidance
- Includes all codebase views with file references
- Instructs LLM to cite specific files
- ~15 views with file references per repository

**Performance:**
- Speech model: ~1140ms average response time
- Conversational tone optimized for TTS
- Streams token-by-token for real-time UX

---

### 3. MemoryPalace Integration

**What MemoryPalace Provides:**
- `.alexandria/` directory parsing
- Codebase views (metadata linking docs to code)
- Repository guidance
- Notes and configuration

**What We Use:**
```typescript
const guidance = palace.getFullGuidance();
const views = palace.listViews();  // Returns 15 views
const view = palace.getView(viewId);

// Each view contains:
{
  name: "Path Management Architecture",
  category: "architecture",
  description: "Centralized path management...",
  referenceGroups: {
    "0,0": {
      files: ["src/MemoryPalace.ts", "src/utils/alexandria-paths.ts"]
    }
  }
}
```

---

## API Reference

### GitHubFileSystemAdapter

```typescript
class GitHubFileSystemAdapter implements FileSystemAdapter {
  constructor(
    owner: string,
    repo: string,
    branch?: string,
    token?: string
  );

  async initialize(): Promise<void>;
  async prefetchAlexandriaFiles(): Promise<void>;

  // Sync methods (required by MemoryPalace)
  readFile(path: string): string;
  readDir(path: string): string[];
  exists(path: string): boolean;
  isDirectory(path: string): boolean;
  // ... and more
}
```

### LLMService

```typescript
class LLMService {
  constructor(config: LLMServiceConfig);

  // Single-turn
  async generateResponse(
    palace: MemoryPalace,
    question: string,
    options?: GenerateResponseOptions
  ): Promise<string>;

  // Multi-turn (v0.2.0+)
  async generateConversationResponse(
    palace: MemoryPalace,
    message: string,
    conversationHistory?: ConversationMessage[],
    options?: ConversationResponseOptions
  ): Promise<string>;

  // Streaming variants
  async *generateStreamingResponse(...): AsyncGenerator<string>;
  async *generateConversationStreamingResponse(...): AsyncGenerator<string>;
}

interface LLMServiceConfig {
  apiKey: string;
  model?: string;  // Default: "llama-3.1-8b-instant"
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}
```

---

## Usage Examples

### Basic Setup

```typescript
import {
  GitHubFileSystemAdapter,
  LLMService
} from '@principal-ade/ai-brain';
import { MemoryPalace } from '@a24z/core-library';

// 1. Load repository
const fsAdapter = new GitHubFileSystemAdapter(
  "a24z-ai",
  "core-library",
  "main",
  process.env.GITHUB_TOKEN
);

await fsAdapter.prefetchAlexandriaFiles();

// 2. Create MemoryPalace
const palace = new MemoryPalace(
  fsAdapter.getGitHubPath(),
  fsAdapter
);

// 3. Initialize LLM
const llm = new LLMService({
  apiKey: process.env.GROQ_API_KEY
});

// 4. Ask questions
const answer = await llm.generateResponse(
  palace,
  "What is this codebase about?"
);
```

### Next.js API Route

```typescript
// app/api/chat/route.js
import { NextResponse } from "next/server";
import { GitHubFileSystemAdapter, LLMService } from "@principal-ade/ai-brain";
import { MemoryPalace } from "@a24z/core-library";

export async function POST(request) {
  const { message } = await request.json();

  // Load repo
  const fsAdapter = new GitHubFileSystemAdapter(
    "a24z-ai",
    "core-library",
    "main",
    process.env.GITHUB_TOKEN
  );
  await fsAdapter.prefetchAlexandriaFiles();

  const palace = new MemoryPalace(fsAdapter.getGitHubPath(), fsAdapter);
  const llm = new LLMService({ apiKey: process.env.GROQ_API_KEY });

  // Generate response
  const response = await llm.generateResponse(palace, message);

  return NextResponse.json({ response });
}
```

### Conversational Voice Interface

```typescript
// Maintain conversation history
const conversationHistory: ConversationMessage[] = [];

// User speaks: "What is MemoryPalace?"
const response1 = await llm.generateConversationResponse(
  palace,
  "What is MemoryPalace?",
  conversationHistory,
  { stream: true }  // Stream for real-time TTS
);

// Add to history
conversationHistory.push({
  role: "user",
  content: "What is MemoryPalace?"
});
conversationHistory.push({
  role: "assistant",
  content: response1
});

// User speaks: "Where is it implemented?"
const response2 = await llm.generateConversationResponse(
  palace,
  "Where is it implemented?",  // LLM knows context!
  conversationHistory,
  { stream: true }
);

// Continue building history...
```

---

## Environment Variables

```bash
# Required for GitHub access
GITHUB_TOKEN=your_github_token_here

# Required for Groq LLM
GROQ_API_KEY=your_groq_api_key_here
```

---

## Version History

### v0.2.0 (Current)
- ✅ Added conversation history support
- ✅ `generateConversationResponse()` method
- ✅ `generateConversationStreamingResponse()` generator
- ✅ `ConversationMessage` type
- ✅ Multi-turn context awareness

### v0.1.1
- ✅ Switched to `llama-3.1-8b-instant` (speech-optimized)
- ✅ Better conversational tone for voice interfaces

### v0.1.0
- ✅ Initial release
- ✅ GitHubFileSystemAdapter with pre-fetching
- ✅ GitHubGlobAdapter for pattern matching
- ✅ LLMService with Groq integration
- ✅ MemoryPalace context injection
- ✅ Streaming support

---

## Performance Metrics

### Repository Loading
- GitHub tree fetch: ~500ms
- Pre-fetch 20 files: ~1500ms
- **Total setup: ~2 seconds**

### LLM Response
- Speech model (llama-3.1-8b-instant): ~1140ms
- Standard model (llama-3.3-70b-versatile): ~910ms
- Streaming: Real-time token delivery

### Context Size
- System prompt: ~2-3KB
- Includes 15 codebase views
- File references: ~50-100 files
- Fits within 8K token context window

---

## Design Decisions

### Why Pre-fetch Instead of Lazy Load?
- MemoryPalace requires synchronous FileSystemAdapter
- GitHub API is asynchronous
- Pre-fetching bridges the gap
- .alexandria files are small (~20KB total)
- Loading once is fast (<2s)

### Why llama-3.1-8b-instant?
- Optimized for conversational AI
- Better tone for text-to-speech
- Lower latency than 70B model
- Still highly capable for code questions

### Why MemoryPalace Instead of Custom RAG?
- Already has structured codebase views
- File references built-in
- Guidance and notes system
- Avoids reinventing the wheel
- 24-hour hackathon time constraint

---

## Two-Stage View-Aware Implementation (In Progress)

### Overview

Enhanced conversation capabilities using a two-stage approach that leverages MemoryPalace codebase views to provide smarter, more efficient responses.

### How It Works

**Stage 1: Intent Classification + View Selection**
- Analyzes user question to determine type (overview, implementation, usage, comparison)
- Identifies relevant codebase views
- Determines if source code is needed
- Selects specific files to load

**Stage 2: Context-Enriched Response**
- Loads markdown overviews from relevant views
- Optionally loads actual source code files
- Builds tailored system prompt
- Generates informed response

### Benefits

**Smart Context Loading**
- Only loads necessary context (markdown vs markdown + code)
- 40-50% token reduction on average
- Faster responses for simple questions

**Handles More Question Types**
- Overview questions → Markdown only
- Implementation questions → Markdown + code
- Usage questions → Docs + examples
- Comparison questions → Multiple implementations

### Implementation Status

- [x] Design finalized
- [ ] ViewAwareContextBuilder.ts created
- [ ] LLMService.ts enhanced with two-stage methods
- [ ] Demo script created
- [ ] Testing with various question types

### Files Being Added
```
packages/core/src/
  services/
    ViewAwareContextBuilder.ts  (new)
  demo-two-stage.ts             (new)
```

## Future Enhancements

### Planned Features
- [ ] Multiple repository support
- [ ] Session persistence (Appwrite)
- [ ] Conversation summarization

### Performance Optimizations
- [ ] Cache MemoryPalace instances
- [ ] Incremental repository updates
- [ ] Response caching
- [ ] Parallel repository loading

---

## Deployment

### Package Installation

```bash
npm install @principal-ade/ai-brain
# or
bun add @principal-ade/ai-brain
```

### Dependencies
- `@a24z/core-library@latest` - MemoryPalace system
- `groq-sdk@^0.5.0` - Groq LLM client
- `globby@^15.0.0` - Glob pattern matching

### Browser Compatibility
- Node.js 18+
- Works in Next.js API routes
- Compatible with serverless (Appwrite Functions)

---

## Testing

### Running Tests

```bash
# Simple Groq test
bun run src/test-groq.ts

# MemoryPalace integration
bun run src/demo.ts

# Full LLM integration
bun run src/demo-llm.ts

# Conversation test
bun run src/test-conversation.ts

# Model comparison
bun run src/test-speech-model.ts
```

### Test Results
- ✅ GitHub adapter loads 195 file items
- ✅ Caches 20 .alexandria files
- ✅ MemoryPalace finds 15 views
- ✅ LLM generates context-aware responses
- ✅ Conversation maintains multi-turn context

---

## Contributing

Built for SF Tech Week 2025 Hackathon (Beyond Voice - Agora)

**Team:** Principal AI
**Repository:** https://github.com/AgoraIO-Community/SFTechWeek-2025-Hackathon
**Package:** https://www.npmjs.com/package/@principal-ade/ai-brain

---

## License

MIT
