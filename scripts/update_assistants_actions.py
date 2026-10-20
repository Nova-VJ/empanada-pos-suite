file_path = r"c:\Users\patri\Downloads\TPV Mundial\lovable-frontend\src\components\erp\AssistantsModule.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update Message type definition
old_msg_type = 'type Message = { role: "user" | "assistant"; content: string; isAiPowered?: boolean };'
new_msg_type = '''export type AssistantAction = {
  type: "rename_product" | "change_price" | "adjust_stock" | "create_product" | "toggle_alerts" | "change_rate" | "organize_inventory" | "sales_report" | "missing_stock";
  title: string;
  detail: string;
  badge?: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  isAiPowered?: boolean;
  actionExecuted?: AssistantAction;
};'''

if old_msg_type in code:
    code = code.replace(old_msg_type, new_msg_type, 1)

# 2. Add action executor logic before sendMessage
action_logic = '''  // Action Execution Engine: Interprets natural language commands and modifies ERP state
  function executeNaturalLanguageCommand(rawText: string): { reply: string; action?: AssistantAction } | null {
    const text = rawText.trim().toLowerCase();

    // 1. RENAME PRODUCT: e.g. "cambia el nombre de empanada de queso por empanada de queso llanero premium"
    const renameMatch = text.match(/(?:cambi(?:a|ar|ame)?\s+(?:el\s+)?nombre\s+(?:de|del)\s+|renombr(?:a|ar|ame)?\s+)(.+?)\s+(?:por|a)\s+(.+)/i);
    if (renameMatch) {
      const targetQuery = renameMatch[1].trim();
      const newName = renameMatch[2].trim().replace(/^["']|["']$/g, "");

      const product = pos.products.find((p) =>
        p.name.toLowerCase().includes(targetQuery) ||
        p.short.toLowerCase().includes(targetQuery) ||
        targetQuery.includes(p.name.toLowerCase())
      );

      if (product) {
        const oldName = product.name;
        const formattedNew = newName.charAt(0).toUpperCase() + newName.slice(1);
        pos.updateProduct(product.id, {
          name: formattedNew,
          short: formattedNew.length > 16 ? formattedNew.slice(0, 16) : formattedNew,
        });

        toast.success(`Producto renombrado: "${formattedNew}"`, {
          description: "Actualizado en caja, cocina y comandas al instante.",
        });

        return {
          reply: `✅ **¡Hecho! He cambiado el nombre del producto.**\n\n• **Nombre anterior:** ${oldName}\n• **Nuevo nombre:** **${formattedNew}**\n\nEl cambio ya se aplicó en todo el sistema: caja registradora, comanda de cocina (KDS) y reportes.`,
          action: {
            type: "rename_product",
            title: "Producto Renombrado",
            detail: `${oldName} ➔ ${formattedNew}`,
            badge: "Catálogo & KDS",
          },
        };
      }
    }

    // 2. CHANGE PRODUCT PRICE: e.g. "pon el precio de la empanada de carne a $1.80" or "cambia el precio de malta a 1.20"
    const priceMatch = text.match(/(?:cambi|pon|ajust|sub|baj)(?:a|ar|ame)?\s+(?:el\s+)?precio\s+(?:de|del)?\s*(.+?)\s+(?:a|en)\s*\$?([0-9]+(?:[\.,][0-9]{1,2})?)/i) ||
                       text.match(/pon\s+(?:la|el)?\s*(.+?)\s+(?:a|en)\s*\$?([0-9]+(?:[\.,][0-9]{1,2})?)/i);
    if (priceMatch && !text.includes("tasa")) {
      const targetQuery = priceMatch[1].trim();
      const newPrice = parseFloat(priceMatch[2].replace(",", "."));

      if (!isNaN(newPrice) && newPrice > 0) {
        const product = pos.products.find((p) =>
          p.name.toLowerCase().includes(targetQuery) ||
          targetQuery.includes(p.name.toLowerCase())
        );

        if (product) {
          const oldPrice = product.priceUsd;
          pos.updateProduct(product.id, { priceUsd: newPrice });

          toast.success(`Precio actualizado: ${product.name} $${newPrice.toFixed(2)} USD`, {
            description: `Equivale a Bs. ${(newPrice * pos.rate).toFixed(2)} a tasa oficial.`,
          });

          return {
            reply: `💵 **Precio de venta actualizado con éxito.**\n\n• **Producto:** **${product.name}**\n• **Precio anterior:** $${oldPrice.toFixed(2)} USD\n• **Nuevo precio:** **$${newPrice.toFixed(2)} USD** (Bs. ${(newPrice * pos.rate).toFixed(2)} a tasa BCV Bs. ${pos.rate.toFixed(2)}).\n\nLos cajeros ya pueden cobrar con el nuevo valor.`,
            action: {
              type: "change_price",
              title: "Precio Actualizado",
              detail: `${product.name}: $${newPrice.toFixed(2)} USD (Bs. ${(newPrice * pos.rate).toFixed(2)})`,
              badge: "Caja TPV",
            },
          };
        }
      }
    }

    // 3. ADJUST / ADD STOCK: e.g. "suma 30 empanadas de cazón a la barra" or "llegaron 40 empanadas de carne a cocina"
    const stockAddMatch = text.match(/(?:sum|agreg|lleg)(?:a|ar|aron)?\s+(\d+)\s*(?:empanadas|unidades|uds)?\s*(?:de|del)?\s*(.+?)\s*(?:a|en)\s*(?:la\s+)?(barra|cocina|el\s+inventario)/i);
    if (stockAddMatch) {
      const qty = parseInt(stockAddMatch[1], 10);
      const targetQuery = stockAddMatch[2].trim();
      const location = stockAddMatch[3].toLowerCase();

      const product = pos.products.find((p) =>
        p.name.toLowerCase().includes(targetQuery) ||
        targetQuery.includes(p.name.toLowerCase())
      );

      if (product && qty > 0) {
        const isKitchen = location.includes("cocina");
        const newStockKitchen = isKitchen ? product.stockKitchen + qty : product.stockKitchen;
        const newStockBar = !isKitchen ? product.stockBar + qty : product.stockBar;

        pos.updateProduct(product.id, {
          stockBar: newStockBar,
          stockKitchen: newStockKitchen,
        });

        toast.success(`+${qty} unidades añadidas a ${product.name}`, {
          description: `Nuevo stock total disponible: ${newStockBar + newStockKitchen} unidades.`,
        });

        return {
          reply: `📦 **Stock añadido correctamente al inventario.**\n\n• **Producto:** **${product.name}**\n• **Cantidad ingresada:** +${qty} unidades (${isKitchen ? "Área Cocina KDS" : "Exhibidor Barra"})\n• **Stock total ahora:** **${newStockBar + newStockKitchen} unidades disponibles**.\n\nEl semáforo de inventario y la pantalla de cocina se actualizaron en tiempo real.`,
          action: {
            type: "adjust_stock",
            title: "Entrada de Stock",
            detail: `+${qty} uds a ${product.name} (${isKitchen ? "Cocina" : "Barra"})`,
            badge: "Inventario",
          },
        };
      }
    }

    // 4. MISSING STOCK / DEPLETED: e.g. "¿qué productos faltan?" or "¿qué se agotó?"
    if (text.includes("que falta") || text.includes("qué falta") || text.includes("productos faltan") || text.includes("stock critico") || text.includes("stock crítico") || text.includes("se agoto") || text.includes("se agotó")) {
      const depleted = pos.products.filter((p) => (p.stockBar + p.stockKitchen) <= (p.minStock ?? 10));
      if (depleted.length === 0) {
        return {
          reply: `🟢 **¡Excelente noticia! No falta ningún producto.**\n\nTodo el inventario está en niveles óptimos de seguridad. Todas las empanadas y bebidas cuentan con cobertura para el turno.`,
          action: {
            type: "missing_stock",
            title: "Auditoría de Stock",
            detail: "Todo en nivel óptimo (0 productos críticos)",
            badge: "100% Cobertura",
          },
        };
      }

      const list = depleted.map((p) => `• 🔴 **${p.name}:** Quedan **${p.stockBar + p.stockKitchen} unidades** (Mínimo de seguridad: ${p.minStock ?? 10} uds). Barra: ${p.stockBar} | Cocina: ${p.stockKitchen}`).join("\n");
      return {
        reply: `⚠️ **Auditoría de Faltantes e Inventario Crítico:**\n\nActualmente tienes **${depleted.length} productos por debajo del stock mínimo** de seguridad:\n\n${list}\n\n💡 **Recomendación:** Pasa la orden de fritura a cocina o genera el pedido de insumos en el módulo de Proveedores.`,
        action: {
          type: "missing_stock",
          title: "Faltantes Detectados",
          detail: `${depleted.length} productos bajo el mínimo`,
          badge: "Alerta Reposición",
        },
      };
    }

    // 5. ORGANIZE INVENTORY: e.g. "organiza el inventario por ventas" or "ordena el inventario por precio"
    if (text.includes("organiz") || text.includes("ordena") && (text.includes("inventario") || text.includes("catalogo") || text.includes("catálogo"))) {
      let sorted = [...pos.products];
      let criteria = "nombre";
      if (text.includes("precio") || text.includes("caro") || text.includes("barato")) {
        sorted.sort((a, b) => b.priceUsd - a.priceUsd);
        criteria = "mayor precio a menor precio";
      } else if (text.includes("stock") || text.includes("cantidad")) {
        sorted.sort((a, b) => (b.stockBar + b.stockKitchen) - (a.stockBar + a.stockKitchen));
        criteria = "mayor disponibilidad de stock";
      } else {
        // default by popularity / price
        sorted.sort((a, b) => b.priceUsd - a.priceUsd);
        criteria = "rentabilidad y precio";
      }

      const top5 = sorted.slice(0, 5).map((p, idx) => `${idx + 1}. **${p.name}** — $${p.priceUsd.toFixed(2)} USD (Stock: ${p.stockBar + p.stockKitchen} uds)`).join("\n");
      return {
        reply: `🗂️ **Inventario Organizado por ${criteria.toUpperCase()}:**\n\nAquí tienes el resumen de los productos destacados en este orden:\n\n${top5}\n\nPuedes ver el catálogo completo ordenado en el módulo de **Productos** o en el **TPV** de caja.`,
        action: {
          type: "organize_inventory",
          title: "Inventario Organizado",
          detail: `Criterio: ${criteria}`,
          badge: "Organizado",
        },
      };
    }

    // 6. INSTANT SALES REPORT: e.g. "¿cuánto vendió la caja hoy?" or "dame el reporte de ventas"
    if (text.includes("cuanto vendio") || text.includes("cuánto vendió") || text.includes("informe de ventas") || text.includes("reporte de ventas") || text.includes("resumen de ventas") || text.includes("cuanto hay en caja")) {
      const validOrders = pos.orders.filter((o) => o.status !== "anulada");
      const salesTotalBs = validOrders.reduce((s, o) => s + o.totalBs, 0);
      const salesTotalUsd = validOrders.reduce((s, o) => s + o.totalBs / o.rate, 0);
      const totalIvaBs = validOrders.reduce((s, o) => s + o.ivaBs, 0);
      const totalIgtfBs = validOrders.reduce((s, o) => s + o.igtfBs, 0);

      return {
        reply: `📊 **Informe de Ventas en Vivo (Turno Actual):**\n\n` +
               `• **Total Facturado en Dólares:** **$${salesTotalUsd.toFixed(2)} USD**\n` +
               `• **Total Facturado en Bolívares:** **Bs. ${salesTotalBs.toFixed(2)}**\n` +
               `• **Comandas / Tickets Procesados:** **${validOrders.length} órdenes**\n` +
               `• **Ticket Promedio:** **$${(salesTotalUsd / Math.max(1, validOrders.length)).toFixed(2)} USD**\n` +
               `• **Tasa Oficial Aplicada:** Bs. ${pos.rate.toFixed(2)} / USD\n` +
               `• **SENIAT Débito IVA 16%:** Bs. ${totalIvaBs.toFixed(2)}\n` +
               `• **SENIAT Retención IGTF 3%:** Bs. ${totalIgtfBs.toFixed(2)}\n\n` +
               `Todo coincide con los registros de auditoría y Libro de Ventas.`,
        action: {
          type: "sales_report",
          title: "Reporte de Ventas Generado",
          detail: `$${salesTotalUsd.toFixed(2)} USD (Bs. ${salesTotalBs.toFixed(2)}) · ${validOrders.length} órdenes`,
          badge: "Caja Cuadrada",
        },
      };
    }

    // 7. TOGGLE LOW STOCK ALERTS: e.g. "activa las alertas de stock" or "desactiva las alertas"
    if (text.includes("alerta") && (text.includes("stock") || text.includes("agotando"))) {
      const enable = text.includes("activa") || text.includes("enciende") || text.includes("habilita") || text.includes("prende");
      pos.updateCompanySettings({ lowStockAlertsEnabled: enable });
      toast.info(enable ? "Alertas de stock bajo activadas" : "Alertas de stock bajo desactivadas");

      return {
        reply: `🔔 **Ajuste de Alertas de Stock:**\n\nLas alertas de stock bajo han sido **${enable ? "ACTIVADAS" : "DESACTIVADAS"}** en todo el sistema. ${enable ? "Ahora verás las insignias rojas de aviso cuando un producto esté por agotarse." : "Se silenciaron las notificaciones para una vista más limpia durante el despacho rápido."}`,
        action: {
          type: "toggle_alerts",
          title: "Alertas de Stock",
          detail: enable ? "Activadas en todo el sistema" : "Desactivadas (Modo Silencioso)",
          badge: enable ? "ON" : "OFF",
        },
      };
    }

    // 8. CHANGE RATE: e.g. "cambia la tasa a 88.50" or "pon la tasa en 87.20"
    const rateMatch = text.match(/(?:cambi|pon|ajust)(?:a|ar|ame)?\s+(?:la\s+)?tasa\s+(?:a|en)\s*([0-9]+(?:[\.,][0-9]{1,2})?)/i);
    if (rateMatch) {
      const newRate = parseFloat(rateMatch[1].replace(",", "."));
      if (!isNaN(newRate) && newRate > 0) {
        pos.setRate(newRate);
        toast.success(`Tasa actualizada: Bs. ${newRate.toFixed(2)} / USD`);
        return {
          reply: `💵 **Tasa de Cambio Actualizada.**\n\nLa tasa oficial en todo el TPV ahora es de **Bs. ${newRate.toFixed(2)} por USD**. Todos los precios en bolívares de las empanadas y bebidas se han recalculado en vivo.`,
          action: {
            type: "change_rate",
            title: "Tasa Actualizada",
            detail: `Bs. ${newRate.toFixed(2)} / USD`,
            badge: "Bimoneda",
          },
        };
      }
    }

    return null;
  }
'''

