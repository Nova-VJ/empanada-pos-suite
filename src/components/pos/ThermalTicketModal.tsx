import { useState } from "react";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";
import type { Order, TicketConfig } from "@/types/pos";
import { Modal, btnGhost, btnPrimary } from "./Modal";
import { TENDER_LABEL } from "./PaymentModal";
import { Printer, Settings2, Sliders, Check, Share2 } from "lucide-react";
import { toast } from "sonner";

type Tab = "control" | "invoice" | "kitchen";

export function ThermalTicketModal() {
  const pos = usePos();
  const order = pos.orders.find((o) => o.id === pos.ticketOrderId);
  const defaultTab: Tab = order?.operationMode === "fiscal_seniat" ? "invoice" : "control";
  const [tab, setTab] = useState<Tab>(defaultTab);

  // Configuración del ticket (personalizable por el usuario)
  const [showConfig, setShowConfig] = useState(false);
  const [width, setWidth] = useState<80 | 58>(
    pos.companySettings.ticketConfig?.width === "58mm" || pos.companySettings.printerWidth === "58mm" ? 58 : 80
  );
  const [density, setDensity] = useState<"compact" | "normal" | "large">(
    pos.companySettings.ticketConfig?.density || "normal"
  );
  const [showLogo, setShowLogo] = useState(pos.companySettings.ticketConfig?.showLogo ?? true);
  const [showFiscalData, setShowFiscalData] = useState(pos.companySettings.ticketConfig?.showFiscalData ?? true);
  const [showBcvRate, setShowBcvRate] = useState(pos.companySettings.ticketConfig?.showBcvRate ?? true);
  const [footerMsg, setFooterMsg] = useState(
    pos.companySettings.ticketConfig?.footerMessage || `¡Gracias por preferir a ${pos.companySettings.name}! Vuelva pronto`
  );

  const [printing, setPrinting] = useState<Tab[] | null>(null);

  if (!order) return null;

  function print(which: Tab[]) {
    // Save current ticket configuration into pos settings
    pos.updateCompanySettings({
      printerWidth: width === 80 ? "80mm" : "58mm",
      ticketConfig: {
        width: width === 80 ? "80mm" : "58mm",
        density,
        showLogo,
        showFiscalData,
        showTaxBreakdown: true,
        showBcvRate,
        footerMessage: footerMsg,
        autoCut: true,
      },
    });

    setPrinting(which);
    setTimeout(() => {
      window.print();
      setPrinting(null);
      toast.success("Impresión enviada a la impresora de tickets", {
        description: `Formato: ${width}mm · Modo: ${which.join(" + ")}`,
      });
    }, 60);
  }

  function handleShareWhatsApp() {
    const text = `*${pos.companySettings.name}*\nComprobante #${order?.id} (${order?.invoiceNo})\nTotal: ${fmtUsd(order?.totalUsd || 0)} (${fmtBs(order?.totalBs || 0)})\n¡Gracias por tu compra!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  const close = () => {
    pos.setModal(null);
    pos.setTicketOrderId(null);
  };

  const w = width === 80 ? "w-[304px]" : "w-[226px]";
  const fontCls =
    density === "compact"
      ? "text-[10px] leading-tight"
      : density === "large"
        ? "text-[12px] leading-normal"
        : "text-[11px] leading-snug";

  return (
    <>
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-primary" />
            <span>
              Ticket #{order.id} ·{" "}
              {order.operationMode === "fiscal_seniat" ? `Factura ${order.invoiceNo}` : `Nota de Control #${order.invoiceNo}`}
            </span>
          </div>
        }
        onClose={close}
        width="max-w-2xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="rounded-xl border border-border bg-secondary/80 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary flex items-center gap-1.5 transition"
            >
              <Settings2 className="h-3.5 w-3.5 text-primary" />
              <span>{showConfig ? "Ocultar Ajustes" : "Ajustar Tamaño & Composición"}</span>
            </button>

            <div className="flex items-center gap-2">
              <button onClick={handleShareWhatsApp} className={btnGhost} title="Enviar comprobante por WhatsApp">
                <Share2 className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </button>
              <button className={btnGhost} onClick={() => print([tab, "kitchen"])}>
                📑 Recibo + Cocina
              </button>
              <button className={btnPrimary} onClick={() => print([tab])}>
                🖨️ Imprimir ({width}mm)
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Selector de Tipo de Ticket & Ancho */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1 p-1 rounded-xl border border-border bg-secondary">
              <button
                onClick={() => setTab("control")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  tab === "control"
                    ? "bg-violet-600 text-white shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📋 Control Interno (Sin IVA)
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
                🍳 Comanda Cocina KDS
              </button>
            </div>

            <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl border border-border">
              {([58, 80] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setWidth(v)}
                  className={`rounded-lg px-3 py-1 font-mono text-xs font-bold transition ${
                    width === v
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={v === 58 ? "Impresora térmica de 58mm (Móvil / Bluetooth)" : "Impresora térmica de 80mm (Estándar de mostrador)"}
                >
                  {v === 58 ? "58mm (Móvil)" : "80mm (Mostrador)"}
                </button>
              ))}
            </div>
          </div>

          {/* Panel de Ajuste de Composición (Solicitado por el usuario) */}
          {showConfig && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3 animate-in fade-in text-xs">
              <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-primary" />
                  <span>Personalizador de Composición del Ticket</span>
                </span>
                <span className="text-[10px] text-muted-foreground">Compatible con Xprinter, Epson, Bixolon, Rongta y HKA</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Tamaño de Fuente</label>
                  <select
                    value={density}
                    onChange={(e) => setDensity(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground font-medium"
                  >
                    <option value="compact">Compacta (Ahorro papel)</option>
                    <option value="normal">Normal (Recomendada)</option>
                    <option value="large">Grande (Alta legibilidad)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLogo}
                      onChange={(e) => setShowLogo(e.target.checked)}
                      className="rounded border-border text-primary"
                    />
                    <span className="text-xs text-foreground font-medium">Mostrar Logotipo</span>
                  </label>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showFiscalData}
                      onChange={(e) => setShowFiscalData(e.target.checked)}
                      className="rounded border-border text-primary"
                    />
                    <span className="text-xs text-foreground font-medium">Datos Fiscales y RIF</span>
                  </label>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBcvRate}
                      onChange={(e) => setShowBcvRate(e.target.checked)}
                      className="rounded border-border text-primary"
                    />
                    <span className="text-xs text-foreground font-medium">Tasa BCV del Día</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Mensaje de Agradecimiento al Pie del Ticket
                </label>
                <input
                  value={footerMsg}
                  onChange={(e) => setFooterMsg(e.target.value)}
                  placeholder="Ej. ¡Gracias por su visita! Vuelva pronto 🥟"
                  className="w-full rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Vista Previa del Ticket Impreso */}
          <div className="flex justify-center rounded-2xl bg-secondary/50 p-4 sm:p-6 border border-border overflow-x-auto">
            <div
              className={`${w} ${fontCls} bg-[#faf7f0] text-[#111827] p-4 shadow-xl border border-[#e2d9c4] rounded-xs font-mono transition-all duration-200 select-none`}
            >
              {tab === "control" ? (
                <ControlNote
                  o={order}
                  pos={pos}
                  showLogo={showLogo}
                  showFiscalData={showFiscalData}
                  showBcvRate={showBcvRate}
                  footerMsg={footerMsg}
                />
              ) : tab === "invoice" ? (
                <Invoice
                  o={order}
                  pos={pos}
                  showLogo={showLogo}
                  showFiscalData={showFiscalData}
                  showBcvRate={showBcvRate}
                  footerMsg={footerMsg}
                />
              ) : (
                <Kitchen o={order} />
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Área de Impresión Real (Nativa ESC/POS y Sistema) */}
      {printing && (
        <div className="print-area">
          {printing.map((t, i) => (
            <div
              key={t}
              className={`${w} ${fontCls}`}
              style={{
                pageBreakAfter: i < printing.length - 1 ? "always" : "auto",
                padding: width === 58 ? "4px" : "8px",
                fontFamily: "monospace",
                color: "#000000",
                background: "#ffffff",
              }}
            >
              {t === "control" ? (
                <ControlNote
                  o={order}
                  pos={pos}
                  showLogo={showLogo}
                  showFiscalData={showFiscalData}
                  showBcvRate={showBcvRate}
                  footerMsg={footerMsg}
                />
              ) : t === "invoice" ? (
                <Invoice
                  o={order}
                  pos={pos}
                  showLogo={showLogo}
                  showFiscalData={showFiscalData}
                  showBcvRate={showBcvRate}
                  footerMsg={footerMsg}
                />
              ) : (
                <Kitchen o={order} />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const Hr = () => <div className="my-1.5 border-t border-dashed border-black/80" />;
const L = ({ a, b, bold }: { a: string; b: string; bold?: boolean }) => (
  <div className={`flex justify-between gap-1.5 ${bold ? "font-bold" : ""}`}>
    <span className="truncate">{a}</span>
    <span className="text-right shrink-0">{b}</span>
  </div>
);

function ControlNote({
  o,
  pos,
  showLogo,
  showFiscalData,
  showBcvRate,
  footerMsg,
}: {
  o: Order;
  pos: any;
  showLogo: boolean;
  showFiscalData: boolean;
  showBcvRate: boolean;
  footerMsg: string;
}) {
  const d = new Date(o.createdAt);
  const hasCredit = o.payments.some((p) => p.type === "credito");
  return (
    <div>
      <div className="text-center">
        {showLogo && (
          <div className="flex justify-center mb-1">
            <img src="/logo.png" alt="Logo" className="h-9 w-9 object-contain filter grayscale contrast-200" />
          </div>
        )}
        <div className="mx-auto mb-1 inline-block rounded bg-black px-2 py-0.5 text-[9px] font-bold text-white tracking-wider">
          CONTROL INTERNO · NOTA DE ENTREGA
        </div>
        <div className="text-xs font-black uppercase tracking-tight">{pos.companySettings.name}</div>
        {showFiscalData && (
          <>
            <div className="text-[10px] font-semibold">{pos.companySettings.rif}</div>
            <div className="text-[9px] text-gray-700">{pos.companySettings.address}</div>
            <div className="text-[9px] text-gray-700">Tlf: {pos.companySettings.phone}</div>
          </>
        )}
      </div>

      <Hr />
      <L a="Recibo Control:" b={`#${o.id} (${o.invoiceNo})`} bold />
      <L
        a="Fecha:"
        b={`${d.toLocaleDateString("es-VE")} ${d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}`}
      />
      <L a="Atendido por:" b={o.cashier} />
      {showBcvRate && <L a="Tasa Oficial BCV:" b={`Bs. ${o.rate.toFixed(2)}`} />}
      <Hr />
      <L a="Cliente:" b={o.customer?.name ?? "Cliente Mostrador"} bold={hasCredit} />
      {o.customer?.rif && <L a="Doc / C.I.:" b={o.customer.rif} />}
      <Hr />

      <div className="mb-1 font-bold text-[10px] uppercase">Detalle del Pedido:</div>
      {o.lines.map((l, i) => (
        <div key={i} className="mb-1">
          <div className="font-bold">
            {l.qty} x {l.name}
          </div>
          {l.modifiers && l.modifiers.length > 0 && (
            <div className="text-[9px] text-gray-700 italic pl-2">+ {l.modifiers.join(", ")}</div>
          )}
          <L a={`   @ ${fmtUsd(l.unitUsd)} c/u`} b={`${fmtUsd(l.unitUsd * l.qty)} (${fmtBs(l.unitUsd * o.rate * l.qty)})`} />
        </div>
      ))}
      {o.discountPct > 0 && <L a={`Descuento (${o.discountPct}%)`} b="Aplicado" />}

      <Hr />
      <L a="TOTAL DIVISAS ($):" b={fmtUsd(o.totalUsd)} bold />
      <L a="TOTAL BOLÍVARES:" b={fmtBs(o.totalBs)} bold />
      <Hr />

      <div className="text-[10px] font-bold uppercase mb-0.5">Formas de Pago:</div>
      {o.payments.map((p) => (
        <L
          key={p.id}
          a={TENDER_LABEL[p.type] + (p.reference ? ` Ref: ${p.reference}` : "")}
          b={p.amountUsd ? `${fmtUsd(p.amountUsd)} (${fmtBs(p.amountBs)})` : fmtBs(p.amountBs)}
          bold={p.type === "credito"}
        />
      ))}
      {hasCredit && (
        <div className="mt-1.5 border border-black p-1 text-center text-[9px] font-bold">
          CUENTA POR COBRAR PENDIENTE (CRÉDITO)
          <br />
          Firma Conforme: ____________________
        </div>
      )}
      {o.changeBs > 0 && <L a="Vuelto Entregado:" b={fmtBs(o.changeBs)} bold />}

      <Hr />
      <div className="text-center text-[9px] space-y-0.5">
        <div>SIN DERECHO A CRÉDITO FISCAL</div>
        <div className="font-bold">{footerMsg}</div>
        <div className="text-[8px] text-gray-600">Impreso por NovaSystem POS · San Jacinto, Maracay</div>
      </div>
    </div>
  );
}

function Invoice({
  o,
  pos,
  showLogo,
  showFiscalData,
  showBcvRate,
  footerMsg,
}: {
  o: Order;
  pos: any;
  showLogo: boolean;
  showFiscalData: boolean;
  showBcvRate: boolean;
  footerMsg: string;
}) {
  const d = new Date(o.createdAt);
  return (
    <div>
      <div className="text-center">
        {showLogo && (
          <div className="flex justify-center mb-1">
            <img src="/logo.png" alt="Logo" className="h-9 w-9 object-contain filter grayscale contrast-200" />
          </div>
        )}
        <div className="font-black text-xs">SENIAT · FACTURA FISCAL</div>
        <div className="text-xs font-black uppercase tracking-tight">{pos.companySettings.name}</div>
        {showFiscalData && (
          <>
            <div className="text-[10px] font-bold">{pos.companySettings.rif}</div>
            <div className="text-[9px] text-gray-700">{pos.companySettings.address}</div>
            <div className="text-[9px] text-gray-700">Tlf: {pos.companySettings.phone}</div>
          </>
        )}
      </div>

      <Hr />
      <div className="text-center font-bold text-[10px]">COMPROBANTE FISCAL</div>
      <L a="Factura N°:" b={o.invoiceNo} bold />
      <L a="Nº Control:" b={o.controlNo} />
      <L
        a="Fecha:"
        b={`${d.toLocaleDateString("es-VE")} ${d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}`}
      />
      <L a="Cajero:" b={o.cashier} />
      {showBcvRate && <L a="Tasa Oficial BCV:" b={`Bs. ${o.rate.toFixed(2)}`} />}
      <Hr />

      {o.customer ? (
        <>
          <L a="Razón Social:" b={o.customer.name} bold />
          <L a="RIF / C.I.:" b={o.customer.rif} bold />
          <Hr />
        </>
      ) : (
        <>
          <L a="Cliente:" b="Consumidor Final" />
          <Hr />
        </>
      )}

      {o.lines.map((l, i) => (
        <div key={i} className="mb-0.5">
          <div className="font-semibold">
            {l.qty} x {l.name}
          </div>
          <L a={`   @ ${fmtBs(l.unitUsd * o.rate)} (G)`} b={fmtBs(l.unitUsd * o.rate * l.qty)} />
        </div>
      ))}
      {o.discountPct > 0 && <L a={`Descuento (${o.discountPct}%)`} b="Aplicado" />}

      <Hr />
      <L a="Base Imponible (G 16%):" b={fmtBs(o.baseBs)} />
      <L a="IVA (16.00%):" b={fmtBs(o.ivaBs)} bold />
      {o.igtfBs > 0 && <L a="IGTF Divisas (3%):" b={fmtBs(o.igtfBs)} />}
      <Hr />
      <L a="TOTAL BOLÍVARES:" b={fmtBs(o.totalBs)} bold />
      <L a="Ref. Dólares ($):" b={fmtUsd(o.totalBs / o.rate)} />
      <Hr />

      <div className="text-[10px] font-bold uppercase mb-0.5">Formas de Pago:</div>
      {o.payments.map((p) => (
        <L
          key={p.id}
          a={TENDER_LABEL[p.type] + (p.reference ? ` Ref: ${p.reference}` : "")}
          b={p.amountUsd ? fmtUsd(p.amountUsd) : fmtBs(p.amountBs)}
        />
      ))}
      {o.changeBs > 0 && <L a="Vuelto Entregado:" b={fmtBs(o.changeBs)} />}

      <Hr />
      <div className="text-center text-[9px] space-y-0.5">
        <div className="font-mono">DISPOSITIVO FISCAL HKA COM3 · Z #{pos.fiscal.lastZ}</div>
        <div className="font-bold">{footerMsg}</div>
      </div>
    </div>
  );
}

function Kitchen({ o }: { o: Order }) {
  const items = o.lines.filter((l) => l.kitchen);
  return (
    <div>
      <div className="bg-black py-1.5 text-center text-sm font-black text-white rounded-xs">
        COMANDA FREIDORAS #{o.id}
      </div>
      <div className="mt-1.5 flex justify-between font-bold text-xs">
        <span>{o.type === "takeout" ? "📦 PARA LLEVAR" : `🍽️ MESA ${o.table || "01"}`}</span>
        <span>{new Date(o.createdAt).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      <Hr />
      {items.length === 0 && <div className="text-center py-2 text-gray-500">(Sin empanadas de freidora)</div>}
      {items.map((l, i) => (
        <div key={i} className="mb-2 border-b border-gray-300 pb-1">
          <div className="text-xs font-black">
            [{l.qty}X] {l.short.toUpperCase()}
          </div>
          {l.modifiers && l.modifiers.length > 0 && (
            <div className="text-[10px] font-bold text-black pl-2">➔ {l.modifiers.join(" · ")}</div>
          )}
        </div>
      ))}
      <div className="mt-2 text-center text-[10px] font-bold">DESPACHO COCINA · ¡MARCHA INMEDIATA!</div>
    </div>
  );
}
