# Voice Chat Guide

## Features

### 🎤 Barge-In Support (NEW!)
You can **interrupt Luna while she's speaking** - just start talking and she'll immediately stop and listen to you. No need to wait for her to finish!

## How It Works

Luna's voice chat uses a hybrid approach combining the best technologies:

```
Your Voice (Microphone)
    ↓
Web Speech API (Browser Recognition)
    ↓
Transcribed Text
    ↓
Groq AI Agent (Processing)
    ↓
AI Response Text
    ↓
ElevenLabs TTS or Browser TTS (Voice Synthesis)
    ↓
Speaker Output
```

## Technologies Used

1. **Agora RTC** - Real-time communication channel (WebRTC)
2. **Web Speech API** - Browser-based speech recognition
3. **Groq AI** - Fast LLM for understanding and responses
4. **ElevenLabs** - High-quality text-to-speech (optional)
5. **Browser TTS** - Fallback speech synthesis

## Quick Start

### Step 1: Start Voice Chat
1. Open the application in **Chrome, Edge, or Safari**
2. Click "Voice Chat" in the sidebar
3. Enter a channel name (e.g., "my-room")
4. Click "Start Voice Chat"

### Step 2: Grant Permissions
- Browser will ask for microphone permission
- Click "Allow"

### Step 3: Listen for Greeting
- You should immediately hear: "Hello! I'm Luna, your personal productivity assistant. How can I help you today?"
- Status will change to "Listening..."

### Step 4: Start Speaking
- Wait for "Listening..." status (green badge)
- Speak naturally and clearly
- Example commands:
  - "Create a todo to buy groceries"
  - "Show me my todos"
  - "Create a reminder to call John tomorrow at 3pm"
  - "Mark the first todo as complete"

### Step 5: Wait for Response (or Interrupt!)
- Status changes: Listening → Processing → Speaking → Listening
- Luna will respond with voice
- **NEW:** You can interrupt Luna anytime by speaking!
  - Just start talking while she's speaking
  - She'll immediately stop and listen to you
  - No need to wait for her to finish

## Status Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| Not Connected | Gray | Not started |
| Connecting... | Yellow | Setting up connection |
| Connected - Listening... | Green | Ready for your voice |
| Listening... | Green | Actively listening |
| Processing... | Yellow | AI is thinking |
| Speaking... | Blue | Luna is responding |

## Troubleshooting

### No Greeting Heard

**Possible causes:**
1. Speaker volume is muted or too low
2. ElevenLabs TTS not configured (will fallback to browser TTS)
3. Browser audio is blocked

**Solutions:**
- Check speaker volume
- Check browser console (F12) for errors
- Try refreshing the page
- Make sure ELEVENLABS_API_KEY is set in .env (optional but recommended)

### Speech Not Recognized

**Possible causes:**
1. Microphone not working
2. Speaking too softly
3. Background noise
4. Using Firefox (limited Web Speech API support)

**Solutions:**
- Test microphone in system settings
- Speak clearly and loudly
- Reduce background noise
- Use Chrome, Edge, or Safari
- Check browser console for "Speech recognition error"

### No Response from Luna

**Possible causes:**
1. Groq API not configured
2. Network connection issues
3. AI agent error

**Solutions:**
- Check GROQ_API_KEY in .env
- Check browser console for errors
- Check terminal for Python errors
- Verify internet connection

### Choppy or Interrupted Speech

**Possible causes:**
1. Slow internet connection
2. Browser performance issues
3. ElevenLabs API rate limits

**Solutions:**
- Check internet speed
- Close other browser tabs
- Will automatically fallback to browser TTS if ElevenLabs fails

## Browser Compatibility

| Browser | Speech Recognition | TTS | Recommended |
|---------|-------------------|-----|-------------|
| Chrome | ✅ Excellent | ✅ Yes | ⭐⭐⭐⭐⭐ |
| Edge | ✅ Excellent | ✅ Yes | ⭐⭐⭐⭐⭐ |
| Safari | ✅ Good | ✅ Yes | ⭐⭐⭐⭐ |
| Firefox | ⚠️ Limited | ✅ Yes | ⭐⭐ |
| Opera | ✅ Good | ✅ Yes | ⭐⭐⭐⭐ |

## Advanced Configuration

