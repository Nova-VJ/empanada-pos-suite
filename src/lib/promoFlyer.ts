/**
 * Promo flyer renderer (canvas). One layout engine shared by every theme and format,
 * so the on-screen preview and the downloaded PNG are pixel-identical.
 * No emojis are drawn: they render as empty boxes on many Windows/Android fonts.
 */
import { fmtBs } from "./money";

export type FlyerTheme = "noche_dorada" | "atardecer_criollo" | "mercado_fresco";
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
    label: "Noche Dorada",
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
    label: "Atardecer Criollo",
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
    label: "Mercado Fresco",
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
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
    imageCache.set(src, p);
  }
  return p;
}

let fontsReady: Promise<unknown> | null = null;
function ensureFonts() {
  if (!fontsReady) {
    const sample = "ÁÉÍÓÚáéíóúÑñ$0123456789%";
    fontsReady = Promise.all(
      [
        '800 80px "Fraunces"',
        'italic 500 40px "Fraunces"',
        '400 80px "Anton"',
        '500 30px "Inter"',
        '800 30px "Inter"',
      ].map((f) => document.fonts.load(f, sample).catch(() => null)),
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
    // Sunburst behind the food
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
  // mercado_fresco
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
}

async function drawHero(
  ctx: CanvasRenderingContext2D,
  d: FlyerData,
  cx: number,
  cy: number,
  h: number,
) {
  const hero = pickHero(d);
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
  const p = PALETTES[theme];
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

  // ---- Measure the flexible middle block (title, tagline, items, price) ----
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
  const topH = pad + 60 + F.gap * 0.9 + 62 + F.gap * 0.5; // header + badge
  const bottomH = F.cta + 30 + 64 + pad * 0.55 + F.gap; // CTA + footer
  const avail = H - topH - bottomH;

  const layoutFor = (size: number, list: string[]) => {
    setFont(ctx, `800 ${size}px ${FONT_TITLE}`);
    const lines = clampLines(ctx, wrap(ctx, name, inner), 3, inner);
    const itemsM = measureItems(list);
    const mid = lines.length * size * 1.04 + tagH + itemsM.h + priceBlockH + F.gap * 3;
    return { size, lines, itemsM, mid };
  };

  // Keep the hero big enough: shrink the title a bit, then trim items, then shrink more
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

  // ---- Background ----
  paintBackground(ctx, theme, W, H, W / 2, heroCy, heroH * 0.5);
  if (p.frame) {
    ctx.strokeStyle = p.frame;
    ctx.lineWidth = 2;
    roundRect(ctx, 34, 34, W - 68, H - 68, 30);
    ctx.stroke();
  }

  // ---- Header: business + city ----
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
  ctx.fillStyle = p.muted;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(pad, y, inner, 2);
  ctx.globalAlpha = 1;

  // ---- Badge pill ----
  y += F.gap * 0.9;
  setFont(ctx, `800 ${format === "story" ? 28 : 25}px ${FONT_BODY}`, 4);
  const badgeW = Math.min(inner, ctx.measureText(badge).width + 64);
  ctx.fillStyle = p.accent;
  roundRect(ctx, W / 2 - badgeW / 2, y, badgeW, 62, 31);
  ctx.fill();
  ctx.fillStyle = p.accentInk;
  ctx.textAlign = "center";
  ctx.fillText(badge, W / 2, y + 41, inner - 40);

  // ---- Hero ----
  await drawHero(ctx, d, W / 2, heroCy, heroH);
  if (d.discountPct > 0) {
    const r = format === "story" ? 112 : 88;
    drawSticker(ctx, p, Math.round(d.discountPct), W - pad - r * 0.75, heroTop + r * 0.9, r);
  }

  // ---- Title + tagline ----
  y = heroTop + heroH + F.gap;
  ctx.textAlign = "center";
  ctx.fillStyle = p.ink;
  setFont(ctx, `800 ${titleSize}px ${FONT_TITLE}`, -1);
  for (const line of titleLines) {
    y += titleLH * 0.86;
    ctx.fillText(line, W / 2, y);
    y += titleLH * 0.14;
  }
  if (tagLines.length) {
    y += 18;
    ctx.fillStyle = theme === "noche_dorada" ? p.price : p.muted;
    setFont(ctx, `italic 500 ${F.tagline}px ${FONT_TITLE}`);
    for (const line of tagLines) {
      y += tagLH * 0.82;
      ctx.fillText(line, W / 2, y);
      y += tagLH * 0.18;
    }
  }

  // ---- Items panel ----
  y += F.gap;
  ctx.fillStyle = p.panelFill;
  roundRect(ctx, pad, y, inner, itemsM.h, 28);
  ctx.fill();
  if (p.panelStroke) {
    ctx.strokeStyle = p.panelStroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  let iy = y + panelPad;
  ctx.textAlign = "left";
  setFont(ctx, `500 ${F.item}px ${FONT_BODY}`);
  const dot = F.item * 1.05;
  for (const lines of itemsM.wrapped) {
    const cx = pad + 32 + dot / 2;
    const cy = iy + itemLH / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, dot / 2, 0, Math.PI * 2);
    ctx.fillStyle = p.check;
    ctx.fill();
    drawIcon(ctx, ICONS.check, cx - dot * 0.3, cy - dot * 0.3, dot * 0.6, p.checkInk, 3.6);
    ctx.fillStyle = p.panelInk;
    lines.forEach((ln, i) =>
      ctx.fillText(ln, pad + 32 + dot + 22, iy + itemLH * 0.74 + i * itemLH),
    );
    iy += lines.length * itemLH + itemGap;
  }
  y += itemsM.h + F.gap;

  // ---- Price ----
  ctx.textAlign = "center";
  const before = `Antes $${d.regularPriceUsd.toFixed(2)}`;
  setFont(ctx, `600 ${Math.round(F.tagline * 0.85)}px ${FONT_BODY}`);
  ctx.fillStyle = p.muted;
  y += F.tagline * 0.8;
  ctx.fillText(before, W / 2, y);
  const bw = ctx.measureText(before).width;
  ctx.fillRect(W / 2 - bw / 2 - 6, y - F.tagline * 0.3, bw + 12, 3);
  y += 12 + F.price * 0.88;
  const priceTxt = `$${d.promoPriceUsd.toFixed(2)}`;
  setFont(ctx, `400 ${F.price}px ${FONT_PRICE}`, 1);
  const pw = ctx.measureText(priceTxt).width;
  setFont(ctx, `800 ${Math.round(F.price * 0.24)}px ${FONT_BODY}`, 3);
  const uw = ctx.measureText("USD").width;
  const startX = W / 2 - (pw + 16 + uw) / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = p.price;
  setFont(ctx, `400 ${F.price}px ${FONT_PRICE}`, 1);
  ctx.fillText(priceTxt, startX, y);
  setFont(ctx, `800 ${Math.round(F.price * 0.24)}px ${FONT_BODY}`, 3);
  ctx.fillText("USD", startX + pw + 16, y - F.price * 0.52);
  y += 18 + F.tagline * 0.8;
  ctx.textAlign = "center";
  ctx.fillStyle = p.ink;
  setFont(ctx, `700 ${Math.round(F.tagline * 0.82)}px ${FONT_BODY}`);
  ctx.fillText(`${fmtBs(d.promoPriceUsd * d.rate)}  ·  Tasa BCV ${d.rate.toFixed(2)}`, W / 2, y);

  // ---- CTA (anchored to the bottom) ----
  const ctaY = H - pad * 0.55 - 64 - 30 - F.cta;
  ctx.fillStyle = p.ctaBg;
  ctx.shadowColor = "rgba(0,0,0,.25)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  roundRect(ctx, pad, ctaY, inner, F.cta, F.cta / 2);
  ctx.fill();
  ctx.shadowColor = "transparent";
  const ctaFont = format === "story" ? 40 : 34;
  setFont(ctx, `800 ${ctaFont}px ${FONT_BODY}`, 1);
  const ctaText = `Pide por WhatsApp  ${stripEmoji(d.phone)}`;
  const ctw = ctx.measureText(ctaText).width;
  const iconS = ctaFont * 1.15;
  const cx0 = W / 2 - (ctw + iconS + 18) / 2;
  drawIcon(ctx, ICONS.chat, cx0, ctaY + F.cta / 2 - iconS / 2, iconS, p.ctaInk, 2.4);
  drawIcon(
    ctx,
    ICONS.phone,
    cx0 + iconS * 0.3,
    ctaY + F.cta / 2 - iconS * 0.2,
    iconS * 0.4,
    p.ctaInk,
    3,
  );
  ctx.fillStyle = p.ctaInk;
  ctx.textAlign = "left";
  ctx.fillText(ctaText, cx0 + iconS + 18, ctaY + F.cta / 2 + ctaFont * 0.36);

  // ---- Footer ----
  ctx.textAlign = "center";
  ctx.fillStyle = p.muted;
  setFont(ctx, `500 ${format === "story" ? 24 : 21}px ${FONT_BODY}`);
  const addr = stripEmoji(d.address) || stripEmoji(d.city);
  ctx.fillText(
    `${addr}  ·  Válido hoy o hasta agotar existencias`,
    W / 2,
    ctaY + F.cta + 52,
    inner,
  );
  setFont(ctx, `700 ${format === "story" ? 18 : 16}px ${FONT_BODY}`, 4);
  ctx.globalAlpha = 0.7;
  ctx.fillText("CREADO CON NOVASTOCK", W / 2, ctaY + F.cta + 88);
  ctx.globalAlpha = 1;

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("No se pudo crear la imagen"))),
      "image/png",
    ),
  );
}
