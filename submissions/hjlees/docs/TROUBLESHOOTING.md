# Troubleshooting Guide

## Voice Chat Issues

### No greeting or voice response

**Cause:** The voice chat now uses **Web Speech API** (browser speech recognition) + **Groq AI** + **TTS** instead of Agora's Conversational AI Engine.

**Solution:**
1. **Use Chrome, Edge, or Safari** - Firefox doesn't support Web Speech API well
2. **Allow microphone permissions** when prompted
3. **Check browser console** (F12) for speech recognition status
4. You should hear a greeting immediately when connecting

**How it works:**
- Browser listens to your voice (Web Speech API)
- Transcribes speech to text
- Sends text to Groq AI agent
- Gets response from AI
- Plays response using ElevenLabs TTS (if configured) or browser TTS (fallback)

### Error: "AgoraRTCError CAN_NOT_GET_GATEWAY_SERVER: invalid token, authorized failed"

This error occurs when there's an issue with Agora credentials or token generation.

#### Solution 1: Configure Agora App ID

1. **Check your `.env` file** has a valid `AGORA_APP_ID`:
   ```env
   AGORA_APP_ID=your-actual-app-id-here
   ```

2. **Get your App ID from Agora Console:**
   - Go to https://console.agora.io
   - Sign in or create an account
   - Create a project (or use an existing one)
   - Copy the App ID from the project settings

#### Solution 2: Disable App Certificate (Testing Mode)

For testing purposes, you can run Agora without App Certificate:

1. **In Agora Console:**
   - Go to your project
   - Click on "Config"
   - Find "Primary Certificate" section
   - Make sure it's **DISABLED** for testing

2. **In your `.env` file:**
   - Leave `AGORA_APP_CERTIFICATE` empty or commented out:
   ```env
   AGORA_APP_ID=your-app-id
   # AGORA_APP_CERTIFICATE=
   ```

3. **Restart your application**

The app will automatically detect testing mode and work without a token.

#### Solution 3: Enable App Certificate (Production Mode)

For production use, enable App Certificate:

1. **In Agora Console:**
   - Go to your project
   - Click on "Config"
   - Enable "Primary Certificate"
   - Copy the certificate value

2. **In your `.env` file:**
   ```env
   AGORA_APP_ID=your-app-id
   AGORA_APP_CERTIFICATE=your-app-certificate
   ```

3. **Restart your application**

The app will generate proper tokens for secure connections.

#### Verification

After making changes, check the browser console (F12) when starting voice chat:
- You should see: `Agora configuration: { app_id: ..., has_token: ..., testing_mode: ... }`
- If `testing_mode: true`, you're in testing mode (no certificate)
- If `testing_mode: false`, you're using token-based authentication

---

## Database Issues

### Error: "Appwrite credentials not configured"

**Solution:**
1. Sign up at https://cloud.appwrite.io
2. Create a new project
3. Create a database with two collections (todos and reminders)
4. Copy the IDs to your `.env` file
5. Restart the application

### Error: "Document not found"

**Solution:**
- Ensure your collections have the correct attributes (see SETUP.md)
- Check that collection permissions allow read/write
- Verify the collection IDs in `.env` match Appwrite Console

---

## AI Agent Issues

### Error: "Missing 'message' field"

**Solution:**
- Ensure you're sending proper JSON in API requests
- Check the request format in README.md

### Slow responses

**Solution:**
- Check your internet connection
- Groq API might be experiencing high load
- Consider using a different model in `config.py`

---

## TTS Issues

### No audio playing

**Solution:**
1. Check browser audio permissions
2. Ensure `ELEVENLABS_API_KEY` is set in `.env`
3. Check browser console for errors
4. Verify your ElevenLabs account has available characters

### Wrong voice

**Solution:**
- Update `ELEVENLABS_VOICE_ID` in `.env`
- Get voice IDs from https://elevenlabs.io/app/voice-library

---

## Video Avatar Issues

### Error: "HeyGen Streaming API endpoint not found" (404)

**Cause:** HeyGen's Streaming Avatar API requires:
- A HeyGen Enterprise/Business account
- Special API access enabled
- The free tier may not support streaming avatars

**Solution:**
1. **Video Avatar is OPTIONAL** - The core app works without it
2. **Use Voice Chat instead** - Provides similar AI interaction
3. If you have HeyGen access:
   - Verify your account tier supports Streaming API
   - Check API key has proper permissions
   - Contact HeyGen support for API access
