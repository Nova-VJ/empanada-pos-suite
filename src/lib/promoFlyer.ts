/**
 * Promo flyer renderer (canvas). One layout engine shared by every theme and format,
 * so the on-screen preview and the downloaded PNG are pixel-identical.
 * No emojis are drawn: they render as empty boxes on many Windows/Android fonts.
 */
import { fmtBs } from "./money";

export type FlyerTheme =
  | "noche_dorada"
  | "atardecer_criollo"
  | "mercado_fresco"
  | "halloween"
  | "navidad"
  | "dia_del_padre"
  | "dia_de_la_mujer"
  | "mega_promo"
  | "fin_de_semana";

export type FlyerFormat = "story" | "post";

export interface FlyerData {
  businessName: string;
  city: string;
  address: string;
  phone: string;
  name: string;
  tagline: string;
  badge: string;
  items: string[];
  regularPriceUsd: number;
  promoPriceUsd: number;
  discountPct: number;
  rate: number;
  /** Extra text used to pick the hero image (e.g. product category). */
  heroHint?: string;
  /** Optional custom uploaded photo (data URL / image URL) */
  customImage?: string;
  /** Optional manual hero icon selection */
  heroIcon?: "empanada" | "pastelito" | "malta" | "cafe" | "trio";
}

interface Palette {
  label: string;
  swatch: [string, string];
  ink: string;
  muted: string;
  accent: string;
  accentInk: string;
  panelFill: string;
  panelStroke: string;
  panelInk: string;
  check: string;
  checkInk: string;
  price: string;
  stickerBg: string;
  stickerInk: string;
  ctaBg: string;
  ctaInk: string;
  frame?: string;
}

