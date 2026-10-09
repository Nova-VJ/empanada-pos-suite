import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { usePos } from "@/context/PosContext";
import { downloadCsv, fmtBs, fmtUsd } from "@/lib/money";
import { TENDER_LABEL } from "@/components/pos/PaymentModal";

export const Route = createFileRoute("/backoffice")({
  head: () => ({
    meta: [
      { title: "Backoffice Gerencial · Dr. Empanadas" },
      { name: "description", content: "KPIs, inventario, cortes Z y Libro de Ventas SENIAT de Dr. Empanadas C.A." },
      { property: "og:title", content: "Backoffice Gerencial · Dr. Empanadas" },
      { property: "og:description", content: "Auditoría fiscal, inventario y exportación a Excel." },
    ],
  }),
  component: Backoffice,
});

const TABS = ["KPI Dashboard", "Inventario & Fichas de Costo", "Auditoría de Turnos y Cortes Z", "Libro de Ventas Fiscal"] as const;

function Backoffice() {
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);
  return (
    <div className="p-4">
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-800">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium ${tab === t ? "border-emerald-500 text-slate-50" : "border-transparent text-slate-400 hover:text-slate-200"}`}>{t}</button>
        ))}
      </div>
      {tab === TABS[0] && <Kpis />}
      {tab === TABS[1] && <Inventory />}
      {tab === TABS[2] && <Shifts />}
      {tab === TABS[3] && <SalesBook />}
    </div>
  );
}

function Panel({ title, onExport, children }: { title: string; onExport: () => void; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <button onClick={onExport} className="rounded-lg border border-emerald-500/40 bg-emerald-600/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/20">📥 Exportar a Excel</button>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: ReactNode[][]; empty: string }) {
  return (
    <table className="w-full text-xs">
      <thead className="bg-slate-950/50 text-left text-slate-500"><tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>)}</tr></thead>
      <tbody className="font-mono text-slate-200">
        {rows.length === 0 && <tr><td colSpan={head.length} className="py-10 text-center font-sans text-slate-500">{empty}</td></tr>}
        {rows.map((r, i) => <tr key={i} className="border-t border-slate-800 hover:bg-slate-800/40">{r.map((c, j) => <td key={j} className="whitespace-nowrap px-3 py-2">{c}</td>)}</tr>)}
      </tbody>
    </table>
  );
}

const dt = (t: number) => new Date(t).toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" });

function Kpis() {
  const { orders, products } = usePos();
  const grossBs = orders.reduce((a, o) => a + o.totalBs, 0);
  const grossUsd = orders.reduce((a, o) => a + o.totalBs / o.rate, 0);
  let rev = 0, cost = 0;
  for (const o of orders) for (const l of o.lines) {
    const p = products.find((x) => x.id === l.productId);
    rev += l.unitUsd * l.qty * (1 - o.discountPct / 100);
    cost += (p?.costUsd ?? 0) * l.qty;
  }
  const margin = rev > 0 ? ((rev - cost) / rev) * 100 : 60.3;
  const cards = [
    ["Facturación Bruta", fmtBs(grossBs), `${fmtUsd(grossUsd)} USD`],
    ["Tickets emitidos", String(orders.length), "acumulado"],
    ["Ticket Promedio", fmtUsd(orders.length ? grossUsd / orders.length : 0), "USD"],
    ["Margen Bruto", `${margin.toFixed(1)}%`, "sobre costo de ficha"],
  ];
  const head = ["Ticket", "Factura", "Fecha", "Cajero", "Tipo", "Pagos", "Total Bs.", "USD", "Estado KDS"];
  const rows = orders.map((o) => [`#${o.id}`, o.invoiceNo, dt(o.createdAt), o.cashier, o.type === "takeout" ? "Llevar" : o.table ?? "", o.payments.map((p) => TENDER_LABEL[p.type]).join(" + "), fmtBs(o.totalBs), fmtUsd(o.totalBs / o.rate), o.kdsStatus]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([k, v, s]) => (
          <div key={k} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">{k}</div>
            <div className="mt-1 font-mono text-2xl font-bold text-slate-50">{v}</div>
            <div className="font-mono text-xs text-sky-400">{s}</div>
          </div>
        ))}
      </div>
      <Panel title="Auditoría de transacciones en vivo" onExport={() => downloadCsv("transacciones", head, rows as string[][])}>
        <Table head={head} rows={rows} empty="Sin transacciones. Cobra una orden en el Terminal TPV (F1)." />
      </Panel>
    </div>
  );
}

