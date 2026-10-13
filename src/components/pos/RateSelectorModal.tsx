import { useState } from "react";
import {
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Globe,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { usePos } from "@/context/PosContext";
import { Modal } from "./Modal";
import { fmtBs } from "@/lib/money";
import type { RateVariant } from "@/types/rates";

export function RateSelectorModal() {
  const pos = usePos();
  const [manualInput, setManualInput] = useState(pos.rate.toFixed(2));
  const [customActive, setCustomActive] = useState(false);

  const ratesData = pos.ratesData;
  const isRefreshing = pos.isRefreshingRates;

  const handleApplyVariant = (variant: RateVariant) => {
    pos.setActiveRateVariant(variant.id);
  };

  const handleApplyManual = () => {
    const val = parseFloat(manualInput.replace(",", "."));
    if (val > 0 && val < 500000) {
      pos.setManualRate(val);
      setCustomActive(true);
    }
  };

  const formatTime = (ts: number) => {
    if (!ts) return "Reciente";
    return new Date(ts).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <Modal
      title="Monitor Multi-Divisas & Tasas de Cambio en Vivo"
      width="max-w-3xl"
      onClose={() => pos.setModal(null)}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Última sincronización: {formatTime(ratesData.lastUpdated)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pos.refreshRates()}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
              <span>{isRefreshing ? "Actualizando…" : "Actualizar ahora"}</span>
            </button>
            <button
              onClick={() => pos.setModal(null)}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Active Rate Banner */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tasa Activa en el TPV</span>
                <span className="rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                  EN OPERACIÓN
                </span>
              </div>
              <div className="font-mono text-2xl font-black text-foreground mt-0.5">
                Bs. {pos.rate.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">/ USD</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-medium text-muted-foreground">Equivalencia 1 Empanada ($1.50)</div>
            <div className="font-mono text-base font-bold text-primary">{fmtBs(1.5 * pos.rate)}</div>
          </div>
        </div>

        {/* Legal & Brecha Cambiaria Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-secondary/30 p-3.5 text-xs leading-relaxed text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Marco Legal SENIAT (Providencia 0071)</span>
            </div>
            Para facturación fiscal formal y cálculo del IGTF (3%), se recomienda mantener seleccionada la tasa <b>Oficial BCV</b>.
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-relaxed">
            <div className="flex items-center justify-between font-semibold text-amber-800 dark:text-amber-300 mb-1">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" />
                <span>Brecha Cambiaria (Diferencial)</span>
              </div>
              <span className="font-mono font-black text-sm">+{ratesData.spreadPct.toFixed(2)}%</span>
            </div>
            <span className="text-muted-foreground">Diferencia porcentual entre el Dólar Paralelo / Binance y la tasa Oficial BCV.</span>
          </div>
        </div>

        {/* Multi-source Rate Variants Grid */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vertientes & Mercados en Tiempo Real
            </h4>
            <span className="text-[11px] text-muted-foreground">Haz clic en "Aplicar" para usar como referencia en caja</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(ratesData.variants).map((variant) => {
              const isSelected = pos.rate === variant.price && ratesData.activeVariantId === variant.id;

              return (
                <div
                  key={variant.id}
                  className={`rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-border/80 hover:bg-secondary/20"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-xs font-bold text-foreground truncate">{variant.name}</span>
                      {variant.isOfficial && (
                        <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[9px] font-bold shrink-0">
                          OFICIAL
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xl font-extrabold text-foreground">
                      Bs. {variant.price.toFixed(2)}
                    </div>
                    {variant.buyPrice && variant.sellPrice && (
                      <div className="mt-1 text-[10px] font-mono text-muted-foreground">
                        C: {variant.buyPrice.toFixed(2)} · V: {variant.sellPrice.toFixed(2)}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground truncate" title={variant.sourceUrl}>
                      {variant.source === "monitordolarve" ? "monitordolarve.com" : variant.source === "monitordedivisa" ? "monitordedivisavzla" : "dolarapi.com"}
                    </span>
                    <button
                      onClick={() => handleApplyVariant(variant)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      {isSelected ? "Activa ✓" : "Aplicar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Source Health Diagnostics */}
        <div className="rounded-xl border border-border bg-secondary/20 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-primary" />
              <span>Fuentes de Consulta & Red de Contingencia</span>
            </span>
            <span className="text-[10px] text-muted-foreground">Conexión redundante en cascada</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {Object.entries(ratesData.sources).map(([key, src]) => {
              if (key === "manual") return null;
              const isUp = src.status === "online";

              return (
                <div key={key} className="rounded-lg border border-border/60 bg-card p-2 text-xs flex items-center justify-between">
                  <div className="truncate pr-2">
                    <div className="font-medium text-foreground truncate">{src.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{src.url.replace("https://", "")}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`h-2 w-2 rounded-full ${isUp ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <span className={`text-[10px] font-bold ${isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                      {isUp ? "OK" : "Reintentando"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Manual Custom Rate Override */}
        <div className="rounded-xl border border-border bg-card p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-xs font-semibold text-foreground">Ajuste Manual Personalizado</span>
              <p className="text-[11px] text-muted-foreground">Fuerza una tasa específica para contingencias offline</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">Bs.</span>
              <input
                type="text"
                inputMode="decimal"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyManual()}
                className="w-32 rounded-lg border border-input bg-background py-1.5 pl-8 pr-2.5 font-mono text-xs font-bold text-foreground outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={handleApplyManual}
              className="rounded-lg bg-secondary border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition"
            >
              Fijar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
