import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"

const stocks = [
  { symbol: "AAPL", name: "Apple Inc.", price: 178.45, change: 2.34, changePercent: 1.33 },
  { symbol: "MSFT", name: "Microsoft", price: 412.78, change: -1.23, changePercent: -0.3 },
  { symbol: "GOOGL", name: "Alphabet", price: 142.56, change: 3.45, changePercent: 2.48 },
  { symbol: "TSLA", name: "Tesla", price: 245.89, change: 8.92, changePercent: 3.76 },
]

export function Watchlist() {
  return (
    <Card className="bg-card border-border">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Your Watchlist</h3>
      </div>

      <div className="divide-y divide-border">
        {stocks.map((stock) => (
          <Button
            key={stock.symbol}
            variant="ghost"
            className="w-full p-4 h-auto justify-start hover:bg-secondary/50 rounded-none"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground font-mono">{stock.symbol}</span>
                  <span className="text-xs text-muted-foreground">{stock.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-semibold text-foreground font-mono">${stock.price.toFixed(2)}</span>
                  <div
                    className={`flex items-center gap-1 text-xs font-semibold ${
                      stock.change >= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    {stock.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>
                      {stock.change >= 0 ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  )
}
