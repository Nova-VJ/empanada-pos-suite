import { useState } from "react";
import { Building2, FileText, Globe, Percent, Printer, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { inputCls } from "../pos/Modal";

export function SettingsModule() {
  const pos = usePos();
  const { companySettings, fiscal, rate } = pos;
  const [tab, setTab] = useState<"company" | "tax" | "series" | "printer" | "users" | "ecommerce">("company");
  const [form, setForm] = useState(companySettings);
  const [bcvInput, setBcvInput] = useState(String(rate));

  function handleSaveCompany() {
    pos.updateCompanySettings(form);
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
        </div>
      )}

      {tab === "tax" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs max-w-md">
            <h3 className="text-sm font-semibold text-foreground">Tasa Oficial BCV (Bs. / USD)</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Actualiza instantáneamente todos los precios en bolívares de la aplicación.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={bcvInput}
                onChange={(e) => setBcvInput(e.target.value)}
                className={`${inputCls} font-mono text-base font-bold`}
              />
              <button
                onClick={handleSaveRate}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shrink-0"
              >
                Actualizar BCV
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
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre Completo</th>
                <th className="px-4 py-3 font-semibold">Rol / Permisos</th>
                <th className="px-4 py-3 font-semibold">Estación Asignada</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { name: "María Pérez", role: "Cajero Principal", station: "Caja 01 · TPV", active: true },
                { name: "Carlos Gómez", role: "Maestro Freidor (KDS)", station: "Estación Freidoras 1-3", active: true },
                { name: "Dr. Empanadas Admin", role: "Gerente General", station: "Todas las Sucursales", active: true },
                { name: "Lic. Luisana Torres", role: "Contador Público Colegiado", station: "Contabilidad & SENIAT", active: true },
              ].map((u) => (
                <tr key={u.name}>
                  <td className="px-4 py-3 font-semibold text-foreground">{u.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.station}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-module-inventory-light px-2 py-0.5 text-[11px] font-semibold text-module-inventory">
                      Activo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "ecommerce" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="border-b border-border px-5 py-3.5 bg-secondary/30">
            <h3 className="text-sm font-semibold text-foreground">Sincronización Omnicanal, Delivery y Webhooks</h3>
            <p className="text-xs text-muted-foreground">
              NovaSystem es la fuente única de verdad para el stock de empanadas en tienda física, WhatsApp y apps de delivery.
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
    </div>
  );
}
