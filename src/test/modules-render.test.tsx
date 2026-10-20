import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PosProvider } from "@/context/PosContext";
import { SettingsModule } from "@/components/erp/SettingsModule";
import { SuppliersModule } from "@/components/erp/SuppliersModule";

describe("Modules render check", () => {
  it("renders SettingsModule without crashing", () => {
    expect(() => {
      render(
        <PosProvider>
          <SettingsModule />
        </PosProvider>
      );
    }).not.toThrow();
  });

  it("renders SuppliersModule without crashing", () => {
    expect(() => {
      render(
        <PosProvider>
          <SuppliersModule />
        </PosProvider>
      );
    }).not.toThrow();
  });
});
