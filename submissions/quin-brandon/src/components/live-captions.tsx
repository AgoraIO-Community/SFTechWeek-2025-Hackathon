'use client'

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User, Bot } from "lucide-react"

interface LiveCaptionsProps {
  captions: Array<{ type: "user" | "ai"; text: string; timestamp?: number }>
}

function formatTime(timestamp?: number): string {
  if (!timestamp) return ""
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: true 
  })
}

export function LiveCaptions({ captions }: LiveCaptionsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new captions arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [captions])

  return (
    <Card className="bg-card border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Live Captions</h3>
        {captions.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {captions.length} {captions.length === 1 ? 'message' : 'messages'}
          </span>
        )}
      </div>

      <ScrollArea className="h-64">
        <div ref={scrollRef} className="p-4 space-y-4 max-h-64 overflow-y-auto">
          {captions.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
              <p>Start a conversation to see live captions...</p>
            </div>
          ) : (
            captions.map((caption, index) => (
              <div key={index} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    caption.type === "user" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"
                  }`}
                >
                  {caption.type === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      {caption.type === "user" ? "You" : "AI Avatar"}
                    </p>
                    {caption.timestamp && (
                      <span className="text-xs text-muted-foreground/60">
                        {formatTime(caption.timestamp)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{caption.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