### Using ElevenLabs TTS (Recommended)

For better voice quality, configure ElevenLabs:

1. Sign up at https://elevenlabs.io
2. Get your API key
3. Choose a voice ID from the voice library
4. Add to `.env`:
   ```env
   ELEVENLABS_API_KEY=your-api-key
   ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
   ```
5. Restart the application

**Benefits:**
- Natural, human-like voice
- Better pronunciation
- Emotional tone
- Multiple language support

### Using Browser TTS (Fallback)

If ElevenLabs is not configured, the system automatically uses browser's built-in TTS:

**Pros:**
- No API key needed
- No cost
- Works offline

**Cons:**
- Robotic voice
- Limited customization
- Varies by browser

## Example Conversations

### Creating a Todo
```
You: "Create a todo to buy milk with high priority"
Luna: "I've created a high-priority todo: Buy milk. It's due today."
```

### Using Barge-In (Interrupting)
```
Luna: "I've created a high-priority todo: Buy milk. It's due to—"
You: "Wait, make that medium priority"  [Luna stops immediately]
Luna: "I've updated the todo to medium priority."
```

### Listing Todos
```
You: "Show me my todos"
Luna: "You have 3 todos:
       ○ Buy milk - high priority (Due: 2025-10-08)
       ○ Call dentist - medium priority (Due: 2025-10-09)
       ✓ Submit report - high priority"
```

### Creating a Reminder
```
You: "Remind me to call John tomorrow at 3pm"
Luna: "I've set a reminder for tomorrow at 3pm to call John."
```

### Completing a Todo
```
You: "Mark buy milk as complete"
Luna: "Completed todo: Buy milk"
```

## Tips for Best Experience

1. **Speak naturally** - No need for special commands or keywords
2. **Interrupt anytime** - With barge-in, you can interrupt Luna while she's speaking!
3. **Use a quiet environment** - Reduce background noise for better recognition
4. **Good microphone** - Built-in laptop mics work, but external mics are better
5. **Clear pronunciation** - Especially for names and specific terms
6. **Natural conversation** - Feel free to interrupt, clarify, or change your mind mid-response
7. **Check browser console** - Open F12 to see what's being recognized and when barge-in activates

## Privacy & Security

### Local Processing
- Speech recognition happens in your browser
- No audio is sent to third-party servers (except Agora for real-time channel)

### Data Flow
1. Your voice → Browser Speech Recognition → Text
2. Text → Your backend → Groq AI → Response
3. Response → ElevenLabs/Browser TTS → Audio
4. Audio → Your speakers

### What's Stored
- Conversation history (in memory, cleared when you reset)
- Todos and reminders (in Appwrite database)
- No audio recordings are stored

## Debugging

### Enable Console Logging

Open browser console (F12) and look for:
- `🎤 Speech recognition started` - Recognition is active
- `🗣️ User said: ...` - What was recognized
- `🛑 Barge-in detected! Stopping Luna...` - You interrupted Luna
- `🛑 Interrupting Luna's speech...` - Luna stopped speaking
- `🤖 Luna says: ...` - AI response

### Check Network Tab

In browser DevTools → Network tab:
- `/api/chat` - Should show 200 OK
- `/api/tts` - Should show 200 OK (if using ElevenLabs)

### Common Console Messages

```
✅ "Speech recognition started" - Good!
⚠️ "Speech recognition error: no-speech" - Normal, will continue
❌ "Speech recognition not supported" - Use Chrome/Edge/Safari
⚠️ "ElevenLabs TTS not available, falling back to browser TTS" - Working but using fallback
```

## Performance Tips

1. **Close unnecessary tabs** - Browser needs resources for speech processing
2. **Wired internet** - Better than WiFi for real-time features
3. **Good connection** - At least 1 Mbps upload/download
4. **Modern browser** - Keep your browser updated
5. **Adequate RAM** - At least 4GB available

## Next Steps

- Try different commands
- Adjust speaking pace to find what works best
- Configure ElevenLabs for better voice quality
- Experiment with complex queries
- Integrate with calendar (if configured)

---

**Need Help?**
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- Review [README.md](README.md) for full documentation
- Check browser console (F12) for errors
- Verify all API keys in `.env`

Happy voice chatting with Luna! 🎤🤖
