import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd, IGTF } from "@/lib/money";
import { toast } from "sonner";

const DISCOUNTS: { label: string; v: number }[] = [
  { label: "0%", v: 0 },
  { label: "5%", v: 5 },
  { label: "10%", v: 10 },
  { label: "Cortesía", v: 100 },
];

export function CartPanel() {
  const pos = usePos();
  const { cart, products, totals, rate } = pos;
  const count = cart.reduce((a, l) => a + l.qty, 0);
  const r = (bs: number) => bs / rate;

  return (
    <aside className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-secondary/40">
        <div className="flex items-center gap-2.5">
          <span key={pos.cartPulse} className="relative animate-in zoom-in-50 duration-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-module-sales-light text-module-sales">
              <ShoppingCart className="h-4 w-4" />
            </div>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 rounded-full bg-primary text-primary-foreground px-1.5 text-[10px] font-bold shadow-xs">
                {count}
              </span>
            )}
          </span>
          <div>
            <span className="text-sm font-semibold text-foreground">Ticket #{pos.nextOrder}</span>
            <p className="text-[11px] text-muted-foreground">Tasa BCV: Bs. {rate.toFixed(2)}</p>
          </div>
        </div>
        {cart.length > 0 && (
          <button onClick={pos.clearCart} className="text-xs font-medium text-muted-foreground hover:text-destructive transition">
            Vaciar
          </button>
        )}
      </div>

      <div className="p-2.5 bg-secondary/20 border-b border-border">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-secondary">
          {([["dine_in", "🍽️ En Local"], ["takeout", "🛵 Delivery"], ["pickup", "🛍️ Pickup"]] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => pos.setOrderType(v)}
              className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                pos.orderType === v
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {cart.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-module-sales-light flex items-center justify-center text-3xl mb-3">
              🥟
            </div>
            <p className="text-sm font-medium text-foreground">La comanda está vacía</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-[200px]">
              Selecciona cualquier producto del catálogo o escanea código para agregar
            </p>
          </div>
        )}
        {cart.map((l) => {
          const p = products.find((x) => x.id === l.productId);
          if (!p) return null;
          return (
            <div key={l.lineId} className="rounded-xl border border-border bg-background p-2.5 shadow-2xs transition hover:border-primary/30">
              <div className="flex items-start gap-2">
                <span className="text-xl">{p.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-foreground">{p.name}</div>
                  {l.modifiers.length > 0 && (
                    <div className="text-[11px] font-medium text-primary">+ {l.modifiers.join(", ")}</div>
                  )}
                  <div className="font-mono text-xs text-muted-foreground mt-0.5">
                    {fmtBs(p.priceUsd * rate * l.qty)} ·{" "}
                    <span className="font-semibold text-module-inventory">{fmtUsd(p.priceUsd * l.qty)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 bg-secondary p-0.5 rounded-lg border border-border">
                  <button
                    onClick={() => pos.setQty(l.lineId, l.qty - 1)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-card hover:text-foreground"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center font-mono text-xs font-bold text-foreground">{l.qty}</span>
                  <button
                    onClick={() => pos.setQty(l.lineId, l.qty + 1)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-card hover:text-foreground"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => pos.removeLine(l.lineId)}
                    className="ml-0.5 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <input
                value={l.note}
                onChange={(e) => pos.setNote(l.lineId, e.target.value.slice(0, 60))}
                placeholder="Nota cocina: Bien tostada, Sin salsa…"
                className="mt-2 w-full rounded-lg border border-input bg-secondary/50 px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary"
              />
            </div>
          );
        })}
      </div>

      <div className="border-t border-border bg-gradient-to-b from-card to-secondary/30 p-4 space-y-3">
        {/* Selector Modo Fiscal vs Control Interno */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/80 p-1 text-[11px]">
          <button
            type="button"
            onClick={() => pos.updateCompanySettings({ operationMode: "control_interno" })}
            className={`flex-1 rounded-lg py-1.5 font-bold transition-all ${
              pos.companySettings.operationMode !== "fiscal_seniat"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📋 Control Interno (0% IVA)
          </button>
          <button
            type="button"
            onClick={() => pos.updateCompanySettings({ operationMode: "fiscal_seniat" })}
            className={`flex-1 rounded-lg py-1.5 font-bold transition-all ${
              pos.companySettings.operationMode === "fiscal_seniat"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🧾 Factura Fiscal (16%)
          </button>
        </div>

        {/* Descuentos rápidos */}
        <div className="flex gap-1.5">
          {DISCOUNTS.map((d) => (
            <button
              key={d.label}
              onClick={() => pos.setDiscount(d.v)}
              className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition-all ${
                pos.discount === d.v
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Desglose impositivo */}
        <dl className="space-y-1 font-mono text-xs pt-1">
          {pos.companySettings.operationMode === "fiscal_seniat" ? (
            <>
              <Row label="Base Imponible (16% IVA)" bs={totals.baseBs} usd={r(totals.baseBs)} />
              <Row label="Débito Fiscal IVA (16%)" bs={totals.ivaBs} usd={r(totals.ivaBs)} />
              <div className="flex justify-between text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                <dt>IGTF Proyectado (3% Divisas)</dt>
                <dd>máx. {fmtBs(totals.totalBs * IGTF)}</dd>
              </div>
            </>
          ) : (
            <>
              <Row label="Subtotal Nota de Control" bs={totals.baseBs} usd={r(totals.baseBs)} />
              <div className="flex justify-between text-violet-600 dark:text-violet-400 text-[11px] font-sans font-semibold">
                <dt>Modo Control Interno</dt>
                <dd className="font-mono">Exento / Sin IVA (0%)</dd>
              </div>
            </>
          )}
        </dl>

        {/* Gran Pantalla Digital de Total (Digital Display) */}
        <div className="rounded-2xl border border-border/80 bg-slate-900 p-4 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 h-24 w-24 rounded-full bg-primary/20 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Total a Liquidar</span>
            <span className="font-mono text-emerald-400">En Caja 🥟</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="font-mono text-2xl sm:text-3xl font-black tracking-tight text-white">
              {fmtBs(totals.totalBs)}
            </div>
            <div className="font-mono text-base font-extrabold text-emerald-400">
              {fmtUsd(totals.totalUsd)} <span className="text-xs text-slate-400">USD</span>
            </div>
          </div>
        </div>

        {/* Botón Cobrar Orden */}
        <button
          disabled={cart.length === 0}
          onClick={() => {
            if (!pos.shift.isOpen) {
              toast.error("La caja se encuentra CERRADA. Abre la caja del día ingresando el fondo en Bolívares para poder procesar pagos.");
              pos.setModal("shift");
              return;
            }
            pos.setModal("payment");
          }}
          className="w-full rounded-2xl bg-gradient-to-r from-primary to-indigo-600 py-3.5 text-sm font-black tracking-wide text-white shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 select-none flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>💳 COBRAR ORDEN</span>
          <span className="rounded-md bg-black/20 px-2 py-0.5 text-xs font-mono font-normal">F10 o Espacio</span>
        </button>
      </div>
    </aside>
  );
}

function Row({ label, bs, usd }: { label: string; bs: number; usd: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd className="text-foreground font-medium">
        {fmtBs(bs)} <span className="text-module-inventory">/ {fmtUsd(usd)}</span>
      </dd>
    </div>
  );
}
