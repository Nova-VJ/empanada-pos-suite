import { describe, expect, it } from "vitest";
import { matchesSearch, normalizeSearch } from "@/lib/search";

describe("Search Normalization & Accent Insensitivity", () => {
  it("normalizes text by stripping diacritics and converting to lowercase", () => {
    expect(normalizeSearch("Pabellón")).toBe("pabellon");
    expect(normalizeSearch("Cazón")).toBe("cazon");
    expect(normalizeSearch("CAFÉ")).toBe("cafe");
  });

  it("matches words with or without accents in both query and target", () => {
    expect(matchesSearch("Empanada Pabellón Criollo", "pabellon")).toBe(true);
    expect(matchesSearch("Empanada Pabellon Criollo", "pabellón")).toBe(true);
    expect(matchesSearch("Empanada Cazón Margariteño", "cazon")).toBe(true);
    expect(matchesSearch("Pastelito Queso Llanero", "QUESO")).toBe(true);
    expect(matchesSearch("Alimentos Polar Comercial C.A.", "polar")).toBe(true);
    expect(matchesSearch("Quesera Llanera Guárico", "guarico")).toBe(true);
  });

  it("handles empty strings and nullish values gracefully", () => {
    expect(matchesSearch(null, "pabellon")).toBe(false);
    expect(matchesSearch(undefined, "pabellon")).toBe(false);
    expect(matchesSearch("Empanada", "")).toBe(true);
  });
});
