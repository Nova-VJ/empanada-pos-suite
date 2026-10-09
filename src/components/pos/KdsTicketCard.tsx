import type { KdsTicket } from "@/types/pos";

export function KdsTicketCard({ t, now, onAdvance }: { t: KdsTicket; now: number; onAdvance: (s: "ready" | "dispatched") => void }) {
  const secs = Math.max(0, Math.floor((now - t.createdAt) / 1000));
  const mm = Math.floor(secs / 60);
  const border = mm >= 10 ? "border-[#c85a48] animate-pulse" : mm >= 5 ? "border-[#cca06a]/70" : "border-[#2ea88c]/60";
  const timeCls = mm >= 10 ? "text-[#e07a68]" : mm >= 5 ? "text-[#e0ab77]" : "text-[#2ea88c]";
  const food = t.lines.filter((l) => l.kitchen);
  const drinks = t.lines.filter((l) => !l.kitchen);

  return (
    <div className={`flex flex-col rounded-3xl border-2 bg-[#122623] ${border} shadow-xl shadow-black/30 overflow-hidden animate-in zoom-in-95`}>
      <div className="flex items-center justify-between border-b border-[#1b3530] px-5 py-3.5 bg-[#142b27]">
        <div>
          <div className="font-mono text-2xl font-black text-[#fbf8f1]">#{t.id}</div>
          <span className="rounded-lg bg-[#0c1816] border border-[#1f3d37] px-2 py-0.5 text-xs font-semibold text-[#a6b9b0]">
            {t.type === "takeout" ? "🥡 Para Llevar" : `🍽️ ${t.table}`}
          </span>
        </div>
        <div className={`font-mono text-3xl font-extrabold tabular-nums ${timeCls}`}>
          {String(mm).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
        </div>
      </div>
      <ul className="flex-1 space-y-2.5 px-5 py-4 bg-[#0e1f1c]">
        {food.map((l, i) => (
          <li key={i} className="border-b border-[#1b3530]/60 pb-2 last:border-0 last:pb-0">
            <div className="text-base font-bold uppercase text-[#fbf8f1] flex items-center gap-2">
              <span className="rounded-lg bg-[#cca06a] px-2 py-0.5 font-mono text-xs font-black text-[#0b1a18]">{l.qty}X</span>
              {l.short}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {l.modifiers.map((m) => (
                <span key={m} className="rounded-md bg-[#183831] border border-[#2ea88c]/30 px-2 py-0.5 text-[11px] font-medium text-[#2ea88c]">
                  + {m}
                </span>
              ))}
              {l.note && (
                <span className="rounded-md bg-[#cca06a] px-2 py-0.5 text-[11px] font-bold text-[#0b1a18]">
                  ** {l.note} **
                </span>
              )}
            </div>
          </li>
        ))}
        {drinks.length > 0 && (
          <li className="mt-2 border-t border-dashed border-[#1b3530] pt-2 text-xs text-[#8fa49b]">
            🥤 Barra / Bebidas: {drinks.map((d) => `${d.qty}× ${d.short}`).join(", ")}
          </li>
        )}
      </ul>
      <div className="grid grid-cols-3 gap-1.5 p-2.5 bg-[#0c1816] border-t border-[#1b3530]">
        <span className={`rounded-xl py-2 text-center text-xs font-bold ${t.kdsStatus === "fryer" ? "bg-[#cca06a]/20 text-[#e0ab77]" : "text-[#5a6f66]"}`}>
          ⏱️ Freidora
        </span>
        <button
          disabled={t.kdsStatus !== "fryer"}
          onClick={() => onAdvance("ready")}
          className={`rounded-xl py-2 text-xs font-bold transition ${
            t.kdsStatus === "ready"
              ? "bg-[#2ea88c]/30 text-[#2ea88c]"
              : "bg-[#18332e] text-[#fbf8f1] hover:bg-[#2ea88c] hover:text-[#0b1a18] disabled:opacity-30 disabled:hover:bg-[#18332e]"
          }`}
        >
          ✅ Listo
        </button>
        <button
          disabled={t.kdsStatus !== "ready"}
          onClick={() => onAdvance("dispatched")}
          className="rounded-xl bg-[#18332e] py-2 text-xs font-bold text-[#fbf8f1] transition hover:bg-[#cca06a] hover:text-[#0b1a18] disabled:opacity-30 disabled:hover:bg-[#18332e]"
        >
          📦 Despacho
        </button>
      </div>
    </div>
  );
}
