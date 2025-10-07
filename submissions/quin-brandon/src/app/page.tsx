"use client"

import { useState, useEffect } from "react"
import { AvatarSection } from "@/components/avatar-section"
import { ControlPanel } from "@/components/control-panel"
import { Header } from "@/components/header"
import { useConversation } from "@/hooks/useConversation"

export default function MarketAvatarDashboard() {
  const [isMuted, setIsMuted] = useState(false)

  // Use Agora Conversational AI hook
  const { 
    isActive, 
    isLoading, 
    error,
    captions,
    toggleConversation 
  } = useConversation()

  // Determine session status based on conversation state
  const sessionStatus = isActive ? "connected" : "disconnected"

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('[Dashboard] Conversation error:', error)
    }
  }, [error])

  const handleRecordingToggle = async () => {
    await toggleConversation()
  }

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <Header sessionStatus={sessionStatus} />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AvatarSection
            isRecording={isActive}
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
