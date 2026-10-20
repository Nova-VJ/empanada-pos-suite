import { useState } from "react";
import { Mail, CheckCircle2, Send, Share2, Copy, Printer, Sun, Lock, DollarSign, AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd, r2 } from "@/lib/money";
import type { Order, ShiftAudit } from "@/types/pos";
import { Modal, btnDanger, btnGhost, btnPrimary, inputCls } from "./Modal";
import { openWhatsApp, buildCierreZWhatsApp } from "@/lib/whatsapp";

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

export function buildCashReportSummary(a: ShiftAudit, rate: number, companySettings: { name: string; rif: string; address?: string }) {
  const dateStr = new Date(a.closedAt).toLocaleDateString("es-VE");
  const timeStr = new Date(a.closedAt).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
  const title = a.kind === "Z" ? `INFORME EJECUTIVO DE CIERRE FISCAL Z #${a.zNumber}` : "INFORME DE CORTE PARCIAL X";

  const diffText =
    Math.abs(a.differenceBs) < 0.01
      ? "CUADRE EXACTO (Bs. 0,00)"
      : a.differenceBs > 0
      ? `SOBRANTE EN GAVETA: +${fmtBs(a.differenceBs)}`
      : `FALTANTE EN GAVETA: -${fmtBs(Math.abs(a.differenceBs))}`;

  const body = `================================================
🏢 ${companySettings.name}
RIF: ${companySettings.rif}
📍 Ubicación: ${companySettings.address || "San Jacinto, Maracay, Edo. Aragua"}
================================================
📊 ${title}
📅 Fecha y Hora de Cierre: ${dateStr} - ${timeStr}
👤 Responsable de Caja: ${a.cashier} (${a.register})
🧾 Total de Tickets Procesados: ${a.tickets}
💵 Tasa Oficial BCV Aplicada: Bs. ${rate.toFixed(2)} / USD
================================================
DESGLOSE DE ARQUEO FÍSICO EN GAVETA:
------------------------------------------------
1. Efectivo Bolívares (Bs.):
   • Declarado en Físico: ${fmtBs(a.declared.bs)}
   • Esperado por Sistema: ${fmtBs(a.expected.bs)}

2. Efectivo Dólares ($ USD):
   • Declarado en Físico: ${fmtUsd(a.declared.usd)}
   • Esperado por Sistema: ${fmtUsd(a.expected.usd)}

3. Punto de Venta / Datáfono:
   • Lote Declarado:       ${fmtBs(a.declared.pos)}
   • Esperado por Sistema: ${fmtBs(a.expected.pos)}

4. Pagos Móviles:
   • Comprobantes:         ${fmtBs(a.declared.pagoMovil)}
   • Esperado por Sistema: ${fmtBs(a.expected.pagoMovil)}
------------------------------------------------
TOTAL DECLARADO:  ${fmtBs(a.declaredTotalBs)} (${fmtUsd(a.declaredTotalBs / rate)})
TOTAL SISTEMA:    ${fmtBs(a.expectedTotalBs)} (${fmtUsd(a.expectedTotalBs / rate)})
ESTADO DE AUDITORÍA: ${diffText}
================================================
${a.notes ? `Observaciones del Cajero: ${a.notes}\n================================================\n` : ""}
Generado automáticamente por NovaStock POS & ERP · Dr. Empanadas C.A.`;

  return { subject: `${title} - ${companySettings.name} (${dateStr})`, body };
}

