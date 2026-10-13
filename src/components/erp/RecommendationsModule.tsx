import { useState } from "react";
import { AlertTriangle, CheckCircle2, PackageX, ShoppingBag, Target, TrendingUp, Truck, Users } from "lucide-react";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";

const segmentColors: Record<string, string> = {
  VIP: "bg-module-cash-light text-module-cash",
  Regular: "bg-module-sales-light text-module-sales",
  Ocasional: "bg-secondary text-muted-foreground",
  Inactivo: "bg-module-expenses-light text-module-expenses",
};

const dimensionLabels: Record<string, string> = {
  precio: "Precio",
  calidad: "Calidad",
  plazo: "Plazo entrega",
  moq: "Pedido mín. (MOQ)",
  sostenibilidad: "Sostenibilidad",
  cercania: "Cercanía",
  condiciones_pago: "Cond. pago",
  comunicacion: "Comunicación",
};

const crossSellPairs = [
  { nameA: "Empanada de Pabellón Criollo", nameB: "Malta Polar 355ml (Bien Fría)", count: 84, uplift: "+28%" },
  { nameA: "Empanada de Carne Mechada", nameB: "Porción Extra Salsa Guasacaca", count: 71, uplift: "+24%" },
  { nameA: "Empanada de Queso Llanero", nameB: "Porción de Nata Criolla", count: 63, uplift: "+22%" },
  { nameA: "Cachito de Jamón Ahumado", nameB: "Café con Leche / Marrón 8oz", count: 49, uplift: "+19%" },
  { nameA: "Empanada de Cazón Margariteño", nameB: "Jugo Natural de Parchita 16oz", count: 44, uplift: "+17%" },
];

