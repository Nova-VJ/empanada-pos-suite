import { Button } from "@/components/ui/button";
import type { KdsTicket } from "@/types/pos";

export function KdsTicketCard({ t, now, onAdvance }: { t: KdsTicket; now: number; onAdvance: (s: "ready" | "dispatched") => void }) {
  const secs = Math.max(0, Math.floor((now - t.createdAt) / 1000));
  const mm = Math.floor(secs / 60);
  const border = mm >= 10 ? "border-destructive animate-pulse" : mm >= 5 ? "border-primary/70" : "border-accent/60";
  const timeCls = mm >= 10 ? "text-destructive" : mm >= 5 ? "text-warning" : "text-accent";
  const food = t.lines.filter((l) => l.kitchen);
  const drinks = t.lines.filter((l) => !l.kitchen);

  return (
    <div className={`flex flex-col rounded-lg border-2 bg-card ${border}   overflow-hidden animate-in zoom-in-95`}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-secondary">
        <div>
          <div className="font-mono text-2xl font-black text-foreground">#{t.id}</div>
          <span className="rounded-lg bg-background border border-border px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {t.type === "takeout" ? "Para Llevar" : `${t.table}`}
          </span>
        </div>
        <div className={`font-mono text-3xl font-extrabold tabular-nums ${timeCls}`}>
          {String(mm).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
        </div>
      </div>
      <ul className="flex-1 space-y-2.5 px-5 py-4 bg-background">
        {food.map((l, i) => (
          <li key={i} className="border-b border-border/60 pb-2 last:border-0 last:pb-0">
            <div className="text-base font-bold uppercase text-foreground flex items-center gap-2">
              <span className="rounded-lg bg-primary px-2 py-0.5 font-mono text-xs font-black text-background">{l.qty}X</span>
              {l.short}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {l.modifiers.map((m) => (
                <span key={m} className="rounded-md bg-accent-soft border border-accent/30 px-2 py-0.5 text-[11px] font-medium text-accent">
                  + {m}
                </span>
              ))}
              {l.note && (
                <span className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-background">
                  ** {l.note} **
                </span>
              )}
            </div>
          </li>
        ))}
        {drinks.length > 0 && (
          <li className="mt-2 border-t border-dashed border-border pt-2 text-xs text-muted-foreground">
            Barra / Bebidas: {drinks.map((d) => `${d.qty}× ${d.short}`).join(", ")}
          </li>
        )}
      </ul>
      <div className="grid grid-cols-3 gap-1.5 p-2.5 bg-background border-t border-border">
        <span className={`rounded-md py-2 text-center text-xs font-bold ${t.kdsStatus === "fryer" ? "bg-primary/20 text-warning" : "text-muted-foreground"}`}>
          Freidora
        </span>
        <Button variant="plain"
          disabled={t.kdsStatus !== "fryer"}
          onClick={() => onAdvance("ready")}
          className={`rounded-md py-2 text-xs font-bold transition ${
            t.kdsStatus === "ready"
              ? "bg-accent/30 text-accent"
              : "bg-secondary text-foreground hover:bg-accent hover:text-background disabled:opacity-30 disabled:hover:bg-secondary"
          }`}
        >
          Listo
        </Button>
        <Button variant="plain"
          disabled={t.kdsStatus !== "ready"}
          onClick={() => onAdvance("dispatched")}
          className="rounded-md bg-secondary py-2 text-xs font-bold text-foreground transition hover:bg-primary hover:text-background disabled:opacity-30 disabled:hover:bg-secondary"
        >
          Despacho
        </Button>
      </div>
    </div>
  );
}