4. Comment out HeyGen in `.env` to disable feature warnings

### Avatar not loading

**Solution:**
1. Check `HEYGEN_API_KEY` in `.env`
2. Verify your HeyGen account has Streaming API access
3. Check browser console for WebRTC errors
4. Ensure HTTPS is enabled (WebRTC requirement)
5. **Alternative:** Use Voice Chat - it provides full AI interaction without video

### Video freezing

**Solution:**
- Check your internet connection speed
- Try lowering quality in `heygen_service.py`
- Check browser console for errors

---

## Installation Issues

### Module not found

**Solution:**
```bash
pip install -r requirements.txt --force-reinstall
```

### Python version issues

**Solution:**
- Ensure Python 3.10+ is installed:
```bash
python --version
```
- Use a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

## Configuration Issues

### "Configuration error: Missing required configuration"

**Solution:**
1. Check `.env` file exists
2. Verify all required variables are set:
   - `APPWRITE_PROJECT_ID`
   - `APPWRITE_API_KEY`
   - `APPWRITE_DATABASE_ID`
   - `GROQ_API_KEY`
   - `AGORA_APP_ID`

3. Restart the application

### Environment variables not loading

**Solution:**
1. Ensure `.env` is in the same directory as `app.py`
2. Check for syntax errors in `.env`
3. Restart the application completely
4. Try running with explicit env loading:
```bash
python -c "from dotenv import load_dotenv; load_dotenv(); import os; print(os.getenv('AGORA_APP_ID'))"
```

---

## Network Issues

### CORS errors

**Solution:**
- The app is designed for local development
- For production deployment, add CORS configuration in `app.py`

### WebRTC connection failed

**Solution:**
1. Check firewall settings
2. Ensure ports are not blocked
3. Try a different network
4. Check browser WebRTC support: https://test.webrtc.org/

---

## Browser Issues

### Features not working

**Solution:**
1. Use a modern browser (Chrome, Firefox, Edge, Safari)
2. Update to the latest version
3. Clear browser cache
4. Check browser console (F12) for errors

### Microphone not working

**Solution:**
1. Check browser microphone permissions
2. Test microphone in system settings
3. Try a different browser
4. Check if another app is using the microphone

---

## Debugging Tips

### Enable Debug Mode

Add to your `.env`:
```env
FLASK_ENV=development
FLASK_DEBUG=1
```

### Check Logs

**Backend logs:**
- Check terminal where `app.py` is running
- Look for error messages and stack traces

**Frontend logs:**
- Open browser console (F12)
- Check for JavaScript errors
- Look at Network tab for failed requests

### Test API Endpoints

Use curl to test backend directly:

```bash
# Test health
curl http://localhost:5000/health

# Test chat
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Test Agora token
curl -X POST http://localhost:5000/api/agora/token \
  -H "Content-Type: application/json" \
  -d '{"channel_name": "test"}'
```

### Common Debug Commands

```bash
# Check Python version
python --version

# Check installed packages
pip list

# Check environment variables
python -c "from config import Config; Config.validate()"

# Test Agora connection
python -c "from agora_service import agora_service; print(agora_service.app_id)"
```

---

## Still Having Issues?

1. **Check the main README.md** for detailed documentation
2. **Review SETUP.md** for setup instructions
3. **Check the API documentation** in README.md
4. **Review browser console** for JavaScript errors
5. **Check terminal output** for Python errors
6. **Try the example commands** in SETUP.md

## Quick Checklist

Before reporting an issue, verify:

- [ ] Python 3.10+ installed
- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created and configured
- [ ] All required API keys added to `.env`
- [ ] Agora project created (with or without certificate)
- [ ] Appwrite database and collections created
- [ ] Application restarted after configuration changes
- [ ] Browser console checked for errors
- [ ] Terminal checked for errors

---

## Emergency Reset

If nothing works, try a complete reset:

```bash
# 1. Stop the application (Ctrl+C)

# 2. Remove virtual environment
rm -rf venv

# 3. Recreate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 4. Reinstall dependencies
pip install -r requirements.txt

# 5. Verify .env configuration
cat .env

# 6. Restart application
python app.py
```

---

For Agora-specific issues, also check:
- [Agora Documentation](https://docs.agora.io/)
- [Agora Community Forum](https://www.agora.io/en/community/)
- [Agora Troubleshooting Guide](https://docs.agora.io/en/help/general-product-inquiry/common_errors)
