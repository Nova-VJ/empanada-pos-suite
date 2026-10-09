import type { KdsTicket } from "@/types/pos";

export function KdsTicketCard({ t, now, onAdvance }: { t: KdsTicket; now: number; onAdvance: (s: "ready" | "dispatched") => void }) {
  const secs = Math.max(0, Math.floor((now - t.createdAt) / 1000));
  const mm = Math.floor(secs / 60);
  const border = mm >= 10 ? "border-rose-500 animate-pulse" : mm >= 5 ? "border-amber-500/60" : "border-emerald-500/50";
  const timeCls = mm >= 10 ? "text-rose-400" : mm >= 5 ? "text-amber-400" : "text-emerald-400";
  const food = t.lines.filter((l) => l.kitchen);
  const drinks = t.lines.filter((l) => !l.kitchen);

  return (
    <div className={`flex flex-col rounded-2xl border-2 bg-slate-900 ${border} animate-in zoom-in-95`}>
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <div className="font-mono text-2xl font-black text-slate-50">#{t.id}</div>
          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">{t.type === "takeout" ? "🥡 Para Llevar" : `🍽️ ${t.table}`}</span>
        </div>
        <div className={`font-mono text-3xl font-bold tabular-nums ${timeCls}`}>
          {String(mm).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
        </div>
      </div>
      <ul className="flex-1 space-y-2 px-4 py-3">
        {food.map((l, i) => (
          <li key={i}>
            <div className="text-lg font-bold uppercase text-slate-100"><span className="mr-2 rounded bg-slate-100 px-1.5 font-mono text-slate-950">{l.qty}X</span>{l.short}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {l.modifiers.map((m) => <span key={m} className="rounded bg-sky-950/60 px-1.5 py-0.5 text-xs text-sky-400">+ {m}</span>)}
              {l.note && <span className="rounded bg-amber-400 px-1.5 py-0.5 text-xs font-bold text-slate-950">{l.note}</span>}
            </div>
          </li>
        ))}
        {drinks.length > 0 && (
          <li className="mt-2 border-t border-dashed border-slate-700 pt-2 text-xs text-slate-500">
            🥤 Barra / Bebidas: {drinks.map((d) => `${d.qty}× ${d.short}`).join(", ")}
          </li>
        )}
      </ul>
      <div className="grid grid-cols-3 gap-1 p-2">
        <span className={`rounded-lg py-2 text-center text-xs font-semibold ${t.kdsStatus === "fryer" ? "bg-amber-500/15 text-amber-400" : "text-slate-600"}`}>⏱️ En Freidora</span>
        <button disabled={t.kdsStatus !== "fryer"} onClick={() => onAdvance("ready")} className={`rounded-lg py-2 text-xs font-semibold transition ${t.kdsStatus === "ready" ? "bg-emerald-600/20 text-emerald-300" : "bg-slate-800 text-slate-200 hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-slate-800"}`}>✅ Listo</button>
        <button disabled={t.kdsStatus !== "ready"} onClick={() => onAdvance("dispatched")} className="rounded-lg bg-slate-800 py-2 text-xs font-semibold text-slate-200 transition hover:bg-sky-600 disabled:opacity-30 disabled:hover:bg-slate-800">📦 Despachado</button>
      </div>
    </div>
  );
}
