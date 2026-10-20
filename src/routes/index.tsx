import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Barcode, Share2, Sparkles, Sun, Lock } from "lucide-react";
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
      { title: "Terminal TPV · NovaStock × Dr. Empanadas" },
      { name: "description", content: "Caja rápida de Dr. Empanadas C.A. con precios en Bs. y USD, IVA 16% e IGTF 3%." },
      { property: "og:title", content: "Terminal TPV · NovaStock × Dr. Empanadas" },
      { property: "og:description", content: "Caja rápida con pago mixto, IVA e IGTF para Dr. Empanadas C.A." },
    ],
  }),
  component: PosTerminal,
});

export function PosTerminal() {
  const pos = usePos();
  const [cat, setCat] = useState<string>("Todos");
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
        {/* Banner de Caja Cerrada si no hay turno abierto */}
        {!pos.shift.isOpen && (
          <div className="mb-3 rounded-2xl border border-amber-500/40 bg-amber-500/15 p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in-50">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-semibold">
              <span className="text-lg">⚠️</span>
              <span>
                Caja Cerrada · Para registrar ventas y cobros debes abrir la caja del día con el fondo en Bolívares.
              </span>
            </div>
            <button
              onClick={() => pos.setModal("shift")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-3.5 py-1.5 font-bold hover:bg-emerald-700 transition shrink-0 shadow-xs cursor-pointer animate-pulse"
            >
              <Sun className="h-4 w-4" />
              <span>Abrir Caja (Fondo Bs.)</span>
            </button>
          </div>
        )}

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

          {/* Botón Prominente Directo de Abrir Caja / Cerrar Caja */}
          {pos.shift.isOpen ? (
            <button
              onClick={() => pos.setModal("shift")}
              className="rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 py-3 px-3.5 sm:px-4 text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95"
              title="Cerrar la Caja del Día (Cierre Z / Arqueo Ciego)"
            >
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar Caja (Z)</span>
              <span className="sm:hidden">Cerrar</span>
            </button>
          ) : (
            <button
              onClick={() => pos.setModal("shift")}
              className="rounded-2xl border border-emerald-500/30 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-3.5 sm:px-4 text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95 animate-pulse"
              title="Abrir la Caja del Día ingresando el fondo en Bolívares"
            >
              <Sun className="h-4 w-4" />
              <span className="hidden sm:inline">Abrir Caja (Fondo)</span>
              <span className="sm:hidden">Abrir</span>
            </button>
          )}
        </div>

        {/* Modern Category Pills with 3D Icons */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {["Todos", ...(pos.categories || ["Empanadas", "Pastelitos", "Horneados", "Bebidas", "Salsas & Extras", "Combos"])].map((c) => {
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
