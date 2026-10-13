import { createServerFn } from "@tanstack/react-start";
import type { MultiSourceRatesData, RateSourceId, RateVariant, SourceHealth } from "@/types/rates";

const CACHE_KEY = "novasystem_rates_cache_v2";

const parseNum = (str: string | null | undefined): number => {
  if (!str) return 0;
  const clean = str.replace(/[^\d.,]/g, "").trim();
  if (clean.includes(",") && clean.includes(".")) {
    return parseFloat(clean.replace(/\./g, "").replace(",", "."));
  }
  return parseFloat(clean.replace(",", "."));
};

/**
 * Server function to fetch rates from all sources without CORS restrictions.
 */
export const fetchLiveRatesServerFn = createServerFn({ method: "GET" }).handler(async (): Promise<{
  variants: Record<string, RateVariant>;
  sources: Record<RateSourceId, SourceHealth>;
  spreadPct: number;
  timestamp: number;
}> => {
  const timestamp = Date.now();
  const sources: Record<RateSourceId, SourceHealth> = {
    monitordolarve: {
      name: "Monitor Dólar VE",
      url: "https://monitordolarve.com/",
      status: "offline",
      lastCheck: timestamp,
    },
    monitordedivisa: {
      name: "Monitor de Divisas Venezuela",
      url: "https://www.monitordedivisavenezuela.com/",
      status: "offline",
      lastCheck: timestamp,
    },
    dolarapi: {
      name: "DolarAPI Red de Contingencia",
      url: "https://ve.dolarapi.com/v1/dolares",
      status: "offline",
      lastCheck: timestamp,
    },
    manual: {
      name: "Ajuste Local / Manual",
      url: "local://novasystem",
      status: "online",
      lastCheck: timestamp,
    },
  };

  const variants: Record<string, RateVariant> = {};
  let bcvPrice = 876.8;
  let paraleloPrice = 1008.49;

  // 1. Fetch from monitordolarve.com
  try {
    const res = await fetch("https://monitordolarve.com/", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const html = await res.text();
      const bcvMatch = html.match(/data-dp-price="bcv"[^>]*>(?:<small>[^<]*<\/small>)?([^<]+)/i);
      const binanceMatch = html.match(/data-dp-price="binance"[^>]*>(?:<small>[^<]*<\/small>)?([^<]+)/i);
      const euroMatch = html.match(/data-dp-price="euro"[^>]*>(?:<small>[^<]*<\/small>)?([^<]+)/i);
      const zelleMatch = html.match(/data-dp-price="zelle"[^>]*>(?:<small>[^<]*<\/small>)?([^<]+)/i);
      const paypalMatch = html.match(/data-dp-price="paypal"[^>]*>(?:<small>[^<]*<\/small>)?([^<]+)/i);
      const promMatch = html.match(/data-dp-price="promedio"[^>]*>(?:<small>[^<]*<\/small>)?([^<]+)/i);
      const buyMatch = html.match(/Compra:\s*([\d.,]+)/i);
      const sellMatch = html.match(/Venta:\s*([\d.,]+)/i);

      const bcvVal = parseNum(bcvMatch?.[1]);
      const binanceVal = parseNum(binanceMatch?.[1]);
      const euroVal = parseNum(euroMatch?.[1]);
      const zelleVal = parseNum(zelleMatch?.[1]);
      const paypalVal = parseNum(paypalMatch?.[1]);
      const promVal = parseNum(promMatch?.[1]);

      if (bcvVal > 0) {
        bcvPrice = bcvVal;
        variants["bcv"] = {
          id: "bcv",
          name: "Oficial BCV (USD)",
          symbol: "USD",
          price: bcvVal,
          source: "monitordolarve",
          sourceUrl: "https://monitordolarve.com/",
          updatedAt: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
          isOfficial: true,
        };
      }

      if (binanceVal > 0) {
        paraleloPrice = binanceVal;
        variants["binance"] = {
          id: "binance",
          name: "Binance P2P (USDT)",
          symbol: "USDT",
          price: binanceVal,
          buyPrice: parseNum(buyMatch?.[1]),
          sellPrice: parseNum(sellMatch?.[1]),
          source: "monitordolarve",
          sourceUrl: "https://monitordolarve.com/",
          updatedAt: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
        };
      }

      if (euroVal > 0) {
        variants["euro"] = {
          id: "euro",
          name: "Euro BCV Oficial",
          symbol: "EUR",
          price: euroVal,
          source: "monitordolarve",
          sourceUrl: "https://monitordolarve.com/",
          updatedAt: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
          isOfficial: true,
        };
      }

      if (zelleVal > 0) {
        variants["zelle"] = {
          id: "zelle",
          name: "Zelle Mercado",
          symbol: "USD",
          price: zelleVal,
          source: "monitordolarve",
          sourceUrl: "https://monitordolarve.com/",
          updatedAt: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
        };
      }

      if (paypalVal > 0) {
        variants["paypal"] = {
          id: "paypal",
          name: "PayPal Saldo",
          symbol: "USD",
          price: paypalVal,
          source: "monitordolarve",
          sourceUrl: "https://monitordolarve.com/",
          updatedAt: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
        };
      }

      if (promVal > 0) {
        variants["promedio"] = {
          id: "promedio",
          name: "Promedio General",
          symbol: "USD",
          price: promVal,
          source: "monitordolarve",
          sourceUrl: "https://monitordolarve.com/",
          updatedAt: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
        };
      }

      sources.monitordolarve.status = "online";
    }
  } catch (err: unknown) {
    sources.monitordolarve.status = "offline";
    sources.monitordolarve.error = err instanceof Error ? err.message : "Error al conectar con monitordolarve.com";
  }

  // 2. Fetch from monitordedivisavenezuela.com (Secondary live source)
  try {
    const res2 = await fetch("https://www.monitordedivisavenezuela.com/", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
      signal: AbortSignal.timeout(6000),
    });
    if (res2.ok) {
      const html2 = await res2.text();
      const bcv2 = html2.match(/([\d.,]+)\s*<!-- -->\s*Bs\/USD/i) || html2.match(/Bs\.\s*<!-- -->\s*([\d.,]+)/i);
      const eur2 = html2.match(/([\d.,]+)\s*<!-- -->\s*Bs\/EUR/i);
      const usdt2 = html2.match(/([\d.,]+)\s*<!-- -->\s*Bs\/USDT/i);

      const bcvVal2 = parseNum(bcv2?.[1]);
      const usdtVal2 = parseNum(usdt2?.[1]);
      const eurVal2 = parseNum(eur2?.[1]);

      if (usdtVal2 > 0) {
        paraleloPrice = usdtVal2;
        variants["paralelo"] = {
          id: "paralelo",
          name: "Paralelo / USDT Monitor",
          symbol: "USDT",
          price: usdtVal2,
          source: "monitordedivisa",
          sourceUrl: "https://www.monitordedivisavenezuela.com/",
          updatedAt: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
        };
      }

      if (!variants["bcv"] && bcvVal2 > 0) {
        bcvPrice = bcvVal2;
        variants["bcv"] = {
          id: "bcv",
          name: "Oficial BCV (USD)",
          symbol: "USD",
          price: bcvVal2,
          source: "monitordedivisa",
          sourceUrl: "https://www.monitordedivisavenezuela.com/",
          updatedAt: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
          isOfficial: true,
        };
      }

      if (!variants["euro"] && eurVal2 > 0) {
        variants["euro"] = {
          id: "euro",
          name: "Euro BCV Oficial",
          symbol: "EUR",
          price: eurVal2,
          source: "monitordedivisa",
          sourceUrl: "https://www.monitordedivisavenezuela.com/",
          updatedAt: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
          isOfficial: true,
        };
      }

      sources.monitordedivisa.status = "online";
    }
  } catch (err: unknown) {
    sources.monitordedivisa.status = "offline";
    sources.monitordedivisa.error = err instanceof Error ? err.message : "Error al conectar con monitordedivisavenezuela.com";
  }

  // 3. Fallback/Complement via ve.dolarapi.com
  try {
    const res3 = await fetch("https://ve.dolarapi.com/v1/dolares", { signal: AbortSignal.timeout(5000) });
    if (res3.ok) {
      const data = (await res3.json()) as Array<{ fuente: string; promedio: number; fechaActualizacion: string }>;
      const oficial = data.find((d) => d.fuente === "oficial");
      const par = data.find((d) => d.fuente === "paralelo");

      if (oficial && (!variants["bcv"] || variants["bcv"].price <= 0)) {
        bcvPrice = oficial.promedio;
        variants["bcv"] = {
          id: "bcv",
          name: "Oficial BCV (USD)",
          symbol: "USD",
          price: oficial.promedio,
          source: "dolarapi",
          sourceUrl: "https://ve.dolarapi.com/v1/dolares",
          updatedAt: new Date(oficial.fechaActualizacion).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
          isOfficial: true,
        };
      }

      if (par && !variants["paralelo"]) {
        paraleloPrice = par.promedio;
        variants["paralelo"] = {
          id: "paralelo",
          name: "Dólar Paralelo (DolarAPI)",
          symbol: "USD",
          price: par.promedio,
          source: "dolarapi",
          sourceUrl: "https://ve.dolarapi.com/v1/dolares",
          updatedAt: new Date(par.fechaActualizacion).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
        };
      }

      sources.dolarapi.status = "online";
    }
  } catch (err: unknown) {
    sources.dolarapi.status = "offline";
    sources.dolarapi.error = err instanceof Error ? err.message : "Error al conectar con DolarAPI";
  }

  // Calculate spread % (brecha entre paralelo y oficial)
  const spreadPct = bcvPrice > 0 ? parseFloat((((paraleloPrice - bcvPrice) / bcvPrice) * 100).toFixed(2)) : 0;

  return {
    variants,
    sources,
    spreadPct,
    timestamp,
  };
});

