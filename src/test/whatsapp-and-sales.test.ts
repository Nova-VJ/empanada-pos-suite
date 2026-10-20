import { describe, expect, it } from "vitest";
import { normalizeWhatsAppPhone, buildOrderWhatsAppAlert, buildCustomerTicketWhatsApp, buildCierreZWhatsApp } from "@/lib/whatsapp";
import type { Order, ShiftAudit } from "@/types/pos";

describe("WhatsApp Integration & Message Builder", () => {
  it("normalizes Venezuelan phone formats to international +58", () => {
    expect(normalizeWhatsAppPhone("0412-1234567")).toBe("584121234567");
    expect(normalizeWhatsAppPhone("0414 7654321")).toBe("584147654321");
    expect(normalizeWhatsAppPhone("04249998877")).toBe("584249998877");
    expect(normalizeWhatsAppPhone("+58 412 1112233")).toBe("584121112233");
    expect(normalizeWhatsAppPhone("4121234567")).toBe("584121234567");
  });

  it("builds a formatted customer ticket for WhatsApp with RIF and details", () => {
    const dummyOrder: Order = {
      id: 1,
      invoiceNo: "00123",
      controlNo: "00-000123",
      createdAt: Date.now(),
      cashier: "Cajero 1",
      type: "dine_in",
      rate: 50.0,
      baseBs: 100.0,
      ivaBs: 16.0,
      igtfBs: 0,
      totalBs: 116.0,
      totalUsd: 2.32,
      changeBs: 0,
      kdsStatus: "served",
      kdsUpdatedAt: Date.now(),
      lines: [
        {
          productId: "e1",
          name: "Empanada Mechada",
          short: "Mechada",
          kitchen: true,
          qty: 2,
          unitUsd: 1.16,
          note: "",
          modifiers: [],
        },
      ],
      payments: [{ type: "pago_movil", amountBs: 116.0, reference: "9821" }],
    };

    const text = buildCustomerTicketWhatsApp(dummyOrder, "Dr. Empanadas C.A.", "J-50123456-7");
    expect(text).toContain("COMPROBANTE DIGITAL DE COMPRA");
    expect(text).toContain("Dr. Empanadas C.A.");
    expect(text).toContain("J-50123456-7");
    expect(text).toContain("Empanada Mechada");
    expect(text).toContain("2.32");
  });

  it("builds an executive Cierre Z summary for management", () => {
    const audit: ShiftAudit = {
      id: "audit-1",
      kind: "Z",
      zNumber: 5,
      cashier: "Cajero Principal",
      register: "CAJA-01",
      openedAt: Date.now() - 3600000,
      closedAt: Date.now(),
      declared: { bs: 1000, usd: 50, pos: 2000, pagoMovil: 3000 },
      expected: { bs: 1000, usd: 50, pos: 2000, pagoMovil: 3000 },
      declaredTotalBs: 8500,
      expectedTotalBs: 8500,
      differenceBs: 0,
      tickets: 24,
      notes: "Cuadre sin novedades",
    };

    const text = buildCierreZWhatsApp(audit, 50.0, "Dr. Empanadas C.A.");
    expect(text).toContain("REPORTE DE CIERRE Z #5");
    expect(text).toContain("CUADRE EXACTO");
    expect(text).toContain("24");
    expect(text).toContain("Cuadre sin novedades");
  });
});
