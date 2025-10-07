import { User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface HeaderProps {
  sessionStatus: "connected" | "disconnected"
}

export function Header({ sessionStatus }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Market Avatar</h1>
            <Badge
              variant={sessionStatus === "connected" ? "default" : "secondary"}
              className={sessionStatus === "connected" ? "bg-success text-foreground" : ""}
            >
              {sessionStatus === "connected" ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground font-mono">
              <span>Session:</span>
              <span className="text-foreground">00:12:34</span>
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
