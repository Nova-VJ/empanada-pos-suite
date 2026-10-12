import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { usePos } from "@/context/PosContext";
import { KdsTicketCard } from "@/components/pos/KdsTicketCard";
import { playKitchenBell } from "@/services/sound";

export const Route = createFileRoute("/kds")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Cocina KDS · Dr. Empanadas" },
      { name: "description", content: "Pantalla de cocina y freidoras con temporizadores en vivo." },
      { property: "og:title", content: "Cocina KDS · Dr. Empanadas" },
      { property: "og:description", content: "Estación de freidoras con estados y alertas de demora." },
    ],
  }),
  component: Kds,
});

function Kds() {
  const pos = usePos();
  const [showDone, setShowDone] = useState(false);
  const active = pos.orders.filter((o) => o.lines.some((l) => l.kitchen) && (showDone ? o.kdsStatus === "dispatched" : o.kdsStatus !== "dispatched")).sort((a, b) => a.createdAt - b.createdAt);
  const pendingFryer = pos.orders.filter((o) => o.kdsStatus === "fryer");

  // Ring when a new ticket appears (e.g. from another tab)
  const seen = useRef(pendingFryer.length);
  useEffect(() => {
    if (pendingFryer.length > seen.current) playKitchenBell();
    seen.current = pendingFryer.length;
  }, [pendingFryer.length]);

  const flavors = new Map<string, number>();
  for (const o of pendingFryer) for (const l of o.lines) if (l.kitchen) flavors.set(l.short, (flavors.get(l.short) ?? 0) + l.qty);

  return (
    <div className="p-5 bg-background min-h-[calc(100vh-65px)]">
      <div className="mb-5 flex flex-wrap items-center gap-2.5 rounded-lg border border-border bg-card p-4 ">
        <span className="mr-2 font-sans text-sm font-bold text-foreground">Pendiente en freidora:</span>
        {flavors.size === 0 && <span className="text-xs text-muted-foreground">Freidoras al día (sin pedidos pendientes)</span>}
        {[...flavors.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => (
          <span key={k} className="rounded-md border border-primary/40 bg-primary/15 px-3.5 py-1.5 font-mono text-xs font-bold text-warning ">
            {v} {k}
          </span>
        ))}
        <Button variant="plain"
          onClick={() => setShowDone((s) => !s)}
          className="ml-auto rounded-md border border-border bg-background px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground transition"
        >
          {showDone ? "← Ver activos" : "Ver despachados"}
        </Button>
      </div>
      {active.length === 0 ? (
        <div className="py-28 text-center text-muted-foreground">
          <div className="text-5xl"></div>
          <p className="mt-3 text-base font-sans text-muted-foreground">{showDone ? "Aún no hay órdenes despachadas" : "Cocina al día — esperando órdenes de caja"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {active.map((t) => <KdsTicketCard key={t.id} t={t} now={pos.now} onAdvance={(s) => pos.advanceKds(t.id, s)} />)}
        </div>
      )}
    </div>
  );
}
