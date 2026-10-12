import { Button } from "@/components/ui/button";
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
      className="group flex cursor-pointer flex-col justify-between rounded-lg border border-border bg-card p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:bg-secondary hover: hover: active:scale-[0.98]"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-secondary text-2xl  group-hover:scale-110 group-hover:border-primary/50 transition-all">
            {product.emoji}
          </div>
          <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${low ? "border-destructive/40 bg-destructive/15 text-destructive" : "border-border bg-background text-muted-foreground"}`}>
            {product.stockBar} disp
          </span>
        </div>
        <h3 className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>
      </div>

      <div className="mt-3 pt-2.5 border-t border-border/80">
        <div className="flex items-baseline justify-between">
          <div className="font-mono text-base font-bold text-foreground">{fmtBs(product.priceUsd * rate)}</div>
          <div className="font-mono text-xs font-semibold text-warning">{fmtUsd(product.priceUsd)}</div>
        </div>

        {product.modifiers.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {product.modifiers.map((m) => (
              <Button variant="plain"
                key={m}
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(product, m);
                }}
                className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary/60 hover:text-warning transition-all"
              >
                + {m}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
