import { useMemo, useState } from "react";
import { BookOpen, Calculator, Check, FileSpreadsheet, List, Plus } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";
import { Modal, btnGhost, btnPrimary, inputCls } from "../pos/Modal";

const statusColors: Record<string, string> = {
  borrador: "bg-secondary text-muted-foreground",
  confirmado: "bg-module-inventory-light text-module-inventory",
  bloqueado: "bg-module-accounting-light text-module-accounting",
};

export function AccountingModule() {
  const pos = usePos();
  const { accountingAccounts, journalEntries, rate } = pos;
  const [tab, setTab] = useState<"journal" | "ledger" | "trial" | "accounts">("journal");
  const [ledgerAccount, setLedgerAccount] = useState<string>(accountingAccounts[0]?.code ?? "1101");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [entryDesc, setEntryDesc] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]!);
  const [lines, setLines] = useState<{ accountCode: string; debitBs: number; creditBs: number; description: string }[]>([
    { accountCode: "1101", debitBs: 0, creditBs: 0, description: "" },
    { accountCode: "4101", debitBs: 0, creditBs: 0, description: "" },
  ]);

  const totalDebit = lines.reduce((s, l) => s + l.debitBs, 0);
  const totalCredit = lines.reduce((s, l) => s + l.creditBs, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  function addLine() {
    setLines([...lines, { accountCode: "1101", debitBs: 0, creditBs: 0, description: "" }]);
  }

  function updateLine(idx: number, field: string, value: string | number) {
    const updated = [...lines];
    (updated[idx] as Record<string, string | number>)[field] = value;
    setLines(updated);
  }

  function handleCreateEntry() {
    if (!entryDesc.trim() || !isBalanced) {
      toast.error("El asiento debe tener descripción y estar cuadrado (Debe = Haber)");
      return;
    }
    const valid = lines
      .filter((l) => l.accountCode && (l.debitBs > 0 || l.creditBs > 0))
      .map((l) => ({
        accountCode: l.accountCode,
        accountName: accountingAccounts.find((a) => a.code === l.accountCode)?.name ?? l.accountCode,
        description: l.description || entryDesc,
        debitBs: l.debitBs,
        creditBs: l.creditBs,
      }));
    pos.createJournalEntry(entryDesc.trim(), entryDate, valid);
    toast.success("Asiento contable creado");
    setDialogOpen(false);
    setEntryDesc("");
  }

  // Ledger lines for selected account
  const ledgerLines = useMemo(() => {
    const out: {
      entryNumber: number;
      entryDate: string;
      description: string;
      debitBs: number;
      creditBs: number;
    }[] = [];
    for (const je of [...journalEntries].reverse()) {
      for (const l of je.lines) {
        if (l.accountCode === ledgerAccount) {
          out.push({
            entryNumber: je.entryNumber,
            entryDate: je.entryDate,
            description: l.description || je.description,
            debitBs: l.debitBs,
            creditBs: l.creditBs,
          });
        }
      }
    }
    return out;
  }, [journalEntries, ledgerAccount]);

  // Trial Balance
  const trialBalance = useMemo(() => {
    const map = new Map<string, { code: string; name: string; debit: number; credit: number }>();
    for (const a of accountingAccounts) {
      map.set(a.code, { code: a.code, name: a.name, debit: 0, credit: 0 });
    }
    for (const je of journalEntries) {
      for (const l of je.lines) {
        const cur = map.get(l.accountCode) ?? { code: l.accountCode, name: l.accountName, debit: 0, credit: 0 };
        cur.debit += l.debitBs;
        cur.credit += l.creditBs;
        map.set(l.accountCode, cur);
      }
    }
    return Array.from(map.values())
      .filter((x) => x.debit > 0 || x.credit > 0)
      .map((x) => ({ ...x, saldo: x.debit - x.credit }));
  }, [accountingAccounts, journalEntries]);

  const tbTotalDebit = trialBalance.reduce((s, a) => s + a.debit, 0);
  const tbTotalCredit = trialBalance.reduce((s, a) => s + a.credit, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Contabilidad General (VEN-NIF / SENIAT)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plan contable venezolano, libro diario con asientos automáticos de caja, libro mayor y balance de comprobación
          </p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-module-accounting px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" />
          Nuevo asiento contable
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-2">
        {[
          { id: "journal", label: `Libro Diario (${journalEntries.length})`, icon: BookOpen },
          { id: "ledger", label: "Libro Mayor", icon: List },
          { id: "trial", label: "Balance de Sumas y Saldos", icon: Calculator },
          { id: "accounts", label: `Plan Contable (${accountingAccounts.length})`, icon: FileSpreadsheet },
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

      {tab === "journal" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Nº Asiento</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Descripción / Concepto</th>
                <th className="px-4 py-3 font-semibold text-right">Debe (Bs.)</th>
                <th className="px-4 py-3 font-semibold text-right">Haber (Bs.)</th>
                <th className="px-4 py-3 font-semibold text-right">Equiv. USD</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {journalEntries.map((e) => {
                const d = e.lines.reduce((s, l) => s + l.debitBs, 0);
                const c = e.lines.reduce((s, l) => s + l.creditBs, 0);
                return (
                  <tr key={e.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">#{e.entryNumber}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{e.entryDate}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{e.description}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {e.lines.map((l) => `${l.accountCode} (${l.accountName.slice(0, 22)})`).join(" · ")}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{fmtBs(d)}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{fmtBs(c)}</td>
                    <td className="px-4 py-3 text-right font-mono text-module-inventory">{fmtUsd(d / rate)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${statusColors[e.status]}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {e.status === "borrador" && (
                        <button
                          onClick={() => {
                            pos.confirmJournalEntry(e.id);
                            toast.success(`Asiento #${e.entryNumber} confirmado`);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-module-inventory px-2.5 py-1 text-xs font-semibold text-white"
                        >
                          <Check className="h-3 w-3" />
                          Confirmar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "ledger" && (
        <div className="space-y-4">
          <div className="max-w-md">
            <label className="text-xs font-semibold text-foreground">
              Seleccionar cuenta contable
              <select
                value={ledgerAccount}
                onChange={(e) => setLedgerAccount(e.target.value)}
                className={`${inputCls} mt-1`}
              >
                {accountingAccounts.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="border-b border-border px-5 py-3.5 bg-secondary/30">
              <h3 className="text-sm font-semibold text-foreground">
                Mayor: {ledgerAccount} — {accountingAccounts.find((a) => a.code === ledgerAccount)?.name}
              </h3>
            </div>
            {ledgerLines.length > 0 ? (
              <table className="w-full text-xs">
                <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nº Asiento</th>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Concepto</th>
                    <th className="px-4 py-3 font-semibold text-right">Debe</th>
                    <th className="px-4 py-3 font-semibold text-right">Haber</th>
                    <th className="px-4 py-3 font-semibold text-right">Saldo Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {(() => {
                    let running = 0;
                    return ledgerLines.map((l, i) => {
                      running += l.debitBs - l.creditBs;
                      return (
                        <tr key={i} className="hover:bg-secondary/30">
                          <td className="px-4 py-3 font-bold">#{l.entryNumber}</td>
                          <td className="px-4 py-3 text-muted-foreground">{l.entryDate}</td>
                          <td className="px-4 py-3 font-sans text-foreground">{l.description}</td>
                          <td className="px-4 py-3 text-right">{l.debitBs > 0 ? fmtBs(l.debitBs) : "—"}</td>
                          <td className="px-4 py-3 text-right">{l.creditBs > 0 ? fmtBs(l.creditBs) : "—"}</td>
                          <td className={`px-4 py-3 text-right font-bold ${running < 0 ? "text-module-accounting" : "text-foreground"}`}>
                            {fmtBs(running)}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            ) : (
              <div className="p-10 text-center text-xs text-muted-foreground">Sin movimientos en esta cuenta</div>
            )}
          </div>
        </div>
      )}

      {tab === "trial" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Cuenta Contable</th>
                <th className="px-4 py-3 font-semibold text-right">Total Debe (Bs.)</th>
                <th className="px-4 py-3 font-semibold text-right">Total Haber (Bs.)</th>
                <th className="px-4 py-3 font-semibold text-right">Saldo (Bs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {trialBalance.map((a) => (
                <tr key={a.code} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 font-bold text-foreground">{a.code}</td>
                  <td className="px-4 py-3 font-sans font-medium text-foreground">{a.name}</td>
                  <td className="px-4 py-3 text-right">{fmtBs(a.debit)}</td>
                  <td className="px-4 py-3 text-right">{fmtBs(a.credit)}</td>
                  <td className="px-4 py-3 text-right font-bold">{fmtBs(a.saldo)}</td>
                </tr>
              ))}
              <tr className="bg-secondary/60 font-bold text-foreground">
                <td colSpan={2} className="px-4 py-3 font-sans">
                  SUMAS IGUALES / TOTALES
                </td>
                <td className="px-4 py-3 text-right">{fmtBs(tbTotalDebit)}</td>
                <td className="px-4 py-3 text-right">{fmtBs(tbTotalCredit)}</td>
                <td className="px-4 py-3 text-right text-module-inventory">{fmtBs(tbTotalDebit - tbTotalCredit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === "accounts" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Nombre de Cuenta</th>
                <th className="px-4 py-3 font-semibold">Grupo</th>
                <th className="px-4 py-3 font-semibold">Naturaleza</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accountingAccounts.map((a) => (
                <tr key={a.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono font-bold text-foreground">{a.code}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{a.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium">
                      {a.accountType}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{a.nature}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-module-accounting-light px-2 py-0.5 text-[11px] font-semibold text-module-accounting">
                      Activa
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialogOpen && (
        <Modal
          title="Nuevo Asiento Contable Manual"
          onClose={() => setDialogOpen(false)}
          width="max-w-2xl"
          footer={
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setDialogOpen(false)}>
                Cancelar
              </button>
              <button className={btnPrimary} disabled={!isBalanced || !entryDesc.trim()} onClick={handleCreateEntry}>
                Guardar Asiento
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <label className="font-semibold text-foreground">
                Fecha
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className={`${inputCls} mt-1`}
                />
              </label>
              <label className="font-semibold text-foreground">
                Concepto General *
                <input
                  value={entryDesc}
                  onChange={(e) => setEntryDesc(e.target.value)}
                  className={`${inputCls} mt-1`}
                  placeholder="Ej. Ajuste de inventario / Provisión SENIAT"
                />
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">Partidas del Asiento (Debe / Haber en Bs.)</span>
                <button onClick={addLine} className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-semibold">
                  + Añadir línea
                </button>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/50 text-left text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Cuenta</th>
                      <th className="px-3 py-2">Detalle</th>
                      <th className="px-3 py-2 text-right">Debe (Bs.)</th>
                      <th className="px-3 py-2 text-right">Haber (Bs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lines.map((l, i) => (
                      <tr key={i}>
                        <td className="p-2">
                          <select
                            value={l.accountCode}
                            onChange={(e) => updateLine(i, "accountCode", e.target.value)}
                            className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs"
                          >
                            {accountingAccounts.map((a) => (
                              <option key={a.code} value={a.code}>
                                {a.code} — {a.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            value={l.description}
                            onChange={(e) => updateLine(i, "description", e.target.value)}
                            placeholder="Concepto línea"
                            className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            value={l.debitBs || ""}
                            onChange={(e) => updateLine(i, "debitBs", parseFloat(e.target.value) || 0)}
                            className="w-28 rounded border border-input bg-background px-2 py-1.5 text-right font-mono text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            value={l.creditBs || ""}
                            onChange={(e) => updateLine(i, "creditBs", parseFloat(e.target.value) || 0)}
                            className="w-28 rounded border border-input bg-background px-2 py-1.5 text-right font-mono text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-secondary/50 font-mono font-bold">
                      <td colSpan={2} className="px-3 py-2 text-right font-sans">
                        Totales:
                      </td>
                      <td className="px-3 py-2 text-right">{fmtBs(totalDebit)}</td>
                      <td className="px-3 py-2 text-right">{fmtBs(totalCredit)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {!isBalanced && totalDebit > 0 && (
                <p className="text-xs text-destructive mt-2 font-medium">
                  ⚠ El asiento está descuadrado por {fmtBs(Math.abs(totalDebit - totalCredit))}
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
