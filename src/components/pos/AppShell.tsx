import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { Modal, btnPrimary, inputCls } from "./Modal";
import { PaymentModal } from "./PaymentModal";
import { ThermalTicketModal } from "./ThermalTicketModal";
import { CashShiftModal } from "./CashShiftModal";
import { FiscalPrinterModal } from "./FiscalPrinterModal";

export const SEARCH_ID = "pos-catalog-search";

export function AppShell({ children }: { children: ReactNode }) {
  const pos = usePos();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const pending = pos.orders.filter((o) => o.kdsStatus === "fryer").length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
      if (e.key === "Escape") { if (pos.modal) { pos.setModal(null); pos.setTicketOrderId(null); } else if (typing) el.blur(); return; }
      if (e.key === "F1") { e.preventDefault(); navigate({ to: "/" }); return; }
      if (e.key === "F2") { e.preventDefault(); navigate({ to: "/kds" }); return; }
      if (e.key === "F3") { e.preventDefault(); navigate({ to: "/backoffice" }); return; }
      if (pos.modal) return;
      if (e.key === "F5" || (e.key === "/" && !typing)) {
        e.preventDefault();
        if (path !== "/") navigate({ to: "/" });
        setTimeout(() => document.getElementById(SEARCH_ID)?.focus(), 30);
        return;
      }
      if ((e.key === "F10" || (e.key === " " && !typing)) && path === "/" && pos.cart.length > 0) {
        e.preventDefault();
        pos.setModal("payment");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pos, navigate, path]);

  const elapsed = pos.hydrated ? Math.max(0, pos.now - pos.shift.openedAt) : 0;
  const h = Math.floor(elapsed / 3600000), m = Math.floor((elapsed % 3600000) / 60000);

  const tab = (to: "/" | "/kds" | "/backoffice", label: string, badge?: number) => (
    <Link to={to} className={`relative rounded-lg px-3 py-2 text-sm font-medium transition ${path === to ? "bg-slate-800 text-slate-50" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"}`}>
      {label}
      {!!badge && <span className="ml-1.5 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>}
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="no-print sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
          <div className="mr-2 flex items-center gap-2">
            <span className="text-2xl">🥟</span>
            <div className="leading-tight">
              <div className="text-sm font-bold">Dr. Empanadas C.A.</div>
              <div className="font-mono text-[10px] text-slate-500">RIF: J-50123456-7 · Barra Chacao</div>
            </div>
          </div>
          <button onClick={() => pos.setModal("bcv")} className="rounded-full border border-sky-500/30 bg-sky-950/60 px-3 py-1 font-mono text-xs text-sky-400 hover:bg-sky-900/60">
            BCV: Bs. {pos.rate.toFixed(2)} / USD
          </button>
          <div className="flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900 py-0.5 pl-3 pr-0.5 text-xs">
            <span className="text-slate-300">{pos.shift.cashier} ({pos.shift.register}) · <span className="font-mono">{h}h {String(m).padStart(2, "0")}m</span></span>
            <button onClick={() => pos.setModal("shift")} className="rounded-full bg-slate-800 px-2.5 py-1 font-medium text-slate-200 hover:bg-rose-600">🔒 Arqueo / Cierre X-Z</button>
          </div>
          <button onClick={() => pos.setModal("printer")} className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 font-mono text-xs text-slate-300 hover:border-slate-600">
            🖨️ Fiscal HKA: {pos.fiscal.port} <span className={pos.fiscal.connected ? "text-emerald-400" : "text-rose-400"}>●</span>
          </button>
          <nav className="ml-auto flex gap-1">
            {tab("/", "🛒 Terminal TPV (F1)")}
            {tab("/kds", "🍳 Cocina KDS (F2)", pending)}
            {tab("/backoffice", "📊 Backoffice Gerencial (F3)")}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>

      {pos.modal === "payment" && <PaymentModal />}
      {pos.modal === "ticket" && <ThermalTicketModal />}
      {pos.modal === "shift" && <CashShiftModal />}
      {pos.modal === "printer" && <FiscalPrinterModal />}
      {pos.modal === "bcv" && <BcvModal />}
    </div>
  );
}

function BcvModal() {
  const pos = usePos();
  const [v, setV] = useState(pos.rate.toFixed(2));
  const save = () => {
    const n = parseFloat(v.replace(",", "."));
    if (!(n > 0 && n < 100000)) return toast.error("Tasa inválida");
    pos.setRate(n);
    toast.success(`Tasa BCV actualizada: Bs. ${n.toFixed(2)}`);
    pos.setModal(null);
  };
  return (
    <Modal title="Tasa Oficial BCV · Ajuste Manual" width="max-w-sm" onClose={() => pos.setModal(null)} footer={<div className="flex justify-end"><button className={btnPrimary} onClick={save}>Aplicar tasa</button></div>}>
      <label className="text-xs text-slate-400">Bs. por 1 USD
        <input autoFocus inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} className={`${inputCls} mt-1 font-mono text-xl`} />
      </label>
      <p className="mt-2 text-xs text-slate-500">Recalcula todos los precios, totales e IGTF en Bs. de la aplicación.</p>
    </Modal>
  );
}
