import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { usePos } from "@/context/PosContext";
import { KdsTicketCard } from "@/components/pos/KdsTicketCard";
import { playKitchenBell } from "@/services/sound";

export const Route = createFileRoute("/kds")({
  head: () => ({
    meta: [
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
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-3">
        <span className="mr-2 text-sm font-semibold text-slate-300">🍳 Pendiente en freidora:</span>
        {flavors.size === 0 && <span className="text-sm text-slate-500">Nada pendiente</span>}
        {[...flavors.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => (
          <span key={k} className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1 font-mono text-sm font-bold text-amber-400">{v} {k}</span>
        ))}
        <button onClick={() => setShowDone((s) => !s)} className="ml-auto rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">
          {showDone ? "← Ver activos" : "Ver despachados"}
        </button>
      </div>
      {active.length === 0 ? (
        <div className="py-24 text-center text-slate-500">
          <div className="text-5xl">✨</div>
          <p className="mt-3">{showDone ? "Aún no hay órdenes despachadas" : "Cocina al día — esperando órdenes de caja"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {active.map((t) => <KdsTicketCard key={t.id} t={t} now={pos.now} onAdvance={(s) => pos.advanceKds(t.id, s)} />)}
        </div>
      )}
    </div>
  );
}
