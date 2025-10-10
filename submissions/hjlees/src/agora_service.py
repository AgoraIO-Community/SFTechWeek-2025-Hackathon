"""Agora RTC and Conversational AI Engine integration."""
import time
import json
import requests
from typing import Optional, Dict, Any
from agora_token_builder import RtcTokenBuilder
from datetime import datetime, timedelta

from config import Config


class AgoraService:
    """Service for Agora RTC and Conversational AI Engine."""
    
    def __init__(self):
        """Initialize Agora service."""
        self.app_id = Config.AGORA_APP_ID
        self.app_certificate = Config.AGORA_APP_CERTIFICATE
        self.api_key = Config.AGORA_API_KEY
        self.api_secret = Config.AGORA_API_SECRET
        self.base_url = "https://api.agora.io"
    
    def generate_rtc_token(
        self,
        channel_name: str,
        uid: int = 0,
        role: int = 1,
        expiration_seconds: int = 3600
    ) -> Optional[str]:
        """
        Generate RTC token for joining a channel.
        
        Args:
            channel_name: Name of the channel
            uid: User ID (0 for any user)
            role: Role (1=publisher, 2=subscriber)
            expiration_seconds: Token expiration time in seconds
        
        Returns:
            RTC token string, or None if certificate is not enabled
        """
        # If no app certificate is set, return None (testing mode - no token required)
        if not self.app_certificate or self.app_certificate == "your-app-certificate":
            print("⚠️  Warning: No App Certificate configured. Running in testing mode.")
            print("   For production, enable App Certificate in Agora Console.")
            return None
        
        try:
            current_timestamp = int(time.time())
            privilege_expired_ts = current_timestamp + expiration_seconds
            
            token = RtcTokenBuilder.buildTokenWithUid(
                self.app_id,
                self.app_certificate,
                channel_name,
                uid,
                role,
                privilege_expired_ts
            )
            
            print(f"✅ Generated Agora token for channel: {channel_name}")
            return token
        except Exception as e:
            print(f"❌ Error generating Agora token: {e}")
            print(f"   App ID: {self.app_id[:8]}... (masked)")
            print(f"   Certificate set: {bool(self.app_certificate)}")
            raise
    
    def start_conversational_ai(
        self,
        channel_name: str,
        agent_config: Optional[Dict[str, Any]] = None,
        enable_avatar: bool = False
    ) -> Dict[str, Any]:
        """
        Start Agora Conversational AI agent in a channel with optional HeyGen avatar.
        
        Args:
            channel_name: Name of the channel
            agent_config: Configuration for the AI agent
            enable_avatar: Whether to enable HeyGen video avatar
        
        Returns:
            Response with agent details including agent_uid and channel info
        """
        # Use v2 API endpoint
        url = f"{self.base_url}/api/conversational-ai-agent/v2/projects/{self.app_id}/join"
        
        # Generate UIDs
        agent_uid = str(int(time.time()))
        avatar_uid = str(int(time.time()) + 1)  # Different UID for avatar
        
        # Generate tokens
        try:
            agent_token = self.generate_rtc_token(channel_name, int(agent_uid), role=1)
            avatar_token = self.generate_rtc_token(channel_name, int(avatar_uid), role=1) if enable_avatar else None
        except Exception as e:
            print(f"Error generating tokens: {e}")
            return {"error": f"Failed to generate tokens: {str(e)}"}
        
        # Build configuration with HeyGen avatar support
        config = {
            "channel_name": channel_name,
            "uid": agent_uid,
            "greeting": agent_config.get("greeting", "Hello! I'm Luna, your AI productivity assistant. How can I help you today?") if agent_config else "Hello! I'm Luna, your AI productivity assistant. How can I help you today?",
        }
        
        # Add LLM configuration (Groq)
        if Config.GROQ_API_KEY:
            config["llm"] = {
                "vendor": "groq",
                "params": {
                    "api_key": Config.GROQ_API_KEY,
                    "model": Config.GROQ_MODEL,
                    "max_tokens": 1000,
                    "temperature": 0.7
                }
            }
        
        # Add TTS configuration (ElevenLabs with 24kHz for HeyGen)
        if Config.ELEVENLABS_API_KEY and Config.ELEVENLABS_API_KEY != "your-elevenlabs-api-key":
            config["tts"] = {
                "vendor": "elevenlabs",
                "params": {
                    "api_key": Config.ELEVENLABS_API_KEY,
                    "voice_id": Config.ELEVENLABS_VOICE_ID,
                    "model": Config.ELEVENLABS_MODEL,
                    "output_format": "pcm_24000"  # 24kHz for HeyGen compatibility
                }
            }
        
        # Add HeyGen Avatar configuration if enabled
        if enable_avatar and Config.HEYGEN_API_KEY and Config.HEYGEN_API_KEY != "your-heygen-api-key":
            config["avatar"] = {
                "vendor": "heygen",
                "enable": True,
                "params": {
                    "api_key": Config.HEYGEN_API_KEY,
                    "quality": "low",  # Free tier uses low quality
                    "agora_uid": avatar_uid,
                    "agora_token": avatar_token,
                    "activity_idle_timeout": 600,  # 10 minutes
                    "disable_idle_timeout": False
                }
            }
            
            # Only add avatar_id if it's configured and not placeholder
            if Config.HEYGEN_AVATAR_ID and Config.HEYGEN_AVATAR_ID != "your-avatar-id":
                config["avatar"]["params"]["avatar_id"] = Config.HEYGEN_AVATAR_ID
        
        # Merge with custom config
        if agent_config:
            # Don't overwrite nested configs, just top-level keys
            for key, value in agent_config.items():
                if key not in config:
                    config[key] = value
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Basic {self._get_auth_string()}"
        }
        
        try:
            print(f"🚀 Starting Agora Conversational AI agent...")
            print(f"   Channel: {channel_name}")
            print(f"   Agent UID: {agent_uid}")
            if enable_avatar:
                print(f"   Avatar enabled (UID: {avatar_uid})")
            
            response = requests.post(url, json=config, headers=headers)
            response.raise_for_status()
            result = response.json()
            
            print(f"✅ Agora Conversational AI agent started successfully")
            return result
            
        except requests.exceptions.HTTPError as e:
            error_msg = str(e)
            response_text = e.response.text if e.response else "No response"
            print(f"❌ Agora API Error: {error_msg}")
            print(f"   Response: {response_text}")
            return {"error": error_msg, "details": response_text}
        except Exception as e:
            print(f"❌ Error starting conversational AI: {e}")
            return {"error": str(e)}
    
    def stop_conversational_ai(
        self,
        channel_name: str,
        agent_uid: str
    ) -> Dict[str, Any]:
        """
        Stop Agora Conversational AI agent.
        
        Args:
            channel_name: Name of the channel
            agent_uid: UID of the agent to stop
        
        Returns:
            Response with status
        """
        # Use v2 API endpoint - interrupt/stop agent
        url = f"{self.base_url}/cn/api/conversational-ai-agent/v2/projects/{self.app_id}/agents/{agent_uid}/interrupt"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Basic {self._get_auth_string()}"
        }
        
        try:
            response = requests.post(url, json={}, headers=headers)
            response.raise_for_status()
            return {"status": "stopped", "agent_uid": agent_uid}
        except Exception as e:
            print(f"Error stopping conversational AI: {e}")
            return {"error": str(e)}
    
    def agent_speak(
        self,
        agent_uid: str,
        text: str
    ) -> Dict[str, Any]:
        """
        Make the conversational AI agent speak text using TTS.
        
        Args:
            agent_uid: UID of the agent
            text: Text for agent to speak
        
        Returns:
            Response with status
        """
        url = f"{self.base_url}/api/conversational-ai-agent/v2/projects/{self.app_id}/agents/{agent_uid}/speak"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Basic {self._get_auth_string()}"
        }
        
        payload = {
            "text": text
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error making agent speak: {e}")
            return {"error": str(e)}
    
    def send_message_to_agent(
        self,
        agent_uid: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send a message to the conversational AI agent.
        
        Args:
            agent_uid: UID of the agent
            message: Message to send
            metadata: Optional metadata
        
        Returns:
            Response from agent
        """
        url = f"{self.base_url}/v1/projects/{self.app_id}/rtc/conversational-ai/agents/{agent_uid}/messages"
        
        payload = {
            "message": message,
            "metadata": metadata or {}
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Basic {self._get_auth_string()}"
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error sending message to agent: {e}")
            return {"error": str(e)}
    
    def get_channel_users(self, channel_name: str) -> Dict[str, Any]:
        """
        Get list of users in a channel.
        
        Args:
            channel_name: Name of the channel
        
        Returns:
            List of users in the channel
        """
        url = f"{self.base_url}/dev/v1/channel/user/{self.app_id}/{channel_name}"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Basic {self._get_auth_string()}"
        }
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error getting channel users: {e}")
            return {"error": str(e), "users": []}
    
    def start_cloud_recording(
        self,
        channel_name: str,
        uid: str,
        recording_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Start cloud recording for a channel.
        
        Args:
            channel_name: Name of the channel
            uid: UID for the recording bot
            recording_config: Recording configuration
        
        Returns:
            Recording details
        """
        url = f"{self.base_url}/v1/apps/{self.app_id}/cloud_recording/resourceid"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Basic {self._get_auth_string()}"
        }
        
        payload = {
            "cname": channel_name,
            "uid": uid,
            "clientRequest": {
                "resourceExpiredHour": 24,
                "scene": 0
            }
        }
        
        try:
            # Acquire resource ID
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            resource_data = response.json()
            
            resource_id = resource_data.get("resourceId")
            
            # Start recording
            start_url = f"{self.base_url}/v1/apps/{self.app_id}/cloud_recording/resourceid/{resource_id}/mode/mix/start"
            
            start_payload = {
                "cname": channel_name,
                "uid": uid,
                "clientRequest": recording_config or {}
            }
            
            start_response = requests.post(start_url, json=start_payload, headers=headers)
            start_response.raise_for_status()
            
            return start_response.json()
            
        except Exception as e:
            print(f"Error starting cloud recording: {e}")
            return {"error": str(e)}
    
    def _get_auth_string(self) -> str:
        """Get base64 encoded auth string for API requests."""
        import base64
        auth_str = f"{self.api_key}:{self.api_secret}"
        return base64.b64encode(auth_str.encode()).decode()


class ConversationalAIAgent:
    """Wrapper for Agora Conversational AI with custom agent logic."""
    
    def __init__(self, agora_service: AgoraService):
        """Initialize conversational AI agent wrapper."""
        self.agora_service = agora_service
        self.channel_name: Optional[str] = None
        self.agent_uid: Optional[str] = None
        self.is_active = False
    
    def start(
        self,
        channel_name: str,
        greeting: Optional[str] = None,
        enable_avatar: bool = False
    ) -> Dict[str, Any]:
        """
        Start the conversational AI agent with optional HeyGen video avatar.
        
        Args:
            channel_name: Name of the channel to join
            greeting: Optional custom greeting message
            enable_avatar: Whether to enable HeyGen video avatar
        
        Returns:
            Agent details including channel info and agent_uid
        """
        agent_config = {
            "greeting": greeting or "Hello! I'm Luna, your AI productivity assistant. How can I help you today?",
        }
        
        result = self.agora_service.start_conversational_ai(
            channel_name=channel_name,
            agent_config=agent_config,
            enable_avatar=enable_avatar
        )
        
        if "error" not in result:
            self.channel_name = channel_name
            self.agent_uid = result.get("agent_uid") or result.get("uid")
            self.is_active = True
        
        return result
    
    def stop(self) -> Dict[str, Any]:
        """Stop the conversational AI agent."""
        if not self.is_active or not self.agent_uid:
            return {"error": "Agent is not active"}
        
        result = self.agora_service.stop_conversational_ai(
            channel_name=self.channel_name,
            agent_uid=self.agent_uid
        )
        
        self.is_active = False
        self.channel_name = None
        self.agent_uid = None
        
        return result
    
    def send_message(self, message: str) -> Dict[str, Any]:
        """Send a message to the agent."""
        if not self.is_active or not self.agent_uid:
            return {"error": "Agent is not active"}
        
        return self.agora_service.send_message_to_agent(
            agent_uid=self.agent_uid,
            message=message
        )
    
    def speak(self, text: str) -> Dict[str, Any]:
        """Make the agent speak text using TTS."""
        if not self.is_active or not self.agent_uid:
            return {"error": "Agent is not active"}
        
        return self.agora_service.agent_speak(
            agent_uid=self.agent_uid,
            text=text
        )


# Global service instances
agora_service = AgoraService()