const PALETTES: Record<FlyerTheme, Palette> = {
  noche_dorada: {
    label: "Noche Dorada (Gourmet)",
    swatch: ["#120d08", "#d9a55b"],
    ink: "#f7ecdc",
    muted: "rgba(247,236,220,.62)",
    accent: "#d9a55b",
    accentInk: "#1a1209",
    panelFill: "rgba(255,240,215,.06)",
    panelStroke: "rgba(217,165,91,.35)",
    panelInk: "#f2e6d4",
    check: "#d9a55b",
    checkInk: "#1a1209",
    price: "#f0c27b",
    stickerBg: "#d9a55b",
    stickerInk: "#1a1209",
    ctaBg: "#d9a55b",
    ctaInk: "#1a1209",
    frame: "rgba(217,165,91,.55)",
  },
  atardecer_criollo: {
    label: "Atardecer Criollo (Naranja)",
    swatch: ["#ea580c", "#fde047"],
    ink: "#ffffff",
    muted: "rgba(255,247,237,.85)",
    accent: "#fde047",
    accentInk: "#431407",
    panelFill: "#fff7ed",
    panelStroke: "rgba(255,255,255,0)",
    panelInk: "#431407",
    check: "#ea580c",
    checkInk: "#ffffff",
    price: "#fde047",
    stickerBg: "#fde047",
    stickerInk: "#9a3412",
    ctaBg: "#ffffff",
    ctaInk: "#9a3412",
  },
  mercado_fresco: {
    label: "Mercado Fresco (Verde)",
    swatch: ["#fbf5ea", "#1f5135"],
    ink: "#1d3a2a",
    muted: "rgba(29,58,42,.66)",
    accent: "#1f5135",
    accentInk: "#fbf5ea",
    panelFill: "#ffffff",
    panelStroke: "#e9dfcd",
    panelInk: "#2a3b31",
    check: "#c2410c",
    checkInk: "#ffffff",
    price: "#b42318",
    stickerBg: "#c2410c",
    stickerInk: "#ffffff",
    ctaBg: "#1f7a43",
    ctaInk: "#ffffff",
  },
  halloween: {
    label: "🎃 Halloween / Noche de Miedo",
    swatch: ["#180829", "#f97316"],
    ink: "#ffffff",
    muted: "rgba(241,245,249,.75)",
    accent: "#f97316",
    accentInk: "#180829",
    panelFill: "rgba(30,12,50,.85)",
    panelStroke: "rgba(249,115,22,.5)",
    panelInk: "#f3e8ff",
    check: "#a855f7",
    checkInk: "#ffffff",
    price: "#fb923c",
    stickerBg: "#f97316",
    stickerInk: "#180829",
    ctaBg: "#f97316",
    ctaInk: "#180829",
    frame: "rgba(249,115,22,.65)",
  },
  navidad: {
    label: "🎄 Navidad & Fin de Año",
    swatch: ["#881337", "#facc15"],
    ink: "#ffffff",
    muted: "rgba(254,242,242,.85)",
    accent: "#facc15",
    accentInk: "#4c0519",
    panelFill: "rgba(255,255,255,.95)",
    panelStroke: "rgba(250,204,21,.5)",
    panelInk: "#881337",
    check: "#15803d",
    checkInk: "#ffffff",
    price: "#fde047",
    stickerBg: "#15803d",
    stickerInk: "#ffffff",
    ctaBg: "#facc15",
    ctaInk: "#881337",
    frame: "rgba(250,204,21,.65)",
  },
  dia_del_padre: {
    label: "👨‍👧 Día del Padre (Campeón)",
    swatch: ["#0f172a", "#38bdf8"],
    ink: "#ffffff",
    muted: "rgba(241,245,249,.8)",
    accent: "#38bdf8",
    accentInk: "#0f172a",
    panelFill: "#ffffff",
    panelStroke: "rgba(56,189,248,.35)",
    panelInk: "#0f172a",
    check: "#0284c7",
    checkInk: "#ffffff",
    price: "#38bdf8",
    stickerBg: "#0284c7",
    stickerInk: "#ffffff",
    ctaBg: "#38bdf8",
    ctaInk: "#0f172a",
    frame: "rgba(56,189,248,.5)",
  },
  dia_de_la_mujer: {
    label: "👩‍👧 Día de la Mujer & Madre",
    swatch: ["#701a75", "#f472b6"],
    ink: "#ffffff",
    muted: "rgba(253,242,248,.85)",
    accent: "#fbcfe8",
    accentInk: "#701a75",
    panelFill: "rgba(255,255,255,.96)",
    panelStroke: "rgba(244,114,182,.4)",
    panelInk: "#701a75",
    check: "#db2777",
    checkInk: "#ffffff",
    price: "#fbcfe8",
    stickerBg: "#db2777",
    stickerInk: "#ffffff",
    ctaBg: "#f472b6",
    ctaInk: "#701a75",
    frame: "rgba(244,114,182,.6)",
  },
  mega_promo: {
    label: "⚡ Mega Promo / Impacto",
    swatch: ["#dc2626", "#facc15"],
    ink: "#ffffff",
    muted: "rgba(254,242,242,.85)",
    accent: "#facc15",
    accentInk: "#450a0a",
    panelFill: "#ffffff",
    panelStroke: "rgba(220,38,38,.25)",
    panelInk: "#450a0a",
    check: "#dc2626",
    checkInk: "#ffffff",
    price: "#facc15",
    stickerBg: "#facc15",
    stickerInk: "#450a0a",
    ctaBg: "#ffffff",
    ctaInk: "#dc2626",
  },
  fin_de_semana: {
    label: "🌴 Fin de Semana Criollo",
    swatch: ["#0d9488", "#fbbf24"],
    ink: "#ffffff",
    muted: "rgba(240,253,250,.85)",
    accent: "#fbbf24",
    accentInk: "#134e4a",
    panelFill: "#ffffff",
    panelStroke: "rgba(13,148,136,.3)",
    panelInk: "#134e4a",
    check: "#0d9488",
    checkInk: "#ffffff",
    price: "#fbbf24",
    stickerBg: "#fbbf24",
    stickerInk: "#134e4a",
    ctaBg: "#fbbf24",
    ctaInk: "#134e4a",
  },
};

