import { useState } from "react";
import { AlertTriangle, ArrowDown, ArrowDownUp, ArrowUp, Download, Package } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { downloadCsv, fmtBs, fmtUsd } from "@/lib/money";
import type { InventoryMoveType } from "@/types/pos";
import { Modal, btnGhost, btnPrimary, inputCls } from "../pos/Modal";

const moveTypeLabels: Record<InventoryMoveType, { label: string; color: string }> = {
  compra: { label: "Compra", color: "bg-module-suppliers-light text-module-suppliers" },
  venta: { label: "Venta TPV", color: "bg-module-sales-light text-module-sales" },
  devolucion: { label: "Devolución", color: "bg-module-invoicing-light text-module-invoicing" },
  ajuste: { label: "Ajuste", color: "bg-module-cash-light text-module-cash" },
  recuento: { label: "Recuento", color: "bg-module-reports-light text-module-reports" },
  ecommerce: { label: "Delivery", color: "bg-module-accounting-light text-module-accounting" },
};

export function InventoryModule() {
  const pos = usePos();
  const { products, inventoryMovements, rate } = pos;
  const [tab, setTab] = useState<"movements" | "low-stock" | "stock-sheet">("movements");
  const [adjustOpen, setAdjustOpen] = useState(false);

  const [adjForm, setAdjForm] = useState({
    productId: products[0]?.id ?? "e1",
    moveType: "ajuste" as InventoryMoveType,
    quantity: "10",
    reason: "Producción de lote en cocina Chacao",
  });

  const lowStock = products.filter((p) => p.stockBar < (p.stockMin ?? 25));

  function handleAdjust() {
    const qty = parseInt(adjForm.quantity, 10);
    if (!qty || isNaN(qty)) {
      toast.error("Ingresa una cantidad válida (positiva o negativa)");
      return;
    }
    const prod = products.find((p) => p.id === adjForm.productId);
    pos.adjustInventory({
      productId: adjForm.productId,
      moveType: adjForm.moveType,
      quantity: qty,
      unitCostUsd: prod?.costUsd ?? 0.8,
      reason: adjForm.reason.trim() || "Ajuste manual de inventario",
    });
    toast.success(`Inventario actualizado para ${prod?.name}`);
    setAdjustOpen(false);
  }

  function exportInventoryCsv() {
    const head = ["SKU", "Producto", "Categoria", "Costo USD", "Venta USD", "Venta Bs", "Stock Barra", "Stock Cocina"];
    const rows = products.map((p) => [
      p.sku,
      p.name,
      p.category,
      p.costUsd.toFixed(2),
      p.priceUsd.toFixed(2),
      (p.priceUsd * rate).toFixed(2),
      String(p.stockBar),
      String(p.stockKitchen),
    ]);
    downloadCsv("inventario-dr-empanadas", head, rows);
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Inventario y Kardex</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control de stock en tiempo real, movimientos automáticos por venta y recuentos físicos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportInventoryCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition"
          >
            <Download className="h-4 w-4" />
            Exportar Excel (CSV)
          </button>
          <button
            onClick={() => setAdjustOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-module-inventory px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition"
          >
            <ArrowDownUp className="h-4 w-4" />
            Ajuste manual
          </button>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="rounded-xl border border-module-customers/20 bg-module-customers-light p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-module-customers" />
            <span className="text-xs font-semibold text-module-customers">
              {lowStock.length} producto{lowStock.length > 1 ? "s" : ""} bajo stock mínimo recomendado (25 uds)
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {lowStock.map((p) => (
              <span key={p.id} className="rounded-md bg-card border border-border px-2.5 py-1 text-xs font-medium text-foreground">
                {p.emoji} {p.name}: <b className="text-module-expenses">{p.stockBar}</b>/25
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-border pb-2">
        {[
          { id: "movements", label: `Movimientos Kardex (${inventoryMovements.length})` },
          { id: "low-stock", label: `Stock bajo (${lowStock.length})` },
          { id: "stock-sheet", label: "Existencias y Valorización" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "movements" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Fecha / Hora</th>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-right">Cantidad</th>
                  <th className="px-4 py-3 font-semibold text-right">Coste unit.</th>
                  <th className="px-4 py-3 font-semibold">Motivo / Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inventoryMovements.map((m) => {
                  const info = moveTypeLabels[m.moveType] ?? { label: m.moveType, color: "bg-secondary" };
                  return (
                    <tr key={m.id} className="hover:bg-secondary/30">
                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        {new Date(m.createdAt).toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{m.productName}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">{m.sku}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${info.color}`}>{info.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        <span className={`inline-flex items-center gap-1 ${m.quantity > 0 ? "text-module-inventory" : "text-module-expenses"}`}>
                          {m.quantity > 0 ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">{fmtUsd(m.unitCostUsd)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "low-stock" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          {lowStock.length > 0 ? (
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 font-semibold text-right">Stock actual</th>
                  <th className="px-4 py-3 font-semibold text-right">Stock mín.</th>
                  <th className="px-4 py-3 font-semibold text-right">Faltante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {p.emoji} {p.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-module-expenses">{p.stockBar}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">25</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-module-expenses">{25 - p.stockBar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 text-module-inventory mx-auto mb-3" />
              <h3 className="text-base font-medium text-foreground">Todo en orden</h3>
              <p className="text-xs text-muted-foreground mt-1">No hay productos bajo stock mínimo.</p>
            </div>
          )}
        </div>
      )}

      {tab === "stock-sheet" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold text-right">Stock Barra</th>
                  <th className="px-4 py-3 font-semibold text-right">Stock Cocina</th>
                  <th className="px-4 py-3 font-semibold text-right">Costo Unit.</th>
                  <th className="px-4 py-3 font-semibold text-right">Valor Inventario (USD)</th>
                  <th className="px-4 py-3 font-semibold text-right">Valor Inventario (Bs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {products.map((p) => {
                  const totalUnits = p.stockBar + p.stockKitchen;
                  const valUsd = totalUnits * p.costUsd;
                  return (
                    <tr key={p.id} className="hover:bg-secondary/30">
                      <td className="px-4 py-2.5 text-muted-foreground">{p.sku}</td>
                      <td className="px-4 py-2.5 font-sans font-medium text-foreground">
                        {p.emoji} {p.name}
                      </td>
                      <td className="px-4 py-2.5 text-right">{p.stockBar}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{p.stockKitchen}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{fmtUsd(p.costUsd)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-module-inventory">{fmtUsd(valUsd)}</td>
                      <td className="px-4 py-2.5 text-right text-foreground">{fmtBs(valUsd * rate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adjustOpen && (
        <Modal
          title="Ajuste Manual de Inventario y Kardex"
          onClose={() => setAdjustOpen(false)}
          width="max-w-md"
          footer={
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setAdjustOpen(false)}>
                Cancelar
              </button>
              <button className={btnPrimary} onClick={handleAdjust}>
                Registrar Movimiento
              </button>
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            <label className="block font-semibold text-foreground">
              Producto
              <select
                value={adjForm.productId}
                onChange={(e) => setAdjForm({ ...adjForm, productId: e.target.value })}
                className={`${inputCls} mt-1`}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.emoji} {p.name} (Actual: {p.stockBar} uds)
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block font-semibold text-foreground">
                Tipo de movimiento
                <select
                  value={adjForm.moveType}
                  onChange={(e) => setAdjForm({ ...adjForm, moveType: e.target.value as InventoryMoveType })}
                  className={`${inputCls} mt-1`}
                >
                  <option value="ajuste">Ajuste (+/-)</option>
                  <option value="recuento">Recuento / Producción</option>
                  <option value="compra">Recepción Compra</option>
                  <option value="devolucion">Devolución / Merma</option>
                </select>
              </label>
              <label className="block font-semibold text-foreground">
                Cantidad (+/-)
                <input
                  type="number"
                  value={adjForm.quantity}
                  onChange={(e) => setAdjForm({ ...adjForm, quantity: e.target.value })}
                  className={`${inputCls} mt-1 font-mono font-bold`}
                  placeholder="Ej. 20 o -5"
                />
              </label>
            </div>
            <label className="block font-semibold text-foreground">
              Motivo / Observación
              <input
                value={adjForm.reason}
                onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                className={`${inputCls} mt-1`}
                placeholder="Ej. Producción lote mañana / Merma freidora..."
              />
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}
