import { describe, expect, it } from "vitest";
import {
  calculateSupplySavingsSimulation,
  MARKET_SUPPLIES,
} from "@/components/erp/SuppliersModule";

describe("Supplier Savings & Market Alternative Simulation", () => {
  it("has predefined Venezuelan market supplies with verified cheaper alternatives", () => {
    expect(MARKET_SUPPLIES.length).toBeGreaterThanOrEqual(6);

    const harina = MARKET_SUPPLIES.find((s) => s.id === "supply-1");
    expect(harina).toBeDefined();
    expect(harina?.currentPriceUsd).toBe(22.5);
    const cheaperHarina = harina?.alternatives.some((a) => !a.isCurrent && a.priceUsd < 22.5);
    expect(cheaperHarina).toBe(true);

    const queso = MARKET_SUPPLIES.find((s) => s.id === "supply-2");
    expect(queso).toBeDefined();
    expect(queso?.currentPriceUsd).toBe(4.8);
    const cheaperQueso = queso?.alternatives.some((a) => !a.isCurrent && a.priceUsd < 4.8);
    expect(cheaperQueso).toBe(true);

    const aceite = MARKET_SUPPLIES.find((s) => s.id === "supply-3");
    expect(aceite).toBeDefined();
    expect(aceite?.currentPriceUsd).toBe(32.0);
    const cheaperAceite = aceite?.alternatives.some((a) => !a.isCurrent && a.priceUsd < 32.0);
    expect(cheaperAceite).toBe(true);
  });

  it("accurately calculates savings on a simulated bulk order", () => {
    // 20 bultos de harina P.A.N. + 30 kg de queso llanero
    const items = [
      { supplyId: "supply-1", qty: 20 },
      { supplyId: "supply-2", qty: 30 },
    ];

    const result = calculateSupplySavingsSimulation(items);

    // Current:
    // Harina: 20 * $22.50 = $450.00
    // Queso: 30 * $4.80 = $144.00
    // Total current = $594.00
    expect(result.currentTotalUsd).toBe(594.0);

    // Recommended:
    // Harina best alt: Inversiones Hermanos Gómez @ $19.90 -> 20 * 19.90 = $398.00
    // Queso best alt: Agropecuaria El Sombrero @ $4.10 -> 30 * 4.10 = $123.00
    // Total optimized = $521.00
    expect(result.optimizedTotalUsd).toBe(521.0);

    // Savings:
    // $594.00 - $521.00 = $73.00 USD
    expect(result.savingsUsd).toBe(73.0);
    expect(result.savingsPct).toBeCloseTo(12.289, 1);
    expect(result.itemsBreakdown.length).toBe(2);
    expect(result.itemsBreakdown[0]?.itemSavingsUsd).toBe(52.0);
    expect(result.itemsBreakdown[1]?.itemSavingsUsd).toBe(21.0);
  });

  it("handles multi-item wholesale basket calculation", () => {
    // Batch basket: 20 harina + 30 queso + 5 aceite + 25 carne
    const items = [
      { supplyId: "supply-1", qty: 20 },
      { supplyId: "supply-2", qty: 30 },
      { supplyId: "supply-3", qty: 5 },
      { supplyId: "supply-4", qty: 25 },
    ];

    const result = calculateSupplySavingsSimulation(items);

    // Current total: 20*22.5 + 30*4.8 + 5*32.0 + 25*6.9 = 450 + 144 + 160 + 172.5 = 926.5
    expect(result.currentTotalUsd).toBe(926.5);

    // Savings should be strictly positive
    expect(result.savingsUsd).toBeGreaterThan(0);
    expect(result.optimizedTotalUsd).toBeLessThan(result.currentTotalUsd);
  });

  it("handles empty or zero quantity items gracefully", () => {
    const result = calculateSupplySavingsSimulation([
      { supplyId: "supply-1", qty: 0 },
      { supplyId: "supply-non-existent", qty: 10 },
    ]);

    expect(result.currentTotalUsd).toBe(0);
    expect(result.optimizedTotalUsd).toBe(0);
    expect(result.savingsUsd).toBe(0);
    expect(result.savingsPct).toBe(0);
  });
});
