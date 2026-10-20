import { describe, it, expect } from "vitest";
import {
  buildCustomerDeliveryRequestTemplate,
  buildRidersGroupDeliveryMessage,
  buildCashierNotificationMessage,
  buildDeliveredCustomerMessage,
} from "../lib/whatsapp";

describe("WhatsApp Delivery & Riders Automation", () => {
  it("generates the exact official delivery template for incoming customer messages", () => {
    const template = buildCustomerDeliveryRequestTemplate();
    expect(template).toContain("Hola, hablas con Dr. Empanadas Delivery, me confirmas");
    expect(template).toContain("Nombre:");
    expect(template).toContain("Dirección GPS:");
    expect(template).toContain("Pedido:");
    expect(template).toContain("Estamos atentos!!!");
  });

  it("formats delivery dispatch order correctly for riders group WhatsApp", () => {
    const msg = buildRidersGroupDeliveryMessage({
      orderNumber: 1042,
      clientName: "Alfonzo Bolaños",
      clientPhone: "+584121499838",
      addressGps: "6FF3+MJ4, Avenida Dr. Francisco Montoya, Turmero 2107",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=6FF3%2BMJ4",
      itemsText: "2x Mechada con Queso Amarillo, 1x Malta Polar",
      totalUsd: 5.5,
      totalBs: 258.5,
      paymentMethod: "Pago Móvil",
      paymentReference: "123456",
      riderName: "Ezequiel",
    });

    expect(msg).toContain("NUEVO DELIVERY - DR. EMPANADAS");
    expect(msg).toContain("Comanda #1042");
    expect(msg).toContain("Alfonzo Bolaños");
    expect(msg).toContain("+584121499838");
    expect(msg).toContain("6FF3+MJ4, Avenida Dr. Francisco Montoya, Turmero 2107");
    expect(msg).toContain("https://www.google.com/maps/search/?api=1&query=6FF3%2BMJ4");
    expect(msg).toContain("Ezequiel");
    expect(msg).toContain("¡MOTORIZADO EN CAMINO!");
  });

  it("builds the cashier notification message when the order leaves the kitchen", () => {
    const msg = buildCashierNotificationMessage({
      orderNumber: 1042,
      clientName: "Alfonzo Bolaños",
      riderName: "Ezequiel",
    });

    expect(msg).toContain("¡Va vía el delivery!");
    expect(msg).toContain("1042");
    expect(msg).toContain("Alfonzo Bolaños");
    expect(msg).toContain("Ezequiel");
  });

  it("builds delivery delivered confirmation message", () => {
    const msg = buildDeliveredCustomerMessage({
      orderNumber: 1042,
      clientName: "Alfonzo Bolaños",
      riderName: "Ezequiel",
    });

    expect(msg).toContain("¡PEDIDO ENTREGADO CON ÉXITO!");
    expect(msg).toContain("Alfonzo Bolaños");
    expect(msg).toContain("1042");
    expect(msg).toContain("Ezequiel");
  });
});
