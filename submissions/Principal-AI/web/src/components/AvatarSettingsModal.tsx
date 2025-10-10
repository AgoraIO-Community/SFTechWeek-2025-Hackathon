"use client";

import { useTheme } from "@a24z/industry-theme";

interface AvatarSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceEmotion: string;
  setVoiceEmotion: (emotion: string) => void;
  voiceRate: number;
  setVoiceRate: (rate: number) => void;
}

export function AvatarSettingsModal({
  isOpen,
  onClose,
  voiceEmotion,
  setVoiceEmotion,
  voiceRate,
  setVoiceRate,
}: AvatarSettingsModalProps) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.colors.backgroundSecondary,
          padding: "2rem",
          borderRadius: "12px",
          border: `1px solid ${theme.colors.border}`,
          maxWidth: "500px",
          width: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "600", margin: 0 }}>Avatar Settings</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: theme.colors.text,
              padding: "0",
              lineHeight: "1",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Avatar Info */}
          <div
            style={{
              padding: "1rem",
              backgroundColor: theme.colors.background,
              borderRadius: "6px",
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <div style={{ fontSize: "0.9rem", color: theme.colors.textSecondary, marginBottom: "0.5rem" }}>
              Current Avatar
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: "500" }}>Katya (Chair Sitting)</div>
          </div>

          {/* Voice Emotion Selector */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.95rem", fontWeight: "500" }}>
              Voice Emotion
            </label>
            <select
              value={voiceEmotion}
              onChange={(e) => setVoiceEmotion(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              <option value="EXCITED">Excited</option>
              <option value="SERIOUS">Serious</option>
              <option value="FRIENDLY">Friendly</option>
              <option value="SOOTHING">Soothing</option>
              <option value="BROADCASTER">Broadcaster</option>
            </select>
          </div>

          {/* Voice Rate Slider */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.95rem", fontWeight: "500" }}>
              Speech Rate: {voiceRate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={voiceRate}
              onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
              style={{
                width: "100%",
                cursor: "pointer",
                height: "6px",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: theme.colors.textSecondary, marginTop: "0.25rem" }}>
              <span>0.5x (Slow)</span>
              <span>1.5x (Fast)</span>
            </div>
          </div>

          {/* Note about restart */}
          <div
            style={{
              padding: "0.75rem",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "6px",
              fontSize: "0.85rem",
              color: theme.colors.textSecondary,
            }}
          >
            💡 Changes will restart the avatar session
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: theme.colors.primary,
              color: theme.colors.background,
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "1rem",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