export function CashShiftModal() {
  const pos = usePos();
  const { shift, companySettings, openOrders, rate } = pos;

  // Apertura state
  const [openingBs, setOpeningBs] = useState<string>("0");
  const [openingUsd, setOpeningUsd] = useState<string>("0");
  const [openingCashier, setOpeningCashier] = useState<string>(shift.cashier || "Cajero Principal");

  // Cierre state
  const [f, setF] = useState({ bs: "", usd: "", pos: "", pagoMovil: "", notes: "" });
  const [emailTo, setEmailTo] = useState(companySettings.reportEmail || companySettings.email || "gerencia@drempanadas.com.ve");
  const [managerPhone, setManagerPhone] = useState(companySettings.ownerPhone || companySettings.phone || "0412-1234567");
  const [result, setResult] = useState<ShiftAudit | null>(null);

  const n = (v: string) => parseFloat(v.replace(",", ".")) || 0;

  // Manejar Apertura de Caja
  function handleOpenCash() {
    const bs = n(openingBs);
    const usd = n(openingUsd);

    if (bs < 0 || usd < 0) {
      toast.error("El monto inicial no puede ser negativo");
      return;
    }

    pos.openCashSession(bs, usd);
    toast.success(`☀️ ¡Caja Abierta con éxito! Fondo Inicial: ${fmtBs(bs)} / ${fmtUsd(usd)}. Comenzando desde 0.`);
    pos.setModal(null);
  }

  // Manejar Cierre / Arqueo
  function run(kind: "X" | "Z") {
    if (kind === "Z" && !confirm("¿Ejecutar Cierre Z Diario? Esto cerrará la caja del día, archivará las ventas y dejará la caja lista para abrir una nueva jornada desde 0.")) {
      return;
    }

    const expected = expectedFrom(openOrders);
    const declared = { bs: n(f.bs), usd: n(f.usd), pos: n(f.pos), pagoMovil: n(f.pagoMovil) };
    const tot = (x: typeof declared) => r2(x.bs + x.usd * rate + x.pos + x.pagoMovil);

    const a = pos.recordAudit({
      kind,
      cashier: shift.cashier,
      register: shift.register,
      openedAt: shift.openedAt,
      closedAt: Date.now(),
      declared,
      expected,
      declaredTotalBs: tot(declared),
      expectedTotalBs: tot(expected),
      differenceBs: r2(tot(declared) - tot(expected)),
      tickets: openOrders.length,
      notes: f.notes.slice(0, 300),
    });

    pos.updateCompanySettings({ reportEmail: emailTo, ownerPhone: managerPhone });
    setResult(a);
    toast.success(kind === "Z" ? `🔒 Cierre Z Fiscal #${a.zNumber} ejecutado. Caja cerrada con éxito.` : "📄 Corte X generado con éxito.");
  }

  // Si la caja está cerrada y no hay un resultado de auditoría en pantalla, mostrar la Apertura de Caja
  if (!shift.isOpen && !result) {
    return (
      <Modal title="☀️ Apertura de Caja Diaria · Iniciar Turno" onClose={() => pos.setModal(null)} width="max-w-md">
        <div className="space-y-4 text-xs">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center text-2xl mb-2">
              ☀️
            </div>
            <h3 className="text-sm font-bold text-foreground">
              ¿Cuánto hay en la caja en bolívares para abrir la caja con lo que hay?
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">
              Ingresa el fondo de cambio (sencillo en efectivo) con el que inicia operaciones la gaveta hoy. Todas las ventas comenzarán desde 0.
            </p>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              🇻🇪 Fondo Inicial en Bolívares (Bs.):
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">Bs.</span>
              <input
                inputMode="decimal"
                autoFocus
                value={openingBs}
                onChange={(e) => setOpeningBs(e.target.value)}
                className={`${inputCls} pl-10 font-mono font-bold text-base text-foreground`}
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              💵 Fondo Inicial en Dólares ($ USD) (Opcional):
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
              <input
                inputMode="decimal"
                value={openingUsd}
                onChange={(e) => setOpeningUsd(e.target.value)}
                className={`${inputCls} pl-8 font-mono font-bold text-sm text-foreground`}
                placeholder="0.00"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Billetes de $1, $5 o $10 para dar vuelto en divisas.
            </p>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              👤 Cajero / Responsable:
            </label>
            <input
              value={openingCashier}
              onChange={(e) => setOpeningCashier(e.target.value)}
              className={inputCls}
              placeholder="Nombre del cajero"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={() => pos.setModal(null)} className={btnGhost}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleOpenCash}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition active:scale-95 cursor-pointer"
            >
              <Sun className="h-4 w-4" />
              <span>Abrir Caja y Comenzar de 0</span>
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  const fields: [keyof typeof f, string][] = [
    ["bs", "Efectivo Bolívares (Bs.)"],
    ["usd", "Efectivo Dólares ($ USD)"],
    ["pos", "Lote Datáfono / Punto de Venta (Bs.)"],
    ["pagoMovil", "Total Comprobantes Pago Móvil (Bs.)"],
  ];

  return (
    <Modal
      title={result ? `📊 Resultado de ${result.kind === "Z" ? `Cierre Z #${result.zNumber}` : "Corte Parcial X"}` : "🔒 Arqueo Ciego · Corte X / Cierre Z Diario"}
      onClose={() => pos.setModal(null)}
      width="max-w-xl"
    >
      {!result ? (
        <>
          <div className="rounded-xl border border-border bg-secondary/30 p-3 mb-4 text-xs">
            <div className="flex items-center justify-between font-semibold text-foreground">
              <span>🟢 Turno Activo · Cajero: {shift.cashier}</span>
              <span className="font-mono text-primary font-bold">{openOrders.length} tickets en turno</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Fondo inicial: {fmtBs(shift.openingBs)} / {fmtUsd(shift.openingUsd)} · Cuenta físicamente el efectivo y recibos de la gaveta.
            </div>
          </div>

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
              placeholder="Ej. Billetes de $20 entregados a gerencia, propinas separadas..."
            />
          </label>

          <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-border pt-4">
            <button className={btnGhost} onClick={() => run("X")}>
              📄 Generar Corte X Parcial
            </button>
            <button className={btnDanger} onClick={() => run("Z")}>
              🔒 Cerrar Todo el Día · Cierre Z Fiscal
            </button>
          </div>
        </>
      ) : (
        <AuditResult
          a={result}
          emailTo={emailTo}
          setEmailTo={setEmailTo}
          managerPhone={managerPhone}
          setManagerPhone={setManagerPhone}
          rate={rate}
          companySettings={companySettings}
          onOpenNewCash={() => {
            setResult(null);
            setOpeningBs("0");
            setOpeningUsd("0");
          }}
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
  managerPhone,
  setManagerPhone,
  rate,
  companySettings,
  onOpenNewCash,
  onClose,
}: {
  a: ShiftAudit;
  emailTo: string;
  setEmailTo: (v: string) => void;
  managerPhone: string;
  setManagerPhone: (v: string) => void;
  rate: number;
  companySettings: { name: string; rif: string; address?: string };
  onOpenNewCash: () => void;
  onClose: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const d = a.differenceBs;
  const status =
    Math.abs(d) < 0.01
      ? { t: "✓ Cuadre Exacto", c: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" }
      : d > 0
      ? { t: "⚠️ Sobrante en Gaveta", c: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400" }
      : { t: "❌ Faltante en Gaveta", c: "border-destructive/30 bg-destructive/10 text-destructive" };

  const rows: [string, number, number, boolean?][] = [
    ["Efectivo Bolívares (Bs.)", a.declared.bs, a.expected.bs],
    ["Efectivo Dólares ($ USD)", a.declared.usd, a.expected.usd, true],
    ["Punto de Venta (Tarjeta)", a.declared.pos, a.expected.pos],
    ["Pago Móvil", a.declared.pagoMovil, a.expected.pagoMovil],
  ];

  const report = buildCashReportSummary(a, rate, companySettings);

  // 1. Abrir cliente de correo con mailto: real
  function handleOpenMailClient() {
    if (!emailTo.trim()) {
      toast.error("Ingresa un correo electrónico destinatario");
      return;
    }
    const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(report.subject)}&body=${encodeURIComponent(report.body)}`;
    window.open(mailtoUrl, "_blank");
    toast.success(`Abriendo cliente de correo para enviar a: ${emailTo}`);
  }

  // 2. Copiar texto completo al portapapeles
  function handleCopyReport() {
    navigator.clipboard.writeText(report.body);
    toast.success("📋 Reporte completo copiado al portapapeles. Listo para pegar en correo o mensaje.");
  }

  // 3. Enviar por WhatsApp a la gerencia
  function handleSendWhatsApp() {
    const waText = buildCierreZWhatsApp(a, rate, companySettings.name);
    openWhatsApp({ phone: managerPhone, message: waText });
  }

  // 4. Imprimir reporte fiscal
  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-4">
      {/* Cuadre Header */}
      <div className={`rounded-2xl border p-4 text-center ${status.c}`}>
        <div className="text-base font-extrabold">{status.t}</div>
        <div className="font-mono text-sm mt-0.5">Diferencia: {fmtBs(d)}</div>
      </div>

      {/* Tabla comparativa */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full font-mono text-xs">
          <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left px-3 py-2">Rubro</th>
              <th className="text-right px-3 py-2">Declarado</th>
              <th className="text-right px-3 py-2">Sistema</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(([l, dv, ev, isUsd]) => (
              <tr key={l} className="hover:bg-secondary/30">
                <td className="px-3 py-2 font-sans font-medium text-foreground">{l}</td>
                <td className="px-3 py-2 text-right font-bold text-foreground">
                  {isUsd ? `$${dv.toFixed(2)}` : fmtBs(dv)}
                </td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  {isUsd ? `$${ev.toFixed(2)}` : fmtBs(ev)}
                </td>
              </tr>
            ))}
            <tr className="bg-secondary/40 font-bold text-foreground">
              <td className="px-3 py-2.5 font-sans">TOTAL GENERAL Bs.</td>
              <td className="px-3 py-2.5 text-right font-mono text-primary font-black">{fmtBs(a.declaredTotalBs)}</td>
              <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{fmtBs(a.expectedTotalBs)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Canales de Envío Reales (Correo y WhatsApp) */}
      <div className="rounded-2xl border border-border bg-secondary/30 p-3.5 space-y-3 text-xs">
        <div className="font-bold text-foreground flex items-center justify-between">
          <span>📤 Enviar Informe Ejecutivo a Gerencia</span>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-primary underline font-medium text-[11px]"
          >
            {showPreview ? "Ocultar vista previa" : "Ver texto del informe"}
          </button>
        </div>

        {/* Vista previa desplegable */}
        {showPreview && (
          <pre className="rounded-xl border border-border bg-background p-3 font-mono text-[10px] whitespace-pre-wrap text-foreground max-h-48 overflow-y-auto">
            {report.body}
          </pre>
        )}

        {/* Fila Correo */}
        <div className="space-y-1.5 border-t border-border/70 pt-2.5">
          <label className="text-[11px] font-semibold text-muted-foreground">Correo de Gerencia / Propietario:</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              className={`${inputCls} text-xs flex-1`}
              placeholder="gerencia@drempanadas.com.ve"
            />
            <button
              type="button"
              onClick={handleOpenMailClient}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-bold hover:opacity-90 transition shrink-0"
            >
              <Mail className="h-3.5 w-3.5" /> Abrir Correo
            </button>
            <button
              type="button"
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-secondary transition shrink-0"
              title="Copiar texto para pegar"
            >
              <Copy className="h-3.5 w-3.5" /> Copiar
            </button>
          </div>
        </div>

        {/* Fila WhatsApp */}
        <div className="space-y-1.5 border-t border-border/70 pt-2.5">
          <label className="text-[11px] font-semibold text-muted-foreground">Teléfono de Gerencia para WhatsApp:</label>
          <div className="flex gap-2">
            <input
              type="tel"
              value={managerPhone}
              onChange={(e) => setManagerPhone(e.target.value)}
              className={`${inputCls} text-xs flex-1 font-mono`}
              placeholder="0412-1234567"
            />
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-3.5 py-1.5 text-xs font-bold hover:bg-emerald-700 transition shrink-0"
            >
              <Share2 className="h-3.5 w-3.5" /> Enviar por WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80"
        >
          <Printer className="h-4 w-4" /> Imprimir Comprobante Fiscal Z
        </button>

        <div className="flex gap-2">
          {a.kind === "Z" && (
            <button
              type="button"
              onClick={onOpenNewCash}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-4 py-2 text-xs font-bold hover:bg-emerald-700 transition"
            >
              <Sun className="h-4 w-4" /> Abrir Nueva Caja
            </button>
          )}
          <button type="button" onClick={onClose} className={btnGhost}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
