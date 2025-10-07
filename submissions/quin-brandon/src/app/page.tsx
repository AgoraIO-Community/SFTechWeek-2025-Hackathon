"use client"

import { useState } from "react"
import { AvatarSection } from "@/components/avatar-section"
import { ControlPanel } from "@/components/control-panel"
import { Header } from "@/components/header"

export default function MarketAvatarDashboard() {
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<"connected" | "disconnected">("connected")
  const [captions, setCaptions] = useState<Array<{ type: "user" | "ai"; text: string }>>([
    { type: "user", text: "Give me a market update" },
    { type: "ai", text: "The S&P 500 is up 0.8% today, driven by strong tech sector performance..." },
  ])

  const handleRecordingToggle = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      // Simulate adding a caption
      setTimeout(() => {
        setCaptions((prev) => [...prev, { type: "user", text: "What's the latest on AAPL?" }])
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <Header sessionStatus={sessionStatus} />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AvatarSection
            isRecording={isRecording}
            isMuted={isMuted}
            sessionStatus={sessionStatus}
            onRecordingToggle={handleRecordingToggle}
            onMuteToggle={() => setIsMuted(!isMuted)}
          />

          <ControlPanel captions={captions} />
        </div>
      </main>
    </div>
  )
}
