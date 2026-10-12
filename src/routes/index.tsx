import { Button } from "@/components/ui/button";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
    <div className="grid h-[calc(100vh-65px)] grid-cols-1 gap-4 p-4 lg:grid-cols-[66fr_34fr] bg-background">
      <section className="flex min-h-0 flex-col">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id={SEARCH_ID}
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && list[0]) { pos.addToCart(list[0]); setQ(""); } }}
            placeholder="Buscar sabor, empanada o escanear código…  (/ o F5)"
            className="w-full rounded-lg border border-border bg-card py-3.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/30 "
          />
        </div>
        <div className="mt-3.5 flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <Button variant="plain"
              key={c}
              onClick={() => setCat(c)}
              className={`whitespace-nowrap rounded-md border px-4 py-2 text-xs font-semibold tracking-normal transition-all ${
                cat === c
                  ? "border-primary bg-primary text-background  "
                  : "border-border bg-card text-muted-foreground hover:border-border hover:text-foreground hover:bg-secondary"
              }`}
            >
              {c}
            </Button>
          ))}
        </div>
        <div className="mt-3.5 grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto pb-4 sm:grid-cols-3 xl:grid-cols-4 pr-1">
          {list.map((p) => <ProductCard key={p.id} product={p} rate={pos.rate} onAdd={pos.addToCart} />)}
          {list.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              <div className="text-4xl"></div>
              <p className="mt-2 text-sm font-medium">No se encontraron productos para “{q}”</p>
            </div>
          )}
        </div>
      </section>
      <CartPanel />
    </div>
  );
}
