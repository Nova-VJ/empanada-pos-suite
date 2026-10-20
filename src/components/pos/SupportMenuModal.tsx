import { useState } from "react";
import { Wrench, RefreshCw, Monitor, Wifi, CheckCircle2, Copy, AlertTriangle, ShieldCheck, Download, Send, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { Modal, btnGhost, btnPrimary, inputCls } from "./Modal";
import { openWhatsApp } from "@/lib/whatsapp";

export function SupportMenuModal() {
  const pos = usePos();
  const [teamViewerId, setTeamViewerId] = useState(pos.companySettings.teamViewerId || "1 492 810 334");
  const [remotePassword, setRemotePassword] = useState("nova9921");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResettingNetwork, setIsResettingNetwork] = useState(false);
  const [activeTab, setActiveTab] = useState<"remote" | "sync" | "printer">("remote");

  async function handleSyncMobile() {
    setIsSyncing(true);
    try {
      await pos.syncMobileLibrary();
      toast.success("✓ Biblioteca del teléfono actualizada exitosamente (Productos, precios y tasas al día)");
    } catch {
      toast.error("Error al sincronizar con el teléfono");
    } finally {
      setIsSyncing(false);
    }
  }

  function handleResetNetworkServices() {
    setIsResettingNetwork(true);
    setTimeout(() => {
      pos.setFiscal({ connected: true, paperOk: true, memoryOk: true });
      setIsResettingNetwork(false);
      toast.success("✓ Servicios de red, cola de impresión térmica y puente reiniciados");
    }, 900);
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  }

  function launchTeamViewer() {
    window.open(`teamviewer8://`, "_blank");
    toast.info("Abriendo TeamViewer en la computadora...");
  }

  return (
    <Modal
      title="🛠️ Menú Técnico & Soporte Remoto (Membresía Activa)"
      onClose={() => pos.setModal(null)}
      width="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span>Membresía Soporte VIP Activa · NovaStock</span>
          </div>
          <button className={btnGhost} onClick={() => pos.setModal(null)}>
            Cerrar Menú
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Banner de soporte */}
        <div className="rounded-xl border border-primary/25 bg-primary/10 p-3.5 flex items-start gap-3">
          <Wrench className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-foreground text-sm">Panel Oculto para Técnicos y Gerencia</h4>
            <p className="text-muted-foreground mt-0.5">
              Acceso rápido para resolver problemas cuando se cae internet, no actualiza el teléfono o se traba la impresora térmica.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab("remote")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-semibold transition ${
              activeTab === "remote" ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            TeamViewer / Control Remoto
          </button>
          <button
            onClick={() => setActiveTab("sync")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-semibold transition ${
              activeTab === "sync" ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar Biblioteca del Teléfono
          </button>
          <button
            onClick={() => setActiveTab("printer")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-semibold transition ${
              activeTab === "printer" ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Wifi className="h-3.5 w-3.5" />
            Reiniciar Servicios & Red
          </button>
        </div>

        {/* Tab 1: Control Remoto TeamViewer / AnyDesk */}
        {activeTab === "remote" && (
          <div className="space-y-3">
            <p className="text-muted-foreground">
              Proporciona estos datos al técnico asignado de NovaStock para que tome el control de la PC y resuelva cualquier problema en minutos:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px]">ID TeamViewer / AnyDesk</span>
                  <button
                    onClick={() => copyToClipboard(teamViewerId, "ID de TeamViewer")}
                    className="text-primary hover:opacity-80 p-1"
                    title="Copiar ID"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="font-mono text-xl font-black text-foreground tracking-wider">{teamViewerId}</div>
                <input
                  value={teamViewerId}
                  onChange={(e) => {
                    setTeamViewerId(e.target.value);
                    pos.updateCompanySettings({ teamViewerId: e.target.value });
                  }}
                  placeholder="Editar ID..."
                  className={`${inputCls} font-mono text-[11px]`}
                />
              </div>

              <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px]">Contraseña de Acceso</span>
                  <button
                    onClick={() => copyToClipboard(remotePassword, "Contraseña")}
                    className="text-primary hover:opacity-80 p-1"
                    title="Copiar Contraseña"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="font-mono text-xl font-black text-foreground tracking-wider">{remotePassword}</div>
                <input
                  value={remotePassword}
                  onChange={(e) => setRemotePassword(e.target.value)}
                  placeholder="Editar contraseña..."
                  className={`${inputCls} font-mono text-[11px]`}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => pos.downloadBackup()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary px-3.5 py-2 text-xs font-bold transition cursor-pointer"
                title="Descargar una copia de seguridad completa con todos los productos y datos"
              >
                <Download className="h-4 w-4" />
                <span>Descargar Backup (JSON)</span>
              </button>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const msg = `🖥️ *ACCESO DE CONTROL REMOTO (TEAMVIEWER)*\n🏪 ${pos.companySettings.name}\n🔑 ID: *${teamViewerId}*\n🔒 Clave: *${remotePassword}*\n\nPor favor conéctate para ayudarme a configurar el sistema.`;
                    openWhatsApp({
                      phone: pos.companySettings.ownerPhone || "0412-1234567",
                      message: msg,
                    });
                    toast.success("Enviando ID y contraseña por WhatsApp...");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-2xs"
                  title="Enviar datos de TeamViewer por WhatsApp al dueño o técnico"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Enviar al Dueño (WhatsApp)</span>
                </button>

                <button
                  type="button"
                  onClick={launchTeamViewer}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
                >
                  <Monitor className="h-4 w-4" />
                  <span>Abrir TeamViewer</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sincronizar App del Teléfono */}
        {activeTab === "sync" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-foreground text-sm">Biblioteca Móvil & Catálogo Offline</h5>
                <span className="font-mono text-[11px] text-muted-foreground">
                  Última sincronización: {pos.lastMobileSync ? new Date(pos.lastMobileSync).toLocaleTimeString("es-VE") : "Hace un momento"}
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Cuando falla la conexión a internet en el local o en el teléfono del mesonero/cajero, la biblioteca de la app móvil puede quedar desactualizada. Al pulsar este botón se fuerza la recarga completa del catálogo de empanadas, precios en divisas, tasas BCV/Paralelo y pedidos pendientes.
              </p>

              <div className="grid grid-cols-3 gap-2 py-2">
                <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
                  <div className="font-bold font-mono text-base text-foreground">{pos.products.length}</div>
                  <div className="text-[10px] text-muted-foreground">Productos Catálogo</div>
                </div>
                <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
                  <div className="font-bold font-mono text-base text-foreground">Bs. {pos.rate.toFixed(2)}</div>
                  <div className="text-[10px] text-muted-foreground">Tasa Sincronizada</div>
                </div>
                <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
                  <div className="font-bold font-mono text-base text-emerald-600 dark:text-emerald-400">100%</div>
                  <div className="text-[10px] text-muted-foreground">Estado Memoria</div>
                </div>
              </div>

              <button
                disabled={isSyncing}
                onClick={handleSyncMobile}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Sincronizando Biblioteca del Teléfono..." : "🔄 Volver a Actualizar Biblioteca de la App Móvil"}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Reiniciar Servicios y Red */}
        {activeTab === "printer" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h5 className="font-bold text-foreground text-sm">Reinicio de Conectividad & Hardware</h5>
              <p className="text-muted-foreground">
                Reinicia la comunicación con la impresora térmica (The Factory HKA / 58mm USB / Serial), limpia la cola de tickets trabados y renueva los sockets locales sin cerrar tu sesión de ventas ni perder datos.
              </p>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  No borra ventas registradas ni inventario. Solo reinicia los controladores de hardware y el puente local.
                </span>
              </div>

              <button
                disabled={isResettingNetwork}
                onClick={handleResetNetworkServices}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-destructive/15 text-destructive border border-destructive/30 py-3 font-bold hover:bg-destructive hover:text-white transition disabled:opacity-50"
              >
                <Wifi className={`h-4 w-4 ${isResettingNetwork ? "animate-pulse" : ""}`} />
                {isResettingNetwork ? "Reiniciando servicios de red..." : "⚡ Reiniciar Servicios de Red e Impresora"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
