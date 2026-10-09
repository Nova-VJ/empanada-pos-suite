import type { Category, Product } from "@/types/pos";

export const CATEGORIES: ("Todos" | Category)[] = [
  "Todos",
  "Empanadas Clásicas",
  "Empanadas Especiales",
  "Combos",
  "Bebidas",
  "Salsas & Extras",
];

export const mockProducts: Product[] = [
  { id: "p1", sku: "EMP-001", name: "Empanada Mechada", short: "Mechada", emoji: "🥟", category: "Empanadas Clásicas", priceUsd: 5, costUsd: 1.95, stockBar: 45, stockKitchen: 120, kitchen: true, modifiers: ["Tártara extra", "Masa crujiente"] },
  { id: "p2", sku: "EMP-002", name: "Empanada Pabellón Criollo", short: "Pabellón", emoji: "🫓", category: "Empanadas Especiales", priceUsd: 6, costUsd: 2.4, stockBar: 30, stockKitchen: 80, kitchen: true, modifiers: ["Tajada extra", "Masa crujiente"] },
  { id: "p3", sku: "EMP-003", name: "Empanada Queso Blanco Llanero", short: "Queso", emoji: "🧀", category: "Empanadas Clásicas", priceUsd: 4, costUsd: 1.4, stockBar: 60, stockKitchen: 150, kitchen: true, modifiers: ["Doble queso", "Masa crujiente"] },
  { id: "p4", sku: "EMP-004", name: "Empanada Cazón Margariteño", short: "Cazón", emoji: "🐟", category: "Empanadas Especiales", priceUsd: 5, costUsd: 2.1, stockBar: 25, stockKitchen: 60, kitchen: true, modifiers: ["Picante", "Tártara extra"] },
  { id: "p5", sku: "CMB-001", name: "Combo Mañanero 2 Empanadas + Café", short: "Combo", emoji: "☕", category: "Combos", priceUsd: 9, costUsd: 3.6, stockBar: 40, stockKitchen: 40, kitchen: true, modifiers: ["Café con leche", "Masa crujiente"] },
  { id: "p6", sku: "BEB-001", name: "Malta Polar 355ml", short: "Malta", emoji: "🍺", category: "Bebidas", priceUsd: 1.5, costUsd: 0.7, stockBar: 72, stockKitchen: 0, kitchen: false, modifiers: ["Bien fría"] },
  { id: "p7", sku: "BEB-002", name: "Café Guayoyo Criollo", short: "Guayoyo", emoji: "☕", category: "Bebidas", priceUsd: 1, costUsd: 0.25, stockBar: 200, stockKitchen: 0, kitchen: false, modifiers: ["Sin azúcar", "Cargado"] },
  { id: "p8", sku: "EXT-001", name: "Salsa Guasacaca Especial", short: "Guasacaca", emoji: "🥑", category: "Salsas & Extras", priceUsd: 0.68, costUsd: 0.2, stockBar: 90, stockKitchen: 50, kitchen: true, modifiers: ["Picante"] },
];
