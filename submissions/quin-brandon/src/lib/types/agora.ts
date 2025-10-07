/**
 * Agora Type Definitions
 */

export interface AgoraTokenRequest {
  channelName: string;
  uid: number;
  role?: 'publisher' | 'subscriber';
}

export interface AgoraTokenResponse {
  token: string;
  appId: string;
  channelName: string;
  uid: number;
  expiresAt: number;
}

export interface AgoraState {
  isInitialized: boolean;
  isJoined: boolean;
  isPublishing: boolean;
  audioLevel: number;        // 0-100
  isSpeaking: boolean;       // Voice activity detection
  transcription: string;     // Final transcription
  interimText: string;       // Partial/interim results
  error: string | null;
  channelName: string | null;
  uid: number | null;
}

export interface VoiceActivityConfig {
  threshold: number;         // Audio level threshold (0-100)
  smoothing: number;         // Smoothing factor for audio level
  minDuration: number;       // Min ms of speech to trigger
}

export interface TranscriptionResult {
  text: string;
  isFinal: boolean;
  confidence?: number;
  timestamp: number;
}

