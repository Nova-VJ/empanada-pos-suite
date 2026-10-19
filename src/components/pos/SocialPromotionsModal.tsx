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
  RefreshCw,
  Palette,
  MapPin,
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

const BASE_MARACAY_PACKS: PromoPack[] = [
  {
    id: "pack-desayuno",
    name: "Combo San Jacinto Maracayero",
    tagline: "¡La verdadera energía aragüeña para arrancar el día!",
    items: [
      "2 Empanadas Pabellón Criollo (Carne mechada, caraotas, tajadas, queso)",
      "1 Empanada Tajada con Queso Llanero",
      "1 Malta Polar bien fría (355ml)",
      "Salsa Tártara y Guasacaca cremosa de cortesía",
    ],
    regularPriceUsd: 6.8,
    promoPriceUsd: 5.5,
    discountPct: 19,
    badge: "MÁS VENDIDO EN SAN JACINTO 🔥",
    icon: "🥟",
  },
  {
    id: "pack-familiar",
    name: "Pack Familiar San Jacinto (10 Empanadas)",
    tagline: "Para compartir en familia o con los panas en la oficina.",
    items: [
      "10 Empanadas crujientes recién hechas surtidas",
      "Pote grande de Salsa Tártara casera de cortesía",
      "Pote grande de Guasacaca aragüeña de cortesía",
    ],
    regularPriceUsd: 22.5,
    promoPriceUsd: 18.0,
    discountPct: 20,
    badge: "AHORRO FAMILIAR 20% 👨‍👩‍👧‍👦",
    icon: "🎉",
  },
  {
    id: "pack-duo-pastelitos",
    name: "Combo Dúo Pastelitos & Café",
    tagline: "Hojaldre dorado crujiente con café con leche espumoso.",
    items: ["4 Pastelitos (Carne molida o Queso llanero)", "2 Cafés con Leche grandes"],
    regularPriceUsd: 7.2,
    promoPriceUsd: 6.0,
    discountPct: 17,
    badge: "TARDE DULCE ☕",
    icon: "🥪",
  },
  {
    id: "promo-flash-4x3",
    name: "Promo Flash 4x3 Pabellón y Cazón",
    tagline: "¡Lleva 4 empanadas especiales y paga solo 3!",
    items: ["Compra 3 Empanadas especiales y llévate la 4ta GRATIS", "Salsas de la casa incluidas"],
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

  const [packs, setPacks] = useState<PromoPack[]>(BASE_MARACAY_PACKS);
  const [selectedPack, setSelectedPack] = useState<PromoPack>(BASE_MARACAY_PACKS[0]);
  const [activeTab, setActiveTab] = useState<"whatsapp" | "story">("whatsapp");
  const [storyTheme, setStoryTheme] = useState<"dark_luxury" | "sunset_criollo">("dark_luxury");
  const [copied, setCopied] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [customDiscount, setCustomDiscount] = useState<number>(15);
  const [phoneForDelivery, setPhoneForDelivery] = useState<string>(pos.companySettings.phone || "0412-1234567");
  const [zoneName, setZoneName] = useState<string>(pos.companySettings.city || "San Jacinto, Maracay");

  const storyCardRef = useRef<HTMLDivElement>(null);

  // IA Generator: Analyzes inventory products and creates new promotions
  function handleGenerateFromInventory() {
    const prods = pos.products.filter((p) => p.active !== false);
    if (prods.length === 0) {
      toast.error("No hay productos en inventario");
      return;
    }

    // Pick top empanadas
    const empanadas = prods.filter((p) => p.category === "Empanadas");
    const pastelitos = prods.filter((p) => p.category === "Pastelitos");
    const bebidas = prods.filter((p) => p.category === "Bebidas");

    const e1 = empanadas[0] || prods[0];
    const e2 = empanadas[1] || prods[1] || e1;
    const p1 = pastelitos[0] || prods[2] || e1;
    const b1 = bebidas[0] || { name: "Malta Polar fría", priceUsd: 1.5 };

    const gen1: PromoPack = {
      id: "gen-trio-" + Date.now(),
      name: `Trío San Jacinto (${e1.name.replace("Empanada ", "")} & ${e2.name.replace("Empanada ", "")})`,
      tagline: "¡Lo más pedido de la cocina en San Jacinto hoy!",
      items: [
        `2 ${e1.name}`,
        `1 ${e2.name}`,
        `1 ${b1.name}`,
        "Guasacaca y Salsa Tártara casera de cortesía",
      ],
      regularPriceUsd: Number((e1.priceUsd * 2 + e2.priceUsd + b1.priceUsd).toFixed(2)),
      promoPriceUsd: Number(((e1.priceUsd * 2 + e2.priceUsd + b1.priceUsd) * 0.82).toFixed(2)),
      discountPct: 18,
      badge: "SABOR ARAGÜEÑO 🥟",
      icon: "🥟",
    };

    const gen2: PromoPack = {
      id: "gen-merienda-" + Date.now(),
      name: `Combo Merienda Aragüeña (${p1.name})`,
      tagline: "Crujiente hojaldre recién salido para la media tarde.",
      items: [`3 ${p1.name}`, `1 ${e1.name}`, "2 Bebidas refrescantes a elección"],
      regularPriceUsd: Number((p1.priceUsd * 3 + e1.priceUsd + 3.0).toFixed(2)),
      promoPriceUsd: Number(((p1.priceUsd * 3 + e1.priceUsd + 3.0) * 0.8).toFixed(2)),
      discountPct: 20,
      badge: "MERIENDA SAN JACINTO 🥪",
      icon: "🥪",
    };

    const gen3: PromoPack = {
      id: "gen-flash-" + Date.now(),
      name: `Promo Flash: Especial ${e1.name}`,
      tagline: "¡Mayor inventario del día con descuento especial para disfrutar ya!",
      items: [`3 ${e1.name} bien tostadas`, "Doble ración de salsa gratis"],
      regularPriceUsd: Number((e1.priceUsd * 3).toFixed(2)),
      promoPriceUsd: Number((e1.priceUsd * 3 * 0.75).toFixed(2)),
      discountPct: 25,
      badge: "DESCUENTO 25% FLASH ⚡",
      icon: "🔥",
    };

    const newPacks = [gen1, gen2, gen3, ...BASE_MARACAY_PACKS.slice(0, 1)];
    setPacks(newPacks);
    setSelectedPack(gen1);
    setSelectedProductId("");
    toast.success("✨ ¡Nuevas promociones generadas desde el inventario de Maracay!");
  }

  // Active product selection if chosen manually
  const activeProduct = pos.products.find((p) => p.id === selectedProductId);

  const displayPromo = activeProduct
    ? {
        name: `Especial: ${activeProduct.name}`,
        tagline: `¡Recién hechas y crujientes en San Jacinto, Maracay!`,
        items: [
          `1 ${activeProduct.name}`,
          "Salsa tártara y guasacaca incluidas",
          "Preparadas al momento en cocina",
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
  const whatsappMessage = `🥟 *¡${pos.companySettings.name.toUpperCase()} · SAN JACINTO, MARACAY!* 🇻🇪
✨ *${displayPromo.name}*
_${displayPromo.tagline}_

📋 *¿Qué incluye?*
${displayPromo.items.map((i) => `• ${i}`).join("\n")}

🔥 *PRECIO ESPECIAL:*
💵 *USD $${displayPromo.promoPriceUsd.toFixed(2)}* (Antes ~~$${displayPromo.regularPriceUsd.toFixed(2)}~~)
🇻🇪 *Bs. ${fmtBs(priceBs)}* (Tasa Oficial BCV: Bs. ${rate.toFixed(2)})
🏷️ *Descuento:* ${displayPromo.discountPct}% de ahorro

🛵 *Delivery disponible en San Jacinto, Montaña Fresca y Maracay*
📍 Sucursal: ${pos.companySettings.address || "San Jacinto, Maracay"}
📲 Haz tu pedido respondiendo a este mensaje o vía WhatsApp al *${phoneForDelivery}*
_Precios válidos por el día de hoy o hasta agotar existencia._`;

  // Caption for Instagram / Social Media
  const instagramCaption = `🥟 ¡El mejor sabor de Maracay directo a tu mesa en San Jacinto! 🇻🇪
Hoy tenemos activo el *${displayPromo.name}* con ${displayPromo.discountPct}% de descuento.

👉 Incluye:
${displayPromo.items.map((i) => `✔ ${i}`).join("\n")}

💰 Solo por hoy: $${displayPromo.promoPriceUsd.toFixed(2)} USD (Bs. ${fmtBs(priceBs)} a Tasa Oficial BCV).

🛵 Pide por WhatsApp al ${phoneForDelivery} o visítanos en San Jacinto.
📍 ${pos.companySettings.name} · Maracay, Edo. Aragua.

#DrEmpanadas #SanJacintoMaracay #Maracay #Aragua #EmpanadasMaracay #DeliveryMaracay #DesayunoCriollo #FoodieMaracay #Venezuela`;

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
        // User cancelled
      }
    } else {
      handleShareWhatsApp();
    }
  }

  // Generate & Download PNG Image for Story using HTML Canvas in High-Res (1080x1920)
  function handleDownloadStoryImage() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (storyTheme === "dark_luxury") {
      // Dark Luxury Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
      bgGrad.addColorStop(0, "#080C14");
      bgGrad.addColorStop(0.35, "#101626");
      bgGrad.addColorStop(0.7, "#1A142E");
      bgGrad.addColorStop(1, "#070A12");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Gold Glow
      const radGrad = ctx.createRadialGradient(540, 700, 40, 540, 700, 520);
      radGrad.addColorStop(0, "rgba(229, 168, 59, 0.22)");
      radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 200, 1080, 1000);

      // Outer Gold Frame
      ctx.strokeStyle = "#E5A83B";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(40, 40, 1000, 1840, 40);
      ctx.stroke();

      // Top Brand
      ctx.fillStyle = "#E5A83B";
      ctx.font = "bold 40px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(pos.companySettings.name.toUpperCase(), 540, 150);

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = "28px sans-serif";
      ctx.fillText("San Jacinto · Maracay, Edo. Aragua", 540, 205);

      // Badge
      ctx.fillStyle = "#E5A83B";
      ctx.beginPath();
      ctx.roundRect(290, 260, 500, 70, 35);
      ctx.fill();

      ctx.fillStyle = "#090D16";
      ctx.font = "bold 30px sans-serif";
      ctx.fillText(displayPromo.badge, 540, 307);

      // Emoji
      ctx.font = "180px sans-serif";
      ctx.fillText(displayPromo.icon, 540, 530);

      // Title
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 60px sans-serif";
      ctx.fillText(displayPromo.name, 540, 640);

      // Tagline
      ctx.fillStyle = "#E5A83B";
      ctx.font = "32px sans-serif";
      ctx.fillText(displayPromo.tagline, 540, 705);

      // Items Box
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.strokeStyle = "rgba(229, 168, 59, 0.4)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(140, 770, 800, 380, 30);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#E5A83B";
      ctx.font = "bold 34px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("ESTA PROMOCIÓN INCLUYE:", 190, 840);

      ctx.fillStyle = "#F3F4F6";
      ctx.font = "30px sans-serif";
      displayPromo.items.forEach((item, idx) => {
        ctx.fillText(`✓  ${item}`, 190, 910 + idx * 60);
      });

      // Price Box
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
      ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(140, 1200, 800, 270, 30);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "28px sans-serif";
      ctx.fillText(`Antes: $${displayPromo.regularPriceUsd.toFixed(2)} USD`, 540, 1255);

      ctx.fillStyle = "#34D399";
      ctx.font = "bold 82px sans-serif";
      ctx.fillText(`$${displayPromo.promoPriceUsd.toFixed(2)} USD`, 540, 1345);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 36px monospace";
      ctx.fillText(`Bs. ${fmtBs(priceBs)} (Tasa Oficial BCV)`, 540, 1415);

      // Call to Action Button
      ctx.fillStyle = "#E5A83B";
      ctx.beginPath();
      ctx.roundRect(180, 1520, 720, 100, 50);
      ctx.fill();

      ctx.fillStyle = "#090D16";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText("📲 ¡PIDE AHORA POR WHATSAPP!", 540, 1585);

      // Footer
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "30px sans-serif";
      ctx.fillText(`WhatsApp: ${phoneForDelivery} · Delivery en San Jacinto`, 540, 1690);

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "24px sans-serif";
      ctx.fillText("NovaSystem × Dr. Empanadas Marketing Suite", 540, 1760);

    } else {
      // Sunset Criollo Theme
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
      bgGrad.addColorStop(0, "#1F0A02");
      bgGrad.addColorStop(0.4, "#451A03");
      bgGrad.addColorStop(0.8, "#7C2D12");
      bgGrad.addColorStop(1, "#180602");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Orange/Amber Warm Glow
      const radGrad = ctx.createRadialGradient(540, 650, 40, 540, 650, 520);
      radGrad.addColorStop(0, "rgba(249, 115, 22, 0.3)");
      radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 150, 1080, 1000);

      // Border Frame
      ctx.strokeStyle = "#F97316";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(40, 40, 1000, 1840, 40);
      ctx.stroke();

      // Top Brand
      ctx.fillStyle = "#FDBA74";
      ctx.font = "bold 40px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(pos.companySettings.name.toUpperCase(), 540, 150);

      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = "28px sans-serif";
      ctx.fillText("San Jacinto · Maracay, Edo. Aragua", 540, 205);

      // Badge
      ctx.fillStyle = "#F97316";
      ctx.beginPath();
      ctx.roundRect(290, 260, 500, 70, 35);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 30px sans-serif";
      ctx.fillText(displayPromo.badge, 540, 307);

      // Emoji
      ctx.font = "180px sans-serif";
      ctx.fillText(displayPromo.icon, 540, 530);

      // Title
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 60px sans-serif";
      ctx.fillText(displayPromo.name, 540, 640);

      // Tagline
      ctx.fillStyle = "#FED7AA";
      ctx.font = "32px sans-serif";
      ctx.fillText(displayPromo.tagline, 540, 705);

      // Items Box
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.strokeStyle = "rgba(249, 115, 22, 0.5)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(140, 770, 800, 380, 30);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FDBA74";
      ctx.font = "bold 34px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("ESTA PROMOCIÓN INCLUYE:", 190, 840);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "30px sans-serif";
      displayPromo.items.forEach((item, idx) => {
        ctx.fillText(`✓  ${item}`, 190, 910 + idx * 60);
      });

      // Price Box
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(140, 1200, 800, 270, 30);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.font = "28px sans-serif";
      ctx.fillText(`Antes: $${displayPromo.regularPriceUsd.toFixed(2)} USD`, 540, 1255);

      ctx.fillStyle = "#34D399";
      ctx.font = "bold 82px sans-serif";
      ctx.fillText(`$${displayPromo.promoPriceUsd.toFixed(2)} USD`, 540, 1345);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 36px monospace";
      ctx.fillText(`Bs. ${fmtBs(priceBs)} (Tasa Oficial BCV)`, 540, 1415);

      // Call to Action Button
      ctx.fillStyle = "#F97316";
      ctx.beginPath();
      ctx.roundRect(180, 1520, 720, 100, 50);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText("📲 ¡PIDE AHORA POR WHATSAPP!", 540, 1585);

      // Footer
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "30px sans-serif";
      ctx.fillText(`WhatsApp: ${phoneForDelivery} · Delivery en San Jacinto`, 540, 1690);

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "24px sans-serif";
      ctx.fillText("NovaSystem × Dr. Empanadas Marketing Suite", 540, 1760);
    }

    const link = document.createElement("a");
    link.download = `story-${storyTheme}-${displayPromo.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("📥 Imagen de Story descargada en calidad profesional (1080×1920)");
  }

  return (
    <Modal
      title="📱 Estudio de Promociones & Redes Sociales"
      onClose={onClose}
      className="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Top welcome explanation + AI Generator Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-3.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-xl">📍</span>
            <div>
              <span className="font-bold text-foreground">
                Comercio: {pos.companySettings.name} (San Jacinto, Maracay)
              </span>
              <p className="text-muted-foreground text-[11px]">
                Precios calculados en vivo a Tasa Oficial BCV: <strong>Bs. {rate.toFixed(2)}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateFromInventory}
            className="rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white font-bold px-3.5 py-2 text-xs transition shadow-xs flex items-center justify-center gap-1.5 shrink-0"
            title="Analiza tus productos en inventario y crea nuevas combinaciones y promociones creativas"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generar Promos desde Inventario</span>
          </button>
        </div>

        {/* Top Controls: Choose Pack or Individual Product */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-secondary/50 p-3 rounded-2xl border border-border">
          {/* Preset packs selector */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
              <span>Promociones Disponibles:</span>
              <span className="text-[10px] text-primary">{packs.length} combos listos</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {packs.map((pack) => (
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
                WhatsApp de Pedidos en San Jacinto:
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
        <div className="flex items-center justify-between border-b border-border pb-2 flex-wrap gap-2">
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
              <span>WhatsApp & Grupos</span>
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
              <span>Instagram Story / Flyer (9:16)</span>
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
                    <span>Beneficios para tus clientes de Maracay:</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                    <li>Precios calculados en vivo con la Tasa Oficial BCV.</li>
                    <li>Formato persuasivo con emojis para captar clientes en grupos y estados.</li>
                    <li>Mención de delivery en San Jacinto, Montaña Fresca y Maracay.</li>
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
            {/* Visual Card (Live 9:16 preview) with Theme Switcher */}
            <div className="flex flex-col items-center space-y-2">
              {/* Theme Selector */}
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Palette className="h-3.5 w-3.5 text-primary" />
                <span>Estilo Visual:</span>
                <button
                  onClick={() => setStoryTheme("dark_luxury")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    storyTheme === "dark_luxury"
                      ? "bg-slate-900 text-amber-400 border border-amber-500 shadow-xs"
                      : "bg-secondary text-muted-foreground border border-border"
                  }`}
                >
                  1. Dark Luxury & Gold
                </button>
                <button
                  onClick={() => setStoryTheme("sunset_criollo")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    storyTheme === "sunset_criollo"
                      ? "bg-orange-950 text-orange-400 border border-orange-500 shadow-xs"
                      : "bg-secondary text-muted-foreground border border-border"
                  }`}
                >
                  2. Sunset Criollo
                </button>
              </div>

              {/* Story Visual Card */}
              <div
                ref={storyCardRef}
                className={`w-full max-w-[280px] aspect-[9/16] rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between text-white border select-none transition-all ${
                  storyTheme === "dark_luxury"
                    ? "border-amber-500/40"
                    : "border-orange-500/50"
                }`}
                style={{
                  background:
                    storyTheme === "dark_luxury"
                      ? "linear-gradient(145deg, #090D16 0%, #131B2E 50%, #070A12 100%)"
                      : "linear-gradient(145deg, #1F0A02 0%, #451A03 50%, #7C2D12 100%)",
                }}
              >
                {/* Glow */}
                <div
                  className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none ${
                    storyTheme === "dark_luxury" ? "bg-amber-500/20" : "bg-orange-500/30"
                  }`}
                />

                {/* Top header */}
                <div className="relative text-center space-y-1">
                  <div
                    className={`text-[11px] font-black tracking-widest uppercase ${
                      storyTheme === "dark_luxury" ? "text-amber-400" : "text-orange-300"
                    }`}
                  >
                    {pos.companySettings.name}
                  </div>
                  <div className="text-[9px] text-slate-300">San Jacinto · Maracay, Edo. Aragua</div>
                  <div
                    className={`mt-1.5 inline-block rounded-full px-3 py-0.5 text-[9px] font-black uppercase shadow-md ${
                      storyTheme === "dark_luxury"
                        ? "bg-amber-500 text-slate-950"
                        : "bg-orange-500 text-white"
                    }`}
                  >
                    {displayPromo.badge}
                  </div>
                </div>

                {/* Middle content */}
                <div className="relative text-center space-y-2 py-1">
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

                  <div
                    className={`rounded-xl py-1.5 text-[11px] font-black tracking-wide uppercase shadow-lg ${
                      storyTheme === "dark_luxury"
                        ? "bg-amber-400 text-slate-950"
                        : "bg-orange-500 text-white"
                    }`}
                  >
                    📲 ¡Pide por WhatsApp!
                  </div>
                  <div className="text-[9px] text-slate-300">
                    {phoneForDelivery} · Delivery en San Jacinto
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
                    <span>Diseño para Instagram Stories & Estados (1080×1920)</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Al pulsar en <strong>Descargar Imagen</strong>, el sistema genera automáticamente un
                    flyer en resolución 1080×1920 listo para subir a tus Stories de Instagram, estados de
                    WhatsApp, TikTok o Facebook con el estilo visual que elijas.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground">
                      Pie de Foto (Caption con Hashtags de Maracay):
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
                  <span>Descargar Imagen de Story ({storyTheme === "dark_luxury" ? "Dark Luxury" : "Sunset Criollo"})</span>
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
            📍 San Jacinto, Maracay · Tasa Oficial: <strong className="text-primary font-mono">Bs. {rate.toFixed(2)}</strong> / USD
          </span>
          <button onClick={onClose} className={btnGhost}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
