# AI Voice Agent

A voice-first AI agent interface for the SFTechWeek 2025 Hackathon, integrating Agora Conversational AI Engine, ElevenLabs TTS, HeyGen Video Avatar, and Appwrite.

## Features

- **Clean, Modern Interface**: Simple header with gradient design
- **AI Avatar Rectangle**: Visual representation of the AI agent with pulse animation during calls
- **Start/End Call Button**: Interactive button to control voice sessions
- **Real-time Chat Display**: Shows what the AI "heard" and what it "said" for testing purposes
- **Stock Watchlist Component**: Displays popular stocks with prices and changes

## Project Structure

```
src/
├── index.html          # Main HTML structure
├── app.js             # JavaScript functionality
└── styles/
    └── main.css       # CSS styles and animations
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open your browser and navigate to the local server address shown in the terminal.

## How to Use

1. Click the "Start Call" button to begin a voice session
2. The AI avatar will begin pulsing to indicate it's active
3. Watch the conversation log to see simulated AI interactions
4. The stock watchlist will appear during the conversation
5. Click "End Call" to stop the session

## Technologies

- Vanilla JavaScript for core functionality
- CSS Grid and Flexbox for responsive layout
- CSS animations for visual feedback
- Modern gradient designs for visual appeal

## Next Steps for Integration

This interface is ready to integrate with:
- **Agora Conversational AI Engine** for real-time voice processing
- **ElevenLabs TTS** for natural speech synthesis
- **HeyGen Streaming Avatar** for lifelike video representation
- **Appwrite** for backend deployment and real-time data

## Team

Quin & Brandon