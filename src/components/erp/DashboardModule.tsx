import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChefHat,
  FileText,
  Landmark,
  ShoppingCart,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";
import type { ModuleId } from "@/types/pos";

export function DashboardModule() {
  const pos = usePos();
  const { orders, products, supplierInvoices, shift, rate } = pos;

  const activeOrders = orders.filter((o) => o.status !== "anulada");
  const todayTotalBs = activeOrders.reduce((s, o) => s + o.totalBs, 0);
  const todayTotalUsd = activeOrders.reduce((s, o) => s + o.totalBs / o.rate, 0);
  const lowStock = products.filter((p) => p.stockBar < (p.stockMin ?? 25));
  const pendingSI = supplierInvoices.filter((si) => !si.paid).length;
  const pendingKds = orders.filter((o) => o.kdsStatus === "fryer").length;

  // Build 7-day sales chart data
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Hoy"];
  const chartData = days.map((label, idx) => {
    const baseUsd = [310, 285, 340, 390, 465, 520, Math.max(180, Math.round(todayTotalUsd))][idx] ?? 300;
    return {
      label,
      usd: baseUsd,
      bs: Math.round(baseUsd * rate),
    };
  });

  const kpis = [
    {
      title: "Ventas acumuladas",
      value: fmtUsd(todayTotalUsd),
      sub: `${fmtBs(todayTotalBs)} · ${activeOrders.length} ventas`,
      icon: ShoppingCart,
      up: true,
      color: "text-module-sales",
      bg: "bg-module-sales-light",
      target: "pos" as ModuleId,
    },
    {
      title: "Cocina / Freidoras KDS",
      value: `${pendingKds} activas`,
      sub: pendingKds > 0 ? "en preparación ahora" : "freidoras al día",
      icon: ChefHat,
      up: pendingKds > 0,
      color: "text-module-customers",
      bg: "bg-module-customers-light",
      target: "kds" as ModuleId,
    },
    {
      title: "Stock crítico",
      value: `${lowStock.length}`,
      sub: "productos bajo mínimo",
      icon: AlertTriangle,
      up: false,
      color: "text-module-expenses",
      bg: "bg-module-expenses-light",
      target: "inventory" as ModuleId,
    },
    {
      title: "Caja y Turno",
      value: shift.isOpen ? fmtBs(shift.openingBs + todayTotalBs) : "Cerrada",
      sub: shift.isOpen ? `${shift.cashier} (${shift.register})` : "sin sesión",
      icon: Landmark,
      up: shift.isOpen,
      color: "text-module-cash",
      bg: "bg-module-cash-light",
      target: "cash" as ModuleId,
    },
  ];

  const quickActions: { label: string; module: ModuleId; color: string; bg: string }[] = [
    { label: "🛒 Nueva venta TPV", module: "pos", color: "text-module-sales", bg: "bg-module-sales-light hover:opacity-90" },
    { label: "🍳 Ver Cocina KDS", module: "kds", color: "text-module-customers", bg: "bg-module-customers-light hover:opacity-90" },
    { label: "🚚 Crear pedido a proveedor", module: "suppliers", color: "text-module-suppliers", bg: "bg-module-suppliers-light hover:opacity-90" },
    { label: "📦 Registrar ajuste de stock", module: "inventory", color: "text-module-inventory", bg: "bg-module-inventory-light hover:opacity-90" },
    { label: "🧾 Libro de Ventas SENIAT", module: "invoicing", color: "text-module-invoicing", bg: "bg-module-invoicing-light hover:opacity-90" },
    { label: "📊 Exportar informe gerencial", module: "reports", color: "text-module-reports", bg: "bg-module-reports-light hover:opacity-90" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bienvenido a NovaSystem · Dr. Empanadas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen ejecutivo —{" "}
            {new Date().toLocaleDateString("es-VE", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · Tasa Activa:{" "}
            <button
              onClick={() => pos.setModal("bcv")}
              className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
              title="Abrir Monitor Multi-Divisas en Vivo"
            >
              <span>Bs. {rate.toFixed(2)} / USD</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            </button>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => pos.setActiveModule("pos")}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
          >
            Ir al Terminal TPV (F1)
          </button>
          <button
            onClick={() => pos.setModal("shift")}
            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition"
          >
            🔒 Arqueo X / Cierre Z
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            onClick={() => pos.setActiveModule(kpi.target)}
            className="cursor-pointer rounded-xl border border-border bg-card p-5 shadow-xs hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium text-muted-foreground">{kpi.title}</span>
              <div className={`h-9 w-9 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">{kpi.value}</div>
            <p className={`text-xs mt-1 flex items-center gap-1 ${kpi.up ? "text-module-inventory font-medium" : "text-muted-foreground"}`}>
              {kpi.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {kpi.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Charts & Alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Ventas últimos 7 días (USD & Bs.)</h3>
            <span className="text-xs text-muted-foreground">Sucursal Chacao</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(v: number) => [`$${v.toFixed(2)} USD (${fmtBs(v * rate)})`, "Ventas"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="usd" fill="hsl(var(--module-sales))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Alertas y Estado Operativo</h3>
            <div className="space-y-3.5">
              {lowStock.length > 0 && (
                <div
                  onClick={() => pos.setActiveModule("inventory")}
                  className="flex cursor-pointer items-center gap-3 rounded-lg bg-module-customers-light p-3 text-xs hover:opacity-90"
                >
                  <div className="h-2.5 w-2.5 rounded-full bg-module-customers shrink-0" />
                  <span className="font-medium text-foreground">
                    {lowStock.length} productos bajo stock mínimo ({lowStock.slice(0, 2).map((p) => p.short).join(", ")})
                  </span>
                </div>
              )}
              {pendingSI > 0 && (
                <div
                  onClick={() => pos.setActiveModule("suppliers")}
                  className="flex cursor-pointer items-center gap-3 rounded-lg bg-module-expenses-light p-3 text-xs hover:opacity-90"
                >
                  <div className="h-2.5 w-2.5 rounded-full bg-module-expenses shrink-0" />
                  <span className="font-medium text-foreground">{pendingSI} facturas de proveedor pendientes por pagar</span>
                </div>
              )}
              <div
                onClick={() => pos.setModal("printer")}
                className="flex cursor-pointer items-center gap-3 rounded-lg bg-module-inventory-light p-3 text-xs hover:opacity-90"
              >
                <div className="h-2.5 w-2.5 rounded-full bg-module-inventory shrink-0" />
                <span className="font-medium text-foreground">
                  Impresora Fiscal {pos.fiscal.model} en {pos.fiscal.port} (Reporte Z #{pos.fiscal.lastZ})
                </span>
              </div>
              <div
                onClick={() => pos.setActiveModule("invoicing")}
                className="flex cursor-pointer items-center gap-3 rounded-lg bg-module-invoicing-light p-3 text-xs hover:opacity-90"
              >
                <FileText className="h-4 w-4 text-module-invoicing shrink-0" />
                <span className="font-medium text-foreground">
                  Libro de Ventas SENIAT al día ({activeOrders.length} facturas registradas)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Acciones rápidas</h3>
        <div className="flex flex-wrap gap-2.5">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => pos.setActiveModule(action.module)}
              className={`${action.bg} ${action.color} rounded-xl px-4 py-2.5 text-xs font-semibold transition-all shadow-2xs`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
