import { useState } from "react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, r2 } from "@/lib/money";
import type { Order, ShiftAudit } from "@/types/pos";
import { Modal, btnDanger, btnGhost, inputCls } from "./Modal";

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

export function CashShiftModal() {
  const pos = usePos();
  const [f, setF] = useState({ bs: "", usd: "", pos: "", pagoMovil: "", notes: "" });
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
    setResult(a);
    toast.success(kind === "Z" ? `Cierre Z #${a.zNumber} ejecutado` : "Corte X generado");
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
          <p className="mb-4 text-sm text-slate-400">Cuenta físicamente la gaveta. Los montos esperados por el sistema no se muestran hasta generar el corte.</p>
          <div className="grid grid-cols-2 gap-3">
            {fields.map(([k, label]) => (
              <label key={k} className="text-xs text-slate-400">{label}
                <input inputMode="decimal" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={`${inputCls} mt-1 font-mono`} placeholder="0,00" />
              </label>
            ))}
          </div>
          <label className="mt-3 block text-xs text-slate-400">Observaciones del cajero
            <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={`${inputCls} mt-1`} rows={2} maxLength={300} />
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <button className={btnGhost} onClick={() => run("X")}>📄 Generar Corte X</button>
            <button className={btnDanger} onClick={() => run("Z")}>🔒 Ejecutar Cierre Z</button>
          </div>
        </>
      ) : (
        <AuditResult a={result} onClose={() => pos.setModal(null)} />
      )}
    </Modal>
  );
}

function AuditResult({ a, onClose }: { a: ShiftAudit; onClose: () => void }) {
  const d = a.differenceBs;
  const status = Math.abs(d) < 0.01 ? { t: "✓ Cuadre Exacto", c: "border-emerald-500/40 bg-emerald-600/10 text-emerald-400" } : d > 0 ? { t: "⚠️ Sobrante en Gaveta", c: "border-amber-500/20 bg-amber-500/10 text-amber-400" } : { t: "⚠️ Faltante en Gaveta", c: "border-rose-500/40 bg-rose-600/10 text-rose-400" };
  const rows: [string, number, number, boolean?][] = [
    ["Efectivo Bs.", a.declared.bs, a.expected.bs],
    ["Efectivo USD", a.declared.usd, a.expected.usd, true],
    ["Punto de Venta", a.declared.pos, a.expected.pos],
    ["Pago Móvil", a.declared.pagoMovil, a.expected.pagoMovil],
  ];
  return (
    <div>
      <div className={`rounded-xl border p-4 text-center ${status.c}`}>
        <div className="text-lg font-bold">{status.t}</div>
        <div className="font-mono text-sm">Diferencia: {fmtBs(d)}</div>
      </div>
      <table className="mt-4 w-full font-mono text-xs">
        <thead className="text-slate-500"><tr><th className="text-left">Rubro</th><th className="text-right">Declarado</th><th className="text-right">Sistema</th></tr></thead>
        <tbody className="text-slate-200">
          {rows.map(([l, dv, ev, usd]) => (
            <tr key={l} className="border-t border-slate-800"><td className="py-1.5">{l}</td><td className="text-right">{usd ? `$${dv.toFixed(2)}` : fmtBs(dv)}</td><td className="text-right">{usd ? `$${ev.toFixed(2)}` : fmtBs(ev)}</td></tr>
          ))}
          <tr className="border-t border-slate-700 font-bold"><td className="py-1.5">TOTAL Bs.</td><td className="text-right">{fmtBs(a.declaredTotalBs)}</td><td className="text-right">{fmtBs(a.expectedTotalBs)}</td></tr>
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-500">{a.kind === "Z" ? `Cierre Z #${a.zNumber}` : "Corte X (parcial)"} · {a.tickets} tickets · {a.cashier} ({a.register})</p>
      {a.kind === "Z" && (
        <div className="mt-6 grid grid-cols-2 gap-6 text-center text-xs text-slate-400">
          <div className="border-t border-slate-600 pt-1">Firma Cajero</div>
          <div className="border-t border-slate-600 pt-1">Firma Gerente</div>
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button className={btnGhost} onClick={() => window.print()}>🖨️ Imprimir</button>
        <button className={btnGhost} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}
