import { useState } from "react";
import { Calculator, CheckCircle2, Leaf, Send, Truck } from "lucide-react";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";

type Assistant = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  suggestions: string[];
};

const assistants: Assistant[] = [
  {
    id: "eco-coach",
    name: "Coach Operaciones & KDS",
    description: "Ventas en vivo, tiempos de freidora, combos, mermas y rotación",
    icon: Leaf,
    color: "text-module-inventory",
    bgColor: "bg-module-inventory-light",
    suggestions: [
      "¿Cuál es el resumen de ventas y margen de hoy?",
      "¿Qué combo o promoción me sugieres para subir el ticket promedio?",
      "¿Cómo está la carga de las freidoras y el stock crítico?",
    ],
  },
  {
    id: "eco-ops",
    name: "OPS Compras & Proveedores",
    description: "Compras de harina/queso/carnes, auditoría de proveedores y órdenes",
    icon: Truck,
    color: "text-module-suppliers",
    bgColor: "bg-module-suppliers-light",
    suggestions: [
      "¿Qué proveedores tienen mejor scoring y cuáles tienen alertas?",
      "¿Qué pedidos de compra están pendientes por recibir?",
      "¿Cuánto debemos en facturas de proveedores?",
    ],
  },
  {
    id: "eco-fiscal",
    name: "Asesor Fiscal SENIAT & BCV",
    description: "Providencia 0071, IVA 16%, IGTF 3% divisas, Reporte Z y BCV",
    icon: Calculator,
    color: "text-module-accounting",
    bgColor: "bg-module-accounting-light",
    suggestions: [
      "¿Cuánto llevamos acumulado de Débito Fiscal IVA 16% e IGTF 3%?",
      "¿Cómo funciona el cálculo legal del IGTF 3% en pagos mixtos?",
      "¿Qué requisitos exige la Providencia 0071 en la impresora HKA80?",
    ],
  },
];

type Message = { role: "user" | "assistant"; content: string };

