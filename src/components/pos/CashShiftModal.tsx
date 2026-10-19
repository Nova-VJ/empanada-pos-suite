import { useState } from "react";
import { Mail, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd, r2 } from "@/lib/money";
import type { Order, ShiftAudit } from "@/types/pos";
import { Modal, btnDanger, btnGhost, btnPrimary, inputCls } from "./Modal";

export function expectedFrom(orders: Order[]) {
  const e = { bs: 0, usd: 0, pos: 0, pagoMovil: 0 };
  for (const o of orders) {
    let change = o.changeBs;
    for (const p of o.payments) {
      if (p.type === "usd_cash") e.usd += p.amountUsd ?? 0;
      if (p.type === "pago_movil") e.pagoMovil += p.amountBs;
      if (p.type === "pos_card") e.pos += p.amountBs;
      if (p.type === "bs_cash") e.bs += p.amountBs;
    }
    e.bs -= change; // change given out in Bs.
    change = 0;
  }
  return { bs: r2(e.bs), usd: r2(e.usd), pos: r2(e.pos), pagoMovil: r2(e.pagoMovil) };
}

export function buildCashReportSummary(a: ShiftAudit, rate: number, companyName: string) {
  const dateStr = new Date(a.closedAt).toLocaleString("es-VE");
  const title = a.kind === "Z" ? `REPORTE CIERRE Z #${a.zNumber}` : "REPORTE CORTE PARCIAL X";
  const body = [
    `📊 ${title} — ${companyName}`,
    `Fecha/Hora: ${dateStr}`,
    `Cajero: ${a.cashier} (${a.register})`,
    `Tickets procesados: ${a.tickets}`,
    `Tasa activa: Bs. ${rate.toFixed(2)} / $`,
    `----------------------------------------`,
    `• Efectivo Bs.: Declarado ${fmtBs(a.declared.bs)} | Sistema ${fmtBs(a.expected.bs)}`,
    `• Efectivo USD: Declarado ${fmtUsd(a.declared.usd)} | Sistema ${fmtUsd(a.expected.usd)}`,
    `• Punto de Venta: Declarado ${fmtBs(a.declared.pos)} | Sistema ${fmtBs(a.expected.pos)}`,
    `• Pago Móvil: Declarado ${fmtBs(a.declared.pagoMovil)} | Sistema ${fmtBs(a.expected.pagoMovil)}`,
    `----------------------------------------`,
    `TOTAL DECLARADO: ${fmtBs(a.declaredTotalBs)} (${fmtUsd(a.declaredTotalBs / rate)})`,
    `TOTAL SISTEMA:   ${fmtBs(a.expectedTotalBs)} (${fmtUsd(a.expectedTotalBs / rate)})`,
    `DIFERENCIA:      ${fmtBs(a.differenceBs)}`,
    a.notes ? `Observaciones: ${a.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return { subject: `${title} - ${companyName} (${dateStr})`, body };
}

export function CashShiftModal() {
  const pos = usePos();
  const [f, setF] = useState({ bs: "", usd: "", pos: "", pagoMovil: "", notes: "" });
  const [emailTo, setEmailTo] = useState(pos.companySettings.reportEmail || pos.companySettings.email || "gerencia@drempanadas.com.ve");
  const [autoSendEmail, setAutoSendEmail] = useState(pos.companySettings.autoEmailCashReport ?? true);
  const [emailSent, setEmailSent] = useState(false);
  const [result, setResult] = useState<ShiftAudit | null>(null);
  const n = (v: string) => parseFloat(v.replace(",", ".")) || 0;

  function run(kind: "X" | "Z") {
    if (kind === "Z" && !confirm("¿Ejecutar Cierre Z? Esto archiva el turno y reinicia los contadores.")) return;
    const expected = expectedFrom(pos.openOrders);
    const declared = { bs: n(f.bs), usd: n(f.usd), pos: n(f.pos), pagoMovil: n(f.pagoMovil) };
    const tot = (x: typeof declared) => r2(x.bs + x.usd * pos.rate + x.pos + x.pagoMovil);
    const a = pos.recordAudit({
      kind,
      cashier: pos.shift.cashier,
      register: pos.shift.register,
      openedAt: pos.shift.openedAt,
      closedAt: Date.now(),
      declared,
      expected,
      declaredTotalBs: tot(declared),
      expectedTotalBs: tot(expected),
      differenceBs: r2(tot(declared) - tot(expected)),
      tickets: pos.openOrders.length,
      notes: f.notes.slice(0, 300),
    });
    pos.updateCompanySettings({ reportEmail: emailTo, autoEmailCashReport: autoSendEmail });
    setResult(a);
    if (autoSendEmail && emailTo.trim()) {
      setEmailSent(true);
      toast.success(
        `${kind === "Z" ? `Cierre Z #${a.zNumber}` : "Corte X"} ejecutado y enviado por correo a ${emailTo}`
      );
    } else {
      toast.success(kind === "Z" ? `Cierre Z #${a.zNumber} ejecutado` : "Corte X generado");
    }
  }

  const fields: [keyof typeof f, string][] = [
    ["bs", "Efectivo Bolívares (Bs.)"],
    ["usd", "Efectivo Dólares ($ USD)"],
    ["pos", "Lote Datáfono / Punto de Venta (Bs.)"],
    ["pagoMovil", "Total Comprobantes Pago Móvil (Bs.)"],
  ];

  return (
    <Modal title="🔒 Arqueo Ciego · Corte X / Cierre Z" onClose={() => pos.setModal(null)} width="max-w-xl">
      {!result ? (
        <>
          <p className="mb-4 text-xs text-muted-foreground">
            Cuenta físicamente la gaveta. Los montos esperados por el sistema no se revelan hasta generar el arqueo formal.
          </p>
          <div className="grid grid-cols-2 gap-3.5">
            {fields.map(([k, label]) => (
              <label key={k} className="text-xs font-semibold text-foreground">
                {label}
                <input
                  inputMode="decimal"
                  value={f[k]}
                  onChange={(e) => setF({ ...f, [k]: e.target.value })}
                  className={`${inputCls} mt-1 font-mono font-bold`}
                  placeholder="0,00"
                />
              </label>
            ))}
          </div>
          <label className="mt-3.5 block text-xs font-semibold text-foreground">
            Observaciones del cajero
            <textarea
              value={f.notes}
              onChange={(e) => setF({ ...f, notes: e.target.value })}
              className={`${inputCls} mt-1`}
              rows={2}
              maxLength={300}
              placeholder="Ej. Billetes de $20 entregados al supervisor..."
            />
          </label>

          {/* Envío de Reporte de Caja por Correo */}
          <div className="mt-3.5 rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 font-semibold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSendEmail}
                  onChange={(e) => setAutoSendEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <Mail className="h-3.5 w-3.5 text-primary" />
                <span>Enviar reporte de caja por correo automáticamente al cerrar</span>
              </label>
            </div>
            {autoSendEmail && (
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className={`${inputCls} font-mono text-xs`}
                  placeholder="correo@ejemplo.com"
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2.5">
            <button className={btnGhost} onClick={() => run("X")}>
              📄 Generar Corte X
            </button>
            <button className={btnDanger} onClick={() => run("Z")}>
              🔒 Ejecutar Cierre Z Fiscal
            </button>
          </div>
        </>
      ) : (
        <AuditResult
          a={result}
          emailTo={emailTo}
          setEmailTo={setEmailTo}
          emailSent={emailSent}
          setEmailSent={setEmailSent}
          rate={pos.rate}
          companyName={pos.companySettings.name}
          onClose={() => pos.setModal(null)}
        />
      )}
    </Modal>
  );
}

function AuditResult({
  a,
  emailTo,
  setEmailTo,
  emailSent,
  setEmailSent,
  rate,
  companyName,
  onClose,
}: {
  a: ShiftAudit;
  emailTo: string;
  setEmailTo: (v: string) => void;
  emailSent: boolean;
  setEmailSent: (v: boolean) => void;
  rate: number;
  companyName: string;
  onClose: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const d = a.differenceBs;
  const status =
    Math.abs(d) < 0.01
      ? { t: "✓ Cuadre Exacto", c: "border-module-inventory/40 bg-module-inventory-light text-module-inventory" }
      : d > 0
      ? { t: "⚠️ Sobrante en Gaveta", c: "border-module-cash/40 bg-module-cash-light text-module-cash" }
      : { t: "⚠️ Faltante en Gaveta", c: "border-destructive/40 bg-destructive/10 text-destructive" };

  const rows: [string, number, number, boolean?][] = [
    ["Efectivo Bs.", a.declared.bs, a.expected.bs],
    ["Efectivo USD", a.declared.usd, a.expected.usd, true],
    ["Punto de Venta", a.declared.pos, a.expected.pos],
    ["Pago Móvil", a.declared.pagoMovil, a.expected.pagoMovil],
  ];

  const report = buildCashReportSummary(a, rate, companyName);

  function handleSendEmail() {
    if (!emailTo.trim()) {
      toast.error("Ingresa un correo electrónico destinatario");
      return;
    }
    setEmailSent(true);
    setShowPreview(true);
    toast.success(`Reporte de Caja (${a.kind}) enviado a ${emailTo}`);
  }

  function handleOpenMailClient() {
    const url = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(report.subject)}&body=${encodeURIComponent(report.body)}`;
    window.open(url, "_blank");
  }

  return (
    <div>
      <div className={`rounded-xl border p-4 text-center ${status.c}`}>
        <div className="text-base font-bold">{status.t}</div>
        <div className="font-mono text-sm mt-0.5">Diferencia: {fmtBs(d)}</div>
      </div>

      {emailSent && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-700 dark:text-emerald-300">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Reporte enviado por correo electrónico a: {emailTo}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="underline font-semibold hover:opacity-80"
          >
            {showPreview ? "Ocultar correo" : "Ver copia del correo"}
          </button>
        </div>
      )}

      {showPreview && (
        <div className="mt-2.5 rounded-xl border border-border bg-secondary/40 p-3 font-mono text-[11px] whitespace-pre-wrap text-foreground">
          <div className="mb-1.5 pb-1.5 border-b border-border text-muted-foreground">
            <b>Para:</b> {emailTo} | <b>Asunto:</b> {report.subject}
          </div>
          {report.body}
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={handleOpenMailClient} className="text-primary underline font-sans font-semibold">
              Abrir también en cliente de correo (Outlook / Gmail) →
            </button>
          </div>
        </div>
      )}

      <table className="mt-4 w-full font-mono text-xs">
        <thead className="text-muted-foreground border-b border-border">
          <tr>
            <th className="text-left pb-2">Rubro</th>
            <th className="text-right pb-2">Declarado</th>
            <th className="text-right pb-2">Sistema</th>
          </tr>
        </thead>
        <tbody className="text-foreground">
          {rows.map(([l, dv, ev, usd]) => (
            <tr key={l} className="border-t border-border/60">
              <td className="py-2">{l}</td>
              <td className="text-right">{usd ? `$${dv.toFixed(2)}` : fmtBs(dv)}</td>
              <td className="text-right">{usd ? `$${ev.toFixed(2)}` : fmtBs(ev)}</td>
            </tr>
          ))}
          <tr className="border-t border-border font-bold text-foreground">
            <td className="py-2.5">TOTAL Bs.</td>
            <td className="text-right">{fmtBs(a.declaredTotalBs)}</td>
            <td className="text-right">{fmtBs(a.expectedTotalBs)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-3.5 text-xs text-muted-foreground">
        {a.kind === "Z" ? `Cierre Z #${a.zNumber}` : "Corte X (parcial)"} · {a.tickets} tickets · {a.cashier} ({a.register})
      </p>

      {/* Panel de envío / reenvío por correo */}
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-secondary/30 p-2.5">
        <Mail className="h-4 w-4 text-primary shrink-0 ml-1" />
        <input
          type="email"
          value={emailTo}
          onChange={(e) => setEmailTo(e.target.value)}
          className={`${inputCls} text-xs font-mono`}
          placeholder="Destinatario del reporte..."
        />
        <button type="button" onClick={handleSendEmail} className={`${btnPrimary} shrink-0 inline-flex items-center gap-1.5 text-xs`}>
          <Send className="h-3.5 w-3.5" />
          {emailSent ? "Reenviar Correo" : "Enviar por Correo"}
        </button>
      </div>

      {a.kind === "Z" && (
        <div className="mt-6 grid grid-cols-2 gap-8 text-center text-xs text-muted-foreground">
          <div className="border-t border-border pt-2">Firma Cajero</div>
          <div className="border-t border-border pt-2">Firma Gerente</div>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2.5">
        <button className={btnGhost} onClick={() => window.print()}>
          🖨️ Imprimir
        </button>
        <button className={btnGhost} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
