# Voice-Powered Principal Engineer AI - Project Plan

## Project Overview
A real-time voice interface that allows developers to have natural conversations with an AI Principal Engineer about their codebase. Users enter a GitHub URL, and the system loads the codebase documentation (via MemoryPalace) to power intelligent, context-aware engineering guidance.

## Current Status Summary

**Project Stage:** Integration Testing & UX Development

**Completed Work:**
- Core NPM package (@principal-ade/ai-brain v0.2.0) published
- GitHub adapters for .alexandria/ directory fetching
- MemoryPalace integration for structured codebase context
- Groq LLM service with conversation history (llama-3.1-8b-instant)
- Next.js frontend with all partner SDKs installed
- Test pages for Agora, HeyGen, ElevenLabs, and LLM

**Current Focus:**
- Testing individual SDK integrations
- Verifying voice pipeline components
- Planning main application UI

**Next Phase:**
- Build cohesive user experience
- Connect all components into conversation flow
- Deploy to production

## Agora Conversational AI Engine
- **Purpose:** Real-time voice communication between user and AI
- **Implementation:**
  - Capture user's voice questions about the codebase
  - Stream audio responses back to user
  - Low-latency voice transmission for natural conversation flow

## Groq LLM
- **Purpose:** Generate intelligent Principal Engineer responses
- **Implementation:**
  - Process codebase documentation context
  - Analyze user questions about architecture, patterns, decisions
  - Generate expert-level engineering guidance
  - Ultra-fast inference for real-time responses

## ElevenLabs TTS
- **Purpose:** Convert AI responses to natural speech
- **Implementation:**
  - Convert Groq's text responses to professional voice
  - Use voice that sounds like a senior engineer (clear, authoritative, friendly)
  - Expressive speech with natural intonation

## HeyGen Streaming Avatar API
- **Purpose:** Visual representation of the Principal Engineer
- **Implementation:**
  - Display photorealistic avatar that lip-syncs with ElevenLabs audio
  - Avatar reacts naturally to conversation
  - Creates immersive pair-programming experience

## Appwrite
- **Purpose:** Full-stack deployment platform
- **Implementation:**
  - Frontend hosting (React/Next.js web app)
  - Backend functions for GitHub integration
  - Database to store:
    - Codebase metadata
    - Conversation history
    - User sessions
  - Authentication for teams/users

## Phase 1: Core Infrastructure ✅ COMPLETE
- [x] Set up Next.js project with React 19
- [x] Create basic web interface
- [x] Integrate Agora SDK (v4.24.0) for voice I/O
- [x] Set up HeyGen SDK (v2.1.0) for avatar display
- [x] Add ElevenLabs TTS to dependencies
- [x] Theme system integration (@a24z/industry-theme)
- [x] Create test pages for each integration

## Phase 2: GitHub & MemoryPalace Integration ✅ COMPLETE
- [x] Build @principal-ade/ai-brain NPM package
- [x] Create GitHubFileSystemAdapter for fetching repos
- [x] Create GitHubGlobAdapter for glob pattern matching
- [x] Integrate MemoryPalace (@a24z/core-library)
- [x] Implement codebase context loader
- [x] Parse .alexandria/ directory structure
- [x] Access views, notes, and guidance documents
- [x] Publish package to npm (v0.2.0)

## Phase 3: AI Integration ✅ COMPLETE
- [x] Integrate Groq LLM API (llama-3.1-8b-instant)
- [x] Build LLMService with context injection
- [x] Implement system prompt builder with MemoryPalace context
- [x] Create Principal Engineer prompt template
- [x] Add conversation history support
- [x] Implement streaming & non-streaming responses
- [x] Test with sample repositories

## Phase 4: Integration Testing 🔄 IN PROGRESS
- [x] Create individual test pages for each service
- [ ] Test Agora voice I/O integration
- [ ] Test HeyGen avatar rendering
- [ ] Test ElevenLabs TTS
- [ ] Test LLM conversation flow end-to-end
- [ ] Verify voice pipeline: Agora → LLM → ElevenLabs → HeyGen

## Phase 5: User Experience (NEXT)
- [ ] Design main application UI
- [ ] Build GitHub URL input interface
- [ ] Create conversation interface
- [ ] Integrate all components into cohesive flow
- [ ] Add conversation features (reset, context switching)
- [ ] Polish avatar and voice settings

## Phase 6: Deployment & Demo (PLANNED)
- [ ] Deploy to production hosting
- [ ] Configure production environment variables
- [ ] Test with multiple example repositories
- [ ] Create demo video
- [ ] Final documentation updates

## User Flow

