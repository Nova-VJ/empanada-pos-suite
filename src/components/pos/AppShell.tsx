import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  Flame,
  Package,
  Warehouse,
  Users,
  FileText,
  Truck,
  Landmark,
  Receipt,
  BarChart3,
  BookOpen,
  Bot,
  Lightbulb,
  Settings,
  PanelLeft,
  Sun,
  Moon,
  Printer,
  Lock,
  RefreshCw,
  Wrench,
  Menu,
  X,
  ShoppingBag,
  Bike,
  Monitor,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { PwaInstallButton } from "./PwaInstallButton";
import type { ModuleId } from "@/types/pos";
import { Modal, btnPrimary, inputCls } from "./Modal";
import { PaymentModal } from "./PaymentModal";
import { ThermalTicketModal } from "./ThermalTicketModal";
import { CashShiftModal } from "./CashShiftModal";
import { FiscalPrinterModal } from "./FiscalPrinterModal";
import { RateSelectorModal } from "./RateSelectorModal";
import { SupportMenuModal } from "./SupportMenuModal";
import { TerminalLockScreen } from "./TerminalLockScreen";
import { AuthUserModal } from "./AuthUserModal";

export const SEARCH_ID = "pos-catalog-search";

interface NavItem {
  id: ModuleId;
  title: string;
  icon: ElementType;
  color: string;
  bgColor: string;
  shortcut?: string;
}

const MAIN_NAV: NavItem[] = [
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard, color: "text-module-sales", bgColor: "bg-module-sales-light" },
  { id: "pos", title: "TPV / Ventas", icon: ShoppingCart, color: "text-module-sales", bgColor: "bg-module-sales-light", shortcut: "F1" },
  { id: "sales", title: "Ventas Realizadas", icon: ShoppingBag, color: "text-emerald-500", bgColor: "bg-emerald-500/10", shortcut: "F3" },
  { id: "delivery", title: "Delivery WhatsApp", icon: Bike, color: "text-amber-500", bgColor: "bg-amber-500/10", shortcut: "F4" },
  { id: "kds", title: "Cocina KDS", icon: Flame, color: "text-module-inventory", bgColor: "bg-module-inventory-light", shortcut: "F2" },
  { id: "products", title: "Productos", icon: Package, color: "text-module-products", bgColor: "bg-module-products-light" },
  { id: "inventory", title: "Inventario", icon: Warehouse, color: "text-module-inventory", bgColor: "bg-module-inventory-light" },
  { id: "customers", title: "Clientes", icon: Users, color: "text-module-customers", bgColor: "bg-module-customers-light" },
];

const MANAGEMENT_NAV: NavItem[] = [
  { id: "invoicing", title: "Facturación & SENIAT", icon: FileText, color: "text-module-invoicing", bgColor: "bg-module-invoicing-light" },
  { id: "suppliers", title: "Proveedores", icon: Truck, color: "text-module-suppliers", bgColor: "bg-module-suppliers-light" },
  { id: "cash", title: "Caja y Bancos", icon: Landmark, color: "text-module-cash", bgColor: "bg-module-cash-light" },
  { id: "expenses", title: "Gastos", icon: Receipt, color: "text-module-expenses", bgColor: "bg-module-expenses-light" },
];

const REPORTS_NAV: NavItem[] = [
  { id: "reports", title: "Informes", icon: BarChart3, color: "text-module-reports", bgColor: "bg-module-reports-light" },
  { id: "accounting", title: "Contabilidad", icon: BookOpen, color: "text-module-accounting", bgColor: "bg-module-accounting-light" },
  { id: "assistants", title: "Asistentes IA", icon: Bot, color: "text-module-products", bgColor: "bg-module-products-light" },
  { id: "recommendations", title: "Recomendaciones", icon: Lightbulb, color: "text-module-customers", bgColor: "bg-module-customers-light" },
  { id: "settings", title: "Configuración", icon: Settings, color: "text-muted-foreground", bgColor: "bg-secondary" },
];

