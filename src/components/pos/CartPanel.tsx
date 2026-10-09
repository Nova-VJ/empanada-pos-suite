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
    <aside className="flex h-full flex-col rounded-3xl border border-[#1b3530] bg-[#122623] shadow-2xl shadow-black/40 overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#1b3530] px-5 py-3.5 bg-[#142b27]">
        <div className="flex items-center gap-2.5">
          <span key={pos.cartPulse} className="relative animate-in zoom-in-50 duration-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1b3a34] text-[#cca06a]">
              <ShoppingCart className="h-4 w-4" />
            </div>
            {count > 0 && <span className="absolute -right-1.5 -top-1.5 rounded-full bg-[#cca06a] text-[#0b1a18] px-1.5 text-[10px] font-bold shadow-sm">{count}</span>}
          </span>
          <span className="font-serif text-base font-bold text-[#fbf8f1]">Ticket #{pos.nextOrder}</span>
        </div>
        {cart.length > 0 && (
          <button onClick={pos.clearCart} className="text-xs text-[#a6b9b0] hover:text-[#c85a48] transition">Vaciar</button>
        )}
      </div>

      <div className="p-3 bg-[#0e1f1c] border-b border-[#1b3530]">
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl border border-[#1b3530] bg-[#0a1614]">
          {([["dine_in", "🍽️ Comer Aquí"], ["takeout", "🥡 Para Llevar"]] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => pos.setOrderType(v)}
              className={`rounded-xl py-2 text-xs font-semibold tracking-wide transition-all ${
                pos.orderType === v
                  ? "bg-[#183831] border border-[#2ea88c]/40 text-[#fbf8f1] shadow-sm"
                  : "text-[#8ea399] hover:text-[#fbf8f1]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {cart.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center text-[#7e948a]">
            <span className="text-4xl">🥟</span>
            <p className="mt-3 text-sm font-medium text-[#a6b9b0]">La comanda está vacía</p>
            <p className="mt-1 text-xs text-[#6d847b]">Toca cualquier empanada para sumar al pedido</p>
          </div>
        )}
        {cart.map((l) => {
          const p = products.find((x) => x.id === l.productId);
          if (!p) return null;
          return (
            <div key={l.lineId} className="rounded-2xl border border-[#1b3530] bg-[#0c1816] p-3 shadow-sm transition hover:border-[#274f45]">
              <div className="flex items-start gap-2.5">
                <span className="text-xl">{p.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[#fbf8f1]">{p.name}</div>
                  {l.modifiers.length > 0 && <div className="text-[11px] font-medium text-[#e0ab77]">+ {l.modifiers.join(", ")}</div>}
                  <div className="font-mono text-xs text-[#8fa49b] mt-0.5">{fmtBs(p.priceUsd * rate * l.qty)} · <span className="text-[#e0ab77]">{fmtUsd(p.priceUsd * l.qty)}</span></div>
                </div>
                <div className="flex items-center gap-1 bg-[#142b27] p-1 rounded-xl border border-[#1b3530]">
                  <button onClick={() => pos.setQty(l.lineId, l.qty - 1)} className="rounded-lg p-1 text-[#a6b9b0] hover:bg-[#1a3832] hover:text-white"><Minus className="h-3 w-3" /></button>
                  <span className="w-5 text-center font-mono text-xs font-bold text-[#fbf8f1]">{l.qty}</span>
                  <button onClick={() => pos.setQty(l.lineId, l.qty + 1)} className="rounded-lg p-1 text-[#a6b9b0] hover:bg-[#1a3832] hover:text-white"><Plus className="h-3 w-3" /></button>
                  <button onClick={() => pos.removeLine(l.lineId)} className="ml-1 rounded-lg p-1 text-[#8fa49b] hover:bg-[#c85a48]/20 hover:text-[#e07a68]"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
              <input
                value={l.note}
                onChange={(e) => pos.setNote(l.lineId, e.target.value.slice(0, 60))}
                placeholder="Nota cocina: Bien tostada, Sin salsa…"
                className="mt-2.5 w-full rounded-xl border border-[#1b3530] bg-[#122623] px-2.5 py-1 text-xs text-[#e0ab77] placeholder:text-[#5a6f66] outline-none transition focus:border-[#cca06a]/50"
              />
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#1b3530] bg-[#0e1f1c] p-4">
        <div className="mb-3 flex gap-1.5">
          {DISCOUNTS.map((d) => (
            <button
              key={d.label}
              onClick={() => pos.setDiscount(d.v)}
              className={`flex-1 rounded-xl border py-1.5 text-xs font-semibold transition-all ${
                pos.discount === d.v
                  ? "border-[#cca06a] bg-[#cca06a]/20 text-[#e0ab77]"
                  : "border-[#1b3530] bg-[#0c1816] text-[#8fa49b] hover:text-[#fbf8f1]"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <dl className="space-y-1.5 font-mono text-xs">
          <Row label="Base Imponible (16% IVA)" bs={totals.baseBs} usd={r(totals.baseBs)} />
          <Row label="Débito Fiscal IVA (16%)" bs={totals.ivaBs} usd={r(totals.ivaBs)} />
          <div className="flex justify-between text-[#e0ab77]/90 text-[11px]">
            <dt>IGTF proyectado (3% divisas)</dt>
            <dd>máx. {fmtBs(totals.totalBs * IGTF)}</dd>
          </div>
        </dl>
        <div className="mt-3.5 flex items-end justify-between rounded-2xl border border-[#cca06a]/30 bg-[#16332c] px-4 py-3 shadow-inner">
          <span className="text-xs font-bold uppercase tracking-wider text-[#a6b9b0]">Total a pagar</span>
          <div className="text-right">
            <div className="font-mono text-2xl font-black text-[#fbf8f1]">{fmtBs(totals.totalBs)}</div>
            <div className="font-mono text-sm font-bold text-[#e0ab77]">{fmtUsd(totals.totalUsd)} USD</div>
          </div>
        </div>
        <button
          disabled={cart.length === 0}
          onClick={() => pos.setModal("payment")}
          className="mt-3 w-full rounded-2xl bg-gradient-to-r from-[#cca06a] to-[#dca872] py-4 text-base font-extrabold tracking-wide text-[#0b1a18] shadow-lg shadow-[#cca06a]/25 transition hover:from-[#dca872] hover:to-[#ebd09b] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          💳 COBRAR ORDEN <span className="opacity-70">(F10)</span>
        </button>
      </div>
    </aside>
  );
}

function Row({ label, bs, usd }: { label: string; bs: number; usd: number }) {
  return (
    <div className="flex justify-between text-[#8fa49b]">
      <dt>{label}</dt>
      <dd className="text-[#fbf8f1]">{fmtBs(bs)} <span className="text-[#e0ab77]/90">/ {fmtUsd(usd)}</span></dd>
    </div>
  );
}
