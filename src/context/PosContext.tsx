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

type ModalName = null | "payment" | "ticket" | "shift" | "printer" | "bcv";

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
  // NovaSystem ERP state
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

const initial = (): PosState => ({
  theme: "light",
  sidebarCollapsed: false,
  activeModule: "pos",
  products: mockProducts,
  cart: [],
  orderType: "takeout",
  discount: 0,
  rate: 876.8,
  orders: mockSeededOrders,
  shift: {
    cashier: "María P.",
    register: "Caja 01",
    openedAt: Date.now() - (3 * 60 + 24) * 60000,
    openingBs: 1825,
    openingUsd: 50,
    isOpen: true,
  },
  shiftHistory: [],
  fiscal: {
    fiscalMode: false,
    port: "COM3",
    baud: 9600,
    model: "The Factory HKA80",
    connected: true,
    lastInvoice: 1041,
    lastZ: 318,
    paperOk: true,
    memoryOk: true,
  },
  nextOrder: 1042,
  zCounter: 319,
  customers: mockCustomers,
  inventoryMovements: mockInventoryMovements,
  suppliers: mockSuppliers,
  purchaseOrders: mockPurchaseOrders,
  supplierInvoices: mockSupplierInvoices,
  cashMovements: mockCashMovements,
  bankAccounts: mockBankAccounts,
  bankMovements: mockBankMovements,
  expenses: mockExpenses,
  accountingAccounts: mockAccountingAccounts,
  journalEntries: mockJournalEntries,
  companySettings: defaultCompanySettings,
});

const KEY = "novasystem-drempanadas-v2";

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
  createSupplier: (s: Omit<Supplier, "id" | "score" | "dimensions" | "strengths" | "weaknesses" | "redFlags">) => void;
  updateSupplier: (id: string, s: Partial<Supplier>) => void;
  createPurchaseOrder: (po: { supplierId: string; itemsSummary: string; productId?: string; qty?: number; totalUsd: number }) => void;
  advancePurchaseOrder: (id: string) => void;
  toggleSupplierInvoicePaid: (id: string) => void;
  addCashMovement: (m: { moveType: CashMoveType; amountBs: number; amountUsd?: number; description: string }) => void;
  openCashSession: (openingBs: number, openingUsd: number) => void;
  toggleBankReconciled: (id: string) => void;
  createExpense: (e: Omit<ExpenseRecord, "id" | "createdAt" | "taxAmountUsd" | "totalUsd">) => void;
  deleteExpense: (id: string) => void;
  createJournalEntry: (desc: string, entryDate: string, lines: Omit<JournalEntryLine, "id">[]) => void;
  confirmJournalEntry: (id: string) => void;
  updateCompanySettings: (c: Partial<CompanySettings>) => void;
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
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setS({ ...initial(), ...parsed });
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
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(s));
  }, [s, hydrated]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const html = document.documentElement;
      if (s.theme === "dark") html.classList.add("dark");
      else html.classList.remove("dark");
    }
  }, [s.theme]);

  const grossUsd = s.cart.reduce((sum, l) => sum + (s.products.find((p) => p.id === l.productId)?.priceUsd ?? 0) * l.qty, 0);
  const totals = breakdown(grossUsd, s.discount, s.rate);

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
    const b = breakdown(gross, st.discount, st.rate);
    const igtfBs = r2(payments.reduce((a, p) => a + p.igtfBs, 0));
    const inv = st.fiscal.lastInvoice + 1;
    const invoiceNo = String(inv).padStart(8, "0");
    const order: Order = {
      id: st.nextOrder,
      invoiceNo,
      controlNo: `00-${String(inv + 50000).padStart(8, "0")}`,
      invoiceType: customer ? "completa" : "simplificada",
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
        reason: `Venta TPV Ticket #${order.id} (Fact. ${invoiceNo})`,
        createdAt: Date.now(),
      };
    });

    // Automatic cash movement
    const newCashMove: CashMovement = {
      id: crypto.randomUUID(),
      moveType: "venta",
      amountBs: order.totalBs,
      amountUsd: order.totalUsd,
      description: `Cobro Ticket #${order.id} (${customer?.name ?? "Consumidor Final"})`,
      createdAt: Date.now(),
    };

    // Automatic journal entry for accounting
    const nextEntryNum = (st.journalEntries[0]?.entryNumber ?? 100) + 1;
    const newJournal: JournalEntry = {
      id: crypto.randomUUID(),
      entryNumber: nextEntryNum,
      entryDate: new Date().toISOString().split("T")[0]!,
      description: `Venta TPV Factura #${invoiceNo} — ${customer?.name ?? "Consumidor Final"}`,
      status: "confirmado",
      lines: [
        {
          id: crypto.randomUUID(),
          accountCode: payments.some((p) => p.type === "pago_movil" || p.type === "pos_card") ? "1103" : "1101",
          accountName: payments.some((p) => p.type === "pago_movil" || p.type === "pos_card")
            ? "Bancos Nacionales (Banesco / BDV / Mercantil)"
            : "Caja General Bolívares (VES)",
          description: `Cobro Factura #${invoiceNo}`,
          debitBs: order.totalBs,
          creditBs: 0,
        },
        {
          id: crypto.randomUUID(),
          accountCode: "4101",
          accountName: "Ingresos por Ventas de Empanadas y Bebidas",
          description: "Base Imponible 16%",
          debitBs: 0,
          creditBs: order.baseBs,
        },
        {
          id: crypto.randomUUID(),
          accountCode: "2104",
          accountName: "Débito Fiscal IVA por Pagar SENIAT (16%)",
          description: "IVA 16%",
          debitBs: 0,
          creditBs: order.ivaBs,
        },
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

    setS((x) => ({
      ...x,
      orders: [order, ...x.orders],
      cart: [],
      discount: 0,
      nextOrder: x.nextOrder + 1,
      fiscal: { ...x.fiscal, lastInvoice: inv },
      inventoryMovements: [...newMovements, ...x.inventoryMovements],
      cashMovements: [newCashMove, ...x.cashMovements],
      journalEntries: [newJournal, ...x.journalEntries],
      customers: customer
        ? x.customers.map((c) =>
            c.rif.toLowerCase() === customer.rif.toLowerCase()
              ? {
                  ...c,
                  orderCount: c.orderCount + 1,
                  totalSpentUsd: r2(c.totalSpentUsd + order.totalUsd),
                  lastPurchase: Date.now(),
                  segment: c.totalSpentUsd + order.totalUsd > 250 ? "VIP" : "Regular",
                }
              : c
          )
        : x.customers,
      products: x.products.map((p) => {
        const q = lines.filter((l) => l.productId === p.id).reduce((a, l) => a + l.qty, 0);
        return q ? { ...p, stockBar: Math.max(0, p.stockBar - q) } : p;
      }),
    }));
    void api.createOrder(order);
    playCashChime();
    if (order.kdsStatus === "fryer") setTimeout(playKitchenBell, 450);
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
        shift: { ...x.shift, openedAt: Date.now() },
      };
    });
    void api.closeShift(audit);
    return audit;
  }, []);

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
    updateCompanySettings: (c) =>
      setS((x) => ({
        ...x,
        companySettings: { ...x.companySettings, ...c },
      })),
  };

  return <PosCtx.Provider value={value}>{children}</PosCtx.Provider>;
}

export function usePos() {
  const c = useContext(PosCtx);
  if (!c) throw new Error("usePos must be used within PosProvider");
  return c;
}
