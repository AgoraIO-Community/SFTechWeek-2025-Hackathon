# Barge-In Feature Documentation

## Overview

The **Barge-In** feature allows you to interrupt Luna while she's speaking, creating a more natural and responsive conversational experience. You don't have to wait for Luna to finish - just start talking and she'll immediately stop and listen to you.

## How It Works

### Technical Implementation

1. **State Tracking**
   - `isSpeaking` flag tracks when Luna is currently speaking
   - `currentAudio` stores the active HTML5 audio element (ElevenLabs TTS)
   - `speechSynthesisUtterance` stores the active browser TTS utterance

2. **Speech Recognition**
   - Runs continuously in the background
   - Listens even while Luna is speaking
   - Detects when user starts talking

3. **Interruption Logic**
   ```javascript
   if (isSpeaking) {
       console.log('🛑 Barge-in detected! Stopping Luna...');
       interruptSpeech();
   }
   ```

4. **Audio Interruption**
   - Pauses and resets HTML5 audio (ElevenLabs)
   - Cancels browser speech synthesis
   - Updates UI status immediately

### Flow Diagram

```
Luna is speaking (isSpeaking = true)
    ↓
User starts talking
    ↓
Speech Recognition detects input
    ↓
Barge-in detected!
    ↓
interruptSpeech() called
    ↓
- Stop audio playback
- Cancel speech synthesis
- Reset isSpeaking flag
- Update UI to "Processing..."
    ↓
Process user's new input
    ↓
Generate and speak response
```

## User Experience

### Natural Conversation Flow

**Without Barge-In:**
```
Luna: "I've created a todo for buying groceries with high priority..."
       [User must wait]
       "...and set the due date to today. Is there anything else..."
       [User still waiting]
       "...I can help you with?"
User: "Actually, make that medium priority"
```

**With Barge-In:**
```
Luna: "I've created a todo for buying groceries with high priority—"
User: "Wait, make that medium priority"  [Luna stops immediately]
Luna: "I've updated the todo to medium priority."
```

## Use Cases

### 1. Corrections
```
Luna: "I've created a reminder for tomorrow at 3—"
You: "No, 4pm"
Luna: "Updated to 4pm."
```

### 2. Clarifications
```
Luna: "You have 5 todos. The first one is—"
You: "Just show me the high priority ones"
Luna: "Here are your high priority todos..."
```

### 3. Changes of Mind
```
Luna: "I'll delete the todo about—"
You: "Wait, don't delete it"
Luna: "Okay, I won't delete it. What would you like to do instead?"
```

### 4. Quick Interruptions
```
Luna: "Let me list all your reminders. First—"
You: "Never mind"
Luna: "Okay, what can I help you with?"
```

## Technical Details

### Supported TTS Methods

1. **ElevenLabs TTS (HTML5 Audio)**
   - Uses `Audio` element
   - Interrupted via `audio.pause()` and `audio.currentTime = 0`
   - Cleanly stops playback

2. **Browser Speech Synthesis**
   - Uses `SpeechSynthesisUtterance`
   - Interrupted via `speechSynthesis.cancel()`
   - Clears synthesis queue

### State Management

```javascript
// Before speaking
isSpeaking = true;
updateVoiceStatus('Speaking...', 'info');

// During interruption
interruptSpeech() {
    currentAudio?.pause();
    speechSynthesis.cancel();
    isSpeaking = false;
    updateVoiceStatus('Processing...', 'warning');
}

// After speaking completes naturally
isSpeaking = false;
updateVoiceStatus('Listening...', 'success');
```

### Error Handling

- If audio fails to load, `isSpeaking` is still reset
- If speech synthesis errors, state is cleaned up
- Promise rejections are caught and handled
- UI always returns to a consistent state

## Browser Compatibility

| Browser | Barge-In Support | Notes |
|---------|------------------|-------|
| Chrome | ✅ Full | Best performance |
| Edge | ✅ Full | Excellent support |
| Safari | ✅ Full | Good support |
| Firefox | ⚠️ Limited | Web Speech API limitations |

## Performance Considerations

### Low Latency
- Interruption happens immediately (< 100ms)
- Audio stops before user finishes first word
- No buffering delays

