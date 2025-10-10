# Luna AI Todo Assistant

**SF Tech Week 2025 Hackathon Submission**

An intelligent todo management application powered by AI, featuring natural language processing, voice interaction, and real-time communication capabilities.

---

## 🎯 Overview

Luna AI Todo Assistant is a modern task management application that combines conversational AI with voice and video capabilities. Unlike traditional todo apps, Luna understands natural language, allowing users to manage their tasks through intuitive conversation rather than rigid commands.

**Key Features:**
- 🤖 **AI-Powered Chat** - Natural language todo management using Groq LLM
- 🎤 **Voice Chat** - Real-time voice conversations using Agora RTC
- 🎬 **Video Avatar** - Interactive video avatar using HeyGen
- 💾 **Cloud Database** - Persistent storage with Appwrite
- 🔊 **Text-to-Speech** - Natural voice responses with ElevenLabs
- 📱 **Responsive UI** - Modern, mobile-friendly interface

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Modern web browser (Chrome, Firefox, Safari, Edge)
- API keys for: Appwrite, Groq, Agora

### Installation

1. **Navigate to the source directory:**
   ```bash
   cd submissions/hjlees/src
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

4. **Run the application:**
   ```bash
   python app.py
   ```

5. **Open in browser:**
   ```
   http://localhost:5000
   ```

For detailed setup instructions, see [docs/SETUP.md](docs/SETUP.md)

---

## ✨ Features

### 1. **Intelligent Chat Interface**
- Natural language processing for todo operations
- Context-aware conversations
- AI function calling with Groq LLM
- Voice responses with ElevenLabs TTS
- Real-time updates

**Example conversations:**
```
User: "Create a high priority todo to prepare my presentation by tomorrow"
Luna: "I've created a high priority todo for you to prepare your presentation, 
       due tomorrow. Good luck with your presentation!"

User: "What do I need to do today?"
Luna: "You have 3 tasks due today: prepare presentation (high priority), 
       review code (medium priority), and buy groceries (low priority)."
```

### 2. **Voice Chat Integration**
- Real-time voice conversation using Agora RTC
- Automatic speech recognition
- Natural voice responses
- Low-latency audio streaming
- Conversational AI agent

**Features:**
- Hands-free todo management
- Natural conversation flow
- Voice activity detection
- Real-time status indicators

### 3. **Video Avatar (HeyGen)**
- Interactive video avatar
- Real-time lip sync
- WebRTC video streaming
- Natural avatar animations

### 4. **Todo Management**
- Create, read, update, delete todos
- Priority levels (high, medium, low)
- Due date support
- Completion tracking
- Title-based operations (no IDs needed)

### 5. **Reminder System**
- Create reminders with natural language
- Importance levels
- Date/time scheduling
- List and manage reminders

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- HTML5, CSS3, Bootstrap 5
- Vanilla JavaScript (ES6+)
- Agora Web SDK
- WebRTC API

**Backend:**
- Python 3.10+
- Flask web framework
- Pydantic for data validation
- python-dotenv for configuration

**External Services:**
- **Groq** - Fast LLM inference for AI conversations
- **Appwrite** - Cloud database (BaaS)
- **ElevenLabs** - High-quality text-to-speech
- **Agora** - Real-time voice/video communication
- **HeyGen** - Video avatar generation (optional)

### System Components

```
Frontend (HTML/CSS/JS)
    ↓
Flask Application (app.py)
    ├── AI Agent (ai_agent.py) → Groq LLM
    ├── Database (database.py) → Appwrite
    ├── TTS Service (tts_service.py) → ElevenLabs
    ├── Agora Service (agora_service.py) → Agora RTC
    └── HeyGen Service (heygen_service.py) → HeyGen API
