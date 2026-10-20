import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { mockProducts } from "@/data/mockProducts";
import {
  defaultCompanySettings,
  mockAccountingAccounts,
  mockBankAccounts,
  mockBankMovements,
  mockCashMovements,
  mockCustomers,
  mockExpenses,
  mockInventoryMovements,
  mockJournalEntries,
  mockPurchaseOrders,
  mockSeededOrders,
  mockSupplierInvoices,
  mockSuppliers,
} from "@/data/mockErpData";
import { breakdown, r2 } from "@/lib/money";
import { playBeep, playCashChime, playKitchenBell } from "@/services/sound";
import { api } from "@/services/api";
import { fetchMultiSourceRates } from "@/services/rateService";
import type { MultiSourceRatesData } from "@/types/rates";
import type {
  AccountingAccount,
  BankAccount,
  BankMovement,
  CartItem,
  CashMovement,
  CashMoveType,
  CompanySettings,
  CustomerInfo,
  CustomerRecord,
  DeliveryOrder,
  ExpenseRecord,
  FiscalConfig,
  InventoryMovement,
  InventoryMoveType,
  JournalEntry,
  JournalEntryLine,
  KdsStatus,
  ModuleId,
  Order,
  OrderType,
  PaymentSplit,
  POStatus,
  Product,
  PurchaseOrder,
  Shift,
  ShiftAudit,
  Supplier,
  SupplierInvoice,
} from "@/types/pos";

type ModalName = null | "payment" | "ticket" | "shift" | "printer" | "bcv" | "support";

