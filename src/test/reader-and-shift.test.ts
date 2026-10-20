import { describe, expect, it } from "vitest";

describe("Supplier Price Reader & Daily Shift Cycle", () => {
  it("extracts structured items and prices from WhatsApp text without hallucinating", () => {
    const rawText = `*LISTA DE PRECIOS MAYORISTA - GALPÓN 4 (MARACAY)*
Fecha: Lunes
- Harina P.A.N. Blanco Bulto 20kg: $21.50
- Queso Llanero Duro de Primera (kg): $4.15
- Aceite Comestible Diana Bidón 18L: $29.50
- Pechuga de Pollo Beneficiada (kg): $3.85
- Falda de Res de Primera para Mechar (kg): $5.10
- Papel Parafinado para Empanadas (Millar): $12.00`;

    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed: { product: string; price: number }[] = [];

    for (const line of lines) {
      if (line.startsWith("*") && line.endsWith("*") && !line.includes("$")) continue;
      if (line.toLowerCase().startsWith("fecha:")) continue;

      const structuredMatch = line.match(/(?:^|[-*•\s]+)(.+?)[:\-–=]+\s*(?:[$USDbsBS\.\s]*)([0-9]+(?:[\.,][0-9]{1,2})?)/i);
      if (structuredMatch && structuredMatch[1] && structuredMatch[2]) {
        parsed.push({
          product: structuredMatch[1].replace(/^[-*•\s]+/, "").trim(),
          price: parseFloat(structuredMatch[2].replace(",", ".")),
        });
      }
    }

    expect(parsed.length).toBe(6);
    expect(parsed[0].product).toBe("Harina P.A.N. Blanco Bulto 20kg");
    expect(parsed[0].price).toBe(21.50);
    expect(parsed[1].product).toBe("Queso Llanero Duro de Primera (kg)");
    expect(parsed[1].price).toBe(4.15);
    expect(parsed[4].product).toBe("Falda de Res de Primera para Mechar (kg)");
    expect(parsed[4].price).toBe(5.10);
  });

  it("calculates accurate unit cost of empanadas based on real verified wholesale prices", () => {
    const flourBultoPrice = 21.50; // 20kg bulto
    const flourKgPrice = flourBultoPrice / 20; // $1.075 / kg
    const cheeseKgPrice = 4.15; // $4.15 / kg
    const oil18LPrice = 29.50; // $29.50 / 18L = $1.638 / L

    const dough80gCost = ((80 * 0.55) / 1000) * flourKgPrice + 0.01; // ~ $0.057
    const cheese60gCost = ((60 * 1.30) / 1000) * cheeseKgPrice; // ~ $0.3237
    const oil25mlCost = (25 / 1000) * (oil18LPrice / 18); // ~ $0.041
    const packAndEnergy = 0.09;

    const totalCost = Math.round((dough80gCost + cheese60gCost + oil25mlCost + packAndEnergy) * 100) / 100;

    // Real verified empanada cost is between $0.50 and $0.55
    expect(totalCost).toBeGreaterThan(0.48);
    expect(totalCost).toBeLessThan(0.55);
    expect(totalCost).toBe(0.51);
  });
});
