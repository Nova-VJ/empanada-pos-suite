export type Category = "Empanadas Clásicas" | "Empanadas Especiales" | "Combos" | "Bebidas" | "Salsas & Extras";

export interface Product {
  id: string;
  sku: string;
  name: string;
  short: string; // flavor label for KDS summary
  emoji: string;
  category: Category;
  priceUsd: number;
  costUsd: number;
  stockBar: number;
  stockKitchen: number;
  kitchen: boolean; // false = bar / drinks
  modifiers: string[];
}

export interface CartItem {
  lineId: string;
  productId: string;
  qty: number;
  note: string;
  modifiers: string[];
}

export type TenderType = "usd_cash" | "pago_movil" | "pos_card" | "bs_cash";

export interface PaymentSplit {
  id: string;
  type: TenderType;
  amountBs: number; // Bs. value credited to the order
  amountUsd?: number; // for usd_cash
  igtfBs: number;
  bank?: string;
  phone?: string;
  reference?: string;
  lot?: string;
}

export type OrderType = "dine_in" | "takeout";
export type KdsStatus = "fryer" | "ready" | "dispatched";

export interface OrderLine {
  productId: string;
  name: string;
  short: string;
  kitchen: boolean;
  qty: number;
  unitUsd: number;
  note: string;
  modifiers: string[];
}

export interface Order {
  id: number;
  invoiceNo: string;
  controlNo: string;
  createdAt: number;
  cashier: string;
  type: OrderType;
  table?: string;
  lines: OrderLine[];
  discountPct: number;
  rate: number;
  baseBs: number;
  ivaBs: number;
  igtfBs: number;
  totalBs: number; // incl. IVA + IGTF
  totalUsd: number;
  changeBs: number;
  payments: PaymentSplit[];
  kdsStatus: KdsStatus;
  kdsUpdatedAt: number;
  zNumber?: number;
}

export type KdsTicket = Order;

export interface ShiftAudit {
  id: string;
  kind: "X" | "Z";
  zNumber?: number;
  cashier: string;
  register: string;
  openedAt: number;
  closedAt: number;
  declared: { bs: number; usd: number; pos: number; pagoMovil: number };
  expected: { bs: number; usd: number; pos: number; pagoMovil: number };
  declaredTotalBs: number;
  expectedTotalBs: number;
  differenceBs: number;
  tickets: number;
  notes: string;
}

export interface FiscalConfig {
  fiscalMode: boolean;
  port: string;
  baud: 9600 | 19200;
  model: string;
  connected: boolean;
  lastInvoice: number;
  lastZ: number;
  paperOk: boolean;
  memoryOk: boolean;
}

export interface Shift {
  cashier: string;
  register: string;
  openedAt: number;
}
