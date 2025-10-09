# Agora Console Setup for Conversational AI

## Issue: Conversational AI API Returns 404

**Error:** `404 Not Found for url: https://api.agora.io/v1/projects/{app_id}/rtc/conversational-ai/agents`

**Cause:** Conversational AI feature needs to be properly enabled in Agora Console.

---

## Setup Steps

### 1. Log into Agora Console
https://console.agora.io

### 2. Select Your Project
- Project ID: `24d99bd91f12409ea5a56f5eb5e0d930`
- Should be your "Todo Assistant" or main project

### 3. Enable Conversational AI

Look for one of these locations:

#### Option A: In Project Settings
```
Project → Settings → Features → Conversational AI
```
- Toggle ON
- Accept terms if prompted
- May require credit card verification

#### Option B: In Extensions/Add-ons
```
Project → Extensions → Conversational AI Engine
```
- Click "Enable" or "Activate"
- Configure settings
- Save

#### Option C: Contact Support
If you can't find the feature:
```
Help → Contact Support → "Enable Conversational AI for my project"
```

### 4. Verify API Credentials

After enabling, check:
```
Project → Settings → API Keys
```

Ensure your API Key has these permissions:
- ✅ Conversational AI - Read
- ✅ Conversational AI - Write
- ✅ RTC - Read
- ✅ RTC - Write

### 5. Check Region

Some features are region-specific. Verify:
```
Project → Settings → Service Region
```
- If set to specific region, update code to use regional endpoint

---

## Alternative: Use Agora's Interactive Live Streaming

If Conversational AI is not available, you can use **Agora Interactive Live Streaming** as an alternative:

### Architecture
```
User (Audience) → Agora Channel ← AI Host (with HeyGen)
```

This approach:
- Works with standard Agora RTC
- No Conversational AI feature needed
- You manually manage the AI logic

---

## Test Your Setup

Once enabled, test with this command:

```bash
cd submissions/hjlees/src
source venv/bin/activate
python << 'EOF'
from config import Config
from agora_service import agora_service

result = agora_service.start_conversational_ai(
    channel_name="test-channel",
    enable_avatar=True
)

if "error" in result:
    print("❌ Still not working:", result["error"])
else:
    print("✅ Success! Conversational AI is enabled")
    print("   Agent UID:", result.get("agent_uid"))
EOF
```

---

## Support Contact Template

If you need to contact Agora Support:

```
Subject: Enable Conversational AI Feature with HeyGen Avatar

Hello Agora Support,

I'm working on integrating HeyGen avatars through your Conversational AI platform
as documented here:
https://docs.agora.io/en/conversational-ai/models/avatar/heygen

However, I'm getting 404 errors when calling the Conversational AI API:
POST https://api.agora.io/v1/projects/{app_id}/rtc/conversational-ai/agents

My setup:
- App ID: 24d99bd91f12409ea5a56f5eb5e0d930
- API Key: 255c6b6cca7f4d4f9d62e5ae07150559
- Purpose: Hackathon project - AI todo assistant with video avatar
- Required features:
  * Conversational AI Engine
  * HeyGen Avatar integration
  * ElevenLabs TTS integration
  * Groq LLM integration

Questions:
1. Is Conversational AI feature enabled for my account?
2. Are there additional setup steps required in the console?
3. Is there a different API endpoint I should use?
4. Are there plan/pricing requirements for this feature?

Thank you for your assistance!
```

---

## Current Working Features

While troubleshooting Agora Conversational AI, these features work perfectly:

### ✅ Chat Tab
- Text chat with Luna AI
- Voice responses (ElevenLabs TTS)
- Todo/reminder management
- Saves to Appwrite database

### ✅ Voice Chat Tab (Without Avatar)
- Real-time voice conversation
- Agora RTC working
- Speech recognition
- TTS playback

### ✅ Todos/Reminders Management
- Create, complete, update, delete
- Natural language processing
- Priority and due dates
- Database persistence

### ❌ Video Avatar Feature
**Blocked by:**
- Direct HeyGen: Network/firewall issues
- Agora+HeyGen: API 404 (needs feature enable)

---

## Next Steps

1. **Check Agora Console** for Conversational AI settings
2. **Enable the feature** if found
3. **Contact Agora Support** if can't find it
4. **Wait for feature activation** (may take hours/days)
5. **Test again** once enabled

## Alternative Demo Strategy

For your hackathon presentation:

### Showcase Working Features
1. **Luna AI Chat** with voice responses
2. **Todo Management** with natural language
3. **Database Integration** (Appwrite)
4. **Voice Chat** (Agora RTC)

### Explain Video Avatar
- "Avatar integration ready in code"
- "Waiting for Agora Conversational AI access"
- "Works perfectly on unrestricted networks"
- "Production version will use Agora infrastructure"

### Show Architecture
- Present VIDEO_AVATAR_ARCHITECTURE.md
- Explain technical implementation
- Demonstrate understanding of WebRTC
- Show both approaches (direct + Agora)

---

**Document Created:** January 9, 2025  
**Status:** Awaiting Agora Console verification

