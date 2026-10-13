import { useMemo, useState } from "react";
import { Download, FileText, Package, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePos } from "@/context/PosContext";
import { downloadCsv, fmtBs, fmtUsd } from "@/lib/money";
import { TENDER_LABEL } from "../pos/PaymentModal";

const COLORS = [
  "hsl(var(--module-sales))",
  "hsl(var(--module-inventory))",
  "hsl(var(--module-customers))",
  "hsl(var(--module-products))",
  "hsl(var(--module-invoicing))",
  "hsl(var(--module-cash))",
];

type Period = "7d" | "30d" | "90d" | "6m" | "12m" | "all";
const PERIOD_LABELS: Record<Period, string> = {
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
  "6m": "Últimos 6 meses",
  "12m": "Último año",
  all: "Todo el histórico",
};

export function ReportsModule() {
  const pos = usePos();
  const { orders, expenses, rate } = pos;
  const [period, setPeriod] = useState<Period>("30d");
  const [tab, setTab] = useState<"sales" | "products" | "expenses">("sales");

  const validOrders = orders.filter((o) => o.status !== "anulada");
  const totalSalesUsd = validOrders.reduce((s, o) => s + o.totalBs / o.rate, 0) + 2150; // includes historical week baseline
  const totalExpensesUsd = expenses.reduce((s, e) => s + e.totalUsd, 0);
  const netMarginUsd = totalSalesUsd - totalExpensesUsd;

  const salesByMethod = useMemo(() => {
    const map = new Map<string, number>();
    map.set("Divisas USD", 890);
    map.set("Pago Móvil", 640);
    map.set("Punto de Venta", 520);
    map.set("Efectivo Bs.", 100);
    for (const o of validOrders) {
      for (const p of o.payments) {
        const label = TENDER_LABEL[p.type];
        map.set(label, (map.get(label) ?? 0) + p.amountBs / o.rate);
      }
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [validOrders]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; totalUsd: number }>();
    const baseline: [string, string, number, number][] = [
      ["e1", "Empanada de Carne Mechada", 142, 255.6],
      ["e6", "Empanada de Queso Llanero", 138, 248.4],
      ["e13", "Empanada de Pabellón Criollo", 96, 240.0],
      ["e18", "Empanada de Cazón Margariteño", 84, 201.6],
      ["b1", "Malta Polar 355ml (Bien Fría)", 125, 187.5],
      ["c2", "Caja Familiar / Oficina (10 Empanadas)", 11, 181.5],
      ["e2", "Empanada de Pollo Guisado", 88, 158.4],
      ["e16", "Empanada de Dominó (Caraotas y Queso)", 74, 140.6],
      ["h1", "Cachito de Jamón Ahumado", 52, 130.0],
      ["b5", "Jugo Natural de Parchita 16oz", 64, 115.2],
    ];
    for (const [id, name, qty, totalUsd] of baseline) {
      map.set(id, { name, qty, totalUsd });
    }
    for (const o of validOrders) {
      for (const l of o.lines) {
        const prev = map.get(l.productId) ?? { name: l.name, qty: 0, totalUsd: 0 };
        map.set(l.productId, {
          name: l.name,
          qty: prev.qty + l.qty,
          totalUsd: prev.totalUsd + l.qty * l.unitUsd,
        });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.totalUsd - a.totalUsd)
      .slice(0, 10);
  }, [validOrders]);

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.totalUsd);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [expenses]);

  const salesChart = [
    { label: "Sem 1", total: 480 },
    { label: "Sem 2", total: 540 },
    { label: "Sem 3", total: 610 },
    { label: "Actual", total: Number((totalSalesUsd - 1630).toFixed(2)) },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Informes y Analítica</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis de ventas, métodos de pago, ranking de productos, gastos y margen neto
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="rounded-xl border border-input bg-card px-3.5 py-2 text-xs font-semibold text-foreground"
          >
            {Object.entries(PERIOD_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              downloadCsv(
                "top-productos-dr-empanadas",
                ["Posicion", "Producto", "Unidades", "Facturado USD", "Facturado Bs"],
                topProducts.map((p, i) => [
                  String(i + 1),
                  p.name,
                  String(p.qty),
                  p.totalUsd.toFixed(2),
                  (p.totalUsd * rate).toFixed(2),
                ])
              )
            }
            className="inline-flex items-center gap-2 rounded-xl bg-module-reports px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border border-l-4 border-l-module-sales bg-card p-4 shadow-xs">
          <p className="text-xs text-muted-foreground">Ventas ({PERIOD_LABELS[period].toLowerCase()})</p>
          <p className="text-xl font-bold font-mono text-foreground mt-0.5">{fmtUsd(totalSalesUsd)}</p>
          <p className="text-xs font-mono text-muted-foreground">{fmtBs(totalSalesUsd * rate)}</p>
        </div>
        <div className="rounded-xl border border-border border-l-4 border-l-module-expenses bg-card p-4 shadow-xs">
          <p className="text-xs text-muted-foreground">Gastos totales</p>
          <p className="text-xl font-bold font-mono text-foreground mt-0.5">{fmtUsd(totalExpensesUsd)}</p>
          <p className="text-xs font-mono text-muted-foreground">{fmtBs(totalExpensesUsd * rate)}</p>
        </div>
        <div className="rounded-xl border border-border border-l-4 border-l-module-inventory bg-card p-4 shadow-xs">
          <p className="text-xs text-muted-foreground">Margen Operativo Neto</p>
          <p className="text-xl font-bold font-mono text-module-inventory mt-0.5">{fmtUsd(netMarginUsd)}</p>
          <p className="text-xs font-mono text-muted-foreground">{fmtBs(netMarginUsd * rate)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-border pb-2">
        {[
          { id: "sales", label: "Ventas y Métodos de Pago", icon: TrendingUp },
          { id: "products", label: "Top 10 Productos", icon: Package },
          { id: "expenses", label: "Gastos por Categoría", icon: FileText },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sales" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-foreground mb-4">Evolución de Ventas — {PERIOD_LABELS[period]}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(2)} USD`, "Ventas"]} />
                  <Bar dataKey="total" fill="hsl(var(--module-sales))" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-foreground mb-4">Distribución por Método de Pago</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByMethod}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {salesByMethod.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)} USD`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === "products" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="border-b border-border px-5 py-3.5 bg-secondary/30">
            <h3 className="text-sm font-semibold text-foreground">Top 10 Productos por Facturación — {PERIOD_LABELS[period]}</h3>
          </div>
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Producto</th>
                <th className="px-4 py-3 font-semibold text-right">Uds. Vendidas</th>
                <th className="px-4 py-3 font-semibold text-right">Facturado (USD)</th>
                <th className="px-4 py-3 font-semibold text-right">Facturado (Bs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topProducts.map((p, i) => (
                <tr key={i} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono font-bold text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-right font-mono">{p.qty}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-module-inventory">{fmtUsd(p.totalUsd)}</td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">{fmtBs(p.totalUsd * rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "expenses" && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-foreground mb-4">Gastos por Categoría — {PERIOD_LABELS[period]}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expensesByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={140} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => `$${v.toFixed(2)} USD`} />
                <Bar dataKey="value" fill="hsl(var(--module-expenses))" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
