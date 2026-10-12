import { Store, ShoppingBag, CookingPot, ChartNoAxesCombined, Printer, LockKeyhole, ArrowUpRight } from "lucide-react";
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

  const tab = (to: "/" | "/kds" | "/backoffice", label: string, Icon: typeof Store, key: string, badge?: number) => (
    <Button asChild variant="plain" className={`h-10 gap-2 rounded-none border-b-2 px-3 text-sm ${path === to ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
      <Link to={to}><Icon className="h-4 w-4" />{label}<span className="hidden text-xs text-muted-foreground sm:inline">{key}</span>{!!badge && <span className="rounded bg-accent-soft px-1.5 text-xs text-accent">{badge}</span>}</Link>
    </Button>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="no-print sticky top-0 z-40 bg-background">
        <div className="flex h-16 items-center justify-between gap-4 border-b border-border px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><Store className="h-5 w-5" /></div>
            <div><div className="text-base font-semibold">Dr. Empanadas <span className="text-muted-foreground">C.A.</span></div><div className="text-[11px] text-muted-foreground">J-50123456-7 · Chacao, Caracas</div></div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="hidden text-muted-foreground sm:inline">{pos.shift.cashier} · {pos.shift.register} <span className="ml-2 font-mono">{h}h {String(m).padStart(2,"0")}m</span></span>
            <Button variant="plain" title="Arqueo X-Z" onClick={() => pos.setModal("shift")} className="gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary"><LockKeyhole /> <span className="hidden sm:inline">Arqueo X-Z</span></Button>
          </div>
        </div>
        <div className="flex h-11 items-center justify-between gap-3 border-b border-border px-4 sm:px-6">
          <nav className="flex h-full items-center gap-1" aria-label="Módulos">
            {tab("/", "Terminal", ShoppingBag, "F1")}
            {tab("/kds", "Cocina", CookingPot, "F2", pending)}
            {tab("/backoffice", "Gerencia", ChartNoAxesCombined, "F3")}
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="plain" onClick={() => pos.setModal("bcv")} className="gap-1 text-xs text-currency" title="Editar tasa BCV">BCV <span className="font-mono">{pos.rate.toFixed(2)}</span><span className="hidden text-muted-foreground lg:inline"> Bs./USD</span><ArrowUpRight className="h-3 w-3" /></Button>
            <Button variant="plain" onClick={() => pos.setModal("printer")} title="Diagnóstico impresora fiscal" className="hidden gap-2 text-xs text-muted-foreground sm:flex"><Printer /><span className="hidden lg:inline">Fiscal HKA · </span>{pos.fiscal.port}<span className={`h-1.5 w-1.5 rounded-full ${pos.fiscal.connected ? "bg-accent" : "bg-destructive"}`} /></Button>
          </div>
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
