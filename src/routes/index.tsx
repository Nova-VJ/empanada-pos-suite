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
    <div className="grid h-[calc(100vh-61px)] grid-cols-1 gap-4 p-4 lg:grid-cols-[65fr_35fr]">
      <section className="flex min-h-0 flex-col">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id={SEARCH_ID}
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && list[0]) { pos.addToCart(list[0]); setQ(""); } }}
            placeholder="Buscar producto o escanear código…  (/ o F5)"
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-500/60"
          />
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${cat === c ? "border-emerald-500/50 bg-emerald-600 text-white" : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-100"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="mt-3 grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto pb-4 sm:grid-cols-3 xl:grid-cols-4">
          {list.map((p) => <ProductCard key={p.id} product={p} rate={pos.rate} onAdd={pos.addToCart} />)}
          {list.length === 0 && <p className="col-span-full py-16 text-center text-sm text-slate-500">Sin resultados para “{q}”</p>}
        </div>
      </section>
      <CartPanel />
    </div>
  );
}
