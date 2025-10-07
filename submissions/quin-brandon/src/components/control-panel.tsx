import { LiveCaptions } from "@/components/live-captions"
import { Watchlist } from "@/components/watchlist"
import { QuickActions } from "@/components/quick-actions"

interface ControlPanelProps {
  captions: Array<{ type: "user" | "ai"; text: string }>
}

export function ControlPanel({ captions }: ControlPanelProps) {
  return (
    <div className="space-y-4">
      <LiveCaptions captions={captions} />
      <Watchlist />
      <QuickActions />
    </div>
  )
}
