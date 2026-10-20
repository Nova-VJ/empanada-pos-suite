file_path = r"c:\Users\patri\Downloads\TPV Mundial\lovable-frontend\src\components\erp\SuppliersModule.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

target_marker = '{tab === "suppliers" && ('

radar_view_code = """{/* Tab 2: Radar Mayorista Aragua (OpenStreetMap, Directorios & Galpones) */}
      {tab === "radar" && (
        <div className="space-y-4">
          {/* Header Hero */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl">📍</span>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Radar Mayorista Aragua & Directorio Geolocalizado
                  </h2>
                  <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold">
                    100% Gratuito · Sin Tarjeta de Crédito
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                  Búsqueda y cotización de insumos en tiempo real cruzando <strong>OpenStreetMap (Overpass API)</strong>, <strong>Directorios Comerciales de Aragua</strong> y el <strong>Catálogo de Galpones del Mercado Mayorista (Av. Intercomunal)</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewGalponModal(true)}
                  className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Monitorear Nuevo Galpón / Puesto</span>
                </button>
              </div>
            </div>

            {/* 3 Pilares Sin Tarjeta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="rounded-xl border border-border bg-card/80 p-3 space-y-1">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <MapPin className="h-4 w-4" />
                  <span>1. OpenStreetMap (Overpass)</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Cartografía abierta sin registros ni tarjeta. Nodos geolocalizados en San Jacinto, Turmero y Maracay centro.
                </p>
                <div className="text-[10px] font-mono text-primary font-semibold pt-0.5">
                  Radio 12 km · Coordenadas 10.2469° N
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card/80 p-3 space-y-1">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  <Building className="h-4 w-4" />
                  <span>2. Directorios Comerciales</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Páginas Amarillas Venezuela y Cámara de Industriales de Aragua (Zona Ind. San Vicente y Santa Cruz).
                </p>
                <div className="text-[10px] font-mono text-primary font-semibold pt-0.5">
                  RIF SENIAT Auditado · Canales PBX
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card/80 p-3 space-y-1">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                  <Store className="h-4 w-4" />
                  <span>3. Galpones Mercado Mayorista</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Galpones 1 al 5 en Av. Intercomunal (a 4.2 km). Sector harinas, quesos, carnes y empaques directos.
                </p>
                <div className="text-[10px] font-mono text-primary font-semibold pt-0.5">
                  Actualizable por el dueño con 1 toque
                </div>
              </div>
            </div>
          </div>

          {/* Filtros de Búsqueda */}
          <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Filtro por Fuente */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-muted-foreground font-semibold">Fuente:</span>
                {[
                  { id: "todos", label: `Todos (${localSuppliers.length})` },
                  { id: "galpon", label: `🏛️ Galpones Mayorista (${localSuppliers.filter((s) => s.sourceType === "galpon").length})` },
                  { id: "osm", label: `🗺️ OpenStreetMap (${localSuppliers.filter((s) => s.sourceType === "osm").length})` },
                  { id: "directory", label: `🏢 Directorios Aragua (${localSuppliers.filter((s) => s.sourceType === "directory").length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setRadarSourceFilter(f.id as typeof radarSourceFilter)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      radarSourceFilter === f.id
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Filtro por Zona */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground font-semibold">Zona:</span>
                <select
                  value={radarZoneFilter}
                  onChange={(e) => setRadarZoneFilter(e.target.value)}
                  className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground outline-none focus:border-primary"
                >
                  <option value="todas">Todas las zonas (Eje Aragua)</option>
                  <option value="San Jacinto">San Jacinto (&lt; 3 km)</option>
                  <option value="Mayorista">Mercado Mayorista (4.2 km)</option>
                  <option value="San Vicente">Zona Ind. San Vicente (7.8 km)</option>
                  <option value="Turmero">Turmero / ARC (8.5 km)</option>
                  <option value="Santa Cruz">Santa Cruz de Aragua (11.5 km)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Listado de Tarjetas de Proveedores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {localSuppliers
              .filter((s) => radarSourceFilter === "todos" || s.sourceType === radarSourceFilter)
              .filter((s) => radarZoneFilter === "todas" || s.zone.toLowerCase().includes(radarZoneFilter.toLowerCase()))
              .map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-card hover:border-primary/40 transition shadow-2xs p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    {/* Header de la Tarjeta */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.sourceType === "galpon"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : item.sourceType === "osm"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                          }`}>
                            {item.sourceType === "galpon" ? "🏛️ Galpón Mayorista" : item.sourceType === "osm" ? "🗺️ OpenStreetMap" : "🏢 Directorio Aragua"}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono font-semibold">
                            📍 {item.distanceKm} km · {item.zone}
                          </span>
                        </div>
                        <h4 className="font-bold text-foreground text-sm leading-tight pt-1">
                          {item.name}
                        </h4>
                      </div>

                      <span className="rounded-lg bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        -{item.savingsVsAvgPct}% ahorro
                      </span>
                    </div>

                    {/* Producto Clave y Precio */}
                    <div className="rounded-xl border border-border bg-secondary/40 p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">Insumo Clave</div>
                        <div className="font-medium text-foreground">{item.keyProduct}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">Precio Cotizado</div>
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          ${item.priceEstimateUsd.toFixed(2)} USD
                        </div>
                      </div>
                    </div>

                    {/* Datos de Contacto y Operación */}
                    <div className="text-[11px] text-muted-foreground space-y-1 pt-1">
                      <p><strong>Dirección:</strong> {item.address}</p>
                      <p><strong>RIF:</strong> {item.rif || "En trámite"} · <strong>Despacho:</strong> {item.deliveryDays}</p>
                      <p className="italic text-[10px] text-muted-foreground/90">💡 {item.notes}</p>
                    </div>
                  </div>

                  {/* Acciones de Sinergia Total */}
                  <div className="border-t border-border pt-2.5 flex items-center justify-between gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsAppQuote(item)}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Cotizar por WhatsApp</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEscandalloSimItem(item)}
                        className="rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground px-2.5 py-1.5 text-xs font-semibold transition flex items-center gap-1"
                        title="Ver impacto en el costo de la empanada"
                      >
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        <span>Simular Escandallo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickAddToSuppliers(item)}
                        className="rounded-lg border border-border bg-card hover:bg-primary hover:text-primary-foreground text-foreground px-2.5 py-1.5 text-xs font-semibold transition flex items-center gap-1"
                        title="Agregar a mis proveedores registrados"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Incorporar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      """

