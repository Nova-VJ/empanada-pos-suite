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
    <div className="p-5 bg-[#0b1a18] min-h-[calc(100vh-65px)]">
      <div className="mb-5 flex flex-wrap items-center gap-2.5 rounded-3xl border border-[#1b3530] bg-[#122623] p-4 shadow-md">
        <span className="mr-2 font-serif text-sm font-bold text-[#fbf8f1]">🍳 Pendiente en freidora:</span>
        {flavors.size === 0 && <span className="text-xs text-[#7e948a]">Freidoras al día (sin pedidos pendientes)</span>}
        {[...flavors.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => (
          <span key={k} className="rounded-xl border border-[#cca06a]/40 bg-[#cca06a]/15 px-3.5 py-1.5 font-mono text-xs font-bold text-[#e0ab77] shadow-sm">
            {v} {k}
          </span>
        ))}
        <button
          onClick={() => setShowDone((s) => !s)}
          className="ml-auto rounded-xl border border-[#1b3530] bg-[#0c1816] px-3.5 py-2 text-xs font-semibold text-[#a6b9b0] hover:border-[#cca06a]/50 hover:text-[#fbf8f1] transition"
        >
          {showDone ? "← Ver activos" : "Ver despachados"}
        </button>
      </div>
      {active.length === 0 ? (
        <div className="py-28 text-center text-[#7e948a]">
          <div className="text-5xl">✨</div>
          <p className="mt-3 text-base font-serif text-[#a6b9b0]">{showDone ? "Aún no hay órdenes despachadas" : "Cocina al día — esperando órdenes de caja"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {active.map((t) => <KdsTicketCard key={t.id} t={t} now={pos.now} onAdvance={(s) => pos.advanceKds(t.id, s)} />)}
        </div>
      )}
    </div>
  );
}
