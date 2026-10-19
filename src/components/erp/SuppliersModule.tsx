import { useState, useMemo } from "react";
import { ArrowRight, CheckCircle2, Edit, FileText, Filter, Package, Plus, Search, SlidersHorizontal, Truck, Award, Sparkles, X, Calculator } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";
import type { POStatus, Supplier } from "@/types/pos";
import { Modal, btnGhost, btnPrimary, inputCls } from "../pos/Modal";

const poStatusColors: Record<POStatus, string> = {
  borrador: "bg-secondary text-muted-foreground",
  enviado: "bg-module-sales-light text-module-sales",
  en_camino: "bg-module-cash-light text-module-cash",
  recibido: "bg-module-inventory-light text-module-inventory",
  facturado: "bg-module-suppliers-light text-module-suppliers",
  cancelado: "bg-destructive/10 text-destructive",
};

const poStatusFlow: Record<POStatus, POStatus | undefined> = {
  borrador: "enviado",
  enviado: "en_camino",
  en_camino: "recibido",
  recibido: "facturado",
  facturado: undefined,
  cancelado: undefined,
};

export interface SupplyAlternative {
  supplier: string;
  priceUsd: number;
  rating: number;
  deliveryHours: number;
  creditDays: number;
  verified: boolean;
  isCurrent?: boolean;
  savingsPct?: number;
}

export interface MarketSupplyItem {
  id: string;
  name: string;
  category: string;
  currentSupplier: string;
  currentPriceUsd: number;
  alternatives: SupplyAlternative[];
}

export const MARKET_SUPPLIES: MarketSupplyItem[] = [
  {
    id: "supply-1",
    name: "Harina de Maíz Blanco Precocida (Bulto 20 kg)",
    category: "Harinas",
    currentSupplier: "Alimentos Polar Comercial C.A.",
    currentPriceUsd: 22.5,
    alternatives: [
      { supplier: "Alimentos Polar Comercial C.A.", priceUsd: 22.5, rating: 98, deliveryHours: 24, creditDays: 15, verified: true, isCurrent: true },
      { supplier: "Distribuidora Mayorista Central C.A.", priceUsd: 20.8, rating: 92, deliveryHours: 48, creditDays: 7, verified: true, savingsPct: 7.5 },
      { supplier: "Inversiones Hermanos Gómez C.A.", priceUsd: 19.9, rating: 85, deliveryHours: 72, creditDays: 0, verified: false, savingsPct: 11.5 },
    ],
  },
  {
    id: "supply-2",
    name: "Queso Llanero Blanco Duro (Kilo)",
    category: "Lácteos",
    currentSupplier: "Lácteos y Quesera Llanera Guárico C.A.",
    currentPriceUsd: 4.8,
    alternatives: [
      { supplier: "Lácteos y Quesera Llanera Guárico C.A.", priceUsd: 4.8, rating: 88, deliveryHours: 48, creditDays: 7, verified: true, isCurrent: true },
      { supplier: "Agropecuaria El Sombrero C.A.", priceUsd: 4.1, rating: 94, deliveryHours: 24, creditDays: 10, verified: true, savingsPct: 14.5 },
      { supplier: "Distribuidora Lácteos Aragua C.A.", priceUsd: 4.35, rating: 90, deliveryHours: 36, creditDays: 15, verified: true, savingsPct: 9.3 },
    ],
  },
  {
    id: "supply-3",
    name: "Aceite Vegetal Comestible (Bidón 18 Litros)",
    category: "Aceites",
    currentSupplier: "Alimentos Polar Comercial C.A.",
    currentPriceUsd: 32.0,
    alternatives: [
      { supplier: "Alimentos Polar Comercial C.A.", priceUsd: 32.0, rating: 95, deliveryHours: 24, creditDays: 15, verified: true, isCurrent: true },
      { supplier: "Oleaginosas Industriales C.A. (Portuguesa)", priceUsd: 27.5, rating: 93, deliveryHours: 48, creditDays: 21, verified: true, savingsPct: 14.0 },
      { supplier: "Comercializadora San Martín", priceUsd: 28.9, rating: 89, deliveryHours: 48, creditDays: 15, verified: true, savingsPct: 9.6 },
    ],
  },
  {
    id: "supply-4",
    name: "Carne de Res de Primera para Mechar (Kilo)",
    category: "Carnes",
    currentSupplier: "Carnes y Frigorífico San Antonio C.A.",
    currentPriceUsd: 6.9,
    alternatives: [
      { supplier: "Carnes y Frigorífico San Antonio C.A.", priceUsd: 6.9, rating: 91, deliveryHours: 24, creditDays: 7, verified: true, isCurrent: true },
      { supplier: "Frigorífico Industrial Centro-Occidente", priceUsd: 6.1, rating: 96, deliveryHours: 24, creditDays: 14, verified: true, savingsPct: 11.5 },
      { supplier: "Distribuidora Cárnica Barinas C.A.", priceUsd: 5.95, rating: 87, deliveryHours: 48, creditDays: 7, verified: true, savingsPct: 13.7 },
    ],
  },
  {
    id: "supply-5",
    name: "Cazón Margariteño Fresco Limpio (Kilo)",
    category: "Pescados",
    currentSupplier: "Pescadería Mar Caribe C.A.",
    currentPriceUsd: 5.8,
    alternatives: [
      { supplier: "Pescadería Mar Caribe C.A.", priceUsd: 5.8, rating: 89, deliveryHours: 24, creditDays: 0, verified: true, isCurrent: true },
      { supplier: "Cooperativa Pesquera Sucre & Coche", priceUsd: 4.9, rating: 95, deliveryHours: 36, creditDays: 7, verified: true, savingsPct: 15.5 },
    ],
  },
  {
    id: "supply-6",
    name: "Cajas Térmicas Para Llevar (Paquete 100 Uds.)",
    category: "Empaques",
    currentSupplier: "Empaques y Plásticos Caracas C.A.",
    currentPriceUsd: 18.0,
    alternatives: [
      { supplier: "Empaques y Plásticos Caracas C.A.", priceUsd: 18.0, rating: 90, deliveryHours: 48, creditDays: 15, verified: true, isCurrent: true },
      { supplier: "EcoPack Venezuela S.A.", priceUsd: 14.5, rating: 97, deliveryHours: 24, creditDays: 30, verified: true, savingsPct: 19.4 },
    ],
  },
];

