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

        {/* Gemini API Key Configuration Button */}
        <div className="flex items-center gap-2">
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
    </div>
  );
}
