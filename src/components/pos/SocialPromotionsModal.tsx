import { useState, useEffect } from "react";
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
import {
  renderPromoFlyer,
  canvasToBlob,
  stripEmoji,
  FLYER_THEMES,
  FLYER_FORMATS,
  type FlyerData,
  type FlyerFormat,
  type FlyerTheme,
} from "@/lib/promoFlyer";

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
  const [storyTheme, setStoryTheme] = useState<FlyerTheme>("noche_dorada");
  const [flyerFormat, setFlyerFormat] = useState<FlyerFormat>("story");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [customDiscount, setCustomDiscount] = useState<number>(15);
  const [phoneForDelivery, setPhoneForDelivery] = useState<string>(pos.companySettings.phone || "0412-1234567");
  const [zoneName, setZoneName] = useState<string>(pos.companySettings.city || "San Jacinto, Maracay");

  // Editable custom copy
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customTagline, setCustomTagline] = useState("");
  const [customBadge, setCustomBadge] = useState("");
  const [customPromoPrice, setCustomPromoPrice] = useState<string>("");
  const [customRegularPrice, setCustomRegularPrice] = useState<string>("");

  // IA Generator: Analyzes inventory products and creates new promotions
  function handleGenerateFromInventory() {
    // Highest stock first: promos push what the business has most of today
    const prods = pos.products
      .filter((p) => p.active !== false)
      .sort((a, b) => b.stockBar + b.stockKitchen - (a.stockBar + a.stockKitchen));
    if (prods.length === 0) {
      toast.error("No hay productos en inventario");
      return;
    }

    // Pick categories
    const empanadas = prods.filter((p) => p.category === "Empanadas");
    const pastelitos = prods.filter((p) => p.category === "Pastelitos");
    const bebidas = prods.filter((p) => p.category === "Bebidas");

    const e1 = empanadas[0] || prods[0];
    const e2 = empanadas[1] || prods[1] || e1;
    const e3 = empanadas[2] || prods[2] || e2;
    const p1 = pastelitos[0] || prods[3] || e1;
    const b1 = bebidas[0] || { name: "Malta Polar bien fría", priceUsd: 1.5 };

    const gen1: PromoPack = {
      id: "gen-trio-" + Date.now(),
      name: `Trío San Jacinto (${e1.name.replace("Empanada ", "")} & ${e2.name.replace("Empanada ", "")})`,
      tagline: "¡Lo más pedido de la cocina en San Jacinto hoy!",
      items: [
        `2 ${e1.name} recién fritas`,
        `1 ${e2.name} crujiente`,
        `1 ${b1.name}`,
        "Guasacaca aragüeña y tártara casera gratis",
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
      tagline: "Hojaldre dorado crujiente para la media tarde en San Jacinto.",
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
      items: [`3 ${e1.name} bien tostadas`, "Doble ración de salsas de la casa"],
      regularPriceUsd: Number((e1.priceUsd * 3).toFixed(2)),
      promoPriceUsd: Number((e1.priceUsd * 3 * 0.75).toFixed(2)),
      discountPct: 25,
      badge: "DESCUENTO 25% FLASH ⚡",
      icon: "🔥",
    };

    const gen4: PromoPack = {
      id: "gen-degustacion-" + Date.now(),
      name: "Súper Degustación Criolla (5 Sabores)",
      tagline: "Un paseo gastronómico por los mejores rellenos de la casa.",
      items: [
        `1 ${e1.name}`,
        `1 ${e2.name}`,
        `1 ${e3.name}`,
        "1 Empanada de Queso Fundido",
        "1 Malta Polar o Jugo Natural",
      ],
      regularPriceUsd: Number((e1.priceUsd + e2.priceUsd + e3.priceUsd + 3.5).toFixed(2)),
      promoPriceUsd: Number(((e1.priceUsd + e2.priceUsd + e3.priceUsd + 3.5) * 0.78).toFixed(2)),
      discountPct: 22,
      badge: "SELECCIÓN DEL CHEF ⭐",
      icon: "👑",
    };

    const newPacks = [gen1, gen2, gen3, gen4, ...BASE_MARACAY_PACKS];
    setPacks(newPacks);
    setSelectedPack(gen1);
    setSelectedProductId("");
    setIsCustomizing(false);
    toast.success("✨ ¡Nuevas promociones generadas desde el inventario de Maracay!");
  }

  // Active product selection if chosen manually
  const activeProduct = pos.products.find((p) => p.id === selectedProductId);

  const baseDisplay = activeProduct
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

  const promoPriceUsdNum = isCustomizing && customPromoPrice.trim() !== ""
    ? parseFloat(customPromoPrice.replace(",", ".")) || baseDisplay.promoPriceUsd
    : baseDisplay.promoPriceUsd;

  const regularPriceUsdNum = isCustomizing && customRegularPrice.trim() !== ""
    ? parseFloat(customRegularPrice.replace(",", ".")) || baseDisplay.regularPriceUsd
    : baseDisplay.regularPriceUsd;

  const computedDiscount = regularPriceUsdNum > promoPriceUsdNum
    ? Math.round(((regularPriceUsdNum - promoPriceUsdNum) / regularPriceUsdNum) * 100)
    : baseDisplay.discountPct;

  const displayPromo = {
    ...baseDisplay,
    name: isCustomizing && customName.trim() ? customName : baseDisplay.name,
    tagline: isCustomizing && customTagline.trim() ? customTagline : baseDisplay.tagline,
    badge: isCustomizing && customBadge.trim() ? customBadge : (isCustomizing && customPromoPrice.trim() ? `OFERTA $${promoPriceUsdNum.toFixed(2)} 🔥` : baseDisplay.badge),
    promoPriceUsd: promoPriceUsdNum,
    regularPriceUsd: regularPriceUsdNum,
    discountPct: computedDiscount,
  };

  const priceBs = displayPromo.promoPriceUsd * rate;
  const regularPriceBs = displayPromo.regularPriceUsd * rate;

  // Formatted WhatsApp Text
  const whatsappMessage = `🥟 *¡${pos.companySettings.name.toUpperCase()} · SAN JACINTO, MARACAY!* 🇻🇪
✨ *${displayPromo.name}*
_${displayPromo.tagline}_

📋 *¿Qué incluye?*
${displayPromo.items.map((i) => `• ${i}`).join("\n")}

🔥 *PRECIO ESPECIAL:*
💵 *USD $${displayPromo.promoPriceUsd.toFixed(2)}* (Antes ~$${displayPromo.regularPriceUsd.toFixed(2)}~)
🇻🇪 *${fmtBs(priceBs)}* (Tasa Oficial BCV: Bs. ${rate.toFixed(2)})
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

💰 Solo por hoy: $${displayPromo.promoPriceUsd.toFixed(2)} USD (${fmtBs(priceBs)} a Tasa Oficial BCV).

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

  const flyerData: FlyerData = {
    businessName: pos.companySettings.name,
    city: zoneName,
    address: pos.companySettings.address || zoneName,
    phone: phoneForDelivery,
    name: displayPromo.name,
    tagline: displayPromo.tagline,
    badge: displayPromo.badge,
    items: displayPromo.items,
    regularPriceUsd: displayPromo.regularPriceUsd,
    promoPriceUsd: displayPromo.promoPriceUsd,
    discountPct: displayPromo.discountPct,
    rate,
    heroHint: activeProduct?.category ?? "",
  };
  const flyerKey = JSON.stringify(flyerData);

  // Live preview: same renderer as the download, so what you see is what you share
  useEffect(() => {
    let cancelled = false;
    renderPromoFlyer(flyerData, storyTheme, flyerFormat).then((canvas) => {
      if (!cancelled) setPreviewUrl(canvas.toDataURL("image/png"));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyerKey, storyTheme, flyerFormat]);

  function flyerFileName() {
    const slug = stripEmoji(displayPromo.name)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `promo-${slug}-${flyerFormat}.png`;
  }

  async function handleDownloadStoryImage() {
    const canvas = await renderPromoFlyer(flyerData, storyTheme, flyerFormat);
    const blob = await canvasToBlob(canvas);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = flyerFileName();
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Imagen descargada en alta calidad");
  }

  // Shares the image + text in one go (WhatsApp, Instagram…) on phones that support it
  async function handleShareImage() {
    try {
      const canvas = await renderPromoFlyer(flyerData, storyTheme, flyerFormat);
      const file = new File([await canvasToBlob(canvas)], flyerFileName(), { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: whatsappMessage });
        return;
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }
    await handleDownloadStoryImage();
    toast.info("Este equipo no permite compartir imágenes directo: adjunta la imagen descargada en WhatsApp.");
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

        {/* Quick Customization Toolbar */}
        <div className="flex items-center justify-between bg-card p-2.5 rounded-xl border border-border text-xs">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">
              {isCustomizing ? "Modo Personalización Activo:" : "Combo Seleccionado:"}
            </span>
            <span className="text-muted-foreground font-medium truncate max-w-[200px] sm:max-w-xs">
              {displayPromo.name}
            </span>
          </div>
          <button
            onClick={() => {
              if (!isCustomizing) {
                setCustomName(displayPromo.name);
                setCustomTagline(displayPromo.tagline);
                setCustomBadge(displayPromo.badge);
                setCustomPromoPrice(String(displayPromo.promoPriceUsd));
                setCustomRegularPrice(String(displayPromo.regularPriceUsd));
              }
              setIsCustomizing(!isCustomizing);
            }}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            {isCustomizing ? "✕ Cerrar Edición" : "✏️ Editar Textos y Precios del Flyer"}
          </button>
        </div>

        {isCustomizing && (
          <div className="space-y-2.5 bg-primary/5 p-3 rounded-xl border border-primary/20 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Título de la Promo:</label>
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={displayPromo.name}
                  className={`${inputCls} text-xs py-1 mt-1`}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Frase / Eslogan:</label>
                <input
                  value={customTagline}
                  onChange={(e) => setCustomTagline(e.target.value)}
                  placeholder={displayPromo.tagline}
                  className={`${inputCls} text-xs py-1 mt-1`}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Etiqueta / Badge:</label>
                <input
                  value={customBadge}
                  onChange={(e) => setCustomBadge(e.target.value)}
                  placeholder={displayPromo.badge}
                  className={`${inputCls} text-xs py-1 mt-1`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 border-t border-primary/20 pt-2">
              <div>
                <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">💵 Precio Promo ($ USD):</label>
                <input
                  inputMode="decimal"
                  value={customPromoPrice}
                  onChange={(e) => setCustomPromoPrice(e.target.value)}
                  placeholder={String(baseDisplay.promoPriceUsd)}
                  className={`${inputCls} text-xs py-1 mt-1 font-mono font-bold text-emerald-600 dark:text-emerald-400`}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">🏷️ Precio Regular ($ USD):</label>
                <input
                  inputMode="decimal"
                  value={customRegularPrice}
                  onChange={(e) => setCustomRegularPrice(e.target.value)}
                  placeholder={String(baseDisplay.regularPriceUsd)}
                  className={`${inputCls} text-xs py-1 mt-1 font-mono`}
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="text-[11px] font-mono font-bold text-primary bg-primary/10 rounded-lg p-1.5 text-center">
                  Bs. {fmtBs(priceBs)} ({displayPromo.discountPct}% Dto.)
                </div>
              </div>
            </div>
          </div>
        )}

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
              <span>Imagen para Redes</span>
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
              {/* Format selector */}
              <div className="flex items-center gap-1 rounded-xl bg-secondary p-1 text-[11px] font-bold">
                {FLYER_FORMATS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFlyerFormat(f.id)}
                    className={`rounded-lg px-2.5 py-1 transition ${
                      flyerFormat === f.id ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label} <span className="font-mono font-medium opacity-60">{f.size}</span>
                  </button>
                ))}
              </div>

              {/* Theme selector */}
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {FLYER_THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setStoryTheme(t.id)}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                      storyTheme === t.id ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                      style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 50%, ${t.swatch[1]} 50%)` }}
                    />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Live preview (exact image that will be shared) */}
              <div
                className={`w-full ${flyerFormat === "story" ? "max-w-[270px] aspect-[9/16]" : "max-w-[320px] aspect-[4/5]"} rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/10 bg-secondary`}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt={`Vista previa: ${displayPromo.name}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full animate-pulse" />
                )}
              </div>
            </div>

            {/* Actions for Story */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
                  <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-purple-500" />
                    <span>Imagen lista para redes y WhatsApp</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Elige formato y estilo: la vista previa es exactamente la imagen que se comparte.
                    <strong> Historia</strong> sirve para Estados de WhatsApp e Historias de Instagram;
                    <strong> Publicación</strong> para el muro de Instagram/Facebook y chats o grupos de WhatsApp.
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
                  onClick={handleShareImage}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 text-xs transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Compartir imagen + texto (WhatsApp, Instagram…)</span>
                </button>

                <button
                  onClick={handleDownloadStoryImage}
                  className="w-full rounded-xl bg-foreground hover:opacity-90 text-background font-bold py-2.5 px-4 text-xs transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Descargar imagen ({FLYER_FORMATS.find((f) => f.id === flyerFormat)?.size})</span>
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
