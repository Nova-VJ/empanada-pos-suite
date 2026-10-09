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
      className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-[#1b3530] bg-[#122623] p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#cca06a]/60 hover:bg-[#162e2a] hover:shadow-xl hover:shadow-black/40 active:scale-[0.98]"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#234b42] bg-[#183530] text-2xl shadow-inner group-hover:scale-110 group-hover:border-[#cca06a]/50 transition-all">
            {product.emoji}
          </div>
          <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${low ? "border-[#c85a48]/40 bg-[#c85a48]/15 text-[#e07a68]" : "border-[#1f3d37] bg-[#0c1816] text-[#8fa49b]"}`}>
            {product.stockBar} disp
          </span>
        </div>
        <h3 className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-[#fbf8f1] group-hover:text-[#cca06a] transition-colors">
          {product.name}
        </h3>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#1b3530]/80">
        <div className="flex items-baseline justify-between">
          <div className="font-mono text-base font-bold text-[#fbf8f1]">{fmtBs(product.priceUsd * rate)}</div>
          <div className="font-mono text-xs font-semibold text-[#e0ab77]">{fmtUsd(product.priceUsd)}</div>
        </div>

        {product.modifiers.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {product.modifiers.map((m) => (
              <button
                key={m}
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(product, m);
                }}
                className="rounded-full border border-[#1f3d37] bg-[#0c1816] px-2 py-0.5 text-[10px] text-[#9eb1a8] hover:border-[#cca06a]/60 hover:text-[#e0ab77] transition-all"
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
