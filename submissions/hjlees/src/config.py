"""Configuration management for the application."""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration."""
    
    # Flask
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-change-in-production")
    ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = ENV == "development"
    
    # Appwrite
    APPWRITE_ENDPOINT = os.getenv("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1")
    APPWRITE_PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID")
    APPWRITE_API_KEY = os.getenv("APPWRITE_API_KEY")
    APPWRITE_DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID")
    APPWRITE_TODOS_COLLECTION_ID = os.getenv("APPWRITE_TODOS_COLLECTION_ID")
    APPWRITE_REMINDERS_COLLECTION_ID = os.getenv("APPWRITE_REMINDERS_COLLECTION_ID")
    
    # Groq
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    # ElevenLabs
    ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
    ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Default: Rachel
    ELEVENLABS_MODEL = os.getenv("ELEVENLABS_MODEL", "eleven_turbo_v2_5")
    
    # Agora
    AGORA_APP_ID = os.getenv("AGORA_APP_ID")
    AGORA_APP_CERTIFICATE = os.getenv("AGORA_APP_CERTIFICATE")
    AGORA_API_KEY = os.getenv("AGORA_API_KEY")
    AGORA_API_SECRET = os.getenv("AGORA_API_SECRET")
    
    # HeyGen
    HEYGEN_API_KEY = os.getenv("HEYGEN_API_KEY")
    HEYGEN_AVATAR_ID = os.getenv("HEYGEN_AVATAR_ID")
    HEYGEN_BASE_URL = "https://api.heygen.com/v2"
    
    @classmethod
    def validate(cls):
        """Validate required configuration."""
        required = [
            "APPWRITE_PROJECT_ID",
            "APPWRITE_API_KEY",
            "APPWRITE_DATABASE_ID",
            "GROQ_API_KEY",
            "AGORA_APP_ID",
        ]
        
        missing = [key for key in required if not getattr(cls, key)]
        
        if missing:
            raise ValueError(
                f"Missing required configuration: {', '.join(missing)}. "
                "Please check your .env file."
            )