export interface SimulationItem {
  supplyId: string;
  qty: number;
}

export interface SimulationResultItem {
  supplyId: string;
  name: string;
  qty: number;
  currentSupplier: string;
  currentPrice: number;
  currentSubtotal: number;
  recommendedSupplier: string;
  recommendedPrice: number;
  recommendedSubtotal: number;
  itemSavingsUsd: number;
  itemSavingsPct: number;
  deliveryHours: number;
  creditDays: number;
}

export interface SimulationResult {
  currentTotalUsd: number;
  optimizedTotalUsd: number;
  savingsUsd: number;
  savingsPct: number;
  itemsBreakdown: SimulationResultItem[];
}

export function calculateSupplySavingsSimulation(
  items: SimulationItem[],
  suppliesList: MarketSupplyItem[] = MARKET_SUPPLIES
): SimulationResult {
  let currentTotalUsd = 0;
  let optimizedTotalUsd = 0;

  const itemsBreakdown: SimulationResultItem[] = items.map((item) => {
    const supply = suppliesList.find((s) => s.id === item.supplyId);
    if (!supply) {
      return {
        supplyId: item.supplyId,
        name: "Insumo desconocido",
        qty: item.qty,
        currentSupplier: "N/A",
        currentPrice: 0,
        currentSubtotal: 0,
        recommendedSupplier: "N/A",
        recommendedPrice: 0,
        recommendedSubtotal: 0,
        itemSavingsUsd: 0,
        itemSavingsPct: 0,
        deliveryHours: 0,
        creditDays: 0,
      };
    }

    const nonCurrentAlts = supply.alternatives.filter((a) => !a.isCurrent);
    const bestAlt =
      nonCurrentAlts.length > 0
        ? [...nonCurrentAlts].sort((a, b) => a.priceUsd - b.priceUsd)[0]
        : supply.alternatives[0];

    const recommendedPrice = bestAlt ? bestAlt.priceUsd : supply.currentPriceUsd;
    const currentSubtotal = Math.round(supply.currentPriceUsd * item.qty * 100) / 100;
    const recommendedSubtotal = Math.round(recommendedPrice * item.qty * 100) / 100;
    const itemSavingsUsd = Math.round(Math.max(0, currentSubtotal - recommendedSubtotal) * 100) / 100;
    const itemSavingsPct = currentSubtotal > 0 ? Math.round((itemSavingsUsd / currentSubtotal) * 1000) / 10 : 0;

    currentTotalUsd += currentSubtotal;
    optimizedTotalUsd += recommendedSubtotal;

    return {
      supplyId: supply.id,
      name: supply.name,
      qty: item.qty,
      currentSupplier: supply.currentSupplier,
      currentPrice: supply.currentPriceUsd,
      currentSubtotal,
      recommendedSupplier: bestAlt ? bestAlt.supplier : supply.currentSupplier,
      recommendedPrice,
      recommendedSubtotal,
      itemSavingsUsd,
      itemSavingsPct,
      deliveryHours: bestAlt ? bestAlt.deliveryHours : 24,
      creditDays: bestAlt ? bestAlt.creditDays : 0,
    };
  });

  currentTotalUsd = Math.round(currentTotalUsd * 100) / 100;
  optimizedTotalUsd = Math.round(optimizedTotalUsd * 100) / 100;
  const savingsUsd = Math.round(Math.max(0, currentTotalUsd - optimizedTotalUsd) * 100) / 100;
  const savingsPct = currentTotalUsd > 0 ? Math.round((savingsUsd / currentTotalUsd) * 1000) / 10 : 0;

  return {
    currentTotalUsd,
    optimizedTotalUsd,
    savingsUsd,
    savingsPct,
    itemsBreakdown,
  };
}

