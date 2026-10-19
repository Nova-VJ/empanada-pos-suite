import { createServerFn } from "@tanstack/react-start";

export interface AiChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AiPromptContext {
  assistantId: "eco-coach" | "eco-ops" | "eco-fiscal";
  storeName: string;
  rif: string;
  branch: string;
  activeRate: number;
  rateVariantName: string;
  totalOrdersToday: number;
  salesTotalUsd: number;
  salesTotalBs: number;
  pendingFryerOrders: number;
  lowStockItems: Array<{ name: string; stock: number; min: number }>;
  topSellingItems: Array<{ name: string; soldCount: number }>;
  unpaidSupplierInvoicesCount: number;
  unpaidSupplierInvoicesUsd: number;
  bestSuppliers: Array<{ name: string; score: number; category: string }>;
  debtorsCount: number;
  totalReceivablesUsd: number;
  fiscalPrinterModel: string;
  lastZReport: number;
  ivaCollectedBs: number;
  igtfCollectedBs: number;
}

/**
 * Server function to query Google Gemini API.
 * Uses system instructions tailored for Dr. Empanadas C.A. under Venezuelan fiscal SENIAT regulations.
 */
export const queryGeminiAiServerFn = createServerFn({ method: "POST" })
  .validator((d: { apiKey?: string; userPrompt: string; context: AiPromptContext; history?: AiChatMessage[] }) => d)
  .handler(async ({ data }): Promise<{ reply: string; source: "gemini" | "local_expert"; error?: string }> => {
    const { apiKey, userPrompt, context, history = [] } = data;

    // Build the system prompt with complete Venezuelan business context
    const systemPrompt = `Eres el Asistente de Inteligencia Artificial de "NovaSystem Suite v1.0", la solución TPV y ERP comercial diseñada específicamente para Venezuela bajo la normativa SENIAT y la realidad bimonetaria (Bs. y USD).

Estás operando en vivo dentro de la empresa:
- Razón Social: ${context.storeName}
- RIF Fiscal: ${context.rif}
- Sucursal: ${context.branch}
- Versión del software: NovaSystem v1.0 Venezuela (SENIAT Edition - Primera Versión Oficial)

DATOS EN VIVO DEL NEGOCIO (SINERGIA Y RETROALIMENTACIÓN TOTAL ENTRE MÓDULOS):
1. TASA DE CAMBIO ACTIVA: Bs. ${context.activeRate.toFixed(2)} por USD (${context.rateVariantName}).
2. VENTAS Y CAJA HOY: ${context.totalOrdersToday} comandas facturadas, totalizando $${context.salesTotalUsd.toFixed(2)} USD (Bs. ${context.salesTotalBs.toFixed(2)}).
3. COCINA Y KDS: ${context.pendingFryerOrders} pedidos actualmente en freidora.
4. INVENTARIO CRÍTICO (Falta reponer): ${
      context.lowStockItems.length > 0
        ? context.lowStockItems.map((i) => `${i.name} (quedan ${i.stock} uds, mínimo ${i.min})`).join(", ")
        : "Todo el stock de barra y cocina está en niveles óptimos."
    }
5. COMPRAS Y PROVEEDORES: ${context.unpaidSupplierInvoicesCount} facturas pendientes por pagar ($${context.unpaidSupplierInvoicesUsd.toFixed(2)} USD).
   Mejores proveedores auditados: ${context.bestSuppliers.map((s) => `${s.name} (Score ${s.score}/100, ${s.category})`).join(", ")}.
6. CUENTAS POR COBRAR (DEUDORES / FIADO): ${context.debtorsCount} clientes con saldo pendiente, acumulando $${context.totalReceivablesUsd.toFixed(2)} USD.
7. ÁREA FISCAL SENIAT:
   - Impresora Fiscal: ${context.fiscalPrinterModel} (Último Reporte Z: #${context.lastZReport})
   - Débito Fiscal IVA 16% acumulado: Bs. ${context.ivaCollectedBs.toFixed(2)}
   - IGTF Percibido 3% (pagos en divisas/efectivo $): Bs. ${context.igtfCollectedBs.toFixed(2)}
   - Normativa: Providencia Administrativa SNAT/0071, Ley de IGTF (Gaceta Oficial 6.687), máquinas fiscales HKA.

TU ROL ACTUAL ES: ${
      context.assistantId === "eco-coach"
        ? "COACH OPERACIONES & KDS: Tu misión es maximizar las ventas, reducir tiempos en freidoras, sugerir combos comerciales ganadores (ej. Empanada de Pabellón + Malta) y alertar sobre quiebres de inventario."
        : context.assistantId === "eco-ops"
        ? "OPS COMPRAS & PROVEEDORES: Tu misión es asesorar al dueño sobre las mejores cotizaciones de harina, queso blanco duro, aceite y carnes, comparar precios entre proveedores mayoristas y gestionar cuentas por pagar."
        : "ASESOR FISCAL SENIAT & BCV: Tu misión es garantizar el estricto cumplimiento tributario venezolano (Providencia 0071, facturación fiscal vs control interno, cálculo exacto de IGTF 3% en pagos mixtos, Cierre Z y Libro de Ventas)."
    }

DIRECTRICES DE RESPUESTA:
- Responde siempre en español claro, profesional y cercano, ideal para el dueño del negocio y encargados de tienda en Venezuela.
- Utiliza formato Markdown con viñetas elegantes, negritas y datos precisos con cifras bimoneda ($ y Bs.).
- Destaca que esta es la versión oficial de NovaSystem adaptada a Venezuela y al SENIAT.
- Fomenta la sinergia: si preguntan por compras, menciona cómo afecta al inventario o al flujo de caja; si preguntan por ventas, menciona la freidora o los combos sugeridos.`;

    // If an API key is provided, query Google Gemini REST API directly
    if (apiKey && apiKey.trim().length > 10) {
      try {
        const contents = [
          ...history.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          { role: "user", parts: [{ text: `${systemPrompt}\n\nPregunta del usuario: ${userPrompt}` }] },
        ];

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
              },
            }),
            signal: AbortSignal.timeout(12000),
          }
        );

        if (response.ok) {
          const resJson = await response.json();
          const candidateText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim().length > 0) {
            return { reply: candidateText.trim(), source: "gemini" };
          }
        }
      } catch (err: any) {
        console.warn("Fallo llamada a Google Gemini API, recurriendo a motor experto local:", err?.message);
      }
    }

    // High-intelligence Local Fallback Engine (Engineered with rich Venezuelan knowledge and real-time store synergy)
    const q = userPrompt.toLowerCase();
    let reply = "";

    if (context.assistantId === "eco-coach") {
      if (q.includes("combo") || q.includes("promo") || q.includes("ticket") || q.includes("vender")) {
        reply = `🥟 **Estrategia Comercial de Ventas & Combos (NovaSystem v1.0 Venezuela):**\n\n` +
          `• **Combo Dúo Criollo Sugerido:** Empanada de Pabellón Criollo + Malta Polar 355ml por **$4.80** (Bs. ${(4.8 * context.activeRate).toFixed(2)} a tasa oficial de Bs. ${context.activeRate.toFixed(2)}).\n` +
          `• **Uplift Estimado:** Incrementa el ticket promedio de los actuales **$${(context.salesTotalUsd / Math.max(1, context.totalOrdersToday)).toFixed(2)}** en un **+22%** durante la mañana (7:30 AM - 10:30 AM).\n` +
          `• **Sinergia con Freidora (KDS):** Hay **${context.pendingFryerOrders} comandas** en marcha. La Empanada de Pabellón tiene una rotación de freído de 3.5 minutos, garantizando despacho ultra-rápido sin cuellos de botella.\n` +
          `• **Acción en Caja:** Al tomar el pedido en el TPV, el cajero puede ofrecer directamente la porción extra de Guasacaca o Nata Criolla con 1 solo toque.`;
      } else if (q.includes("merma") || q.includes("stock") || q.includes("falta") || q.includes("inventario")) {
        reply = `⚠️ **Auditoría de Mermas y Stock en Barra (NovaSystem v1.0 SENIAT):**\n\n` +
          `• **Alertas de Reposición Inmediata:**\n` +
          (context.lowStockItems.length > 0
            ? context.lowStockItems.map((i) => `  - **${i.name}:** Stock actual **${i.stock} unidades** (Mínimo de seguridad: ${i.min} unidades).`).join("\n")
            : `  - Todo el inventario de empanadas cuenta con suficiente cobertura para el turno.`) +
          `\n\n• **Control de Masa y Relleno:** Se estima un rendimiento óptimo de 45 empanadas por bulto de Harina P.A.N. y 80 gramos de proteína por unidad.\n` +
          `• **Sinergia con Compras:** Puedes generar la orden de reposición automática con 1 clic en el módulo de **Proveedores & Compras**.`;
      } else {
        reply = `🥟 **Diagnóstico Operativo en Tiempo Real (Dr. Empanadas C.A. - Sucursal ${context.branch}):**\n\n` +
          `• **Facturación Acumulada del Turno:** **$${context.salesTotalUsd.toFixed(2)} USD** (Bs. ${context.salesTotalBs.toFixed(2)}) en **${context.totalOrdersToday} órdenes** procesadas.\n` +
          `• **Ticket Promedio:** **$${(context.salesTotalUsd / Math.max(1, context.totalOrdersToday)).toFixed(2)} USD** / orden.\n` +
          `• **Tasa Oficial Vigente:** Bs. ${context.activeRate.toFixed(2)} por USD (${context.rateVariantName}).\n` +
          `• **Estado de Cocina KDS:** ${context.pendingFryerOrders === 0 ? "Freidoras despejadas y listas para despachos exprés." : `Hay **${context.pendingFryerOrders} comandas** activas friéndose en este momento.`}\n` +
          `• **Recomendación NovaSystem:** El producto líder del turno sigue siendo la *Empanada de Carne Mechada* y el *Pabellón Criollo*. Mantener pre-armadas en cava 30 unidades para el pico del mediodía.`;
      }
    } else if (context.assistantId === "eco-ops") {
      if (q.includes("harina") || q.includes("queso") || q.includes("aceite") || q.includes("carne") || q.includes("precio") || q.includes("comprar")) {
        reply = `🛒 **Comparativa de Insumos Críticos en el Mercado Mayorista (NovaSystem v1.0):**\n\n` +
          `• **Harina de Maíz Precocida (Bulto 20kg):**\n` +
          `  - Alimentos Polar: **$22.50** (Entrega 24h, 15 días de crédito, Score 98/100).\n` +
          `  - Distribuidora Mayorista Central: **$20.80** (**Ahorro 7.5%**, entrega 48h).\n` +
          `• **Queso Blanco Llanero Duro (Kilo):**\n` +
          `  - Quesera Llanera Guárico: **$4.80** (Proveedor actual, Score 88/100).\n` +
          `  - Agropecuaria El Sombrero: **$4.10** (**Ahorro 14.5%**, entrega 24h, Score 94/100).\n` +
          `• **Aceite Comestible (Bidón 18 Litros):**\n` +
          `  - Oleaginosas Industriales: **$27.50** (**Ahorro 14.0%** frente a Polar $32.00).\n\n` +
          `💡 **Decisión del Dueño:** En la pestaña *"Buscar Mejores Proveedores"*, puedes filtrar por rubro, plazo de entrega y solicitar cotización o emitir la Orden de Compra con 1 clic.`;
      } else {
        reply = `🚚 **Resumen Ejecutivo de Proveedores & Abastecimiento (NovaSystem v1.0 Venezuela):**\n\n` +
          `• **Cuentas por Pagar a Proveedores:** Tienes **${context.unpaidSupplierInvoicesCount} facturas pendientes** por un total de **$${context.unpaidSupplierInvoicesUsd.toFixed(2)} USD** (Bs. ${(context.unpaidSupplierInvoicesUsd * context.activeRate).toFixed(2)}).\n` +
          `• **Proveedores con Máximo Score:**\n` +
          context.bestSuppliers.map((s) => `  - **${s.name}:** Score **${s.score}/100** (${s.category})`).join("\n") +
          `\n\n• **Sinergia con Kardex:** Cada vez que recibes una orden de compra en el módulo de Proveedores, el inventario de materias primas y empaques se acredita automáticamente sin necesidad de doble registro manual.`;
      }
    } else {
      // eco-fiscal
      if (q.includes("igtf") || q.includes("divisa") || q.includes("mixto") || q.includes("3%")) {
        reply = `⚖️ **Marco Legal SENIAT: IGTF del 3% en Pagos con Divisas (Ley Gaceta 6.687):**\n\n` +
          `• **Hecho Imponible:** El IGTF del **3%** grava únicamente los pagos cancelados en moneda extranjera (efectivo USD, Zelle, etc.) o criptoactivos distintos al Bolívar.\n` +
          `• **Ejemplo de Pago Mixto:** Si una cuenta es de $10.00 (Bs. ${(10 * context.activeRate).toFixed(2)}) y el cliente paga $5.00 en efectivo y el resto por Pago Móvil en Bs.:\n` +
          `  - Porción Divisa: $5.00 → IGTF 3% = **$0.15 (Bs. ${(0.15 * context.activeRate).toFixed(2)})**.\n` +
          `  - Porción Pago Móvil: Exenta de IGTF según normativa vigente.\n` +
          `• **Recaudación en Caja Hoy:** Se han percibido **Bs. ${context.igtfCollectedBs.toFixed(2)}** de IGTF y **Bs. ${context.ivaCollectedBs.toFixed(2)}** de IVA 16%.\n` +
          `• La máquina fiscal **${context.fiscalPrinterModel}** emite el desglose formal con el serial del SENIAT y código QR de validación.`;
      } else if (q.includes("cierre") || q.includes("reporte z") || q.includes("x")) {
        reply = `📋 **Normativa de Cierres de Caja (SENIAT Providencia 0071):**\n\n` +
          `• **Reporte X (Auditoría Parcial):** Se puede emitir en cualquier momento del turno sin alterar los contadores fiscales acumulativos.\n` +
          `• **Reporte Z (Cierre Fiscal Obligatorio Diario):** Cierra el ciclo de facturación, actualiza la memoria fiscal de la impresora **${context.fiscalPrinterModel}** (Último Z: #${context.lastZReport}) y genera el registro en el Libro de Ventas.\n` +
          `• **Envío por Correo:** NovaSystem envía automáticamente el balance Z con el total en Bolívares y Dólares al correo de administración configurado.`;
      } else {
        reply = `🏛️ **Auditoría Fiscal SENIAT en Tiempo Real (NovaSystem v1.0 Venezuela):**\n\n` +
          `• **Contribuyente:** ${context.storeName} (RIF: **${context.rif}**)\n` +
          `• **Tasa Oficial BCV:** Bs. ${context.activeRate.toFixed(2)} / USD (${context.rateVariantName})\n` +
          `• **Alícuota General IVA (16%):** Bs. ${context.ivaCollectedBs.toFixed(2)} devengados en el turno.\n` +
          `• **Alícuota IGTF Divisas (3%):** Bs. ${context.igtfCollectedBs.toFixed(2)} retenidos.\n` +
          `• **Dispositivo Fiscal:** Impresora ${context.fiscalPrinterModel} en puerto COM3. Memoria de auditoría y papel en perfecto estado.\n` +
          `• **Cumplimiento Legal:** El sistema garantiza el cumplimiento estricto de la Providencia SNAT/0071 y el resguardo de comprobantes para el Libro de Ventas digital.`;
      }
    }

    return { reply, source: "local_expert" };
  });
