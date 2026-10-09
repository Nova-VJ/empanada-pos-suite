import { useMemo, useState } from "react";
import { Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd, igtfFor, r2 } from "@/lib/money";
import type { CustomerInfo, PaymentSplit, TenderType } from "@/types/pos";
import { Modal, btnGhost, btnGold, inputCls } from "./Modal";

const TENDERS: { id: TenderType; label: string }[] = [
  { id: "usd_cash", label: "💵 Divisas USD" },
  { id: "pago_movil", label: "📱 Pago Móvil" },
  { id: "pos_card", label: "💳 Punto de Venta" },
  { id: "bs_cash", label: "💵 Efectivo Bs." },
];
const BANKS = ["BDV (0102)", "Banesco (0134)", "Mercantil (0105)", "Bancamiga (0172)"];
export const TENDER_LABEL: Record<TenderType, string> = { usd_cash: "Divisas USD", pago_movil: "Pago Móvil", pos_card: "Punto de Venta", bs_cash: "Efectivo Bs." };

export function PaymentModal() {
  const pos = usePos();
  const { totals, rate } = pos;
  const [tender, setTender] = useState<TenderType>("usd_cash");
  const [payments, setPayments] = useState<PaymentSplit[]>([]);
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState(BANKS[0]);
  const [phone, setPhone] = useState("0414-");
  const [ref, setRef] = useState("");
  const [lot, setLot] = useState("");

  // Customer fiscal information
  const [hasCustomClient, setHasCustomClient] = useState(false);
  const [docType, setDocType] = useState<"V" | "J" | "E" | "G">("V");
  const [rifNum, setRifNum] = useState("");
  const [clientName, setClientName] = useState("");

  const igtfTotal = r2(payments.reduce((a, p) => a + p.igtfBs, 0));
  const dueBs = r2(totals.totalBs + igtfTotal);
  const paidBs = r2(payments.reduce((a, p) => a + p.amountBs, 0));
  const remaining = r2(dueBs - paidBs);
  const change = remaining < 0 ? -remaining : 0;

  // Remaining expressed in the selected tender (USD must also cover its own IGTF)
  const suggestUsd = remaining > 0 ? r2(remaining / rate / 1.03) : 0;
  const amt = parseFloat(amount.replace(",", ".")) || 0;
  const previewIgtf = tender === "usd_cash" ? igtfFor(amt, rate) : 0;

  const qr = useMemo(() => `PAGOMOVIL|J501234567|0102|04121234567|${Math.max(0, remaining).toFixed(2)}|DR-EMP-${pos.nextOrder}`, [remaining, pos.nextOrder]);

  function add() {
    if (amt <= 0) { toast.error("Ingresa un monto válido"); return; }
    if ((tender === "pago_movil" || tender === "pos_card") && !/^\d{4,}$/.test(ref)) { toast.error("Referencia: mínimo 4 dígitos"); return; }
    if (tender === "pago_movil" && !/^0\d{3}-?\d{7}$/.test(phone)) { toast.error("Teléfono inválido (0414-1234567)"); return; }
    const p: PaymentSplit = {
      id: crypto.randomUUID(),
      type: tender,
      amountBs: tender === "usd_cash" ? r2(amt * rate) : r2(amt),
      amountUsd: tender === "usd_cash" ? amt : undefined,
      igtfBs: previewIgtf,
      bank: tender === "pago_movil" ? bank : undefined,
      phone: tender === "pago_movil" ? phone : undefined,
      reference: ref ? ref.slice(-4) : undefined,
      lot: tender === "pos_card" ? lot : undefined,
    };
    setPayments((x) => [...x, p]);
    setAmount("");
    setRef("");
    setLot("");
  }

  function confirm() {
    const customer: CustomerInfo | undefined = hasCustomClient && rifNum ? {
      docType,
      rif: `${docType}-${rifNum.trim()}`,
      name: clientName.trim() || "Cliente Registrado",
    } : undefined;

    const order = pos.checkout(payments, change, customer);
    toast.success(`Orden #${order.id} cobrada y enviada a cocina`);
    pos.setTicketOrderId(order.id);
    pos.setModal("ticket");
  }

  return (
    <Modal
      title="💳 Pago Mixto & Checkout Fiscal"
      width="max-w-4xl"
      onClose={() => pos.setModal(null)}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-[#8fa49b]">El cobro se habilita cuando el saldo restante sea ≤ Bs. 0,00</span>
          <button disabled={remaining > 0.009 || payments.length === 0} onClick={confirm} className={`${btnGold} px-7 py-3 text-sm`}>
            ✓ Confirmar y Emitir Factura
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3.5">
        <div className="rounded-2xl border border-[#1b3530] bg-[#0c1816] p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#8fa49b]">Total Orden {igtfTotal > 0 && "(+IGTF 3%)"}</div>
          <div className="font-mono text-2xl font-black text-[#fbf8f1] mt-0.5">{fmtBs(dueBs)}</div>
          <div className="font-mono text-xs font-bold text-[#e0ab77]">{fmtUsd(dueBs / rate)} USD</div>
        </div>
        <div className={`rounded-2xl border p-4 shadow-sm transition-colors ${remaining > 0 ? "border-[#e0ab77]/30 bg-[#24352b]/50" : "border-[#2ea88c]/40 bg-[#16332c]"}`}>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#a6b9b0]">{remaining > 0 ? "Saldo Restante" : "Vuelto / Cambio"}</div>
          <div className={`font-mono text-2xl font-black mt-0.5 ${remaining > 0 ? "text-[#e0ab77]" : "text-[#2ea88c]"}`}>{fmtBs(remaining > 0 ? remaining : change)}</div>
          <div className="font-mono text-xs font-semibold text-[#8fa49b]">{fmtUsd((remaining > 0 ? remaining : change) / rate)} USD</div>
        </div>
      </div>

      {/* Selector de Cliente Fiscal */}
      <div className="mt-3.5 rounded-2xl border border-[#1b3530] bg-[#0e1f1c] p-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#a6b9b0]">
            <UserCheck className="h-4 w-4 text-[#cca06a]" />
            <span className="font-semibold text-[#fbf8f1]">Datos del Cliente para Factura SENIAT</span>
          </div>
          <button
            type="button"
            onClick={() => setHasCustomClient(!hasCustomClient)}
            className="rounded-lg border border-[#1b3530] bg-[#122623] px-2.5 py-1 text-[11px] font-semibold text-[#e0ab77] hover:border-[#cca06a]/50"
          >
            {hasCustomClient ? "Usar Consumidor Final" : "+ Personalizar RIF / Razón Social"}
          </button>
        </div>
        {hasCustomClient && (
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 animate-in fade-in">
            <div className="flex gap-1">
              <select value={docType} onChange={(e) => setDocType(e.target.value as "V" | "J" | "E" | "G")} className={`${inputCls} w-20 font-bold`}>
                <option value="V">V-</option>
                <option value="J">J-</option>
                <option value="E">E-</option>
                <option value="G">G-</option>
              </select>
              <input value={rifNum} onChange={(e) => setRifNum(e.target.value.replace(/\D/g, ""))} placeholder="Cédula / RIF" className={`${inputCls} font-mono`} />
            </div>
            <div className="sm:col-span-2">
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre o Razón Social" className={inputCls} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_290px]">
        <div>
          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl border border-[#1b3530] bg-[#0c1816]">
            {TENDERS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTender(t.id); setAmount(""); }}
                className={`rounded-xl px-2 py-2.5 text-xs font-semibold tracking-wide transition-all ${
                  tender === t.id
                    ? "bg-[#1c3831] border border-[#cca06a]/60 text-[#fbf8f1] shadow-sm"
                    : "text-[#8fa49b] hover:text-[#fbf8f1]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-3.5 space-y-3.5 rounded-2xl border border-[#1b3530] bg-[#0c1816] p-4 shadow-sm">
            <label className="block text-xs font-medium text-[#a6b9b0]">
              Monto a abonar en {tender === "usd_cash" ? "USD ($)" : "Bolívares (Bs.)"}
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
                <button className={btnGhost} onClick={() => setAmount(String(tender === "usd_cash" ? suggestUsd : Math.max(0, remaining)))}>
                  Restante
                </button>
              </div>
            </label>

            {tender === "usd_cash" && (
              <>
                <div className="flex gap-2">
                  {[5, 10, 20, 50].map((v) => (
                    <button key={v} onClick={() => setAmount(String(v))} className={`${btnGhost} flex-1 font-mono font-bold`}>
                      ${v}
                    </button>
                  ))}
                </div>
                <div className="rounded-xl border border-[#cca06a]/30 bg-[#243329] px-3.5 py-2.5 font-mono text-xs text-[#e0ab77]">
                  IGTF (3% sobre divisas) = {fmtUsd(amt)} × 0.03 × {rate.toFixed(2)} = <b>{fmtBs(previewIgtf)}</b>
                </div>
                {amt > 0 && amt * rate - previewIgtf > remaining && remaining > 0 && (
                  <div className="font-mono text-xs text-[#2ea88c]">
                    Vuelto estimado: {fmtUsd(amt - suggestUsd)} USD · {fmtBs((amt - suggestUsd) * rate)}
                  </div>
                )}
              </>
            )}

            {tender === "bs_cash" && (
              <div className="flex gap-2">
                {[50, 100, 200, 500].map((v) => (
                  <button key={v} onClick={() => setAmount(String((parseFloat(amount) || 0) + v))} className={`${btnGhost} flex-1 font-mono`}>
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
                    {BANKS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                  <input value={phone} onChange={(e) => setPhone(e.target.value.slice(0, 12))} className={inputCls} placeholder="0414-1234567" />
                  <input value={ref} onChange={(e) => setRef(e.target.value.replace(/\D/g, "").slice(0, 12))} className={`${inputCls} font-mono`} placeholder="Referencia (últimos 4+)" />
                </div>
              </div>
            )}

            {tender === "pos_card" && (
              <div className="grid grid-cols-2 gap-2">
                <input value={ref} onChange={(e) => setRef(e.target.value.replace(/\D/g, "").slice(0, 12))} className={`${inputCls} font-mono`} placeholder="Nº Referencia" />
                <input value={lot} onChange={(e) => setLot(e.target.value.replace(/\D/g, "").slice(0, 6))} className={`${inputCls} font-mono`} placeholder="Nº Lote" />
              </div>
            )}

            <button onClick={add} className="w-full rounded-xl border border-[#2ea88c]/40 bg-[#16332c] py-2.5 text-xs font-bold text-[#2ea88c] hover:bg-[#1a3c34] transition">
              + Registrar Pago Parcial
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1b3530] bg-[#0c1816] p-3.5 shadow-sm">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8fa49b]">Pagos registrados</div>
          {payments.length === 0 && <p className="py-8 text-center text-xs text-[#5a6f66]">Sin abonos registrados</p>}
          <ul className="space-y-2">
            {payments.map((p) => (
              <li key={p.id} className="flex items-start justify-between rounded-xl border border-[#1b3530] bg-[#122623] p-2.5 text-xs animate-in slide-in-from-left-2 shadow-sm">
                <div>
                  <div className="font-semibold text-[#fbf8f1]">{TENDER_LABEL[p.type]}</div>
                  <div className="font-mono text-[#8fa49b]">{p.amountUsd ? `${fmtUsd(p.amountUsd)} → ` : ""}{fmtBs(p.amountBs)}</div>
                  {p.igtfBs > 0 && <div className="font-mono text-[#e0ab77] text-[11px]">IGTF {fmtBs(p.igtfBs)}</div>}
                  {p.reference && <div className="text-[#6d847b] text-[11px]">{p.bank ?? "Ref"} ···{p.reference}{p.lot ? ` · Lote ${p.lot}` : ""}</div>}
                </div>
                <button onClick={() => setPayments((x) => x.filter((y) => y.id !== p.id))} className="rounded p-1 text-[#8fa49b] hover:text-[#c85a48] transition">
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

/** Deterministic visual QR-like preview of the payload (not scannable — preview only). */
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
  const finder = (x: number, y: number) => ([[0, 0], [14, 0], [0, 14]] as const).some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
  return (
    <div className="rounded-lg bg-slate-100 p-1.5" title={payload}>
      <svg viewBox="0 0 21 21" className="h-full w-full">
        {cells.map((on, i) => {
          const x = i % 21, y = Math.floor(i / 21);
          if (finder(x, y)) {
            const lx = x % 14 % 7, ly = y % 14 % 7;
            const ring = lx === 0 || ly === 0 || lx === 6 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4);
            return ring ? <rect key={i} x={x} y={y} width={1} height={1} fill="#020617" /> : null;
          }
          return on ? <rect key={i} x={x} y={y} width={1} height={1} fill="#020617" /> : null;
        })}
      </svg>
    </div>
  );
}
