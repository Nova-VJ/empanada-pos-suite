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
  Eye,
  EyeOff,
  UserCheck,
  DollarSign,
  Flame,
  ShoppingBag,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { CATEGORIES } from "@/data/mockProducts";
import { fmtBs, fmtUsd } from "@/lib/money";
import type { Category, Product, RecipeIngredient, ProductRecipe } from "@/types/pos";
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

  // Privacy: Hide costs & profit margins from cashiers / staff
  const [hideCosts, setHideCosts] = useState<boolean>(pos.companySettings.hideCostsFromStaff ?? false);

  // Full Multi-Ingredient Recipe & Labor State
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [recipeOilMl, setRecipeOilMl] = useState<number>(20);
  const [recipeOilPriceL, setRecipeOilPriceL] = useState<number>(1.75);
  const [recipePackEnergy, setRecipePackEnergy] = useState<number>(0.05);

  // Labor Cost (Mano de Obra del Trabajador)
  const [includeLabor, setIncludeLabor] = useState<boolean>(true);
  const [laborType, setLaborType] = useState<"per_unit" | "daily_shift">("per_unit");
  const [laborCostPerUnit, setLaborCostPerUnit] = useState<number>(0.10);
  const [laborDailySalary, setLaborDailySalary] = useState<number>(15.00);
  const [laborDailyUnits, setLaborDailyUnits] = useState<number>(150);

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

  function toggleCostPrivacy() {
    const next = !hideCosts;
    setHideCosts(next);
    pos.updateCompanySettings({ hideCostsFromStaff: next });
    if (next) {
      toast.info("🔒 Modo Personal Activado: Costos y ganancias ocultos para empleados");
    } else {
      toast.success("👁️ Modo Gerencia Activado: Costos y márgenes visibles");
    }
  }

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

  function getSmartDefaultIngredients(productName: string): RecipeIngredient[] {
    const lower = productName.toLowerCase();
    const masa: RecipeIngredient = {
      id: "ing-masa",
      name: "Masa Harina de Maíz P.A.N.",
      grams: 80,
      pricePerKg: 0.95,
      unitCostUsd: (80 / 1000) * 0.95,
    };

    if (lower.includes("pabellon") || lower.includes("pabellón")) {
      return [
        masa,
        { id: "ing-1", name: "Carne Mechada de Res", grams: 50, pricePerKg: 6.50, unitCostUsd: (50 / 1000) * 6.50 },
        { id: "ing-2", name: "Queso Blanco Rallado", grams: 20, pricePerKg: 4.50, unitCostUsd: (20 / 1000) * 4.50 },
        { id: "ing-3", name: "Caraotas Negras Refritas", grams: 25, pricePerKg: 2.20, unitCostUsd: (25 / 1000) * 2.20 },
        { id: "ing-4", name: "Tajadas de Plátano Maduro", grams: 15, pricePerKg: 1.20, unitCostUsd: (15 / 1000) * 1.20 },
      ];
    }
    if (lower.includes("jamón y queso") || lower.includes("jamon y queso") || lower.includes("j&q")) {
      return [
        masa,
        { id: "ing-1", name: "Queso Blanco / Amarillo", grams: 50, pricePerKg: 4.80, unitCostUsd: (50 / 1000) * 4.80 },
        { id: "ing-2", name: "Jamón de Pierna Cocido", grams: 30, pricePerKg: 5.80, unitCostUsd: (30 / 1000) * 5.80 },
      ];
    }
    if (lower.includes("queso")) {
      return [
        masa,
        { id: "ing-1", name: "Queso Blanco Llanero Duro", grams: 70, pricePerKg: 4.35, unitCostUsd: (70 / 1000) * 4.35 },
      ];
    }
    if (lower.includes("pollo")) {
      return [
        masa,
        { id: "ing-1", name: "Pechuga de Pollo Guisada", grams: 65, pricePerKg: 4.20, unitCostUsd: (65 / 1000) * 4.20 },
      ];
    }
    if (lower.includes("cazón") || lower.includes("cazon")) {
      return [
        masa,
        { id: "ing-1", name: "Cazón Fresco Guisado", grams: 65, pricePerKg: 4.50, unitCostUsd: (65 / 1000) * 4.50 },
      ];
    }
    if (lower.includes("molida")) {
      return [
        masa,
        { id: "ing-1", name: "Carne Molida de Res de Primera", grams: 65, pricePerKg: 5.80, unitCostUsd: (65 / 1000) * 5.80 },
      ];
    }
    // Default mechada
    return [
      masa,
      { id: "ing-1", name: "Carne Falda de Res Mechada", grams: 65, pricePerKg: 6.50, unitCostUsd: (65 / 1000) * 6.50 },
    ];
  }

  function openCostSheet(p: Product) {
    if (hideCosts) {
      toast.info("Costos protegidos para el personal. Desactiva el Modo Personal para acceder.");
      return;
    }
    setCostProduct(p);

    if (p.recipe && Array.isArray(p.recipe.ingredients) && p.recipe.ingredients.length > 0) {
      setRecipeIngredients(p.recipe.ingredients);
      setRecipeOilMl(p.recipe.oilMl ?? 20);
      setRecipeOilPriceL(p.recipe.oilPricePerLiter ?? 1.75);
      setRecipePackEnergy(p.recipe.packagingAndEnergyUsd ?? 0.05);
      setIncludeLabor(p.recipe.includeLabor ?? true);
      setLaborType(p.recipe.laborType ?? "per_unit");
      setLaborCostPerUnit(p.recipe.laborCostPerUnitUsd ?? 0.10);
      setLaborDailySalary(p.recipe.laborDailySalaryUsd ?? 15.00);
      setLaborDailyUnits(p.recipe.laborDailyUnits ?? 150);
    } else {
      // Seed with intelligent defaults
      const ingredients = getSmartDefaultIngredients(p.name);
      setRecipeIngredients(ingredients);
      setRecipeOilMl(p.category === "Pastelitos" ? 15 : 20);
      setRecipeOilPriceL(1.75);
      setRecipePackEnergy(0.05);
      setIncludeLabor(true);
      setLaborType("per_unit");
      setLaborCostPerUnit(0.10);
      setLaborDailySalary(15.00);
      setLaborDailyUnits(150);
    }
  }

  // Calculations for current recipe in modal
  const ingredientsCost = recipeIngredients.reduce((sum, item) => sum + (item.unitCostUsd || 0), 0);
  const oilCost = (recipeOilMl / 1000) * recipeOilPriceL;
  const kitchenSuppliesCost = oilCost + recipePackEnergy;
  const unitLaborCost = includeLabor
    ? laborType === "daily_shift"
      ? (laborDailyUnits > 0 ? laborDailySalary / laborDailyUnits : 0)
      : laborCostPerUnit
    : 0;
  const calculatedTotalCost = Math.round((ingredientsCost + kitchenSuppliesCost + unitLaborCost) * 1000) / 1000;

  function updateIngredient(index: number, field: "name" | "grams" | "pricePerKg", val: any) {
    setRecipeIngredients((prev) => {
      const copy = [...prev];
      const cur = { ...copy[index] };
      if (field === "name") cur.name = String(val);
      if (field === "grams") cur.grams = Math.max(0, parseFloat(val) || 0);
      if (field === "pricePerKg") cur.pricePerKg = Math.max(0, parseFloat(val) || 0);
      cur.unitCostUsd = Math.round(((cur.grams / 1000) * cur.pricePerKg) * 1000) / 1000;
      copy[index] = cur;
      return copy;
    });
  }

  function addIngredient(name = "Nuevo Insumo", grams = 20, priceKg = 4.50) {
    const newIng: RecipeIngredient = {
      id: `ing-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      grams,
      pricePerKg: priceKg,
      unitCostUsd: Math.round(((grams / 1000) * priceKg) * 1000) / 1000,
    };
    setRecipeIngredients((prev) => [...prev, newIng]);
  }

  function removeIngredient(index: number) {
    setRecipeIngredients((prev) => prev.filter((_, idx) => idx !== index));
  }

  function handleImportSupplierPrices() {
    // Synchronize ingredient prices with Aragua wholesale radar
    setRecipeIngredients((prev) =>
      prev.map((ing) => {
        const lower = ing.name.toLowerCase();
        let newPrice = ing.pricePerKg;
        if (lower.includes("harina")) newPrice = 0.95;
        else if (lower.includes("queso amarillo") || lower.includes("gouda")) newPrice = 5.20;
        else if (lower.includes("queso")) newPrice = 4.35;
        else if (lower.includes("jamón") || lower.includes("jamon")) newPrice = 5.50;
        else if (lower.includes("carne")) newPrice = 6.20;
        else if (lower.includes("pollo")) newPrice = 3.90;
        else if (lower.includes("caraota")) newPrice = 2.10;
        return {
          ...ing,
          pricePerKg: newPrice,
          unitCostUsd: Math.round(((ing.grams / 1000) * newPrice) * 1000) / 1000,
        };
      })
    );
    setRecipeOilPriceL(1.75);
    toast.success("✅ Precios de materia prima actualizados con el Radar de Mayoristas de Aragua");
  }

  function handleSaveFullRecipeCost() {
    if (!costProduct) return;
    const finalCost = Math.round(calculatedTotalCost * 100) / 100;

    const fullRecipe: ProductRecipe = {
      ingredients: recipeIngredients,
      oilMl: recipeOilMl,
      oilPricePerLiter: recipeOilPriceL,
      oilCostUsd: oilCost,
      packagingAndEnergyUsd: recipePackEnergy,
      includeLabor,
      laborType,
      laborDailySalaryUsd: laborDailySalary,
      laborDailyUnits: laborDailyUnits,
      laborCostPerUnitUsd: unitLaborCost,
      totalCostUsd: finalCost,
      lastUpdated: Date.now(),
    };

    pos.updateProduct(costProduct.id, {
      costUsd: finalCost,
      recipe: fullRecipe,
    });

    const marginPct = costProduct.priceUsd > 0
      ? (((costProduct.priceUsd - finalCost) / costProduct.priceUsd) * 100).toFixed(1)
      : "0";

    toast.success(`🎉 Ficha de costo guardada para «${costProduct.name}»`, {
      description: `Nuevo Costo Real: $${finalCost.toFixed(2)} USD (Margen de Ganancia: ${marginPct}%)`,
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
      emoji: form.emoji.trim() || "🥟",
      category: form.category,
      priceUsd: parseFloat(form.priceUsd) || 0,
      costUsd: parseFloat(form.costUsd) || 0,
      stockBar: parseInt(form.stockBar) || 0,
      stockKitchen: parseInt(form.stockKitchen) || 0,
      kitchen: form.kitchen,
      modifiers: form.modifiers
        ? form.modifiers.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    };

    if (editing) {
      pos.updateProduct(editing.id, payload);
      toast.success(`Producto "${payload.name}" actualizado`);
    } else {
      pos.createProduct(payload);
      toast.success(`Producto "${payload.name}" agregado al menú`);
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
            {products.length} productos activos en el catálogo de {pos.companySettings.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Cost Privacy Toggle Button (Requested by User) */}
          <button
            onClick={toggleCostPrivacy}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition ${
              hideCosts
                ? "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25"
                : "bg-secondary border-border text-foreground hover:bg-secondary/80"
            }`}
            title={hideCosts ? "Costos y ganancias ocultos para el personal. Haz clic para activar Modo Gerencia." : "Costos visibles. Haz clic para ocultarlos si hay empleados viendo la pantalla."}
          >
            {hideCosts ? <EyeOff className="h-4 w-4 text-amber-500" /> : <Eye className="h-4 w-4 text-emerald-500" />}
            <span>{hideCosts ? "Costos Ocultos (Modo Personal)" : "Costos Visibles (Modo Gerencia)"}</span>
          </button>

          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-module-products px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </button>
        </div>
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
                        {hideCosts ? (
                          <span className="font-mono text-muted-foreground/60 select-none px-2 py-1" title="Costos ocultos para el personal">
                            ••••
                          </span>
                        ) : (
                          <button
                            onClick={() => openCostSheet(p)}
                            className="inline-flex items-center justify-end gap-1 font-mono font-bold text-xs text-primary hover:bg-primary/10 rounded-lg px-2 py-1 transition border border-primary/20 shadow-2xs group ml-auto"
                            title="Haz clic para ver y editar el escandallo completo con ingredientes y mano de obra"
                          >
                            <span>{fmtUsd(p.costUsd)}</span>
                            <Calculator className="h-3 w-3 opacity-70 group-hover:opacity-100" />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-module-inventory">{fmtUsd(p.priceUsd)}</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">{fmtBs(p.priceUsd * rate)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        {hideCosts ? (
                          <span className="font-mono text-muted-foreground/60 select-none">••••</span>
                        ) : (
                          <span className={margin >= 50 ? "text-emerald-600 dark:text-emerald-400" : margin >= 30 ? "text-amber-600" : "text-destructive"}>
                            {margin.toFixed(0)}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {p.stockBar + p.stockKitchen <= (p.stockMin ?? 25) ? (
                          <span className="text-destructive font-bold">{p.stockBar + p.stockKitchen}</span>
                        ) : (
                          p.stockBar + p.stockKitchen
                        )}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                            title="Editar producto"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                            title="Eliminar producto"
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
          <div className="p-8 text-center text-muted-foreground">
            No se encontraron productos en esta categoría.
          </div>
        )}
      </div>

      {/* PROFESSIONAL MULTI-INGREDIENT ESCANDALLO & LABOR COST MODAL */}
      {costProduct && (
        <Modal
          title={`📋 Ficha de Costo & Escandallo: ${costProduct.name}`}
          onClose={() => setCostProduct(null)}
          className="max-w-3xl"
        >
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {/* Top Product Header Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{costProduct.emoji}</span>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{costProduct.name}</h3>
                  <p className="text-[11px] text-muted-foreground">
                    SKU: {costProduct.sku} · Categoría: {costProduct.category}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Precio de Venta Público</div>
                <div className="font-mono font-black text-sm text-foreground">
                  {fmtUsd(costProduct.priceUsd)} <span className="text-xs font-normal text-muted-foreground">({fmtBs(costProduct.priceUsd * rate)})</span>
                </div>
              </div>
            </div>

            {/* SECCIÓN 1: INGREDIENTES Y MATERIA PRIMA (Completamente editable por gramo y $/kg) */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
                <div>
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <span>🥩 Ingredientes de la Receta (Gramos y Precio por Kilo)</span>
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    Modifica los gramos y el costo de materia prima ($/Kg). Puedes agregar queso, jamón, carne, pollo o cualquier insumo:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleImportSupplierPrices}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/20 transition cursor-pointer"
                  title="Actualizar los $/kg con precios reales del Mercado Mayorista"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Sincronizar Proveedores</span>
                </button>
              </div>

              {/* Table of Ingredients */}
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/60 text-muted-foreground text-left text-[11px]">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Insumo / Ingrediente</th>
                      <th className="px-3 py-2 font-semibold text-center w-24">Porción (g)</th>
                      <th className="px-3 py-2 font-semibold text-center w-28">Precio ($/Kg)</th>
                      <th className="px-3 py-2 font-semibold text-right w-24">Costo Porción</th>
                      <th className="px-2 py-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {recipeIngredients.map((ing, idx) => (
                      <tr key={ing.id} className="hover:bg-secondary/20 transition">
                        <td className="px-3 py-1.5 font-sans">
                          <input
                            type="text"
                            value={ing.name}
                            onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                            className="w-full bg-transparent font-medium text-foreground focus:bg-card border border-transparent focus:border-border rounded px-1.5 py-0.5"
                            placeholder="Nombre del insumo..."
                          />
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={ing.grams}
                              onChange={(e) => updateIngredient(idx, "grams", e.target.value)}
                              className="w-16 text-center font-bold font-mono rounded border border-border bg-secondary/50 px-1 py-0.5 text-xs text-foreground focus:bg-card"
                            />
                            <span className="text-[10px] text-muted-foreground font-sans">g</span>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <div className="inline-flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground font-mono">$</span>
                            <input
                              type="number"
                              step="0.05"
                              min="0"
                              value={ing.pricePerKg}
                              onChange={(e) => updateIngredient(idx, "pricePerKg", e.target.value)}
                              className="w-20 text-center font-bold font-mono rounded border border-border bg-secondary/50 px-1 py-0.5 text-xs text-foreground focus:bg-card"
                            />
                            <span className="text-[10px] text-muted-foreground font-sans">/kg</span>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 text-right font-bold text-foreground">
                          ${ing.unitCostUsd.toFixed(3)}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeIngredient(idx)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded transition"
                            title="Eliminar ingrediente"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Quick Add Buttons & Custom Insumo */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground mr-1">+ Rápido:</span>
                  {[
                    { label: "Queso Blanco", g: 25, price: 4.50 },
                    { label: "Queso Amarillo", g: 25, price: 5.20 },
                    { label: "Jamón Pierna", g: 25, price: 5.80 },
                    { label: "Carne Mechada", g: 50, price: 6.50 },
                    { label: "Pollo Guisado", g: 50, price: 4.20 },
                    { label: "Caraotas", g: 25, price: 2.20 },
                    { label: "Tajadas", g: 15, price: 1.20 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => addIngredient(preset.label, preset.g, preset.price)}
                      className="px-2 py-0.5 rounded-lg border border-border bg-secondary/70 hover:bg-secondary text-[10px] font-semibold text-foreground transition active:scale-95"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addIngredient("Nuevo Insumo", 20, 3.50)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/20 transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Otro Ingrediente</span>
                </button>
              </div>
            </div>

            {/* SECCIÓN 2: COCINA, FRITURA, EMPAQUE Y GAS */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                <span>🛢️ Insumos de Cocina: Aceite, Empaque y Gas</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-border bg-secondary/30 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Aceite Freidora (Absorción)</span>
                    <span className="font-mono font-bold text-foreground">${oilCost.toFixed(3)} USD</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-[10px] text-muted-foreground">
                      ml por pieza:
                      <input
                        type="number"
                        step="5"
                        min="0"
                        value={recipeOilMl}
                        onChange={(e) => setRecipeOilMl(parseFloat(e.target.value) || 0)}
                        className="w-full rounded border border-border bg-card px-2 py-1 font-mono text-xs font-bold mt-0.5"
                      />
                    </label>
                    <label className="text-[10px] text-muted-foreground">
                      Costo $/Litro:
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={recipeOilPriceL}
                        onChange={(e) => setRecipeOilPriceL(parseFloat(e.target.value) || 0)}
                        className="w-full rounded border border-border bg-card px-2 py-1 font-mono text-xs font-bold mt-0.5"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-secondary/30 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Empaque, Bolsa & Gas</span>
                    <span className="font-mono font-bold text-foreground">${recipePackEnergy.toFixed(3)} USD</span>
                  </div>
                  <label className="text-[10px] text-muted-foreground block">
                    Costo unitario por empanada ($ USD):
                    <input
                      type="number"
                      step="0.005"
                      min="0"
                      value={recipePackEnergy}
                      onChange={(e) => setRecipePackEnergy(parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-border bg-card px-2 py-1 font-mono text-xs font-bold mt-0.5"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: MANO DE OBRA DEL TRABAJADOR (REQUERIMIENTO CLAVE) */}
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    👷
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-foreground">
                      Mano de Obra del Trabajador (Costo Laboral)
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      Incluye lo que gana el trabajador por armar y freír la empanada
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[11px] font-semibold text-foreground">Incluir en Costo:</span>
                  <input
                    type="checkbox"
                    checked={includeLabor}
                    onChange={(e) => setIncludeLabor(e.target.checked)}
                    className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
                  />
                </label>
              </div>

              {includeLabor && (
                <div className="space-y-3 pt-1 border-t border-blue-500/20 text-xs">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setLaborType("per_unit")}
                      className={`px-3 py-1.5 rounded-xl font-semibold text-xs border transition ${
                        laborType === "per_unit"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-card border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      💰 Por Pieza Producida (Trato / Unidad)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLaborType("daily_shift")}
                      className={`px-3 py-1.5 rounded-xl font-semibold text-xs border transition ${
                        laborType === "daily_shift"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-card border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      📅 Por Jornada Diaria ÷ Cantidad de Piezas
                    </button>
                  </div>

                  {laborType === "per_unit" ? (
                    <div className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-foreground">Pago por empanada elaborada:</span>
                        <p className="text-[10px] text-muted-foreground">Ej: $0.10 USD por cada empanada que hace el cocinero</p>
                      </div>
                      <div className="inline-flex items-center gap-1">
                        <span className="font-mono font-bold text-muted-foreground">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={laborCostPerUnit}
                          onChange={(e) => setLaborCostPerUnit(parseFloat(e.target.value) || 0)}
                          className="w-20 text-center font-mono font-bold text-sm rounded-lg border border-border bg-secondary/50 p-1 text-foreground"
                        />
                        <span className="text-[11px] text-muted-foreground">USD</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Sueldo del trabajador por día ($ USD):
                          <input
                            type="number"
                            step="0.50"
                            min="0"
                            value={laborDailySalary}
                            onChange={(e) => setLaborDailySalary(parseFloat(e.target.value) || 0)}
                            className="w-full rounded-lg border border-border bg-secondary/50 px-2 py-1 font-mono font-bold text-xs mt-0.5 text-foreground"
                          />
                        </label>
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Empanadas promedio producidas al día:
                          <input
                            type="number"
                            step="10"
                            min="1"
                            value={laborDailyUnits}
                            onChange={(e) => setLaborDailyUnits(parseInt(e.target.value) || 1)}
                            className="w-full rounded-lg border border-border bg-secondary/50 px-2 py-1 font-mono font-bold text-xs mt-0.5 text-foreground"
                          />
                        </label>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-border text-[11px]">
                        <span className="text-muted-foreground">
                          Cálculo: ${laborDailySalary.toFixed(2)} ÷ {laborDailyUnits} piezas =
                        </span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                          ${unitLaborCost.toFixed(3)} USD por empanada
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECCIÓN 4: RESUMEN FINANCIERO Y RENTABILIDAD EN VIVO */}
            <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="rounded-xl bg-card border border-border p-2">
                  <div className="text-[10px] text-muted-foreground font-semibold">🥩 Materia Prima</div>
                  <div className="font-mono font-bold text-foreground text-xs mt-0.5">${ingredientsCost.toFixed(3)}</div>
                </div>
                <div className="rounded-xl bg-card border border-border p-2">
                  <div className="text-[10px] text-muted-foreground font-semibold">🛢️ Aceite & Empaque</div>
                  <div className="font-mono font-bold text-foreground text-xs mt-0.5">${kitchenSuppliesCost.toFixed(3)}</div>
                </div>
                <div className="rounded-xl bg-card border border-border p-2">
                  <div className="text-[10px] text-muted-foreground font-semibold">👷 Mano de Obra</div>
                  <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs mt-0.5">${unitLaborCost.toFixed(3)}</div>
                </div>
                <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-2">
                  <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase">Costo Real Total</div>
                  <div className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm mt-0.5">
                    ${calculatedTotalCost.toFixed(2)} USD
                  </div>
                </div>
              </div>

              {/* Profit & Margin Breakdown */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-emerald-500/30 text-xs">
                <div>
                  <span className="text-muted-foreground">Ganancia Neta por Empanada: </span>
                  <span className="font-mono font-black text-foreground text-sm">
                    +${Math.max(0, costProduct.priceUsd - calculatedTotalCost).toFixed(2)} USD
                  </span>
                  <span className="text-muted-foreground text-[10px]"> ({fmtBs(Math.max(0, costProduct.priceUsd - calculatedTotalCost) * rate)})</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Margen de Rentabilidad: </span>
                  <span className={`font-mono font-black text-sm px-2 py-0.5 rounded-lg ${
                    costProduct.priceUsd > calculatedTotalCost ? "bg-emerald-600 text-white" : "bg-destructive text-white"
                  }`}>
                    {costProduct.priceUsd > 0
                      ? (((costProduct.priceUsd - calculatedTotalCost) / costProduct.priceUsd) * 100).toFixed(1)
                      : "0"}%
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setCostProduct(null)}
                className={btnGhost}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveFullRecipeCost}
                className={`${btnPrimary} flex items-center gap-2`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Guardar Ficha de Costo (${calculatedTotalCost.toFixed(2)} USD)</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Product Create / Edit Modal */}
      {formOpen && (
        <Modal
          title={editing ? `Editar Producto: ${editing.name}` : "Nuevo Producto en Catálogo"}
          onClose={() => setFormOpen(false)}
          width="max-w-xl"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setFormOpen(false)} className={btnGhost}>
                Cancelar
              </button>
              <button type="button" onClick={handleSave} className={btnPrimary}>
                {editing ? "Guardar cambios" : "Crear producto"}
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="font-semibold text-foreground block mb-1">Nombre completo:</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Empanada Pabellón Criollo"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Emoji / Icono:</label>
                <input
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  className={`${inputCls} text-center text-lg`}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">Nombre corto (KDS):</label>
                <input
                  value={form.short}
                  onChange={(e) => setForm({ ...form, short: e.target.value })}
                  placeholder="Pabellón"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">SKU / Código:</label>
                <input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Categoría:</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                  className={inputCls}
                >
                  {(pos.categories || VALID_CATS).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">Precio Venta (USD):</label>
                <input
                  type="number"
                  step="0.05"
                  value={form.priceUsd}
                  onChange={(e) => setForm({ ...form, priceUsd: e.target.value })}
                  className={inputCls}
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Equivalente: {fmtBs((parseFloat(form.priceUsd) || 0) * rate)}
                </span>
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Costo Unitario (USD):</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.costUsd}
                  onChange={(e) => setForm({ ...form, costUsd: e.target.value })}
                  className={inputCls}
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Puedes calcularlo con la ficha de escandallo
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">Stock en Barra (Listo):</label>
                <input
                  type="number"
                  value={form.stockBar}
                  onChange={(e) => setForm({ ...form, stockBar: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Stock en Cocina (Congelado):</label>
                <input
                  type="number"
                  value={form.stockKitchen}
                  onChange={(e) => setForm({ ...form, stockKitchen: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Modificadores / Salsas (separados por coma):</label>
              <input
                value={form.modifiers}
                onChange={(e) => setForm({ ...form, modifiers: e.target.value })}
                placeholder="+ Guasacaca, + Tártara, Bien tostada"
                className={inputCls}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="kitchenCheck"
                checked={form.kitchen}
                onChange={(e) => setForm({ ...form, kitchen: e.target.checked })}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
              <label htmlFor="kitchenCheck" className="text-foreground font-medium cursor-pointer">
                Enviar comanda a Cocina / Freidora KDS (desmarcar si es bebida o producto de barra)
              </label>
            </div>
          </div>
        </Modal>
      )}

      {/* Category Management Modal */}
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
