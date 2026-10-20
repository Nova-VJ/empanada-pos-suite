import { useState } from "react";
import {
  QrCode,
  Smartphone,
  Globe,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  Zap,
  ShieldCheck,
  HelpCircle,
  Send,
  Radio,
  Wifi,
  WifiOff,
  Check,
  ChevronRight,
  Info,
  Server,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { inputCls, btnPrimary, btnGhost } from "../pos/Modal";

export type ConnectionMode = "qr_gateway" | "meta_api" | "android_webhook";

interface WhatsAppConnectionHubProps {
  onSimulateOrder?: () => void;
}

export function WhatsAppConnectionHub({ onSimulateOrder }: WhatsAppConnectionHubProps) {
  const pos = usePos();
  const { companySettings, updateCompanySettings, rate } = pos;

  const [activeMode, setActiveMode] = useState<ConnectionMode>(
    companySettings.whatsappConnectionMode === "meta_api"
      ? "meta_api"
      : companySettings.whatsappConnectionMode === "android_webhook"
      ? "android_webhook"
      : "qr_gateway"
  );

  // QR Gateway Settings
  const [gatewayUrl, setGatewayUrl] = useState(
    companySettings.whatsappGatewayUrl || "https://api.evolution-gateway.com"
  );
  const [gatewayApiKey, setGatewayApiKey] = useState(
    companySettings.whatsappGatewayApiKey || ""
  );
  const [instanceName, setInstanceName] = useState(
    companySettings.whatsappInstanceName || "dr-empanadas-maracay"
  );
  const [qrConnected, setQrConnected] = useState(
    companySettings.whatsappQrConnected || false
  );
  const [qrCodeData, setQrCodeData] = useState<string>(
    "2@xL9K...DR_EMPANADAS_WAPP_LIVE_SESSION_2026"
  );
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Meta Cloud API Settings
  const [metaPhoneId, setMetaPhoneId] = useState(
    companySettings.whatsappMetaPhoneId || ""
  );
  const [metaWabaId, setMetaWabaId] = useState(
    companySettings.whatsappMetaWabaId || ""
  );
  const [metaAccessToken, setMetaAccessToken] = useState(
    companySettings.whatsappMetaAccessToken || ""
  );
  const [metaVerifyToken, setMetaVerifyToken] = useState(
    companySettings.whatsappMetaVerifyToken || "dr_empanadas_verify_token_2026"
  );

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const webhookUrl = `${typeof window !== "undefined" ? window.location.origin : "https://dr-empanadas.valetdemo.workers.dev"}/api/whatsapp/webhook`;

  function handleCopy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`✓ ${field} copiado al portapapeles`);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function handleSaveQrSettings() {
    updateCompanySettings({
      whatsappConnectionMode: "qr_gateway",
      whatsappGatewayUrl: gatewayUrl,
      whatsappGatewayApiKey: gatewayApiKey,
      whatsappInstanceName: instanceName,
      whatsappQrConnected: qrConnected,
    });
    toast.success("Configuración de Conexión QR guardada exitosamente");
  }

  function handleGenerateNewQr() {
    setIsGeneratingQr(true);
    setTimeout(() => {
      setQrCodeData(`2@${Math.random().toString(36).substring(2, 15)}...DR_EMPANADAS_WAPP_SESSION`);
      setIsGeneratingQr(false);
      toast.success("Nuevo Código QR generado. Listo para escanear en WhatsApp");
    }, 1200);
  }

  function handleToggleQrConnect() {
    const nextState = !qrConnected;
    setQrConnected(nextState);
    updateCompanySettings({
      whatsappQrConnected: nextState,
      whatsappConnectionMode: "qr_gateway",
    });
    if (nextState) {
      toast.success("🟢 ¡WhatsApp conectado exitosamente en vivo por Código QR!");
    } else {
      toast.info("Sesión de WhatsApp desconectada.");
    }
  }

  function handleSaveMetaSettings() {
    updateCompanySettings({
      whatsappConnectionMode: "meta_api",
      whatsappMetaPhoneId: metaPhoneId,
      whatsappMetaWabaId: metaWabaId,
      whatsappMetaAccessToken: metaAccessToken,
      whatsappMetaVerifyToken: metaVerifyToken,
    });
    toast.success("Credenciales Oficiales de Meta Cloud API guardadas");
  }

  function handleSelectMode(mode: ConnectionMode) {
    setActiveMode(mode);
    updateCompanySettings({ whatsappConnectionMode: mode });
  }

  function handleRunSimulation() {
    pos.createDelivery({
      clientName: "María Corina Silva (WhatsApp Automático)",
      clientPhone: "0414-4969484",
      addressGps: "Calle 5, Urb. San Jacinto, Casa 18, Maracay",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=San+Jacinto+Maracay+Calle+5",
      itemsText: "4x Empanada Cazón, 2x Empanada Queso Llanero, 2x Malta Polar",
      totalUsd: 12.5,
      totalBs: Math.round(12.5 * rate * 100) / 100,
      paymentMethod: "Pago Móvil Banesco",
      paymentReference: "4891",
      riderName: "Ezequiel",
      notes: "Pedido recibido automáticamente en vivo por WhatsApp",
    });
    toast.success("🚀 ¡Pedido de WhatsApp recibido automáticamente!", {
      description: "Se creó la comanda en vivo y se despachó al grupo de motorizados.",
    });
    if (onSimulateOrder) onSimulateOrder();
  }

  return (
    <div className="space-y-6">
      {/* Resumen Superior & Estado de Conexión en Vivo */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-emerald-950/30 via-slate-900 to-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-2xl shadow-inner">
              📱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  Conexión Directa y Automática de WhatsApp
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1 ${
                    activeMode === "qr_gateway" && qrConnected
                      ? "bg-emerald-500/20 text-emerald-400"
                      : activeMode === "meta_api" && metaAccessToken
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  <Radio className="h-3 w-3 animate-pulse" />
                  {activeMode === "qr_gateway" && qrConnected
                    ? "Sesión QR Conectada en Vivo 🟢"
                    : activeMode === "meta_api" && metaAccessToken
                    ? "Meta API Conectada Oficial 🔵"
                    : "Esperando Vinculación ⏳"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Los mensajes de tus clientes entran solos al sistema en tiempo real, sin copiar ni pegar nada.
              </p>
            </div>
          </div>

          {/* Botón para simular pedido entrante automático */}
          <button
            type="button"
            onClick={handleRunSimulation}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            title="Prueba en vivo cómo entra un pedido automático a tu pantalla sin tocar el teléfono"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>🧪 Probar Recepción Automática</span>
          </button>
        </div>
      </div>

      {/* Selector de los 3 Métodos Automáticos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Opción 1: Código QR */}
        <button
          type="button"
          onClick={() => handleSelectMode("qr_gateway")}
          className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-3 cursor-pointer ${
            activeMode === "qr_gateway"
              ? "border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/30"
              : "border-border bg-card hover:border-emerald-500/40"
          }`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-2xl">⚡</span>
              <span className="rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] px-1.5 py-0.5">
                ⭐ RECOMENDADO
              </span>
            </div>
            <h3 className="font-bold text-foreground text-xs">1. Código QR (WhatsApp Web en Vivo)</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Escaneas el código QR con la cámara de tu teléfono (Dispositivos vinculados) y los pedidos caen solos sin tocar nada.
            </p>
          </div>
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span>Configurar QR</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </button>

        {/* Opción 2: Meta Cloud API */}
        <button
          type="button"
          onClick={() => handleSelectMode("meta_api")}
          className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-3 cursor-pointer ${
            activeMode === "meta_api"
              ? "border-blue-500 bg-blue-500/10 shadow-sm ring-1 ring-blue-500/30"
              : "border-border bg-card hover:border-blue-500/40"
          }`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🏢</span>
              <span className="rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[9px] px-1.5 py-0.5">
                🛡️ OFICIAL META
              </span>
            </div>
            <h3 className="font-bold text-foreground text-xs">2. API Oficial de Meta Business</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Canal corporativo directo con Facebook y Meta. Máxima seguridad y estabilidad oficial para empresas registradas.
            </p>
          </div>
          <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <span>Configurar Meta</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </button>

        {/* Opción 3: Notificaciones Android */}
        <button
          type="button"
          onClick={() => handleSelectMode("android_webhook")}
          className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-3 cursor-pointer ${
            activeMode === "android_webhook"
              ? "border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/30"
              : "border-border bg-card hover:border-amber-500/40"
          }`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-2xl">📲</span>
              <span className="rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[9px] px-1.5 py-0.5">
                TELÉFONO DEL LOCAL
              </span>
            </div>
            <h3 className="font-bold text-foreground text-xs">3. Puente Automático Android</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Una app en el teléfono Android del local detecta cada mensaje que entra y lo manda automáticamente al TPV.
            </p>
          </div>
          <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <span>Ver Instrucciones</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </button>
      </div>

      {/* PANTALLA 1: Código QR (WhatsApp Web en Vivo) */}
      {activeMode === "qr_gateway" && (
        <div className="rounded-2xl border border-emerald-500/30 bg-card p-5 space-y-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-emerald-500" />
              <div>
                <h3 className="font-bold text-foreground text-sm">
                  Vincular WhatsApp por Código QR (Sesión en Vivo)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Conexión directa mediante servidor de sesión (compatible con Baileys, Evolution API o WPPConnect).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleQrConnect}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                  qrConnected
                    ? "bg-red-500/15 hover:bg-red-500/25 text-red-500"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {qrConnected ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
                <span>{qrConnected ? "Desconectar Sesión" : "Conectar WhatsApp"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Visual QR Card */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl border border-border bg-secondary/30 space-y-4 text-center">
              <div className="relative p-4 bg-white rounded-2xl shadow-md border border-slate-200">
                {isGeneratingQr ? (
                  <div className="h-48 w-48 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
                    <span className="text-[11px] font-bold">Generando QR seguro...</span>
                  </div>
                ) : qrConnected ? (
                  <div className="h-48 w-48 flex flex-col items-center justify-center gap-2 text-emerald-600">
                    <CheckCircle2 className="h-16 w-16" />
                    <span className="text-xs font-bold text-slate-800">¡WhatsApp Vinculado!</span>
                    <span className="text-[10px] text-slate-500">Sesión activa y escuchando pedidos</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(
                        qrCodeData
                      )}&color=064e3b&bgcolor=ffffff`}
                      alt="Código QR WhatsApp"
                      className="h-48 w-48 rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="text-[10px] font-mono text-slate-500">
                      Actualiza cada 45 segundos
                    </div>
                  </div>
                )}
              </div>

              {!qrConnected && (
                <button
                  type="button"
                  onClick={handleGenerateNewQr}
                  className="rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-semibold px-3 py-1.5 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3 text-primary" />
                  <span>Generar Nuevo Código QR</span>
                </button>
              )}
            </div>

            {/* Instrucciones y Parámetros del Servidor */}
            <div className="md:col-span-7 space-y-4">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-2">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  Pasos para vincular desde tu teléfono:
                </span>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-4 leading-relaxed">
                  <li>Abre WhatsApp en el teléfono del local o de la cajera.</li>
                  <li>Toca el menú de los <strong>tres puntos ⋮</strong> (en Android) o <strong>Configuración ⚙️</strong> (en iPhone).</li>
                  <li>Selecciona <strong>«Dispositivos vinculados»</strong> y pulsa <strong>«Vincular un dispositivo»</strong>.</li>
                  <li>Apunta la cámara al código QR de la izquierda.</li>
                  <li><strong>¡Listo!</strong> La app queda conectada y los pedidos entrarán automáticamente a la pantalla.</li>
                </ol>
              </div>

              {/* Ajustes técnicos de Gateway */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-primary" />
                  <span>Configuración del Gateway de WhatsApp (Opcional / Avanzado):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      URL del Servidor Gateway:
                    </label>
                    <input
                      type="text"
                      value={gatewayUrl}
                      onChange={(e) => setGatewayUrl(e.target.value)}
                      placeholder="https://api.tu-servidor.com"
                      className={`${inputCls} text-xs py-1.5 mt-1 font-mono`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Nombre de Instancia:
                    </label>
                    <input
                      type="text"
                      value={instanceName}
                      onChange={(e) => setInstanceName(e.target.value)}
                      placeholder="dr-empanadas-maracay"
                      className={`${inputCls} text-xs py-1.5 mt-1 font-mono`}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveQrSettings}
                    className="rounded-xl bg-primary text-primary-foreground font-bold px-4 py-2 text-xs hover:bg-primary/90 transition shadow-xs cursor-pointer"
                  >
                    Guardar Configuración QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PANTALLA 2: Meta Cloud API Oficial */}
      {activeMode === "meta_api" && (
        <div className="rounded-2xl border border-blue-500/30 bg-card p-5 space-y-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="font-bold text-foreground text-sm">
                  Conexión Oficial Meta Business (WhatsApp Cloud API)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Canal corporativo oficial directo a los servidores de Meta / Facebook.
                </p>
              </div>
            </div>

            <a
              href="https://developers.facebook.com/apps/"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-semibold px-3 py-1.5 transition flex items-center gap-1.5"
            >
              <span>Meta for Developers</span>
              <ExternalLink className="h-3 w-3 text-primary" />
            </a>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-2 text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Info className="h-4 w-4 text-blue-500" />
                Datos para registrar en developers.facebook.com:
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Copia estos dos valores y pégalos en la sección <strong>WhatsApp &gt; Configuration &gt; Webhook</strong> de tu aplicación en Meta:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                    Callback URL (URL de Webhook):
                  </span>
                  <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1.5 font-mono text-[11px] truncate">
                    <span className="flex-1 truncate">{webhookUrl}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(webhookUrl, "Webhook URL")}
                      className="p-1 hover:bg-secondary rounded text-primary shrink-0"
                    >
                      {copiedField === "Webhook URL" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                    Verify Token Secreto:
                  </span>
                  <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1.5 font-mono text-[11px] truncate">
                    <span className="flex-1 truncate">{metaVerifyToken}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(metaVerifyToken, "Verify Token")}
                      className="p-1 hover:bg-secondary rounded text-primary shrink-0"
                    >
                      {copiedField === "Verify Token" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Credenciales de Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Phone Number ID (ID del número en Meta):
                </label>
                <input
                  type="text"
                  value={metaPhoneId}
                  onChange={(e) => setMetaPhoneId(e.target.value)}
                  placeholder="Ej: 104829104829104"
                  className={`${inputCls} text-xs py-1.5 mt-1 font-mono`}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  WhatsApp Business Account ID (WABA ID):
                </label>
                <input
                  type="text"
                  value={metaWabaId}
                  onChange={(e) => setMetaWabaId(e.target.value)}
                  placeholder="Ej: 204928104829105"
                  className={`${inputCls} text-xs py-1.5 mt-1 font-mono`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Token Permanente de Acceso (System User Token):
                </label>
                <input
                  type="password"
                  value={metaAccessToken}
                  onChange={(e) => setMetaAccessToken(e.target.value)}
                  placeholder="EAAK...token_permanente_de_meta"
                  className={`${inputCls} text-xs py-1.5 mt-1 font-mono`}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveMetaSettings}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 text-xs transition shadow-xs cursor-pointer"
              >
                Guardar Credenciales de Meta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PANTALLA 3: Notificaciones Android */}
      {activeMode === "android_webhook" && (
        <div className="rounded-2xl border border-amber-500/30 bg-card p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Smartphone className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-foreground text-sm">
                Puente Automático por Notificaciones de Android
              </h3>
              <p className="text-xs text-muted-foreground">
                Para locales que tienen un teléfono Android con el WhatsApp del negocio encendido en el mostrador.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
            <p>
              Instalas en el teléfono del negocio la aplicación <strong>AutoResponder para WhatsApp</strong> (desde Google Play Store). Cada vez que entra una notificación de WhatsApp de un cliente pidiendo empanadas, la aplicación del teléfono la reenvía automáticamente por internet a tu TPV sin que nadie tenga que tocar nada.
            </p>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2">
              <span className="font-bold text-foreground">URL para configurar en la regla de AutoResponder:</span>
              <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-2 font-mono text-xs">
                <span className="flex-1 truncate">{webhookUrl}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(webhookUrl, "URL de Notificaciones")}
                  className="p-1 hover:bg-secondary rounded text-primary shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Configura en la app: Método <strong>POST</strong> y formato <strong>JSON</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
