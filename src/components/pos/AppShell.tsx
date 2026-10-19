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
} from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
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
  const lowStockCount = pos.products.filter((p) => p.stockBar + p.stockKitchen <= (p.minStock ?? 10)).length;

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
        selectModule("dashboard");
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
      {/* Left Collapsible NovaSystem Sidebar (Desktop) */}
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
            <img src="/logo.png" alt="NovaSystem Logo" className="h-full w-full object-contain filter drop-shadow-xs" />
          </button>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <h1 className="text-sm font-bold text-foreground tracking-tight truncate">
                NovaSystem
              </h1>
              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                <span>🥟</span>
                <span>{pos.companySettings.name}</span>
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
              <span className="text-[10px] text-muted-foreground/80">Edición Venezuela · 1ª Versión</span>
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
                  <img src="/logo.png" alt="NovaSystem Logo" className="h-full w-full object-contain filter drop-shadow-xs" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-bold text-foreground">NovaSystem</div>
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
        <header className="no-print h-14 border-b border-border flex items-center justify-between px-2 sm:px-3.5 bg-card/85 backdrop-blur-md sticky top-0 z-30 gap-1.5 sm:gap-2 overflow-x-clip">
          {/* Left section: Mobile Menu / Collapse Button + Title */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
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

            <h2 className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[110px] sm:max-w-[160px] md:max-w-[190px]">
              {MODULE_TITLES[currentModule]}
            </h2>
          </div>

          {/* Right section: Pills & Controls with intelligent overflow */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Rate Pill */}
            <button
              onClick={() => pos.setModal("bcv")}
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[11px] sm:text-xs font-semibold text-primary hover:bg-primary/15 transition shrink-0"
              title="Monitor Multi-Divisas (monitordolarve, BCV, Binance)"
            >
              <RefreshCw className={`h-3 w-3 ${pos.isRefreshingRates ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{pos.ratesData.variants[pos.ratesData.activeVariantId]?.name?.replace(/\s*\(.*?\)/, "") ?? "BCV"}:</span>
              <span>Bs. {pos.rate.toFixed(2)}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* Cashier Shift Pill (compact and clean) */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border bg-secondary/70 py-1 px-2 text-xs shrink-0">
              <span className="font-mono text-muted-foreground text-[11px]">
                {h}h {String(m).padStart(2, "0")}m
              </span>
              <button
                onClick={() => pos.setModal("shift")}
                className="inline-flex items-center gap-1 rounded-md bg-card border border-border px-1.5 py-0.5 text-[11px] font-semibold text-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition"
                title="Cierre de Turno y Arqueo X/Z"
              >
                <Lock className="h-2.5 w-2.5" /> Arqueo
              </button>
            </div>

            {/* Quick Open Cash Drawer Button (ultra-wide only) */}
            <button
              onClick={() => {
                toast.success("🗄️ Gaveta de dinero abierta (Pulso ESC/POS enviado a impresora)");
              }}
              className="hidden 2xl:inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/70 px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-secondary transition shrink-0"
              title="Abrir Gaveta de Dinero (Pulso RJ11 a impresora)"
            >
              <span>🗄️ Gaveta</span>
            </button>

            {/* Support / Technician Pill (ultra-wide only) */}
            <button
              onClick={() => pos.setModal("support")}
              className="hidden 2xl:inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition shrink-0"
              title="Menú Oculto de Soporte Técnico, TeamViewer y Actualizar Biblioteca Móvil"
            >
              <Wrench className="h-3 w-3" />
              <span>Soporte VIP</span>
            </button>

            {/* Fiscal Printer Status Pill (ultra-wide only) */}
            <button
              onClick={() => pos.setModal("printer")}
              className="hidden 2xl:inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/70 px-2.5 py-1 font-mono text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition shrink-0"
              title="Estado Impresora Fiscal The Factory HKA"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>HKA {pos.fiscal.port}</span>
              <span className={pos.fiscal.connected ? "text-emerald-500" : "text-rose-500"}>●</span>
            </button>

            {/* Quick Mode Switcher (ultra-wide only, desktop already has left sidebar) */}
            <div className="hidden 2xl:flex items-center gap-0.5 rounded-lg border border-border bg-secondary/60 p-0.5 shrink-0">
              <button
                onClick={() => selectModule("pos")}
                className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                  currentModule === "pos"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                TPV (F1)
              </button>
              <button
                onClick={() => selectModule("kds")}
                className={`rounded-md px-2 py-1 text-xs font-medium transition flex items-center gap-1 ${
                  currentModule === "kds"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>KDS (F2)</span>
                {pendingFryer > 0 && (
                  <span className="rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                    {pendingFryer}
                  </span>
                )}
              </button>
              <button
                onClick={() => selectModule("dashboard")}
                className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                  currentModule !== "pos" && currentModule !== "kds"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ERP (F3)
              </button>
            </div>

            {/* ALWAYS PINNED ESSENTIAL CONTROLS (Theme, Lock Screen, Profile Login) */}
            <div className="flex items-center gap-1.5 shrink-0 pl-1.5 sm:pl-2 border-l border-border/60 mr-1 sm:mr-1.5">
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
                  toast.info("Terminal bloqueado (Protector de pantalla activo)");
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
                title="Cuenta / Iniciar Sesión con Google o Correo / Crear Usuario"
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