```

For detailed architecture, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 📖 Documentation

- **[SETUP.md](docs/SETUP.md)** - Detailed setup instructions
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and design
- **[VOICE_CHAT_GUIDE.md](docs/VOICE_CHAT_GUIDE.md)** - Voice chat implementation guide
- **[WORKING_FEATURES_DEMO.md](docs/WORKING_FEATURES_DEMO.md)** - Demo script and feature showcase
- **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and solutions

---

## 🎥 Demo

Video demonstrations are available:
- `demo.mov` - Application walkthrough
- `demo.mp4.m4v` - Feature showcase

---

## 🔧 API Endpoints

### Chat
- `POST /api/chat` - Send message to AI agent
- `POST /api/chat/reset` - Reset conversation history

### Todos
- `GET /api/todos` - List all todos
- `POST /api/todos` - Create new todo
- `PUT /api/todos/<id>` - Update todo
- `DELETE /api/todos/<id>` - Delete todo

### Reminders
- `GET /api/reminders` - List all reminders
- `POST /api/reminders` - Create reminder
- `PUT /api/reminders/<id>` - Update reminder
- `DELETE /api/reminders/<id>` - Delete reminder

### Voice/Video
- `POST /api/agora/token` - Generate Agora RTC token
- `POST /api/heygen/streaming/new` - Start avatar session
- `POST /api/heygen/streaming/speak` - Make avatar speak
- `POST /api/heygen/streaming/close` - Close avatar session

### TTS
- `POST /api/tts/speak` - Convert text to speech
- `GET /api/tts/stream` - Stream audio response

---

## 🎮 Usage Examples

### Text Chat
```javascript
// Create todo via chat
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Create a todo to buy groceries"
  })
})
```

### Voice Chat
```javascript
// Start voice chat session
const agoraService = new AgoraService(appId);
await agoraService.joinChannel('my-room', token);
// AI agent automatically handles voice interaction
```

### Direct Todo Operations
```javascript
// Create todo directly
fetch('/api/todos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Buy groceries",
    priority: "medium",
    due_date: "2025-10-10"
  })
})
```

---

## 🌟 Highlights

### What Makes Luna Special

1. **Natural Language Understanding**
   - No rigid commands or syntax
   - Understands context and intent
   - Handles variations in phrasing

2. **Multi-Modal Interaction**
   - Text chat
   - Voice conversation
   - Video avatar
   - Choose your preferred interaction method

3. **Intelligent AI Agent**
   - Function calling with Groq LLM
   - Context-aware responses
   - Smart priority detection
   - Due date parsing

4. **Real-Time Capabilities**
   - Instant database synchronization
   - Low-latency voice communication
   - Live status updates

5. **Modern Tech Stack**
   - Latest AI models (Groq)
   - Cloud-native architecture
   - Real-time communication (Agora)
   - High-quality TTS (ElevenLabs)

---

## 🚧 Known Limitations

- No user authentication (demo version)
- Single-user support
- In-memory conversation history
- HeyGen avatar requires additional setup
- Voice chat requires specific browser (Chrome/Edge/Safari recommended)

---

## 🔮 Future Enhancements

### Phase 1
- [ ] User authentication and multi-user support
- [ ] Email notifications for reminders
- [ ] Calendar integration
- [ ] Todo sharing/collaboration

### Phase 2
- [ ] Mobile app (React Native)
- [ ] Smart scheduling with AI
- [ ] Recurring tasks
- [ ] Tags and categories

### Phase 3
- [ ] Team workspaces
- [ ] Advanced analytics
- [ ] Third-party integrations
- [ ] Custom workflows

---

## 🛠️ Development

### Project Structure
```
submissions/hjlees/
├── src/
│   ├── app.py              # Main Flask application
│   ├── ai_agent.py         # AI conversation agent
│   ├── database.py         # Appwrite database client
│   ├── agora_service.py    # Agora RTC integration
│   ├── heygen_service.py   # HeyGen avatar service
│   ├── tts_service.py      # ElevenLabs TTS service
│   ├── config.py           # Configuration management
│   ├── models.py           # Pydantic data models
│   ├── static/             # CSS and JavaScript files
│   └── templates/          # HTML templates
├── docs/                   # Documentation
└── README.md              # This file
```

### Running Tests
```bash
# Test API endpoints
curl http://localhost:5000/health
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Luna"}'
```

### Development Mode
The app runs in debug mode by default:
- Auto-reload on file changes
- Detailed error messages
- Console logging

---

## 📝 Environment Variables

Required variables (in `.env`):
```env
# Appwrite Database
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_TODOS_COLLECTION_ID=your-todos-collection
APPWRITE_REMINDERS_COLLECTION_ID=your-reminders-collection

# AI & LLM
GROQ_API_KEY=your-groq-api-key

# Real-Time Communication
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-certificate

# Optional: Text-to-Speech
ELEVENLABS_API_KEY=your-elevenlabs-key
ELEVENLABS_VOICE_ID=your-voice-id

# Optional: Video Avatar
HEYGEN_API_KEY=your-heygen-key
HEYGEN_AVATAR_ID=your-avatar-id
```

---

## 🤝 Contributing

This is a hackathon submission project. For questions or suggestions:
- Review the documentation in `/docs`
- Check troubleshooting guide for common issues
- Refer to the architecture documentation for system design

---

## 📄 License

This project was created for the SF Tech Week 2025 Hackathon.

---

## 👥 Credits

**Built with:**
- [Groq](https://groq.com) - Fast LLM inference
- [Appwrite](https://appwrite.io) - Backend-as-a-Service
- [Agora](https://www.agora.io) - Real-time engagement platform
- [ElevenLabs](https://elevenlabs.io) - AI voice generation
- [HeyGen](https://heygen.com) - AI video generation
- [Flask](https://flask.palletsprojects.com) - Web framework
- [Bootstrap](https://getbootstrap.com) - UI framework

---

## 📞 Support

For setup help and troubleshooting:
1. Check [docs/SETUP.md](docs/SETUP.md) for installation instructions
2. Review [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues
3. See [docs/WORKING_FEATURES_DEMO.md](docs/WORKING_FEATURES_DEMO.md) for feature demos

---

**Made with ❤️ for SF Tech Week 2025 Hackathon**
