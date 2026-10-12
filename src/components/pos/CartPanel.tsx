import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart, Trash2, Receipt, CreditCard } from "lucide-react";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd, IGTF } from "@/lib/money";

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
    <aside className="cart-panel flex h-full flex-col overflow-hidden border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-secondary">
        <div className="flex items-center gap-2.5">
          <span key={pos.cartPulse} className="relative animate-in zoom-in-50 duration-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-primary">
              <ShoppingCart className="h-4 w-4" />
            </div>
            {count > 0 && <span className="absolute -right-1.5 -top-1.5 rounded-full bg-primary text-background px-1.5 text-[10px] font-bold ">{count}</span>}
          </span>
          <span className="font-sans text-base font-bold text-foreground">Ticket #{pos.nextOrder}</span>
        </div>
        {cart.length > 0 && (
          <Button variant="plain" onClick={pos.clearCart} className="text-xs text-muted-foreground hover:text-destructive transition">Vaciar</Button>
        )}
      </div>

      <div className="p-3 bg-background border-b border-border">
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg border border-border bg-background">
          {([["dine_in", "Comer Aquí"], ["takeout", "Para Llevar"]] as const).map(([v, l]) => (
            <Button variant="plain"
              key={v}
              onClick={() => pos.setOrderType(v)}
              className={`rounded-md py-2 text-xs font-semibold tracking-normal transition-all ${
                pos.orderType === v
                  ? "bg-accent-soft border border-accent/40 text-foreground "
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l}
            </Button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3">
        {cart.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Receipt className="h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">La comanda está vacía</p>
            
          </div>
        )}
        {cart.map((l) => {
          const p = products.find((x) => x.id === l.productId);
          if (!p) return null;
          return (
            <div key={l.lineId} className="rounded-lg border border-border bg-background p-3  transition hover:border-border">
              <div className="flex items-start gap-2.5">
                
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">{p.name}</div>
                  {l.modifiers.length > 0 && <div className="text-[11px] font-medium text-currency">+ {l.modifiers.join(", ")}</div>}
                  <div className="font-mono text-xs text-muted-foreground mt-0.5">{fmtBs(p.priceUsd * rate * l.qty)} · <span className="text-currency">{fmtUsd(p.priceUsd * l.qty)}</span></div>
                </div>
                <div className="flex items-center gap-1 bg-secondary p-1 rounded-md border border-border">
                  <Button variant="plain" aria-label="Reducir cantidad" title="Reducir cantidad" onClick={() => pos.setQty(l.lineId, l.qty - 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><Minus className="h-3 w-3" /></Button>
                  <span className="w-5 text-center font-mono text-xs font-bold text-foreground">{l.qty}</span>
                  <Button variant="plain" aria-label="Aumentar cantidad" title="Aumentar cantidad" onClick={() => pos.setQty(l.lineId, l.qty + 1)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><Plus className="h-3 w-3" /></Button>
                  <Button variant="plain" aria-label="Eliminar producto" title="Eliminar producto" onClick={() => pos.removeLine(l.lineId)} className="ml-1 rounded-lg p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
              <input
                value={l.note}
                onChange={(e) => pos.setNote(l.lineId, e.target.value.slice(0, 60))}
                placeholder="Nota cocina: Bien tostada, Sin salsa…"
                className="mt-2.5 w-full rounded-md border border-border bg-card px-2.5 py-1 text-xs text-currency placeholder:text-muted-foreground outline-none transition focus:border-primary/50"
              />
            </div>
          );
        })}
      </div>

      <div className="border-t border-border bg-background p-4">
        <div className="mb-3 flex gap-1.5">
          {DISCOUNTS.map((d) => (
            <Button variant="plain"
              key={d.label}
              onClick={() => pos.setDiscount(d.v)}
              className={`flex-1 rounded-md border py-1.5 text-xs font-semibold transition-all ${
                pos.discount === d.v
                  ? "border-primary bg-primary/20 text-currency"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.label}
            </Button>
          ))}
        </div>
        <dl className="space-y-1.5 font-mono text-xs">
          <Row label="Base Imponible (16% IVA)" bs={totals.baseBs} usd={r(totals.baseBs)} />
          <Row label="Débito Fiscal IVA (16%)" bs={totals.ivaBs} usd={r(totals.ivaBs)} />
          <div className="flex justify-between text-currency/90 text-[11px]">
            <dt>IGTF proyectado (3% divisas)</dt>
            <dd>máx. {fmtBs(totals.totalBs * IGTF)}</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
          <span className="text-xs font-bold uppercase tracking-normalr text-muted-foreground">Total a pagar</span>
          <div className="text-right">
            <div className="font-mono text-2xl font-black text-foreground">{fmtBs(totals.totalBs)}</div>
            <div className="font-mono text-sm font-bold text-currency">{fmtUsd(totals.totalUsd)} USD</div>
          </div>
        </div>
        <Button variant="plain"
          disabled={cart.length === 0}
          onClick={() => pos.setModal("payment")}
          className="mt-4 flex h-12 w-full justify-between rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="flex items-center gap-2"><CreditCard className="h-4 w-4" />Cobrar orden</span><span className="text-xs opacity-70">F10</span>
        </Button>
      </div>
    </aside>
  );
}

function Row({ label, bs, usd }: { label: string; bs: number; usd: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd className="text-foreground">{fmtBs(bs)} <span className="text-currency/90">/ {fmtUsd(usd)}</span></dd>
    </div>
  );
}