export function SuppliersModule() {
  const pos = usePos();
  const { suppliers, purchaseOrders, supplierInvoices, products, rate } = pos;
  const [tab, setTab] = useState<"finder" | "suppliers" | "orders" | "invoices">("finder");
  const [search, setSearch] = useState("");
  const [supplyCategory, setSupplyCategory] = useState<string>("Todos");
  const [supModal, setSupModal] = useState(false);
  const [poModal, setPoModal] = useState(false);
  const [simModal, setSimModal] = useState(false);
  const [editingSup, setEditingSup] = useState<Supplier | null>(null);

  const [simQtys, setSimQtys] = useState<Record<string, number>>({
    "supply-1": 20, // 20 Bultos Harina P.A.N. (20kg)
    "supply-2": 30, // 30 Kilos Queso Llanero Duro
    "supply-3": 5,  // 5 Bidones Aceite Vegetal 18L
    "supply-4": 25, // 25 Kilos Carne de Res para Mechar
    "supply-5": 15, // 15 Kilos Cazón Margariteño
    "supply-6": 5,  // 5 Paquetes Cajas Térmicas (100 uds)
  });

  const simulationResult = useMemo(() => {
    const items: SimulationItem[] = Object.entries(simQtys)
      .filter(([_, q]) => q > 0)
      .map(([supplyId, qty]) => ({ supplyId, qty }));
    return calculateSupplySavingsSimulation(items);
  }, [simQtys]);

  const [supForm, setSupForm] = useState({
    name: "",
    rif: "J-",
    email: "",
    phone: "0212-",
    city: "Caracas",
    paymentDays: "15",
    category: "Harinas, Aceites y Bebidas",
    active: true,
  });

  const [poForm, setPoForm] = useState({
    supplierId: suppliers[0]?.id ?? "sup-1",
    itemsSummary: "20 Bultos Harina P.A.N. + 5 Bidones Aceite 18L",
    productId: products[0]?.id ?? "e1",
    qty: "50",
    totalUsd: "420.00",
  });

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rif.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  const [sortBy, setSortBy] = useState<"savings" | "price_asc" | "rating" | "delivery">("savings");
  const [maxDeliveryHours, setMaxDeliveryHours] = useState<number>(72);
  const [onlyCredit, setOnlyCredit] = useState<boolean>(false);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);

  const filteredSupplies = MARKET_SUPPLIES.filter(
    (s) =>
      (supplyCategory === "Todos" || s.category === supplyCategory) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) || s.currentSupplier.toLowerCase().includes(search.toLowerCase()))
  ).map((item) => {
    // Filtrar y ordenar las alternativas según los parámetros del dueño
    const filteredAlts = item.alternatives
      .filter((alt) => {
        if (alt.isCurrent) return true; // Siempre mantener el proveedor actual como referencia
        if (alt.deliveryHours > maxDeliveryHours) return false;
        if (onlyCredit && alt.creditDays <= 0) return false;
        if (onlyVerified && !alt.verified) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.isCurrent) return -1;
        if (b.isCurrent) return 1;
        if (sortBy === "price_asc") return a.priceUsd - b.priceUsd;
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "delivery") return a.deliveryHours - b.deliveryHours;
        return (b.savingsPct ?? 0) - (a.savingsPct ?? 0);
      });

    return { ...item, alternatives: filteredAlts };
  });

  function handleOrderFromAlternative(supplyName: string, alt: { supplier: string; priceUsd: number }) {
    setPoForm({
      supplierId: suppliers[0]?.id ?? "sup-1",
      itemsSummary: `Insumo: ${supplyName} (@ $${alt.priceUsd.toFixed(2)} cotizado con ${alt.supplier})`,
      productId: products[0]?.id ?? "e1",
      qty: "10",
      totalUsd: String(alt.priceUsd * 10),
    });
    setPoModal(true);
  }

  function openNewSupplier() {
    setEditingSup(null);
    setSupForm({
      name: "",
      rif: "J-",
      email: "",
      phone: "0212-",
      city: "Caracas",
      paymentDays: "15",
      category: "Quesos y Lácteos",
      active: true,
    });
    setSupModal(true);
  }

  function openEditSupplier(s: Supplier) {
    setEditingSup(s);
    setSupForm({
      name: s.name,
      rif: s.rif,
      email: s.email,
      phone: s.phone,
      city: s.city,
      paymentDays: String(s.paymentDays),
      category: s.category,
      active: s.active,
    });
    setSupModal(true);
  }

  function saveSupplier() {
    if (!supForm.name.trim()) {
      toast.error("El nombre del proveedor es obligatorio");
      return;
    }
    const payload = {
      name: supForm.name.trim(),
      rif: supForm.rif.trim(),
      email: supForm.email.trim(),
      phone: supForm.phone.trim(),
      city: supForm.city.trim(),
      paymentDays: parseInt(supForm.paymentDays, 10) || 15,
      category: supForm.category,
      active: supForm.active,
    };
    if (editingSup) {
      pos.updateSupplier(editingSup.id, payload);
      toast.success("Proveedor actualizado");
    } else {
      pos.createSupplier(payload);
      toast.success("Proveedor creado");
    }
    setSupModal(false);
  }

  function savePurchaseOrder() {
    const totalUsd = parseFloat(poForm.totalUsd) || 0;
    if (!poForm.itemsSummary.trim() || totalUsd <= 0) {
      toast.error("Completa el detalle y monto del pedido");
      return;
    }
    pos.createPurchaseOrder({
      supplierId: poForm.supplierId,
      itemsSummary: poForm.itemsSummary.trim(),
      productId: poForm.productId,
      qty: parseInt(poForm.qty, 10) || 40,
      totalUsd,
    });
    toast.success("Pedido de compra creado");
    setPoModal(false);
    setTab("orders");
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Proveedores & Compras Inteligentes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comparador de mejores proveedores de insumos (Harina, Queso, Aceite, Carnes), órdenes de compra y facturas
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSimModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition"
            title="Simular orden en lote y calcular ahorro frente a mayoristas"
          >
            <Sparkles className="h-4 w-4" />
            Simulador de Ahorro Mayorista
          </button>
          <button
            onClick={() => setPoModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition"
          >
            <Package className="h-4 w-4 text-module-suppliers" />
            Nuevo pedido de compra
          </button>
          <button
            onClick={openNewSupplier}
            className="inline-flex items-center gap-2 rounded-xl bg-module-suppliers px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-border pb-2">
        <button
          onClick={() => setTab("finder")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
            tab === "finder" ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          🔍 Buscar Mejores Proveedores (Comparador)
        </button>
        {[
          { id: "suppliers", label: `Proveedores Registrados (${suppliers.length})`, icon: Truck },
          { id: "orders", label: `Pedidos de Compra (${purchaseOrders.length})`, icon: Package },
          { id: "invoices", label: `Facturas Recibidas (${supplierInvoices.length})`, icon: FileText },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === t.id ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Comparador de Mejores Proveedores */}
      {tab === "finder" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/25 bg-primary/10 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">💡 Buscador Inteligente de Oportunidades de Compra</h3>
                <span className="rounded bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5">Control del Dueño</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Compara precios en tiempo real entre tus proveedores habituales y el mercado mayorista venezolano para ahorrar en insumos críticos.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSimModal(true)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-2xs transition flex items-center gap-1.5"
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>Simular Lote de Compra</span>
              </button>
              <div className="flex flex-wrap gap-1">
                {["Todos", "Harinas", "Lácteos", "Aceites", "Carnes", "Empaques"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSupplyCategory(cat)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                      supplyCategory === cat
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-card text-muted-foreground hover:text-foreground border border-border"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Parámetros Elegibles por el Dueño */}
          <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <span>Parámetros de Búsqueda:</span>
              </div>

              {/* Ordenar por */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Priorizar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground outline-none focus:border-primary"
                >
                  <option value="savings">Mayor % de Ahorro</option>
                  <option value="price_asc">Menor Precio en USD ($)</option>
                  <option value="rating">Mejor Calificación (Score)</option>
                  <option value="delivery">Despacho más Rápido</option>
                </select>
              </div>

              {/* Tiempo máx de entrega */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Entrega máx:</span>
                <select
                  value={maxDeliveryHours}
                  onChange={(e) => setMaxDeliveryHours(Number(e.target.value))}
                  className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground outline-none focus:border-primary"
                >
                  <option value={24}>Express 24 Horas</option>
                  <option value={48}>Hasta 48 Horas</option>
                  <option value={72}>Hasta 72 Horas (Todas)</option>
                </select>
              </div>
            </div>

            {/* Checkboxes de condiciones */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={onlyCredit}
                  onChange={(e) => setOnlyCredit(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span>Solo con Crédito (Días)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                  Solo Verificados
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSupplies.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-foreground text-sm mt-1">{item.name}</h4>
                    <p className="text-[11px] text-muted-foreground">Proveedor actual: {item.currentSupplier}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-base font-bold text-foreground">{fmtUsd(item.currentPriceUsd)}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{fmtBs(item.currentPriceUsd * rate)}</div>
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-border">
                  <div className="text-[11px] font-semibold text-muted-foreground">Alternativas y Comparativa de Mercado:</div>
                  {item.alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg p-2.5 text-xs flex items-center justify-between gap-3 border ${
                        alt.isCurrent
                          ? "bg-secondary/40 border-border"
                          : alt.savingsPct && alt.savingsPct > 10
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-card border-border"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground truncate">
                          <span>{alt.supplier}</span>
                          {alt.isCurrent && (
                            <span className="rounded bg-secondary px-1.5 py-0.2 text-[9px] font-bold text-muted-foreground">
                              Actual
                            </span>
                          )}
                          {alt.savingsPct && (
                            <span className="rounded bg-emerald-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                              Ahorro {alt.savingsPct}%
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                          Entrega: {alt.deliveryHours}h · Crédito: {alt.creditDays} días · Score: {alt.rating}/100
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <div className="font-mono font-bold text-foreground">{fmtUsd(alt.priceUsd)}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{fmtBs(alt.priceUsd * rate)}</div>
                        </div>
                        {!alt.isCurrent && (
                          <button
                            onClick={() => handleOrderFromAlternative(item.name, alt)}
                            className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-2xs"
                          >
                            Pedir Cotización
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "suppliers" && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Buscar proveedor o RIF..."
              className={`${inputCls} pl-9`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nombre / Razón Social</th>
                  <th className="px-4 py-3 font-semibold">RIF</th>
                  <th className="px-4 py-3 font-semibold">Rubro</th>
                  <th className="px-4 py-3 font-semibold">Contacto</th>
                  <th className="px-4 py-3 font-semibold">Crédito</th>
                  <th className="px-4 py-3 font-semibold">Scoring</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 w-[60px]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-semibold text-foreground">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{s.rif}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{s.phone}</div>
                      <div className="text-[11px]">{s.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">{s.paymentDays} días</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${
                          s.score >= 80
                            ? "bg-module-inventory-light text-module-inventory"
                            : "bg-module-cash-light text-module-cash"
                        }`}
                      >
                        {s.score}/100
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-module-suppliers-light px-2 py-0.5 text-[11px] font-semibold text-module-suppliers">
                        {s.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEditSupplier(s)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Nº Pedido</th>
                <th className="px-4 py-3 font-semibold">Proveedor</th>
                <th className="px-4 py-3 font-semibold">Insumos / Detalle</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold text-right">Total (USD / Bs.)</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 text-right">Flujo de Recepción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {purchaseOrders.map((po) => {
                const next = poStatusFlow[po.status];
                return (
                  <tr key={po.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">#{po.orderNumber}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{po.supplierName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{po.itemsSummary}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {new Date(po.createdAt).toLocaleDateString("es-VE")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <div className="font-bold text-foreground">{fmtUsd(po.totalUsd)}</div>
                      <div className="text-[10px] text-muted-foreground">{fmtBs(po.totalUsd * rate)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase ${poStatusColors[po.status]}`}>
                        {po.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {next && (
                        <button
                          onClick={() => {
                            pos.advancePurchaseOrder(po.id);
                            toast.success(
                              next === "recibido"
                                ? `Pedido #${po.orderNumber} recibido — Stock incrementado en Inventario`
                                : `Pedido #${po.orderNumber} avanzado a: ${next.replace("_", " ")}`
                            );
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground transition"
                        >
                          <ArrowRight className="h-3 w-3" />
                          Avanzar a {next.replace("_", " ")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "invoices" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Nº Factura</th>
                <th className="px-4 py-3 font-semibold">Proveedor</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold text-right">Base (USD)</th>
                <th className="px-4 py-3 font-semibold text-right">IVA (USD)</th>
                <th className="px-4 py-3 font-semibold text-right">Total (USD / Bs.)</th>
                <th className="px-4 py-3 font-semibold">Estado Pago</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {supplierInvoices.map((si) => (
                <tr key={si.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono font-bold text-foreground">{si.invoiceNumber}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{si.supplierName}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {new Date(si.createdAt).toLocaleDateString("es-VE")}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{fmtUsd(si.subtotalUsd)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtUsd(si.taxUsd)}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    <div className="font-bold text-foreground">{fmtUsd(si.totalUsd)}</div>
                    <div className="text-[10px] text-muted-foreground">{fmtBs(si.totalUsd * rate)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        si.paid
                          ? "bg-module-inventory-light text-module-inventory"
                          : "bg-module-expenses-light text-module-expenses"
                      }`}
                    >
                      {si.paid ? "Pagada" : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        pos.toggleSupplierInvoicePaid(si.id);
                        toast.success(si.paid ? "Marcada como pendiente" : `Factura ${si.invoiceNumber} marcada como pagada`);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-module-inventory hover:text-white transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {si.paid ? "Reabrir" : "Registrar Pago"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {supModal && (
        <Modal
          title={editingSup ? `Editar Proveedor: ${editingSup.name}` : "Registrar Nuevo Proveedor"}
          onClose={() => setSupModal(false)}
          footer={
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setSupModal(false)}>
                Cancelar
              </button>
              <button className={btnPrimary} onClick={saveSupplier}>
                Guardar Proveedor
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <label className="sm:col-span-2 font-semibold text-foreground">
              Razón Social del Proveedor *
              <input
                value={supForm.name}
                onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="font-semibold text-foreground">
              RIF SENIAT
              <input
                value={supForm.rif}
                onChange={(e) => setSupForm({ ...supForm, rif: e.target.value })}
                className={`${inputCls} mt-1 font-mono`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Rubro / Categoría
              <input
                value={supForm.category}
                onChange={(e) => setSupForm({ ...supForm, category: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Correo Electrónico
              <input
                value={supForm.email}
                onChange={(e) => setSupForm({ ...supForm, email: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Teléfono
              <input
                value={supForm.phone}
                onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
                className={`${inputCls} mt-1 font-mono`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Ciudad
              <input
                value={supForm.city}
                onChange={(e) => setSupForm({ ...supForm, city: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Días de crédito
              <input
                type="number"
                value={supForm.paymentDays}
                onChange={(e) => setSupForm({ ...supForm, paymentDays: e.target.value })}
                className={`${inputCls} mt-1 font-mono`}
              />
            </label>
          </div>
        </Modal>
      )}

      {poModal && (
        <Modal
          title="Crear Orden de Compra a Proveedor"
          onClose={() => setPoModal(false)}
          width="max-w-lg"
          footer={
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setPoModal(false)}>
                Cancelar
              </button>
              <button className={btnPrimary} onClick={savePurchaseOrder}>
                Emitir Pedido de Compra
              </button>
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            <label className="block font-semibold text-foreground">
              Proveedor
              <select
                value={poForm.supplierId}
                onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                className={`${inputCls} mt-1`}
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.rif})
                  </option>
                ))}
              </select>
            </label>
            <label className="block font-semibold text-foreground">
              Descripción de insumos / mercadería *
              <input
                value={poForm.itemsSummary}
                onChange={(e) => setPoForm({ ...poForm, itemsSummary: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block font-semibold text-foreground">
                Producto vinculado a stock
                <select
                  value={poForm.productId}
                  onChange={(e) => setPoForm({ ...poForm, productId: e.target.value })}
                  className={`${inputCls} mt-1`}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.emoji} {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block font-semibold text-foreground">
                Unidades a ingresar al recibir
                <input
                  type="number"
                  value={poForm.qty}
                  onChange={(e) => setPoForm({ ...poForm, qty: e.target.value })}
                  className={`${inputCls} mt-1 font-mono`}
                />
              </label>
            </div>
            <label className="block font-semibold text-foreground">
              Monto Total de la Orden ($ USD · {fmtBs((parseFloat(poForm.totalUsd) || 0) * rate)})
              <input
                type="number"
                step="0.01"
                value={poForm.totalUsd}
                onChange={(e) => setPoForm({ ...poForm, totalUsd: e.target.value })}
                className={`${inputCls} mt-1 font-mono font-bold`}
              />
            </label>
          </div>
        </Modal>
      )}

      {/* Simulador de Compras Mayoristas & Cálculo de Ahorro Real */}
      {simModal && (
        <Modal
          title="Simulador de Compras Mayoristas & Cálculo de Ahorro Real"
          onClose={() => setSimModal(false)}
          width="max-w-3xl"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              <div className="text-xs">
                <span className="text-muted-foreground">Ahorro total estimado en este lote: </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {fmtUsd(simulationResult.savingsUsd)} ({simulationResult.savingsPct.toFixed(1)}%)
                </span>
                <span className="text-muted-foreground ml-1">· {fmtBs(simulationResult.savingsUsd * rate)}</span>
              </div>
              <div className="flex gap-2">
                <button className={btnGhost} onClick={() => setSimModal(false)}>
                  Cerrar
                </button>
                <button
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition"
                  onClick={() => {
                    setPoForm({
                      supplierId: suppliers[0]?.id ?? "sup-1",
                      itemsSummary: `Lote mayorista optimizado: ${simulationResult.itemsBreakdown
                        .filter((i) => i.qty > 0)
                        .map((i) => `${i.qty}x ${i.name.split(" (")[0]}`)
                        .join(", ")}`,
                      productId: products[0]?.id ?? "e1",
                      qty: "100",
                      totalUsd: simulationResult.optimizedTotalUsd.toFixed(2),
                    });
                    setSimModal(false);
                    setPoModal(true);
                    toast.success("Orden de compra precargada con los mejores precios mayoristas");
                  }}
                >
                  Generar Orden con Precios de Ahorro
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Top comparison banners */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-card p-3">
                <span className="text-[11px] text-muted-foreground block font-medium">Costo Proveedores Habituales</span>
                <span className="text-lg font-mono font-bold text-foreground mt-0.5 block">
                  {fmtUsd(simulationResult.currentTotalUsd)}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground block">
                  {fmtBs(simulationResult.currentTotalUsd * rate)}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <span className="text-[11px] text-muted-foreground block font-medium">Costo Alternativas Mayoristas</span>
                <span className="text-lg font-mono font-bold text-primary mt-0.5 block">
                  {fmtUsd(simulationResult.optimizedTotalUsd)}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground block">
                  {fmtBs(simulationResult.optimizedTotalUsd * rate)}
                </span>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block font-bold">
                  Ahorro Neto Real Obtenido
                </span>
                <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  -{fmtUsd(simulationResult.savingsUsd)}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                  {simulationResult.savingsPct.toFixed(1)}% de optimización de capital
                </span>
              </div>
            </div>

            {/* Instruction */}
            <p className="text-[11px] text-muted-foreground">
              Ajusta las cantidades que necesitas adquirir para la semana o el mes. El sistema calcula en vivo el proveedor más conveniente, sus plazos de entrega y días de crédito:
            </p>

            {/* Interactive Quantity and Item Table */}
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-secondary/50 border-b border-border text-muted-foreground text-left">
                  <tr>
                    <th className="p-2.5 font-semibold">Insumo</th>
                    <th className="p-2.5 font-semibold text-center w-20">Cantidad</th>
                    <th className="p-2.5 font-semibold">Proveedor Actual</th>
                    <th className="p-2.5 font-semibold">Alternativa Recomendada</th>
                    <th className="p-2.5 font-semibold text-right">Ahorro ($)</th>
                    <th className="p-2.5 font-semibold text-right">% Ahorro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MARKET_SUPPLIES.map((supply) => {
                    const breakdownItem = simulationResult.itemsBreakdown.find((i) => i.supplyId === supply.id);
                    const qty = simQtys[supply.id] ?? 0;
                    return (
                      <tr key={supply.id} className="hover:bg-secondary/20">
                        <td className="p-2.5 font-semibold text-foreground">
                          <div>{supply.name}</div>
                          <div className="text-[10px] text-muted-foreground">{supply.category}</div>
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) =>
                              setSimQtys((prev) => ({
                                ...prev,
                                [supply.id]: Math.max(0, parseInt(e.target.value, 10) || 0),
                              }))
                            }
                            className="w-16 rounded-lg border border-input bg-background p-1 text-center font-mono font-bold text-xs text-foreground outline-none focus:border-primary"
                          />
                        </td>
                        <td className="p-2.5">
                          <div className="font-medium text-foreground truncate max-w-[150px]">
                            {supply.currentSupplier}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            ${supply.currentPriceUsd.toFixed(2)} / ud
                          </div>
                        </td>
                        <td className="p-2.5">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[170px]">
                            {breakdownItem?.recommendedSupplier}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            ${breakdownItem?.recommendedPrice.toFixed(2)} / ud · {breakdownItem?.deliveryHours}h entrega · {breakdownItem?.creditDays}d crédito
                          </div>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400">
                          {breakdownItem && breakdownItem.itemSavingsUsd > 0
                            ? `-${fmtUsd(breakdownItem.itemSavingsUsd)}`
                            : "$0.00"}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          {breakdownItem && breakdownItem.itemSavingsPct > 0 ? (
                            <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 text-[10px]">
                              {breakdownItem.itemSavingsPct.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
