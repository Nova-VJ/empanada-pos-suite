/**
 * Utilidades para integración y enlaces reales de WhatsApp en NovaStock / Dr. Empanadas
 * Formatea números venezolanos (0412, 0414, 0416, 0424, 0243, etc.) al código internacional (+58)
 * y genera enlaces wa.me directos y compatibles con Web y App móvil.
 */

import type { Order, ShiftAudit, Supplier } from "@/types/pos";
import { fmtBs, fmtUsd } from "./money";

/**
 * Normaliza un número telefónico venezolano al formato internacional sin signos
 * Ej: "0412-1234567" -> "584121234567"
 * Ej: "+58 414 7654321" -> "584147654321"
 * Ej: "0424 9998877" -> "584249998877"
 */
export function normalizeWhatsAppPhone(phone: string): string {
  if (!phone) return "";
  // Quitar espacios, guiones, paréntesis y signos
  let clean = phone.replace(/[^0-9]/g, "");
  
  // Si empieza con 0 (ej: 0412..., 0414..., 0424...)
  if (clean.startsWith("0")) {
    clean = "58" + clean.substring(1);
  }
  // Si no tiene código de país y tiene 10 dígitos (ej: 4121234567)
  else if (clean.length === 10 && (clean.startsWith("412") || clean.startsWith("414") || clean.startsWith("416") || clean.startsWith("424") || clean.startsWith("426"))) {
    clean = "58" + clean;
  }
  return clean;
}

/**
 * Abre un chat de WhatsApp con un mensaje predeterminado
 */
