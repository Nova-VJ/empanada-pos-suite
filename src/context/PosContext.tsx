import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { mockProducts } from "@/data/mockProducts";
import { breakdown, r2 } from "@/lib/money";
import { playBeep, playCashChime, playKitchenBell } from "@/services/sound";
import { api } from "@/services/api";
import type { CartItem, FiscalConfig, KdsStatus, Order, OrderType, PaymentSplit, Product, Shift, ShiftAudit } from "@/types/pos";

type ModalName = null | "payment" | "ticket" | "shift" | "printer" | "bcv";

interface PosState {
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
}

const initial = (): PosState => ({
  products: mockProducts,
  cart: [],
  orderType: "takeout",
  discount: 0,
  rate: 36.5,
  orders: [],
  shift: { cashier: "María P.", register: "Caja 01", openedAt: Date.now() - (3 * 60 + 24) * 60000 },
  shiftHistory: [],
  fiscal: { fiscalMode: false, port: "COM3", baud: 9600, model: "The Factory HKA80", connected: true, lastInvoice: 1041, lastZ: 318, paperOk: true, memoryOk: true },
  nextOrder: 1042,
  zCounter: 319,
});

const KEY = "drempanadas-pos-v1";

interface Ctx extends PosState {
  hydrated: boolean;
  now: number;
  modal: ModalName;
  setModal: (m: ModalName) => void;
  ticketOrderId: number | null;
  setTicketOrderId: (id: number | null) => void;
  cartPulse: number;
  totals: ReturnType<typeof breakdown>;
  addToCart: (p: Product, modifier?: string) => void;
  setQty: (lineId: string, qty: number) => void;
  removeLine: (lineId: string) => void;
  setNote: (lineId: string, note: string) => void;
  clearCart: () => void;
  setOrderType: (t: OrderType) => void;
  setDiscount: (d: number) => void;
  setRate: (r: number) => void;
  checkout: (payments: PaymentSplit[], changeBs: number) => Order;
  advanceKds: (id: number, s: KdsStatus) => void;
  setFiscal: (f: Partial<FiscalConfig>) => void;
  openOrders: Order[]; // current-shift orders (not Z-closed)
  recordAudit: (a: Omit<ShiftAudit, "id" | "zNumber">) => ShiftAudit;
}

const PosCtx = createContext<Ctx | null>(null);

export function PosProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<PosState>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [modal, setModal] = useState<ModalName>(null);
  const [ticketOrderId, setTicketOrderId] = useState<number | null>(null);
  const [cartPulse, setCartPulse] = useState(0);
  const [now, setNow] = useState(0);
  const stateRef = useRef(s);
  stateRef.current = s;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...initial(), ...JSON.parse(raw) });
    } catch { /* ignore */ }
    setHydrated(true);
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(s));
  }, [s, hydrated]);

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

  const openOrders = useMemo(() => s.orders.filter((o) => o.zNumber === undefined), [s.orders]);

  const checkout = useCallback((payments: PaymentSplit[], changeBs: number) => {
    const st = stateRef.current;
    const lines = st.cart.map((l) => {
      const p = st.products.find((x) => x.id === l.productId)!;
      return { productId: p.id, name: p.name, short: p.short, kitchen: p.kitchen, qty: l.qty, unitUsd: p.priceUsd, note: l.note, modifiers: l.modifiers };
    });
    const gross = lines.reduce((a, l) => a + l.unitUsd * l.qty, 0);
    const b = breakdown(gross, st.discount, st.rate);
    const igtfBs = r2(payments.reduce((a, p) => a + p.igtfBs, 0));
    const inv = st.fiscal.lastInvoice + 1;
    const order: Order = {
      id: st.nextOrder,
      invoiceNo: String(inv).padStart(8, "0"),
      controlNo: `00-${String(inv + 50000).padStart(8, "0")}`,
      createdAt: Date.now(),
      cashier: st.shift.cashier,
      type: st.orderType,
      table: st.orderType === "dine_in" ? `Mesa ${((st.nextOrder % 8) + 1)}` : undefined,
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
    setS((x) => ({
      ...x,
      orders: [order, ...x.orders],
      cart: [],
      discount: 0,
      nextOrder: x.nextOrder + 1,
      fiscal: { ...x.fiscal, lastInvoice: inv },
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
    addToCart,
    setQty: (id, qty) => setS((x) => ({ ...x, cart: qty <= 0 ? x.cart.filter((l) => l.lineId !== id) : x.cart.map((l) => (l.lineId === id ? { ...l, qty } : l)) })),
    removeLine: (id) => setS((x) => ({ ...x, cart: x.cart.filter((l) => l.lineId !== id) })),
    setNote: (id, note) => setS((x) => ({ ...x, cart: x.cart.map((l) => (l.lineId === id ? { ...l, note } : l)) })),
    clearCart: () => setS((x) => ({ ...x, cart: [], discount: 0 })),
    setOrderType: (orderType) => setS((x) => ({ ...x, orderType })),
    setDiscount: (discount) => setS((x) => ({ ...x, discount })),
    setRate: (rate) => setS((x) => ({ ...x, rate })),
    checkout,
    advanceKds: (id, kdsStatus) => setS((x) => ({ ...x, orders: x.orders.map((o) => (o.id === id ? { ...o, kdsStatus, kdsUpdatedAt: Date.now() } : o)) })),
    setFiscal: (f) => setS((x) => ({ ...x, fiscal: { ...x.fiscal, ...f } })),
    openOrders,
    recordAudit,
  };

  return <PosCtx.Provider value={value}>{children}</PosCtx.Provider>;
}

export function usePos() {
  const c = useContext(PosCtx);
  if (!c) throw new Error("usePos must be used within PosProvider");
  return c;
}