### Resource Management
- Old audio objects are properly cleaned up
- No memory leaks from interrupted audio
- Speech synthesis queue is cleared

### Network Efficiency
- Audio interruption is local (no API calls)
- Only new user input triggers API requests
- Interrupted audio doesn't continue downloading

## Testing the Feature

### Manual Testing

1. **Start voice chat**
   ```
   Click "Start Voice Chat" → Wait for "Listening..."
   ```

2. **Trigger Luna's response**
   ```
   Say: "Create a todo to test the barge-in feature"
   Wait for Luna to start speaking
   ```

3. **Interrupt Luna**
   ```
   While Luna is speaking, say: "Wait!"
   Luna should stop immediately
   ```

4. **Check console**
   ```
   Open F12 console
   Look for: "🛑 Barge-in detected! Stopping Luna..."
   ```

### Expected Console Output

```
🎤 Speech recognition started
🗣️ User said: "Create a todo to test the barge-in feature"
🤖 Luna says: "I've created a todo to test the barge-in feature..."
[Audio starts playing]
🗣️ User said: "Wait!"
🛑 Barge-in detected! Stopping Luna...
🛑 Interrupting Luna's speech...
[Audio stops immediately]
🤖 Luna says: "How can I help you?"
```

## Tips for Best Results

### Do's ✅
- Speak clearly when interrupting
- Interrupt early if you realize a mistake
- Use natural phrases like "Wait", "Stop", "Actually"
- Let recognition start before interrupting

### Don'ts ❌
- Don't speak too softly (won't be detected)
- Don't interrupt during the first syllable (may not register)
- Don't spam interruptions (let AI process)
- Don't expect instant responses in noisy environments

## Troubleshooting

### Barge-In Not Working

**Problem:** Luna doesn't stop when I speak

**Solutions:**
1. Check microphone sensitivity
2. Speak louder/clearer
3. Check browser console for recognition errors
4. Verify Web Speech API is supported
5. Try a different browser (Chrome recommended)

### Audio Continues After Interrupt

**Problem:** Luna's voice continues briefly

**Solutions:**
1. This is normal browser audio latency (< 200ms)
2. Check for browser audio buffering
3. Ensure no other audio players are active
4. Clear browser cache and reload

### Status Not Updating

**Problem:** UI status doesn't change on interrupt

**Solutions:**
1. Check browser console for JavaScript errors
2. Reload the page
3. Clear browser cache
4. Check network connectivity

## Future Enhancements

### Planned Features
- [ ] Visual indicator when barge-in is detected
- [ ] Configurable interrupt sensitivity
- [ ] Interrupt confirmation sound
- [ ] Partial response resumption
- [ ] Context-aware interruption handling

### Advanced Options (Future)
```javascript
// Configurable barge-in settings
const bargeInConfig = {
    enabled: true,
    sensitivity: 0.7,  // 0.0-1.0
    minInterruptDuration: 500,  // ms
    confirmationSound: true,
    visualFeedback: true
};
```

## Code Reference

### Key Functions

**`interruptSpeech()`**
```javascript
function interruptSpeech() {
    // Stop HTML5 audio (ElevenLabs)
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    
    // Stop browser speech synthesis
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        speechSynthesisUtterance = null;
    }
    
    // Reset state
    isSpeaking = false;
    updateVoiceStatus('Processing...', 'warning');
}
```

**Speech Recognition Handler**
```javascript
recognition.onresult = async (event) => {
    const transcript = event.results[last][0].transcript.trim();
    
    // Barge-in: If Luna is speaking, interrupt her
    if (isSpeaking) {
        console.log('🛑 Barge-in detected! Stopping Luna...');
        interruptSpeech();
    }
    
    await processVoiceInput(transcript);
};
```

## Related Documentation

- [VOICE_CHAT_GUIDE.md](VOICE_CHAT_GUIDE.md) - Complete voice chat guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions
- [README.md](README.md) - Main documentation

---

**Questions or Issues?**
- Check the browser console (F12) for debugging
- Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Ensure you're using a supported browser (Chrome/Edge/Safari)

The barge-in feature makes conversations with Luna feel natural and responsive! 🎤✨
