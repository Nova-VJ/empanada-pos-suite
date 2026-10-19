import { Bell, Flame } from "lucide-react";
import type { KdsTicket } from "@/types/pos";
import { playKitchenBell } from "@/services/sound";

export function KdsTicketCard({ t, now, onAdvance }: { t: KdsTicket; now: number; onAdvance: (s: "ready" | "dispatched") => void }) {
  const secs = Math.max(0, Math.floor((now - t.createdAt) / 1000));
  const mm = Math.floor(secs / 60);
  const isFresh = secs <= 20;
  const border =
    mm >= 10
      ? "border-destructive animate-pulse"
      : isFresh
      ? "border-amber-500 shadow-md ring-2 ring-amber-500/30 animate-pulse"
      : mm >= 5
      ? "border-module-cash"
      : "border-module-inventory";
  const timeCls =
    mm >= 10 ? "text-destructive font-black" : mm >= 5 ? "text-module-cash" : "text-module-inventory";
  const food = t.lines.filter((l) => l.kitchen);
  const drinks = t.lines.filter((l) => !l.kitchen);

  return (
    <div className={`flex flex-col rounded-2xl border-2 bg-card ${border} shadow-sm overflow-hidden animate-in zoom-in-95`}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-secondary/40">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-xl font-black text-foreground">
            <span>#{t.id}</span>
            {isFresh && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white uppercase tracking-wider animate-bounce">
                ¡NUEVA!
              </span>
            )}
          </div>
          <span className="mt-0.5 inline-block rounded-md bg-secondary border border-border px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {t.type === "takeout" ? "🥡 Para Llevar" : `🍽️ ${t.table}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => playKitchenBell()}
            className="p-1 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-secondary transition"
            title="Sonar timbre de cocina"
          >
            <Bell className="h-4 w-4" />
          </button>
          <div className={`font-mono text-2xl font-extrabold tabular-nums ${timeCls}`}>
            {String(mm).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
          </div>
        </div>
      </div>
      <ul className="flex-1 space-y-2.5 px-4 py-3.5">
        {food.map((l, i) => (
          <li key={i} className="border-b border-border/60 pb-2 last:border-0 last:pb-0">
            <div className="text-sm font-bold uppercase text-foreground flex items-center gap-2">
              <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-xs font-black text-primary-foreground">
                {l.qty}X
              </span>
              {l.short}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {l.modifiers.map((m) => (
                <span
                  key={m}
                  className="rounded-md bg-module-inventory-light px-2 py-0.5 text-[11px] font-medium text-module-inventory"
                >
                  + {m}
                </span>
              ))}
              {l.note && (
                <span className="rounded-md bg-module-cash-light px-2 py-0.5 text-[11px] font-bold text-module-cash">
                  ** {l.note} **
                </span>
              )}
            </div>
          </li>
        ))}
        {drinks.length > 0 && (
          <li className="mt-2 border-t border-dashed border-border pt-2 text-xs text-muted-foreground">
            🥤 Barra / Bebidas: {drinks.map((d) => `${d.qty}× ${d.short}`).join(", ")}
          </li>
        )}
      </ul>
      <div className="grid grid-cols-3 gap-1.5 p-2.5 bg-secondary/30 border-t border-border">
        <span
          className={`rounded-lg py-2 text-center text-xs font-bold ${
            t.kdsStatus === "fryer" ? "bg-module-cash-light text-module-cash" : "text-muted-foreground"
          }`}
        >
          ⏱️ Freidora
        </span>
        <button
          disabled={t.kdsStatus !== "fryer"}
          onClick={() => onAdvance("ready")}
          className={`rounded-lg py-2 text-xs font-bold transition ${
            t.kdsStatus === "ready"
              ? "bg-module-inventory text-white"
              : "bg-secondary text-foreground hover:bg-module-inventory hover:text-white disabled:opacity-35"
          }`}
        >
          ✅ Listo
        </button>
        <button
          disabled={t.kdsStatus !== "ready"}
          onClick={() => onAdvance("dispatched")}
          className="rounded-lg bg-secondary py-2 text-xs font-bold text-foreground transition hover:bg-primary hover:text-primary-foreground disabled:opacity-35"
        >
          📦 Despacho
        </button>
      </div>
    </div>
  );
}
