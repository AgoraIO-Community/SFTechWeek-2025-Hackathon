# Luna AI Todo Assistant - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   HTML/CSS   │  │  JavaScript  │  │  Bootstrap   │         │
│  │  Templates   │  │  (App Logic) │  │   (UI/UX)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/WebSocket
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Flask Application Layer                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                        app.py                             │  │
│  │              (Routes, Request Handling)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              ┌─────────────┼──────────────┐
              │             │              │
              ↓             ↓              ↓
┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐
│   AI Agent       │  │   Database   │  │  External APIs   │
│  (ai_agent.py)   │  │ (database.py)│  │  - Agora RTC     │
│                  │  │              │  │  - ElevenLabs    │
│  ┌────────────┐  │  │  ┌────────┐  │  │  - HeyGen        │
│  │ Groq LLM   │  │  │  │Appwrite│  │  │                  │
│  │  (Tools)   │  │  │  │  Cloud │  │  └──────────────────┘
│  └────────────┘  │  │  └────────┘  │
└──────────────────┘  └──────────────┘
```

## Component Breakdown

### 1. Frontend Components

#### HTML Templates (`templates/`)
- **index.html**: Main application interface
  - Chat interface
  - Todo list view
  - Reminders view
  - Voice chat interface
  - Video avatar interface

#### CSS Styles (`static/css/`)
- **style.css**: Custom styling
  - Responsive design
  - Dark mode sidebar
  - Chat bubbles
  - Card layouts
  - Animations

#### JavaScript Modules (`static/js/`)
- **app.js**: Core application logic
  - Tab management
  - Chat functionality
  - Todo/reminder rendering
  - API communication

- **agora.js**: Agora RTC integration
  - Voice chat setup
  - WebRTC connection management
  - Conversational AI integration
  - Audio/video track handling

- **avatar.js**: HeyGen video avatar
  - Streaming avatar session management
  - WebRTC for video streaming
  - Real-time avatar control

### 2. Backend Components

#### Core Application (`app.py`)
Flask web server with REST API endpoints:
- Chat endpoints (`/api/chat`, `/api/chat/reset`)
- Todo endpoints (`/api/todos/*`)
- Reminder endpoints (`/api/reminders/*`)
- TTS endpoints (`/api/tts/*`)
- Agora endpoints (`/api/agora/*`)
- HeyGen endpoints (`/api/heygen/*`)

#### Configuration (`config.py`)
- Environment variable management
- API key storage
- Application settings
- Configuration validation

#### Data Models (`models.py`)
Pydantic models for data validation:
- `Todo`: Todo item structure
- `Reminder`: Reminder structure
- `TodoPriority`: Priority enum
- `ReminderImportance`: Importance enum
- `ConversationMessage`: Chat message structure
- `AgoraToken`: RTC token structure

#### Database Layer (`database.py`)
Appwrite client wrapper:
- `AppwriteClient`: Main database client
  - CRUD operations for todos
  - CRUD operations for reminders
  - Document conversion utilities
  - Error handling

#### AI Agent (`ai_agent.py`)
Groq-powered conversational agent:
- `TodoAgent`: Main agent class
  - Natural language processing
  - Tool/function calling
  - Conversation management
  - Todo/reminder operations
  - Context awareness

#### TTS Service (`tts_service.py`)
ElevenLabs text-to-speech:
- `TTSService`: TTS client
  - Text-to-speech generation
  - Streaming audio
  - Voice management
  - Quality settings

#### Agora Service (`agora_service.py`)
Real-time communication:
- `AgoraService`: Main Agora client
  - RTC token generation
  - Conversational AI control
  - Channel management
  - Cloud recording

- `ConversationalAIAgent`: Agent wrapper
  - AI agent lifecycle
  - Message handling
  - Session management

#### HeyGen Service (`heygen_service.py`)
Video avatar generation:
- `HeyGenService`: HeyGen API client
  - Video generation
  - Streaming avatars
  - Avatar listing
  - WebRTC setup

- `StreamingAvatarSession`: Session wrapper
  - Real-time avatar control
  - Video streaming
  - ICE server management

## Data Flow

### 1. Text Chat Flow

```
User Input → Frontend (app.js)
    ↓
HTTP POST to /api/chat
    ↓
Flask Route Handler
    ↓
AI Agent (agent.process_message)
    ↓
Groq LLM with Tools
    ↓
Tool Execution (create_todo, etc.)
    ↓
Database Operations (Appwrite)
    ↓
Response Generation
    ↓
JSON Response → Frontend
    ↓
UI Update
```

### 2. Voice Chat Flow

```
User Voice → Microphone
    ↓
Agora RTC SDK (Frontend)
    ↓
WebRTC Stream → Agora Network
    ↓
Conversational AI Engine
    ↓
Speech-to-Text (ASR)
    ↓
AI Agent Processing
    ↓
Text-to-Speech (TTS)
    ↓
Audio Stream → Agora Network
    ↓
WebRTC → User Speakers
```

### 3. Video Avatar Flow

```
User Message → Frontend (avatar.js)
    ↓
HTTP POST to /api/heygen/streaming/speak
    ↓
HeyGen API
    ↓
Avatar Animation + TTS
    ↓
WebRTC Video Stream
    ↓
Frontend Video Element
    ↓
Display to User
```

## Technology Stack

### Frontend
- **HTML5**: Structure
- **CSS3**: Styling with animations
- **Bootstrap 5**: UI framework
- **JavaScript (ES6+)**: Client-side logic
- **Agora Web SDK**: RTC functionality
- **WebRTC API**: Real-time communication

### Backend
- **Python 3.10+**: Programming language
- **Flask**: Web framework
- **Pydantic**: Data validation
- **python-dotenv**: Environment management

### External Services
- **Groq**: Fast LLM inference
- **Appwrite**: BaaS for database
- **ElevenLabs**: Text-to-speech
- **Agora**: RTC and Conversational AI
- **HeyGen**: Video avatar generation

## Key Design Decisions

### 1. Separation of Concerns
- Each service (AI, Database, TTS, RTC, Avatar) is isolated in its own module
- Makes testing and maintenance easier
- Allows for easy replacement of services

### 2. Stateless API Design
- Each API request is independent
- Session management via session IDs
- Scalable for multiple users

### 3. Real-time Communication
- WebRTC for low-latency audio/video
- WebSocket for bi-directional communication
- Optimized for voice interaction

### 4. Error Handling
- Try-catch blocks at every API boundary
- Graceful degradation (e.g., chat works without TTS)
- User-friendly error messages

### 5. Responsive Design
- Mobile-first approach
- Adaptive layouts
- Touch-friendly controls

## Security Considerations

### Current Implementation
- API keys stored in environment variables
- No authentication (demo/hackathon version)
- CORS not restricted

### Production Recommendations
1. Add user authentication (OAuth, JWT)
2. Implement rate limiting
3. Add CORS restrictions
4. Use HTTPS for all connections
5. Encrypt sensitive data
6. Add input validation and sanitization
7. Implement proper authorization
8. Add audit logging

## Scalability Considerations

### Current Limitations
- In-memory conversation history
- Single-server deployment
- No caching layer
- No load balancing

### Future Improvements
1. Add Redis for session storage
2. Implement horizontal scaling
3. Add CDN for static assets
4. Use message queues for async tasks
5. Implement database connection pooling
6. Add caching for frequent queries
7. Use container orchestration (Kubernetes)

## Performance Optimization

### Current Optimizations
- Async operations where possible
- Streaming for TTS audio
- WebRTC for low-latency voice
- Efficient database queries

### Future Optimizations
1. Implement lazy loading
2. Add response caching
3. Optimize bundle size
4. Use service workers
5. Implement image optimization
6. Add database indexing

## Testing Strategy

### Recommended Tests
1. **Unit Tests**
   - Individual function testing
   - Service method testing
   - Model validation testing

2. **Integration Tests**
   - API endpoint testing
   - Database operations
   - External service mocking

3. **End-to-End Tests**
   - User flow testing
   - UI interaction testing
   - Voice/video functionality

4. **Performance Tests**
   - Load testing
   - Stress testing
   - Latency measurement

## Deployment

### Development
```bash
python app.py
```

### Production
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Docker (Recommended)
```dockerfile
FROM python:3.10
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

## Monitoring & Logging

### Current Logging
- Console output for errors
- Print statements for debugging

### Production Recommendations
1. Structured logging (JSON)
2. Log aggregation (ELK stack)
3. Application monitoring (New Relic, Datadog)
4. Error tracking (Sentry)
5. Performance monitoring (APM)
6. User analytics

## Future Enhancements

### Phase 1
- [ ] User authentication
- [ ] Multiple user support
- [ ] Todo sharing/collaboration
- [ ] Calendar integration

### Phase 2
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Smart scheduling
- [ ] AI-powered insights

### Phase 3
- [ ] Team workspaces
- [ ] Advanced analytics
- [ ] Custom workflows
- [ ] API for third-party integrations

---

This architecture is designed to be modular, scalable, and maintainable while leveraging cutting-edge AI technologies for an exceptional user experience.

