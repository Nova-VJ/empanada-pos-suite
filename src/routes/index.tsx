import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { usePos } from "@/context/PosContext";
import { CATEGORIES } from "@/data/mockProducts";
import { ProductCard } from "@/components/pos/ProductCard";
import { CartPanel } from "@/components/pos/CartPanel";
import { SEARCH_ID } from "@/components/pos/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Terminal TPV · Dr. Empanadas POS" },
      { name: "description", content: "Caja rápida de Dr. Empanadas C.A. con precios en Bs. y USD, IVA 16% e IGTF 3%." },
      { property: "og:title", content: "Terminal TPV · Dr. Empanadas POS" },
      { property: "og:description", content: "Caja rápida con pago mixto, IVA e IGTF para Dr. Empanadas C.A." },
    ],
  }),
  component: PosTerminal,
});

function PosTerminal() {
  const pos = usePos();
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Todos");
  const [q, setQ] = useState("");
  const list = pos.products.filter((p) => (cat === "Todos" || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="grid h-[calc(100vh-65px)] grid-cols-1 gap-4 p-4 lg:grid-cols-[66fr_34fr] bg-[#0b1a18]">
      <section className="flex min-h-0 flex-col">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a9187]" />
          <input
            id={SEARCH_ID}
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && list[0]) { pos.addToCart(list[0]); setQ(""); } }}
            placeholder="Buscar sabor, empanada o escanear código…  (/ o F5)"
            className="w-full rounded-2xl border border-[#1b3530] bg-[#122623] py-3.5 pl-10 pr-4 text-sm text-[#fbf8f1] placeholder:text-[#6d847b] outline-none transition focus:border-[#cca06a] focus:ring-1 focus:ring-[#cca06a]/30 shadow-inner"
          />
        </div>
        <div className="mt-3.5 flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`whitespace-nowrap rounded-xl border px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
                cat === c
                  ? "border-[#cca06a] bg-[#cca06a] text-[#0b1a18] shadow-sm shadow-[#cca06a]/20"
                  : "border-[#1b3530] bg-[#122623] text-[#a6b9b0] hover:border-[#2a5047] hover:text-[#fbf8f1] hover:bg-[#162e29]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="mt-3.5 grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto pb-4 sm:grid-cols-3 xl:grid-cols-4 pr-1">
          {list.map((p) => <ProductCard key={p.id} product={p} rate={pos.rate} onAdd={pos.addToCart} />)}
          {list.length === 0 && (
            <div className="col-span-full py-20 text-center text-[#7e948a]">
              <div className="text-4xl">🥟</div>
              <p className="mt-2 text-sm font-medium">No se encontraron productos para “{q}”</p>
            </div>
          )}
        </div>
      </section>
      <CartPanel />
    </div>
  );
}
