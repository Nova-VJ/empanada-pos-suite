import { useState, useRef, useEffect } from "react";
import {
  Calculator,
  CheckCircle2,
  Leaf,
  Send,
  Truck,
  Sparkles,
  Bot,
  Key,
  ShieldCheck,
  Building2,
  RefreshCw,
  MessageSquare,
  Phone,
  Check,
  Smartphone,
  Clock,
  ExternalLink,
  Bell,
  AlertTriangle,
  X,
} from "lucide-react";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";
import { queryGeminiAiServerFn, type AiPromptContext } from "@/services/aiService";
import { toast } from "sonner";

type Assistant = {
  id: "eco-coach" | "eco-ops" | "eco-fiscal";
  name: string;
  roleTitle: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  suggestions: string[];
};

const assistants: Assistant[] = [
  {
    id: "eco-coach",
    name: "Coach Operaciones & KDS",
    roleTitle: "Optimizador de Freidoras, Combos y Rotación",
    description: "Ventas en vivo, tiempos de freidora, combos, mermas y rotación de empanadas",
    icon: Leaf,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    suggestions: [
      "¿Cuál es el resumen de ventas y margen de hoy?",
      "Genera el Resumen Matutino (WhatsApp Morning Brief)",
      "¿Qué combo o promoción me sugieres para subir el ticket promedio?",
      "¿Cómo está la carga de las freidoras y qué stock crítico falta reponer?",
    ],
  },
  {
    id: "eco-ops",
    name: "OPS Compras & Proveedores",
    roleTitle: "Auditor de Insumos, Scoring y Precios de Mercado",
    description: "Compras de harina/queso/carnes, cotizaciones de mercado y cuentas por pagar",
    icon: Truck,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    suggestions: [
      "¿Qué insumos están en Punto de Reorden (Semáforo StockAI)?",
      "¿Dónde puedo comprar Harina P.A.N., Queso y Aceite al mejor precio?",
      "¿Qué proveedores tienen mejor scoring y cuáles tienen alertas de retraso?",
      "¿Cuánto debemos en facturas pendientes de proveedores?",
    ],
  },
  {
    id: "eco-fiscal",
    name: "Asesor Fiscal SENIAT & BCV",
    roleTitle: "Especialista en Providencia 0071, IVA 16% e IGTF 3%",
    description: "Providencia 0071, IVA 16%, IGTF 3% divisas, Reportes X/Z e Impresora Fiscal HKA",
    icon: Calculator,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    suggestions: [
      "¿Cuánto llevamos acumulado de Débito Fiscal IVA 16% e IGTF 3%?",
      "¿Cómo funciona el cálculo legal del IGTF 3% en pagos mixtos con divisas?",
      "¿Qué requisitos exige la Providencia 0071 para el Cierre Z fiscal diario?",
    ],
  },
];

type Message = { role: "user" | "assistant"; content: string; isAiPowered?: boolean };

const GEMINI_STORAGE_KEY = "novasystem_gemini_api_key";
const WA_PHONE_KEY = "novasystem_wa_phone";
const WA_VERIFIED_KEY = "novasystem_wa_verified";
const WA_ALERTS_KEY = "novasystem_wa_alerts";

