import type { Product } from "@/types/pos";
import { fmtBs, fmtUsd } from "@/lib/money";

export function ProductCard({ product, rate, onAdd }: { product: Product; rate: number; onAdd: (p: Product, mod?: string) => void }) {
  const low = product.stockBar < 25;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onAdd(product)}
      onKeyDown={(e) => e.key === "Enter" && onAdd(product)}
      className="group flex cursor-pointer flex-col justify-between rounded-xl border border-border bg-card p-3.5 text-left shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-module-sales-light text-2xl transition-transform group-hover:scale-105">
            {product.emoji}
          </div>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
              low
                ? "bg-module-expenses-light text-module-expenses"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {product.stockBar} disp
          </span>
        </div>
        <h3 className="mt-2.5 line-clamp-2 min-h-[2.25rem] text-xs font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>
      </div>

      <div className="mt-2.5 pt-2 border-t border-border/70">
        <div className="flex items-baseline justify-between">
          <div className="font-mono text-sm font-bold text-foreground">{fmtBs(product.priceUsd * rate)}</div>
          <div className="rounded-md bg-module-inventory-light px-1.5 py-0.5 font-mono text-[11px] font-bold text-module-inventory">
            {fmtUsd(product.priceUsd)}
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
                className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
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
