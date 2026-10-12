import { Coffee, CupSoda, Utensils, Plus, Package } from "lucide-react";
import empanadasPhoto from "@/assets/empanadas.jpg";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/pos";
import { fmtBs, fmtUsd } from "@/lib/money";

export function ProductCard({ product, rate, onAdd }: { product: Product; rate: number; onAdd: (p: Product, mod?: string) => void }) {
  const isEmpanada = product.category.startsWith("Empanadas");
  const Icon = product.name.includes("Café") ? Coffee : product.category === "Bebidas" ? CupSoda : product.category === "Combos" ? Package : Utensils;
  const low = product.stockBar < 25;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onAdd(product)}
      onKeyDown={(e) => e.key === "Enter" && onAdd(product)}
      className="product-tile group flex cursor-pointer flex-col justify-between rounded-lg border border-border bg-card p-3.5 text-left transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-12 w-16 items-center justify-center overflow-hidden rounded-md bg-secondary text-muted-foreground">
            {isEmpanada ? <img src={empanadasPhoto} alt="Empanadas venezolanas" width={1024} height={768} loading="lazy" className="h-full w-full object-cover" /> : <Icon className="h-5 w-5" />}
          </div>
          <span className={`rounded border px-1.5 py-0.5 text-xs font-semibold ${low ? "border-destructive/40 bg-destructive/15 text-destructive" : "border-border bg-background text-muted-foreground"}`}>
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
          <div className="font-mono text-xs font-semibold text-currency">{fmtUsd(product.priceUsd)}</div>
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
                className="rounded border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:border-primary/60 hover:text-currency transition-all"
              >
                <Plus className="h-3 w-3" />{m}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