1. User lands on web app (hosted on Appwrite)
2. User enters GitHub repository URL
3. System fetches and parses codebase documentation
4. Principal Engineer avatar appears
5. User clicks "Start Conversation"
6. User asks voice questions about the codebase:
   - "What's the architecture of this project?"
   - "Why did they choose this pattern?"
   - "How should I add a new feature to X?"
7. Avatar responds with voice + lip-sync
8. Natural back-and-forth conversation continues

## Documentation Standard Support

The system leverages the **MemoryPalace** pattern from @a24z/core-library:

### .alexandria/ Directory Structure
Repositories should contain a `.alexandria/` directory with:

- **views/** - Codebase views (architecture, components, flows)
  - Each view is a markdown file with structured sections
  - Contains file references via reference groups
  - Provides high-level understanding of code areas

- **notes/** - Development notes and decisions
  - Contextual insights about implementations
  - Rationale for architectural choices
  - Known issues and gotchas

- **guidance/** - Repository-wide guidance
  - Development standards
  - Best practices
  - Setup instructions

### Supported Repositories
The system works best with repositories that have:
- `.alexandria/` directory with views, notes, and guidance
- Structured codebase documentation
- Clear architecture descriptions

### Example Compatible Repositories
- Any repo using the MemoryPalace pattern
- Repos with .alexandria/ directories
- Projects using @a24z/core-library for documentation

## Technical Architecture

```
┌─────────────┐
│   Browser   │
│  (Appwrite) │
└──────┬──────┘
       │
       ├─► Agora SDK (Voice I/O)
       │
       ├─► HeyGen Avatar (Visual)
       │
       └─► Backend Functions
           │
           ├─► GitHub API (Fetch repo)
           ├─► Groq LLM (Generate responses)
           ├─► ElevenLabs TTS (Text → Speech)
           └─► Appwrite DB (Store context)
```

## Demo Video Outline (1-2 minutes)

1. **Intro (15s):** Problem statement - understanding codebases is hard
2. **Demo (60s):**
   - Enter GitHub URL
   - Avatar appears
   - Ask 2-3 voice questions with natural responses
   - Show conversation flow
3. **Tech Stack (20s):** Highlight all 5 partner technologies
4. **Outro (10s):** Impact - making codebase knowledge accessible

## Technical Innovation ✓
- Novel application of voice AI to code education
- Real-time codebase context injection
- Multi-modal interaction (voice + visual avatar)

## Experience Design ✓
- Natural conversation flow (feels like talking to a real engineer)
- Visual avatar creates engaging experience
- Immediate feedback loop

## Integration & Use of Partner Tech ✓
- All 5 technologies integrated meaningfully
- Each serves a clear purpose in the experience
- Technologies work together seamlessly

## Deployment & Documentation ✓
- Live deployment on Appwrite
- Clear README with setup instructions
- Demo video showcasing features

## Risk: GitHub API rate limits
**Mitigation:** Cache repository data in Appwrite DB, use authenticated requests

## Risk: Avatar/voice latency
**Mitigation:** Optimize pipeline, pre-load avatar, use Groq's fast inference

## Risk: Context too large for LLM
**Mitigation:** Chunk documentation, use retrieval strategy, focus on key files

## Risk: Integration complexity
**Mitigation:** Start with simple pipeline, test each component independently

## Success Metrics

**Completed:**
- [x] All 5 partner technologies integrated in codebase
- [x] @principal-ade/ai-brain package published (v0.2.0)
- [x] MemoryPalace integration working
- [x] Groq LLM generating context-aware responses
- [x] Test pages created for all integrations

**In Progress:**
- [ ] Individual component testing (Agora, HeyGen, ElevenLabs)
- [ ] End-to-end voice pipeline validation
- [ ] Voice conversation latency optimization (<2s target)

**Planned:**
- [ ] Main application UI complete
- [ ] Avatar lip-sync integrated and believable
- [ ] Deployed and accessible publicly
- [ ] Demo video completed

## Current State & Next Steps

### What We've Built
1. **Core Package (@principal-ade/ai-brain)**
   - Fully functional GitHub adapters
   - MemoryPalace integration complete
   - LLM service with conversation history
   - Published and ready to use

2. **Frontend Foundation**
   - Next.js app with all dependencies
   - Test pages for each service
   - Theme system integrated

### What's Next
1. **Immediate (Current Focus):**
   - Complete integration testing of all SDKs
   - Verify each component works individually
   - Document any API issues or workarounds

2. **Next Priority:**
   - Design and build main application UI
   - Connect all components into conversation flow
   - Implement session management

3. **Final Steps:**
   - Deploy to production
   - Create demo video
   - Final polish and testing

---

## Notes & Resources

- GitHub API docs: https://docs.github.com/en/rest
- Agora Conversational AI: [add link]
- Groq API: [add link]
- ElevenLabs: [add link]
- HeyGen Streaming Avatar: [add link]
- Appwrite: [add link]
