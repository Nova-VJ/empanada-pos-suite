import { Button } from "@/components/ui/button";
import { useState } from "react";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";
import type { Order } from "@/types/pos";
import { Modal, btnGhost, btnPrimary } from "./Modal";
import { TENDER_LABEL } from "./PaymentModal";

type Tab = "invoice" | "kitchen";

export function ThermalTicketModal() {
  const pos = usePos();
  const order = pos.orders.find((o) => o.id === pos.ticketOrderId);
  const [tab, setTab] = useState<Tab>("invoice");
  const [width, setWidth] = useState<80 | 58>(80);
  const [printing, setPrinting] = useState<Tab[] | null>(null);

  if (!order) return null;

  function print(which: Tab[]) {
    setPrinting(which);
    setTimeout(() => {
      window.print();
      setPrinting(null);
    }, 50);
  }

  const close = () => { pos.setModal(null); pos.setTicketOrderId(null); };
  const w = width === 80 ? "w-[302px]" : "w-[219px]";

  return (
    <>
      <Modal
        title={`Ticket #${order.id}`}
        onClose={close}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="plain" className={btnGhost} onClick={() => print(["invoice", "kitchen"])}>Imprimir Ambos</Button>
            <Button variant="plain" className={btnPrimary} onClick={() => print([tab])}>Imprimir Ticket</Button>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5 p-1 rounded-lg border border-border bg-background">
            <Button variant="plain"
              onClick={() => setTab("invoice")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                tab === "invoice" ? "bg-accent-soft border border-primary/50 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Factura Fiscal SENIAT
            </Button>
            <Button variant="plain"
              onClick={() => setTab("kitchen")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                tab === "kitchen" ? "bg-accent-soft border border-primary/50 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Comanda Freidoras
            </Button>
          </div>
          <div className="flex gap-1">
            {([80, 58] as const).map((v) => (
              <Button variant="plain"
                key={v}
                onClick={() => setWidth(v)}
                className={`rounded-md border px-2.5 py-1 font-mono text-xs font-bold transition ${
                  width === v ? "border-primary bg-primary/20 text-warning" : "border-border bg-background text-muted-foreground"
                }`}
              >
                {v}mm
              </Button>
            ))}
          </div>
        </div>
        <div className="flex justify-center rounded-lg bg-overlay p-6  border border-secondary">
          <div className={`${w} bg-paper text-ink p-4  border border-paper rounded-sm`}>
            {tab === "invoice" ? <Invoice o={order} /> : <Kitchen o={order} />}
          </div>
        </div>
      </Modal>
      {printing && (
        <div className="print-area">
          {printing.map((t, i) => (
            <div key={t} className={w} style={{ pageBreakAfter: i < printing.length - 1 ? "always" : "auto", padding: 8 }}>
              {t === "invoice" ? <Invoice o={order} /> : <Kitchen o={order} />}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const Hr = () => <div className="my-1.5 border-t border-dashed border-ink" />;
const L = ({ a, b, bold }: { a: string; b: string; bold?: boolean }) => (
  <div className={`flex justify-between gap-2 ${bold ? "font-bold" : ""}`}><span>{a}</span><span className="text-right">{b}</span></div>
);

function Invoice({ o }: { o: Order }) {
  const d = new Date(o.createdAt);
  return (
    <div className="font-mono text-[11px] leading-snug">
      <div className="text-center">
        <div className="font-bold">SENIAT</div>
        <div className="text-sm font-bold">DR. EMPANADAS C.A.</div>
        <div>RIF: J-50123456-7</div>
        <div>Av. Francisco de Miranda, Barra Chacao</div>
        <div>Caracas, Venezuela</div>
      </div>
      <Hr />
      <div className="text-center font-bold">FACTURA</div>
      <L a="Factura:" b={o.invoiceNo} />
      <L a="Nº Control:" b={o.controlNo} />
      <L a="Fecha:" b={`${d.toLocaleDateString("es-VE")} ${d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}`} />
      <L a="Cajero:" b={o.cashier} />
      <L a="Tasa BCV:" b={`Bs. ${o.rate.toFixed(2)}`} />
      <Hr />
      {o.customer ? (
        <>
          <L a="Cliente:" b={o.customer.name} />
          <L a="RIF/CI:" b={o.customer.rif} />
          <Hr />
        </>
      ) : (
        <>
          <L a="Cliente:" b="Consumidor Final" />
          <Hr />
        </>
      )}
      {o.lines.map((l, i) => (
        <div key={i}>
          <div>{l.qty} x {l.name}</div>
          <L a={`   @ ${fmtBs(l.unitUsd * o.rate)} (G)`} b={fmtBs(l.unitUsd * o.rate * l.qty)} />
        </div>
      ))}
      {o.discountPct > 0 && <L a={`Descuento ${o.discountPct === 100 ? "Cortesía" : o.discountPct + "%"}`} b="aplicado" />}
      <Hr />
      <L a="BI G (16%)" b={fmtBs(o.baseBs)} />
      <L a="IVA G (16%)" b={fmtBs(o.ivaBs)} />
      <L a="IGTF (3%)" b={fmtBs(o.igtfBs)} />
      <Hr />
      <L a="TOTAL Bs." b={fmtBs(o.totalBs)} bold />
      <L a="REF USD" b={fmtUsd(o.totalBs / o.rate)} />
      <Hr />
      {o.payments.map((p) => (
        <L key={p.id} a={TENDER_LABEL[p.type] + (p.reference ? ` ···${p.reference}` : "")} b={p.amountUsd ? fmtUsd(p.amountUsd) : fmtBs(p.amountBs)} />
      ))}
      {o.changeBs > 0 && <L a="Vuelto" b={fmtBs(o.changeBs)} />}
      <Hr />
      <div className="text-center font-bold">MH ZPA0012345 · ¡Gracias por su compra!</div>
    </div>
  );
}

function Kitchen({ o }: { o: Order }) {
  const items = o.lines.filter((l) => l.kitchen);
  return (
    <div className="font-mono text-[13px] leading-snug">
      <div className="bg-ink py-1 text-center text-lg font-black text-foreground">COMANDA #{o.id}</div>
      <div className="mt-1 flex justify-between font-bold">
        <span>{o.type === "takeout" ? "PARA LLEVAR" : o.table?.toUpperCase()}</span>
        <span>{new Date(o.createdAt).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      <Hr />
      {items.length === 0 && <div>(sin ítems de cocina)</div>}
      {items.map((l, i) => (
        <div key={i} className="mb-1">
          <div className="text-base font-black">[ {l.qty}X ] {l.short.toUpperCase()}</div>
          {l.modifiers.map((m) => <div key={m}>  + {m}</div>)}
          {l.note && <div className="font-bold">  ** {l.note.toUpperCase()} **</div>}
        </div>
      ))}
    </div>
  );
}
