# Quick Setup Guide

Follow these steps to get Luna AI Todo Assistant running on your machine.

## 1. Prerequisites

Make sure you have:
- Python 3.10+ installed
- pip or uv package manager
- A modern web browser (Chrome, Firefox, Safari, Edge)

## 2. API Keys Setup

You'll need to sign up for the following services and obtain API keys:

### Required Services:

1. **Appwrite** (Database)
   - Sign up: https://cloud.appwrite.io
   - Create a new project
   - Create a database with two collections (todos and reminders)
   - Get: Project ID, API Key, Database ID, Collection IDs

2. **Groq** (LLM)
   - Sign up: https://console.groq.com
   - Create an API key
   - Get: API Key

3. **Agora** (Voice/Video)
   - Sign up: https://console.agora.io
   - Create a project
   - Get: App ID, App Certificate, API Key, API Secret

### Optional Services (for enhanced features):

4. **ElevenLabs** (Text-to-Speech)
   - Sign up: https://elevenlabs.io
   - Create an API key
   - Get: API Key, Voice ID

5. **HeyGen** (Video Avatar)
   - Sign up: https://app.heygen.com
   - Create an API key
   - Get: API Key, Avatar ID

## 3. Installation

### Step 1: Navigate to project directory
```bash
cd /path/to/SFTechWeek-2025-Hackathon/submissions/hjlees/src
```

### Step 2: Install dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Configure environment variables
```bash
# Copy the example file
cp env.example .env

# Edit .env with your API keys
nano .env  # or use your preferred editor
```

Fill in at minimum these required fields:
```env
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_TODOS_COLLECTION_ID=your-todos-collection-id
APPWRITE_REMINDERS_COLLECTION_ID=your-reminders-collection-id
GROQ_API_KEY=your-groq-api-key
AGORA_APP_ID=your-app-id
AGORA_APP_CERTIFICATE=your-app-certificate
```

## 4. Appwrite Database Setup

### Create Todos Collection:

1. Go to your Appwrite console
2. Open your database
3. Create a new collection named "todos"
4. Add the following attributes:

| Attribute | Type | Required | Default |
|-----------|------|----------|---------|
| title | String | Yes | - |
| description | String | No | - |
| completed | Boolean | No | false |
| priority | String | No | "medium" |
| due_date | DateTime | No | - |
| created_at | DateTime | No | now() |
| updated_at | DateTime | No | now() |

### Create Reminders Collection:

1. Create a new collection named "reminders"
2. Add the following attributes:

| Attribute | Type | Required | Default |
|-----------|------|----------|---------|
| reminder_text | String | Yes | - |
| importance | String | No | "medium" |
| reminder_date | DateTime | No | - |
| created_at | DateTime | No | now() |
| updated_at | DateTime | No | now() |

### Set Permissions:

For both collections, set these permissions:
- Read: Any
- Create: Any
- Update: Any
- Delete: Any

(In production, you would restrict these appropriately)

## 5. Run the Application

```bash
python app.py
```

The application will start on `http://localhost:5000`

Open your browser and navigate to:
```
http://localhost:5000
```

## 6. First Steps

1. **Test Text Chat:**
   - The chat interface loads by default
   - Try: "Create a todo to buy milk"
   - Try: "Show me my todos"

2. **Test Voice Chat:**
   - **Important:** Use Chrome, Edge, or Safari (best speech recognition support)
   - Click "Voice Chat" in the sidebar
   - Enter a channel name (e.g., "my-room")
   - Click "Start Voice Chat"
   - **Allow microphone permissions** when prompted
   - You should hear Luna's greeting immediately
   - Wait for "Listening..." status
   - Speak naturally: "Create a todo to buy groceries"
   - Luna will respond with voice!
   - Watch the status: Listening → Processing → Speaking → Listening

3. **Test Video Avatar (if configured):**
   - Click "Video Avatar" in the sidebar
   - Click "Start Avatar Session"
   - Type a message for the avatar

## 7. Troubleshooting

### Issue: "Configuration error"
**Solution:** Check that all required environment variables in `.env` are filled in correctly.

### Issue: Database errors
**Solution:** 
- Verify your Appwrite credentials
- Ensure collections are created with the exact attribute names
- Check that your API key has proper permissions

### Issue: Voice chat not working
**Solution:**
- Use Chrome, Edge, or Safari (Firefox has limited speech recognition support)
- Check browser microphone permissions (should prompt on first use)
- Verify Agora credentials (AGORA_APP_ID in .env)
- Check browser console (F12) for errors
- Make sure you hear the greeting when connecting
- Wait for "Listening..." status before speaking

### Issue: Module not found
**Solution:**
```bash
pip install -r requirements.txt --force-reinstall
```

## 8. Testing the APIs

You can test the API endpoints using curl or Postman:

### Test Chat:
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a todo to test the API"}'
```

### Test Health:
```bash
curl http://localhost:5000/health
```

### Test Get Todos:
```bash
curl http://localhost:5000/api/todos
```

## 9. Development Mode

The app runs in development mode by default with:
- Debug mode enabled
- Auto-reload on file changes
- Detailed error messages

To run in production:
1. Set `FLASK_ENV=production` in `.env`
2. Use a production WSGI server like Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn app:app
   ```

## 10. Next Steps

- Customize the AI agent's system prompt in `ai_agent.py`
- Add authentication for production use
- Customize the UI in `templates/index.html`
- Add more features to the AI agent
- Deploy to a cloud platform

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review the API documentation in README.md
- Check the browser console for JavaScript errors
- Check the terminal for Python errors

---

Happy coding! 🚀

