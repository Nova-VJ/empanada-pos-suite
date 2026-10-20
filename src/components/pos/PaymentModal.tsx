import { useMemo, useState } from "react";
import { Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd, igtfFor, r2 } from "@/lib/money";
import type { CustomerInfo, PaymentSplit, TenderType } from "@/types/pos";
import { Modal, btnGhost, btnPrimary, inputCls } from "./Modal";

const TENDERS: { id: TenderType; label: string }[] = [
  { id: "usd_cash", label: "💵 Divisas USD" },
  { id: "pago_movil", label: "📱 Pago Móvil" },
  { id: "pos_card", label: "💳 Punto de Venta" },
  { id: "bs_cash", label: "💵 Efectivo Bs." },
  { id: "credito", label: "📓 Crédito / Fiado" },
];
const BANKS = ["BDV (0102)", "Banesco (0134)", "Mercantil (0105)", "Bancamiga (0172)"];
export const TENDER_LABEL: Record<TenderType, string> = {
  usd_cash: "Divisas USD",
  pago_movil: "Pago Móvil",
  pos_card: "Punto de Venta",
  bs_cash: "Efectivo Bs.",
  credito: "Crédito / Por Cobrar",
};

export function PaymentModal() {
  const pos = usePos();
  const { totals, rate, customers } = pos;
  const isFiscal = pos.companySettings.operationMode === "fiscal_seniat";
  const [tender, setTender] = useState<TenderType>("usd_cash");
  const [payments, setPayments] = useState<PaymentSplit[]>([]);
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState(BANKS[0]);
  const [phone, setPhone] = useState("0414-");
  const [ref, setRef] = useState("");
  const [lot, setLot] = useState("");

  // Customer fiscal / debtor information
  const [hasCustomClient, setHasCustomClient] = useState(false);
  const [selectedCrmId, setSelectedCrmId] = useState<string>("");
  const [docType, setDocType] = useState<"V" | "J" | "E" | "G">("V");
  const [rifNum, setRifNum] = useState("");
  const [clientName, setClientName] = useState("");

  const igtfTotal = r2(payments.reduce((a, p) => a + p.igtfBs, 0));
  const dueBs = r2(totals.totalBs + igtfTotal);
  const paidBs = r2(payments.reduce((a, p) => a + p.amountBs, 0));
  const remaining = r2(dueBs - paidBs);
  const change = remaining < 0 ? -remaining : 0;

  // Remaining expressed in the selected tender (USD must also cover its own IGTF; Credit in USD does not charge IGTF upfront)
  const suggestUsd = remaining > 0 ? (tender === "credito" ? r2(remaining / rate) : r2(remaining / rate / 1.03)) : 0;
  const amt = parseFloat(amount.replace(",", ".")) || 0;
  const previewIgtf = tender === "usd_cash" ? igtfFor(amt, rate) : 0;

  const qr = useMemo(
    () => `PAGOMOVIL|J501234567|0102|04121234567|${Math.max(0, remaining).toFixed(2)}|DR-EMP-${pos.nextOrder}`,
    [remaining, pos.nextOrder]
  );

  function handleSelectCrm(id: string) {
    setSelectedCrmId(id);
    const found = customers.find((c) => c.id === id);
    if (found) {
      setDocType(found.docType);
      setRifNum(found.rif.replace(/^[VJEG]-/i, ""));
      setClientName(found.name);
      setHasCustomClient(true);
    }
  }

  function add() {
    if (amt <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    // La referencia, lote y teléfono son datos complementarios opcionales para agilidad en caja
    if (tender === "credito" && !clientName.trim() && !selectedCrmId) {
      setHasCustomClient(true);
      toast.error("Selecciona o escribe el nombre del cliente para anotar la cuenta por cobrar (Deudores)");
      return;
    }
    const isUsdInput = tender === "usd_cash" || tender === "credito";
    const p: PaymentSplit = {
      id: crypto.randomUUID(),
      type: tender,
      amountBs: isUsdInput ? r2(amt * rate) : r2(amt),
      amountUsd: isUsdInput ? amt : undefined,
      igtfBs: previewIgtf,
      bank: tender === "pago_movil" ? bank : undefined,
      phone: tender === "pago_movil" && phone.trim() ? phone.trim() : undefined,
      reference: ref.trim() ? ref.trim() : undefined,
      lot: tender === "pos_card" && lot.trim() ? lot.trim() : undefined,
    };
    setPayments((x) => [...x, p]);
    setAmount("");
    setRef("");
    setLot("");
  }

  function confirm() {
    const hasCredit = payments.some((p) => p.type === "credito");
    if (hasCredit && !clientName.trim()) {
      setHasCustomClient(true);
      toast.error("Para ventas a crédito debes indicar el cliente en Datos del Cliente");
      return;
    }

    const customer: CustomerInfo | undefined =
      (hasCustomClient || hasCredit) && (rifNum || clientName.trim())
        ? {
            docType,
            rif: `${docType}-${(rifNum.trim() || String(Math.floor(10000000 + Math.random() * 89999999)))}`,
            name: clientName.trim() || "Cliente Registrado",
          }
        : undefined;

    const order = pos.checkout(payments, change, customer);
    toast.success(
      hasCredit
        ? `Orden #${order.id} registrada en Cuentas por Cobrar (${customer?.name})`
        : `Orden #${order.id} cobrada y enviada a cocina`
    );
    pos.setTicketOrderId(order.id);
    pos.setModal("ticket");
  }

  return (
    <Modal
      title={isFiscal ? "💳 Pago Mixto & Facturación Fiscal SENIAT" : "💳 Pago Mixto & Nota de Control Interno (Sin IVA)"}
      width="max-w-4xl"
      onClose={() => pos.setModal(null)}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">El cobro se habilita cuando el saldo restante sea ≤ Bs. 0,00</span>
          <button disabled={remaining > 0.009 || payments.length === 0} onClick={confirm} className={`${btnPrimary} px-7 py-2.5 text-sm`}>
            {isFiscal ? "✓ Confirmar y Emitir Factura SENIAT" : "✓ Confirmar y Emitir Nota de Control"}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3.5">
        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Orden {igtfTotal > 0 && "(+IGTF 3%)"}
          </div>
          <div className="font-mono text-2xl font-black text-foreground mt-0.5">{fmtBs(dueBs)}</div>
          <div className="font-mono text-xs font-bold text-module-sales">{fmtUsd(dueBs / rate)} USD</div>
        </div>
        <div
          className={`rounded-xl border p-4 transition-colors ${
            remaining > 0
              ? "border-module-cash/40 bg-module-cash-light"
              : "border-module-inventory/40 bg-module-inventory-light"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {remaining > 0 ? "Saldo Restante" : "Vuelto / Cambio a Entregar"}
          </div>
          <div className={`font-mono text-2xl font-black mt-0.5 ${remaining > 0 ? "text-module-cash" : "text-module-inventory"}`}>
            {fmtBs(remaining > 0 ? remaining : change)}
          </div>
          <div className="font-mono text-xs font-semibold text-muted-foreground">
            {fmtUsd((remaining > 0 ? remaining : change) / rate)} USD
          </div>
        </div>
      </div>

      {/* Desglose de Vuelto Bimoneda Automático (Efectivo USD, Efectivo Bs. o Pago Móvil) */}
      {change > 0 && (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
            <span>💡 Calculadora de Vuelto Rápido (Elige cómo devolver al cliente):</span>
            <span className="font-mono text-[11px]">Tasa: Bs. {rate.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => toast.info(`Entregar $${(change / rate).toFixed(2)} en billetes USD`)}
              className="rounded-lg border border-emerald-500/20 bg-background/80 p-2 text-left hover:bg-background transition"
            >
              <div className="text-[10px] text-muted-foreground font-semibold">Opción 1: En Divisas ($)</div>
              <div className="font-mono font-black text-sm text-foreground mt-0.5">{fmtUsd(change / rate)}</div>
              <div className="text-[10px] text-emerald-600 font-medium">Billetes / Sencillo USD</div>
            </button>
            <button
              type="button"
              onClick={() => toast.info(`Entregar ${fmtBs(change)} en efectivo de gaveta`)}
              className="rounded-lg border border-emerald-500/20 bg-background/80 p-2 text-left hover:bg-background transition"
            >
              <div className="text-[10px] text-muted-foreground font-semibold">Opción 2: Efectivo en Bs.</div>
              <div className="font-mono font-black text-sm text-foreground mt-0.5">{fmtBs(change)}</div>
              <div className="text-[10px] text-emerald-600 font-medium">Billetes venezolanos</div>
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(change.toFixed(2));
                toast.success(`Monto ${fmtBs(change)} copiado para hacer Pago Móvil de vuelto`);
              }}
              className="rounded-lg border border-emerald-500/20 bg-background/80 p-2 text-left hover:bg-background transition"
            >
              <div className="text-[10px] text-muted-foreground font-semibold">Opción 3: Pago Móvil</div>
              <div className="font-mono font-black text-sm text-foreground mt-0.5">{fmtBs(change)}</div>
              <div className="text-[10px] text-emerald-600 font-medium">Copiar monto para transferir 📋</div>
            </button>
          </div>
        </div>
      )}

      {/* Selector de Cliente Fiscal */}
      <div className="mt-3.5 rounded-xl border border-border bg-secondary/30 p-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-foreground">
            <UserCheck className="h-4 w-4 text-module-customers" />
            <span className="font-semibold">Datos del Cliente para Factura SENIAT</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedCrmId}
              onChange={(e) => handleSelectCrm(e.target.value)}
              className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground"
            >
              <option value="">Seleccionar de Clientes CRM…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.rif} — {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setHasCustomClient(!hasCustomClient);
                if (hasCustomClient) setSelectedCrmId("");
              }}
              className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-secondary"
            >
              {hasCustomClient ? "Usar Consumidor Final" : "+ Personalizar RIF / Razón Social"}
            </button>
          </div>
        </div>
        {hasCustomClient && (
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 animate-in fade-in">
            <div className="flex gap-1">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as "V" | "J" | "E" | "G")}
                className={`${inputCls} w-20 font-bold`}
              >
                <option value="V">V-</option>
                <option value="J">J-</option>
                <option value="E">E-</option>
                <option value="G">G-</option>
              </select>
              <input
                value={rifNum}
                onChange={(e) => setRifNum(e.target.value.replace(/[^0-9-]/g, ""))}
                placeholder="Cédula / RIF"
                className={`${inputCls} font-mono`}
              />
            </div>
            <div className="sm:col-span-2">
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre o Razón Social"
                className={inputCls}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_290px]">
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 rounded-xl border border-border bg-secondary">
            {TENDERS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTender(t.id);
                  if (t.id === "credito") {
                    setHasCustomClient(true);
                    setAmount(String(r2(remaining / rate)));
                  } else {
                    setAmount("");
                  }
                }}
                className={`rounded-lg px-2 py-2 text-xs font-semibold transition-all ${
                  tender === t.id
                    ? "bg-card text-primary shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-3 rounded-xl border border-border bg-secondary/20 p-4">
            <label className="block text-xs font-medium text-muted-foreground">
              Monto a abonar en {tender === "usd_cash" || tender === "credito" ? "USD ($)" : "Bolívares (Bs.)"}
              <div className="mt-1.5 flex gap-2">
                <input
                  autoFocus
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && add()}
                  className={`${inputCls} font-mono text-lg font-bold`}
                  placeholder="0,00"
                />
                <button
                  className={btnGhost}
                  onClick={() => setAmount(String(tender === "usd_cash" || tender === "credito" ? suggestUsd : Math.max(0, remaining)))}
                >
                  Restante
                </button>
              </div>
            </label>

            {tender === "credito" && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
                <div className="font-bold flex items-center justify-between">
                  <span>📓 Anotar en Cuenta por Cobrar (Deudores)</span>
                  <span className="font-mono">{fmtUsd(amt)} = {fmtBs(amt * rate)}</span>
                </div>
                <p className="text-[11px] opacity-90">
                  La deuda queda indexada en dólares ($ USD) a nombre del cliente seleccionado arriba. Cuando el cliente abone, se calculará a la tasa del día.
                </p>
              </div>
            )}

            {tender === "usd_cash" && (
              <>
                <div className="flex gap-2">
                  {[5, 10, 20, 50].map((v) => (
                    <button key={v} onClick={() => setAmount(String(v))} className={`${btnGhost} flex-1 font-mono font-bold`}>
                      ${v}
                    </button>
                  ))}
                </div>
                <div className="rounded-lg border border-module-cash/30 bg-module-cash-light px-3.5 py-2 font-mono text-xs text-module-cash">
                  IGTF (3% sobre divisas) = {fmtUsd(amt)} × 0.03 × {rate.toFixed(2)} = <b>{fmtBs(previewIgtf)}</b>
                </div>
                {amt > 0 && amt * rate - previewIgtf > remaining && remaining > 0 && (
                  <div className="font-mono text-xs font-semibold text-module-inventory">
                    Vuelto estimado: {fmtUsd(amt - suggestUsd)} USD · {fmtBs((amt - suggestUsd) * rate)}
                  </div>
                )}
              </>
            )}

            {tender === "bs_cash" && (
              <div className="flex gap-2">
                {[50, 100, 200, 500].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String((parseFloat(amount) || 0) + v))}
                    className={`${btnGhost} flex-1 font-mono`}
                  >
                    +Bs. {v}
                  </button>
                ))}
              </div>
            )}

            {tender === "pago_movil" && (
              <div className="grid grid-cols-[110px_1fr] gap-3">
                <QrPreview payload={qr} />
                <div className="space-y-2">
                  <select value={bank} onChange={(e) => setBank(e.target.value)} className={inputCls}>
                    {BANKS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.slice(0, 12))}
                    className={inputCls}
                    placeholder="Teléfono 0414-1234567 (Opcional)"
                  />
                  <input
                    value={ref}
                    onChange={(e) => setRef(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    className={`${inputCls} font-mono`}
                    placeholder="Nº Referencia (Opcional)"
                  />
                </div>
              </div>
            )}

            {tender === "pos_card" && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={ref}
                  onChange={(e) => setRef(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  className={`${inputCls} font-mono`}
                  placeholder="Nº Referencia (Opcional)"
                />
                <input
                  value={lot}
                  onChange={(e) => setLot(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={`${inputCls} font-mono`}
                  placeholder="Nº Lote (Opcional)"
                />
              </div>
            )}

            <button
              onClick={add}
              className="w-full rounded-lg border border-module-inventory/30 bg-module-inventory-light py-2.5 text-xs font-bold text-module-inventory hover:opacity-90 transition"
            >
              {tender === "credito" ? "+ Anotar Monto a Crédito (Fiado)" : "+ Registrar Pago Parcial"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-secondary/20 p-3.5">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Pagos registrados</div>
          {payments.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">Sin abonos registrados</p>}
          <ul className="space-y-2">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex items-start justify-between rounded-lg border border-border bg-card p-2.5 text-xs animate-in slide-in-from-left-2 shadow-2xs"
              >
                <div>
                  <div className="font-semibold text-foreground">{TENDER_LABEL[p.type]}</div>
                  <div className="font-mono text-muted-foreground">
                    {p.amountUsd ? `${fmtUsd(p.amountUsd)} → ` : ""}
                    {fmtBs(p.amountBs)}
                  </div>
                  {p.igtfBs > 0 && <div className="font-mono text-module-cash text-[11px]">IGTF {fmtBs(p.igtfBs)}</div>}
                  {p.reference && (
                    <div className="text-muted-foreground text-[11px]">
                      {p.bank ?? "Ref"} ···{p.reference}
                      {p.lot ? ` · Lote ${p.lot}` : ""}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setPayments((x) => x.filter((y) => y.id !== p.id))}
                  className="rounded p-1 text-muted-foreground hover:text-destructive transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}

function QrPreview({ payload }: { payload: string }) {
  const cells = useMemo(() => {
    let h = 2166136261;
    const out: boolean[] = [];
    for (let i = 0; i < 21 * 21; i++) {
      h ^= payload.charCodeAt(i % payload.length) + i;
      h = Math.imul(h, 16777619);
      out.push((h >>> 0) % 2 === 0);
    }
    return out;
  }, [payload]);
  const finder = (x: number, y: number) =>
    ([[0, 0], [14, 0], [0, 14]] as const).some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
  return (
    <div className="rounded-lg border border-border bg-white p-1.5" title={payload}>
      <svg viewBox="0 0 21 21" className="h-full w-full">
        {cells.map((on, i) => {
          const x = i % 21,
            y = Math.floor(i / 21);
          if (finder(x, y)) {
            const lx = (x % 14) % 7,
              ly = (y % 14) % 7;
            const ring = lx === 0 || ly === 0 || lx === 6 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4);
            return ring ? <rect key={i} x={x} y={y} width={1} height={1} fill="#020617" /> : null;
          }
          return on ? <rect key={i} x={x} y={y} width={1} height={1} fill="#020617" /> : null;
        })}
      </svg>
    </div>
  );
}
