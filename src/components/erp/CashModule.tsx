import { useState } from "react";
import { Banknote, Building2, CheckCircle2, Lock, Plus } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";
import type { CashMoveType } from "@/types/pos";
import { Modal, btnGhost, btnPrimary, inputCls } from "../pos/Modal";
import { expectedFrom } from "../pos/CashShiftModal";

const moveTypeLabels: Record<CashMoveType, { label: string; color: string }> = {
  apertura: { label: "Apertura", color: "bg-module-sales-light text-module-sales" },
  venta: { label: "Venta TPV", color: "bg-module-inventory-light text-module-inventory" },
  retiro: { label: "Retiro", color: "bg-module-cash-light text-module-cash" },
  gasto: { label: "Gasto Caja", color: "bg-module-expenses-light text-module-expenses" },
  cierre: { label: "Cierre Z", color: "bg-secondary text-muted-foreground" },
  ajuste: { label: "Ingreso / Ajuste", color: "bg-module-products-light text-module-products" },
};

export function CashModule() {
  const pos = usePos();
  const { shift, cashMovements, shiftHistory, bankAccounts, bankMovements, openOrders, rate } = pos;
  const [tab, setTab] = useState<"cash" | "audits" | "banks">("cash");
  const [selectedBank, setSelectedBank] = useState<string>(bankAccounts[0]?.id ?? "bank-banesco");
  const [moveModal, setMoveModal] = useState(false);

  const [moveForm, setMoveForm] = useState({
    moveType: "retiro" as CashMoveType,
    amountBs: "",
    description: "",
  });

  const expected = expectedFrom(openOrders);
  const expectedTotalBs = shift.openingBs + expected.bs + expected.usd * rate + expected.pos + expected.pagoMovil;

  function handleSaveMovement() {
    const amt = parseFloat(moveForm.amountBs) || 0;
    if (amt <= 0) {
      toast.error("Ingresa un importe válido");
      return;
    }
    pos.addCashMovement({
      moveType: moveForm.moveType,
      amountBs: amt,
      description: moveForm.description.trim() || "Movimiento manual de caja",
    });
    toast.success("Movimiento de caja registrado");
    setMoveModal(false);
    setMoveForm({ moveType: "retiro", amountBs: "", description: "" });
  }

  const activeBankMoves = bankMovements.filter((bm) => bm.bankId === selectedBank);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Caja, Bancos y Arqueos X-Z</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control de gaveta multimoneda (Bs. / USD), movimientos de turno, Cortes Z y conciliación bancaria nacional
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMoveModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition"
          >
            <Plus className="h-4 w-4" />
            Registrar movimiento
          </button>
          <button
            onClick={() => pos.setModal("shift")}
            className="inline-flex items-center gap-2 rounded-xl bg-module-cash px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition"
          >
            <Lock className="h-4 w-4" />
            Arqueo Ciego · Corte X / Z
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-border pb-2">
        {[
          { id: "cash", label: "Sesión de Caja Actual", icon: Banknote },
          { id: "audits", label: `Historial Cortes X / Z (${shiftHistory.length})`, icon: Lock },
          { id: "banks", label: `Bancos y Conciliación (${bankAccounts.length})`, icon: Building2 },
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

      {tab === "cash" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border border-l-4 border-l-module-cash bg-card p-4 shadow-xs">
              <p className="text-xs text-muted-foreground">Fondo de Apertura</p>
              <p className="text-xl font-bold font-mono text-foreground mt-0.5">{fmtBs(shift.openingBs)}</p>
              <p className="text-xs font-mono text-muted-foreground">+ ${shift.openingUsd.toFixed(2)} USD en sencillo</p>
            </div>
            <div className="rounded-xl border border-border border-l-4 border-l-module-inventory bg-card p-4 shadow-xs">
              <p className="text-xs text-muted-foreground">Efectivo USD en Gaveta</p>
              <p className="text-xl font-bold font-mono text-module-inventory mt-0.5">{fmtUsd(shift.openingUsd + expected.usd)}</p>
              <p className="text-xs font-mono text-muted-foreground">Ventas turno: {fmtUsd(expected.usd)}</p>
            </div>
            <div className="rounded-xl border border-border border-l-4 border-l-module-sales bg-card p-4 shadow-xs">
              <p className="text-xs text-muted-foreground">Pago Móvil + Punto de Venta</p>
              <p className="text-xl font-bold font-mono text-foreground mt-0.5">{fmtBs(expected.pagoMovil + expected.pos)}</p>
              <p className="text-xs font-mono text-muted-foreground">
                PM: {fmtBs(expected.pagoMovil)} · POS: {fmtBs(expected.pos)}
              </p>
            </div>
            <div className="rounded-xl border border-border border-l-4 border-l-primary bg-card p-4 shadow-xs">
              <p className="text-xs text-muted-foreground">Total Consolidado Turno</p>
              <p className="text-xl font-bold font-mono text-foreground mt-0.5">{fmtBs(expectedTotalBs)}</p>
              <p className="text-xs font-mono text-primary font-semibold">{fmtUsd(expectedTotalBs / rate)} USD</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="border-b border-border px-5 py-3.5 bg-secondary/30">
              <h3 className="text-sm font-semibold text-foreground">Movimientos de la sesión actual</h3>
            </div>
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Hora</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Descripción</th>
                  <th className="px-4 py-3 font-semibold text-right">Importe (Bs.)</th>
                  <th className="px-4 py-3 font-semibold text-right">Equiv. USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cashMovements.map((m) => {
                  const info = moveTypeLabels[m.moveType] ?? { label: m.moveType, color: "bg-secondary" };
                  const neg = m.moveType === "retiro" || m.moveType === "gasto";
                  return (
                    <tr key={m.id} className="hover:bg-secondary/30">
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {new Date(m.createdAt).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${info.color}`}>{info.label}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{m.description}</td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${neg ? "text-destructive" : "text-foreground"}`}>
                        {neg ? "-" : "+"}
                        {fmtBs(m.amountBs)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {fmtUsd(m.amountUsd ?? m.amountBs / rate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "audits" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          {shiftHistory.length > 0 ? (
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Nº Z</th>
                  <th className="px-4 py-3 font-semibold">Cajero / Caja</th>
                  <th className="px-4 py-3 font-semibold">Cierre</th>
                  <th className="px-4 py-3 font-semibold text-right">Tickets</th>
                  <th className="px-4 py-3 font-semibold text-right">Declarado</th>
                  <th className="px-4 py-3 font-semibold text-right">Esperado</th>
                  <th className="px-4 py-3 font-semibold text-right">Diferencia</th>
                  <th className="px-4 py-3 font-semibold">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {shiftHistory.map((s) => (
                  <tr key={s.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 font-sans text-[11px] font-bold ${
                          s.kind === "Z" ? "bg-destructive/10 text-destructive" : "bg-module-sales-light text-module-sales"
                        }`}
                      >
                        Corte {s.kind}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">{s.zNumber ? `#${s.zNumber}` : "—"}</td>
                    <td className="px-4 py-3 font-sans">
                      {s.cashier} ({s.register})
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(s.closedAt).toLocaleString("es-VE")}</td>
                    <td className="px-4 py-3 text-right">{s.tickets}</td>
                    <td className="px-4 py-3 text-right">{fmtBs(s.declaredTotalBs)}</td>
                    <td className="px-4 py-3 text-right">{fmtBs(s.expectedTotalBs)}</td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        Math.abs(s.differenceBs) < 0.01
                          ? "text-module-inventory"
                          : s.differenceBs > 0
                          ? "text-module-cash"
                          : "text-destructive"
                      }`}
                    >
                      {fmtBs(s.differenceBs)}
                    </td>
                    <td className="px-4 py-3 font-sans text-muted-foreground">{s.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <Lock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-base font-medium text-foreground">Sin cortes X/Z en el historial</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Haz clic en “Arqueo Ciego · Corte X / Z” para auditar o cerrar el turno actual.
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "banks" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {bankAccounts.map((ba) => {
              const active = selectedBank === ba.id;
              return (
                <button
                  key={ba.id}
                  onClick={() => setSelectedBank(ba.id)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    active ? "border-primary bg-primary/5 shadow-xs" : "border-border bg-card hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Building2 className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-bold">{ba.currency}</span>
                  </div>
                  <div className="mt-2 font-semibold text-xs text-foreground truncate">{ba.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{ba.accountNumber}</div>
                  <div className="mt-2 font-mono text-base font-bold text-foreground">
                    {ba.currency === "USD" ? fmtUsd(ba.balance) : fmtBs(ba.balance)}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="border-b border-border px-5 py-3.5 bg-secondary/30 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Extracto y Conciliación — {bankAccounts.find((b) => b.id === selectedBank)?.name}
              </h3>
            </div>
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Concepto / Lote</th>
                  <th className="px-4 py-3 font-semibold text-right">Importe</th>
                  <th className="px-4 py-3 font-semibold">Conciliado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeBankMoves.map((bm) => (
                  <tr key={bm.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {new Date(bm.createdAt).toLocaleDateString("es-VE")}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{bm.description}</td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-bold ${
                        bm.amount < 0 ? "text-destructive" : "text-module-inventory"
                      }`}
                    >
                      {bm.currency === "USD" ? fmtUsd(bm.amount) : fmtBs(bm.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          bm.reconciled
                            ? "bg-module-inventory-light text-module-inventory"
                            : "bg-module-cash-light text-module-cash"
                        }`}
                      >
                        {bm.reconciled ? "Conciliado ✓" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          pos.toggleBankReconciled(bm.id);
                          toast.success("Estado de conciliación actualizado");
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground transition"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {bm.reconciled ? "Desmarcar" : "Conciliar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {moveModal && (
        <Modal
          title="Registrar Movimiento de Caja"
          onClose={() => setMoveModal(false)}
          width="max-w-md"
          footer={
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setMoveModal(false)}>
                Cancelar
              </button>
              <button className={btnPrimary} onClick={handleSaveMovement}>
                Guardar Movimiento
              </button>
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            <label className="block font-semibold text-foreground">
              Tipo de movimiento
              <select
                value={moveForm.moveType}
                onChange={(e) => setMoveForm({ ...moveForm, moveType: e.target.value as CashMoveType })}
                className={`${inputCls} mt-1`}
              >
                <option value="retiro">Retiro de Efectivo / Custodia</option>
                <option value="gasto">Gasto Menor de Caja Chica</option>
                <option value="ajuste">Ingreso / Sencillo (+)</option>
              </select>
            </label>
            <label className="block font-semibold text-foreground">
              Importe en Bolívares (Bs.)
              <input
                type="number"
                step="0.01"
                value={moveForm.amountBs}
                onChange={(e) => setMoveForm({ ...moveForm, amountBs: e.target.value })}
                className={`${inputCls} mt-1 font-mono font-bold`}
                placeholder="0.00"
              />
            </label>
            <label className="block font-semibold text-foreground">
              Descripción / Concepto
              <input
                value={moveForm.description}
                onChange={(e) => setMoveForm({ ...moveForm, description: e.target.value })}
                className={`${inputCls} mt-1`}
                placeholder="Ej. Compra de hielo / Retiro supervisor..."
              />
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}
