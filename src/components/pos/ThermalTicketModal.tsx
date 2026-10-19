import { useState } from "react";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";
import type { Order } from "@/types/pos";
import { Modal, btnGhost, btnPrimary } from "./Modal";
import { TENDER_LABEL } from "./PaymentModal";

type Tab = "control" | "invoice" | "kitchen";

export function ThermalTicketModal() {
  const pos = usePos();
  const order = pos.orders.find((o) => o.id === pos.ticketOrderId);
  const defaultTab: Tab = order?.operationMode === "fiscal_seniat" ? "invoice" : "control";
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [width, setWidth] = useState<80 | 58>(pos.companySettings.printerWidth === "80mm" ? 80 : 58);
  const [printing, setPrinting] = useState<Tab[] | null>(null);

  if (!order) return null;

  function print(which: Tab[]) {
    setPrinting(which);
    setTimeout(() => {
      window.print();
      setPrinting(null);
    }, 50);
  }

  const close = () => {
    pos.setModal(null);
    pos.setTicketOrderId(null);
  };
  const w = width === 80 ? "w-[302px]" : "w-[224px]";

  return (
    <>
      <Modal
        title={`🧾 Ticket #${order.id} · ${order.operationMode === "fiscal_seniat" ? `Factura ${order.invoiceNo}` : `Nota de Control #${order.invoiceNo}`}`}
        onClose={close}
        footer={
          <div className="flex justify-end gap-2">
            <button className={btnGhost} onClick={() => print([tab, "kitchen"])}>
              📑 Imprimir Recibo + Comanda
            </button>
            <button className={btnPrimary} onClick={() => print([tab])}>
              🖨️ Imprimir ({width}mm)
            </button>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 p-1 rounded-xl border border-border bg-secondary">
            <button
              onClick={() => {
                setTab("control");
                setWidth(58);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === "control" ? "bg-violet-600 text-white shadow-2xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📋 Nota de Control (Sin IVA)
            </button>
            <button
              onClick={() => setTab("invoice")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === "invoice" ? "bg-card text-primary shadow-2xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🧾 Factura Fiscal SENIAT
            </button>
            <button
              onClick={() => setTab("kitchen")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === "kitchen" ? "bg-card text-primary shadow-2xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🍳 Comanda Freidoras
            </button>
          </div>
          <div className="flex gap-1">
            {([58, 80] as const).map((v) => (
              <button
                key={v}
                onClick={() => setWidth(v)}
                className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition ${
                  width === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-muted-foreground"
                }`}
                title={v === 58 ? "Impresora térmica chiquita 58×80mm" : "Impresora térmica 80mm"}
              >
                {v === 58 ? "58×80mm (Chiquita)" : "80mm"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center rounded-xl bg-secondary/60 p-6 border border-border">
          <div className={`${w} bg-[#faf7f0] text-[#1a2926] p-4 shadow-xl border border-[#e2d9c4] rounded-xs`}>
            {tab === "control" ? <ControlNote o={order} /> : tab === "invoice" ? <Invoice o={order} /> : <Kitchen o={order} />}
          </div>
        </div>
      </Modal>
      {printing && (
        <div className="print-area">
          {printing.map((t, i) => (
            <div key={t} className={w} style={{ pageBreakAfter: i < printing.length - 1 ? "always" : "auto", padding: 8 }}>
              {t === "control" ? <ControlNote o={order} /> : t === "invoice" ? <Invoice o={order} /> : <Kitchen o={order} />}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const Hr = () => <div className="my-1.5 border-t border-dashed border-black" />;
const L = ({ a, b, bold }: { a: string; b: string; bold?: boolean }) => (
  <div className={`flex justify-between gap-2 ${bold ? "font-bold" : ""}`}>
    <span>{a}</span>
    <span className="text-right">{b}</span>
  </div>
);

function ControlNote({ o }: { o: Order }) {
  const d = new Date(o.createdAt);
  const hasCredit = o.payments.some((p) => p.type === "credito");
  return (
    <div className="font-mono text-[11px] leading-snug">
      <div className="text-center">
        <div className="mx-auto mb-1 inline-block rounded bg-violet-700 px-2 py-0.5 text-[10px] font-bold text-white tracking-wider">
          CONTROL INTERNO · NOTA DE ENTREGA
        </div>
        <div className="text-sm font-bold">DR. EMPANADAS C.A.</div>
        <div className="text-[10px]">Sucursal Chacao · Caracas</div>
      </div>
      <Hr />
      <L a="Recibo Control:" b={`#${o.id} (${o.invoiceNo})`} bold />
      <L a="Fecha:" b={`${d.toLocaleDateString("es-VE")} ${d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}`} />
      <L a="Atendido por:" b={o.cashier} />
      <L a="Tasa del día:" b={`Bs. ${o.rate.toFixed(2)} / $`} />
      <Hr />
      <L a="Cliente:" b={o.customer?.name ?? "Cliente Mostrador"} bold={hasCredit} />
      {o.customer?.rif && <L a="Doc / ID:" b={o.customer.rif} />}
      <Hr />
      {o.lines.map((l, i) => (
        <div key={i} className="mb-0.5">
          <div className="font-semibold">
            {l.qty} x {l.name}
          </div>
          <L a={`   ${fmtUsd(l.unitUsd)} c/u`} b={`${fmtUsd(l.unitUsd * l.qty)} (${fmtBs(l.unitUsd * o.rate * l.qty)})`} />
        </div>
      ))}
      {o.discountPct > 0 && <L a={`Descuento (${o.discountPct}%)`} b="Aplicado" />}
      <Hr />
      <L a="TOTAL DIVISAS ($):" b={fmtUsd(o.totalUsd)} bold />
      <L a="TOTAL BOLÍVARES:" b={fmtBs(o.totalBs)} bold />
      <Hr />
      <div className="text-[10px] font-bold uppercase mb-0.5">Forma de Pago / Registro:</div>
      {o.payments.map((p) => (
        <L
          key={p.id}
          a={TENDER_LABEL[p.type] + (p.reference ? ` ···${p.reference}` : "")}
          b={p.amountUsd ? `${fmtUsd(p.amountUsd)} (${fmtBs(p.amountBs)})` : fmtBs(p.amountBs)}
          bold={p.type === "credito"}
        />
      ))}
      {hasCredit && (
        <div className="mt-1.5 border border-black p-1 text-center text-[10px] font-bold">
          PENDIENTE POR COBRAR (DEUDOR)
          <br />
          Firma Cliente: __________________
        </div>
      )}
      {o.changeBs > 0 && <L a="Vuelto Entregado:" b={fmtBs(o.changeBs)} />}
      <Hr />
      <div className="text-center text-[10px] font-semibold">
        SIN DERECHO A CRÉDITO FISCAL
        <br />
        Comprobante de Control Interno · ¡Gracias!
      </div>
    </div>
  );
}

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
          <div>
            {l.qty} x {l.name}
          </div>
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
        <L
          key={p.id}
          a={TENDER_LABEL[p.type] + (p.reference ? ` ···${p.reference}` : "")}
          b={p.amountUsd ? fmtUsd(p.amountUsd) : fmtBs(p.amountBs)}
        />
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
      <div className="bg-black py-1 text-center text-lg font-black text-white">COMANDA #{o.id}</div>
      <div className="mt-1 flex justify-between font-bold">
        <span>{o.type === "takeout" ? "PARA LLEVAR" : o.table?.toUpperCase()}</span>
        <span>{new Date(o.createdAt).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      <Hr />
      {items.length === 0 && <div>(sin ítems de cocina)</div>}
      {items.map((l, i) => (
        <div key={i} className="mb-1">
          <div className="text-base font-black">
            [ {l.qty}X ] {l.short.toUpperCase()}
          </div>
          {l.modifiers.map((m) => (
            <div key={m}> + {m}</div>
          ))}
          {l.note && <div className="font-bold"> ** {l.note.toUpperCase()} **</div>}
        </div>
      ))}
    </div>
  );
}