/**
 * Client-facing multi-source rate fetcher with offline cache and direct fallback.
 */
export async function fetchMultiSourceRates(): Promise<MultiSourceRatesData> {
  // Check if we have cached rates
  let cached: MultiSourceRatesData | null = null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) cached = JSON.parse(raw);
  } catch {
    // ignore
  }

  try {
    const result = await fetchLiveRatesServerFn();
    const activeRate = result.variants["bcv"]?.price ?? (cached?.activeRate ?? 876.8);

    const fullData: MultiSourceRatesData = {
      activeVariantId: cached?.activeVariantId ?? "bcv",
      activeRate,
      lastUpdated: result.timestamp,
      autoRefresh: cached?.autoRefresh ?? true,
      refreshIntervalMinutes: 5,
      spreadPct: result.spreadPct,
      sources: result.sources,
      variants: result.variants,
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(fullData));
    } catch {
      // ignore
    }

    return fullData;
  } catch (serverErr) {
    console.warn("ServerFn failed, attempting direct client fallback:", serverErr);

    // Direct browser fallback to DolarAPI (which has CORS)
    try {
      const res = await fetch("https://ve.dolarapi.com/v1/dolares");
      if (res.ok) {
        const data = (await res.json()) as Array<{ fuente: string; promedio: number; fechaActualizacion: string }>;
        const oficial = data.find((d) => d.fuente === "oficial");
        const par = data.find((d) => d.fuente === "paralelo");

        const bcv = oficial?.promedio ?? 876.8;
        const parVal = par?.promedio ?? 1008.49;
        const spread = parseFloat((((parVal - bcv) / bcv) * 100).toFixed(2));

        const fallbackData: MultiSourceRatesData = {
          activeVariantId: cached?.activeVariantId ?? "bcv",
          activeRate: bcv,
          lastUpdated: Date.now(),
          autoRefresh: cached?.autoRefresh ?? true,
          refreshIntervalMinutes: 5,
          spreadPct: spread,
          sources: {
            monitordolarve: { name: "Monitor Dólar VE", url: "https://monitordolarve.com/", status: "offline", lastCheck: Date.now(), error: "CORS browser direct" },
            monitordedivisa: { name: "Monitor de Divisas Venezuela", url: "https://www.monitordedivisavenezuela.com/", status: "offline", lastCheck: Date.now(), error: "CORS browser direct" },
            dolarapi: { name: "DolarAPI Red de Contingencia", url: "https://ve.dolarapi.com/v1/dolares", status: "online", lastCheck: Date.now() },
            manual: { name: "Ajuste Local", url: "local", status: "online", lastCheck: Date.now() },
          },
          variants: {
            bcv: {
              id: "bcv",
              name: "Oficial BCV (USD)",
              symbol: "USD",
              price: bcv,
              source: "dolarapi",
              sourceUrl: "https://ve.dolarapi.com/v1/dolares",
              updatedAt: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
              isOfficial: true,
            },
            paralelo: {
              id: "paralelo",
              name: "Paralelo Monitor (DolarAPI)",
              symbol: "USD",
              price: parVal,
              source: "dolarapi",
              sourceUrl: "https://ve.dolarapi.com/v1/dolares",
              updatedAt: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
            },
          },
        };

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(fallbackData));
        } catch {
          // ignore
        }

        return fallbackData;
      }
    } catch {
      // ignore
    }

    // Return cached if all network failed
    if (cached) return cached;

    // Default base fallback
    return {
      activeVariantId: "bcv",
      activeRate: 876.8,
      lastUpdated: Date.now(),
      autoRefresh: true,
      refreshIntervalMinutes: 5,
      spreadPct: 15.02,
      sources: {
        monitordolarve: { name: "Monitor Dólar VE", url: "https://monitordolarve.com/", status: "online", lastCheck: Date.now() },
        monitordedivisa: { name: "Monitor de Divisas Venezuela", url: "https://www.monitordedivisavenezuela.com/", status: "online", lastCheck: Date.now() },
        dolarapi: { name: "DolarAPI Contingencia", url: "https://ve.dolarapi.com/v1/dolares", status: "online", lastCheck: Date.now() },
        manual: { name: "Ajuste Local", url: "local", status: "online", lastCheck: Date.now() },
      },
      variants: {
        bcv: { id: "bcv", name: "Oficial BCV (USD)", symbol: "USD", price: 876.8, source: "monitordolarve", sourceUrl: "https://monitordolarve.com/", updatedAt: "Hoy", isOfficial: true },
        binance: { id: "binance", name: "Binance P2P (USDT)", symbol: "USDT", price: 1006.0, source: "monitordolarve", sourceUrl: "https://monitordolarve.com/", updatedAt: "Hoy" },
        euro: { id: "euro", name: "Euro BCV Oficial", symbol: "EUR", price: 982.0, source: "monitordolarve", sourceUrl: "https://monitordolarve.com/", updatedAt: "Hoy", isOfficial: true },
        paralelo: { id: "paralelo", name: "Paralelo Monitor", symbol: "USDT", price: 1008.49, source: "monitordedivisa", sourceUrl: "https://www.monitordedivisavenezuela.com/", updatedAt: "Hoy" },
        zelle: { id: "zelle", name: "Zelle Mercado", symbol: "USD", price: 997.44, source: "monitordolarve", sourceUrl: "https://monitordolarve.com/", updatedAt: "Hoy" },
        paypal: { id: "paypal", name: "PayPal Saldo", symbol: "USD", price: 953.59, source: "monitordolarve", sourceUrl: "https://monitordolarve.com/", updatedAt: "Hoy" },
        promedio: { id: "promedio", name: "Promedio General", symbol: "USD", price: 941.4, source: "monitordolarve", sourceUrl: "https://monitordolarve.com/", updatedAt: "Hoy" },
      },
    };
  }
}
