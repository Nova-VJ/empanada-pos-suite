import { useState } from "react";
import { Building2, FileText, Globe, Percent, Printer, Save, Users, Bell, MessageSquare, Smartphone, CheckCircle2, Send, Share2, Volume2, Download, UploadCloud, RefreshCw, Database } from "lucide-react";
import { openWhatsApp, normalizeWhatsAppPhone } from "@/lib/whatsapp";
import { playCashChime } from "@/services/sound";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { inputCls } from "../pos/Modal";
import { UsersManagement } from "./UsersManagement";

export function SettingsModule() {
  const pos = usePos();
  const { companySettings, fiscal, rate } = pos;
  const [tab, setTab] = useState<"company" | "tax" | "series" | "printer" | "users" | "ecommerce" | "whatsapp" | "backup">("company");
  const [simMessage, setSimMessage] = useState<string>("order");
  const [testPhone, setTestPhone] = useState(form.ownerPhone || form.phone || "0412-1234567");
  const [notifyOnPhone, setNotifyOnPhone] = useState(form.notifyOrdersOnPhone ?? true);
  const [form, setForm] = useState(companySettings);
  useEffect(() => {
    setForm(companySettings);
  }, [companySettings]);
  const [bcvInput, setBcvInput] = useState(String(rate));

  function handleSaveCompany() {
    pos.updateCompanySettings({ ...form, isConfigured: true, isLive: true });
    toast.success("Datos fiscales de la empresa actualizados");
  }

  function handleSaveRate() {
    const r = parseFloat(bcvInput.replace(",", "."));
    if (!(r > 0 && r < 100000)) {
      toast.error("Tasa inválida");
      return;
    }
    pos.setRate(r);
    toast.success(`Tasa BCV actualizada a Bs. ${r.toFixed(2)} / USD`);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configuración del Sistema y Hardware Fiscal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Datos de empresa SENIAT, tasas de IVA/IGTF, series de facturación, impresora fiscal HKA80, usuarios y webhooks
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-2">
        {[
          { id: "company", label: "Empresa", icon: Building2 },
          { id: "tax", label: "Tasas BCV, IVA e IGTF", icon: Percent },
          { id: "series", label: "Series SENIAT", icon: FileText },
          { id: "printer", label: "Impresora Fiscal HKA", icon: Printer },
          { id: "users", label: "Usuarios y Roles", icon: Users },
          { id: "ecommerce", label: "Delivery & Webhooks", icon: Globe },
          { id: "whatsapp", label: "WhatsApp & Notificaciones al Teléfono", icon: Smartphone },
          { id: "backup", label: "Copias de Seguridad (Backup & Restaurar)", icon: Download },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "company" && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs max-w-3xl">
          <h3 className="text-sm font-semibold text-foreground mb-4">Datos Fiscales de la Empresa (SENIAT)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <label className="sm:col-span-2 font-semibold text-foreground">
              Razón Social
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="font-semibold text-foreground">
              RIF Fiscal SENIAT
              <input
                value={form.rif}
                onChange={(e) => setForm({ ...form, rif: e.target.value })}
                className={`${inputCls} mt-1 font-mono font-bold`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Sucursal Activa
              <input
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Correo Electrónico
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Teléfono
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={`${inputCls} mt-1 font-mono`}
              />
            </label>
            <label className="sm:col-span-2 font-semibold text-foreground">
              Dirección Fiscal
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Ciudad
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Método de Valoración de Inventario
              <select
                value={form.valuationMethod}
                onChange={(e) => setForm({ ...form, valuationMethod: e.target.value as "pmp" | "fifo" })}
                className={`${inputCls} mt-1`}
              >
                <option value="pmp">PMP (Precio Medio Ponderado)</option>
                <option value="fifo">PEPS / FIFO (Primero en Entrar, Primero en Salir)</option>
              </select>
            </label>
            <div className="sm:col-span-2 pt-2">
              <button
                onClick={handleSaveCompany}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
              >
                <Save className="h-4 w-4" />
                Guardar cambios
              </button>
            </div>
          </div>

          {/* Tarjeta de Gestión de Datos de Producción / Modo Real */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">🧹</span>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Modo Producción Real & Limpieza de Datos
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    El sistema está configurado para operar en <strong>modo 100% real</strong>. Si deseas reiniciar todas las ventas de prueba, turnos y arqueos para arrancar tu restaurante desde cero (con Ticket #1 y Caja cerrada lista para abrir con el fondo del día), pulsa este botón. Tus productos del menú y proveedores registrados se conservarán intactos.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("¿Estás seguro de que deseas limpiar todos los datos de prueba y comenzar en CERO modo producción real?\n\n• Se borrarán las ventas de prueba previas.\n• El contador de tickets volverá al #1.\n• La caja quedará cerrada lista para el fondo inicial en Bs.\n• Tus productos y proveedores NO se borrarán.")) {
                      pos.resetProductionData();
                      toast.success("✅ Base de datos reiniciada a CERO", {
                        description: "Sistema listo para operaciones reales. Inicia el día abriendo caja.",
                      });
                    }
                  }}
                  className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🧹 Iniciar en 0 Modo Producción Real</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "tax" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs max-w-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Tasa de Cambio en Vivo (Bs. / USD)</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Sincronización automática cada 5 min desde <b>monitordolarve.com</b>, <b>monitordedivisavenezuela.com</b> y <b>dolarapi.com</b>.
                </p>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Sincronización activa" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input
                value={bcvInput}
                onChange={(e) => setBcvInput(e.target.value)}
                className={`${inputCls} w-36 font-mono text-base font-bold`}
              />
              <button
                onClick={handleSaveRate}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shrink-0 hover:bg-primary/90 transition"
              >
                Fijar tasa
              </button>
              <button
                onClick={() => pos.setModal("bcv")}
                className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground shrink-0 hover:bg-secondary/80 transition"
              >
                Abrir Monitor Multi-Divisas
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="border-b border-border px-5 py-3.5 bg-secondary/30">
              <h3 className="text-sm font-semibold text-foreground">Alícuotas Tributarias SENIAT Configuradas</h3>
            </div>
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Impuesto / Tributo</th>
                  <th className="px-4 py-3 font-semibold">Código Fiscal HKA</th>
                  <th className="px-4 py-3 font-semibold text-right">Alícuota (%)</th>
                  <th className="px-4 py-3 font-semibold">Por defecto</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-semibold text-foreground">IVA Alícuota General (Gravable G)</td>
                  <td className="px-4 py-3 font-mono">Tasa 1 (! / G)</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">16.00%</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">Sí</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-module-inventory-light px-2 py-0.5 text-[11px] font-semibold text-module-inventory">
                      Activo
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-foreground">IGTF Pagos en Divisas / Moneda Extranjera</td>
                  <td className="px-4 py-3 font-mono">Comando Fiscal IGTF</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-module-cash">3.00%</td>
                  <td className="px-4 py-3">Automático en USD</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-module-inventory-light px-2 py-0.5 text-[11px] font-semibold text-module-inventory">
                      Activo
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-foreground">IVA Alícuota Reducida (R)</td>
                  <td className="px-4 py-3 font-mono">Tasa 2 (" / R)</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">8.00%</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-module-inventory-light px-2 py-0.5 text-[11px] font-semibold text-module-inventory">
                      Activo
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-foreground">Exento de IVA (E)</td>
                  <td className="px-4 py-3 font-mono">Tasa 0 (Espacio / E)</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">0.00%</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-module-inventory-light px-2 py-0.5 text-[11px] font-semibold text-module-inventory">
                      Activo
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "series" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre de Serie</th>
                <th className="px-4 py-3 font-semibold">Prefijo / Control</th>
                <th className="px-4 py-3 font-semibold">Máquina Fiscal SENIAT</th>
                <th className="px-4 py-3 font-semibold text-right">Siguiente Nº</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 font-semibold text-foreground">Facturación Fiscal Principal Caja 01</td>
                <td className="px-4 py-3 font-mono">00-0005xxxx</td>
                <td className="px-4 py-3 font-mono">MH ZPA0012345</td>
                <td className="px-4 py-3 text-right font-mono font-bold">{String(fiscal.lastInvoice + 1).padStart(8, "0")}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-module-inventory-light px-2 py-0.5 text-[11px] font-semibold text-module-inventory">
                    Activa
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-foreground">Notas de Crédito / Devoluciones Fiscal</td>
                <td className="px-4 py-3 font-mono">NC-0000xxxx</td>
                <td className="px-4 py-3 font-mono">MH ZPA0012345</td>
                <td className="px-4 py-3 text-right font-mono font-bold">00000018</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-module-inventory-light px-2 py-0.5 text-[11px] font-semibold text-module-inventory">
                    Activa
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-foreground">Talonario Contingencia SENIAT (Forma Libre)</td>
                <td className="px-4 py-3 font-mono">B-0001xxxx</td>
                <td className="px-4 py-3 font-mono">Imprenta Autorizada</td>
                <td className="px-4 py-3 text-right font-mono font-bold">00010250</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    Respaldo
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === "printer" && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Impresora Fiscal Física SENIAT</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {fiscal.model} · Puerto {fiscal.port} @ {fiscal.baud} bps · Protocolo tramas STX/ETX/LRC
              </p>
            </div>
            <button
              onClick={() => pos.setModal("printer")}
              className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              🖨️ Abrir Consola de Diagnóstico Serial
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="rounded-xl border border-border bg-secondary/40 p-3">
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">Estado Puerto</div>
              <div className="font-mono text-sm font-bold text-module-inventory mt-0.5">
                {fiscal.connected ? `Conectado (${fiscal.port})` : "Desconectado"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-3">
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">Modo Operación</div>
              <div className="font-mono text-sm font-bold text-foreground mt-0.5">
                {fiscal.fiscalMode ? "Fiscal Serial" : "Ticket Virtual"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-3">
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">Última Factura</div>
              <div className="font-mono text-sm font-bold text-foreground mt-0.5">
                #{String(fiscal.lastInvoice).padStart(8, "0")}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-3">
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">Último Reporte Z</div>
              <div className="font-mono text-sm font-bold text-foreground mt-0.5">Z #{fiscal.lastZ}</div>
            </div>
          </div>
        </div>
      )}

      {tab === "users" && (
        <UsersManagement />
      )}

      {tab === "ecommerce" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="border-b border-border px-5 py-3.5 bg-secondary/30">
            <h3 className="text-sm font-semibold text-foreground">Sincronización Omnicanal, Delivery y Webhooks</h3>
            <p className="text-xs text-muted-foreground">
              NovaStock es la fuente única de verdad para el stock de empanadas en tienda física, WhatsApp y apps de delivery.
            </p>
          </div>
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Hora</th>
                <th className="px-4 py-3 font-semibold">Canal / Integración</th>
                <th className="px-4 py-3 font-semibold">Evento</th>
                <th className="px-4 py-3 font-semibold">Dirección</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { time: "Hace 2 min", channel: "WhatsApp Business Bot", event: "sync_catalog_prices_bcv", dir: "→ Saliente", status: "processed" },
                { time: "Hace 14 min", channel: "PedidosYa Venezuela", event: "order_webhook_received", dir: "← Entrante", status: "processed" },
                { time: "Hace 28 min", channel: "Yummy Rides / Eats", event: "stock_update_chacao", dir: "→ Saliente", status: "processed" },
                { time: "Hace 1 hora", channel: "BCV Rate Monitor", event: "exchange_rate_verified", dir: "← Entrante", status: "processed" },
              ].map((ev, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{ev.time}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{ev.channel}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{ev.event}</td>
                  <td className="px-4 py-3">{ev.dir}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-module-inventory-light px-2 py-0.5 text-[11px] font-semibold text-module-inventory">
                      Procesado ✓
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "whatsapp" && (
        <div className="space-y-6 max-w-5xl">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-emerald-600" />
                  <span>Conexión de WhatsApp & Notificaciones Push al Teléfono</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Conexión directa con la app oficial de WhatsApp para despacho de pedidos, comprobantes a clientes y alertas gerenciales.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1 text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Enlace wa.me Activo (Venezuela +58)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna Izquierda: Configuración de Teléfono */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    📲 Teléfono Móvil de la Gerencia / Dueño (Alertas de Pedidos y Cierres):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={testPhone}
                      onChange={(e) => {
                        setTestPhone(e.target.value);
                        setForm({ ...form, ownerPhone: e.target.value });
                      }}
                      placeholder="0412-1234567 o +58414..."
                      className={`${inputCls} font-mono text-xs flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        pos.updateCompanySettings({ ownerPhone: testPhone, notifyOrdersOnPhone: notifyOnPhone });
                        toast.success("Teléfono de gerencia guardado correctamente");
                      }}
                      className="rounded-xl bg-primary text-primary-foreground px-3.5 py-1.5 font-bold hover:opacity-90 transition shrink-0 cursor-pointer"
                    >
                      Guardar
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Formato compatible: 0412, 0414, 0416, 0424 o internacional (+58). Formateado: <b>+{normalizeWhatsAppPhone(testPhone) || "58..."}</b>
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-3">
                  <label className="flex items-center gap-2.5 font-semibold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyOnPhone}
                      onChange={(e) => {
                        setNotifyOnPhone(e.target.checked);
                        pos.updateCompanySettings({ notifyOrdersOnPhone: e.target.checked });
                        toast.success(e.target.checked ? "Notificaciones al teléfono activadas" : "Notificaciones al teléfono desactivadas");
                      }}
                      className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                    />
                    <span>Notificar pedidos nuevos al teléfono / navegador</span>
                  </label>

                  <label className="flex items-center gap-2.5 font-semibold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.lowStockAlertsEnabled !== false}
                      onChange={(e) => {
                        pos.updateCompanySettings({ lowStockAlertsEnabled: e.target.checked });
                        toast.success(e.target.checked ? "Alertas de stock bajo activadas" : "Alertas de stock bajo desactivadas");
                      }}
                      className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                    />
                    <span>Alertas automáticas de inventario bajo (Harina, Queso, Aceite)</span>
                  </label>
                </div>

                {/* Botones de Prueba */}
                <div className="space-y-2 pt-2">
                  <div className="font-semibold text-foreground">Probar Enlaces y Notificaciones:</div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playCashChime();
                        if (typeof window !== "undefined" && "Notification" in window) {
                          Notification.requestPermission().then((perm) => {
                            if (perm === "granted") {
                              new Notification("🔔 Pedido de Prueba #00123 · Dr. Empanadas", {
                                body: "2x Empanada de Mechada + 1x Malta Polar · $3.50 USD (Bs. 175.00)",
                                icon: "/favicon.png",
                              });
                              toast.success("¡Notificación push enviada con éxito a este dispositivo!");
                            } else {
                              toast.info("Por favor concede permiso de notificaciones en tu navegador.");
                            }
                          });
                        } else {
                          toast.info("Sonido de campanilla probado.");
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 font-bold text-primary hover:bg-primary/20 transition cursor-pointer"
                    >
                      <Bell className="h-4 w-4" /> Probar Notificación Push / Sonido
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const msg = `🔔 *PRUEBA DE CONEXIÓN WHATSAPP · NOVASTOCK*\n🏪 *${pos.companySettings.name}*\n📍 San Jacinto, Maracay\n\n✅ La conexión de alertas automáticas, comandas y comprobantes digitales a WhatsApp está configurada y funcionando al 100%.\n\n🥟 _Sistema de Facturación y TPV NovaStock_`;
                        openWhatsApp({ phone: testPhone, message: msg });
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                    >
                      <Share2 className="h-4 w-4" /> Enviar Mensaje de Prueba Real a mi WhatsApp
                    </button>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Simulador de Pantalla WhatsApp en Vivo */}
              <div className="flex flex-col items-center">
                <div className="text-[11px] font-bold text-muted-foreground uppercase mb-2">
                  Simulador de Pantalla Móvil WhatsApp
                </div>

                {/* Selector de mensaje para simular */}
                <div className="flex gap-1.5 mb-3 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSimMessage("order")}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                      simMessage === "order" ? "bg-emerald-600 text-white" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    🥟 Nuevo Pedido
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimMessage("stock")}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                      simMessage === "stock" ? "bg-emerald-600 text-white" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    ⚠️ Stock Bajo
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimMessage("z")}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                      simMessage === "z" ? "bg-emerald-600 text-white" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    📊 Cierre Z Diario
                  </button>
                </div>

                {/* Smartphone Frame */}
                <div className="w-[300px] rounded-[36px] border-[6px] border-slate-800 bg-slate-900 shadow-xl overflow-hidden text-xs">
                  {/* WhatsApp Top Bar */}
                  <div className="bg-[#075E54] text-white p-3 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm">
                      🥟
                    </div>
                    <div className="leading-tight">
                      <div className="font-bold text-xs truncate">{pos.companySettings.name} Gerencia</div>
                      <div className="text-[10px] text-emerald-200">en línea</div>
                    </div>
                  </div>

                  {/* Chat Body (WhatsApp Background Style) */}
                  <div className="bg-[#0b141a] p-3 min-h-[300px] flex flex-col justify-end space-y-2">
                    {/* Mensaje de Chat simulado */}
                    <div className="self-start max-w-[90%] rounded-xl rounded-tl-none bg-[#202c33] text-white p-2.5 shadow-xs space-y-1 text-[11px] leading-relaxed">
                      {simMessage === "order" && (
                        <>
                          <div className="font-bold text-emerald-400">🔔 NUEVO PEDIDO REGISTRADO #00124</div>
                          <div className="text-slate-300">🏪 {pos.companySettings.name} · {pos.companySettings.branch}</div>
                          <div className="text-slate-400 text-[10px]">⏰ Hora: 10:45 AM · Para Llevar</div>
                          <div className="border-t border-slate-700 my-1 pt-1">
                            <div>• 2x Empanada Mechada</div>
                            <div>• 1x Empanada Queso Llanero</div>
                            <div>• 1x Malta Polar Botella</div>
                          </div>
                          <div className="font-bold text-emerald-300 pt-1">
                            💰 Total: $4.80 USD (Bs. 240.00)
                          </div>
                          <div className="text-[10px] text-slate-400">
                            💳 Pago Móvil Bancamiga (Ref: 8391)
                          </div>
                        </>
                      )}

                      {simMessage === "stock" && (
                        <>
                          <div className="font-bold text-amber-400">⚠️ ALERTA DE STOCK CRÍTICO</div>
                          <div className="text-slate-300">🏪 Cocina Chacao / San Jacinto</div>
                          <div className="border-t border-slate-700 my-1 pt-1 text-slate-300">
                            <div>• <b>Harina P.A.N. Blanco:</b> 3 bultos (Mínimo: 5)</div>
                            <div>• <b>Aceite Vegetal:</b> 1 bidón (Mínimo: 3)</div>
                          </div>
                          <div className="text-[10px] text-amber-300 pt-1">
                            💡 Sugerencia: Solicitar pedido a Galpón 2 Mayorista.
                          </div>
                        </>
                      )}

                      {simMessage === "z" && (
                        <>
                          <div className="font-bold text-emerald-400">📊 CIERRE FISCAL Z #12 CONSOLIDADO</div>
                          <div className="text-slate-300">📅 Hoy a las 8:30 PM · Dr. Empanadas</div>
                          <div className="text-slate-400 text-[10px]">👤 Cajero: Principal · 64 Tickets</div>
                          <div className="border-t border-slate-700 my-1 pt-1 text-slate-300">
                            <div>• Ventas USD: $312.50</div>
                            <div>• Pago Móvil: Bs. 8.450,00</div>
                            <div>• Punto POS: Bs. 7.200,00</div>
                          </div>
                          <div className="font-bold text-emerald-300 pt-1">
                            ✅ Cuadre Exacto (Diferencia: Bs. 0,00)
                          </div>
                        </>
                      )}

                      <div className="text-right text-[9px] text-slate-400">10:46 AM ✓✓</div>
                    </div>
                  </div>

                  {/* Bottom input simulation */}
                  <div className="bg-[#1f2c34] p-2 flex items-center gap-2">
                    <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1 text-[10px] text-slate-400">
                      Escribe un mensaje...
                    </div>
                    <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px]">
                      ➤
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {tab === "backup" && (
        <div className="space-y-6 max-w-4xl animate-in fade-in-50">
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">💾</span>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Centro de Copias de Seguridad (Backup & Restauración)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Protege todo tu trabajo: productos, precios, recetas, clientes, deudores, proveedores y configuración. Descarga un archivo de respaldo o restaura uno anterior con un solo clic.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tarjeta 1: Descargar Backup */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3.5 shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Descargar Copia de Seguridad
                    </h4>
                    <span className="text-[10px] text-muted-foreground">Archivo .JSON completo</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Genera y descarga en tu computadora o teléfono un archivo con el 100% de tus datos actuales ({pos.products.length} productos, {pos.categories.length} categorías, {pos.suppliers.length} proveedores y {pos.customers.length} clientes).
                </p>
              </div>

              <div className="pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    pos.downloadBackup();
                    toast.success("✅ Copia de seguridad descargada exitosamente", {
                      description: "Guarda este archivo en tu pendrive, correo o Google Drive.",
                    });
                  }}
                  className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
                >
                  <Download className="h-4 w-4" />
                  <span>Descargar Backup Ahora (.json)</span>
                </button>
              </div>
            </div>

            {/* Tarjeta 2: Subir y Restaurar Backup */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3.5 shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <UploadCloud className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Restaurar desde Archivo
                    </h4>
                    <span className="text-[10px] text-muted-foreground">Recuperar datos de archivo previo</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Si cambias de computadora, reinstalas el navegador o deseas recuperar productos que tenías antes, selecciona tu archivo .json descargado.
                </p>
              </div>

              <div className="pt-3 border-t border-border">
                <label className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 text-center">
                  <UploadCloud className="h-4 w-4" />
                  <span>Seleccionar Archivo de Respaldo (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        if (content) {
                          const res = pos.importBackup(content);
                          if (res.success) {
                            toast.success("🎉 " + res.message);
                          } else {
                            toast.error("❌ " + res.message);
                          }
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Respaldo Automático Sombra */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-3">
                <span className="text-xl">🔄</span>
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Copia Sombra Automática en este Dispositivo
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    El sistema guarda automáticamente una copia de respaldo oculta en la memoria interna cada vez que creas o editas productos, precios o proveedores. Si en algún momento sientes que algo se borró, pulsa el botón para restaurar la copia sombra.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const autoBackup =
                    localStorage.getItem("novasystem-backup-auto") ||
                    localStorage.getItem("novasystem-drempanadas-v2") ||
                    localStorage.getItem("novasystem-drempanadas-v1");
                  if (autoBackup) {
                    const res = pos.importBackup(autoBackup);
                    if (res.success) {
                      toast.success("✅ Restaurado desde la copia sombra automática con éxito");
                    } else {
                      toast.error("Error al procesar copia sombra: " + res.message);
                    }
                  } else {
                    toast.info("No se encontró copia sombra previa en este navegador");
                  }
                }}
                className="rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Restaurar Copia Sombra Automática</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
