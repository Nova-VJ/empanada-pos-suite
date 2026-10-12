import { Button } from "@/components/ui/button";
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
    <Link to={to} className={`relative rounded-md px-3.5 py-2 text-xs font-semibold tracking-normal transition-all ${path === to ? "bg-primary text-background font-bold  " : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
      {label}
      {!!badge && <span className="ml-1.5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-foreground">{badge}</span>}
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="no-print sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2.5 px-5 py-3">
          <div className="mr-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary text-xl  text-background">
              </div>
            <div className="leading-tight">
              <div className="font-sans text-base font-bold tracking-normal text-foreground">Dr. Empanadas C.A.</div>
              <div className="font-mono text-[10px] text-muted-foreground">RIF: J-50123456-7 · Sucursal Chacao</div>
            </div>
          </div>
          <Button variant="plain" onClick={() => pos.setModal("bcv")} className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-warning hover:bg-primary/20 transition">
            BCV: Bs. {pos.rate.toFixed(2)} / USD
          </Button>
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-3.5 pr-1 text-xs">
            <span className="text-muted-foreground">{pos.shift.cashier} <span className="text-muted-foreground">({pos.shift.register})</span> · <span className="font-mono text-foreground">{h}h {String(m).padStart(2, "0")}m</span></span>
            <Button variant="plain" onClick={() => pos.setModal("shift")} className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-foreground hover:bg-destructive hover:text-foreground transition">Arqueo X-Z</Button>
          </div>
          <Button variant="plain" onClick={() => pos.setModal("printer")} className="rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground hover:border-accent/50 transition">
            Fiscal HKA: {pos.fiscal.port} <span className={pos.fiscal.connected ? "text-accent" : "text-destructive"}>●</span>
          </Button>
          <nav className="ml-auto flex items-center gap-1.5 bg-background p-1 rounded-lg border border-border">
            {tab("/", "Terminal TPV (F1)")}
            {tab("/kds", "Cocina KDS (F2)", pending)}
            {tab("/backoffice", "Backoffice Gerencial (F3)")}
          </nav>
        </div>
      </header>
      <main className="flex-1 bg-background">{children}</main>

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
    <Modal title="Tasa Oficial BCV · Ajuste Manual" width="max-w-sm" onClose={() => pos.setModal(null)} footer={<div className="flex justify-end"><Button variant="plain" className={btnPrimary} onClick={save}>Aplicar tasa</Button></div>}>
      <label className="text-xs text-muted-foreground">Bs. por 1 USD
        <input autoFocus inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} className={`${inputCls} mt-1 font-mono text-xl`} />
      </label>
      <p className="mt-2 text-xs text-muted-foreground">Recalcula todos los precios, totales e IGTF en Bs. de la aplicación.</p>
    </Modal>
  );
}
