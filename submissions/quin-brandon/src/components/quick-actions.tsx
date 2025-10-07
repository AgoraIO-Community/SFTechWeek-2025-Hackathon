import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Newspaper, TrendingUp, Star } from "lucide-react"

const actions = [
  { label: "Market Brief", icon: TrendingUp, description: "Get today's overview" },
  { label: "My Watchlist Update", icon: Star, description: "Check your stocks" },
  { label: "Market News", icon: Newspaper, description: "Latest headlines" },
]

export function QuickActions() {
  return (
    <Card className="bg-card border-border">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Quick Actions</h3>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto flex-col items-start p-4 gap-2 hover:bg-secondary/50 hover:border-primary bg-transparent"
          >
            <action.icon className="h-5 w-5 text-primary" />
            <div className="text-left">
              <div className="font-semibold text-sm text-foreground">{action.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{action.description}</div>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  )
}
