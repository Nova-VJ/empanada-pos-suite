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
    <Link to={to} className={`relative rounded-xl px-3.5 py-2 text-xs font-semibold tracking-wide transition-all ${path === to ? "bg-[#cca06a] text-[#0b1a18] font-bold shadow-sm shadow-[#cca06a]/20" : "text-[#a6b9b0] hover:bg-[#142c27] hover:text-[#fbf8f1]"}`}>
      {label}
      {!!badge && <span className="ml-1.5 rounded-full bg-[#c85a48] px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>}
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#0b1a18] text-[#fbf8f1]">
      <header className="no-print sticky top-0 z-40 border-b border-[#1b3530] bg-[#0e1f1c]/95 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2.5 px-5 py-3">
          <div className="mr-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#dca872] to-[#b37e46] text-xl shadow-sm text-[#0b1a18]">
              🥟
            </div>
            <div className="leading-tight">
              <div className="font-serif text-base font-bold tracking-tight text-[#fbf8f1]">Dr. Empanadas C.A.</div>
              <div className="font-mono text-[10px] text-[#8fa49b]">RIF: J-50123456-7 · Sucursal Chacao</div>
            </div>
          </div>
          <button onClick={() => pos.setModal("bcv")} className="rounded-full border border-[#cca06a]/40 bg-[#cca06a]/10 px-3 py-1 font-mono text-xs font-semibold text-[#e0ab77] hover:bg-[#cca06a]/20 transition">
            BCV: Bs. {pos.rate.toFixed(2)} / USD
          </button>
          <div className="flex items-center gap-1.5 rounded-full border border-[#1b3530] bg-[#122623] py-1 pl-3.5 pr-1 text-xs">
            <span className="text-[#a6b9b0]">{pos.shift.cashier} <span className="text-[#6d847b]">({pos.shift.register})</span> · <span className="font-mono text-[#dbe5e0]">{h}h {String(m).padStart(2, "0")}m</span></span>
            <button onClick={() => pos.setModal("shift")} className="rounded-full bg-[#18332e] px-2.5 py-0.5 text-[11px] font-semibold text-[#dbe5e0] hover:bg-[#c85a48] hover:text-white transition">🔒 Arqueo X-Z</button>
          </div>
          <button onClick={() => pos.setModal("printer")} className="rounded-full border border-[#1b3530] bg-[#122623] px-3 py-1 font-mono text-xs text-[#a6b9b0] hover:border-[#2ea88c]/50 transition">
            🖨️ Fiscal HKA: {pos.fiscal.port} <span className={pos.fiscal.connected ? "text-[#2ea88c]" : "text-[#c85a48]"}>●</span>
          </button>
          <nav className="ml-auto flex items-center gap-1.5 bg-[#0a1614] p-1 rounded-2xl border border-[#1b3530]">
            {tab("/", "🛒 Terminal TPV (F1)")}
            {tab("/kds", "🍳 Cocina KDS (F2)", pending)}
            {tab("/backoffice", "📊 Backoffice Gerencial (F3)")}
          </nav>
        </div>
      </header>
      <main className="flex-1 bg-[#0b1a18]">{children}</main>

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
    if (!(n > 0 && n < 100000)) { toast.error("Tasa inválida"); return; }
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