const MODULE_TITLES: Record<ModuleId, string> = {
  dashboard: "Dashboard Ejecutivo",
  pos: "Terminal TPV / Ventas",
  sales: "Ventas Realizadas & Historial de Pedidos",
  delivery: "Delivery WhatsApp & Despacho a Motorizados",
  kds: "Cocina KDS & Freidoras",
  products: "Catálogo de Productos",
  inventory: "Inventario & Kardex",
  customers: "CRM Clientes & RIF",
  invoicing: "Facturación & Libro SENIAT",
  suppliers: "Proveedores & Compras",
  cash: "Caja, Cortes X/Z y Bancos",
  expenses: "Control de Gastos e IVA",
  reports: "Informes & Analítica",
  accounting: "Contabilidad VEN-NIF",
  assistants: "Asistentes IA (Copilotos)",
  recommendations: "Recomendaciones Inteligentes",
  settings: "Configuración General & Fiscal",
};

export function AppShell({ children }: { children: ReactNode }) {
  const pos = usePos();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const pendingFryer = pos.orders.filter((o) => o.kdsStatus === "fryer").length;
  const lowStockCount = pos.companySettings.lowStockAlertsEnabled !== false
    ? pos.products.filter((p) => p.stockBar + p.stockKitchen <= (p.minStock ?? 10)).length
    : 0;

  const currentModule: ModuleId =
    path === "/"
      ? "pos"
      : path === "/kds"
        ? "kds"
        : pos.activeModule === "pos" || pos.activeModule === "kds"
          ? "dashboard"
          : pos.activeModule;

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("🟢 Conexión a Internet Restablecida", {
        description: "El sistema está sincronizado en tiempo real.",
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("🟡 Conexión a Internet Perdida (Modo Fuera de Línea Activo)", {
        description: "El TPV continúa operando con normalidad. Las ventas se guardan localmente.",
      });
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const selectModule = (id: ModuleId) => {
    pos.setActiveModule(id);
    setMobileNavOpen(false);
    if (id === "pos") {
      navigate({ to: "/" });
    } else if (id === "kds") {
      navigate({ to: "/kds" });
    } else {
      navigate({ to: "/backoffice" });
    }
  };

  useEffect(() => {
    if (pos.activeModule === "pos" && path !== "/") {
      navigate({ to: "/" });
    } else if (pos.activeModule === "kds" && path !== "/kds") {
      navigate({ to: "/kds" });
    } else if (pos.activeModule !== "pos" && pos.activeModule !== "kds" && path !== "/backoffice") {
      navigate({ to: "/backoffice" });
    }
  }, [pos.activeModule]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
      if (e.key === "Escape") {
        if (pos.modal) {
          pos.setModal(null);
          pos.setTicketOrderId(null);
        } else if (typing) {
          el.blur();
        }
        return;
      }
      if (e.key === "F1") {
        e.preventDefault();
        selectModule("pos");
        return;
      }
      if (e.key === "F2") {
        e.preventDefault();
        selectModule("kds");
        return;
      }
      if (e.key === "F3") {
        e.preventDefault();
        selectModule("sales");
        return;
      }
      if (pos.modal) return;
      if (e.key === "F5" || (e.key === "/" && !typing)) {
        e.preventDefault();
        if (path !== "/") selectModule("pos");
        setTimeout(() => document.getElementById(SEARCH_ID)?.focus(), 40);
        return;
      }
      if ((e.key === "F10" || (e.key === " " && !typing)) && path === "/" && pos.cart.length > 0) {
        e.preventDefault();
        pos.setModal("payment");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pos, navigate, path]);

  const elapsed = pos.hydrated ? Math.max(0, pos.now - pos.shift.openedAt) : 0;
  const h = Math.floor(elapsed / 3600000);
  const m = Math.floor((elapsed % 3600000) / 60000);
  const collapsed = pos.sidebarCollapsed;

  const renderGroup = (label: string, items: NavItem[]) => (
    <div className="mb-4">
      {!collapsed && (
        <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {label}
        </div>
      )}
      <div className="space-y-0.5">
        {items.map((item) => {
          const isActive = currentModule === item.id;
          const badge =
            item.id === "kds" && pendingFryer > 0
              ? pendingFryer
              : item.id === "inventory" && lowStockCount > 0
                ? lowStockCount
                : undefined;

          return (
            <button
              key={item.id}
              onClick={() => selectModule(item.id)}
              title={collapsed ? item.title : undefined}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? `${item.bgColor} text-foreground font-semibold shadow-2xs`
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <div
                className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive ? item.bgColor : "bg-transparent group-hover:bg-secondary"
                }`}
              >
                <item.icon className={`h-4 w-4 ${isActive ? item.color : "text-muted-foreground"}`} />
              </div>
              {!collapsed && (
                <>
                  <span className="truncate flex-1 text-left">{item.title}</span>
                  {badge !== undefined && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        item.id === "kds"
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                  {item.shortcut && !badge && (
                    <span className="font-mono text-[10px] text-muted-foreground/60">{item.shortcut}</span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      {/* Left Collapsible NovaStock Sidebar (Desktop) */}
      <aside
        className={`no-print shrink-0 border-r border-sidebar-border bg-sidebar hidden md:flex flex-col transition-all duration-200 sticky top-0 h-screen z-40 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="p-3 border-b border-sidebar-border flex items-center gap-3">
          <button
            onClick={() => selectModule("dashboard")}
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 hover:scale-105 transition p-0.5"
            title="Ir al Dashboard"
          >
            <img src="/logo.png" alt="NovaStock Logo" className="h-full w-full object-contain filter drop-shadow-xs" />
          </button>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <h1 className="text-sm font-bold text-foreground tracking-tight truncate">
                NovaStock
              </h1>
              <p className="text-[11px] text-muted-foreground truncate">
                {pos.companySettings.name}
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          {renderGroup("Principal", MAIN_NAV)}
          {renderGroup("Gestión", MANAGEMENT_NAV)}
          {renderGroup("Reportes & IA", REPORTS_NAV)}
        </div>

        <div className="p-3 border-t border-sidebar-border">
          {!collapsed ? (
            <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold">{pos.companySettings.rif}</span>
                <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 text-[10px]">v1.0 SENIAT</span>
              </div>
              <span className="text-[10px] text-muted-foreground/80">by NovaSystems · Edición Venezuela</span>
            </div>
          ) : (
            <div className="text-center text-[10px] font-mono text-emerald-500 font-bold" title="v1.0 SENIAT Venezuela">v1.0</div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer (Visible when burger menu clicked) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setMobileNavOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[80vw] bg-sidebar border-r border-sidebar-border h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="p-3.5 border-b border-sidebar-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 p-0.5">
                  <img src="/logo.png" alt="NovaStock Logo" className="h-full w-full object-contain filter drop-shadow-xs" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-bold text-foreground">NovaStock</div>
                  <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{pos.companySettings.name}</div>
                </div>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-3">
              {renderGroup("Principal", MAIN_NAV)}
              {renderGroup("Gestión", MANAGEMENT_NAV)}
              {renderGroup("Reportes & IA", REPORTS_NAV)}
            </div>

            <div className="p-3 border-t border-sidebar-border bg-sidebar text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="font-mono">{pos.companySettings.rif}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">v1.0 SENIAT</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header */}
        <header className="no-print h-14 border-b border-border flex items-center justify-between px-2 sm:px-4 bg-card/85 backdrop-blur-md sticky top-0 z-30 gap-2 w-full max-w-full overflow-hidden">
          {/* Left section: Mobile Menu / Collapse Button + Title */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
            {/* Mobile Hamburger Drawer Button */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition shrink-0"
              title="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop Collapse Button */}
            <button
              onClick={() => pos.setSidebarCollapsed(!collapsed)}
              className="hidden md:flex h-8 w-8 rounded-lg items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
              title={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
            >
              <PanelLeft className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-border shrink-0 hidden sm:block" />

            <h2 className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[130px] sm:max-w-[190px]">
              {MODULE_TITLES[currentModule]}
            </h2>
          </div>

          {/* Right section: Clean, Responsive Pills & Always Reachable Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            {/* Offline Status Pill */}
            {!isOnline && (
              <div
                className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 shrink-0 animate-pulse"
                title="Modo Sin Conexión activo. Las ventas se procesan y guardan localmente."
              >
                <span>🟡 Modo Offline</span>
              </div>
            )}

            {/* Live Rate Pill */}
            <button
              onClick={() => pos.setModal("bcv")}
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[11px] sm:text-xs font-semibold text-primary hover:bg-primary/15 transition shrink-0"
              title="Monitor Multi-Divisas (BCV / Paralelo)"
            >
              <RefreshCw className={`h-3 w-3 ${pos.isRefreshingRates ? "animate-spin" : ""}`} />
              <span className="hidden md:inline">{pos.ratesData.variants[pos.ratesData.activeVariantId]?.name?.replace(/\s*\(.*?\)/, "") ?? "BCV"}:</span>
              <span>Bs. {pos.rate.toFixed(2)}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* Cashier Shift Pill (Arqueo / Estado de Caja) */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/70 py-1 px-2 text-xs shrink-0">
              {pos.shift.isOpen ? (
                <>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="hidden sm:inline">Caja Abierta</span>
                  </span>
                  <span className="hidden md:inline font-mono text-muted-foreground text-[10px]">
                    ({h}h {String(m).padStart(2, "0")}m)
                  </span>
                  <button
                    onClick={() => pos.setModal("shift")}
                    className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-[11px] font-bold hover:bg-rose-500 hover:text-white transition cursor-pointer"
                    title="Cerrar la Caja del Día (Cierre Z) / Arqueo"
                  >
                    <Lock className="h-2.5 w-2.5" /> Cerrar Caja (Z)
                  </button>
                </>
              ) : (
                <button
                  onClick={() => pos.setModal("shift")}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 text-white px-2.5 py-1 text-[11px] font-bold shadow-xs hover:bg-emerald-700 transition cursor-pointer animate-pulse"
                  title="Abrir la caja del día ingresando el fondo en Bolívares"
                >
                  <Sun className="h-3.5 w-3.5" /> Abrir Caja (Fondo Bs.)
                </button>
              )}
            </div>

            {/* ALWAYS PINNED ESSENTIAL CONTROLS (PWA Install, Theme, Lock Screen, Profile Login) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pl-1.5 sm:pl-2 border-l border-border/60">
              {/* PWA Install Button */}
              <PwaInstallButton />

              {/* TeamViewer & Remote Support Button */}
              <button
                onClick={() => pos.setModal("support")}
                className="h-8 w-8 rounded-lg border border-border bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition shrink-0 cursor-pointer"
                title="TeamViewer / Control Remoto a Distancia y Soporte Técnico"
              >
                <Monitor className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </button>

              {/* Theme Toggle (Light / Dark) */}
              <button
                onClick={pos.toggleTheme}
                className="h-8 w-8 rounded-lg border border-border bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition shrink-0"
                title={pos.theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
              >
                {pos.theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>

              {/* Lock Screen Button */}
              <button
                onClick={() => {
                  pos.lockTerminal();
                  toast.info("Terminal bloqueado");
                }}
                className="h-8 w-8 rounded-lg border border-border bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition shrink-0"
                title="Bloquear Terminal (Protector de Pantalla con Clave PIN)"
              >
                <Lock className="h-4 w-4" />
              </button>

              {/* User Profile Avatar & Login Account Modal Trigger */}
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="h-8 w-8 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center shrink-0 hover:ring-2 hover:ring-primary/40 transition active:scale-95 group relative"
                title="Mi Cuenta y Perfil de Usuario"
              >
                <span className="text-xs font-bold text-primary group-hover:scale-105 transition">
                  {pos.shift.cashier
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "MP"}
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
              </button>
            </div>
          </div>
        </header>

        {/* Active View Content */}
        <main className="flex-1 min-w-0 bg-background">{children}</main>
      </div>

      {/* Screen Saver & PIN Security Lock Screen */}
      {pos.isLocked && <TerminalLockScreen onUnlock={pos.unlockTerminal} />}

      {/* User Login & Register Modal */}
      {showAuthModal && <AuthUserModal onClose={() => setShowAuthModal(false)} />}

      {pos.modal === "payment" && <PaymentModal />}
      {pos.modal === "ticket" && <ThermalTicketModal />}
      {pos.modal === "shift" && <CashShiftModal />}
      {pos.modal === "printer" && <FiscalPrinterModal />}
      {pos.modal === "bcv" && <RateSelectorModal />}
      {pos.modal === "support" && <SupportMenuModal />}
    </div>
  );
}
