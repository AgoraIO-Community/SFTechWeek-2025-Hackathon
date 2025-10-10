import { NextRequest, NextResponse } from 'next/server';
import { marketService } from '../../../lib/services/MarketService';

export async function POST(request: NextRequest) {
  try {
    const { symbols, intent, action } = await request.json();

    if (action === 'market_brief') {
      const briefData = await marketService.getMarketBrief();
      return NextResponse.json(briefData);
    }

    if (action === 'headlines' || intent?.type === 'headlines') {
      const headlines = await marketService.getMarketNews(symbols, 5);
      return NextResponse.json({ headlines });
    }

    if (symbols && symbols.length > 0) {
      const quotes = await marketService.getQuotes(symbols);

      // Get news for specific symbols if requested
      const includeNews = intent?.type === 'ticker_stats' || intent?.type === 'compare';
      const headlines = includeNews ? await marketService.getMarketNews(symbols, 3) : [];

      return NextResponse.json({
        quotes,
        headlines: headlines.length > 0 ? headlines : undefined
      });
    }

    return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
  } catch (error) {
    console.error('Market API error:', error);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
  }

  // Mock single quote response
  const mockQuote = {
    symbol,
    price: Math.random() * 1000 + 100,
    change: (Math.random() - 0.5) * 20,
    change_percent: (Math.random() - 0.5) * 10,
    volume: Math.floor(Math.random() * 1000000),
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(mockQuote);
}