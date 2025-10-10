"""Text-to-Speech service using ElevenLabs."""
from elevenlabs import ElevenLabs
from typing import Optional
import io

from config import Config


class TTSService:
    """Text-to-Speech service using ElevenLabs."""
    
    def __init__(self):
        """Initialize ElevenLabs client."""
        if Config.ELEVENLABS_API_KEY and Config.ELEVENLABS_API_KEY != "your-elevenlabs-api-key":
            self.client = ElevenLabs(api_key=Config.ELEVENLABS_API_KEY)
            self.voice_id = Config.ELEVENLABS_VOICE_ID
            self.model = Config.ELEVENLABS_MODEL or "eleven_turbo_v2_5"
            self.enabled = True
        else:
            self.client = None
            self.enabled = False
    
    def text_to_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        model: Optional[str] = None,
        stability: float = 0.5,
        similarity_boost: float = 0.75,
        style: float = 0.0,
        use_speaker_boost: bool = True
    ) -> bytes:
        """
        Convert text to speech audio.
        
        Args:
            text: The text to convert to speech
            voice_id: ElevenLabs voice ID (defaults to config)
            model: ElevenLabs model (defaults to config)
            stability: Voice stability (0.0-1.0)
            similarity_boost: Voice similarity boost (0.0-1.0)
            style: Voice style exaggeration (0.0-1.0)
            use_speaker_boost: Whether to use speaker boost
        
        Returns:
            Audio data as bytes (MP3 format)
        """
        if not self.enabled or not self.client:
            raise Exception("ElevenLabs is not configured")
        
        voice_id = voice_id or self.voice_id
        model = model or self.model
        
        try:
            # Generate audio using ElevenLabs (newer API)
            audio_generator = self.client.text_to_speech.convert(
                voice_id=voice_id,
                text=text,
                model_id=model,
                voice_settings={
                    "stability": stability,
                    "similarity_boost": similarity_boost,
                    "style": style,
                    "use_speaker_boost": use_speaker_boost
                }
            )
            
            # Collect audio chunks
            audio_data = b"".join(audio_generator)
            
            return audio_data
            
        except Exception as e:
            print(f"Error generating speech: {e}")
            raise
    
    def text_to_speech_stream(
        self,
        text: str,
        voice_id: Optional[str] = None,
        model: Optional[str] = None,
        stability: float = 0.5,
        similarity_boost: float = 0.75,
        style: float = 0.0,
        use_speaker_boost: bool = True
    ):
        """
        Convert text to speech audio with streaming.
        
        Args:
            text: The text to convert to speech
            voice_id: ElevenLabs voice ID (defaults to config)
            model: ElevenLabs model (defaults to config)
            stability: Voice stability (0.0-1.0)
            similarity_boost: Voice similarity boost (0.0-1.0)
            style: Voice style exaggeration (0.0-1.0)
            use_speaker_boost: Whether to use speaker boost
        
        Yields:
            Audio chunks as bytes
        """
        if not self.enabled or not self.client:
            raise Exception("ElevenLabs is not configured")
        
        voice_id = voice_id or self.voice_id
        model = model or self.model
        
        try:
            # Generate audio using ElevenLabs with streaming (newer API)
            audio_generator = self.client.text_to_speech.convert(
                voice_id=voice_id,
                text=text,
                model_id=model,
                voice_settings={
                    "stability": stability,
                    "similarity_boost": similarity_boost,
                    "style": style,
                    "use_speaker_boost": use_speaker_boost
                }
            )
            
            # Stream audio chunks
            for chunk in audio_generator:
                yield chunk
                
        except Exception as e:
            print(f"Error streaming speech: {e}")
            raise
    
    def get_available_voices(self):
        """Get list of available voices."""
        if not self.enabled or not self.client:
            return []
        
        try:
            voices = self.client.voices.get_all()
            return voices.voices if hasattr(voices, 'voices') else voices
        except Exception as e:
            print(f"Error getting voices: {e}")
            return []
    
    def get_voice_info(self, voice_id: Optional[str] = None):
        """Get information about a specific voice."""
        if not self.enabled or not self.client:
            return None
        
        voice_id = voice_id or self.voice_id
        
        try:
            voice = self.client.voices.get(voice_id)
            return voice
        except Exception as e:
            print(f"Error getting voice info: {e}")
            return None


# Global TTS service instance
tts_service = TTSService()