export const FLYER_THEMES = (Object.keys(PALETTES) as FlyerTheme[]).map((id) => ({
  id,
  label: PALETTES[id].label,
  swatch: PALETTES[id].swatch,
}));

export const FLYER_FORMATS: { id: FlyerFormat; label: string; size: string }[] = [
  { id: "story", label: "Historia / Estado", size: "1080×1920" },
  { id: "post", label: "Publicación / Chat", size: "1080×1350" },
];

const FORMATS = {
  story: {
    W: 1080,
    H: 1920,
    pad: 84,
    heroMax: 640,
    heroMin: 320,
    title: 104,
    tagline: 42,
    item: 36,
    maxItems: 5,
    price: 176,
    gap: 40,
    cta: 116,
  },
  post: {
    W: 1080,
    H: 1350,
    pad: 70,
    heroMax: 420,
    heroMin: 240,
    title: 82,
    tagline: 34,
    item: 31,
    maxItems: 3,
    price: 132,
    gap: 26,
    cta: 98,
  },
};

const FONT_TITLE = '"Fraunces", Georgia, serif';
const FONT_BODY = '"Inter", system-ui, sans-serif';
const FONT_PRICE = '"Anton", "Impact", sans-serif';

const ICONS = {
  pin: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
  check: "M20 6 9 17l-5-5",
  chat: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z",
  phone:
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
};

const HERO_SRC = {
  empanada: "/emojis/3d-empanada.png",
  pastelito: "/emojis/3d-pastelito.png",
  malta: "/emojis/3d-malta.png",
  cafe: "/emojis/3d-cafe.png",
} as const;
type HeroName = keyof typeof HERO_SRC;

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();
function loadImage(src: string) {
  let p = imageCache.get(src);
  if (!p) {
    p = new Promise((resolve) => {
      const img = new Image();
      let finished = false;
      const done = (res: HTMLImageElement | null) => {
        if (!finished) {
          finished = true;
          resolve(res);
        }
      };
      img.onload = () => done(img);
      img.onerror = () => done(null);
      setTimeout(() => done(null), 2000);
      img.src = src;
    });
    imageCache.set(src, p);
  }
  return p;
}

let fontsReady: Promise<unknown> | null = null;
function ensureFonts() {
  if (!fontsReady) {
    if (typeof document === "undefined" || !document?.fonts?.load) {
      fontsReady = Promise.resolve();
      return fontsReady;
    }
    const sample = "ÁÉÍÓÚáéíóúÑñ$0123456789%";
    fontsReady = Promise.all(
      [
        '800 80px "Fraunces"',
        'italic 500 40px "Fraunces"',
        '400 80px "Anton"',
        '500 30px "Inter"',
        '800 30px "Inter"',
      ].map((f) => (document.fonts ? document.fonts.load(f, sample).catch(() => null) : Promise.resolve(null))),
    );
  }
  return fontsReady;
}