export function AssistantsModule() {
  const pos = usePos();
  const [activeAssistant, setActiveAssistant] = useState<Assistant>(assistants[0]!);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState("");

  const messages = conversations[activeAssistant.id] ?? [];

  function generateContextualReply(query: string, assistantId: string): string {
    const q = query.toLowerCase();
    const validOrders = pos.orders.filter((o) => o.status !== "anulada");
    const totalBs = validOrders.reduce((s, o) => s + o.totalBs, 0);
    const totalUsd = validOrders.reduce((s, o) => s + o.totalBs / o.rate, 0);
    const totalIvaBs = validOrders.reduce((s, o) => s + o.ivaBs, 0);
    const totalIgtfBs = validOrders.reduce((s, o) => s + o.igtfBs, 0);
    const lowStock = pos.products.filter((p) => p.stockBar < 25);
    const unpaidInvoices = pos.supplierInvoices.filter((si) => !si.paid);

    if (assistantId === "eco-fiscal") {
      if (q.includes("igtf") || q.includes("mixto")) {
        return `📌 **Cálculo Legal del IGTF (3%) en Pagos Mixtos (SENIAT):**\n\n• Según la reforma de la Ley de IGTF, la alícuota del **3%** grava exclusivamente la porción cancelada en moneda extranjera ($ USD) o criptoactivos distintos al Bolívar.\n• Si una orden en Dr. Empanadas cuesta **Bs. 365,00 ($10.00)** y el cliente abona **$5.00 en efectivo USD** y el resto por **Pago Móvil**, el sistema aplica el 3% únicamente sobre los $5.00 (**$0.15 = Bs. ${(0.15 * pos.rate).toFixed(2)}**).\n• En el turno actual llevas recaudado **${fmtBs(totalIgtfBs)}** por concepto de IGTF 3% y **${fmtBs(totalIvaBs)}** de Débito Fiscal IVA (16%).`;
      }
      return `📊 **Auditoría Fiscal SENIAT en Vivo (Sucursal Chacao):**\n\n• **RIF:** ${pos.companySettings.rif} (${pos.companySettings.name})\n• **Tasa Oficial BCV Activa:** Bs. ${pos.rate.toFixed(2)} / USD\n• **Facturas Emitidas:** ${validOrders.length} documentos (Última Factura #${String(pos.fiscal.lastInvoice).padStart(8, "0")})\n• **Débito Fiscal IVA (16%):** ${fmtBs(totalIvaBs)} (${fmtUsd(totalIvaBs / pos.rate)})\n• **IGTF Percibido (3%):** ${fmtBs(totalIgtfBs)} (${fmtUsd(totalIgtfBs / pos.rate)})\n• **Impresora Fiscal:** ${pos.fiscal.model} en puerto ${pos.fiscal.port} (Último Reporte Z #${pos.fiscal.lastZ}).\n\nRecuerda ejecutar el **Cierre Z Fiscal** al finalizar la jornada para consolidar la memoria de auditoría.`;
    }

    if (assistantId === "eco-ops") {
      const unpaidTotal = unpaidInvoices.reduce((s, i) => s + i.totalUsd, 0);
      return `🚚 **Informe de Compras, Proveedores y Abastecimiento:**\n\n• **Mejor Proveedor Evaluado:** Alimentos Polar Comercial C.A. (**Score 94/100** — Entrega 24h en Chacao) y Quesera Llanera Guárico (**Score 86/100**).\n• **Alerta de Proveedor:** Pescadería Oriente (Cazón) presenta 1 alerta de retraso logístico (Score 68/100).\n• **Cuentas por Pagar:** Tienes **${unpaidInvoices.length} facturas pendientes** por un total de **${fmtUsd(unpaidTotal)} (${fmtBs(unpaidTotal * pos.rate)})**.\n• **Pedidos en Tránsito:** ${pos.purchaseOrders.filter((p) => p.status !== "recibido" && p.status !== "facturado").length} órdenes activas. Puedes avanzarlas a *"recibido"* en el módulo **Proveedores** para sumar el stock automáticamente.`;
    }

    return `🥟 **Análisis Operativo de Dr. Empanadas (Coach NovaSystem):**\n\n• **Facturación Acumulada:** **${fmtUsd(totalUsd)} USD** (${fmtBs(totalBs)}) en **${validOrders.length} órdenes**.\n• **Ticket Promedio:** **${fmtUsd(validOrders.length ? totalUsd / validOrders.length : 0)} USD** por comanda.\n• **Cocina KDS:** Actualmente hay **${pos.orders.filter((o) => o.kdsStatus === "fryer").length} comandas** en freidora.\n• **Stock Crítico:** ${lowStock.length === 0 ? "Todos los sabores tienen buen nivel de stock en barra." : `Atención con ${lowStock.map((p) => `${p.name} (${p.stockBar} uds)`).join(", ")}.`}\n• **Recomendación Comercial:** El par más vendido es **Empanada de Pabellón + Malta Polar**. Sugerir el *"Combo Dúo Criollo ($4.80)"* en caja entre las 7:30 AM y 10:00 AM incrementa el ticket promedio un 18%.`;
  }

  function sendMessage(customText?: string) {
    const text = (customText ?? input).trim();
    if (!text) return;
    const userMsg: Message = { role: "user", content: text };
    const replyText = generateContextualReply(text, activeAssistant.id);
    const botMsg: Message = { role: "assistant", content: replyText };
    setConversations((prev) => ({
      ...prev,
      [activeAssistant.id]: [...(prev[activeAssistant.id] ?? []), userMsg, botMsg],
    }));
    if (!customText) setInput("");
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Asistentes IA Especializados</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tres copilotos inteligentes conectados en tiempo real con el inventario, ventas y contabilidad SENIAT de Dr. Empanadas
        </p>
      </div>

      {/* Assistant selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {assistants.map((a) => {
          const Icon = a.icon;
          const isActive = activeAssistant.id === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setActiveAssistant(a)}
              className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                isActive ? `${a.bgColor} border-primary/40 shadow-xs` : "bg-card hover:bg-secondary/50 border-border"
              }`}
            >
              <div className={`h-10 w-10 rounded-xl ${a.bgColor} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${a.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{a.name}</p>
                <p className="text-xs text-muted-foreground truncate">{a.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chat area */}
      <div className="rounded-xl border border-border bg-card shadow-xs flex flex-col h-[500px] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <div className={`h-14 w-14 rounded-2xl ${activeAssistant.bgColor} flex items-center justify-center mb-3`}>
                <activeAssistant.icon className={`h-7 w-7 ${activeAssistant.color}`} />
              </div>
              <h3 className="text-base font-semibold text-foreground">{activeAssistant.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">{activeAssistant.description}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2 max-w-xl">
                {activeAssistant.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3.5 py-2 text-xs font-medium text-foreground hover:border-primary hover:bg-primary/5 transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-secondary text-foreground border border-border"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border p-3 bg-secondary/20 flex gap-2">
          <input
            placeholder={`Pregunta a ${activeAssistant.name}…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim()}
            className="rounded-xl bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