if target_marker in code:
    code = code.replace(target_marker, radar_view_code + target_marker, 1)

# Add Modal: newGalponModal and escandalloSimItem modal before closing component tag
closing_marker = "    </div>\n  );\n}"
modals_code = """      {/* Modal: Agregar Nuevo Galpón / Puesto a Monitoreo */}
      {newGalponModal && (
        <Modal
          title={
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-amber-600" />
              <span>Incorporar Nuevo Galpón / Puesto a Monitoreo</span>
            </div>
          }
          onClose={() => setNewGalponModal(false)}
          width="max-w-md"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setNewGalponModal(false)}
                className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddCustomGalpon}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Guardar y Monitorear</span>
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Registra un puesto nuevo del Mercado Mayorista de San Jacinto o cualquier distribuidora de Maracay. El sistema lo incluirá en los escaneos semanales:
            </p>

            <label className="block font-semibold text-foreground">
              Nombre del Puesto o Distribuidora
              <input
                type="text"
                placeholder="Ej. Distribuidora Quesos Los Llanos"
                value={newGalponForm.name}
                onChange={(e) => setNewGalponForm({ ...newGalponForm, name: e.target.value })}
                className="w-full mt-1 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-primary"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block font-semibold text-foreground">
                Ubicación / Galpón
                <input
                  type="text"
                  placeholder="Ej. Galpón 3, Puesto 12"
                  value={newGalponForm.galponZone}
                  onChange={(e) => setNewGalponForm({ ...newGalponForm, galponZone: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-primary"
                />
              </label>

              <label className="block font-semibold text-foreground">
                Rubro Principal
                <select
                  value={newGalponForm.category}
                  onChange={(e) => setNewGalponForm({ ...newGalponForm, category: e.target.value as any })}
                  className="w-full mt-1 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-primary"
                >
                  <option value="Harinas">Harinas</option>
                  <option value="Lácteos">Lácteos / Queso</option>
                  <option value="Aceites">Aceites</option>
                  <option value="Carnes">Carnes / Frigorífico</option>
                  <option value="Empaques">Empaques / Bolsas</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block font-semibold text-foreground">
                Teléfono / WhatsApp
                <input
                  type="text"
                  placeholder="Ej. +58 412 8920192"
                  value={newGalponForm.waNumber}
                  onChange={(e) => setNewGalponForm({ ...newGalponForm, waNumber: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-primary font-mono"
                />
              </label>

              <label className="block font-semibold text-foreground">
                Precio Estimado ($ USD)
                <input
                  type="number"
                  step="0.05"
                  placeholder="Ej. 4.10"
                  value={newGalponForm.priceEstimateUsd}
                  onChange={(e) => setNewGalponForm({ ...newGalponForm, priceEstimateUsd: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-primary font-mono font-bold"
                />
              </label>
            </div>

            <label className="block font-semibold text-foreground">
              Producto o Detalle
              <input
                type="text"
                placeholder="Ej. Queso Llanero Duro de Primera (Kilo)"
                value={newGalponForm.keyProduct}
                onChange={(e) => setNewGalponForm({ ...newGalponForm, keyProduct: e.target.value })}
                className="w-full mt-1 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-primary"
              />
            </label>
          </div>
        </Modal>
      )}

      {/* Modal: Simulación de Ahorro en Escandallo Gastronómico */}
      {escandalloSimItem && (
        <Modal
          title={
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <span>Impacto en Escandallo: {escandalloSimItem.name}</span>
            </div>
          }
          onClose={() => setEscandalloSimItem(null)}
          width="max-w-md"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setEscandalloSimItem(null)}
                className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleQuickAddToSuppliers(escandalloSimItem);
                  setEscandalloSimItem(null);
                }}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
              >
                Incorporar y Aplicar a Catálogo
              </button>
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">Insumo Analizado</span>
                <span className="font-bold text-foreground">{escandalloSimItem.keyProduct}</span>
              </div>
              <div className="flex items-center justify-between border-t border-emerald-500/20 pt-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Precio Cotizado por Proveedor</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  ${escandalloSimItem.priceEstimateUsd.toFixed(2)} USD
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-emerald-500/20 pt-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Ahorro frente a precio estándar</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {escandalloSimItem.savingsVsAvgPct}% menos
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
              <h5 className="font-bold text-foreground text-xs">Impacto Directo en tus Empanadas:</h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Al comprar con <strong>{escandalloSimItem.name}</strong>, el costo de producción por empanada baja aproximadamente <strong>${(escandalloSimItem.priceEstimateUsd * 0.015).toFixed(2)} USD por unidad</strong>.
              </p>
              <div className="pt-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Ahorro estimado para Dr. Empanadas: ~$65.00 a $90.00 USD al mes.</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
"""

if closing_marker in code:
    code = code.replace(closing_marker, modals_code + closing_marker, 1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Part 2: Radar view and modals injected successfully")
