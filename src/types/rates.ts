export type RateSourceId = "monitordolarve" | "monitordedivisa" | "dolarapi" | "manual";

export interface RateVariant {
  id: string; // "bcv" | "binance" | "paralelo" | "euro" | "zelle" | "paypal" | "promedio"
  name: string;
  symbol: "USD" | "EUR" | "USDT";
  price: number;
  buyPrice?: number;
  sellPrice?: number;
  changePct?: number; // e.g. 0.4
  source: RateSourceId;
  sourceUrl: string;
  updatedAt: string;
  isOfficial?: boolean;
}

export interface SourceHealth {
  name: string;
  url: string;
  status: "online" | "degraded" | "offline";
  lastCheck: number;
  error?: string;
}

export interface MultiSourceRatesData {
  activeVariantId: string;
  activeRate: number;
  lastUpdated: number;
  autoRefresh: boolean;
  refreshIntervalMinutes: number;
  spreadPct: number; // Differential % between Parallel and BCV
  sources: Record<RateSourceId, SourceHealth>;
  variants: Record<string, RateVariant>;
}
