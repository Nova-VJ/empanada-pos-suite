import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd, igtfFor, r2 } from "@/lib/money";
import type { PaymentSplit, TenderType } from "@/types/pos";
import { Modal, btnGhost, btnPrimary, inputCls } from "./Modal";

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
    if (amt <= 0) return toast.error("Ingresa un monto válido");
    if ((tender === "pago_movil" || tender === "pos_card") && !/^\d{4,}$/.test(ref)) return toast.error("Referencia: mínimo 4 dígitos");
    if (tender === "pago_movil" && !/^0\d{3}-?\d{7}$/.test(phone)) return toast.error("Teléfono inválido (0414-1234567)");
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
    const order = pos.checkout(payments, change);
    toast.success(`Orden #${order.id} cobrada y enviada a cocina`);
    pos.setTicketOrderId(order.id);
    pos.setModal("ticket");
  }

  return (
    <Modal
      title="💳 Pago Mixto · Checkout"
      width="max-w-4xl"
      onClose={() => pos.setModal(null)}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">El cobro se habilita cuando el saldo restante es ≤ Bs. 0,00</span>
          <button disabled={remaining > 0.009 || payments.length === 0} onClick={confirm} className={`${btnPrimary} px-6 py-3 text-base`}>
            ✓ Confirmar y Emitir Factura
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="text-xs uppercase tracking-wider text-slate-500">Total Orden {igtfTotal > 0 && "(+IGTF)"}</div>
          <div className="font-mono text-2xl font-bold text-slate-50">{fmtBs(dueBs)}</div>
          <div className="font-mono text-sm text-sky-400">{fmtUsd(dueBs / rate)} USD</div>
        </div>
        <div className={`rounded-xl border p-3 ${remaining > 0 ? "border-amber-500/20 bg-amber-500/10" : "border-emerald-500/40 bg-emerald-600/10"}`}>
          <div className="text-xs uppercase tracking-wider text-slate-400">{remaining > 0 ? "Saldo Restante" : "Vuelto / Cambio"}</div>
          <div className={`font-mono text-2xl font-bold ${remaining > 0 ? "text-amber-400" : "text-emerald-400"}`}>{fmtBs(remaining > 0 ? remaining : change)}</div>
          <div className="font-mono text-sm text-slate-400">{fmtUsd((remaining > 0 ? remaining : change) / rate)} USD</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_280px]">
        <div>
          <div className="grid grid-cols-4 gap-1.5">
            {TENDERS.map((t) => (
              <button key={t.id} onClick={() => { setTender(t.id); setAmount(""); }} className={`rounded-lg border px-2 py-2.5 text-xs font-semibold ${tender === t.id ? "border-emerald-500/50 bg-emerald-600/15 text-emerald-300" : "border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200"}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <label className="block text-xs text-slate-400">
              Monto en {tender === "usd_cash" ? "USD" : "Bs."}
              <div className="mt-1 flex gap-2">
                <input autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className={`${inputCls} font-mono text-lg`} placeholder="0,00" />
                <button className={btnGhost} onClick={() => setAmount(String(tender === "usd_cash" ? suggestUsd : Math.max(0, remaining)))}>Restante</button>
              </div>
            </label>

            {tender === "usd_cash" && (
              <>
                <div className="flex gap-2">{[5, 10, 20, 50].map((v) => <button key={v} onClick={() => setAmount(String(v))} className={`${btnGhost} flex-1 font-mono`}>${v}</button>)}</div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 font-mono text-xs text-amber-400">
                  IGTF (3%) = {fmtUsd(amt)} × 0.03 × {rate.toFixed(2)} = <b>{fmtBs(previewIgtf)}</b>
                </div>
                {amt > 0 && amt * rate - previewIgtf > remaining && remaining > 0 && (
                  <div className="font-mono text-xs text-emerald-400">Vuelto estimado: {fmtUsd(amt - suggestUsd)} USD · {fmtBs((amt - suggestUsd) * rate)}</div>
                )}
              </>
            )}

            {tender === "bs_cash" && (
              <div className="flex gap-2">{[50, 100, 200, 500].map((v) => <button key={v} onClick={() => setAmount(String((parseFloat(amount) || 0) + v))} className={`${btnGhost} flex-1 font-mono`}>+Bs. {v}</button>)}</div>
            )}

            {tender === "pago_movil" && (
              <div className="grid grid-cols-[110px_1fr] gap-3">
                <QrPreview payload={qr} />
                <div className="space-y-2">
                  <select value={bank} onChange={(e) => setBank(e.target.value)} className={inputCls}>{BANKS.map((b) => <option key={b}>{b}</option>)}</select>
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

            <button onClick={add} className={`${btnGhost} w-full border-emerald-500/40 text-emerald-300`}>+ Registrar Pago Parcial</button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Pagos registrados</div>
          {payments.length === 0 && <p className="py-6 text-center text-xs text-slate-600">Sin pagos aún</p>}
          <ul className="space-y-2">
            {payments.map((p) => (
              <li key={p.id} className="flex items-start justify-between rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs animate-in slide-in-from-left-2">
                <div>
                  <div className="font-semibold text-slate-200">{TENDER_LABEL[p.type]}</div>
                  <div className="font-mono text-slate-400">{p.amountUsd ? `${fmtUsd(p.amountUsd)} → ` : ""}{fmtBs(p.amountBs)}</div>
                  {p.igtfBs > 0 && <div className="font-mono text-amber-400">IGTF {fmtBs(p.igtfBs)}</div>}
                  {p.reference && <div className="text-slate-500">{p.bank ?? "Ref"} ···{p.reference}{p.lot ? ` · Lote ${p.lot}` : ""}</div>}
                </div>
                <button onClick={() => setPayments((x) => x.filter((y) => y.id !== p.id))} className="rounded p-1 text-slate-500 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
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
  const finder = (x: number, y: number) => [[0, 0], [14, 0], [0, 14]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
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