export function RecommendationsModule() {
  const pos = usePos();
  const { suppliers, customers, products, rate } = pos;
  const [tab, setTab] = useState<"scoring" | "customers" | "slowmoving" | "crosssell">("scoring");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id ?? "sup-1");

  const selectedScore = suppliers.find((s) => s.id === selectedSupplierId) ?? suppliers[0];
  const slowMoving = products
    .filter((p) => p.category === "Horneados" || p.priceUsd >= 2.5)
    .slice(0, 6)
    .map((p) => ({
      ...p,
      stockValueUsd: p.stockBar * p.costUsd,
    }));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Recomendaciones e Inteligencia</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Scoring multicriterio de proveedores, segmentación RFM de clientes, rotación de stock y patrones Cross-Sell
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-2">
        {[
          { id: "scoring", label: "Scoring Proveedores", icon: Truck },
          { id: "customers", label: "Clientes RFM", icon: Users },
          { id: "slowmoving", label: "Slow-Moving / Capital", icon: PackageX },
          { id: "crosssell", label: "Cross-Sell & Combos", icon: ShoppingBag },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "scoring" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="border-b border-border px-5 py-3.5 bg-secondary/30">
              <h3 className="text-sm font-semibold text-foreground">Ranking de Proveedores Evaluados</h3>
            </div>
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Proveedor</th>
                  <th className="px-4 py-3 font-semibold">Rubro</th>
                  <th className="px-4 py-3 font-semibold">Score Global</th>
                  <th className="px-4 py-3 font-semibold">Nivel</th>
                  <th className="px-4 py-3 w-[40px]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...suppliers]
                  .sort((a, b) => b.score - a.score)
                  .map((s, i) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSupplierId(s.id)}
                      className={`cursor-pointer transition-colors ${
                        selectedSupplierId === s.id ? "bg-primary/5" : "hover:bg-secondary/30"
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{s.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.category}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${s.score}%` }} />
                          </div>
                          <span className="font-mono font-bold text-foreground">{s.score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            s.score >= 75
                              ? "bg-module-inventory-light text-module-inventory"
                              : s.score >= 55
                              ? "bg-module-cash-light text-module-cash"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {s.score >= 75 ? "Excelente" : s.score >= 55 ? "Aceptable" : "Mejorable"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {s.redFlags.length > 0 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Detail panel */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-foreground mb-4">Detalle de Scoring (8 Dimensiones)</h3>
            {selectedScore ? (
              <div className="space-y-4">
                <div className="text-center rounded-xl bg-secondary/40 p-4 border border-border">
                  <div className="text-4xl font-black font-mono text-primary">{selectedScore.score}</div>
                  <p className="text-xs font-semibold text-foreground mt-1">{selectedScore.name}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedScore.rif}</p>
                </div>
                <div className="space-y-2.5">
                  {Object.entries(selectedScore.dimensions).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-28 truncate">{dimensionLabels[key] ?? key}</span>
                      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-module-suppliers rounded-full" style={{ width: `${val}%` }} />
                      </div>
                      <span className="text-xs font-mono font-bold w-8 text-right">{val}</span>
                    </div>
                  ))}
                </div>
                {selectedScore.strengths.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">Fortalezas</p>
                    {selectedScore.strengths.map((st) => (
                      <div key={st} className="flex items-center gap-1.5 text-xs text-module-inventory mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedScore.weaknesses.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">Oportunidades de mejora</p>
                    {selectedScore.weaknesses.map((w) => (
                      <div key={w} className="flex items-center gap-1.5 text-xs text-module-cash mb-1">
                        <Target className="h-3.5 w-3.5 shrink-0" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedScore.redFlags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-destructive mb-1">Señales de Alerta</p>
                    {selectedScore.redFlags.map((r) => (
                      <div key={r} className="text-xs text-destructive font-medium">
                        • {r}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {tab === "customers" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(["VIP", "Regular", "Ocasional", "Inactivo"] as const).map((seg) => {
              const count = customers.filter((c) => c.segment === seg).length;
              return (
                <div key={seg} className="rounded-xl border border-border bg-card p-4 text-center shadow-xs">
                  <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${segmentColors[seg]}`}>{seg}</span>
                  <div className="text-2xl font-bold text-foreground mt-2">{count}</div>
                  <p className="text-xs text-muted-foreground">clientes</p>
                </div>
              );
            })}
          </div>
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cliente / Empresa</th>
                  <th className="px-4 py-3 font-semibold">RIF</th>
                  <th className="px-4 py-3 font-semibold">Segmento RFM</th>
                  <th className="px-4 py-3 font-semibold text-right">Órdenes</th>
                  <th className="px-4 py-3 font-semibold text-right">Total Gastado (USD)</th>
                  <th className="px-4 py-3 font-semibold text-right">Equivalente Bs.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-semibold text-foreground">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{c.rif}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${segmentColors[c.segment]}`}>
                        {c.segment}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{c.orderCount}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-module-inventory">{fmtUsd(c.totalSpentUsd)}</td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">{fmtBs(c.totalSpentUsd * rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "slowmoving" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="border-b border-border px-5 py-3.5 bg-secondary/30 flex items-center gap-2">
            <PackageX className="h-4 w-4 text-module-customers" />
            <h3 className="text-sm font-semibold text-foreground">
              Análisis de Capital Inmovilizado en Barra y Cocina
            </h3>
          </div>
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Producto</th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold text-right">Stock Actual</th>
                <th className="px-4 py-3 font-semibold text-right">Costo Unit.</th>
                <th className="px-4 py-3 font-semibold text-right">Capital en Stock (USD / Bs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {slowMoving.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {p.emoji} {p.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-3 text-right font-mono">{p.stockBar}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtUsd(p.costUsd)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-module-expenses">
                    {fmtUsd(p.stockValueUsd)} ({fmtBs(p.stockValueUsd * rate)})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "crosssell" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="border-b border-border px-5 py-3.5 bg-secondary/30 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-module-sales" />
            <h3 className="text-sm font-semibold text-foreground">
              Productos Frecuentemente Comprados Juntos (Sugerencias para Combos en TPV)
            </h3>
          </div>
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Producto Principal (A)</th>
                <th className="px-4 py-3 font-semibold">Complemento Ideal (B)</th>
                <th className="px-4 py-3 font-semibold text-right">Frecuencia en Tickets</th>
                <th className="px-4 py-3 font-semibold text-right">Impacto Ticket Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {crossSellPairs.map((pair, i) => (
                <tr key={i} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 font-semibold text-foreground">{pair.nameA}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{pair.nameB}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="rounded-md bg-secondary px-2 py-0.5 font-mono font-bold">{pair.count}x</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-module-inventory">{pair.uplift}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
