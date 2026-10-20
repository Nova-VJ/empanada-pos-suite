import re

file_path = r"c:\Users\patri\Downloads\TPV Mundial\lovable-frontend\src\components\erp\ProductsModule.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update imports
old_import = 'import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react";'
new_import = '''import {
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
} from "lucide-react";'''

if old_import in code:
    code = code.replace(old_import, new_import, 1)

# 2. Update states
old_states = '''  const [customCost, setCustomCost] = useState<string>("0.60");
  const [portionDough, setPortionDough] = useState(80); // gramos
  const [portionFilling, setPortionFilling] = useState(60); // gramos
  const [portionOil, setPortionOil] = useState(25); // ml
  const [portionPack, setPortionPack] = useState(0.07); // USD
  const [formOpen, setFormOpen] = useState(false);'''

new_states = '''  const [customCost, setCustomCost] = useState<string>("0.60");
  const [costTab, setCostTab] = useState<"facturas" | "mercado" | "manual">("facturas");
  const [flourCostKg, setFlourCostKg] = useState<number>(0.95);
  const [fillingCostKg, setFillingCostKg] = useState<number>(5.20);
  const [oilCostL, setOilCostL] = useState<number>(1.77);
  const [packCostUnit, setPackCostUnit] = useState<number>(0.055);
  const [energyCostUnit, setEnergyCostUnit] = useState<number>(0.035);
  const [portionDoughG, setPortionDoughG] = useState<number>(80);
  const [portionFillingG, setPortionFillingG] = useState<number>(60);
  const [portionOilMl, setPortionOilMl] = useState<number>(25);
  const [formOpen, setFormOpen] = useState(false);'''

if old_states in code:
    code = code.replace(old_states, new_states, 1)

# 3. Update openCostSheet & handleSelectCostMode
old_open_cost = '''  function openCostSheet(p: Product) {
    setCostProduct(p);
    setCustomCost(p.costUsd.toFixed(2));
    // Dynamic defaults according to product category
    if (p.category === "Empanadas") {
      setPortionDough(80);
      setPortionFilling(60);
      setPortionOil(25);
      setPortionPack(0.07);
    } else if (p.category === "Pastelitos") {
      setPortionDough(70);
      setPortionFilling(50);
      setPortionOil(20);
      setPortionPack(0.06);
    } else {
      setPortionDough(0);
      setPortionFilling(0);
      setPortionOil(0);
      setPortionPack(0.05);
    }
  }'''

new_open_cost = '''  function getFillingDefaults(name: string) {
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
  }'''

if old_open_cost in code:
    code = code.replace(old_open_cost, new_open_cost, 1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Part 1 updated successfully")