# Find place to insert action_logic before sendMessage
send_msg_idx = code.find("async function sendMessage(")
if send_msg_idx != -1:
    code = code[:send_msg_idx] + action_logic + "\n  " + code[send_msg_idx:]

# 3. Update sendMessage to use executeNaturalLanguageCommand
old_send_body = '''    try {
      const context = buildBusinessContext();
      const currentHistory = (conversations[activeAssistant.id] ?? []).slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await queryGeminiAiServerFn({
        data: {
          apiKey: geminiApiKey,
          userPrompt: text,
          context,
          history: currentHistory,
        },
      });

      const botMsg: Message = {
        role: "assistant",
        content: res.reply,
        isAiPowered: res.source === "gemini",
      };

      setConversations((prev) => ({
        ...prev,
        [activeAssistant.id]: [...(prev[activeAssistant.id] ?? []), botMsg],
      }));
    } catch (e: any) {
      toast.error("Error al procesar la respuesta con el asistente");
    } finally {
      setIsTyping(false);
    }'''

new_send_body = '''    try {
      // Step 1: Check if the user command is an actionable instruction to edit or execute something
      const localActionResult = executeNaturalLanguageCommand(text);

      if (localActionResult) {
        const botMsg: Message = {
          role: "assistant",
          content: localActionResult.reply,
          actionExecuted: localActionResult.action,
        };
        setConversations((prev) => ({
          ...prev,
          [activeAssistant.id]: [...(prev[activeAssistant.id] ?? []), botMsg],
        }));
        setIsTyping(false);
        return;
      }

      // Step 2: Fall back to conversational knowledge and AI reasoning
      const context = buildBusinessContext();
      const currentHistory = (conversations[activeAssistant.id] ?? []).slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await queryGeminiAiServerFn({
        data: {
          apiKey: geminiApiKey,
          userPrompt: text,
          context,
          history: currentHistory,
        },
      });

      const botMsg: Message = {
        role: "assistant",
        content: res.reply,
        isAiPowered: res.source === "gemini",
      };

      setConversations((prev) => ({
        ...prev,
        [activeAssistant.id]: [...(prev[activeAssistant.id] ?? []), botMsg],
      }));
    } catch (e: any) {
      toast.error("Error al procesar la respuesta con el asistente");
    } finally {
      setIsTyping(false);
    }'''

if old_send_body in code:
    code = code.replace(old_send_body, new_send_body, 1)

# 4. Update Message rendering in chat to display executed action card
old_render_msg = '''                    {msg.content}
                  </div>
                </div>
              ))}'''

new_render_msg = '''                    {msg.content}

                    {msg.actionExecuted && (
                      <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-foreground flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                            ✓
                          </div>
                          <div>
                            <div className="font-bold text-[11px] text-emerald-700 dark:text-emerald-300">
                              {msg.actionExecuted.title}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {msg.actionExecuted.detail}
                            </div>
                          </div>
                        </div>
                        {msg.actionExecuted.badge && (
                          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                            {msg.actionExecuted.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}'''

if old_render_msg in code:
    code = code.replace(old_render_msg, new_render_msg, 1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("AssistantsModule action engine integrated successfully")