/** Removes emojis, variation selectors and joiners. */
export function stripEmoji(s: string) {
  return s
    .replace(/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|\uFE0F|\u200D/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function pickHero(d: FlyerData): { main: HeroName; side?: HeroName | undefined; trio: boolean } {
  const txt = `${d.name} ${d.items.join(" ")} ${d.heroHint ?? ""}`.toLowerCase();
  const isDrinkOnly = /bebidas/.test(d.heroHint ?? "");
  if (isDrinkOnly) return { main: /caf[eé]/.test(txt) ? "cafe" : "malta", trio: false };
  const main: HeroName =
    /pastelito/.test(txt) && !/empanada/.test(d.name.toLowerCase()) ? "pastelito" : "empanada";
  let side: HeroName | undefined;
  if (/caf[eé]/.test(txt)) side = "cafe";
  else if (/malta|bebida|jugo|refresco|polar/.test(txt)) side = "malta";
  const counts = [...txt.matchAll(/(\d+)\s*(empanadas?|pastelitos?|sabores)/g)].map((m) =>
    Number(m[1]),
  );
  const trio = counts.some((n) => n >= 3) || /degustaci[oó]n|familiar|surtid/.test(txt);
  return { main, side, trio };
}

function setFont(ctx: CanvasRenderingContext2D, font: string, spacing = 0) {
  ctx.font = font;
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${spacing}px`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width <= maxW || !line) line = test;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function clampLines(ctx: CanvasRenderingContext2D, lines: string[], max: number, maxW: number) {
  if (lines.length <= max) return lines;
  const out = lines.slice(0, max);
  let last = out[max - 1] ?? "";
  while (last.length > 1 && ctx.measureText(`${last}…`).width > maxW) last = last.slice(0, -1);
  out[max - 1] = `${last.replace(/[\s,.;:(]+$/, "")}…`;
  return out;
}

function drawIcon(
  ctx: CanvasRenderingContext2D,
  path: string,
  x: number,
  y: number,
  size: number,
  color: string,
  width = 2.2,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D(path));
  ctx.restore();
}

/** Deterministic film grain so the texture doesn't change between preview and download. */
function grain(ctx: CanvasRenderingContext2D, W: number, H: number, alpha: number) {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < (W * H) / 160; i++) {
    ctx.fillStyle = rnd() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
    ctx.fillRect(rnd() * W, rnd() * H, 2, 2);
  }
}

function paintBackground(
  ctx: CanvasRenderingContext2D,
  theme: FlyerTheme,
  W: number,
  H: number,
  heroCx: number,
  heroCy: number,
  heroR: number,
) {
  if (theme === "noche_dorada") {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1b130b");
    g.addColorStop(0.55, "#0f0b07");
    g.addColorStop(1, "#070504");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const r = ctx.createRadialGradient(heroCx, heroCy, 0, heroCx, heroCy, heroR * 1.6);
    r.addColorStop(0, "rgba(217,165,91,.38)");
    r.addColorStop(0.5, "rgba(217,165,91,.10)");
    r.addColorStop(1, "rgba(217,165,91,0)");
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);
    grain(ctx, W, H, 0.035);
    return;
  }
  if (theme === "atardecer_criollo") {
    const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
    g.addColorStop(0, "#fb923c");
    g.addColorStop(0.45, "#ea580c");
    g.addColorStop(1, "#7c2d12");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(heroCx, heroCy);
    const rays = 28;
    for (let i = 0; i < rays; i++) {
      if (i % 2) continue;
      const a0 = (i / rays) * Math.PI * 2;
      const a1 = ((i + 1) / rays) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, Math.max(W, H), a0, a1);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,237,180,.07)";
      ctx.fill();
    }
    ctx.restore();
    const r = ctx.createRadialGradient(heroCx, heroCy, 0, heroCx, heroCy, heroR * 1.3);
    r.addColorStop(0, "rgba(254,240,138,.55)");
    r.addColorStop(1, "rgba(254,240,138,0)");
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);
    grain(ctx, W, H, 0.03);
    return;
  }
  if (theme === "mercado_fresco") {
    ctx.fillStyle = "#fbf5ea";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#1f5135";
    ctx.fillRect(0, 0, W, 18);
    ctx.beginPath();
    ctx.arc(heroCx, heroCy, heroR, 0, Math.PI * 2);
    ctx.fillStyle = "#e6efe2";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(heroCx, heroCy, heroR + 22, 0, Math.PI * 2);
    ctx.setLineDash([3, 14]);
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(31,81,53,.35)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.setLineDash([]);
    grain(ctx, W, H, 0.02);
    return;
  }
  if (theme === "halloween") {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#220938");
    g.addColorStop(0.5, "#140424");
    g.addColorStop(1, "#08010f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // Pumpkin aura
    const r = ctx.createRadialGradient(heroCx, heroCy, 0, heroCx, heroCy, heroR * 1.5);
    r.addColorStop(0, "rgba(249,115,22,.45)");
    r.addColorStop(0.6, "rgba(217,70,239,.15)");
    r.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);
    grain(ctx, W, H, 0.04);
    return;
  }
  if (theme === "navidad") {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#831843");
    g.addColorStop(0.6, "#500724");
    g.addColorStop(1, "#270311");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const r = ctx.createRadialGradient(heroCx, heroCy, 0, heroCx, heroCy, heroR * 1.5);
    r.addColorStop(0, "rgba(250,204,21,.35)");
    r.addColorStop(0.6, "rgba(21,128,61,.2)");
    r.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);
    grain(ctx, W, H, 0.035);
    return;
  }
  if (theme === "dia_del_padre") {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0c1b33");
    g.addColorStop(0.5, "#081120");
    g.addColorStop(1, "#03060a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const r = ctx.createRadialGradient(heroCx, heroCy, 0, heroCx, heroCy, heroR * 1.4);
    r.addColorStop(0, "rgba(56,189,248,.35)");
    r.addColorStop(0.6, "rgba(2,132,199,.1)");
    r.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);
    grain(ctx, W, H, 0.03);
    return;
  }
  if (theme === "dia_de_la_mujer") {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#701a75");
    g.addColorStop(0.55, "#4a044e");
    g.addColorStop(1, "#28022b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const r = ctx.createRadialGradient(heroCx, heroCy, 0, heroCx, heroCy, heroR * 1.4);
    r.addColorStop(0, "rgba(244,114,182,.38)");
    r.addColorStop(0.6, "rgba(251,207,232,.12)");
    r.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);
    grain(ctx, W, H, 0.03);
    return;
  }
  if (theme === "mega_promo") {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#dc2626");
    g.addColorStop(0.5, "#991b1b");
    g.addColorStop(1, "#450a0a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const r = ctx.createRadialGradient(heroCx, heroCy, 0, heroCx, heroCy, heroR * 1.35);
    r.addColorStop(0, "rgba(250,204,21,.55)");
    r.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);
    grain(ctx, W, H, 0.035);
    return;
  }
  // fin_de_semana
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0f766e");
  g.addColorStop(0.5, "#115e59");
  g.addColorStop(1, "#042f2e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const r = ctx.createRadialGradient(heroCx, heroCy, 0, heroCx, heroCy, heroR * 1.4);
  r.addColorStop(0, "rgba(251,191,36,.4)");
  r.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = r;
  ctx.fillRect(0, 0, W, H);
  grain(ctx, W, H, 0.03);
}

async function drawHero(
  ctx: CanvasRenderingContext2D,
  d: FlyerData,
  cx: number,
  cy: number,
  h: number,
) {
  // Check if user uploaded a custom real photo
  if (d.customImage) {
    const customImg = await loadImage(d.customImage);
    if (customImg) {
      const w = Math.round(h * 1.35);
      const x = cx - w / 2;
      const y = cy - h / 2;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 32;
      ctx.shadowOffsetY = 15;
      roundRect(ctx, x, y, w, h, 28);
      ctx.fillStyle = "#1e1e1e";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(customImg, x, y, w, h);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 4;
      roundRect(ctx, x, y, w, h, 28);
      ctx.stroke();
      ctx.restore();
      return;
    }
  }

  const hero = pickHero(d);
  if (d.heroIcon === "trio") hero.trio = true;
  else if (d.heroIcon && HERO_SRC[d.heroIcon as keyof typeof HERO_SRC]) hero.main = d.heroIcon as any;

  const [main, side] = await Promise.all([
    loadImage(HERO_SRC[hero.main]),
    hero.side ? loadImage(HERO_SRC[hero.side]) : null,
  ]);

  // Soft floor shadow
  const sh = ctx.createRadialGradient(cx, cy + h * 0.36, 0, cx, cy + h * 0.36, h * 0.55);
  sh.addColorStop(0, "rgba(0,0,0,.35)");
  sh.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.translate(cx, cy + h * 0.36);
  ctx.scale(1, 0.18);
  ctx.translate(-cx, -(cy + h * 0.36));
  ctx.fillStyle = sh;
  ctx.fillRect(cx - h, cy + h * 0.36 - h, h * 2, h * 2);
  ctx.restore();

  const put = (img: HTMLImageElement | null, x: number, y: number, size: number, rot = 0) => {
    if (!img) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.shadowColor = "rgba(0,0,0,.40)";
    ctx.shadowBlur = size * 0.08;
    ctx.shadowOffsetY = size * 0.05;
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
  };

  const offset = side ? -h * 0.14 : 0;
  if (hero.trio && hero.main === "empanada") {
    put(main, cx + offset - h * 0.42, cy - h * 0.1, h * 0.72, -0.42);
    put(main, cx + offset + h * 0.42, cy - h * 0.1, h * 0.72, 0.42);
    put(main, cx + offset, cy + h * 0.12, h * 0.88);
  } else {
    put(main, cx + offset, cy, h * 1.02);
  }
  if (side) put(side, cx + h * 0.52, cy + h * 0.06, h * 0.62, 0.06);
}

function drawSticker(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  pct: number,
  cx: number,
  cy: number,
  r: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.2);
  // Scalloped badge
  ctx.beginPath();
  const teeth = 22;
  for (let i = 0; i <= teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * 0.92 : r;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.shadowColor = "rgba(0,0,0,.30)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = p.stickerBg;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.76, 0, Math.PI * 2);
  ctx.setLineDash([4, 8]);
  ctx.strokeStyle = p.stickerInk;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.fillStyle = p.stickerInk;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  setFont(ctx, `400 ${Math.round(r * 0.6)}px ${FONT_PRICE}`);
  ctx.fillText(`-${pct}%`, 0, r * 0.16);
  setFont(ctx, `800 ${Math.round(r * 0.2)}px ${FONT_BODY}`, 4);
  ctx.fillText("AHORRAS", 0, r * 0.46);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export async function renderPromoFlyer(
  d: FlyerData,
  theme: FlyerTheme,
  format: FlyerFormat,
): Promise<HTMLCanvasElement> {
  await ensureFonts();
  const F = FORMATS[format];
  const p = PALETTES[theme] || PALETTES.noche_dorada;
  const { W, H, pad } = F;
  const inner = W - pad * 2;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.textBaseline = "alphabetic";

  const name = stripEmoji(d.name);
  const tagline = stripEmoji(d.tagline);
  const badge = stripEmoji(d.badge).toUpperCase();
  const business = stripEmoji(d.businessName);

  // Measure tagline
  setFont(ctx, `italic 500 ${F.tagline}px ${FONT_TITLE}`);
  const tagLines = clampLines(ctx, wrap(ctx, tagline, inner - 40), 2, inner - 40);
  const tagLH = F.tagline * 1.3;
  const tagH = tagLines.length ? 18 + tagLines.length * tagLH : 0;

  const itemTextW = inner - 64 - F.item * 1.6;
  const itemLH = F.item * 1.32;
  const itemGap = F.item * 0.55;
  const panelPad = F.item * 0.95;
  const measureItems = (list: string[]) => {
    setFont(ctx, `500 ${F.item}px ${FONT_BODY}`);
    const wrapped = list.map((it) =>
      clampLines(ctx, wrap(ctx, stripEmoji(it), itemTextW), 2, itemTextW),
    );
    const h =
      panelPad * 2 +
      wrapped.reduce((s, l) => s + l.length * itemLH, 0) +
      (wrapped.length - 1) * itemGap;
    return { wrapped, h };
  };

  const priceBlockH = F.tagline * 0.8 + 12 + F.price * 0.88 + 18 + F.tagline * 0.8 + 14;
  const topH = pad + 60 + F.gap * 0.9 + 62 + F.gap * 0.5;
  const bottomH = F.cta + 30 + 64 + pad * 0.55 + F.gap;
  const avail = H - topH - bottomH;

  const layoutFor = (size: number, list: string[]) => {
    setFont(ctx, `800 ${size}px ${FONT_TITLE}`);
    const lines = clampLines(ctx, wrap(ctx, name, inner), 3, inner);
    const itemsM = measureItems(list);
    const mid = lines.length * size * 1.04 + tagH + itemsM.h + priceBlockH + F.gap * 3;
    return { size, lines, itemsM, mid };
  };

  let items = d.items.slice(0, F.maxItems);
  let L = layoutFor(F.title, items);
  const fits = () => avail - L.mid >= F.heroMin;
  while (!fits() && L.size > F.title * 0.8) L = layoutFor(L.size - 4, items);
  while (!fits() && items.length > 3) L = layoutFor(L.size, (items = items.slice(0, -1)));
  while (!fits() && L.size > F.title * 0.62) L = layoutFor(L.size - 4, items);
  while (!fits() && items.length > 2) L = layoutFor(L.size, (items = items.slice(0, -1)));

  const { size: titleSize, lines: titleLines, itemsM } = L;
  const titleLH = titleSize * 1.04;
  const heroH = Math.max(F.heroMin * 0.6, Math.min(F.heroMax, avail - L.mid));
  const slack = Math.max(0, avail - L.mid - heroH);
  const heroTop = topH + slack * 0.4;
  const heroCy = heroTop + heroH / 2;

  // Background
  paintBackground(ctx, theme, W, H, W / 2, heroCy, heroH * 0.5);
  if (p.frame) {
    ctx.strokeStyle = p.frame;
    ctx.lineWidth = 2;
    roundRect(ctx, 34, 34, W - 68, H - 68, 30);
    ctx.stroke();
  }

  // Header: business + city
  let y = pad + 34;
  ctx.fillStyle = p.ink;
  ctx.textAlign = "left";
  setFont(ctx, `800 ${format === "story" ? 30 : 27}px ${FONT_BODY}`, 5);
  ctx.fillText(business.toUpperCase(), pad, y);
  setFont(ctx, `600 ${format === "story" ? 26 : 23}px ${FONT_BODY}`, 1);
  const city = stripEmoji(d.city);
  const cityW = ctx.measureText(city).width;
  ctx.textAlign = "right";
  ctx.fillStyle = p.muted;
  ctx.fillText(city, W - pad, y);
  drawIcon(ctx, ICONS.pin, W - pad - cityW - 34, y - 25, 28, p.muted, 2.4);
  y += 26;

  // Top pill badge
  y += F.gap * 0.9;
  setFont(ctx, `800 24px ${FONT_BODY}`, 4);
  const badgeTextW = ctx.measureText(badge).width;
  const badgeW = badgeTextW + 56;
  ctx.save();
  ctx.fillStyle = p.accent;
  roundRect(ctx, W / 2 - badgeW / 2, y, badgeW, 62, 31);
  ctx.fill();
  ctx.fillStyle = p.accentInk;
  ctx.textAlign = "center";
  ctx.fillText(badge, W / 2, y + 40);
  ctx.restore();

  // Draw hero (custom uploaded photo or 3D visual)
  await drawHero(ctx, d, W / 2, heroCy, heroH);

  // Discount sticker
  if (d.discountPct >= 5) {
    const stickerR = format === "story" ? 116 : 94;
    const stickerX = W - pad - stickerR * 0.9;
    const stickerY = heroTop + heroH * 0.22;
    drawSticker(ctx, p, d.discountPct, stickerX, stickerY, stickerR);
  }

  // Title
  y = heroTop + heroH + F.gap;
  ctx.fillStyle = p.ink;
  ctx.textAlign = "center";
  setFont(ctx, `800 ${titleSize}px ${FONT_TITLE}`);
  for (const line of titleLines) {
    y += titleLH;
    ctx.fillText(line, W / 2, y);
  }

  // Tagline
  if (tagLines.length) {
    y += 18;
    ctx.fillStyle = p.muted;
    setFont(ctx, `italic 500 ${F.tagline}px ${FONT_TITLE}`);
    for (const line of tagLines) {
      y += tagLH;
      ctx.fillText(line, W / 2, y);
    }
  }

  // Items panel
  y += F.gap * 0.9;
  ctx.save();
  ctx.fillStyle = p.panelFill;
  roundRect(ctx, pad, y, inner, itemsM.h, 28);
  ctx.fill();
  if (p.panelStroke !== "rgba(255,255,255,0)") {
    ctx.strokeStyle = p.panelStroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();

  let itemY = y + panelPad;
  setFont(ctx, `500 ${F.item}px ${FONT_BODY}`);
  ctx.textAlign = "left";
  for (const wrapped of itemsM.wrapped) {
    itemY += F.item;
    const iconSize = Math.round(F.item * 0.95);
    const iconX = pad + 32;
    const iconY = itemY - iconSize * 0.88;

    ctx.save();
    ctx.fillStyle = p.check;
    ctx.beginPath();
    ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize * 0.65, 0, Math.PI * 2);
    ctx.fill();
    drawIcon(ctx, ICONS.check, iconX + iconSize * 0.12, iconY + iconSize * 0.12, iconSize * 0.76, p.checkInk, 3.2);
    ctx.restore();

    ctx.fillStyle = p.panelInk;
    const textX = pad + 32 + iconSize + 18;
    for (let li = 0; li < wrapped.length; li++) {
      ctx.fillText(wrapped[li], textX, itemY + li * itemLH);
    }
    itemY += (wrapped.length - 1) * itemLH + itemGap;
  }
  y += itemsM.h;

  // Price block
  y += F.gap;
  ctx.textAlign = "center";
  if (d.regularPriceUsd > d.promoPriceUsd) {
    setFont(ctx, `600 ${Math.round(F.tagline * 0.75)}px ${FONT_BODY}`, 2);
    ctx.fillStyle = p.muted;
    const regText = `PRECIO REGULAR $${d.regularPriceUsd.toFixed(2)} USD`;
    ctx.fillText(regText, W / 2, y);
    const regW = ctx.measureText(regText).width;
    ctx.strokeStyle = p.muted;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2 - regW / 2 - 6, y - F.tagline * 0.24);
    ctx.lineTo(W / 2 + regW / 2 + 6, y - F.tagline * 0.24);
    ctx.stroke();
    y += 14;
  }

  y += F.price * 0.88;
  ctx.fillStyle = p.price;
  setFont(ctx, `400 ${F.price}px ${FONT_PRICE}`);
  ctx.fillText(`$${d.promoPriceUsd.toFixed(2)}`, W / 2, y);

  y += 20;
  setFont(ctx, `800 ${Math.round(F.tagline * 0.8)}px ${FONT_BODY}`, 2);
  ctx.fillStyle = p.ink;
  const bsText = `BS. ${fmtBs(d.promoPriceUsd * d.rate)} (TASA BCV)`;
  ctx.fillText(bsText, W / 2, y);

  // Bottom CTA Button
  const ctaY = H - pad - F.cta - 54;
  ctx.save();
  ctx.fillStyle = p.ctaBg;
  roundRect(ctx, pad, ctaY, inner, F.cta, F.cta / 2);
  ctx.fill();
  ctx.fillStyle = p.ctaInk;
  ctx.textAlign = "center";
  setFont(ctx, `800 ${Math.round(F.cta * 0.36)}px ${FONT_BODY}`, 4);
  const ctaText = `PIDE POR WHATSAPP AL ${d.phone}`;
  ctx.fillText(ctaText, W / 2, ctaY + F.cta * 0.62);
  ctx.restore();

  // Footer address & delivery notice
  ctx.textAlign = "center";
  ctx.fillStyle = p.muted;
  setFont(ctx, `500 ${format === "story" ? 22 : 20}px ${FONT_BODY}`, 1);
  const footerText = `${stripEmoji(d.address)} · Delivery en la zona`;
  ctx.fillText(footerText, W / 2, H - pad * 0.55);

  return canvas;
}

export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Canvas export failed"));
    }, "image/png");
  });
}