export function openWhatsApp({ phone, message }: { phone?: string; message: string }) {
  const normPhone = phone ? normalizeWhatsAppPhone(phone) : "";
  const encodedText = encodeURIComponent(message);
  const url = normPhone 
    ? `https://wa.me/${normPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
    
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return url;
}

/**
 * Construye el mensaje de alerta para la comanda o nuevo pedido
 */
export function buildOrderWhatsAppAlert(order: Order, companyName: string = "Dr. Empanadas C.A.", branch: string = "San Jacinto, Maracay"): string {
  const linesSummary = order.lines
    .map((l) => `• ${l.qty}x ${l.name}${l.note ? ` _(${l.note})_` : ""}`)
    .join("\n");

  const totalUsdStr = fmtUsd(order.totalUsd);
  const totalBsStr = fmtBs(order.totalBs);
  const timeStr = new Date(order.createdAt).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
  const paymentMethods = order.payments.map((p) => {
    if (p.type === "pago_movil") return `Pago Móvil (Ref: ${p.reference || "N/A"})`;
    if (p.type === "usd_cash") return `Efectivo Divisas ($${p.amountUsd?.toFixed(2) ?? "0.00"})`;
    if (p.type === "pos_card") return `Punto de Venta Débito`;
    if (p.type === "bs_cash") return `Efectivo Bolívares`;
    return p.type;
  }).join(", ");

  return `🔔 *NUEVO PEDIDO REGISTRADO #${order.invoiceNo}*
🏪 *${companyName}* · ${branch}
⏰ Hora: ${timeStr}
👤 Cliente: ${order.customer?.name || "Consumidor Final"} ${order.customer?.rif ? `(${order.customer.rif})` : ""}
🛵 Modalidad: ${order.type === "dine_in" ? "🍽️ Comer en Salón" : "🥡 Para Llevar / Delivery"}

📦 *PRODUCTOS:*
${linesSummary}

💰 *TOTAL A PAGAR:*
• ${totalUsdStr} USD
• ${totalBsStr} (Tasa BCV: Bs. ${order.rate.toFixed(2)})

💳 *Forma de Pago:* ${paymentMethods}
${order.table ? `📍 Mesa: ${order.table}\n` : ""}
✅ _Generado automáticamente por NovaStock POS_`;
}

/**
 * Construye el mensaje de comprobante / ticket digital para enviar al cliente
 */
export function buildCustomerTicketWhatsApp(order: Order, companyName: string = "Dr. Empanadas C.A.", rif: string = "J-50123456-7"): string {
  const linesSummary = order.lines
    .map((l) => `🥟 ${l.qty}x ${l.name} - $${(l.qty * l.unitUsd).toFixed(2)} USD`)
    .join("\n");

  return `🧾 *COMPROBANTE DIGITAL DE COMPRA*
*${companyName}*
RIF: ${rif}
📍 San Jacinto, Maracay, Edo. Aragua
Factura / Control: #${order.invoiceNo}
Fecha: ${new Date(order.createdAt).toLocaleDateString("es-VE")} ${new Date(order.createdAt).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}

*Detalle de su Pedido:*
${linesSummary}

💵 Subtotal: $${(order.baseBs / order.rate).toFixed(2)} USD
🏛️ IVA (16%): $${(order.ivaBs / order.rate).toFixed(2)} USD
*TOTAL PAGADO:* ${fmtUsd(order.totalUsd)} (${fmtBs(order.totalBs)})

¡Muchas gracias por su preferencia! ¡Que disfrute sus empanadas recién hechas! 🥟❤️`;
}

/**
 * Construye el reporte ejecutivo de Cierre Z o Corte X para enviar a la Gerencia por WhatsApp
 */
export function buildCierreZWhatsApp(audit: ShiftAudit, rate: number, companyName: string = "Dr. Empanadas C.A."): string {
  const isZ = audit.kind === "Z";
  const dateStr = new Date(audit.closedAt).toLocaleDateString("es-VE");
  const timeStr = new Date(audit.closedAt).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });

  const diffText = Math.abs(audit.differenceBs) < 0.01
    ? "✅ CUADRE EXACTO (0,00)"
    : audit.differenceBs > 0
    ? `⚠️ SOBRANTE: +${fmtBs(audit.differenceBs)}`
    : `❌ FALTANTE: -${fmtBs(Math.abs(audit.differenceBs))}`;

  return `📊 *${isZ ? `REPORTE DE CIERRE Z #${audit.zNumber}` : "REPORTE DE CORTE PARCIAL X"}*
🏪 *${companyName}*
📅 Fecha: ${dateStr} · ${timeStr}
👤 Cajero: ${audit.cashier} (${audit.register})
🧾 Total Tickets Procesados: ${audit.tickets}
💵 Tasa BCV Oficial: Bs. ${rate.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━
*DESGLOSE DE ARQUEO EN GAVETA:*
💵 Efectivo Bolívares:
   • Declarado: ${fmtBs(audit.declared.bs)}
   • Sistema: ${fmtBs(audit.expected.bs)}

💵 Efectivo Dólares ($ USD):
   • Declarado: ${fmtUsd(audit.declared.usd)}
   • Sistema: ${fmtUsd(audit.expected.usd)}

💳 Punto de Venta (Datáfono):
   • Declarado: ${fmtBs(audit.declared.pos)}
   • Sistema: ${fmtBs(audit.expected.pos)}

📲 Pago Móvil:
   • Declarado: ${fmtBs(audit.declared.pagoMovil)}
   • Sistema: ${fmtBs(audit.expected.pagoMovil)}
━━━━━━━━━━━━━━━━━━━━

💰 *TOTAL DECLARADO:* ${fmtBs(audit.declaredTotalBs)} (${fmtUsd(audit.declaredTotalBs / rate)})
📈 *TOTAL SISTEMA:*   ${fmtBs(audit.expectedTotalBs)} (${fmtUsd(audit.expectedTotalBs / rate)})
🎯 *ESTADO DEL CUADRE:* ${diffText}

${audit.notes ? `📝 *Observaciones:* ${audit.notes}\n` : ""}
🔒 _Cierre de turno registrado en NovaStock ERP_`;
}

/**
 * Construye la solicitud formal de cotización de insumos a un proveedor
 */
export function buildSupplierQuoteWhatsApp(supplier: Supplier, itemsSummary: string, companyName: string = "Dr. Empanadas C.A."): string {
  return `👋 Estimados amigos de *${supplier.name}*, un cordial saludo desde *${companyName}* (San Jacinto, Maracay).

Por favor, requerimos cotización actualizada y disponibilidad de entrega para los siguientes insumos de cocina:
📦 *Requerimiento:* ${itemsSummary}

Quedamos atentos a sus precios vigentes al mayor y condiciones de pago.
¡Muchas gracias!`;
}

/**
 * Plantilla oficial para solicitar datos al cliente que escribe por WhatsApp
 */
export function buildCustomerDeliveryRequestTemplate(): string {
  return `Hola, hablas con Dr. Empanadas Delivery, me confirmas

Nombre:
Dirección GPS:
Pedido:

Estamos atentos!!!`;
}

/**
 * Construye la comanda formal para el grupo de motorizados de WhatsApp
 */
export function buildRidersGroupDeliveryMessage(delivery: {
  orderNumber: number;
  clientName: string;
  clientPhone: string;
  addressGps: string;
  mapsUrl?: string;
  itemsText: string;
  totalUsd: number;
  totalBs: number;
  paymentMethod: string;
  paymentReference?: string;
  riderName: string;
}): string {
  return `🛵 *NUEVO DELIVERY - DR. EMPANADAS*
📋 *Comanda #${delivery.orderNumber}*
━━━━━━━━━━━━━━━━━━━━
👤 *Cliente:* ${delivery.clientName}
📱 *Teléfono:* ${delivery.clientPhone}
📍 *Dirección GPS:* ${delivery.addressGps}
${delivery.mapsUrl ? `🗺️ *Abrir en Google Maps:* ${delivery.mapsUrl}\n` : ""}━━━━━━━━━━━━━━━━━━━━
📦 *PEDIDO A ENTREGAR:*
${delivery.itemsText}
━━━━━━━━━━━━━━━━━━━━
💵 *TOTAL COBRADO:* $${delivery.totalUsd.toFixed(2)} USD (Bs. ${delivery.totalBs.toFixed(2)})
💳 *Forma de Pago:* ${delivery.paymentMethod} ${delivery.paymentReference ? `(Ref: ${delivery.paymentReference})` : ""}
🛵 *Motorizado Asignado:* *${delivery.riderName}*
🚨 *¡MOTORIZADO EN CAMINO!*`;
}

/**
 * Notificación automática a la cajera ("Va vía el delivery")
 */
export function buildCashierNotificationMessage(delivery: {
  orderNumber: number;
  clientName: string;
  riderName: string;
}): string {
  return `🛵 *¡Va vía el delivery!*
El pedido #${delivery.orderNumber} para *${delivery.clientName}* ya salió en camino con *${delivery.riderName}*.`;
}

/**
 * Confirmación de entrega para el cliente y chat gerencial
 */
export function buildDeliveredCustomerMessage(delivery: {
  orderNumber: number;
  clientName: string;
  riderName: string;
}): string {
  return `🎉 *¡PEDIDO ENTREGADO CON ÉXITO!*
Hola *${delivery.clientName}*, tu comanda #${delivery.orderNumber} fue entregada por nuestro motorizado *${delivery.riderName}*.
¡Buen provecho y un millón de gracias por preferir Dr. Empanadas! 🥟✨`;
}
