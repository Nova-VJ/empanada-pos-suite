import type { Product } from "@/types/pos";
import { fmtBs, fmtUsd } from "@/lib/money";

export function ProductCard({ product, rate, onAdd }: { product: Product; rate: number; onAdd: (p: Product, mod?: string) => void }) {
  const low = product.stockBar < 25;
  const isFood = product.kitchen;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onAdd(product)}
      onKeyDown={(e) => e.key === "Enter" && onAdd(product)}
      className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-border/80 bg-card p-3 text-left shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg active:scale-[0.98] select-none overflow-hidden"
    >
      {/* Decorative subtle ambient tint on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

      <div>
        <div className="flex items-start justify-between gap-2">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-xs transition-transform duration-200 group-hover:scale-110 group-active:scale-95 ${
              isFood
                ? "bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-orange-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                : "bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-indigo-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20"
            }`}
          >
            {product.emoji}
          </div>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tracking-tight transition-colors ${
              low
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                : "bg-secondary text-muted-foreground border border-border/60"
            }`}
          >
            {product.stockBar} disp
          </span>
        </div>

        <h3 className="mt-3 line-clamp-2 min-h-[2.5rem] text-xs font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>
      </div>

      <div className="mt-3 pt-2.5 border-t border-border/70">
        <div className="flex items-baseline justify-between gap-1">
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-base font-black text-foreground tracking-tight">
              {fmtUsd(product.priceUsd)}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">USD</span>
          </div>
          <div className="font-mono text-[11px] font-semibold text-muted-foreground">
            {fmtBs(product.priceUsd * rate)}
          </div>
        </div>

        {product.modifiers.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.modifiers.map((m) => (
              <button
                key={m}
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(product, m);
                }}
                className="rounded-lg border border-border bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
              >
                + {m}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
