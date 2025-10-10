# Luna - AI Todo Assistant

An intelligent voice-enabled todo management system powered by cutting-edge AI technologies.

## 🚀 Technologies Used

### Core Technologies
- **[Agora Conversational AI Engine](https://docs.agora.io/en/conversational-ai/)**: Real-time voice interaction with AI
- **[Agora RTC SDK](https://docs.agora.io/)**: WebRTC-based real-time communication
- **[Appwrite](https://appwrite.io/docs)**: Backend-as-a-Service for database and authentication
- **[ElevenLabs TTS](https://elevenlabs.io/docs/)**: High-quality text-to-speech synthesis
- **[Groq](https://console.groq.com/docs)**: Fast LLM inference for AI agent
- **[HeyGen Video Avatar](https://docs.heygen.com/)**: Interactive video avatar generation

### Framework
- **Flask**: Python web framework for API and web server
- **Bootstrap 5**: Modern, responsive UI components

## ✨ Features

### 1. **Text Chat Interface**
- Natural language conversation with Luna AI assistant
- Create, update, and manage todos through chat
- Set reminders and organize tasks
- Powered by Groq's fast LLM inference

### 2. **Voice Chat**
- Real-time voice conversation using Web Speech API + Groq AI
- **Barge-in support** - Interrupt Luna anytime while she's speaking
- Hands-free todo management
- Natural speech recognition (browser-based)
- High-quality voice synthesis (ElevenLabs or browser fallback)
- Works in Chrome, Edge, and Safari

### 3. **Video Avatar** (Optional - Advanced Feature)
- Interactive video avatar powered by HeyGen
- **Note:** Requires HeyGen Enterprise account with Streaming API access
- **Alternative:** Use Voice Chat for full AI interaction without video
- Visual feedback from AI assistant
- Lifelike avatar responses
- WebRTC streaming for real-time interaction

### 4. **Todo Management**
- Create todos with priorities (low, medium, high, urgent)
- Set due dates and descriptions
- Mark todos as complete
- Filter by status (all, active, completed)

### 5. **Reminders**
- Create time-based reminders
- Set importance levels
- View all reminders in one place

## 🛠️ Setup Instructions

### Prerequisites

- Python 3.10 or higher
- pip or uv package manager
- **Required** accounts for core features:
  - Appwrite Cloud (Database)
  - Groq API (AI Agent)
  - Agora.io (Voice Chat)
- **Optional** accounts for enhanced features:
  - ElevenLabs API (High-quality TTS - has free fallback)
  - HeyGen API (Video Avatar - requires Enterprise account)

### Installation

1. **Clone the repository**
   ```bash
   cd /path/to/SFTechWeek-2025-Hackathon/submissions/hjlees/src
   ```

2. **Install dependencies**
   
   Using pip:
   ```bash
   pip install -r requirements.txt
   ```
   
   Or using uv:
   ```bash
   uv pip install -r requirements.txt
   ```

3. **Set up Appwrite Database**

   a. Create a new project in [Appwrite Cloud](https://cloud.appwrite.io)
   
   b. Create a new database
   
   c. Create two collections:
   
   **Todos Collection** with attributes:
   - `title` (String, required)
   - `description` (String, optional)
   - `completed` (Boolean, default: false)
   - `priority` (String, default: "medium")
   - `due_date` (DateTime, optional)
   - `created_at` (DateTime, auto-generated)
   - `updated_at` (DateTime, auto-generated)
   
   **Reminders Collection** with attributes:
   - `reminder_text` (String, required)
   - `importance` (String, default: "medium")
   - `reminder_date` (DateTime, optional)
   - `created_at` (DateTime, auto-generated)
   - `updated_at` (DateTime, auto-generated)

4. **Configure Environment Variables**

   Copy the example file and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```env
   # Flask Configuration
   FLASK_SECRET_KEY=your-secret-key-here
   FLASK_ENV=development
   
   # Appwrite Configuration
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=your-project-id
   APPWRITE_API_KEY=your-api-key
   APPWRITE_DATABASE_ID=your-database-id
   APPWRITE_TODOS_COLLECTION_ID=your-todos-collection-id
   APPWRITE_REMINDERS_COLLECTION_ID=your-reminders-collection-id
   
   # Groq Configuration
   GROQ_API_KEY=your-groq-api-key
   
   # ElevenLabs Configuration
   ELEVENLABS_API_KEY=your-elevenlabs-api-key
   ELEVENLABS_VOICE_ID=your-voice-id
   
   # Agora Configuration
   AGORA_APP_ID=your-app-id
   AGORA_APP_CERTIFICATE=your-app-certificate
   AGORA_API_KEY=your-agora-api-key
   AGORA_API_SECRET=your-agora-api-secret
   
   # HeyGen Configuration
   HEYGEN_API_KEY=your-heygen-api-key
   HEYGEN_AVATAR_ID=your-avatar-id
   ```

5. **Run the application**
   ```bash
   python app.py
   ```
   
   The application will be available at `http://localhost:5000`

## 📖 API Documentation

### Chat Endpoints

#### POST `/api/chat`
Send a message to the AI agent.

**Request:**
```json
{
  "message": "Create a todo to buy groceries",
  "session_id": "optional-session-id"
}
```

**Response:**
```json
{
  "response": "I've created a todo for buying groceries...",
  "session_id": "session-id",
  "timestamp": "2025-10-07T12:00:00"
}
```

#### POST `/api/chat/reset`
Reset the conversation history.

### Todo Endpoints

#### GET `/api/todos`
Get all todos. Optional query parameter: `completed` (true/false)

#### GET `/api/todos/<todo_id>`
Get a specific todo by ID.

### Reminder Endpoints

#### GET `/api/reminders`
Get all reminders.

### Text-to-Speech Endpoints

#### POST `/api/tts`
Convert text to speech.

**Request:**
```json
{
  "text": "Hello, this is Luna",
  "voice_id": "optional-voice-id",
  "stream": false
}
```

**Response:** Audio data (audio/mpeg)

#### GET `/api/tts/voices`
Get available TTS voices.

### Agora RTC Endpoints

#### POST `/api/agora/token`
Generate an Agora RTC token.

**Request:**
```json
{
  "channel_name": "my-channel",
  "uid": 0,
  "role": 1
}
```

#### POST `/api/agora/conversational-ai/start`
Start a conversational AI agent in a channel.

#### POST `/api/agora/conversational-ai/stop`
Stop a conversational AI agent.

### HeyGen Avatar Endpoints

#### GET `/api/heygen/avatars`
Get available avatars.

#### POST `/api/heygen/video/create`
Create a video with an avatar.

#### POST `/api/heygen/streaming/start`
Start a streaming avatar session.

#### POST `/api/heygen/streaming/speak`
Make the streaming avatar speak.

#### POST `/api/heygen/streaming/stop`
Stop a streaming avatar session.

## 🎯 Usage Examples

### Creating a Todo via Chat
```
You: "Create a todo to buy groceries with high priority"
Luna: "I've created a high-priority todo: Buy groceries. It's due today."
```

### Setting a Reminder
```
You: "Remind me to call John tomorrow at 3pm"
Luna: "I've set a reminder for tomorrow at 3pm to call John."
```

### Voice Chat
1. Click on "Voice Chat" in the sidebar
2. Enter a channel name
3. Click "Start Voice Chat"
4. Speak naturally to Luna
5. She will respond with voice

### Video Avatar
1. Click on "Video Avatar" in the sidebar
2. Click "Start Avatar Session"
3. Type messages for the avatar to speak
4. The avatar will respond with video and audio

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│  (HTML/JS/CSS)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Flask Server   │
│   (app.py)      │
└────────┬────────┘
         │
         ├─→ AI Agent (Groq)
         ├─→ Database (Appwrite)
         ├─→ TTS (ElevenLabs)
         ├─→ RTC (Agora)
         └─→ Avatar (HeyGen)
```

## 🔧 Configuration

### Groq Model
Default model: `llama-3.3-70b-versatile`

You can change it in `config.py`:
```python
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
```

### ElevenLabs Voice
Default voice: Rachel (21m00Tcm4TlvDq8ikWAM)

You can use different voices by changing the `ELEVENLABS_VOICE_ID` in `.env`.

### Agora Settings
- Default role: Publisher (1)
- Token expiration: 3600 seconds (1 hour)

## 🐛 Troubleshooting

### Common Issues

1. **"Configuration error: Missing required configuration"**
   - Ensure all required environment variables are set in `.env`
   - Check that your API keys are valid

2. **Database connection errors**
   - Verify your Appwrite credentials
   - Ensure collections are created with correct IDs
   - Check that your API key has proper permissions

3. **Voice chat not connecting**
   - Verify Agora credentials
   - Check browser microphone permissions
   - Ensure HTTPS is enabled (required for WebRTC)

4. **Avatar not loading**
   - Check HeyGen API key validity
   - Verify avatar ID exists
   - Check browser console for WebRTC errors

## 📝 Development

### Project Structure
```
src/
├── app.py                 # Main Flask application
├── config.py              # Configuration management
├── models.py              # Data models (Pydantic)
├── database.py            # Appwrite client
├── ai_agent.py            # Groq-powered AI agent
├── tts_service.py         # ElevenLabs TTS
├── agora_service.py       # Agora RTC & Conversational AI
├── heygen_service.py      # HeyGen video avatar
├── requirements.txt       # Python dependencies
├── pyproject.toml         # Project metadata
├── templates/
│   └── index.html         # Main HTML template
└── static/
    ├── css/
    │   └── style.css      # Stylesheets
    └── js/
        ├── app.js         # Main JavaScript
        ├── agora.js       # Agora integration
        └── avatar.js      # HeyGen integration
```

### Adding New Features

1. **Add a new database model**: Update `models.py` and `database.py`
2. **Add a new API endpoint**: Add route in `app.py`
3. **Add UI component**: Update `index.html` and `style.css`
4. **Add client-side logic**: Update or create new JS file in `static/js/`

## 🤝 Contributing

This project was created for the SF Tech Week 2025 Hackathon. Contributions and improvements are welcome!

## 📄 License

This project is created for educational and demonstration purposes.

## 🙏 Acknowledgments

- **Agora** for providing real-time communication infrastructure
- **Appwrite** for the backend-as-a-service platform
- **ElevenLabs** for high-quality text-to-speech
- **Groq** for fast LLM inference
- **HeyGen** for video avatar technology

## 📧 Support

For questions or issues, please refer to the official documentation:
- [Agora Documentation](https://docs.agora.io/)
- [Appwrite Documentation](https://appwrite.io/docs)
- [ElevenLabs Documentation](https://elevenlabs.io/docs/)
- [Groq Documentation](https://console.groq.com/docs)
- [HeyGen Documentation](https://docs.heygen.com/)

---

Built with ❤️ for SF Tech Week 2025 Hackathon

