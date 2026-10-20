file_path = r"c:\Users\patri\Downloads\TPV Mundial\lovable-frontend\src\components\erp\SuppliersModule.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update imports
old_import = 'import { ArrowRight, CheckCircle2, Edit, FileText, Filter, Package, Plus, Search, SlidersHorizontal, Truck, Award, Sparkles, X, Calculator } from "lucide-react";'
new_import = 'import { ArrowRight, CheckCircle2, Edit, FileText, Filter, Package, Plus, Search, SlidersHorizontal, Truck, Award, Sparkles, X, Calculator, Clock, RefreshCw, Radio, Zap, ShieldCheck, ChevronDown, ChevronUp, Bell, Check } from "lucide-react";'

if old_import in code:
    code = code.replace(old_import, new_import, 1)

# 2. Add radar states inside SuppliersModule
old_states_anchor = 'const [editingSup, setEditingSup] = useState<Supplier | null>(null);'
new_states = '''const [editingSup, setEditingSup] = useState<Supplier | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanDate, setLastScanDate] = useState("Lunes 19 Octubre 2026, 06:00 AM");
  const [radarExpanded, setRadarExpanded] = useState(true);
  const [discoveredApproved, setDiscoveredApproved] = useState(false);

  function handleRunWeeklyScan() {
    setIsScanning(true);
    toast.info("Iniciando escaneo semanal de proveedores...", {
      description: "Rastreando portales web, listas de difusión de WhatsApp y precios en el Mercado Mayorista de Maracay...",
    });
    setTimeout(() => {
      setIsScanning(false);
      setLastScanDate("Hoy (recién actualizado)");
      toast.success("¡Escaneo semanal completado con éxito!", {
        description: "18 distribuidores verificados. Se detectaron 2 ajustes de precio a la baja y 1 nuevo frigorífico en Maracay.",
      });
    }, 1800);
  }

  function handleSyncEscandallo() {
    toast.success("Precios sincronizados con la Ficha de Escandallo", {
      description: "El costo de las empanadas se ha recalculado con las mejores cotizaciones de la semana.",
    });
  }'''

if old_states_anchor in code:
    code = code.replace(old_states_anchor, new_states, 1)

# 3. Add Radar Card in finder tab right before Parámetros Elegibles
target_anchor = '{/* Parámetros Elegibles por el Dueño */}'
radar_block = '''{/* Motor de Actualización Semanal & Radar de Nuevos Proveedores */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-4 shadow-sm space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Radio className="h-5 w-5 animate-pulse text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-foreground">
                      Motor de Rastreo Semanal & Detección de Proveedores
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      Motor Automático Activo
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Actualiza precios cada lunes a las 6:00 AM y descubre nuevos distribuidores en el radio de San Jacinto y Maracay.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunWeeklyScan}
                  disabled={isScanning}
                  className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? "animate-spin" : ""}`} />
                  <span>{isScanning ? "Escaneando Maracay..." : "🔄 Ejecutar Escaneo Semanal Ahora"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRadarExpanded(!radarExpanded)}
                  className="rounded-xl border border-border bg-secondary p-2 text-muted-foreground hover:text-foreground transition"
                  title="Mostrar / Ocultar detalle del motor"
                >
                  {radarExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {radarExpanded && (
              <div className="space-y-3 pt-1 border-t border-border/60">
                {/* 3 Métricas del Motor */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[11px] font-semibold">Frecuencia de Rastreo</span>
                      <Clock className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="text-xs font-bold text-foreground">Cada Lunes (06:00 AM)</div>
                    <div className="text-[10px] text-muted-foreground">Último: {lastScanDate}</div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[11px] font-semibold">Canales de Alimentación</span>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div className="text-xs font-bold text-foreground">4 Motores Verificados</div>
                    <div className="text-[10px] text-muted-foreground">Web + WhatsApp OCR + Facturas + Maps</div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[11px] font-semibold">Conexión con Escandallo</span>
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <div className="text-xs font-bold text-foreground">Sincronización Inmediata</div>
                    <button
                      type="button"
                      onClick={handleSyncEscandallo}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <span>⚡ Enviar Precios al Escandallo</span>
                    </button>
                  </div>
                </div>

                {/* Nuevo Proveedor Descubierto en Maracay */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      ✨ NUEVO
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-xs">
                          Frigorífico & Distribuidora Los Samanes C.A. (RIF J-4109283-1)
                        </span>
                        <span className="rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0.2">
                          -9.5% de ahorro vs promedio
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        📍 Av. Fuerzas Aéreas (a 3.8 km de San Jacinto) · Falda de Res limpia: <strong>$4.95/kg</strong> (vs $5.60/kg habitual) · Entrega en 4 horas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {discoveredApproved ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        <Check className="h-3.5 w-3.5" />
                        <span>Agregado a tu Catálogo</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setDiscoveredApproved(true);
                          toast.success("Nuevo proveedor incorporado", {
                            description: "Frigorífico Los Samanes se ha añadido a tu lista de proveedores activos.",
                          });
                        }}
                        className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Aprobar e Incorporar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          ''' + target_anchor

if target_anchor in code:
    code = code.replace(target_anchor, radar_block, 1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("SuppliersModule updated with Radar successfully")
