import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Barcode, Share2, Sparkles } from "lucide-react";
import { usePos } from "@/context/PosContext";
import { CATEGORIES } from "@/data/mockProducts";
import { ProductCard } from "@/components/pos/ProductCard";
import { CartPanel } from "@/components/pos/CartPanel";
import { SEARCH_ID } from "@/components/pos/AppShell";
import { matchesSearch } from "@/lib/search";
import { SocialPromotionsModal } from "@/components/pos/SocialPromotionsModal";
import { Emoji3D } from "@/components/common/Emoji3D";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Terminal TPV · NovaSystem × Dr. Empanadas" },
      { name: "description", content: "Caja rápida de Dr. Empanadas C.A. con precios en Bs. y USD, IVA 16% e IGTF 3%." },
      { property: "og:title", content: "Terminal TPV · NovaSystem × Dr. Empanadas" },
      { property: "og:description", content: "Caja rápida con pago mixto, IVA e IGTF para Dr. Empanadas C.A." },
    ],
  }),
  component: PosTerminal,
});

export function PosTerminal() {
  const pos = usePos();
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Todos");
  const [q, setQ] = useState("");
  const [showPromos, setShowPromos] = useState(false);

  // Búsqueda inteligente insensible a mayúsculas y acentos (ej: "pabellon" encuentra "Pabellón")
  const list = pos.products.filter(
    (p) =>
      p.active !== false &&
      (cat === "Todos" || p.category === cat) &&
      (matchesSearch(p.name, q) ||
        matchesSearch(p.sku, q) ||
        (p.barcode && p.barcode.includes(q)))
  );

  return (
    <div className="grid h-[calc(100vh-56px)] grid-cols-1 gap-4 p-4 lg:grid-cols-[65fr_35fr] bg-background">
      <section className="flex min-h-0 flex-col">
        {/* Modern Search bar + Publicar en Redes Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id={SEARCH_ID}
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && list[0]) {
                  pos.addToCart(list[0]);
                  setQ("");
                }
              }}
              placeholder="Buscar sabor, SKU o escanear código de barras… (/ o F5)"
              className="w-full rounded-2xl border border-border/80 bg-card py-3 pl-11 pr-11 text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/15 shadow-xs"
            />
            <Barcode className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/50" />
          </div>

          <button
            onClick={() => setShowPromos(true)}
            className="rounded-2xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary py-3 px-3.5 sm:px-4 text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95"
            title="Publicar Packs y Promociones en WhatsApp e Instagram Stories"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Publicar en Redes</span>
            <span className="sm:hidden">Redes</span>
          </button>
        </div>

        {/* Modern Category Pills with 3D Icons */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((c) => {
            const getIcon = () => {
              if (c === "Empanadas") return <Emoji3D name="empanada" size={20} spinOnHover />;
              if (c === "Pastelitos") return <Emoji3D name="pastelito" size={20} spinOnHover />;
              if (c === "Bebidas") return <Emoji3D name="malta" size={20} spinOnHover />;
              if (c === "Café") return <Emoji3D name="cafe" size={20} spinOnHover />;
              return null;
            };
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all select-none active:scale-95 flex items-center gap-1.5 ${
                  cat === c
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "border border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-secondary/70"
                }`}
              >
                {getIcon()}
                <span>{c}</span>
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        <div className="mt-3.5 grid flex-1 auto-rows-min grid-cols-2 gap-3.5 overflow-y-auto pb-4 sm:grid-cols-3 xl:grid-cols-4 pr-1">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} rate={pos.rate} onAdd={pos.addToCart} />
          ))}
          {list.length === 0 && (
            <div className="col-span-full py-24 text-center text-muted-foreground">
              <div className="flex justify-center mb-2">
                <Emoji3D name="empanada" size={64} className="animate-bounce" />
              </div>
              <p className="mt-3 text-sm font-bold text-foreground">No se encontraron productos para “{q}”</p>
              <p className="mt-1 text-xs text-muted-foreground">Prueba buscando por carne, queso, malta o código</p>
            </div>
          )}
        </div>
      </section>
      <CartPanel />

      {/* Social Media & WhatsApp Promotions Studio */}
      {showPromos && <SocialPromotionsModal onClose={() => setShowPromos(false)} />}
    </div>
  );
}
