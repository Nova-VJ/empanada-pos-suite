export type Category = "Empanadas" | "Pastelitos" | "Horneados" | "Bebidas" | "Salsas & Extras" | "Combos";

export type ModuleId =
  | "dashboard"
  | "pos"
  | "kds"
  | "products"
  | "inventory"
  | "customers"
  | "invoicing"
  | "suppliers"
  | "cash"
  | "expenses"
  | "reports"
  | "accounting"
  | "assistants"
  | "recommendations"
  | "settings";

export interface CustomerInfo {
  docType: "V" | "J" | "E" | "G";
  rif: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface CreditMovement {
  id: string;
  date: number;
  type: "cargo" | "abono";
  amountUsd: number;
  method?: string;
  note: string;
  orderId?: number;
}

export interface CustomerRecord {
  id: string;
  docType: "V" | "J" | "E" | "G";
  rif: string; // e.g., V-14892301 or J-00002967-9
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  isBusiness: boolean;
  segment: "VIP" | "Regular" | "Ocasional" | "Inactivo";
  orderCount: number;
  totalSpentUsd: number;
  lastPurchase: number;
  debtUsd?: number;
  creditLimitUsd?: number;
  creditMovements?: CreditMovement[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  short: string; // flavor label for KDS summary
  emoji: string;
  image?: string;
  category: Category;
  priceUsd: number;
  costUsd: number;
  stockBar: number;
  stockKitchen: number;
  stockMin?: number;
  kitchen: boolean; // false = bar / drinks
  modifiers: string[];
}

export type InventoryMoveType = "compra" | "venta" | "devolucion" | "ajuste" | "recuento" | "ecommerce";

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  moveType: InventoryMoveType;
  quantity: number; // positive or negative
  unitCostUsd: number;
  reason: string;
  createdAt: number;
}

export interface Supplier {
  id: string;
  name: string;
  rif: string;
  email: string;
  phone: string;
  city: string;
  paymentDays: number;
  active: boolean;
  category: string;
  score: number;
  dimensions: {
    precio: number;
    calidad: number;
    plazo: number;
    moq: number;
    sostenibilidad: number;
    cercania: number;
    condiciones_pago: number;
    comunicacion: number;
  };
  strengths: string[];
  weaknesses: string[];
  redFlags: string[];
}

export type POStatus = "borrador" | "enviado" | "en_camino" | "recibido" | "facturado" | "cancelado";

export interface PurchaseOrder {
  id: string;
  orderNumber: number;
  supplierId: string;
  supplierName: string;
  itemsSummary: string;
  productId?: string;
  qty?: number;
  totalUsd: number;
  status: POStatus;
  createdAt: number;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  subtotalUsd: number;
  taxUsd: number;
  totalUsd: number;
  paid: boolean;
  createdAt: number;
}

export type CashMoveType = "apertura" | "venta" | "retiro" | "gasto" | "cierre" | "ajuste";

export interface CashMovement {
  id: string;
  moveType: CashMoveType;
  amountBs: number;
  amountUsd?: number;
  description: string;
  createdAt: number;
}

export interface BankAccount {
  id: string;
  name: string;
  code: string;
  currency: "VES" | "USD";
  accountNumber: string;
  balance: number;
}

export interface BankMovement {
  id: string;
  bankId: string;
  description: string;
  amount: number;
  currency: "VES" | "USD";
  reconciled: boolean;
  createdAt: number;
}

export interface ExpenseRecord {
  id: string;
  description: string;
  category: string;
  amountUsd: number; // base imponible USD
  taxRate: number; // 0, 8, 16
  taxAmountUsd: number;
  totalUsd: number;
  paymentMethod: string;
  supplierId?: string;
  supplierName?: string;
  expenseDate: string;
  createdAt: number;
}

export interface AccountingAccount {
  id: string;
  code: string;
  name: string;
  accountType: "Activo" | "Pasivo" | "Patrimonio" | "Ingreso" | "Gasto";
  nature: "deudora" | "acreedora";
  active: boolean;
}

export interface JournalEntryLine {
  id: string;
  accountCode: string;
  accountName: string;
  description: string;
  debitBs: number;
  creditBs: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: number;
  entryDate: string;
  description: string;
  status: "borrador" | "confirmado" | "bloqueado";
  lines: JournalEntryLine[];
}

export interface TicketConfig {
  width: "58mm" | "80mm";
  density: "compact" | "normal" | "large";
  showLogo: boolean;
  showFiscalData: boolean;
  showTaxBreakdown: boolean;
  showBcvRate: boolean;
  footerMessage: string;
  autoCut: boolean;
}

export interface SystemUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "cajero" | "cocinero" | "contador" | "administrador" | "propietario";
  roleLabel: string;
  station: string;
  pin: string;
  active: boolean;
  avatarInitials: string;
  phone?: string;
  createdAt: string;
  stats: {
    totalSalesUsd: number;
    totalSalesBs: number;
    ticketsCount: number;
    ordersCooked: number;
    avgPrepMinutes: number;
    shiftsCount: number;
    lastActive: string;
  };
}

export interface CompanySettings {
  name: string;
  rif: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  postalCode: string;
  valuationMethod: "pmp" | "fifo";
  branch: string;
  operationMode?: "control_interno" | "fiscal_seniat";
  reportEmail?: string;
  autoEmailCashReport?: boolean;
  teamViewerId?: string;
  printerWidth?: "58mm" | "80mm";
  lowStockAlertsEnabled?: boolean;
  ticketConfig?: TicketConfig;
}

export interface CartItem {
  lineId: string;
  productId: string;
  qty: number;
  note: string;
  modifiers: string[];
}

export type TenderType = "usd_cash" | "pago_movil" | "pos_card" | "bs_cash" | "credito";

export interface PaymentSplit {
  id: string;
  type: TenderType;
  amountBs: number; // Bs. value credited to the order
  amountUsd?: number | undefined; // for usd_cash or credito
  igtfBs: number;
  bank?: string | undefined;
  phone?: string | undefined;
  reference?: string | undefined;
  lot?: string | undefined;
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
  invoiceType?: "simplificada" | "completa" | "rectificativa" | "control_interno";
  operationMode?: "control_interno" | "fiscal_seniat";
  status?: "confirmada" | "anulada" | "borrador";
  createdAt: number;
  cashier: string;
  type: OrderType;
  table?: string | undefined;
  customer?: CustomerInfo | undefined;
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
  zNumber?: number | undefined;
}

export type KdsTicket = Order;

export interface ShiftAudit {
  id: string;
  kind: "X" | "Z";
  zNumber?: number | undefined;
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
  openingBs: number;
  openingUsd: number;
  isOpen: boolean;
}
