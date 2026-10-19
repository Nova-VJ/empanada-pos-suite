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

  const selectModule = (id: ModuleId) => {
    pos.setActiveModule(id);
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
      {/* Left Collapsible NovaSystem Sidebar */}
      <aside
        className={`no-print shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col transition-all duration-200 sticky top-0 h-screen z-40 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="p-3.5 border-b border-sidebar-border flex items-center gap-3">
          <button
            onClick={() => selectModule("dashboard")}
            className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm shrink-0 text-primary-foreground font-bold text-sm"
          >
            N
          </button>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-foreground tracking-tight truncate">
                  NovaSystem
                </h1>
                <span className="text-xs">🥟</span>
              </div>
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
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-mono">{pos.companySettings.rif}</span>
              <span>v2.0 Suite</span>
            </div>
          ) : (
            <div className="text-center text-[10px] font-mono text-muted-foreground">v2</div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header */}
        <header className="no-print h-14 border-b border-border flex items-center gap-2.5 px-4 bg-card/85 backdrop-blur-md sticky top-0 z-30">
          <button
            onClick={() => pos.setSidebarCollapsed(!collapsed)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
            title={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
          >
            <PanelLeft className="h-4 w-4" />
          </button>

          <div className="h-5 w-px bg-border shrink-0" />

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate">
              {MODULE_TITLES[currentModule]}
            </h2>
          </div>

          {/* Right Operational & Fiscal Pills */}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Live Multi-source Rate Pill */}
            <button
              onClick={() => pos.setModal("bcv")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary hover:bg-primary/15 transition"
              title="Monitor Multi-Divisas (monitordolarve, monitordedivisa, BCV, Binance)"
            >
              <RefreshCw className={`h-3 w-3 ${pos.isRefreshingRates ? "animate-spin" : ""}`} />
              <span>{pos.ratesData.variants[pos.ratesData.activeVariantId]?.name?.replace(/\s*\(.*?\)/, "") ?? "BCV"}: Bs. {pos.rate.toFixed(2)} / $</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" title="Actualización automática activa" />
            </button>

            {/* Cashier & Arqueo X-Z Pill */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border bg-secondary/70 py-1 pl-2.5 pr-1 text-xs">
              <span className="text-foreground font-medium">
                {pos.shift.cashier}{" "}
                <span className="text-muted-foreground">({pos.shift.register})</span>
              </span>
              <span className="font-mono text-muted-foreground">
                {h}h {String(m).padStart(2, "0")}m
              </span>
              <button
                onClick={() => pos.setModal("shift")}
                className="inline-flex items-center gap-1 rounded-md bg-card border border-border px-2 py-0.5 text-[11px] font-semibold text-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition"
              >
                <Lock className="h-3 w-3" /> Arqueo X-Z
              </button>
            </div>

            {/* Support / Technician Pill (TeamViewer & Resincronización) */}
            <button
              onClick={() => pos.setModal("support")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition"
              title="Menú Oculto de Soporte Técnico, TeamViewer y Actualizar Biblioteca Móvil"
            >
              <Wrench className="h-3 w-3" />
              <span className="hidden sm:inline">Soporte VIP</span>
            </button>

            {/* Fiscal Printer Status Pill */}
            <button
              onClick={() => pos.setModal("printer")}
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/70 px-2.5 py-1 font-mono text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
              title="Estado Impresora Fiscal The Factory HKA"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>HKA {pos.fiscal.port}</span>
              <span className={pos.fiscal.connected ? "text-emerald-500" : "text-rose-500"}>●</span>
            </button>

            {/* Quick Mode Switcher */}
            <div className="hidden xl:flex items-center gap-1 rounded-lg border border-border bg-secondary/60 p-0.5">
              <button
                onClick={() => selectModule("pos")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  currentModule === "pos"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                TPV (F1)
              </button>
              <button
                onClick={() => selectModule("kds")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition flex items-center gap-1 ${
                  currentModule === "kds"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>KDS (F2)</span>
                {pendingFryer > 0 && (
                  <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                    {pendingFryer}
                  </span>
                )}
              </button>
              <button
                onClick={() => selectModule("dashboard")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  currentModule !== "pos" && currentModule !== "kds"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ERP (F3)
              </button>
            </div>

            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={pos.toggleTheme}
              className="h-8 w-8 rounded-lg border border-border bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition"
              title={pos.theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
            >
              {pos.theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* User Avatar */}
            <div
              className="h-8 w-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0"
              title={`${pos.shift.cashier} · ${pos.shift.register}`}
            >
              <span className="text-xs font-bold text-primary">MP</span>
            </div>
          </div>
        </header>

        {/* Active View Content */}
        <main className="flex-1 min-w-0 bg-background">{children}</main>
      </div>

      {pos.modal === "payment" && <PaymentModal />}
      {pos.modal === "ticket" && <ThermalTicketModal />}
      {pos.modal === "shift" && <CashShiftModal />}
      {pos.modal === "printer" && <FiscalPrinterModal />}
      {pos.modal === "bcv" && <RateSelectorModal />}
      {pos.modal === "support" && <SupportMenuModal />}
    </div>
  );
}