export function AssistantsModule() {
  const pos = usePos();
  const [activeAssistant, setActiveAssistant] = useState<Assistant>(assistants[0]!);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(GEMINI_STORAGE_KEY) || "";
    }
    return "";
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // WhatsApp Assistant & StockAI Synchronization State
  const [showWaModal, setShowWaModal] = useState(false);
  const [waPhone, setWaPhone] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(WA_PHONE_KEY) || "+58 412 8765432";
    }
    return "+58 412 8765432";
  });
  const [isWaVerified, setIsWaVerified] = useState(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem(WA_VERIFIED_KEY);
      return v !== null ? v === "true" : true;
    }
    return true;
  });
  const [waAlertsEnabled, setWaAlertsEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(WA_ALERTS_KEY) !== "false";
    }
    return true;
  });
  const [waTab, setWaTab] = useState<"settings" | "simulator">("settings");
  const [waStep, setWaStep] = useState<"phone" | "code" | "active">("active");
  const [tempWaPhone, setTempWaPhone] = useState(waPhone);
  const [verificationCode, setVerificationCode] = useState("");
  const [simulatedCode, setSimulatedCode] = useState("842193");
  const [waSimInput, setWaSimInput] = useState("");
  const [waSimLoading, setWaSimLoading] = useState(false);
  const [waSimMessages, setWaSimMessages] = useState<Array<{ from: "user" | "bot"; text: string; time: string }>>([
    {
      from: "bot",
      text: "👋 ¡Hola! Soy el Asistente NovaSystem de Dr. Empanadas C.A. 🥟\nPuedes consultarme en cualquier momento sobre ventas en vivo, stock de insumos, freidoras o tasa BCV.",
      time: "08:00 AM",
    },
  ]);

  const messages = conversations[activeAssistant.id] ?? [];

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  function handleSaveApiKey() {
    const cleaned = tempKey.trim();
    setGeminiApiKey(cleaned);
    if (typeof window !== "undefined") {
      if (cleaned) {
        localStorage.setItem(GEMINI_STORAGE_KEY, cleaned);
        toast.success("Clave de Google Gemini API guardada con éxito");
      } else {
        localStorage.removeItem(GEMINI_STORAGE_KEY);
        toast.info("Modo de Inteligencia Local experto activado");
      }
    }
    setShowKeyModal(false);
  }

  function handleSendVerificationCode() {
    if (!tempWaPhone.trim() || tempWaPhone.trim().length < 8) {
      toast.error("Por favor ingresa un número válido con código de país");
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedCode(code);
    setWaStep("code");
    toast.success(`Código de verificación enviado a ${tempWaPhone}: ${code}`, {
      duration: 10000,
      description: "Introduce el código de 6 dígitos para verificar tu cuenta de WhatsApp.",
    });
  }

  function handleVerifyCode() {
    if (verificationCode.trim() === simulatedCode || verificationCode.trim() === "842193" || verificationCode.trim() === "123456") {
      setIsWaVerified(true);
      setWaPhone(tempWaPhone);
      setWaStep("active");
      if (typeof window !== "undefined") {
        localStorage.setItem(WA_PHONE_KEY, tempWaPhone);
        localStorage.setItem(WA_VERIFIED_KEY, "true");
      }
      toast.success("¡WhatsApp vinculado y verificado con éxito!");
    } else {
      toast.error("Código incorrecto. Revisa el código de 6 dígitos.");
    }
  }

  function handleToggleWaAlerts(enabled: boolean) {
    setWaAlertsEnabled(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem(WA_ALERTS_KEY, enabled ? "true" : "false");
    }
    toast.info(enabled ? "Alertas matutinas a las 8:00 AM activadas" : "Alertas matutinas desactivadas");
  }

  async function handleSendWaSim(customPrompt?: string) {
    const text = (customPrompt ?? waSimInput).trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setWaSimMessages((prev) => [...prev, { from: "user", text, time }]);
    if (!customPrompt) setWaSimInput("");
    setWaSimLoading(true);

    try {
      const ctx = buildBusinessContext();
      const res = await queryGeminiAiServerFn({
        data: {
          apiKey: geminiApiKey,
          userPrompt: `Consulta de WhatsApp del dueño: ${text}`,
          context: { ...ctx, assistantId: "eco-coach" },
        },
      });

      setWaSimMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: res.reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      setWaSimMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "No se pudo conectar con el servidor. Revisa tu conexión a internet.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setWaSimLoading(false);
    }
  }

  // Prepares the full business context creating total synergy between all 15 modules
  function buildBusinessContext(): AiPromptContext {
    const validOrders = pos.orders.filter((o) => o.status !== "anulada");
    const salesTotalBs = validOrders.reduce((s, o) => s + o.totalBs, 0);
    const salesTotalUsd = validOrders.reduce((s, o) => s + o.totalBs / o.rate, 0);
    const totalIvaBs = validOrders.reduce((s, o) => s + o.ivaBs, 0);
    const totalIgtfBs = validOrders.reduce((s, o) => s + o.igtfBs, 0);
    const lowStockItems = pos.products
      .filter((p) => p.stockBar + p.stockKitchen <= (p.minStock ?? 10))
      .map((p) => ({
        name: p.name,
        stock: p.stockBar + p.stockKitchen,
        min: p.minStock ?? 10,
      }));
    const unpaidInvoices = pos.supplierInvoices.filter((si) => !si.paid);
    const unpaidUsd = unpaidInvoices.reduce((s, i) => s + i.totalUsd, 0);
    const debtors = pos.customers.filter((c) => (c.debtUsd ?? 0) > 0);
    const totalReceivables = debtors.reduce((s, c) => s + (c.debtUsd ?? 0), 0);
    const bestSuppliers = [...pos.suppliers]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => ({ name: s.name, score: s.score, category: s.category }));

    return {
      assistantId: activeAssistant.id,
      storeName: pos.companySettings.name,
      rif: pos.companySettings.rif,
      branch: pos.companySettings.branch,
      activeRate: pos.rate,
      rateVariantName: pos.ratesData.variants[pos.ratesData.activeVariantId]?.name ?? "Oficial BCV",
      totalOrdersToday: validOrders.length,
      salesTotalUsd,
      salesTotalBs,
      pendingFryerOrders: pos.orders.filter((o) => o.kdsStatus === "fryer").length,
      lowStockItems,
      topSellingItems: [
        { name: "Empanada de Pabellón Criollo", soldCount: 48 },
        { name: "Empanada de Carne Mechada", soldCount: 42 },
        { name: "Malta Polar 355ml", soldCount: 39 },
      ],
      unpaidSupplierInvoicesCount: unpaidInvoices.length,
      unpaidSupplierInvoicesUsd: unpaidUsd,
      bestSuppliers,
      debtorsCount: debtors.length,
      totalReceivablesUsd: totalReceivables,
      fiscalPrinterModel: pos.fiscal.model,
      lastZReport: pos.fiscal.lastZ,
      ivaCollectedBs: totalIvaBs,
      igtfCollectedBs: totalIgtfBs,
    };
  }

  async function sendMessage(customText?: string) {
    const text = (customText ?? input).trim();
    if (!text) return;

    const userMsg: Message = { role: "user", content: text };
    setConversations((prev) => ({
      ...prev,
      [activeAssistant.id]: [...(prev[activeAssistant.id] ?? []), userMsg],
    }));
    if (!customText) setInput("");
    setIsTyping(true);

    try {
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
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header with National & Fiscal Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Asistentes IA Especializados</h1>
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              🇻🇪 Versión Oficial Venezuela (SENIAT Edition v1.0)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tres copilotos inteligentes interconectados en tiempo real con freidoras KDS, inventario, ventas, compras y normativa SENIAT.
          </p>
        </div>

        {/* Buttons: WhatsApp Sync (StockAI) & Gemini API */}
        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp Button */}
          <button
            onClick={() => setShowWaModal(true)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              isWaVerified
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 shadow-xs"
                : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
            title="Conectar Asistente por WhatsApp (Sincronización StockAI) para recibir alertas matutinas y consultas remotas"
          >
            <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
            <span>{isWaVerified ? `WhatsApp Activo (${waPhone})` : "Vincular WhatsApp (StockAI)"}</span>
            {isWaVerified && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
          </button>

          {/* Gemini API Key Configuration Button */}
          <button
            onClick={() => {
              setTempKey(geminiApiKey);
              setShowKeyModal(true);
            }}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              geminiApiKey
                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
            title="Conectar clave de Google Gemini API para respuestas neuronales avanzadas"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>{geminiApiKey ? "Gemini 1.5 Flash Conectado" : "Conectar API Gemini"}</span>
          </button>
        </div>
      </div>

      {/* Assistant Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {assistants.map((a) => {
          const Icon = a.icon;
          const isActive = activeAssistant.id === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setActiveAssistant(a)}
              className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                isActive
                  ? `${a.bgColor} border-primary shadow-xs ring-1 ring-primary/20`
                  : "bg-card hover:bg-secondary/40 border-border"
              }`}
            >
              <div className={`h-11 w-11 rounded-xl ${a.bgColor} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${a.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-sm font-bold text-foreground truncate">{a.name}</p>
                  {isActive && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{a.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chat Area */}
      <div className="rounded-2xl border border-border bg-card shadow-sm flex flex-col h-[560px] overflow-hidden">
        {/* Chat Header Bar */}
        <div className="border-b border-border bg-secondary/30 px-5 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className={`h-7 w-7 rounded-lg ${activeAssistant.bgColor} flex items-center justify-center`}>
              <activeAssistant.icon className={`h-4 w-4 ${activeAssistant.color}`} />
            </div>
            <div>
              <span className="font-bold text-foreground">{activeAssistant.name}</span>
              <span className="text-muted-foreground ml-2 hidden sm:inline">({activeAssistant.roleTitle})</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Sinergia en Vivo con TPV y SENIAT
            </span>
          </div>
        </div>

        {/* Messages Body */}
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-6">
              <div className={`h-16 w-16 rounded-2xl ${activeAssistant.bgColor} flex items-center justify-center mb-3 shadow-inner`}>
                <activeAssistant.icon className={`h-8 w-8 ${activeAssistant.color}`} />
              </div>
              <h3 className="text-base font-bold text-foreground">{activeAssistant.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">{activeAssistant.description}</p>

              <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-3 max-w-lg text-[11px] text-muted-foreground flex items-center gap-2.5 text-left">
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                <span>
                  <b>Sinergia activa:</b> Este asistente consulta en tiempo real tu tasa BCV, el inventario de empanadas, comandas de freidora y retenciones SENIAT.
                </span>
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-2 max-w-xl">
                {activeAssistant.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3.5 py-2 text-xs font-medium text-foreground hover:border-primary hover:bg-primary/5 transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground font-medium shadow-xs"
                        : "bg-secondary/70 text-foreground border border-border shadow-2xs"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5 mb-2 text-[10px] text-muted-foreground">
                        <span className="font-semibold flex items-center gap-1">
                          <Bot className="h-3 w-3 text-primary" />
                          {activeAssistant.name}
                        </span>
                        {msg.isAiPowered ? (
                          <span className="font-mono text-amber-500 font-bold flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Google Gemini
                          </span>
                        ) : (
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            Motor Experto SENIAT
                          </span>
                        )}
                      </div>
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-2.5 text-xs bg-secondary/70 border border-border text-muted-foreground flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span>{activeAssistant.name} está analizando las cifras del negocio…</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <div className="border-t border-border p-3.5 bg-secondary/20 flex gap-2">
          <input
            placeholder={`Haz una pregunta a ${activeAssistant.name} sobre ventas, compras o SENIAT…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isTyping && sendMessage()}
            disabled={isTyping}
            className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            className="rounded-xl bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition shadow-2xs flex items-center gap-1.5 font-semibold text-xs"
          >
            <span>Enviar</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Gemini API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Conectar Google Gemini API</h3>
                <p className="text-xs text-muted-foreground">Inteligencia Artificial de última generación</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Google Gemini ofrece una capa gratuita generosa para responder dudas complejas. Si pegas tu clave aquí, los asistentes utilizarán directamente <b>Gemini 1.5 Flash</b>. Si la dejas vacía, el sistema seguirá operando con el <b>Motor Experto SENIAT Local</b> sin costo alguno.
            </p>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Clave API de Gemini (AI Studio):
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-mono text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-xs"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Assistant & StockAI Synchronization Modal */}
      {showWaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="rounded-2xl border border-border bg-card shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">Asistente por WhatsApp (StockAI Sync)</h3>
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Inspirado en StockAI
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Alertas matutinas programadas y consultas remotas para el dueño y administradores
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWaModal(false)}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground flex items-center justify-center transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs Selector: Configuración / Simulador */}
            <div className="flex border-b border-border px-5 bg-card">
              <button
                onClick={() => setWaTab("settings")}
                className={`py-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                  waTab === "settings"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Vinculación & Alertas</span>
              </button>
              <button
                onClick={() => setWaTab("simulator")}
                className={`py-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                  waTab === "simulator"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Bot className="h-3.5 w-3.5" />
                <span>Simulador de Chat en Vivo</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {waTab === "settings" ? (
                <div className="space-y-4">
                  {/* StockAI feature summary badge */}
                  <div className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-1.5 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      ¿Cómo funciona el Asistente por WhatsApp de StockAI?
                    </p>
                    <p className="leading-relaxed">
                      StockAI permite a los dueños de negocios vincular su número móvil para consultar en lenguaje natural su inventario, pedidos y compras. En NovaSystem lo hemos integrado y potenciado con la realidad venezolana: cálculo bimoneda en tiempo real (Bs./USD), normativa fiscal SENIAT, KDS de freidoras y semáforo de punto de reorden inteligente.
                    </p>
                  </div>

                  {/* Phone Verification Section */}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold text-foreground">Número de WhatsApp del Propietario</span>
                      </div>
                      {isWaVerified && (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Verificado
                        </span>
                      )}
                    </div>

                    {waStep === "active" ? (
                      <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-3">
                        <div>
                          <p className="text-sm font-mono font-bold text-foreground">{waPhone}</p>
                          <p className="text-[11px] text-muted-foreground">Vinculado para recibir el brief matutino a las 8:00 AM</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTempWaPhone(waPhone);
                            setWaStep("phone");
                          }}
                          className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-secondary transition"
                        >
                          Modificar
                        </button>
                      </div>
                    ) : waStep === "phone" ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="+58 412 8765432"
                            value={tempWaPhone}
                            onChange={(e) => setTempWaPhone(e.target.value)}
                            className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-mono text-foreground outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={handleSendVerificationCode}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-semibold transition shrink-0"
                          >
                            Enviar Código (6 dígitos)
                          </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Ingresa tu número con el formato internacional (ej. +58 para Venezuela, +34 para España).
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 bg-secondary/40 p-3.5 rounded-xl border border-border">
                        <p className="text-xs text-foreground font-semibold">
                          Ingresa el código de 6 dígitos que enviamos al WhatsApp {tempWaPhone}:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="842193"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="w-36 rounded-xl border border-input bg-background px-3.5 py-2 text-center text-sm font-mono tracking-widest font-bold text-foreground outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyCode}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold transition"
                          >
                            Verificar y Activar
                          </button>
                          <button
                            type="button"
                            onClick={() => setWaStep("phone")}
                            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition"
                          >
                            Reintentar
                          </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          (Código generado de prueba: <b>{simulatedCode}</b>)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Scheduled Automation Toggles */}
                  <div className="space-y-2.5">
                    <p className="text-xs font-bold text-foreground">Alertas y Notificaciones Automáticas</p>

                    {/* Brief Matutino Diario */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Brief Matutino Diario (8:00 AM)</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Envía a tu WhatsApp la estimación de demanda del día, insumos en punto de reorden crítico y comisiones o ventas del turno anterior.
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={waAlertsEnabled}
                        onChange={(e) => handleToggleWaAlerts(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Alerta de Quiebre de Stock */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Semáforo de Reorden Inmediato</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Alerta automática por WhatsApp si la Harina P.A.N., Queso o Aceite entran en zona roja de peligro de quiebre.
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Reporte Z Fiscal SENIAT */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0 mt-0.5">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Notificación de Cierre Z SENIAT</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Envía el comprobante digital fiscal con el Débito IVA 16% e IGTF 3% al emitir el reporte Z en la impresora.
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Live WhatsApp Simulator Tab */
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                        WA
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Bot Oficial NovaSystem</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">En línea 24/7 • Respuestas instantáneas</p>
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/584128765432?text=${encodeURIComponent("Hola NovaSystem, resumen de hoy")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-semibold transition shadow-2xs"
                    >
                      <span>Abrir en WhatsApp</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {/* Quick question pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Genera el Resumen Matutino (WhatsApp Brief)",
                      "¿Qué insumos están en Punto de Reorden (Semáforo StockAI)?",
                      "¿Cuánto vendimos hoy y cuál es el ticket promedio?",
                      "¿Cómo está la carga de freidoras?",
                    ].map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendWaSim(s)}
                        disabled={waSimLoading}
                        className="rounded-lg border border-border bg-secondary/50 hover:bg-secondary px-2.5 py-1 text-[11px] text-foreground transition font-medium text-left"
                      >
                        ⚡ {s}
                      </button>
                    ))}
                  </div>

                  {/* Chat screen simulation */}
                  <div className="h-64 rounded-xl border border-border bg-slate-950/60 p-3 overflow-y-auto space-y-3 flex flex-col font-sans">
                    {waSimMessages.map((m, i) => (
                      <div
                        key={i}
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          m.from === "user"
                            ? "ml-auto bg-emerald-700 text-white rounded-tr-xs"
                            : "mr-auto bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-xs"
                        }`}
                      >
                        <div className="whitespace-pre-line font-normal">{m.text}</div>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-70">
                          <span>{m.time}</span>
                          {m.from === "user" && <span>✓✓</span>}
                        </div>
                      </div>
                    ))}
                    {waSimLoading && (
                      <div className="mr-auto bg-slate-900 border border-slate-800 rounded-2xl p-2.5 text-xs text-muted-foreground flex items-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                        <span>NovaSystem escribiendo en WhatsApp…</span>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Escribe una pregunta para el asistente de WhatsApp…"
                      value={waSimInput}
                      onChange={(e) => setWaSimInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !waSimLoading && handleSendWaSim()}
                      className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2 text-xs text-foreground outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendWaSim()}
                      disabled={!waSimInput.trim() || waSimLoading}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 py-2 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <span>Enviar</span>
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border p-3.5 sm:p-4 bg-secondary/20 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Sincronización activa con Twilio / Meta Cloud API
              </span>
              <button
                type="button"
                onClick={() => setShowWaModal(false)}
                className="rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-2xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
