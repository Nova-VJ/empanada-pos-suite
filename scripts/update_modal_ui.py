file_path = r"c:\Users\patri\Downloads\TPV Mundial\lovable-frontend\src\components\erp\ProductsModule.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "{/* Ficha"
end_marker = "</Modal>\n      )}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx) + len(end_marker)

new_modal = """{/* Ficha Técnica & Escandallo de Costo Interactivo (Modal Explicativo y Dinámico) */}
      {costProduct && (
        <Modal
          title={
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
                <Calculator className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="truncate font-bold">Escandallo Dinámico: {costProduct.name}</span>
                <span className="text-[10px] text-muted-foreground font-normal">Cálculo matemático real basado en insumos e inventario</span>
              </div>
            </div>
          }
          onClose={() => setCostProduct(null)}
          width="max-w-2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-[11px] text-muted-foreground">
                Margen proyectado: <b className="text-emerald-600 dark:text-emerald-400 text-xs">{costProduct.priceUsd > 0 ? (((costProduct.priceUsd - (parseFloat(customCost) || 0.6)) / costProduct.priceUsd) * 100).toFixed(1) : 0}%</b>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCostProduct(null)}
                  className="rounded-xl border border-border bg-secondary px-4 py-2 font-semibold text-foreground text-xs hover:bg-secondary/80"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCost}
                  className="rounded-xl bg-primary px-5 py-2 font-bold text-primary-foreground text-xs shadow-xs hover:bg-primary/90 flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Guardar Nuevo Costo (${parseFloat(customCost || "0").toFixed(2)})</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Resumen Comercial */}
            <div className="grid grid-cols-3 gap-2.5 rounded-2xl border border-border bg-gradient-to-br from-secondary/40 to-card p-3.5 text-center">
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">Precio Venta (PVP)</div>
                <div className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {fmtUsd(costProduct.priceUsd)}
                </div>
                <div className="text-[10px] text-muted-foreground">{fmtBs(costProduct.priceUsd * rate)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">Costo Escandallo</div>
                <div className="font-mono text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  ${parseFloat(customCost || "0").toFixed(2)} USD
                </div>
                <div className="text-[10px] text-muted-foreground">{fmtBs((parseFloat(customCost) || 0) * rate)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">Ganancia Neta</div>
                <div className="font-mono text-base font-bold text-foreground mt-0.5">
                  ${(costProduct.priceUsd - (parseFloat(customCost) || 0.6)).toFixed(2)} USD
                </div>
                <div className="text-[10px] text-primary font-bold">
                  {costProduct.priceUsd > 0 ? (((costProduct.priceUsd - (parseFloat(customCost) || 0.6)) / costProduct.priceUsd) * 100).toFixed(1) : 0}% margen
                </div>
              </div>
            </div>

            {/* Selector de Fuente de Datos */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-secondary/80 border border-border">
              <button
                type="button"
                onClick={() => handleSelectCostMode("facturas")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition ${
                  costTab === "facturas"
                    ? "bg-card text-foreground shadow-xs border border-border text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>🏢 Mis Facturas (Tu Inventario)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectCostMode("mercado")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition ${
                  costTab === "mercado"
                    ? "bg-card text-foreground shadow-xs border border-border text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Globe2 className="h-3.5 w-3.5" />
                <span>🌐 Referencia Oficial Maracay</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectCostMode("manual")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition ${
                  costTab === "manual"
                    ? "bg-card text-foreground shadow-xs border border-border text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>✏️ Ajustar Insumos</span>
              </button>
            </div>

            {/* Pestaña 1: Facturas Reales del Negocio */}
            {costTab === "facturas" && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-2.5">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-foreground text-xs">
                      Cálculo 100% Exacto con Facturas de Compra de Dr. Empanadas
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      El sistema cruza las compras registradas a tus proveedores de Maracay y aplica la merma gastronómica estándar:
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-[11px] text-left">
                    <thead className="border-b border-border bg-secondary/50 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Rubro</th>
                        <th className="px-3 py-2 font-semibold">Proveedor & Factura Real</th>
                        <th className="px-3 py-2 font-semibold text-center">Porción</th>
                        <th className="px-3 py-2 font-semibold text-right">Costo Empanada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono">
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium text-foreground">🌽 Masa de Maíz</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">
                          Polar FAC-88210 · Bulto $19 ($0.95/kg)
                        </td>
                        <td className="px-3 py-2 text-center text-muted-foreground">{portionDoughG}g (44g harina)</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">
                          ${(((portionDoughG * 0.55) / 1000) * flourCostKg + 0.01).toFixed(3)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium text-foreground">🥩 Relleno Guisado</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">
                          {getFillingDefaults(costProduct.name).invoice} (${fillingCostKg.toFixed(2)}/kg)
                        </td>
                        <td className="px-3 py-2 text-center text-muted-foreground">{portionFillingG}g (merma 30%)</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">
                          ${(((portionFillingG * 1.30) / 1000) * fillingCostKg).toFixed(3)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium text-foreground">🛢️ Aceite Freidora</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">
                          Bidón Polar Turmero 18L ($32.00 · $1.77/L)
                        </td>
                        <td className="px-3 py-2 text-center text-muted-foreground">{portionOilMl}ml absorción</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">
                          ${(((portionOilMl) / 1000) * oilCostL).toFixed(3)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium text-foreground">📦 Empaque & Gas</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">
                          Envases Chacao FAC-31092 ($0.055) + Gas
                        </td>
                        <td className="px-3 py-2 text-center text-muted-foreground">1 servicio</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">
                          ${(packCostUnit + energyCostUnit).toFixed(3)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="border-t-2 border-border bg-secondary/40 font-mono font-bold">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 font-sans text-foreground">
                          Total Calculado de tus Facturas
                        </td>
                        <td className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400 text-xs">
                          ${customCost} USD
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Pestaña 2: Referencia Oficial Mayorista Maracay */}
            {costTab === "mercado" && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3.5 space-y-2.5">
                <div className="flex items-start gap-2">
                  <Globe2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-foreground text-xs">
                      ¿Por qué dice $0.60 el costo estimado y de dónde sale?
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Proviene de la <b>Canasta Gastronómica Mayorista de Maracay (Mercado Mayorista Intercomunal & CENDAS Aragua, Octubre 2026)</b>. Se usa como referencia verificable cuando aún no se registran facturas:
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-[11px] text-left">
                    <thead className="border-b border-border bg-secondary/50 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Rubro Mayorista</th>
                        <th className="px-3 py-2 font-semibold">Fuente Oficial de Referencia</th>
                        <th className="px-3 py-2 font-semibold text-center">Porción</th>
                        <th className="px-3 py-2 font-semibold text-right">Costo Estimado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono">
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium text-foreground">🌽 Masa de Maíz</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">Bulto Harina PAN ($21 mayorista)</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">80g masa</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">$0.12 USD</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium text-foreground">🥩 Relleno Guisado</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">Carne/Queso promedio ($5.60/kg)</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">60g guisado</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">$0.32 USD</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium text-foreground">🛢️ Aceite Vegetal</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">Bidón 18L ($34 mayorista)</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">25ml merma</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">$0.09 USD</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-sans font-medium text-foreground">📦 Empaque y Gas</td>
                        <td className="px-3 py-2 text-muted-foreground font-sans">Papel parafinado + gas comercial</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">1 empanada</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">$0.07 USD</td>
                      </tr>
                    </tbody>
                    <tfoot className="border-t-2 border-border bg-secondary/40 font-mono font-bold">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 font-sans text-foreground">Total Estimado Oficial Maracay</td>
                        <td className="px-3 py-2 text-right text-blue-600 dark:text-blue-400 text-xs">$0.60 USD</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Pestaña 3: Ajustar Insumos (Tu Receta y Precios del Dueño) */}
            {costTab === "manual" && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-3">
                <div className="flex items-start gap-2">
                  <Sliders className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-foreground text-xs">
                      Personaliza el Costo de tu Mercancía o Gramaje
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Si compras insumos a otro precio o tus empanadas tienen porciones especiales, ajústalas aquí y el costo se calculará al instante:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <label className="font-semibold text-foreground text-[11px]">
                    Harina de Maíz ($/Kg)
                    <input
                      type="number"
                      step="0.05"
                      value={flourCostKg}
                      onChange={(e) => handleIngredientChange("flour", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs font-bold mt-1"
                    />
                  </label>
                  <label className="font-semibold text-foreground text-[11px]">
                    Relleno ($/Kg)
                    <input
                      type="number"
                      step="0.10"
                      value={fillingCostKg}
                      onChange={(e) => handleIngredientChange("filling", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs font-bold mt-1"
                    />
                  </label>
                  <label className="font-semibold text-foreground text-[11px]">
                    Aceite ($/Litro)
                    <input
                      type="number"
                      step="0.05"
                      value={oilCostL}
                      onChange={(e) => handleIngredientChange("oil", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs font-bold mt-1"
                    />
                  </label>
                  <label className="font-semibold text-foreground text-[11px]">
                    Gramos de Masa
                    <input
                      type="number"
                      step="5"
                      value={portionDoughG}
                      onChange={(e) => handleIngredientChange("doughG", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs font-bold mt-1"
                    />
                  </label>
                  <label className="font-semibold text-foreground text-[11px]">
                    Gramos de Relleno
                    <input
                      type="number"
                      step="5"
                      value={portionFillingG}
                      onChange={(e) => handleIngredientChange("fillingG", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs font-bold mt-1"
                    />
                  </label>
                  <label className="font-semibold text-foreground text-[11px]">
                    Aceite por Fritura (ml)
                    <input
                      type="number"
                      step="5"
                      value={portionOilMl}
                      onChange={(e) => handleIngredientChange("oilMl", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs font-bold mt-1"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Ajuste Rápido de Costo Global */}
            <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground">Costo Final Aplicado ($ USD)</span>
                <span className="text-[10px] text-muted-foreground">Puedes escribir el monto directo o usar un atajo:</span>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-muted-foreground">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.10"
                    value={customCost}
                    onChange={(e) => setCustomCost(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/50 pl-7 pr-3 py-1.5 text-foreground font-mono text-sm font-bold focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div className="flex gap-1.5">
                  {["0.50", "0.55", "0.60", "0.75", "0.90"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setCustomCost(v)}
                      className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs font-semibold transition ${
                        customCost === v
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      ${v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}"""

content = content[:start_idx] + new_modal + content[end_idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Modal UI updated successfully")
