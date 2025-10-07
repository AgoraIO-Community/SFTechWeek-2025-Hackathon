"use client"

import { Mic, MicOff, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AvatarSectionProps {
  isRecording: boolean
  isMuted: boolean
  sessionStatus: "connected" | "disconnected"
  onRecordingToggle: () => void
  onMuteToggle: () => void
}

export function AvatarSection({
  isRecording,
  isMuted,
  sessionStatus,
  onRecordingToggle,
  onMuteToggle,
}: AvatarSectionProps) {
  return (
    <div className="space-y-4">
      <Card className="bg-card border-border overflow-hidden">
        <div className="aspect-video bg-secondary/50 relative flex items-center justify-center">
          {/* Placeholder for HeyGen avatar video */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-secondary/10" />
          <div className="relative z-10 text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
              <Radio className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">Market Avatar</p>
              <Badge variant="outline" className="text-xs">
                {isRecording ? "Listening..." : "Ready"}
              </Badge>
            </div>
          </div>

          {/* Voice activity indicator */}
          {isRecording && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 20 + 10}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card className="bg-card border-border p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Voice Controls</h3>
            <Badge variant="outline" className={sessionStatus === "connected" ? "border-success text-success" : ""}>
              <div className="w-2 h-2 rounded-full bg-current mr-2" />
              {sessionStatus === "connected" ? "Live" : "Offline"}
            </Badge>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onRecordingToggle}
              size="lg"
              className={`flex-1 ${
                isRecording
                  ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }`}
            >
              <Mic className="mr-2 h-5 w-5" />
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>

            <Button onClick={onMuteToggle} size="lg" variant={isMuted ? "destructive" : "secondary"}>
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">Click to speak with your AI market analyst</p>
        </div>
      </Card>
    </div>
  )
}
