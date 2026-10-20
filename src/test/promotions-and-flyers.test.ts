import { describe, it, expect } from "vitest";
import {
  FLYER_THEMES,
  FLYER_FORMATS,
  renderPromoFlyer,
  stripEmoji,
  type FlyerData,
} from "@/lib/promoFlyer";

describe("Promotions & Flyer Upgrades", () => {
  it("includes all 9 weekly and festive themes", () => {
    const themeIds = FLYER_THEMES.map((t) => t.id);
    expect(themeIds).toContain("noche_dorada");
    expect(themeIds).toContain("atardecer_criollo");
    expect(themeIds).toContain("mercado_fresco");
    expect(themeIds).toContain("halloween");
    expect(themeIds).toContain("navidad");
    expect(themeIds).toContain("dia_del_padre");
    expect(themeIds).toContain("dia_de_la_mujer");
    expect(themeIds).toContain("mega_promo");
    expect(themeIds).toContain("fin_de_semana");
    expect(FLYER_THEMES.length).toBe(9);
  });

  it("exports both story and post flyer formats", () => {
    const formatIds = FLYER_FORMATS.map((f) => f.id);
    expect(formatIds).toContain("story");
    expect(formatIds).toContain("post");
  });

  it("strips emojis safely without corrupting accents or text", () => {
    const cleaned = stripEmoji("🥟 Combo Pabellón Maracayero 🔥");
    expect(cleaned.trim()).toBe("Combo Pabellón Maracayero");
  });

  it("renders a canvas without crashing with custom image and festive themes", async () => {
    const mockImage =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const flyerData: FlyerData = {
      businessName: "Dr. Empanadas",
      city: "San Jacinto, Maracay",
      address: "San Jacinto, Maracay",
      phone: "0412-1234567",
      name: "Combo San Jacinto 5 Empanadas",
      tagline: "¡La verdadera energía aragüeña!",
      badge: "MÁS VENDIDO 🔥",
      items: [
        "5 Empanadas crujientes recién fritas",
        "Salsa de Ajo casera de cortesía",
        "Salsa Verde aragüeña de cortesía",
      ],
      regularPriceUsd: 10.0,
      promoPriceUsd: 8.0,
      discountPct: 20,
      rate: 45.0,
      customImage: mockImage,
      heroIcon: "empanada",
    };

    const themesToTest = ["halloween", "navidad", "dia_del_padre", "dia_de_la_mujer"] as const;
    for (const theme of themesToTest) {
      const canvas = await renderPromoFlyer(flyerData, theme, "story");
      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(1080);
      expect(canvas.height).toBe(1920);
    }
  });
});
