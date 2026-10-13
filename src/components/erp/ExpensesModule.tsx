import { useState } from "react";
import { Plus, Receipt, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";
import { Modal, btnGhost, btnPrimary, inputCls } from "../pos/Modal";

const EXPENSE_CATEGORIES = [
  "Suministros",
  "Alquiler",
  "Servicios profesionales",
  "Mantenimiento",
  "Transporte",
  "Nómina y Comisiones",
  "Marketing",
  "Impuestos Municipales",
  "Otros",
];

export function ExpensesModule() {
  const pos = usePos();
  const { expenses, suppliers, rate } = pos;
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    description: "",
    category: "Suministros",
    amountUsd: "",
    taxRate: "16",
    paymentMethod: "transferencia",
    supplierId: "",
    expenseDate: new Date().toISOString().split("T")[0]!,
  });

  const filtered = expenses.filter(
    (e) =>
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
  );

  const totals = filtered.reduce(
    (acc, e) => ({
      baseUsd: acc.baseUsd + e.amountUsd,
      taxUsd: acc.taxUsd + e.taxAmountUsd,
      totalUsd: acc.totalUsd + e.totalUsd,
    }),
    { baseUsd: 0, taxUsd: 0, totalUsd: 0 }
  );

  function handleCreate() {
    const amountUsd = parseFloat(form.amountUsd) || 0;
    if (!form.description.trim() || amountUsd <= 0) {
      toast.error("Ingresa descripción e importe válido");
      return;
    }
    const sup = suppliers.find((s) => s.id === form.supplierId);
    pos.createExpense({
      description: form.description.trim(),
      category: form.category,
      amountUsd,
      taxRate: parseFloat(form.taxRate) || 0,
      paymentMethod: form.paymentMethod,
      supplierId: sup?.id,
      supplierName: sup?.name,
      expenseDate: form.expenseDate,
    });
    toast.success("Gasto registrado con éxito");
    setDialogOpen(false);
    setForm({
      description: "",
      category: "Suministros",
      amountUsd: "",
      taxRate: "16",
      paymentMethod: "transferencia",
      supplierId: "",
      expenseDate: new Date().toISOString().split("T")[0]!,
    });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Gastos y Compras Operativas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro de gastos con Crédito Fiscal IVA soportado (16% / 8% / Exento) y categorías contables
          </p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-module-expenses px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" />
          Nuevo gasto
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border border-l-4 border-l-module-expenses bg-card p-4 shadow-xs">
          <p className="text-xs text-muted-foreground">Base Imponible Gastos</p>
          <p className="text-xl font-bold font-mono text-foreground mt-0.5">{fmtUsd(totals.baseUsd)}</p>
          <p className="text-xs font-mono text-muted-foreground">{fmtBs(totals.baseUsd * rate)}</p>
        </div>
        <div className="rounded-xl border border-border border-l-4 border-l-module-expenses bg-card p-4 shadow-xs">
          <p className="text-xs text-muted-foreground">Crédito Fiscal IVA Soportado</p>
          <p className="text-xl font-bold font-mono text-foreground mt-0.5">{fmtUsd(totals.taxUsd)}</p>
          <p className="text-xs font-mono text-muted-foreground">{fmtBs(totals.taxUsd * rate)}</p>
        </div>
        <div className="rounded-xl border border-border border-l-4 border-l-module-expenses bg-card p-4 shadow-xs">
          <p className="text-xs text-muted-foreground">Total Gastos Registrados</p>
          <p className="text-xl font-bold font-mono text-module-expenses mt-0.5">{fmtUsd(totals.totalUsd)}</p>
          <p className="text-xs font-mono text-muted-foreground">{fmtBs(totals.totalUsd * rate)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Buscar gasto o categoría..."
          className={`${inputCls} pl-9`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Descripción</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 font-semibold">Proveedor</th>
                  <th className="px-4 py-3 font-semibold text-right">Base (USD)</th>
                  <th className="px-4 py-3 font-semibold text-right">IVA ({filtered[0]?.taxRate ?? 16}%)</th>
                  <th className="px-4 py-3 font-semibold text-right">Total (USD / Bs.)</th>
                  <th className="px-4 py-3 font-semibold">Método Pago</th>
                  <th className="px-4 py-3 w-[60px]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono text-muted-foreground">{e.expenseDate}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{e.description}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{e.supplierName ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmtUsd(e.amountUsd)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmtUsd(e.taxAmountUsd)}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      <div className="font-bold text-foreground">{fmtUsd(e.totalUsd)}</div>
                      <div className="text-[10px] text-muted-foreground">{fmtBs(e.totalUsd * rate)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] capitalize">{e.paymentMethod}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          pos.deleteExpense(e.id);
                          toast.success("Gasto eliminado");
                        }}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-medium text-foreground">Sin gastos registrados</h3>
          </div>
        )}
      </div>

      {dialogOpen && (
        <Modal
          title="Registrar Nuevo Gasto Operativo"
          onClose={() => setDialogOpen(false)}
          width="max-w-lg"
          footer={
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setDialogOpen(false)}>
                Cancelar
              </button>
              <button className={btnPrimary} onClick={handleCreate}>
                Guardar Gasto
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <label className="col-span-2 font-semibold text-foreground">
              Descripción del gasto *
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={`${inputCls} mt-1`}
                placeholder="Ej. Compra de empaques térmicos / Mantenimiento campana..."
              />
            </label>
            <label className="font-semibold text-foreground">
              Categoría
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={`${inputCls} mt-1`}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="font-semibold text-foreground">
              Fecha
              <input
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Base Imponible ($ USD)
              <input
                type="number"
                step="0.01"
                value={form.amountUsd}
                onChange={(e) => setForm({ ...form, amountUsd: e.target.value })}
                className={`${inputCls} mt-1 font-mono font-bold`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Alícuota IVA SENIAT (%)
              <select
                value={form.taxRate}
                onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                className={`${inputCls} mt-1`}
              >
                <option value="16">General SENIAT (16%)</option>
                <option value="8">Reducido (8%)</option>
                <option value="0">Exento (0%)</option>
              </select>
            </label>
            <label className="font-semibold text-foreground">
              Método de pago
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className={`${inputCls} mt-1`}
              >
                <option value="transferencia">Transferencia Bancaria Bs.</option>
                <option value="pago_movil">Pago Móvil</option>
                <option value="efectivo_usd">Efectivo Divisas ($)</option>
                <option value="efectivo_bs">Efectivo Bolívares</option>
              </select>
            </label>
            <label className="font-semibold text-foreground">
              Proveedor (Opcional)
              <select
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                className={`${inputCls} mt-1`}
              >
                <option value="">Ninguno</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}
