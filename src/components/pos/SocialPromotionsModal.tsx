import { useState, useRef } from "react";
import {
  Share2,
  Sparkles,
  Copy,
  Download,
  Smartphone,
  Check,
  Flame,
  MessageCircle,
  Tag,
  ArrowRight,
  Send,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";
import { Modal, btnPrimary, btnGhost, inputCls } from "./Modal";

export interface PromoPack {
  id: string;
  name: string;
  tagline: string;
  items: string[];
  regularPriceUsd: number;
  promoPriceUsd: number;
  discountPct: number;
  badge: string;
  icon: string;
}

const DEFAULT_PACKS: PromoPack[] = [
  {
    id: "pack-desayuno",
    name: "Pack Desayuno Criollo",
    tagline: "¡La energía venezolana para empezar tu día!",
    items: ["3 Empanadas a elección (Pabellón, Queso o Pollo)", "1 Malta Polar bien fría (355ml)"],
    regularPriceUsd: 6.5,
    promoPriceUsd: 5.5,
    discountPct: 15,
    badge: "MÁS VENDIDO 🔥",
    icon: "🥟",
  },
  {
    id: "pack-familiar",
    name: "Combo Familiar Parrandero",
    tagline: "Para compartir con la familia o los panas en la oficina.",
    items: [
      "10 Empanadas crujientes surtidas",
      "1 Pote de Salsa Tártara casera de cortesía",
      "1 Pote de Guasacaca cremosa de cortesía",
    ],
    regularPriceUsd: 22.5,
    promoPriceUsd: 18.0,
    discountPct: 20,
    badge: "AHORRO 20% 👨‍👩‍👧‍👦",
    icon: "🎉",
  },
  {
    id: "pack-duo-pastelitos",
    name: "Combo Dúo Pastelitos & Café",
    tagline: "Masa hojaldrada dorada con café con leche espumoso.",
    items: ["4 Pastelitos (Carne molida o Queso llanero)", "2 Cafés con Leche grandes"],
    regularPriceUsd: 7.2,
    promoPriceUsd: 6.0,
    discountPct: 17,
    badge: "TARDE DULCE ☕",
    icon: "🥪",
  },
  {
    id: "promo-flash-4x3",
    name: "Promo Flash 4x3 Pabellón Criollo",
    tagline: "¡Carne mechada, caraotas negras, queso y tajadas!",
    items: ["Compra 3 Empanadas Pabellón Criollo y llévate la 4ta GRATIS"],
    regularPriceUsd: 8.8,
    promoPriceUsd: 6.6,
    discountPct: 25,
    badge: "PROMO FLASH ⚡",
    icon: "⭐",
  },
];

interface SocialPromotionsModalProps {
  onClose: () => void;
}

export function SocialPromotionsModal({ onClose }: SocialPromotionsModalProps) {
  const pos = usePos();
  const rate = pos.rate;

  const [selectedPack, setSelectedPack] = useState<PromoPack>(DEFAULT_PACKS[0]);
  const [activeTab, setActiveTab] = useState<"whatsapp" | "story">("whatsapp");
  const [copied, setCopied] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [customDiscount, setCustomDiscount] = useState<number>(15);
  const [phoneForDelivery, setPhoneForDelivery] = useState<string>("0412-1234567");

  const storyCardRef = useRef<HTMLDivElement>(null);

  // If a single product is selected from dropdown
  const activeProduct = pos.products.find((p) => p.id === selectedProductId);

  const displayPromo = activeProduct
    ? {
        name: `Especial: ${activeProduct.name}`,
        tagline: "¡Recién hechas, crujientes y con el mejor relleno!",
        items: [
          `1 ${activeProduct.name}`,
          "Salsa tártara y guasacaca incluidas",
          "Preparadas al momento",
        ],
        regularPriceUsd: activeProduct.priceUsd,
        promoPriceUsd: Number((activeProduct.priceUsd * (1 - customDiscount / 100)).toFixed(2)),
        discountPct: customDiscount,
        badge: `OFERTA -${customDiscount}% 🏷️`,
        icon: "🥟",
      }
    : selectedPack;

  const priceBs = displayPromo.promoPriceUsd * rate;
  const regularPriceBs = displayPromo.regularPriceUsd * rate;

  // Formatted WhatsApp Text
  const whatsappMessage = `🥟 *¡${pos.companySettings.name.toUpperCase()} · PROMO EXCLUSIVA!* 🇻🇪
✨ *${displayPromo.name}*
_${displayPromo.tagline}_

📋 *¿Qué incluye?*
${displayPromo.items.map((i) => `• ${i}`).join("\n")}

🔥 *PRECIO ESPECIAL:*
💵 *USD $${displayPromo.promoPriceUsd.toFixed(2)}* (Antes ~~$${displayPromo.regularPriceUsd.toFixed(2)}~~)
🇻🇪 *Bs. ${fmtBs(priceBs)}* (Tasa Oficial BCV: Bs. ${rate.toFixed(2)})
🏷️ *Descuento:* ${displayPromo.discountPct}% de ahorro

🛵 *Delivery disponible en Caracas* | 📍 Retiro en Sucursal Chacao
📲 Haz tu pedido respondiendo a este mensaje o vía WhatsApp al *${phoneForDelivery}*
_Precios válidos por el día de hoy o hasta agotar existencia._`;

  // Caption for Instagram / Social Media
  const instagramCaption = `🥟 ¡El mejor sabor de Caracas directo a tu mesa! 🇻🇪
Hoy tenemos activo el *${displayPromo.name}* con ${displayPromo.discountPct}% de descuento.

👉 Incluye:
${displayPromo.items.map((i) => `✔ ${i}`).join("\n")}

💰 Solo por hoy: $${displayPromo.promoPriceUsd.toFixed(2)} USD (Bs. ${fmtBs(priceBs)} al cambio oficial BCV).

🛵 Pide por WhatsApp al ${phoneForDelivery} o visítanos en ${pos.companySettings.name}.

#DrEmpanadas #EmpanadasVenezolanas #CaracasFood #DeliveryCaracas #DesayunoCriollo #PabellonCriollo #Empanadas #FoodieCaracas #Venezuela`;

  function handleCopyText(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("✓ Copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShareWhatsApp() {
    const encoded = encodeURIComponent(whatsappMessage);
    const url = `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank");
  }

  // Native share if supported on mobile
  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayPromo.name} · ${pos.companySettings.name}`,
          text: whatsappMessage,
        });
        toast.success("✓ Compartido con éxito");
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleShareWhatsApp();
    }
  }

  // Generate & Download PNG Image for Story using HTML Canvas
  function handleDownloadStoryImage() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dark luxury gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGrad.addColorStop(0, "#090D16");
    bgGrad.addColorStop(0.4, "#131B2E");
    bgGrad.addColorStop(0.7, "#1F1535");
    bgGrad.addColorStop(1, "#0A0D18");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Glowing ambient light circles
    const radGrad = ctx.createRadialGradient(540, 700, 50, 540, 700, 500);
    radGrad.addColorStop(0, "rgba(229, 168, 59, 0.25)");
    radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 200, 1080, 1000);

    // Top Brand Tag
    ctx.fillStyle = "#E5A83B";
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🥟 " + pos.companySettings.name.toUpperCase(), 540, 160);

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "30px sans-serif";
    ctx.fillText("Sabor Criollo Auténtico · Caracas, Venezuela", 540, 215);

    // Promo Badge
    ctx.fillStyle = "#E5A83B";
    ctx.beginPath();
    ctx.roundRect(340, 280, 400, 70, 35);
    ctx.fill();

    ctx.fillStyle = "#0A0D18";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(displayPromo.badge, 540, 327);

    // Giant Emoji / Illustration
    ctx.font = "190px sans-serif";
    ctx.fillText(displayPromo.icon, 540, 560);

    // Title
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 64px sans-serif";
    ctx.fillText(displayPromo.name, 540, 680);

    // Tagline
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "34px sans-serif";
    ctx.fillText(displayPromo.tagline, 540, 740);

    // Card Box for Items
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.strokeStyle = "rgba(229, 168, 59, 0.3)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(140, 810, 800, 360, 30);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#E5A83B";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("ESTA PROMOCIÓN INCLUYE:", 190, 880);

    ctx.fillStyle = "#F3F4F6";
    ctx.font = "32px sans-serif";
    displayPromo.items.forEach((item, idx) => {
      ctx.fillText(`✓  ${item}`, 190, 950 + idx * 60);
    });

    // Price Box
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
    ctx.strokeStyle = "rgba(16, 185, 129, 0.5)";
    ctx.beginPath();
    ctx.roundRect(140, 1220, 800, 260, 30);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "30px sans-serif";
    ctx.fillText(`Antes: $${displayPromo.regularPriceUsd.toFixed(2)} USD`, 540, 1275);

    ctx.fillStyle = "#10B981";
    ctx.font = "bold 82px sans-serif";
    ctx.fillText(`$${displayPromo.promoPriceUsd.toFixed(2)} USD`, 540, 1365);

    ctx.fillStyle = "#F3F4F6";
    ctx.font = "bold 38px monospace";
    ctx.fillText(`Bs. ${fmtBs(priceBs)} (Tasa Oficial)`, 540, 1430);

    // Call to Action
    ctx.fillStyle = "#E5A83B";
    ctx.beginPath();
    ctx.roundRect(190, 1530, 700, 100, 50);
    ctx.fill();

    ctx.fillStyle = "#0A0D18";
    ctx.font = "bold 38px sans-serif";
    ctx.fillText("📲 ¡PIDE AHORA POR WHATSAPP!", 540, 1595);

    // Footer contact
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = "32px sans-serif";
    ctx.fillText(`WhatsApp: ${phoneForDelivery} · Delivery Activo`, 540, 1700);

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "26px sans-serif";
    ctx.fillText("NovaSystem POS & Marketing Suite", 540, 1780);

    // Convert to download
    const link = document.createElement("a");
    link.download = `story-promo-${displayPromo.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("📥 Imagen de Story descargada en alta resolución (1080×1920)");
  }

  return (
    <Modal
      title="📱 Estudio de Promociones & Redes Sociales"
      onClose={onClose}
      className="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Subtitle explanation */}
        <p className="text-xs text-muted-foreground">
          Genera promociones visuales de alta gama listas para publicar en <strong>WhatsApp</strong>,{" "}
          <strong>Instagram Stories</strong> y <strong>redes sociales</strong> con precios en USD y Bs
          actualizados automáticamente a la tasa oficial del día.
        </p>

        {/* Top Controls: Choose Pack or Individual Product */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-secondary/50 p-3 rounded-2xl border border-border">
          {/* Preset packs selector */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">
              Seleccionar Pack Predefinido:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => {
                    setSelectedPack(pack);
                    setSelectedProductId("");
                  }}
                  className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2 ${
                    !selectedProductId && selectedPack.id === pack.id
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <span className="text-xl">{pack.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">{pack.name}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                      ${pack.promoPriceUsd.toFixed(2)} ({pack.discountPct}% OFF)
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Or choose individual product */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">
              O Promocionar Producto:
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className={`${inputCls} text-xs`}
            >
              <option value="">-- Elige un producto del menú --</option>
              {pos.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (${p.priceUsd.toFixed(2)})
                </option>
              ))}
            </select>

            {selectedProductId && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Descuento:</span>
                {[10, 15, 20, 25].map((d) => (
                  <button
                    key={d}
                    onClick={() => setCustomDiscount(d)}
                    className={`rounded-lg px-2 py-0.5 text-xs font-bold transition ${
                      customDiscount === d
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-1 pt-1">
              <label className="text-[10px] font-semibold text-muted-foreground">
                WhatsApp de Pedidos:
              </label>
              <input
                value={phoneForDelivery}
                onChange={(e) => setPhoneForDelivery(e.target.value)}
                placeholder="0412-1234567"
                className={`${inputCls} text-xs py-1`}
              />
            </div>
          </div>
        </div>

        {/* Tab switcher: WhatsApp Text vs Instagram Story Canvas */}
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("whatsapp")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === "whatsapp"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp & Mensajería</span>
            </button>
            <button
              onClick={() => setActiveTab("story")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === "story"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Camera className="h-4 w-4" />
              <span>Instagram Story (9:16)</span>
            </button>
          </div>

          {/* Quick Share Mobile Button */}
          <button
            onClick={handleNativeShare}
            className="rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Compartir desde el Móvil</span>
          </button>
        </div>

        {/* Tab 1: WhatsApp Preview */}
        {activeTab === "whatsapp" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Live Message Preview Card */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4" />
                  Previsualización en WhatsApp
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-300">
                  Listo para Enviar
                </span>
              </div>
              <div className="bg-emerald-900/10 dark:bg-slate-900/90 rounded-xl p-3.5 text-xs text-foreground whitespace-pre-line leading-relaxed font-mono border border-emerald-500/20 select-all shadow-inner">
                {whatsappMessage}
              </div>
            </div>

            {/* Actions for WhatsApp */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
                  <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Beneficios de esta publicación:</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                    <li>Precios calculados en vivo con la Tasa Oficial BCV.</li>
                    <li>Formato persuasivo con emojis para captar clientes en grupos y estados.</li>
                    <li>Llamado a la acción directo con tu número de teléfono.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 text-xs transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Send className="h-4 w-4" />
                  <span>Abrir WhatsApp y Enviar Directo</span>
                </button>

                <button
                  onClick={() => handleCopyText(whatsappMessage)}
                  className="w-full rounded-xl border border-border bg-secondary hover:bg-accent text-foreground font-semibold py-2 px-4 text-xs transition flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? "¡Copiado con Éxito!" : "Copiar Texto de la Promoción"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Instagram Story & Visual Flyer */}
        {activeTab === "story" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Story Visual Card (Simulating 9:16 format) */}
            <div className="flex justify-center">
              <div
                ref={storyCardRef}
                className="w-full max-w-[280px] aspect-[9/16] rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between text-white border border-slate-700 select-none"
                style={{
                  background: "linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)",
                }}
              >
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

                {/* Top header */}
                <div className="relative text-center space-y-1">
                  <div className="text-[11px] font-black tracking-widest text-amber-400 uppercase">
                    🥟 {pos.companySettings.name}
                  </div>
                  <div className="text-[9px] text-slate-300">Caracas · Sabor Venezolano</div>
                  <div className="mt-2 inline-block rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-black text-slate-950 uppercase shadow-md">
                    {displayPromo.badge}
                  </div>
                </div>

                {/* Middle content */}
                <div className="relative text-center space-y-2 py-2">
                  <div className="text-5xl animate-bounce">{displayPromo.icon}</div>
                  <div className="text-base font-black tracking-tight text-white leading-tight">
                    {displayPromo.name}
                  </div>
                  <div className="text-[10px] text-slate-300 leading-snug px-1">
                    {displayPromo.tagline}
                  </div>

                  <div className="rounded-xl bg-white/10 backdrop-blur-xs p-2 text-left space-y-1 text-[10px] border border-white/10">
                    {displayPromo.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-slate-200">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span className="truncate">{it}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom price and call to action */}
                <div className="relative text-center space-y-2">
                  <div className="rounded-2xl bg-emerald-500/20 border border-emerald-500/40 p-2 text-center">
                    <div className="text-[9px] text-slate-400 line-through">
                      Antes: ${displayPromo.regularPriceUsd.toFixed(2)} USD
                    </div>
                    <div className="text-xl font-black text-emerald-400 font-mono">
                      ${displayPromo.promoPriceUsd.toFixed(2)} USD
                    </div>
                    <div className="text-[10px] font-mono font-bold text-slate-200">
                      Bs. {fmtBs(priceBs)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-amber-400 text-slate-950 py-1.5 text-[11px] font-black tracking-wide uppercase shadow-lg">
                    📲 ¡Pide por WhatsApp!
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {phoneForDelivery} · Delivery Caracas
                  </div>
                </div>
              </div>
            </div>

            {/* Actions for Story */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
                  <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-purple-500" />
                    <span>Diseño para Instagram Stories & Estados</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Al pulsar en <strong>Descargar Imagen</strong>, el sistema renderiza automáticamente
                    un flyer vertical en alta resolución (1080×1920 px) con formato oficial listo para
                    subir a tus Stories de Instagram, estados de WhatsApp, TikTok o Facebook.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground">
                      Pie de Foto (Caption con Hashtags):
                    </span>
                    <button
                      onClick={() => handleCopyText(instagramCaption)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" /> Copiar
                    </button>
                  </div>
                  <div className="text-[10px] text-muted-foreground bg-secondary/60 p-2 rounded-lg max-h-24 overflow-y-auto whitespace-pre-line font-mono">
                    {instagramCaption}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleDownloadStoryImage}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white font-bold py-2.5 px-4 text-xs transition flex items-center justify-center gap-2 shadow-md"
                >
                  <Download className="h-4 w-4" />
                  <span>Descargar Imagen de Story (PNG 1080×1920)</span>
                </button>

                <button
                  onClick={() => handleCopyText(instagramCaption)}
                  className="w-full rounded-xl border border-border bg-secondary hover:bg-accent text-foreground font-semibold py-2 px-4 text-xs transition flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? "¡Copiado con Éxito!" : "Copiar Caption con Hashtags"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="border-t border-border pt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Tasa en tiempo real: <strong className="text-primary font-mono">Bs. {rate.toFixed(2)}</strong> / USD
          </span>
          <button onClick={onClose} className={btnGhost}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
