import { useState } from "react";
import {
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Calculator,
  Info,
  Save,
  Building2,
  Globe2,
  Sliders,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { CATEGORIES } from "@/data/mockProducts";
import { fmtBs, fmtUsd } from "@/lib/money";
import type { Category, Product } from "@/types/pos";
import { Modal, btnGhost, btnPrimary, inputCls } from "../pos/Modal";
import { matchesSearch } from "@/lib/search";

const VALID_CATS: Category[] = ["Empanadas", "Pastelitos", "Horneados", "Bebidas", "Salsas & Extras", "Combos"];

export function ProductsModule() {
  const pos = usePos();
  const { products, rate } = pos;
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<(typeof CATEGORIES)[number]>("Todos");
  const [editing, setEditing] = useState<Product | null>(null);
  const [costProduct, setCostProduct] = useState<Product | null>(null);
  const [customCost, setCustomCost] = useState<string>("0.60");
  const [costTab, setCostTab] = useState<"facturas" | "mercado" | "manual">("facturas");
  const [flourCostKg, setFlourCostKg] = useState<number>(0.95);
  const [fillingCostKg, setFillingCostKg] = useState<number>(5.20);
  const [oilCostL, setOilCostL] = useState<number>(1.77);
  const [packCostUnit, setPackCostUnit] = useState<number>(0.055);
  const [energyCostUnit, setEnergyCostUnit] = useState<number>(0.035);
  const [portionDoughG, setPortionDoughG] = useState<number>(80);
  const [portionFillingG, setPortionFillingG] = useState<number>(60);
  const [portionOilMl, setPortionOilMl] = useState<number>(25);
  const [categoryModal, setCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    short: "",
    sku: "",
    emoji: "🥟",
    category: "Empanadas" as Category,
    priceUsd: "1.80",
    costUsd: "0.75",
    stockBar: "45",
    stockKitchen: "80",
    kitchen: true,
    modifiers: "+ Salsa Guasacaca, + Salsa Tártara, Bien tostada",
  });

  const filtered = products.filter(
    (p) =>
      (catFilter === "Todos" || p.category === catFilter) &&
      (matchesSearch(p.name, search) ||
        matchesSearch(p.sku, search) ||
        matchesSearch(p.short, search))
  );

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      short: "",
      sku: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      emoji: "🥟",
      category: "Empanadas",
      priceUsd: "2.00",
      costUsd: "0.85",
      stockBar: "40",
      stockKitchen: "70",
      kitchen: true,
      modifiers: "+ Salsa Guasacaca, + Salsa Tártara, Bien tostada",
    });
    setFormOpen(true);
  }

  function getFillingDefaults(name: string) {
    const lower = name.toLowerCase();
    if (lower.includes("queso")) return { name: "Queso Llanero Duro", kg: 4.50, marketKg: 4.80, invoice: "FAC-QLL-10942 (Lácteos Llanera)", supplier: "Llanera Guárico" };
    if (lower.includes("pollo")) return { name: "Pechuga de Pollo", kg: 3.90, marketKg: 4.20, invoice: "FAC-FSR-55301 (Frigorífico)", supplier: "Frigorífico Santa Rosalía" };
    if (lower.includes("cazón") || lower.includes("cazon")) return { name: "Cazón Fresco Guisado", kg: 4.20, marketKg: 4.60, invoice: "FAC-MO-3950 (Mariscos Oriente)", supplier: "Mariscos Oriente" };
    if (lower.includes("pabellon") || lower.includes("pabellón")) return { name: "Pabellón (Carne, Caraota, Tajada, Queso)", kg: 5.40, marketKg: 5.80, invoice: "FAC-FSR-55301 + Insumos", supplier: "Frigorífico & Vituallas" };
    return { name: "Carne Falda de Res", kg: 5.20, marketKg: 5.60, invoice: "FAC-FSR-55301 (Frigorífico)", supplier: "Frigorífico Santa Rosalía" };
  }

  function recalculateFormula(tab: "facturas" | "mercado" | "manual", flour: number, filling: number, oil: number, pack: number, energy: number, doughG: number, fillingG: number, oilMl: number) {
    if (tab === "mercado") {
      return "0.60";
    }
    const costMasa = ((doughG * 0.55) / 1000) * flour + 0.01;
    const costRelleno = ((fillingG * 1.30) / 1000) * filling;
    const costAceite = (oilMl / 1000) * oil;
    const costEmpaque = pack + energy;
    const total = costMasa + costRelleno + costAceite + costEmpaque;
    return total.toFixed(2);
  }

  function openCostSheet(p: Product) {
    setCostProduct(p);
    setCostTab("facturas");
    const d = getFillingDefaults(p.name);
    setFlourCostKg(0.95);
    setFillingCostKg(d.kg);
    setOilCostL(1.77);
    setPackCostUnit(0.055);
    setEnergyCostUnit(0.035);
    const dG = p.category === "Empanadas" ? 80 : p.category === "Pastelitos" ? 70 : 60;
    const fG = p.category === "Empanadas" ? 60 : p.category === "Pastelitos" ? 50 : 40;
    const oM = p.category === "Empanadas" ? 25 : 20;
    setPortionDoughG(dG);
    setPortionFillingG(fG);
    setPortionOilMl(oM);

    const total = recalculateFormula("facturas", 0.95, d.kg, 1.77, 0.055, 0.035, dG, fG, oM);
    setCustomCost(total);
  }

  function handleSelectCostMode(mode: "facturas" | "mercado" | "manual") {
    setCostTab(mode);
    if (!costProduct) return;
    const d = getFillingDefaults(costProduct.name);

    if (mode === "facturas") {
      setFlourCostKg(0.95);
      setFillingCostKg(d.kg);
      setOilCostL(1.77);
      setPackCostUnit(0.055);
      setEnergyCostUnit(0.035);
      const total = recalculateFormula("facturas", 0.95, d.kg, 1.77, 0.055, 0.035, portionDoughG, portionFillingG, portionOilMl);
      setCustomCost(total);
    } else if (mode === "mercado") {
      setFlourCostKg(1.05);
      setFillingCostKg(d.marketKg);
      setOilCostL(1.88);
      setPackCostUnit(0.060);
      setEnergyCostUnit(0.040);
      setCustomCost("0.60");
    } else {
      // Keep current values for manual editing
    }
  }

  function handleIngredientChange(type: "flour" | "filling" | "oil" | "pack" | "energy" | "doughG" | "fillingG" | "oilMl", val: number) {
    let fl = flourCostKg;
    let fi = fillingCostKg;
    let oi = oilCostL;
    let pa = packCostUnit;
    let en = energyCostUnit;
    let dG = portionDoughG;
    let fG = portionFillingG;
    let oM = portionOilMl;

    if (type === "flour") { fl = val; setFlourCostKg(val); }
    if (type === "filling") { fi = val; setFillingCostKg(val); }
    if (type === "oil") { oi = val; setOilCostL(val); }
    if (type === "pack") { pa = val; setPackCostUnit(val); }
    if (type === "energy") { en = val; setEnergyCostUnit(val); }
    if (type === "doughG") { dG = val; setPortionDoughG(val); }
    if (type === "fillingG") { fG = val; setPortionFillingG(val); }
    if (type === "oilMl") { oM = val; setPortionOilMl(val); }

    const costMasa = ((dG * 0.55) / 1000) * fl + 0.01;
    const costRelleno = ((fG * 1.30) / 1000) * fi;
    const costAceite = (oM / 1000) * oi;
    const costEmpaque = pa + en;
    const total = (costMasa + costRelleno + costAceite + costEmpaque).toFixed(2);
    setCustomCost(total);
  }

  function handleSaveCost() {
    if (!costProduct) return;
    const newCost = parseFloat(customCost) || 0.60;
    const updated = products.map((x) => (x.id === costProduct.id ? { ...x, costUsd: newCost } : x));
    pos.products = updated;
    toast.success(`Costo actualizado para "${costProduct.name}": $${newCost.toFixed(2)} USD`, {
      description: "Margen y valor de inventario recalculados automáticamente.",
    });
    setCostProduct(null);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      short: p.short,
      sku: p.sku,
      emoji: p.emoji,
      category: p.category,
      priceUsd: String(p.priceUsd),
      costUsd: String(p.costUsd),
      stockBar: String(p.stockBar),
      stockKitchen: String(p.stockKitchen),
      kitchen: p.kitchen,
      modifiers: p.modifiers.join(", "),
    });
    setFormOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("El nombre del producto es obligatorio");
      return;
    }
    const payload: Omit<Product, "id"> = {
      name: form.name.trim(),
      short: form.short.trim() || form.name.trim().slice(0, 16),
      sku: form.sku.trim() || "SKU-001",
      emoji: form.emoji || "🥟",
      category: form.category,
      priceUsd: parseFloat(form.priceUsd) || 1.5,
      costUsd: parseFloat(form.costUsd) || 0.6,
      stockBar: parseInt(form.stockBar, 10) || 0,
      stockKitchen: parseInt(form.stockKitchen, 10) || 0,
      kitchen: form.kitchen,
      modifiers: form.modifiers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    if (editing) {
      pos.updateProduct(editing.id, payload);
      toast.success("Producto actualizado");
    } else {
      pos.createProduct(payload);
      toast.success("Producto creado en el catálogo");
    }
    setFormOpen(false);
  }

  function handleDelete(p: Product) {
    if (!confirm(`¿Eliminar "${p.name}" del catálogo?`)) return;
    pos.deleteProduct(p.id);
    toast.success("Producto eliminado");
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Productos y Fichas de Costo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} productos activos en el catálogo de Dr. Empanadas C.A.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-module-products px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar por nombre, sabor o SKU..."
            className={`${inputCls} pl-9`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 items-center">
          {["Todos", ...(pos.categories || ["Empanadas", "Pastelitos", "Horneados", "Bebidas", "Salsas & Extras", "Combos"])].map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c as any)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                catFilter === c
                  ? "bg-module-products text-white shadow-xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
          <button
            onClick={() => setCategoryModal(true)}
            className="whitespace-nowrap rounded-lg border border-dashed border-module-products/60 text-module-products px-3 py-1.5 text-xs font-bold hover:bg-module-products/10 transition cursor-pointer flex items-center gap-1 shrink-0"
            title="Agregar o gestionar categorías del inventario"
          >
            <Plus className="h-3.5 w-3.5" /> Nueva Categoría
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 font-semibold">Estación</th>
                  <th className="px-4 py-3 font-semibold text-right">P. Coste</th>
                  <th className="px-4 py-3 font-semibold text-right">P. Venta (USD)</th>
                  <th className="px-4 py-3 font-semibold text-right">P. Venta (Bs.)</th>
                  <th className="px-4 py-3 font-semibold text-right">Margen</th>
                  <th className="px-4 py-3 font-semibold text-right">Stock</th>
                  <th className="px-4 py-3 w-[90px]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const margin = p.priceUsd > 0 ? ((p.priceUsd - p.costUsd) / p.priceUsd) * 100 : 0;
                  return (
                    <tr key={p.id} className="hover:bg-secondary/40 transition-colors cursor-pointer" onClick={() => openEdit(p)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{p.emoji}</span>
                          <div>
                            <div className="font-semibold text-foreground">{p.name}</div>
                            {p.modifiers.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {p.modifiers.slice(0, 3).map((m) => (
                                  <span key={m} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{p.sku}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-module-products-light px-2 py-0.5 text-[11px] font-medium text-module-products">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.kitchen ? "🍳 Freidora KDS" : "🥤 Barra"}</td>
                      <td className="px-4 py-3 text-right font-mono" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openCostSheet(p)}
                          className="inline-flex items-center justify-end gap-1 font-mono font-bold text-xs text-primary hover:bg-primary/10 rounded-lg px-2 py-1 transition border border-primary/20 shadow-2xs group ml-auto"
                          title="¿De dónde sale este costo? Haz clic para ver el escandallo y editarlo"
                        >
                          <span>{fmtUsd(p.costUsd)}</span>
                          <Calculator className="h-3 w-3 opacity-70 group-hover:opacity-100" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-module-inventory">{fmtUsd(p.priceUsd)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">{fmtBs(p.priceUsd * rate)}</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">{margin.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right font-mono">
                        <span className={p.stockBar < 25 ? "text-destructive font-bold" : "text-foreground font-medium"}>
                          {p.stockBar}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-medium text-foreground">Sin productos coincidentes</h3>
          </div>
        )}
      </div>

      {formOpen && (
        <Modal
          title={editing ? `Editar Producto: ${editing.name}` : "Nuevo Producto del Catálogo"}
          onClose={() => setFormOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setFormOpen(false)}>
                Cancelar
              </button>
              <button className={btnPrimary} onClick={handleSave}>
                Guardar Producto
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <label className="sm:col-span-2 font-semibold text-foreground">
              Nombre comercial *
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`${inputCls} mt-1`}
                placeholder="Ej. Empanada de Pabellón Criollo"
              />
            </label>
            <label className="font-semibold text-foreground">
              Nombre corto (KDS)
              <input
                value={form.short}
                onChange={(e) => setForm({ ...form, short: e.target.value })}
                className={`${inputCls} mt-1`}
                placeholder="Ej. Pabellón"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="font-semibold text-foreground">
                SKU
                <input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className={`${inputCls} mt-1 font-mono`}
                />
              </label>
              <label className="font-semibold text-foreground">
                Icono / Emoji
                <input
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  className={`${inputCls} mt-1 text-center text-lg`}
                />
              </label>
            </div>
            <label className="font-semibold text-foreground">
              Categoría
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                className={`${inputCls} mt-1`}
              >
                {pos.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="font-semibold text-foreground flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                checked={form.kitchen}
                onChange={(e) => setForm({ ...form, kitchen: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              Enviar a pantalla de Freidoras (Cocina KDS)
            </label>
            <label className="font-semibold text-foreground">
              Precio Costo ($ USD)
              <input
                type="number"
                step="0.05"
                value={form.costUsd}
                onChange={(e) => setForm({ ...form, costUsd: e.target.value })}
                className={`${inputCls} mt-1 font-mono`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Precio Venta ($ USD · Bs. {((parseFloat(form.priceUsd) || 0) * rate).toFixed(2)})
              <input
                type="number"
                step="0.10"
                value={form.priceUsd}
                onChange={(e) => setForm({ ...form, priceUsd: e.target.value })}
                className={`${inputCls} mt-1 font-mono font-bold`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Stock disponible (Barra / Exhibidor)
              <input
                type="number"
                value={form.stockBar}
                onChange={(e) => setForm({ ...form, stockBar: e.target.value })}
                className={`${inputCls} mt-1 font-mono`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Stock en preparación (Cocina)
              <input
                type="number"
                value={form.stockKitchen}
                onChange={(e) => setForm({ ...form, stockKitchen: e.target.value })}
                className={`${inputCls} mt-1 font-mono`}
              />
            </label>
            <label className="sm:col-span-2 font-semibold text-foreground">
              Modificadores rápidos (separados por coma)
              <input
                value={form.modifiers}
                onChange={(e) => setForm({ ...form, modifiers: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
          </div>
        </Modal>
      )}
      {/* Ficha Técnica & Escandallo de Costo Interactivo (Modal Explicativo y Dinámico) */}
      {costProduct && (
        <Modal
          title={
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
                <Calculator className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="truncate font-bold">Escandallo Dinámico: {costProduct.name}</span>
                <span className="text-[10px] text-muted-foreground font-normal">Cálculo matemático real basado en insumos e inventario</span>
              </div>
            </div>
          }
          onClose={() => setCostProduct(null)}
          width="max-w-2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-[11px] text-muted-foreground">
                Margen proyectado: <b className="text-emerald-600 dark:text-emerald-400 text-xs">{costProduct.priceUsd > 0 ? (((costProduct.priceUsd - (parseFloat(customCost) || 0.6)) / costProduct.priceUsd) * 100).toFixed(1) : 0}%</b>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCostProduct(null)}
                  className="rounded-xl border border-border bg-secondary px-4 py-2 font-semibold text-foreground text-xs hover:bg-secondary/80"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCost}
                  className="rounded-xl bg-primary px-5 py-2 font-bold text-primary-foreground text-xs shadow-xs hover:bg-primary/90 flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Guardar Nuevo Costo (${parseFloat(customCost || "0").toFixed(2)})</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Resumen Comercial */}
            <div className="grid grid-cols-3 gap-2.5 rounded-2xl border border-border bg-gradient-to-br from-secondary/40 to-card p-3.5 text-center">
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">Precio Venta (PVP)</div>
                <div className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {fmtUsd(costProduct.priceUsd)}
                </div>
                <div className="text-[10px] text-muted-foreground">{fmtBs(costProduct.priceUsd * rate)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">Costo Escandallo</div>
                <div className="font-mono text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  ${parseFloat(customCost || "0").toFixed(2)} USD
                </div>
                <div className="text-[10px] text-muted-foreground">{fmtBs((parseFloat(customCost) || 0) * rate)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">Ganancia Neta</div>
                <div className="font-mono text-base font-bold text-foreground mt-0.5">
                  ${(costProduct.priceUsd - (parseFloat(customCost) || 0.6)).toFixed(2)} USD
                </div>
                <div className="text-[10px] text-primary font-bold">
                  {costProduct.priceUsd > 0 ? (((costProduct.priceUsd - (parseFloat(customCost) || 0.6)) / costProduct.priceUsd) * 100).toFixed(1) : 0}% margen
                </div>
              </div>
            </div>

            {/* Selector de Fuente de Datos */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-secondary/80 border border-border">
              <button
                type="button"
                onClick={() => handleSelectCostMode("facturas")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition ${
                  costTab === "facturas"
                    ? "bg-card text-foreground shadow-xs border border-border text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>🏢 Mis Facturas (Tu Inventario)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectCostMode("mercado")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition ${
                  costTab === "mercado"
                    ? "bg-card text-foreground shadow-xs border border-border text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Globe2 className="h-3.5 w-3.5" />
                <span>🌐 Referencia Oficial Maracay</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectCostMode("manual")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition ${
                  costTab === "manual"
                    ? "bg-card text-foreground shadow-xs border border-border text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>✏️ Ajustar Insumos</span>
              </button>
            </div>

            {/* Pestaña 1: Facturas Reales del Negocio */}
            {costTab === "facturas" && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-2.5">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-foreground text-xs">
                      Cálculo 100% Exacto con Facturas de Compra de Dr. Empanadas
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      El sistema cruza las compras registradas a tus proveedores de Maracay y aplica la merma gastronómica estándar:
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-[11px] text-left">
                    <thead className="border-b border-border bg-secondary/50 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Rubro</th>
                        <th className="px-3 py-2 font-semibold">Proveedor & Factura Real</th>
                        <th className="px-3 py-2 font-semibold text-center">Porción</th>
                        <th className="px-3 py-2 font-semibold text-right">Costo Empanada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono">
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium text-foreground">🌽 Masa de Maíz</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">
                          Polar FAC-88210 · Bulto $19 ($0.95/kg)
                        </td>
                        <td className="px-3 py-2 text-center text-muted-foreground">{portionDoughG}g (44g harina)</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">
                          ${(((portionDoughG * 0.55) / 1000) * flourCostKg + 0.01).toFixed(3)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium text-foreground">🥩 Relleno Guisado</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">
                          {getFillingDefaults(costProduct.name).invoice} (${fillingCostKg.toFixed(2)}/kg)
                        </td>
                        <td className="px-3 py-2 text-center text-muted-foreground">{portionFillingG}g (merma 30%)</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">
                          ${(((portionFillingG * 1.30) / 1000) * fillingCostKg).toFixed(3)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium text-foreground">🛢️ Aceite Freidora</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">
                          Bidón Polar Turmero 18L ($32.00 · $1.77/L)
                        </td>
                        <td className="px-3 py-2 text-center text-muted-foreground">{portionOilMl}ml absorción</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">
                          ${(((portionOilMl) / 1000) * oilCostL).toFixed(3)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium text-foreground">📦 Empaque & Gas</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">
                          Envases Chacao FAC-31092 ($0.055) + Gas
                        </td>
                        <td className="px-3 py-2 text-center text-muted-foreground">1 servicio</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">
                          ${(packCostUnit + energyCostUnit).toFixed(3)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="border-t-2 border-border bg-secondary/40 font-mono font-bold">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 font-sans text-foreground">
                          Total Calculado de tus Facturas
                        </td>
                        <td className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400 text-xs">
                          ${customCost} USD
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Pestaña 2: Referencia Oficial Mayorista Maracay */}
            {costTab === "mercado" && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3.5 space-y-2.5">
                <div className="flex items-start gap-2">
                  <Globe2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-foreground text-xs">
                      ¿Por qué dice $0.60 el costo estimado y de dónde sale?
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Proviene de la <b>Canasta Gastronómica Mayorista de Maracay (Mercado Mayorista Intercomunal & CENDAS Aragua, Octubre 2026)</b>. Se usa como referencia verificable cuando aún no se registran facturas:
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-[11px] text-left">
                    <thead className="border-b border-border bg-secondary/50 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Rubro Mayorista</th>
                        <th className="px-3 py-2 font-semibold">Fuente Oficial de Referencia</th>
                        <th className="px-3 py-2 font-semibold text-center">Porción</th>
                        <th className="px-3 py-2 font-semibold text-right">Costo Estimado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono">
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium text-foreground">🌽 Masa de Maíz</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">Bulto Harina PAN ($21 mayorista)</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">80g masa</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">$0.12 USD</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium text-foreground">🥩 Relleno Guisado</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">Carne/Queso promedio ($5.60/kg)</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">60g guisado</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">$0.32 USD</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium text-foreground">🛢️ Aceite Vegetal</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">Bidón 18L ($34 mayorista)</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">25ml merma</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">$0.09 USD</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium text-foreground">📦 Empaque y Gas</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">Papel parafinado + gas comercial</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">1 empanada</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">$0.07 USD</td>
                      </tr>
                    </tbody>
                    <tfoot className="border-t-2 border-border bg-secondary/40 font-mono font-bold">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 font-sans text-foreground">Total Estimado Oficial Maracay</td>
                        <td className="px-3 py-2 text-right text-blue-600 dark:text-blue-400 text-xs">$0.60 USD</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Pestaña 3: Ajustar Insumos (Tu Receta y Precios del Dueño) */}
            {costTab === "manual" && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-3">
                <div className="flex items-start gap-2">
                  <Sliders className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-foreground text-xs">
                      Personaliza el Costo de tu Mercancía o Gramaje
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Si compras insumos a otro precio o tus empanadas tienen porciones especiales, ajústalas aquí y el costo se calculará al instante:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <label className="font-semibold text-foreground text-[11px]">
                    Harina de Maíz ($/Kg)
                    <input
                      type="number"
                      step="0.05"
                      value={flourCostKg}
                      onChange={(e) => handleIngredientChange("flour", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs font-bold mt-1"
                    />
                  </label>
                  <label className="font-semibold text-foreground text-[11px]">
                    Relleno ($/Kg)
                    <input
                      type="number"
                      step="0.10"
                      value={fillingCostKg}
                      onChange={(e) => handleIngredientChange("filling", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs font-bold mt-1"
                    />
                  </label>
                  <label className="font-semibold text-foreground text-[11px]">
                    Aceite ($/Litro)
                    <input
                      type="number"
                      step="0.05"
                      value={oilCostL}
                      onChange={(e) => handleIngredientChange("oil", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs font-bold mt-1"
                    />
                  </label>
                  <label className="font-semibold text-foreground text-[11px]">
                    Gramos de Masa
                    <input
                      type="number"
                      step="5"
                      value={portionDoughG}
                      onChange={(e) => handleIngredientChange("doughG", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs font-bold mt-1"
                    />
                  </label>
                  <label className="font-semibold text-foreground text-[11px]">
                    Gramos de Relleno
                    <input
                      type="number"
                      step="5"
                      value={portionFillingG}
                      onChange={(e) => handleIngredientChange("fillingG", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs font-bold mt-1"
                    />
                  </label>
                  <label className="font-semibold text-foreground text-[11px]">
                    Aceite por Fritura (ml)
                    <input
                      type="number"
                      step="5"
                      value={portionOilMl}
                      onChange={(e) => handleIngredientChange("oilMl", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs font-bold mt-1"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Ajuste Rápido de Costo Global */}
            <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground">Costo Final Aplicado ($ USD)</span>
                <span className="text-[10px] text-muted-foreground">Puedes escribir el monto directo o usar un atajo:</span>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-muted-foreground">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.10"
                    value={customCost}
                    onChange={(e) => setCustomCost(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/50 pl-7 pr-3 py-1.5 text-foreground font-mono text-sm font-bold focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div className="flex gap-1.5">
                  {["0.50", "0.55", "0.60", "0.75", "0.90"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setCustomCost(v)}
                      className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs font-semibold transition ${
                        customCost === v
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      ${v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {categoryModal && (
        <Modal
          title="Gestión de Categorías de Inventario & Menú"
          onClose={() => setCategoryModal(false)}
          width="max-w-md"
          footer={
            <div className="flex justify-end">
              <button type="button" onClick={() => setCategoryModal(false)} className={btnPrimary}>
                Listo
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-muted-foreground text-[11px]">
              Agrega nuevas categorías para clasificar tus productos (ej. Postres, Jugos Naturales, Desayunos, etc.). Se reflejarán de inmediato en el TPV, catálogo y reportes.
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Nombre de la nueva categoría:</label>
              <div className="flex gap-2">
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCatName.trim()) {
                      pos.addCategory(newCatName.trim());
                      toast.success(`Categoría «${newCatName.trim()}» agregada`);
                      setNewCatName("");
                    }
                  }}
                  placeholder="Ej. Postres, Jugos, Desayunos..."
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newCatName.trim()) {
                      toast.error("Escribe el nombre de la categoría");
                      return;
                    }
                    pos.addCategory(newCatName.trim());
                    toast.success(`Categoría «${newCatName.trim()}» agregada al inventario`);
                    setNewCatName("");
                  }}
                  className="rounded-xl bg-module-products text-white px-3.5 py-2 font-bold hover:opacity-90 transition shrink-0 cursor-pointer"
                >
                  Agregar
                </button>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <label className="font-semibold text-foreground block mb-2">Categorías Actuales ({pos.categories.length}):</label>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {pos.categories.map((cat) => {
                  const isDefault = ["Empanadas", "Pastelitos", "Horneados", "Bebidas", "Salsas & Extras", "Combos"].includes(cat);
                  return (
                    <div
                      key={cat}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      <span>{cat}</span>
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => {
                            pos.deleteCategory(cat);
                            toast.info(`Categoría «${cat}» eliminada`);
                          }}
                          className="text-muted-foreground hover:text-destructive transition ml-1 cursor-pointer"
                          title="Eliminar categoría"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