interface PosState {
  theme: "light" | "dark";
  sidebarCollapsed: boolean;
  activeModule: ModuleId;
  products: Product[];
  cart: CartItem[];
  orderType: OrderType;
  discount: number; // 0..100
  rate: number;
  orders: Order[];
  shift: Shift;
  shiftHistory: ShiftAudit[];
  fiscal: FiscalConfig;
  nextOrder: number;
  zCounter: number;
  // NovaStock ERP state
  customers: CustomerRecord[];
  inventoryMovements: InventoryMovement[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  supplierInvoices: SupplierInvoice[];
  cashMovements: CashMovement[];
  bankAccounts: BankAccount[];
  bankMovements: BankMovement[];
  expenses: ExpenseRecord[];
  accountingAccounts: AccountingAccount[];
  journalEntries: JournalEntry[];
  companySettings: CompanySettings;
  categories: string[];
  deliveries: DeliveryOrder[];
  lastMobileSync?: number;
}

const initialRatesData: MultiSourceRatesData = {
  activeVariantId: "bcv",
  activeRate: 876.8,
  lastUpdated: Date.now(),
  autoRefresh: true,
  refreshIntervalMinutes: 5,
  spreadPct: 15.02,
  sources: {
    monitordolarve: { name: "Monitor Dólar VE", url: "https://monitordolarve.com/", status: "online", lastCheck: Date.now() },
    monitordedivisa: { name: "Monitor de Divisas Venezuela", url: "https://www.monitordedivisavenezuela.com/", status: "online", lastCheck: Date.now() },
    dolarapi: { name: "DolarAPI Contingencia", url: "https://ve.dolarapi.com/v1/dolares", status: "online", lastCheck: Date.now() },
    manual: { name: "Ajuste Local", url: "local", status: "online", lastCheck: Date.now() },
  },
  variants: {
    bcv: { id: "bcv", name: "Oficial BCV (USD)", symbol: "USD", price: 876.8, source: "monitordolarve", sourceUrl: "https://monitordolarve.com/", updatedAt: "Hoy", isOfficial: true },
    binance: { id: "binance", name: "Binance P2P (USDT)", symbol: "USDT", price: 1006.0, source: "monitordolarve", sourceUrl: "https://monitordolarve.com/", updatedAt: "Hoy" },
    euro: { id: "euro", name: "Euro BCV Oficial", symbol: "EUR", price: 982.0, source: "monitordolarve", sourceUrl: "https://monitordolarve.com/", updatedAt: "Hoy", isOfficial: true },
    paralelo: { id: "paralelo", name: "Paralelo Monitor", symbol: "USDT", price: 1008.49, source: "monitordedivisa", sourceUrl: "https://www.monitordedivisavenezuela.com/", updatedAt: "Hoy" },
    zelle: { id: "zelle", name: "Zelle Mercado", symbol: "USD", price: 997.44, source: "monitordolarve", sourceUrl: "https://monitordolarve.com/", updatedAt: "Hoy" },
    paypal: { id: "paypal", name: "PayPal Saldo", symbol: "USD", price: 953.59, source: "monitordolarve", sourceUrl: "https://monitordolarve.com/", updatedAt: "Hoy" },
    promedio: { id: "promedio", name: "Promedio General", symbol: "USD", price: 941.4, source: "monitordolarve", sourceUrl: "https://monitordolarve.com/", updatedAt: "Hoy" },
  },
};

const initialDeliveries: DeliveryOrder[] = [
  {
    id: "del-101",
    orderNumber: 101,
    clientName: "Alfonzo Bolaños",
    clientPhone: "+58 412-1499838",
    addressGps: "6FF3+MJ4, Avenida Dr. Francisco Montoya, Turmero 2107, Aragua",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=6FF3%2BMJ4%2C+Avenida+Dr.+Francisco+Montoya%2C+Turmero+2107%2C+Aragua",
    itemsText: "2x Empanada Mechada, 1x Empanada Queso Llanero, 1x Malta Polar",
    totalUsd: 6.50,
    totalBs: 5720.00,
    paymentMethod: "Pago Móvil Banesco",
    paymentReference: "7541",
    riderName: "Ezequiel",
    status: "en_camino",
    createdAt: Date.now() - 25 * 60000,
    dispatchedAt: Date.now() - 15 * 60000,
    notes: "Entregar en portón negro, timbre derecho.",
  },
  {
    id: "del-100",
    orderNumber: 100,
    clientName: "Sra. Maryorit (San Jacinto)",
    clientPhone: "+58 414-4969484",
    addressGps: "Urb. San Jacinto, Sector 2, Manzana D, Casa 14, Maracay",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=San+Jacinto+Maracay+Sector+2",
    itemsText: "4x Empanada Pollo con Queso, 2x Jugo Natural Naranja",
    totalUsd: 10.80,
    totalBs: 9504.00,
    paymentMethod: "Efectivo USD $40 (Vuelto entregado $29.20)",
    paymentReference: "Efectivo",
    riderName: "Alfonzo Bolaños",
    status: "entregado",
    createdAt: Date.now() - 75 * 60000,
    dispatchedAt: Date.now() - 55 * 60000,
    deliveredAt: Date.now() - 30 * 60000,
    notes: "Ya le dio los $40 a la señora Maryorit. Entregado con éxito.",
  },
];

const initial = (): PosState => ({
  theme: "light",
  sidebarCollapsed: false,
  activeModule: "pos",
  products: mockProducts,
  cart: [],
  orderType: "takeout",
  discount: 0,
  rate: 876.8,
  orders: [],
  shift: {
    cashier: "Cajero Principal",
    register: "Caja 01",
    openedAt: Date.now(),
    openingBs: 0,
    openingUsd: 0,
    isOpen: false,
  },
  shiftHistory: [],
  fiscal: {
    fiscalMode: false,
    port: "COM3",
    baud: 9600,
    model: "The Factory HKA80",
    connected: true,
    lastInvoice: 0,
    lastZ: 0,
    paperOk: true,
    memoryOk: true,
  },
  nextOrder: 1,
  zCounter: 1,
  customers: [],
  inventoryMovements: [],
  suppliers: mockSuppliers,
  purchaseOrders: [],
  supplierInvoices: [],
  cashMovements: [],
  bankAccounts: mockBankAccounts,
  bankMovements: [],
  expenses: [],
  accountingAccounts: mockAccountingAccounts,
  journalEntries: [],
  companySettings: defaultCompanySettings,
  categories: ["Empanadas", "Bebidas", "Combos", "Cafetería", "Adicionales", "Promociones"],
  deliveries: initialDeliveries,
  lastMobileSync: Date.now(),
});

const KEY = "novasystem-drempanadas-prod-v1";

interface Ctx extends PosState {
  hydrated: boolean;
  now: number;
  modal: ModalName;
  setModal: (m: ModalName) => void;
  ticketOrderId: number | null;
  setTicketOrderId: (id: number | null) => void;
  cartPulse: number;
  totals: ReturnType<typeof breakdown>;
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (c: boolean) => void;
  setActiveModule: (m: ModuleId) => void;
  addToCart: (p: Product, modifier?: string) => void;
  setQty: (lineId: string, qty: number) => void;
  removeLine: (lineId: string) => void;
  setNote: (lineId: string, note: string) => void;
  clearCart: () => void;
  setOrderType: (t: OrderType) => void;
  setDiscount: (d: number) => void;
  setRate: (r: number) => void;
  ratesData: MultiSourceRatesData;
  isRefreshingRates: boolean;
  refreshRates: () => Promise<void>;
  setActiveRateVariant: (variantId: string) => void;
  setManualRate: (r: number) => void;
  checkout: (payments: PaymentSplit[], changeBs: number, customer?: CustomerInfo) => Order;
  voidOrder: (id: number) => void;
  advanceKds: (id: number, s: KdsStatus) => void;
  setFiscal: (f: Partial<FiscalConfig>) => void;
  openOrders: Order[]; // current-shift orders (not Z-closed)
  recordAudit: (a: Omit<ShiftAudit, "id" | "zNumber">) => ShiftAudit;
  // ERP actions
  createProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustInventory: (data: { productId: string; moveType: InventoryMoveType; quantity: number; unitCostUsd: number; reason: string }) => void;
  createCustomer: (c: Omit<CustomerRecord, "id" | "orderCount" | "totalSpentUsd" | "lastPurchase" | "segment">) => void;
  updateCustomer: (id: string, c: Partial<CustomerRecord>) => void;
  deleteCustomer: (id: string) => void;
  registerCustomerDebtPayment: (customerId: string, amountUsd: number, method: string, note: string) => void;
  syncMobileLibrary: () => Promise<void>;
  createSupplier: (s: Omit<Supplier, "id" | "score" | "dimensions" | "strengths" | "weaknesses" | "redFlags">) => void;
  updateSupplier: (id: string, s: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  updateOrder: (id: number, patch: Partial<Order>) => void;
  categories: string[];
  addCategory: (name: string) => void;
  deleteCategory: (name: string) => void;
  createPurchaseOrder: (po: { supplierId: string; itemsSummary: string; productId?: string; qty?: number; totalUsd: number }) => void;
  advancePurchaseOrder: (id: string) => void;
  toggleSupplierInvoicePaid: (id: string) => void;
  addCashMovement: (m: { moveType: CashMoveType; amountBs: number; amountUsd?: number; description: string }) => void;
  openCashSession: (openingBs: number, openingUsd: number) => void;
  toggleBankReconciled: (id: string) => void;
  createExpense: (e: Omit<ExpenseRecord, "id" | "createdAt" | "taxAmountUsd" | "totalUsd">) => void;
  deleteExpense: (id: string) => void;
  createJournalEntry: (desc: string, entryDate: string, lines: Omit<JournalEntryLine, "id">[]) => void;
  // Security Lock Screen
  isLocked: boolean;
  lockTerminal: () => void;
  unlockTerminal: () => void;
  updateCompanySettings: (c: Partial<CompanySettings>) => void;
  clearDemoOrders: () => void;
  clearAllProducts: () => void;
  resetProductionData: () => void;
  // Delivery orders & Dispatch
  deliveries: DeliveryOrder[];
  createDelivery: (d: Omit<DeliveryOrder, "id" | "orderNumber" | "createdAt" | "status">) => DeliveryOrder;
  updateDelivery: (id: string, patch: Partial<DeliveryOrder>) => void;
  deleteDelivery: (id: string) => void;
  // Backup & Restore
  exportBackup: () => string;
  downloadBackup: (filename?: string) => void;
  importBackup: (jsonString: string) => { success: boolean; message: string; itemCount?: number };
}

const PosCtx = createContext<Ctx | null>(null);

const poStatusFlow: Record<POStatus, POStatus | undefined> = {
  borrador: "enviado",
  enviado: "en_camino",
  en_camino: "recibido",
  recibido: "facturado",
  facturado: undefined,
  cancelado: undefined,
};

export function PosProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<PosState>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [modal, setModal] = useState<ModalName>(null);
  const [ticketOrderId, setTicketOrderId] = useState<number | null>(null);
  const [cartPulse, setCartPulse] = useState(0);
  const [now, setNow] = useState(0);
  const [ratesData, setRatesData] = useState<MultiSourceRatesData>(initialRatesData);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("novasystem_terminal_unlocked_session") !== "true";
    }
    return true;
  });
  const stateRef = useRef(s);
  stateRef.current = s;

  const refreshRates = useCallback(async () => {
    setIsRefreshingRates(true);
    try {
      const data = await fetchMultiSourceRates();
      setRatesData(data);
      const activeVariant = data.variants[data.activeVariantId] ?? data.variants["bcv"];
      if (activeVariant && activeVariant.price > 0) {
        setS((prev) => ({ ...prev, rate: activeVariant.price }));
      }
    } catch (e) {
      console.warn("Error refreshing rates", e);
    } finally {
      setIsRefreshingRates(false);
    }
  }, []);

  const setActiveRateVariant = useCallback((variantId: string) => {
    setRatesData((prev) => {
      const variant = prev.variants[variantId];
      if (variant && variant.price > 0) {
        setS((sPrev) => ({ ...sPrev, rate: variant.price }));
        return { ...prev, activeVariantId: variantId, activeRate: variant.price };
      }
      return prev;
    });
  }, []);

  const setManualRate = useCallback((val: number) => {
    setS((prev) => ({ ...prev, rate: val }));
    setRatesData((prev) => ({
      ...prev,
      activeVariantId: "manual",
      activeRate: val,
      variants: {
        ...prev.variants,
        manual: {
          id: "manual",
          name: "Ajuste Manual Personalizado",
          symbol: "USD",
          price: val,
          source: "manual",
          sourceUrl: "local://manual",
          updatedAt: new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
        },
      },
    }));
  }, []);

  // Poll rates every 5 minutes (and on mount)
  useEffect(() => {
    refreshRates();
    const interval = setInterval(refreshRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshRates]);

  useEffect(() => {
    try {
      let raw = localStorage.getItem(KEY);
      let parsedFromOldKey: any = null;

      // Buscar si el usuario tenía productos personalizados en claves anteriores (novasystem-drempanadas-v2, v1, auto-backup)
      const candidateKeys = [
        "novasystem-drempanadas-v2",
        "novasystem-drempanadas-v1",
        "novasystem-backup-auto",
        "drempanadas-pos-state",
      ];
      for (const k of candidateKeys) {
        const val = localStorage.getItem(k);
        if (val) {
          try {
            const p = JSON.parse(val);
            if (p && Array.isArray(p.products) && p.products.length > 0) {
              parsedFromOldKey = p;
              break;
            }
          } catch {
            /* ignore */
          }
        }
      }

      if (raw) {
        const parsed = JSON.parse(raw);
        // Si el estado guardado tiene los productos iniciales pero la versión previa tenía productos creados por el usuario, recuperarlos
        if (parsedFromOldKey && Array.isArray(parsedFromOldKey.products)) {
          const hasCustom = parsedFromOldKey.products.some(
            (op: any) =>
              !mockProducts.find((mp) => mp.id === op.id) ||
              mockProducts.find((mp) => mp.id === op.id && (mp.priceUsd !== op.priceUsd || mp.name !== op.name || mp.costUsd !== op.costUsd))
          );
          if (hasCustom && (!parsed.products || parsed.products.length <= mockProducts.length)) {
            parsed.products = parsedFromOldKey.products;
            if (parsedFromOldKey.categories) parsed.categories = parsedFromOldKey.categories;
            if (parsedFromOldKey.customers && parsedFromOldKey.customers.length > 0) parsed.customers = parsedFromOldKey.customers;
            if (parsedFromOldKey.suppliers && parsedFromOldKey.suppliers.length > 0) parsed.suppliers = parsedFromOldKey.suppliers;
          }
        }
        if (parsed.companySettings) {
          parsed.companySettings = {
            ...initial().companySettings,
            ...parsed.companySettings,
          };
          if (parsed.companySettings.name && parsed.companySettings.name !== "Dr. Empanadas C.A.") {
            parsed.companySettings.isLive = true;
            parsed.companySettings.isConfigured = true;
          }
        }
        setS({ ...initial(), ...parsed });
      } else if (parsedFromOldKey) {
        // Migración transparente desde clave previa
        setS({
          ...initial(),
          products: parsedFromOldKey.products || mockProducts,
          categories: parsedFromOldKey.categories || initial().categories,
          customers: parsedFromOldKey.customers || [],
          suppliers: parsedFromOldKey.suppliers || initial().suppliers,
          companySettings: { ...initial().companySettings, ...parsedFromOldKey.companySettings },
        });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(KEY, JSON.stringify(s));
      try {
        localStorage.setItem(
          "novasystem-backup-auto",
          JSON.stringify({
            timestamp: Date.now(),
            products: s.products,
            categories: s.categories,
            customers: s.customers,
            suppliers: s.suppliers,
            companySettings: s.companySettings,
            orders: s.orders,
            shiftHistory: s.shiftHistory,
            deliveries: s.deliveries,
          })
        );
      } catch {
        /* ignore */
      }
    }
  }, [s, hydrated]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const html = document.documentElement;
      if (s.theme === "dark") html.classList.add("dark");
      else html.classList.remove("dark");
    }
  }, [s.theme]);

  const isFiscalMode = s.companySettings.operationMode === "fiscal_seniat";
  const grossUsd = s.cart.reduce((sum, l) => sum + (s.products.find((p) => p.id === l.productId)?.priceUsd ?? 0) * l.qty, 0);
  const totals = breakdown(grossUsd, s.discount, s.rate, isFiscalMode);

  const addToCart = useCallback((p: Product, modifier?: string) => {
    playBeep();
    setCartPulse((n) => n + 1);
    setS((st) => {
      const mods = modifier ? [modifier] : [];
      const existing = st.cart.find((l) => l.productId === p.id && l.note === "" && l.modifiers.join() === mods.join());
      const cart = existing
        ? st.cart.map((l) => (l === existing ? { ...l, qty: l.qty + 1 } : l))
        : [...st.cart, { lineId: crypto.randomUUID(), productId: p.id, qty: 1, note: "", modifiers: mods }];
      return { ...st, cart };
    });
  }, []);

  const openOrders = useMemo(() => s.orders.filter((o) => o.zNumber === undefined && o.status !== "anulada"), [s.orders]);

  const checkout = useCallback((payments: PaymentSplit[], changeBs: number, customer?: CustomerInfo) => {
    const st = stateRef.current;
    const isFiscal = st.companySettings.operationMode === "fiscal_seniat";
    const lines = st.cart.map((l) => {
      const p = st.products.find((x) => x.id === l.productId)!;
      return {
        productId: p.id,
        name: p.name,
        short: p.short,
        kitchen: p.kitchen,
        qty: l.qty,
        unitUsd: p.priceUsd,
        note: l.note,
        modifiers: l.modifiers,
      };
    });
    const gross = lines.reduce((a, l) => a + l.unitUsd * l.qty, 0);
    const b = breakdown(gross, st.discount, st.rate, isFiscal);
    const igtfBs = r2(payments.reduce((a, p) => a + p.igtfBs, 0));
    const inv = st.fiscal.lastInvoice + 1;
    const invoiceNo = String(inv).padStart(8, "0");
    const order: Order = {
      id: st.nextOrder,
      invoiceNo,
      controlNo: `00-${String(inv + 50000).padStart(8, "0")}`,
      invoiceType: !isFiscal ? "control_interno" : customer ? "completa" : "simplificada",
      operationMode: st.companySettings.operationMode ?? "control_interno",
      status: "confirmada",
      createdAt: Date.now(),
      cashier: st.shift.cashier,
      type: st.orderType,
      table: st.orderType === "dine_in" ? `Mesa ${(st.nextOrder % 8) + 1}` : undefined,
      customer,
      lines,
      discountPct: st.discount,
      rate: st.rate,
      baseBs: b.baseBs,
      ivaBs: b.ivaBs,
      igtfBs,
      totalBs: r2(b.totalBs + igtfBs),
      totalUsd: b.totalUsd,
      changeBs,
      payments,
      kdsStatus: lines.some((l) => l.kitchen) ? "fryer" : "dispatched",
      kdsUpdatedAt: Date.now(),
    };

    // Automatic inventory movements
    const newMovements: InventoryMovement[] = lines.map((l) => {
      const p = st.products.find((x) => x.id === l.productId);
      return {
        id: crypto.randomUUID(),
        productId: l.productId,
        productName: l.name,
        sku: p?.sku ?? "SKU",
        moveType: "venta",
        quantity: -l.qty,
        unitCostUsd: p?.costUsd ?? 0,
        reason: `Venta TPV Ticket #${order.id} (Doc. ${invoiceNo})`,
        createdAt: Date.now(),
      };
    });

    // Credit / Fiado calculation
    const creditBs = payments.filter((p) => p.type === "credito").reduce((a, p) => a + p.amountBs, 0);
    const creditUsd = r2(creditBs / st.rate);
    const paidBs = Math.max(0, r2(order.totalBs - creditBs));

    // Automatic cash movement (only for cash/paid portion if not 100% credit)
    const newCashMove: CashMovement = {
      id: crypto.randomUUID(),
      moveType: "venta",
      amountBs: paidBs > 0 ? paidBs : order.totalBs,
      amountUsd: paidBs > 0 ? r2(paidBs / st.rate) : order.totalUsd,
      description:
        creditUsd > 0
          ? `Venta a Crédito Ticket #${order.id} (${customer?.name ?? "Cliente Deudor"} — Pendiente $${creditUsd.toFixed(2)})`
          : `Cobro Ticket #${order.id} (${customer?.name ?? "Consumidor Final"})`,
      createdAt: Date.now(),
    };

    // Automatic journal entry for accounting
    const nextEntryNum = (st.journalEntries[0]?.entryNumber ?? 100) + 1;
    const newJournal: JournalEntry = {
      id: crypto.randomUUID(),
      entryNumber: nextEntryNum,
      entryDate: new Date().toISOString().split("T")[0]!,
      description: `Venta TPV Doc #${invoiceNo} — ${customer?.name ?? "Consumidor Final"}`,
      status: "confirmado",
      lines: [
        {
          id: crypto.randomUUID(),
          accountCode: payments.some((p) => p.type === "pago_movil" || p.type === "pos_card") ? "1103" : "1101",
          accountName: payments.some((p) => p.type === "pago_movil" || p.type === "pos_card")
            ? "Bancos Nacionales (Banesco / BDV / Mercantil)"
            : "Caja General Bolívares (VES)",
          description: `Cobro Doc #${invoiceNo}`,
          debitBs: order.totalBs,
          creditBs: 0,
        },
        {
          id: crypto.randomUUID(),
          accountCode: "4101",
          accountName: "Ingresos por Ventas de Empanadas y Bebidas",
          description: isFiscal ? "Base Imponible 16%" : "Ingreso Control Interno (Sin IVA)",
          debitBs: 0,
          creditBs: order.baseBs,
        },
        ...(order.ivaBs > 0
          ? [
              {
                id: crypto.randomUUID(),
                accountCode: "2104",
                accountName: "Débito Fiscal IVA por Pagar SENIAT (16%)",
                description: "IVA 16%",
                debitBs: 0,
                creditBs: order.ivaBs,
              },
            ]
          : []),
        ...(order.igtfBs > 0
          ? [
              {
                id: crypto.randomUUID(),
                accountCode: "2105",
                accountName: "Impuesto IGTF 3% por Enterar SENIAT",
                description: "IGTF 3% Divisas",
                debitBs: 0,
                creditBs: order.igtfBs,
              },
            ]
          : []),
      ],
    };

    setS((x) => {
      let updatedCustomers = x.customers;
      if (customer) {
        const fullRif = `${customer.docType}-${customer.rif}`.replace(/^[VJEG]-[VJEG]-/i, `${customer.docType}-`);
        const exists = x.customers.some(
          (c) => c.rif.toLowerCase() === customer.rif.toLowerCase() || c.rif.toLowerCase() === fullRif.toLowerCase()
        );
        if (exists) {
          updatedCustomers = x.customers.map((c) => {
            if (c.rif.toLowerCase() === customer.rif.toLowerCase() || c.rif.toLowerCase() === fullRif.toLowerCase()) {
              const newMove =
                creditUsd > 0
                  ? [
                      {
                        id: crypto.randomUUID(),
                        date: Date.now(),
                        type: "cargo" as const,
                        amountUsd: creditUsd,
                        note: `Venta a crédito Ticket #${order.id}`,
                        orderId: order.id,
                      },
                      ...(c.creditMovements ?? []),
                    ]
                  : c.creditMovements ?? [];
              return {
                ...c,
                orderCount: c.orderCount + 1,
                totalSpentUsd: r2(c.totalSpentUsd + order.totalUsd),
                lastPurchase: Date.now(),
                segment: c.totalSpentUsd + order.totalUsd > 250 ? "VIP" : "Regular",
                debtUsd: r2((c.debtUsd ?? 0) + creditUsd),
                creditMovements: newMove,
              };
            }
            return c;
          });
        } else {
          // Automatically register new customer if they bought on credit or with RIF
          updatedCustomers = [
            {
              id: crypto.randomUUID(),
              docType: customer.docType,
              rif: customer.rif.includes("-") ? customer.rif : `${customer.docType}-${customer.rif}`,
              name: customer.name,
              email: "",
              phone: customer.phone ?? "",
              city: "Caracas",
              address: customer.address ?? "Cliente registrado en caja",
              isBusiness: customer.docType === "J" || customer.docType === "G",
              segment: "Regular",
              orderCount: 1,
              totalSpentUsd: order.totalUsd,
              lastPurchase: Date.now(),
              debtUsd: creditUsd,
              creditLimitUsd: 100,
              creditMovements:
                creditUsd > 0
                  ? [
                      {
                        id: crypto.randomUUID(),
                        date: Date.now(),
                        type: "cargo",
                        amountUsd: creditUsd,
                        note: `Venta a crédito Ticket #${order.id}`,
                        orderId: order.id,
                      },
                    ]
                  : [],
            },
            ...x.customers,
          ];
        }
      }

      return {
        ...x,
        orders: [order, ...x.orders],
        cart: [],
        discount: 0,
        nextOrder: x.nextOrder + 1,
        fiscal: { ...x.fiscal, lastInvoice: inv },
        inventoryMovements: [...newMovements, ...x.inventoryMovements],
        cashMovements: [newCashMove, ...x.cashMovements],
        journalEntries: [newJournal, ...x.journalEntries],
        customers: updatedCustomers,
        products: x.products.map((p) => {
          const q = lines.filter((l) => l.productId === p.id).reduce((a, l) => a + l.qty, 0);
          return q ? { ...p, stockBar: Math.max(0, p.stockBar - q) } : p;
        }),
      };
    });
    void api.createOrder(order);
    playCashChime();
    if (order.kdsStatus === "fryer") setTimeout(playKitchenBell, 450);

    // Browser & Phone Web Notification
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification(`🔔 Venta Registrada · Factura #${order.invoiceNo}`, {
            body: `${order.lines.length} productos · $${(order.totalBs / order.rate).toFixed(2)} USD (Bs. ${order.totalBs.toFixed(2)})`,
            icon: "/favicon.png",
          });
        } catch {
          // ignore
        }
      } else if (Notification.permission === "default") {
        try {
          Notification.requestPermission();
        } catch {
          // ignore
        }
      }
    }

    return order;
  }, []);

  const recordAudit = useCallback((a: Omit<ShiftAudit, "id" | "zNumber">) => {
    const st = stateRef.current;
    const audit: ShiftAudit = { ...a, id: crypto.randomUUID(), zNumber: a.kind === "Z" ? st.zCounter : undefined };
    setS((x) => {
      if (a.kind === "X") return { ...x, shiftHistory: [audit, ...x.shiftHistory] };
      return {
        ...x,
        shiftHistory: [audit, ...x.shiftHistory],
        orders: x.orders.map((o) => (o.zNumber === undefined ? { ...o, zNumber: x.zCounter } : o)),
        zCounter: x.zCounter + 1,
        fiscal: { ...x.fiscal, lastZ: x.zCounter },
        shift: { ...x.shift, isOpen: false, openedAt: Date.now() },
      };
    });
    void api.closeShift(audit);
    return audit;
  }, []);

  const syncMobileLibrary = useCallback(async () => {
    await refreshRates();
    setS((x) => ({
      ...x,
      lastMobileSync: Date.now(),
    }));
  }, [refreshRates]);

  const value: Ctx = {
    ...s,
    hydrated,
    now,
    modal,
    setModal,
    ticketOrderId,
    setTicketOrderId,
    cartPulse,
    totals,
    setTheme: (theme) => setS((x) => ({ ...x, theme })),
    toggleTheme: () => setS((x) => ({ ...x, theme: x.theme === "dark" ? "light" : "dark" })),
    setSidebarCollapsed: (sidebarCollapsed) => setS((x) => ({ ...x, sidebarCollapsed })),
    setActiveModule: (activeModule) => setS((x) => ({ ...x, activeModule })),
    addToCart,
    setQty: (id, qty) =>
      setS((x) => ({
        ...x,
        cart: qty <= 0 ? x.cart.filter((l) => l.lineId !== id) : x.cart.map((l) => (l.lineId === id ? { ...l, qty } : l)),
      })),
    removeLine: (id) => setS((x) => ({ ...x, cart: x.cart.filter((l) => l.lineId !== id) })),
    setNote: (id, note) => setS((x) => ({ ...x, cart: x.cart.map((l) => (l.lineId === id ? { ...l, note } : l)) })),
    clearCart: () => setS((x) => ({ ...x, cart: [], discount: 0 })),
    setOrderType: (orderType) => setS((x) => ({ ...x, orderType })),
    setDiscount: (discount) => setS((x) => ({ ...x, discount })),
    setRate: (rate) => setS((x) => ({ ...x, rate })),
    ratesData,
    isRefreshingRates,
    refreshRates,
    setActiveRateVariant,
    setManualRate,
    checkout,
    voidOrder: (id) =>
      setS((x) => ({
        ...x,
        orders: x.orders.map((o) => (o.id === id ? { ...o, status: "anulada", invoiceType: "rectificativa" } : o)),
      })),
    advanceKds: (id, kdsStatus) =>
      setS((x) => ({
        ...x,
        orders: x.orders.map((o) => (o.id === id ? { ...o, kdsStatus, kdsUpdatedAt: Date.now() } : o)),
      })),
    setFiscal: (f) => setS((x) => ({ ...x, fiscal: { ...x.fiscal, ...f } })),
    openOrders,
    recordAudit,
    // ERP Actions
    createProduct: (p) =>
      setS((x) => ({
        ...x,
        products: [{ ...p, id: crypto.randomUUID() }, ...x.products],
      })),
    updateProduct: (id, p) =>
      setS((x) => ({
        ...x,
        products: x.products.map((item) => (item.id === id ? { ...item, ...p } : item)),
      })),
    deleteProduct: (id) =>
      setS((x) => ({
        ...x,
        products: x.products.filter((item) => item.id !== id),
      })),
    adjustInventory: ({ productId, moveType, quantity, unitCostUsd, reason }) =>
      setS((x) => {
        const prod = x.products.find((p) => p.id === productId);
        if (!prod) return x;
        const mov: InventoryMovement = {
          id: crypto.randomUUID(),
          productId,
          productName: prod.name,
          sku: prod.sku,
          moveType,
          quantity,
          unitCostUsd,
          reason,
          createdAt: Date.now(),
        };
        return {
          ...x,
          inventoryMovements: [mov, ...x.inventoryMovements],
          products: x.products.map((p) =>
            p.id === productId ? { ...p, stockBar: Math.max(0, p.stockBar + quantity) } : p
          ),
        };
      }),
    createCustomer: (c) =>
      setS((x) => ({
        ...x,
        customers: [
          {
            ...c,
            id: crypto.randomUUID(),
            orderCount: 0,
            totalSpentUsd: 0,
            lastPurchase: Date.now(),
            segment: "Ocasional",
            debtUsd: c.debtUsd ?? 0,
            creditLimitUsd: c.creditLimitUsd ?? 100,
            creditMovements: c.creditMovements ?? [],
          },
          ...x.customers,
        ],
      })),
    updateCustomer: (id, c) =>
      setS((x) => ({
        ...x,
        customers: x.customers.map((item) => (item.id === id ? { ...item, ...c } : item)),
      })),
    deleteCustomer: (id) =>
      setS((x) => ({
        ...x,
        customers: x.customers.filter((item) => item.id !== id),
      })),
    registerCustomerDebtPayment: (customerId, amountUsd, method, note) =>
      setS((x) => {
        const cust = x.customers.find((c) => c.id === customerId);
        if (!cust) return x;
        const cleanUsd = r2(Math.min(amountUsd, cust.debtUsd ?? amountUsd));
        const amountBs = r2(cleanUsd * x.rate);
        const cashMove: CashMovement = {
          id: crypto.randomUUID(),
          moveType: "ajuste",
          amountBs,
          amountUsd: cleanUsd,
          description: `Abono de cuenta por cobrar: ${cust.name} (${method})`,
          createdAt: Date.now(),
        };
        return {
          ...x,
          cashMovements: [cashMove, ...x.cashMovements],
          customers: x.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  debtUsd: Math.max(0, r2((c.debtUsd ?? 0) - cleanUsd)),
                  creditMovements: [
                    {
                      id: crypto.randomUUID(),
                      date: Date.now(),
                      type: "abono",
                      amountUsd: cleanUsd,
                      method,
                      note: note || `Abono recibido vía ${method}`,
                    },
                    ...(c.creditMovements ?? []),
                  ],
                }
              : c
          ),
        };
      }),
    syncMobileLibrary,
    createSupplier: (sup) =>
      setS((x) => ({
        ...x,
        suppliers: [
          {
            ...sup,
            id: crypto.randomUUID(),
            score: 82,
            dimensions: {
              precio: 80,
              calidad: 85,
              plazo: 82,
              moq: 80,
              sostenibilidad: 80,
              cercania: 85,
              condiciones_pago: 80,
              comunicacion: 84,
            },
            strengths: ["Proveedor verificado en registro SENIAT"],
            weaknesses: [],
            redFlags: [],
          },
          ...x.suppliers,
        ],
      })),
    updateSupplier: (id, sup) =>
      setS((x) => ({
        ...x,
        suppliers: x.suppliers.map((item) => (item.id === id ? { ...item, ...sup } : item)),
      })),
    deleteSupplier: (id) =>
      setS((x) => ({
        ...x,
        suppliers: x.suppliers.filter((item) => item.id !== id),
      })),
    updateOrder: (id, patch) =>
      setS((x) => ({
        ...x,
        orders: x.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
      })),
    categories: s.categories || ["Empanadas", "Pastelitos", "Horneados", "Bebidas", "Salsas & Extras", "Combos"],
    addCategory: (name) => {
      const clean = name.trim();
      if (!clean) return;
      setS((x) => {
        const prev = x.categories || ["Empanadas", "Pastelitos", "Horneados", "Bebidas", "Salsas & Extras", "Combos"];
        if (prev.includes(clean)) return x;
        return { ...x, categories: [...prev, clean] };
      });
    },
    deleteCategory: (name) =>
      setS((x) => ({
        ...x,
        categories: (x.categories || ["Empanadas", "Pastelitos", "Horneados", "Bebidas", "Salsas & Extras", "Combos"]).filter((c) => c !== name),
      })),
    createPurchaseOrder: ({ supplierId, itemsSummary, productId, qty, totalUsd }) =>
      setS((x) => {
        const sup = x.suppliers.find((s) => s.id === supplierId);
        const nextNum = Math.max(400, ...x.purchaseOrders.map((p) => p.orderNumber)) + 1;
        const po: PurchaseOrder = {
          id: crypto.randomUUID(),
          orderNumber: nextNum,
          supplierId,
          supplierName: sup?.name ?? "Proveedor",
          itemsSummary,
          productId,
          qty,
          totalUsd,
          status: "borrador",
          createdAt: Date.now(),
        };
        return { ...x, purchaseOrders: [po, ...x.purchaseOrders] };
      }),
    advancePurchaseOrder: (id) =>
      setS((x) => {
        const po = x.purchaseOrders.find((p) => p.id === id);
        if (!po) return x;
        const next = poStatusFlow[po.status];
        if (!next) return x;

        let products = x.products;
        let inventoryMovements = x.inventoryMovements;
        let supplierInvoices = x.supplierInvoices;

        if (next === "recibido" && po.productId && po.qty) {
          const prod = x.products.find((p) => p.id === po.productId);
          if (prod) {
            products = x.products.map((p) =>
              p.id === prod.id ? { ...p, stockBar: p.stockBar + (po.qty ?? 0) } : p
            );
            inventoryMovements = [
              {
                id: crypto.randomUUID(),
                productId: prod.id,
                productName: prod.name,
                sku: prod.sku,
                moveType: "compra",
                quantity: po.qty,
                unitCostUsd: prod.costUsd,
                reason: `Recepción Pedido de Compra #${po.orderNumber} (${po.supplierName})`,
                createdAt: Date.now(),
              },
              ...inventoryMovements,
            ];
          }
        }

        if (next === "facturado") {
          const sub = r2(po.totalUsd / 1.16);
          const tax = r2(po.totalUsd - sub);
          supplierInvoices = [
            {
              id: crypto.randomUUID(),
              invoiceNumber: `FAC-${po.orderNumber}-${Math.floor(100 + Math.random() * 900)}`,
              supplierId: po.supplierId,
              supplierName: po.supplierName,
              subtotalUsd: sub,
              taxUsd: tax,
              totalUsd: po.totalUsd,
              paid: false,
              createdAt: Date.now(),
            },
            ...supplierInvoices,
          ];
        }

        return {
          ...x,
          products,
          inventoryMovements,
          supplierInvoices,
          purchaseOrders: x.purchaseOrders.map((p) => (p.id === id ? { ...p, status: next } : p)),
        };
      }),
    toggleSupplierInvoicePaid: (id) =>
      setS((x) => ({
        ...x,
        supplierInvoices: x.supplierInvoices.map((si) => (si.id === id ? { ...si, paid: !si.paid } : si)),
      })),
    addCashMovement: ({ moveType, amountBs, amountUsd, description }) =>
      setS((x) => ({
        ...x,
        cashMovements: [
          {
            id: crypto.randomUUID(),
            moveType,
            amountBs,
            amountUsd,
            description,
            createdAt: Date.now(),
          },
          ...x.cashMovements,
        ],
      })),
    openCashSession: (openingBs, openingUsd) =>
      setS((x) => ({
        ...x,
        shift: {
          ...x.shift,
          openedAt: Date.now(),
          openingBs,
          openingUsd,
          isOpen: true,
        },
        cashMovements: [
          {
            id: crypto.randomUUID(),
            moveType: "apertura",
            amountBs: openingBs,
            amountUsd: openingUsd,
            description: "Apertura de caja",
            createdAt: Date.now(),
          },
          ...x.cashMovements,
        ],
      })),
    toggleBankReconciled: (id) =>
      setS((x) => ({
        ...x,
        bankMovements: x.bankMovements.map((bm) => (bm.id === id ? { ...bm, reconciled: !bm.reconciled } : bm)),
      })),
    createExpense: (e) =>
      setS((x) => {
        const taxAmountUsd = r2(e.amountUsd * (e.taxRate / 100));
        const totalUsd = r2(e.amountUsd + taxAmountUsd);
        const rec: ExpenseRecord = {
          ...e,
          id: crypto.randomUUID(),
          taxAmountUsd,
          totalUsd,
          createdAt: Date.now(),
        };
        return { ...x, expenses: [rec, ...x.expenses] };
      }),
    deleteExpense: (id) =>
      setS((x) => ({
        ...x,
        expenses: x.expenses.filter((e) => e.id !== id),
      })),
    createJournalEntry: (description, entryDate, lines) =>
      setS((x) => {
        const nextNum = Math.max(100, ...x.journalEntries.map((j) => j.entryNumber)) + 1;
        const entry: JournalEntry = {
          id: crypto.randomUUID(),
          entryNumber: nextNum,
          entryDate,
          description,
          status: "borrador",
          lines: lines.map((l) => ({ ...l, id: crypto.randomUUID() })),
        };
        return { ...x, journalEntries: [entry, ...x.journalEntries] };
      }),
    confirmJournalEntry: (id) =>
      setS((x) => ({
        ...x,
        journalEntries: x.journalEntries.map((j) => (j.id === id ? { ...j, status: "confirmado" } : j)),
      })),
    // Security screen lock actions
    isLocked,
    lockTerminal: () => {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("novasystem_terminal_unlocked_session");
      }
      setIsLocked(true);
    },
    unlockTerminal: () => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("novasystem_terminal_unlocked_session", "true");
      }
      setIsLocked(false);
    },
    updateCompanySettings: (c) =>
      setS((x) => ({
        ...x,
        companySettings: {
          ...x.companySettings,
          ...c,
          isConfigured: c.isConfigured !== undefined ? c.isConfigured : true,
          isLive: c.isLive !== undefined ? c.isLive : true,
        },
      })),
    clearDemoOrders: () =>
      setS((x) => ({
        ...x,
        orders: [],
        shift: {
          ...x.shift,
          openedAt: Date.now(),
          salesCount: 0,
          totalBs: 0,
          totalUsd: 0,
          expectedBs: x.shift.openingBs,
          expectedUsd: x.shift.openingUsd,
          cardBs: 0,
          pagoMovilBs: 0,
          cashBs: 0,
          cashUsd: 0,
          zivaExento: 0,
          zivaBase: 0,
          zivaTax: 0,
          zigtfTax: 0,
        },
      })),
    clearAllProducts: () =>
      setS((x) => ({
        ...x,
        products: [],
      })),
    resetProductionData: () => {
      setS((x) => {
        const fresh: PosState = {
          ...x,
          orders: [],
          cart: [],
          shift: {
            cashier: "Cajero Principal",
            register: "Caja 01",
            openedAt: Date.now(),
            openingBs: 0,
            openingUsd: 0,
            isOpen: false,
          },
          shiftHistory: [],
          nextOrder: 1,
          zCounter: 1,
          customers: [],
          inventoryMovements: [],
          purchaseOrders: [],
          supplierInvoices: [],
          cashMovements: [],
          bankMovements: [],
          expenses: [],
          journalEntries: [],
          fiscal: {
            ...x.fiscal,
            lastInvoice: 0,
            lastZ: 0,
          },
        };
        try {
          localStorage.setItem(KEY, JSON.stringify(fresh));
        } catch {
          /* ignore */
        }
        return fresh;
      });
    },
    // Deliveries
    deliveries: s.deliveries,
    createDelivery: (d) => {
      const nextNum = Math.max(100, ...s.deliveries.map((x) => x.orderNumber)) + 1;
      const rec: DeliveryOrder = {
        ...d,
        id: `del-${Date.now()}`,
        orderNumber: nextNum,
        status: "pendiente",
        createdAt: Date.now(),
      };
      setS((x) => ({ ...x, deliveries: [rec, ...x.deliveries] }));
      return rec;
    },
    updateDelivery: (id, patch) => {
      setS((x) => ({
        ...x,
        deliveries: x.deliveries.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      }));
    },
    deleteDelivery: (id) => {
      setS((x) => ({
        ...x,
        deliveries: x.deliveries.filter((d) => d.id !== id),
      }));
    },
    // Backup & Restore
    exportBackup: () => {
      const backupData = {
        app: "NovaStock - Dr. Empanadas",
        version: "2.5.0",
        exportedAt: new Date().toISOString(),
        timestamp: Date.now(),
        products: s.products,
        categories: s.categories,
        customers: s.customers,
        suppliers: s.suppliers,
        companySettings: s.companySettings,
        shift: s.shift,
        shiftHistory: s.shiftHistory,
        orders: s.orders,
        cashMovements: s.cashMovements,
        bankAccounts: s.bankAccounts,
        bankMovements: s.bankMovements,
        expenses: s.expenses,
        accountingAccounts: s.accountingAccounts,
        journalEntries: s.journalEntries,
        deliveries: s.deliveries,
      };
      return JSON.stringify(backupData, null, 2);
    },
    downloadBackup: (filename) => {
      const backupData = {
        app: "NovaStock - Dr. Empanadas",
        version: "2.5.0",
        exportedAt: new Date().toISOString(),
        timestamp: Date.now(),
        products: s.products,
        categories: s.categories,
        customers: s.customers,
        suppliers: s.suppliers,
        companySettings: s.companySettings,
        shift: s.shift,
        shiftHistory: s.shiftHistory,
        orders: s.orders,
        cashMovements: s.cashMovements,
        bankAccounts: s.bankAccounts,
        bankMovements: s.bankMovements,
        expenses: s.expenses,
        accountingAccounts: s.accountingAccounts,
        journalEntries: s.journalEntries,
        deliveries: s.deliveries,
      };
      const json = JSON.stringify(backupData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = filename || `backup-dr-empanadas-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    importBackup: (jsonString) => {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed || (!parsed.products && !parsed.companySettings)) {
          return { success: false, message: "El archivo no contiene una copia de seguridad válida de NovaStock." };
        }
        setS((prev) => {
          const updated: PosState = {
            ...prev,
            products: Array.isArray(parsed.products) ? parsed.products : prev.products,
            categories: Array.isArray(parsed.categories) ? parsed.categories : prev.categories,
            customers: Array.isArray(parsed.customers) ? parsed.customers : prev.customers,
            suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers : prev.suppliers,
            companySettings: parsed.companySettings ? { ...prev.companySettings, ...parsed.companySettings } : prev.companySettings,
            orders: Array.isArray(parsed.orders) ? parsed.orders : prev.orders,
            shiftHistory: Array.isArray(parsed.shiftHistory) ? parsed.shiftHistory : prev.shiftHistory,
            cashMovements: Array.isArray(parsed.cashMovements) ? parsed.cashMovements : prev.cashMovements,
            bankAccounts: Array.isArray(parsed.bankAccounts) ? parsed.bankAccounts : prev.bankAccounts,
            bankMovements: Array.isArray(parsed.bankMovements) ? parsed.bankMovements : prev.bankMovements,
            expenses: Array.isArray(parsed.expenses) ? parsed.expenses : prev.expenses,
            deliveries: Array.isArray(parsed.deliveries) ? parsed.deliveries : prev.deliveries,
          };
          try {
            localStorage.setItem(KEY, JSON.stringify(updated));
            localStorage.setItem("novasystem-backup-auto", JSON.stringify(updated));
          } catch {
            /* ignore */
          }
          return updated;
        });
        return {
          success: true,
          message: `Backup restaurado con éxito. Se recuperaron ${parsed.products?.length ?? 0} productos del menú, precios y configuraciones.`,
          itemCount: (parsed.products?.length ?? 0) + (parsed.customers?.length ?? 0),
        };
      } catch (e: any) {
        return { success: false, message: `Error al leer archivo JSON: ${e?.message || "Formato no válido"}` };
      }
    },
  };

  return <PosCtx.Provider value={value}>{children}</PosCtx.Provider>;
}

export function usePos() {
  const c = useContext(PosCtx);
  if (!c) throw new Error("usePos must be used within PosProvider");
  return c;
}
