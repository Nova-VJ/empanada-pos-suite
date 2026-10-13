import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Flame, CheckCircle2 } from "lucide-react";
import { usePos } from "@/context/PosContext";
import { KdsTicketCard } from "@/components/pos/KdsTicketCard";
import { playKitchenBell } from "@/services/sound";

export const Route = createFileRoute("/kds")({
  head: () => ({
    meta: [
      { title: "Cocina KDS · NovaSystem × Dr. Empanadas" },
      { name: "description", content: "Pantalla de cocina y freidoras con temporizadores en vivo." },
      { property: "og:title", content: "Cocina KDS · NovaSystem × Dr. Empanadas" },
      { property: "og:description", content: "Estación de freidoras con estados y alertas de demora." },
    ],
  }),
  component: Kds,
});

export function Kds() {
  const pos = usePos();
  const [showDone, setShowDone] = useState(false);
  const active = pos.orders
    .filter((o) => o.lines.some((l) => l.kitchen) && (showDone ? o.kdsStatus === "dispatched" : o.kdsStatus !== "dispatched"))
    .sort((a, b) => a.createdAt - b.createdAt);
  const pendingFryer = pos.orders.filter((o) => o.kdsStatus === "fryer");

  const seen = useRef(pendingFryer.length);
  useEffect(() => {
    if (pendingFryer.length > seen.current) playKitchenBell();
    seen.current = pendingFryer.length;
  }, [pendingFryer.length]);

  const flavors = new Map<string, number>();
  for (const o of pendingFryer) {
    for (const l of o.lines) {
      if (l.kitchen) flavors.set(l.short, (flavors.get(l.short) ?? 0) + l.qty);
    }
  }

  return (
    <div className="p-6 bg-background min-h-[calc(100vh-56px)]">
      <div className="mb-5 flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-card p-4 shadow-2xs">
        <div className="flex items-center gap-2 mr-2">
          <div className="h-8 w-8 rounded-lg bg-module-inventory-light flex items-center justify-center">
            <Flame className="h-4 w-4 text-module-inventory" />
          </div>
          <span className="text-sm font-semibold text-foreground">Pendiente en freidora:</span>
        </div>
        {flavors.size === 0 && (
          <span className="text-xs text-muted-foreground">Freidoras al día (sin pedidos pendientes)</span>
        )}
        {[...flavors.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => (
            <span
              key={k}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs font-bold text-amber-700 dark:text-amber-300"
            >
              {v} × {k}
            </span>
          ))}
        <button
          onClick={() => setShowDone((s) => !s)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/70 px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          {showDone ? "← Ver comandas activas" : "Ver órdenes despachadas"}
        </button>
      </div>
      {active.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          <div className="mx-auto mb-3.5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
            <CheckCircle2 className="h-8 w-8 stroke-[2.25]" />
          </div>
          <p className="text-base font-semibold text-foreground">
            {showDone ? "Aún no hay órdenes despachadas" : "Cocina al día — esperando comandas de caja"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {showDone ? "Las órdenes despachadas se archivarán aquí" : "Las nuevas órdenes ingresadas en caja aparecerán y sonarán automáticamente"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {active.map((t) => (
            <KdsTicketCard key={t.id} t={t} now={pos.now} onAdvance={(s) => pos.advanceKds(t.id, s)} />
          ))}
        </div>
      )}
    </div>
  );
}
