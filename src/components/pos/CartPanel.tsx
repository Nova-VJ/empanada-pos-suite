import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
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
    <aside className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <span key={pos.cartPulse} className="relative animate-in zoom-in-50 duration-300">
            <ShoppingCart className="h-5 w-5 text-emerald-400" />
            {count > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">{count}</span>}
          </span>
          <span className="ml-1 font-semibold text-slate-100">Ticket #{pos.nextOrder}</span>
        </div>
        {cart.length > 0 && (
          <button onClick={pos.clearCart} className="text-xs text-slate-400 hover:text-rose-400">Vaciar</button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5 p-3">
        {([["dine_in", "🍽️ Para Comer Aquí"], ["takeout", "🥡 Para Llevar"]] as const).map(([v, l]) => (
          <button key={v} onClick={() => pos.setOrderType(v)} className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${pos.orderType === v ? "border-emerald-500/50 bg-emerald-600/15 text-emerald-300" : "border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200"}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3">
        {cart.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center text-sm text-slate-500">
            <span className="text-4xl">🥟</span>
            <p className="mt-2">Toca un producto para agregarlo</p>
            <p className="mt-1 text-xs">Atajo: <kbd className="rounded bg-slate-800 px-1">/</kbd> para buscar</p>
          </div>
        )}
        {cart.map((l) => {
          const p = products.find((x) => x.id === l.productId);
          if (!p) return null;
          return (
            <div key={l.lineId} className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 animate-in slide-in-from-right-4">
              <div className="flex items-start gap-2">
                <span className="text-xl">{p.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-100">{p.name}</div>
                  {l.modifiers.length > 0 && <div className="text-[11px] text-sky-400">+ {l.modifiers.join(", ")}</div>}
                  <div className="font-mono text-xs text-slate-400">{fmtBs(p.priceUsd * rate * l.qty)} · {fmtUsd(p.priceUsd * l.qty)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => pos.setQty(l.lineId, l.qty - 1)} className="rounded-md bg-slate-800 p-1 text-slate-300 hover:bg-slate-700"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-6 text-center font-mono text-sm font-bold text-slate-100">{l.qty}</span>
                  <button onClick={() => pos.setQty(l.lineId, l.qty + 1)} className="rounded-md bg-slate-800 p-1 text-slate-300 hover:bg-slate-700"><Plus className="h-3.5 w-3.5" /></button>
                  <button onClick={() => pos.removeLine(l.lineId)} className="ml-1 rounded-md p-1 text-slate-500 hover:bg-rose-600/20 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <input
                value={l.note}
                onChange={(e) => pos.setNote(l.lineId, e.target.value.slice(0, 60))}
                placeholder="Nota cocina: Bien tostada, Sin salsa…"
                className="mt-2 w-full rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-amber-300 placeholder:text-slate-600 outline-none focus:border-amber-500/40"
              />
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-800 p-3">
        <div className="mb-3 flex gap-1.5">
          {DISCOUNTS.map((d) => (
            <button key={d.label} onClick={() => pos.setDiscount(d.v)} className={`flex-1 rounded-md border py-1 text-xs font-medium ${pos.discount === d.v ? "border-sky-500/30 bg-sky-950/60 text-sky-400" : "border-slate-800 text-slate-400 hover:text-slate-200"}`}>
              {d.label}
            </button>
          ))}
        </div>
        <dl className="space-y-1 font-mono text-xs">
          <Row label="Base Imponible (16% IVA)" bs={totals.baseBs} usd={r(totals.baseBs)} />
          <Row label="Débito Fiscal IVA (16%)" bs={totals.ivaBs} usd={r(totals.ivaBs)} />
          <div className="flex justify-between text-amber-400/90">
            <dt>IGTF proyectado (3% divisas)</dt>
            <dd>máx. {fmtBs(totals.totalBs * IGTF)}</dd>
          </div>
        </dl>
        <div className="mt-3 flex items-end justify-between rounded-xl border border-sky-500/30 bg-sky-950/40 px-3 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Total a pagar</span>
          <div className="text-right">
            <div className="font-mono text-2xl font-bold text-slate-50">{fmtBs(totals.totalBs)}</div>
            <div className="font-mono text-sm text-sky-400">{fmtUsd(totals.totalUsd)} USD</div>
          </div>
        </div>
        <button
          disabled={cart.length === 0}
          onClick={() => pos.setModal("payment")}
          className="mt-3 w-full rounded-xl bg-emerald-600 py-4 text-base font-bold tracking-wide text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          💳 COBRAR ORDEN <span className="opacity-70">(F10)</span>
        </button>
      </div>
    </aside>
  );
}

function Row({ label, bs, usd }: { label: string; bs: number; usd: number }) {
  return (
    <div className="flex justify-between text-slate-400">
      <dt>{label}</dt>
      <dd className="text-slate-200">{fmtBs(bs)} <span className="text-sky-400/80">/ {fmtUsd(usd)}</span></dd>
    </div>
  );
}
