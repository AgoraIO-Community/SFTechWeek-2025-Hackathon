"""HeyGen Video Avatar integration."""
import requests
import time
from typing import Optional, Dict, Any, List

from config import Config


class HeyGenService:
    """Service for HeyGen Video Avatar API."""
    
    def __init__(self):
        """Initialize HeyGen service."""
        self.api_key = Config.HEYGEN_API_KEY
        self.base_url = Config.HEYGEN_BASE_URL
        self.avatar_id = Config.HEYGEN_AVATAR_ID
        self.headers = {
            "X-Api-Key": self.api_key,
            "Content-Type": "application/json"
        }
    
    def list_avatars(self) -> List[Dict[str, Any]]:
        """
        List available avatars.
        
        Returns:
            List of available avatars
        """
        url = f"{self.base_url}/avatars"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            return data.get("data", {}).get("avatars", [])
        except Exception as e:
            print(f"Error listing avatars: {e}")
            return []
    
    def list_voices(self) -> List[Dict[str, Any]]:
        """
        List available voices.
        
        Returns:
            List of available voices
        """
        url = f"{self.base_url}/voices"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            return data.get("data", {}).get("voices", [])
        except Exception as e:
            print(f"Error listing voices: {e}")
            return []
    
    def create_video(
        self,
        script: str,
        avatar_id: Optional[str] = None,
        voice_id: Optional[str] = None,
        background_color: str = "#FFFFFF",
        aspect_ratio: str = "16:9",
        title: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a video with avatar speaking the script.
        
        Args:
            script: Text for the avatar to speak
            avatar_id: Avatar ID (defaults to config)
            voice_id: Voice ID for the avatar
            background_color: Background color (hex)
            aspect_ratio: Video aspect ratio (16:9, 9:16, 1:1)
            title: Optional video title
        
        Returns:
            Video creation response with video_id
        """
        url = f"{self.base_url}/video/generate"
        
        avatar_id = avatar_id or self.avatar_id
        
        payload = {
            "video_inputs": [
                {
                    "character": {
                        "type": "avatar",
                        "avatar_id": avatar_id,
                        "avatar_style": "normal"
                    },
                    "voice": {
                        "type": "text",
                        "input_text": script
                    }
                }
            ],
            "dimension": {
                "width": 1920 if aspect_ratio == "16:9" else (1080 if aspect_ratio == "1:1" else 1080),
                "height": 1080 if aspect_ratio == "16:9" else (1080 if aspect_ratio == "1:1" else 1920)
            },
            "background_color": background_color,
            "aspect_ratio": aspect_ratio
        }
        
        if voice_id:
            payload["video_inputs"][0]["voice"]["voice_id"] = voice_id
        
        if title:
            payload["title"] = title
        
        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error creating video: {e}")
            return {"error": str(e)}
    
    def get_video_status(self, video_id: str) -> Dict[str, Any]:
        """
        Get the status of a video generation.
        
        Args:
            video_id: Video ID from create_video
        
        Returns:
            Video status information
        """
        url = f"{self.base_url}/video/status/{video_id}"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error getting video status: {e}")
            return {"error": str(e)}
    
    def wait_for_video(
        self,
        video_id: str,
        max_wait_seconds: int = 300,
        poll_interval: int = 5
    ) -> Dict[str, Any]:
        """
        Wait for video generation to complete.
        
        Args:
            video_id: Video ID from create_video
            max_wait_seconds: Maximum time to wait
            poll_interval: Seconds between status checks
        
        Returns:
            Final video status with download URL
        """
        elapsed = 0
        
        while elapsed < max_wait_seconds:
            status = self.get_video_status(video_id)
            
            if "error" in status:
                return status
            
            video_status = status.get("data", {}).get("status")
            
            if video_status == "completed":
                return status
            elif video_status == "failed":
                return {"error": "Video generation failed", "details": status}
            
            time.sleep(poll_interval)
            elapsed += poll_interval
        
        return {"error": "Video generation timed out"}
    
    def create_streaming_avatar(
        self,
        avatar_id: Optional[str] = None,
        voice_id: Optional[str] = None,
        quality: str = "low"
    ) -> Dict[str, Any]:
        """
        Create a streaming avatar session for real-time interaction.
        
        Args:
            avatar_id: Avatar ID (defaults to config)
            voice_id: Voice ID for the avatar
            quality: Video quality (low, medium, high)
        
        Returns:
            Streaming session details with session_id
        """
        # Use v1 endpoint for streaming (works with free tier)
        url = "https://api.heygen.com/v1/streaming.new"
        
        avatar_id = avatar_id or self.avatar_id
        
        payload = {
            "quality": quality,
        }
        
        # Only add avatar_id if it's configured and not the placeholder
        if avatar_id and avatar_id != "your-avatar-id":
            payload["avatar_id"] = avatar_id
        
        if voice_id:
            payload["voice_id"] = voice_id
        
        try:
            print(f"🎬 Attempting to create HeyGen streaming session at: {url}")
            print(f"   Payload: {payload}")
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            result = response.json()
            print(f"✅ HeyGen streaming session created successfully")
            return result
        except requests.exceptions.HTTPError as e:
            error_msg = str(e)
            status_code = e.response.status_code if e.response else None
            response_text = e.response.text if e.response else "No response"
            
            print(f"❌ HeyGen API Error ({status_code}): {error_msg}")
            print(f"   Response: {response_text}")
            
            # Provide helpful error messages
            if status_code == 404:
                return {
                    "error": "HeyGen Streaming API endpoint not found. This feature may require a HeyGen Enterprise account or the API structure may have changed.",
                    "hint": "The video avatar feature is optional. You can use voice chat instead.",
                    "status_code": 404
                }
            elif status_code == 401 or status_code == 403:
                return {
                    "error": "HeyGen API authentication failed. Please check your HEYGEN_API_KEY in .env",
                    "hint": "Make sure your HeyGen account has access to the Streaming API feature.",
                    "status_code": status_code
                }
            elif status_code == 429:
                return {
                    "error": "HeyGen API rate limit exceeded. Please wait and try again.",
                    "status_code": 429
                }
            else:
                return {
                    "error": f"HeyGen API error: {error_msg}",
                    "status_code": status_code
                }
        except Exception as e:
            print(f"❌ Error creating streaming avatar: {e}")
            return {
                "error": str(e),
                "hint": "The video avatar feature requires a HeyGen account with Streaming API access. This feature is optional."
            }
    
    def streaming_avatar_speak(
        self,
        session_id: str,
        text: str,
        task_type: str = "talk"
    ) -> Dict[str, Any]:
        """
        Make streaming avatar speak text.
        
        Args:
            session_id: Session ID from create_streaming_avatar
            text: Text for avatar to speak
            task_type: Type of task (talk, repeat)
        
        Returns:
            Task submission response
        """
        url = "https://api.heygen.com/v1/streaming.task"
        
        payload = {
            "session_id": session_id,
            "text": text,
            "task_type": task_type
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error making avatar speak: {e}")
            return {"error": str(e)}
    
    def stop_streaming_avatar(self, session_id: str) -> Dict[str, Any]:
        """
        Stop a streaming avatar session.
        
        Args:
            session_id: Session ID from create_streaming_avatar
        
        Returns:
            Stop response
        """
        url = "https://api.heygen.com/v1/streaming.stop"
        
        payload = {
            "session_id": session_id
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error stopping streaming avatar: {e}")
            return {"error": str(e)}
    
    def get_streaming_ice_servers(self, session_id: str) -> Dict[str, Any]:
        """
        Get ICE servers for WebRTC connection.
        
        Args:
            session_id: Session ID from create_streaming_avatar
        
        Returns:
            ICE server configuration
        """
        url = "https://api.heygen.com/v1/streaming.ice"
        
        payload = {
            "session_id": session_id
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error getting ICE servers: {e}")
            return {"error": str(e)}


class StreamingAvatarSession:
    """Wrapper for managing a HeyGen streaming avatar session."""
    
    def __init__(self, heygen_service: HeyGenService):
        """Initialize streaming avatar session."""
        self.heygen_service = heygen_service
        self.session_id: Optional[str] = None
        self.is_active = False
        self.avatar_id: Optional[str] = None
    
    def start(
        self,
        avatar_id: Optional[str] = None,
        voice_id: Optional[str] = None,
        quality: str = "low"
    ) -> Dict[str, Any]:
        """
        Start a streaming avatar session.
        
        Args:
            avatar_id: Avatar ID
            voice_id: Voice ID
            quality: Video quality
        
        Returns:
            Session details
        """
        result = self.heygen_service.create_streaming_avatar(
            avatar_id=avatar_id,
            voice_id=voice_id,
            quality=quality
        )
        
        if "error" not in result:
            self.session_id = result.get("data", {}).get("session_id")
            self.avatar_id = avatar_id
            self.is_active = True
        
        return result
    
    def speak(self, text: str) -> Dict[str, Any]:
        """Make the avatar speak."""
        if not self.is_active or not self.session_id:
            return {"error": "Session is not active"}
        
        return self.heygen_service.streaming_avatar_speak(
            session_id=self.session_id,
            text=text
        )
    
    def stop(self) -> Dict[str, Any]:
        """Stop the streaming session."""
        if not self.is_active or not self.session_id:
            return {"error": "Session is not active"}
        
        result = self.heygen_service.stop_streaming_avatar(self.session_id)
        
        self.is_active = False
        self.session_id = None
        self.avatar_id = None
        
        return result
    
    def get_ice_servers(self) -> Dict[str, Any]:
        """Get ICE servers for WebRTC."""
        if not self.is_active or not self.session_id:
            return {"error": "Session is not active"}
        
        return self.heygen_service.get_streaming_ice_servers(self.session_id)


# Global service instance
heygen_service = HeyGenService()

