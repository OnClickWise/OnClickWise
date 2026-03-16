export interface MarketItem {
  symbol: string;
  name: string;
  price: string;
  changePercent: number;
}

const BRAPI_TOKEN = 'nqCTAyoKAbHLUAgPQzcyWn';
const BASE_URL = 'https://brapi.dev/api';

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getBrazilianMarketData(): Promise<{
  currencies: MarketItem[];
  stocks: MarketItem[];
} | null> {
  const currencyUrl = `${BASE_URL}/v2/currency?currency=USD-BRL,EUR-BRL&token=${BRAPI_TOKEN}`;
  const cryptoUrl = `${BASE_URL}/v2/crypto?coin=BTC,ETH&currency=BRL&token=${BRAPI_TOKEN}`;
  const stocksUrl = `${BASE_URL}/quote/PETR4,VALE3,ITUB4,BBDC4?token=${BRAPI_TOKEN}`;

  const [currencyData, cryptoData, stocksData] = await Promise.all([
    fetchJson<any>(currencyUrl),
    fetchJson<any>(cryptoUrl),
    fetchJson<any>(stocksUrl),
  ]);

  const currencies: MarketItem[] = [];
  const stocks: MarketItem[] = [];

  const rawCurrencies = currencyData?.currency;
  if (Array.isArray(rawCurrencies)) {
    for (const curr of rawCurrencies) {
      if (!curr?.name || !curr?.ask) continue;
      currencies.push({
        symbol: curr.name === 'USD' ? 'USD/BRL' : 'EUR/BRL',
        name: curr.name === 'USD' ? 'Dolar' : 'Euro',
        price: Number(curr.ask).toFixed(2),
        changePercent: Number(curr.pctChange || 0),
      });
    }
  }

  const rawCrypto = cryptoData?.coins;
  if (Array.isArray(rawCrypto)) {
    for (const coin of rawCrypto) {
      if (!coin?.coin || !coin?.coinName) continue;
      currencies.push({
        symbol: `${coin.coin}/BRL`,
        name: coin.coinName,
        price: Number(coin.regularMarketPrice || 0).toLocaleString('pt-BR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
        changePercent: Number(coin.regularMarketChangePercent || 0),
      });
    }
  }

  const rawStocks = stocksData?.results;
  if (Array.isArray(rawStocks)) {
    for (const stock of rawStocks) {
      if (!stock?.symbol) continue;
      stocks.push({
        symbol: stock.symbol,
        name: String(stock.longName || stock.shortName || stock.symbol).split(' ')[0],
        price: Number(stock.regularMarketPrice || 0).toFixed(2),
        changePercent: Number(stock.regularMarketChangePercent || 0),
      });
    }
  }

  return { currencies, stocks };
}
