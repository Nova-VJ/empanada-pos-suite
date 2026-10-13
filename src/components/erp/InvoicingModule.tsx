import { useState } from "react";
import { Ban, Download, Eye, FileText, Filter, Printer } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { downloadCsv, fmtBs, fmtUsd } from "@/lib/money";
import type { Order } from "@/types/pos";
import { Modal, btnGhost, btnPrimary } from "../pos/Modal";
import { TENDER_LABEL } from "../pos/PaymentModal";

const typeLabels: Record<string, string> = {
  simplificada: "Simplificada (Consumidor Final)",
  completa: "Factura Fiscal Completa (RIF)",
  rectificativa: "Nota de Crédito / Rectificativa",
};

const statusColors: Record<string, string> = {
  borrador: "bg-secondary text-muted-foreground",
  confirmada: "bg-module-invoicing-light text-module-invoicing",
  anulada: "bg-destructive/10 text-destructive",
};

export function InvoicingModule() {
  const pos = usePos();
  const { orders, rate } = pos;
  const [activeTab, setActiveTab] = useState<"invoices" | "seniat-book">("invoices");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = orders.filter((o) => {
    const t = o.invoiceType ?? (o.customer ? "completa" : "simplificada");
    const st = o.status ?? "confirmada";
    if (typeFilter !== "all" && t !== typeFilter) return false;
    if (statusFilter !== "all" && st !== statusFilter) return false;
    return true;
  });

  const validOrders = filtered.filter((o) => o.status !== "anulada");
  const totals = validOrders.reduce(
    (acc, o) => ({
      baseBs: acc.baseBs + o.baseBs,
      ivaBs: acc.ivaBs + o.ivaBs,
      igtfBs: acc.igtfBs + o.igtfBs,
      totalBs: acc.totalBs + o.totalBs,
    }),
    { baseBs: 0, ivaBs: 0, igtfBs: 0, totalBs: 0 }
  );

  function exportSeniatBook() {
    const head = [
      "Fecha",
      "Nro Factura",
      "Nro Control",
      "Tipo",
      "RIF Cliente",
      "Nombre o Razon Social",
      "Total Ventas c/IVA (Bs)",
      "Base Imponible 16% (Bs)",
      "Debito Fiscal IVA 16% (Bs)",
      "IGTF 3% Divisas (Bs)",
      "Ref USD",
      "Reporte Z",
    ];
    const rows = [...orders].reverse().map((o) => [
      new Date(o.createdAt).toLocaleDateString("es-VE"),
      o.invoiceNo,
      o.controlNo,
      o.invoiceType ?? (o.customer ? "Completa" : "Simplificada"),
      o.customer?.rif ?? "V-00000000",
      o.customer?.name ?? "Consumidor Final",
      (o.baseBs + o.ivaBs).toFixed(2),
      o.baseBs.toFixed(2),
      o.ivaBs.toFixed(2),
      o.igtfBs.toFixed(2),
      (o.totalBs / o.rate).toFixed(2),
      String(o.zNumber ?? "Abierto"),
    ]);
    downloadCsv("libro-ventas-seniat-0071", head, rows);
    toast.success("Libro de Ventas SENIAT exportado a CSV");
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Facturación y Libro de Ventas SENIAT</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Facturas fiscales emitidas, notas de crédito y Libro de Ventas Providencia Administrativa SNAT/2011/0071
          </p>
        </div>
        <button
          onClick={exportSeniatBook}
          className="inline-flex items-center gap-2 rounded-xl bg-module-invoicing px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition"
        >
          <Download className="h-4 w-4" />
          Exportar Libro SENIAT (CSV)
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border border-l-4 border-l-module-invoicing bg-card p-4 shadow-xs">
          <p className="text-xs text-muted-foreground">Base Imponible (16%)</p>
          <p className="text-xl font-bold font-mono text-foreground mt-0.5">{fmtBs(totals.baseBs)}</p>
          <p className="text-xs font-mono text-muted-foreground">{fmtUsd(totals.baseBs / rate)} USD</p>
        </div>
        <div className="rounded-xl border border-border border-l-4 border-l-module-invoicing bg-card p-4 shadow-xs">
          <p className="text-xs text-muted-foreground">Débito Fiscal IVA (16%)</p>
          <p className="text-xl font-bold font-mono text-foreground mt-0.5">{fmtBs(totals.ivaBs)}</p>
          <p className="text-xs font-mono text-muted-foreground">{fmtUsd(totals.ivaBs / rate)} USD</p>
        </div>
        <div className="rounded-xl border border-border border-l-4 border-l-module-cash bg-card p-4 shadow-xs">
          <p className="text-xs text-muted-foreground">IGTF Percibido (3% Divisas)</p>
          <p className="text-xl font-bold font-mono text-module-cash mt-0.5">{fmtBs(totals.igtfBs)}</p>
          <p className="text-xs font-mono text-muted-foreground">{fmtUsd(totals.igtfBs / rate)} USD</p>
        </div>
        <div className="rounded-xl border border-border border-l-4 border-l-module-sales bg-card p-4 shadow-xs">
          <p className="text-xs text-muted-foreground">Total Facturado</p>
          <p className="text-xl font-bold font-mono text-foreground mt-0.5">{fmtBs(totals.totalBs)}</p>
          <p className="text-xs font-mono text-module-inventory font-semibold">{fmtUsd(totals.totalBs / rate)} USD</p>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "invoices"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            Facturas Emitidas ({filtered.length})
          </button>
          <button
            onClick={() => setActiveTab("seniat-book")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "seniat-book"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            Libro de Ventas Fiscal SENIAT (Providencia 0071)
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs"
          >
            <option value="all">Todos los tipos</option>
            <option value="simplificada">Simplificada</option>
            <option value="completa">Completa (RIF)</option>
            <option value="rectificativa">Rectificativa / NC</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs"
          >
            <option value="all">Todos los estados</option>
            <option value="confirmada">Confirmada</option>
            <option value="anulada">Anulada</option>
          </select>
        </div>
      </div>

      {activeTab === "invoices" ? (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nº Factura</th>
                    <th className="px-4 py-3 font-semibold">Nº Control</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Cliente / RIF</th>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold text-right">Base</th>
                    <th className="px-4 py-3 font-semibold text-right">IVA 16%</th>
                    <th className="px-4 py-3 font-semibold text-right">IGTF 3%</th>
                    <th className="px-4 py-3 font-semibold text-right">Total</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 w-[110px]" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((inv) => {
                    const t = inv.invoiceType ?? (inv.customer ? "completa" : "simplificada");
                    const st = inv.status ?? "confirmada";
                    return (
                      <tr key={inv.id} className="hover:bg-secondary/30">
                        <td className="px-4 py-3 font-mono font-bold text-foreground">#{inv.invoiceNo}</td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">{inv.controlNo}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium">
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{inv.customer?.name ?? "Consumidor Final"}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">{inv.customer?.rif ?? "V-00000000"}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {new Date(inv.createdAt).toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{fmtBs(inv.baseBs)}</td>
                        <td className="px-4 py-3 text-right font-mono">{fmtBs(inv.ivaBs)}</td>
                        <td className="px-4 py-3 text-right font-mono text-module-cash">{fmtBs(inv.igtfBs)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                          <div>{fmtBs(inv.totalBs)}</div>
                          <div className="text-[10px] text-module-inventory">{fmtUsd(inv.totalBs / inv.rate)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${statusColors[st]}`}>
                            {st.charAt(0).toUpperCase() + st.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setSelectedOrder(inv)}
                              title="Ver detalle"
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                pos.setTicketOrderId(inv.id);
                                pos.setModal("ticket");
                              }}
                              title="Imprimir Ticket Fiscal"
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            {st !== "anulada" && (
                              <button
                                onClick={() => {
                                  if (confirm(`¿Emitir Nota de Crédito / Anular Factura #${inv.invoiceNo}?`)) {
                                    pos.voidOrder(inv.id);
                                    toast.success(`Factura #${inv.invoiceNo} anulada con Nota de Crédito`);
                                  }
                                }}
                                title="Anular / Nota de Crédito"
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-base font-medium text-foreground">Sin facturas</h3>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Nº Factura</th>
                  <th className="px-4 py-3 font-semibold">Nº Control SENIAT</th>
                  <th className="px-4 py-3 font-semibold">RIF / Cédula</th>
                  <th className="px-4 py-3 font-semibold">Razón Social</th>
                  <th className="px-4 py-3 font-semibold text-right">Ventas c/IVA</th>
                  <th className="px-4 py-3 font-semibold text-right">Base Imponible 16%</th>
                  <th className="px-4 py-3 font-semibold text-right">Débito IVA 16%</th>
                  <th className="px-4 py-3 font-semibold text-right">IGTF 3%</th>
                  <th className="px-4 py-3 font-semibold text-right">Nº Reporte Z</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {[...filtered].reverse().map((o) => (
                  <tr key={o.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-2.5 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("es-VE")}</td>
                    <td className="px-4 py-2.5 font-bold text-foreground">{o.invoiceNo}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{o.controlNo}</td>
                    <td className="px-4 py-2.5">{o.customer?.rif ?? "V-00000000"}</td>
                    <td className="px-4 py-2.5 font-sans font-medium text-foreground">{o.customer?.name ?? "Consumidor Final"}</td>
                    <td className="px-4 py-2.5 text-right">{fmtBs(o.baseBs + o.ivaBs)}</td>
                    <td className="px-4 py-2.5 text-right">{fmtBs(o.baseBs)}</td>
                    <td className="px-4 py-2.5 text-right">{fmtBs(o.ivaBs)}</td>
                    <td className="px-4 py-2.5 text-right text-module-cash">{fmtBs(o.igtfBs)}</td>
                    <td className="px-4 py-2.5 text-right">{o.zNumber ? `Z #${o.zNumber}` : "Turno Abierto"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrder && (
        <Modal
          title={`Detalle de Factura Fiscal #${selectedOrder.invoiceNo}`}
          onClose={() => setSelectedOrder(null)}
          width="max-w-lg"
          footer={
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setSelectedOrder(null)}>
                Cerrar
              </button>
              <button
                className={btnPrimary}
                onClick={() => {
                  const id = selectedOrder.id;
                  setSelectedOrder(null);
                  pos.setTicketOrderId(id);
                  pos.setModal("ticket");
                }}
              >
                🖨️ Vista Térmica 80mm / 58mm
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-secondary/40 p-3.5 border border-border">
              <div>
                <span className="text-muted-foreground">Tipo:</span>{" "}
                <b>{typeLabels[selectedOrder.invoiceType ?? (selectedOrder.customer ? "completa" : "simplificada")]}</b>
              </div>
              <div>
                <span className="text-muted-foreground">Nº Control:</span>{" "}
                <span className="font-mono font-bold">{selectedOrder.controlNo}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Cliente:</span>{" "}
                <b>{selectedOrder.customer?.name ?? "Consumidor Final"}</b>
              </div>
              <div>
                <span className="text-muted-foreground">RIF / CI:</span>{" "}
                <span className="font-mono">{selectedOrder.customer?.rif ?? "V-00000000"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Fecha:</span>{" "}
                {new Date(selectedOrder.createdAt).toLocaleString("es-VE")}
              </div>
              <div>
                <span className="text-muted-foreground">Pagos:</span>{" "}
                {selectedOrder.payments.map((p) => TENDER_LABEL[p.type]).join(" + ")}
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <h4 className="font-semibold text-foreground mb-2">Líneas de Factura</h4>
              <div className="space-y-1.5">
                {selectedOrder.lines.map((line, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-border/60 last:border-0">
                    <span>
                      <b>{line.qty}x</b> {line.name}
                    </span>
                    <span className="font-mono">
                      {fmtBs(line.unitUsd * selectedOrder.rate * line.qty)} ({fmtUsd(line.unitUsd * line.qty)})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Imponible (16%)</span>
                <span>{fmtBs(selectedOrder.baseBs)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Débito Fiscal IVA (16%)</span>
                <span>{fmtBs(selectedOrder.ivaBs)}</span>
              </div>
              <div className="flex justify-between text-module-cash">
                <span>IGTF (3% Divisas)</span>
                <span>{fmtBs(selectedOrder.igtfBs)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border">
                <span>TOTAL FACTURADO</span>
                <span>
                  {fmtBs(selectedOrder.totalBs)} ({fmtUsd(selectedOrder.totalBs / selectedOrder.rate)})
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
