"""Main Flask application for Agora Todo Assistant."""
from flask import Flask, request, jsonify, render_template, Response
import json
import os
from datetime import datetime

from config import Config
from ai_agent import agent
from database import db_client
from tts_service import tts_service
from agora_service import agora_service, ConversationalAIAgent
from heygen_service import heygen_service, StreamingAvatarSession


# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Validate configuration
try:
    Config.validate()
except ValueError as e:
    print(f"Configuration error: {e}")
    print("Please check your .env file and ensure all required variables are set.")


# Global session management
active_sessions = {}
heygen_sessions = {}


@app.route('/')
def index():
    """Render the main application page."""
    return render_template('index.html')


@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()})


# ===== AI Agent Endpoints =====

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Process a chat message through the AI agent.
    
    Request body:
        {
            "message": "user message text",
            "session_id": "optional session identifier"
        }
    
    Returns:
        {
            "response": "agent response text",
            "session_id": "session identifier"
        }
    """
    try:
        data = request.get_json()
        message = data.get('message')
        session_id = data.get('session_id', 'default')
        
        if not message:
            return jsonify({"error": "Missing 'message' field"}), 400
        
        # Process message through agent
        response = agent.process_message(message)
        
        return jsonify({
            "response": response,
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        import traceback
        print(f"Error in chat endpoint: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/chat/reset', methods=['POST'])
def reset_chat():
    """Reset the conversation history."""
    try:
        agent.reset_conversation()
        return jsonify({"status": "reset", "message": "Conversation history cleared"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===== Todo Endpoints =====

@app.route('/api/todos', methods=['GET'])
def get_todos():
    """Get all todos."""
    try:
        completed = request.args.get('completed')
        if completed is not None:
            completed = completed.lower() == 'true'
        
        todos = db_client.get_todos(completed=completed)
        return jsonify({
            "todos": [todo.model_dump() for todo in todos],
            "count": len(todos)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/todos/<todo_id>', methods=['GET'])
def get_todo(todo_id):
    """Get a specific todo."""
    try:
        todo = db_client.get_todo(todo_id)
        if todo:
            return jsonify(todo.model_dump())
        return jsonify({"error": "Todo not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/reminders', methods=['GET'])
def get_reminders():
    """Get all reminders."""
    try:
        reminders = db_client.get_reminders()
        return jsonify({
            "reminders": [reminder.model_dump() for reminder in reminders],
            "count": len(reminders)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===== TTS Endpoints =====

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    """
    Convert text to speech.
    
    Request body:
        {
            "text": "text to convert",
            "voice_id": "optional voice ID",
            "stream": false
        }
    
    Returns:
        Audio data (audio/mpeg)
    """
    try:
        data = request.get_json()
        text = data.get('text')
        voice_id = data.get('voice_id')
        stream = data.get('stream', False)
        
        if not text:
            return jsonify({"error": "Missing 'text' field"}), 400
        
        if stream:
            def generate():
                for chunk in tts_service.text_to_speech_stream(text, voice_id=voice_id):
                    yield chunk
            
            return Response(generate(), mimetype='audio/mpeg')
        else:
            audio_data = tts_service.text_to_speech(text, voice_id=voice_id)
            return Response(audio_data, mimetype='audio/mpeg')
        
    except Exception as e:
        print(f"Error in TTS endpoint: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/tts/voices', methods=['GET'])
def get_voices():
    """Get available TTS voices."""
    try:
        voices = tts_service.get_available_voices()
        return jsonify({
            "voices": [
                {
                    "voice_id": v.voice_id,
                    "name": v.name,
                    "category": v.category,
                    "labels": v.labels
                }
                for v in voices
            ]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===== Agora RTC Endpoints =====

@app.route('/api/agora/token', methods=['POST'])
def generate_agora_token():
    """
    Generate Agora RTC token.
    
    Request body:
        {
            "channel_name": "channel name",
            "uid": 0,
            "role": 1
        }
    
    Returns:
        {
            "token": "rtc token" or null (for testing mode),
            "channel_name": "channel name",
            "uid": uid,
            "app_id": "app id",
            "testing_mode": boolean
        }
    """
    try:
        data = request.get_json()
        channel_name = data.get('channel_name')
        uid = data.get('uid', 0)
        role = data.get('role', 1)
        
        if not channel_name:
            return jsonify({"error": "Missing 'channel_name' field"}), 400
        
        # Validate Agora credentials
        if not Config.AGORA_APP_ID or Config.AGORA_APP_ID == "your-app-id":
            return jsonify({
                "error": "Agora App ID not configured. Please set AGORA_APP_ID in your .env file"
            }), 500
        
        token = agora_service.generate_rtc_token(
            channel_name=channel_name,
            uid=uid,
            role=role
        )
        
        # Testing mode: no certificate enabled
        testing_mode = token is None
        
        return jsonify({
            "token": token,
            "channel_name": channel_name,
            "uid": uid,
            "app_id": Config.AGORA_APP_ID,
            "testing_mode": testing_mode
        })
        
    except Exception as e:
        print(f"Error in generate_agora_token: {e}")
        return jsonify({
            "error": f"Failed to generate token: {str(e)}",
            "hint": "Check your AGORA_APP_ID and AGORA_APP_CERTIFICATE in .env file"
        }), 500


@app.route('/api/agora/conversational-ai/start', methods=['POST'])
def start_conversational_ai():
    """
    Start Agora Conversational AI agent with optional HeyGen video avatar.
    
    Request body:
        {
            "channel_name": "channel name",
            "greeting": "optional greeting message",
            "enable_avatar": true/false (enables HeyGen video avatar)
        }
    
    Returns:
        Agent details including channel info and UIDs
    """
    try:
        data = request.get_json() or {}
        channel_name = data.get('channel_name')
        greeting = data.get('greeting')
        enable_avatar = data.get('enable_avatar', False)
        
        if not channel_name:
            return jsonify({"error": "Missing 'channel_name' field"}), 400
        
        # Validate API keys if avatar is enabled
        if enable_avatar:
            if not Config.HEYGEN_API_KEY or Config.HEYGEN_API_KEY == "your-heygen-api-key":
                return jsonify({
                    "error": "HeyGen API key not configured",
                    "hint": "Set HEYGEN_API_KEY in .env to enable video avatar"
                }), 400
            
            if not Config.ELEVENLABS_API_KEY or Config.ELEVENLABS_API_KEY == "your-elevenlabs-api-key":
                return jsonify({
                    "error": "ElevenLabs API key required for HeyGen avatar",
                    "hint": "HeyGen avatars require ElevenLabs TTS. Set ELEVENLABS_API_KEY in .env"
                }), 400
        
        # Create new conversational AI session
        conv_agent = ConversationalAIAgent(agora_service)
        result = conv_agent.start(
            channel_name=channel_name,
            greeting=greeting,
            enable_avatar=enable_avatar
        )
        
        if "error" not in result:
            active_sessions[channel_name] = conv_agent
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/agora/conversational-ai/stop', methods=['POST'])
def stop_conversational_ai():
    """
    Stop Agora Conversational AI agent.
    
    Request body:
        {
            "channel_name": "channel name"
        }
    """
    try:
        data = request.get_json()
        channel_name = data.get('channel_name')
        
        if not channel_name:
            return jsonify({"error": "Missing 'channel_name' field"}), 400
        
        conv_agent = active_sessions.get(channel_name)
        if not conv_agent:
            return jsonify({"error": "No active session found"}), 404
        
        result = conv_agent.stop()
        
        if "error" not in result:
            del active_sessions[channel_name]
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===== HeyGen Video Avatar Endpoints =====

@app.route('/api/heygen/avatars', methods=['GET'])
def get_avatars():
    """Get available HeyGen avatars."""
    try:
        avatars = heygen_service.list_avatars()
        return jsonify({"avatars": avatars})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/heygen/video/create', methods=['POST'])
def create_video():
    """
    Create a video with HeyGen avatar.
    
    Request body:
        {
            "script": "text for avatar to speak",
            "avatar_id": "optional avatar ID",
            "title": "optional video title"
        }
    
    Returns:
        Video creation response with video_id
    """
    try:
        data = request.get_json()
        script = data.get('script')
        avatar_id = data.get('avatar_id')
        title = data.get('title')
        
        if not script:
            return jsonify({"error": "Missing 'script' field"}), 400
        
        result = heygen_service.create_video(
            script=script,
            avatar_id=avatar_id,
            title=title
        )
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/heygen/video/status/<video_id>', methods=['GET'])
def get_video_status(video_id):
    """Get video generation status."""
    try:
        result = heygen_service.get_video_status(video_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/heygen/streaming/start', methods=['POST'])
def start_streaming_avatar():
    """
    Start HeyGen streaming avatar session.
    
    Request body:
        {
            "avatar_id": "optional avatar ID",
            "voice_id": "optional voice ID",
            "quality": "high"
        }
    
    Returns:
        Session details with session_id
    """
    try:
        # Check if HeyGen is configured
        if not Config.HEYGEN_API_KEY or Config.HEYGEN_API_KEY == "your-heygen-api-key":
            return jsonify({
                "error": "HeyGen is not configured",
                "hint": "Video Avatar is an optional feature. Set HEYGEN_API_KEY in .env to enable it, or use Voice Chat instead.",
                "status": "not_configured"
            }), 400
        
        data = request.get_json() or {}
        avatar_id = data.get('avatar_id')
        voice_id = data.get('voice_id')
        quality = data.get('quality', 'high')
        
        session = StreamingAvatarSession(heygen_service)
        result = session.start(avatar_id=avatar_id, voice_id=voice_id, quality=quality)
        
        if "error" in result:
            # Return error with appropriate status code
            status_code = result.get("status_code", 500)
            return jsonify(result), status_code
        
        session_id = result.get("data", {}).get("session_id")
        if session_id:
            heygen_sessions[session_id] = session
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in start_streaming_avatar: {e}")
        return jsonify({
            "error": str(e),
            "hint": "Video Avatar requires HeyGen Streaming API access. This is an optional feature."
        }), 500


@app.route('/api/heygen/streaming/speak', methods=['POST'])
def streaming_avatar_speak():
    """
    Make streaming avatar speak.
    
    Request body:
        {
            "session_id": "session ID",
            "text": "text to speak"
        }
    """
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        text = data.get('text')
        
        if not session_id or not text:
            return jsonify({"error": "Missing 'session_id' or 'text' field"}), 400
        
        session = heygen_sessions.get(session_id)
        if not session:
            return jsonify({"error": "Session not found"}), 404
        
        result = session.speak(text)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/heygen/streaming/stop', methods=['POST'])
def stop_streaming_avatar():
    """
    Stop streaming avatar session.
    
    Request body:
        {
            "session_id": "session ID"
        }
    """
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({"error": "Missing 'session_id' field"}), 400
        
        session = heygen_sessions.get(session_id)
        if not session:
            return jsonify({"error": "Session not found"}), 404
        
        result = session.stop()
        
        if "error" not in result:
            del heygen_sessions[session_id]
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/heygen/streaming/ice', methods=['POST'])
def get_streaming_ice_servers():
    """
    Get ICE servers for streaming avatar WebRTC.
    
    Request body:
        {
            "session_id": "session ID"
        }
    """
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({"error": "Missing 'session_id' field"}), 400
        
        session = heygen_sessions.get(session_id)
        if not session:
            return jsonify({"error": "Session not found"}), 404
        
        result = session.get_ice_servers()
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/heygen/streaming/start', methods=['POST'])
def send_streaming_start():
    """
    Send SDP answer to start streaming avatar.
    
    Request body:
        {
            "session_id": "session ID",
            "sdp": SDP answer object
        }
    """
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        sdp = data.get('sdp')
        
        if not session_id or not sdp:
            return jsonify({"error": "Missing 'session_id' or 'sdp' field"}), 400
        
        # Send answer to HeyGen
        import requests as req
        response = req.post(
            'https://api.heygen.com/v1/streaming.start',
            headers={
                'X-Api-Key': Config.HEYGEN_API_KEY,
                'Content-Type': 'application/json'
            },
            json={
                'session_id': session_id,
                'sdp': sdp
            }
        )
        
        if response.ok:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to start streaming", "details": response.text}), response.status_code
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static', exist_ok=True)
    
    # Run the app
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=Config.DEBUG
    )