function Inventory() {
  const { products, rate } = usePos();
  const head = ["SKU", "Producto", "Categoría", "Precio Venta", "Costo", "Margen %", "Stock en Barra", "Stock en Cocina"];
  const rows = products.map((p) => [p.sku, p.name, p.category, `${fmtUsd(p.priceUsd)} · ${fmtBs(p.priceUsd * rate)}`, fmtUsd(p.costUsd), `${(((p.priceUsd - p.costUsd) / p.priceUsd) * 100).toFixed(1)}%`, p.stockBar, p.stockKitchen]);
  return <Panel title="Inventario & Fichas de Costo" onExport={() => downloadCsv("inventario", head, rows as string[][])}><Table head={head} rows={rows} empty="" /></Panel>;
}

function Shifts() {
  const { shiftHistory } = usePos();
  const head = ["Tipo", "Nº Z", "Cajero", "Caja", "Apertura", "Cierre", "Tickets", "Declarado Bs.", "Sistema Bs.", "Diferencia", "Observaciones"];
  const rows = shiftHistory.map((s) => [s.kind, s.zNumber ?? "—", s.cashier, s.register, dt(s.openedAt), dt(s.closedAt), s.tickets, fmtBs(s.declaredTotalBs), fmtBs(s.expectedTotalBs), fmtBs(s.differenceBs), s.notes]);
  const styled = rows.map((r, i) => r.map((c, j) => j === 9 ? <span className={Math.abs(shiftHistory[i].differenceBs) < 0.01 ? "text-emerald-400" : shiftHistory[i].differenceBs > 0 ? "text-amber-400" : "text-rose-400"}>{c}</span> : c));
  return <Panel title="Auditoría de Turnos y Cortes Z" onExport={() => downloadCsv("cortes-z", head, rows as string[][])}><Table head={head} rows={styled} empty="Sin cortes. Usa “🔒 Arqueo / Cierre X-Z” en la barra superior." /></Panel>;
}

function SalesBook() {
  const { orders } = usePos();
  const head = ["Fecha", "Nº Factura", "Nº Control", "RIF Cliente", "Nombre", "Total Ventas c/IVA", "Base Imponible 16%", "IVA 16%", "IGTF 3%", "Nº Z"];
  const rows = [...orders].reverse().map((o) => [new Date(o.createdAt).toLocaleDateString("es-VE"), o.invoiceNo, o.controlNo, "V-00000000", "Consumidor Final", fmtBs(o.baseBs + o.ivaBs), fmtBs(o.baseBs), fmtBs(o.ivaBs), fmtBs(o.igtfBs), o.zNumber ?? "abierto"]);
  const sum = (k: "baseBs" | "ivaBs" | "igtfBs") => orders.reduce((a, o) => a + o[k], 0);
  return (
    <Panel title="Libro de Ventas Fiscal · SENIAT Providencia 0071" onExport={() => downloadCsv("libro-ventas-seniat", head, [...rows, ["TOTALES", "", "", "", "", fmtBs(sum("baseBs") + sum("ivaBs")), fmtBs(sum("baseBs")), fmtBs(sum("ivaBs")), fmtBs(sum("igtfBs")), ""]] as string[][])}>
      <Table head={head} rows={rows} empty="Sin facturas emitidas en el período." />
      {orders.length > 0 && (
        <div className="flex justify-end gap-6 border-t border-slate-800 px-4 py-3 font-mono text-xs text-slate-300">
          <span>BI: {fmtBs(sum("baseBs"))}</span><span>IVA: {fmtBs(sum("ivaBs"))}</span><span className="text-amber-400">IGTF: {fmtBs(sum("igtfBs"))}</span>
        </div>
      )}
    </Panel>
  );
}
