import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User, Bot } from "lucide-react"

interface LiveCaptionsProps {
  captions: Array<{ type: "user" | "ai"; text: string }>
}

export function LiveCaptions({ captions }: LiveCaptionsProps) {
  return (
    <Card className="bg-card border-border">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Live Captions</h3>
      </div>

      <ScrollArea className="h-64 p-4">
        <div className="space-y-4">
          {captions.map((caption, index) => (
            <div key={index} className="flex gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  caption.type === "user" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"
                }`}
              >
                {caption.type === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  {caption.type === "user" ? "You" : "AI Avatar"}
                </p>
                <p className="text-sm text-foreground leading-relaxed">{caption.text}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}
