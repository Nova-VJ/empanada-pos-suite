import type { Product } from "@/types/pos";
import { fmtBs, fmtUsd } from "@/lib/money";

export function ProductCard({ product, rate, onAdd }: { product: Product; rate: number; onAdd: (p: Product, mod?: string) => void }) {
  const low = product.stockBar < 30;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onAdd(product)}
      onKeyDown={(e) => e.key === "Enter" && onAdd(product)}
      className="group flex cursor-pointer flex-col rounded-xl border border-slate-800 bg-slate-900 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-500/50 hover:bg-slate-800/70 active:scale-[0.97]"
    >
      <div className="flex items-start justify-between">
        <span className="text-4xl leading-none transition-transform group-hover:scale-110">{product.emoji}</span>
        <span className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] ${low ? "border-amber-500/20 bg-amber-500/10 text-amber-400" : "border-slate-700 bg-slate-800 text-slate-400"}`}>
          {product.stockBar} und
        </span>
      </div>
      <h3 className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-slate-100">{product.name}</h3>
      <div className="mt-2">
        <div className="font-mono text-lg font-bold text-slate-50">{fmtBs(product.priceUsd * rate)}</div>
        <div className="font-mono text-xs text-sky-400">{fmtUsd(product.priceUsd)} USD</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {product.modifiers.map((m) => (
          <button
            key={m}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(product, m);
            }}
            className="rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] text-slate-300 hover:border-sky-500/50 hover:text-sky-300"
          >
            + {m}
          </button>
        ))}
      </div>
    </div>
  );
}
