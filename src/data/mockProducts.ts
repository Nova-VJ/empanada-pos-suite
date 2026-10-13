import type { Category, Product } from "@/types/pos";

export const CATEGORIES: ("Todos" | Category)[] = [
  "Todos",
  "Empanadas",
  "Pastelitos",
  "Horneados",
  "Bebidas",
  "Salsas & Extras",
  "Combos",
];

export const mockProducts: Product[] = [
  // --- 18 EMPANADAS REALES DR. EMPANADAS ---
  { id: "emp-01", sku: "01", name: "Empanada Carne Mechada", short: "Mechada", emoji: "🥟", category: "Empanadas", priceUsd: 1.75, costUsd: 0.70, stockBar: 40, stockKitchen: 120, kitchen: true, modifiers: ["Tártara extra", "Masa crujiente"] },
  { id: "emp-02", sku: "02", name: "Empanada Pollo Guisado", short: "Pollo", emoji: "🥟", category: "Empanadas", priceUsd: 1.60, costUsd: 0.65, stockBar: 45, stockKitchen: 110, kitchen: true, modifiers: ["Guasacaca extra", "Masa crujiente"] },
  { id: "emp-03", sku: "03", name: "Empanada Carne Molida", short: "Molida", emoji: "🥟", category: "Empanadas", priceUsd: 1.60, costUsd: 0.65, stockBar: 35, stockKitchen: 90, kitchen: true, modifiers: ["Picante", "Masa crujiente"] },
  { id: "emp-04", sku: "04", name: "Empanada Chorizo Ahumado", short: "Chorizo", emoji: "🥟", category: "Empanadas", priceUsd: 1.80, costUsd: 0.75, stockBar: 25, stockKitchen: 70, kitchen: true, modifiers: ["Picante", "Masa crujiente"] },
  { id: "emp-05", sku: "05", name: "Empanada Jamón y Queso", short: "J&Q", emoji: "🥟", category: "Empanadas", priceUsd: 1.60, costUsd: 0.60, stockBar: 30, stockKitchen: 80, kitchen: true, modifiers: ["Extra queso", "Masa crujiente"] },
  { id: "emp-06", sku: "06", name: "Empanada Queso Llanero", short: "Queso", emoji: "🧀", category: "Empanadas", priceUsd: 1.50, costUsd: 0.50, stockBar: 60, stockKitchen: 160, kitchen: true, modifiers: ["Doble queso", "Masa crujiente"] },
  { id: "emp-07", sku: "07", name: "Empanada Especial Dr. Empanadas", short: "Especial", emoji: "🥟", category: "Empanadas", priceUsd: 2.20, costUsd: 0.95, stockBar: 20, stockKitchen: 50, kitchen: true, modifiers: ["Tártara y Picante", "Masa crujiente"] },
  { id: "emp-08", sku: "08", name: "Empanada Pollo con Queso", short: "Pollo/Queso", emoji: "🥟", category: "Empanadas", priceUsd: 1.80, costUsd: 0.75, stockBar: 35, stockKitchen: 95, kitchen: true, modifiers: ["Guasacaca", "Masa crujiente"] },
  { id: "emp-09", sku: "09", name: "Empanada Cordon Bleu de Carne", short: "CB Carne", emoji: "🥟", category: "Empanadas", priceUsd: 2.20, costUsd: 0.95, stockBar: 20, stockKitchen: 45, kitchen: true, modifiers: ["Tártara extra", "Masa crujiente"] },
  { id: "emp-10", sku: "10", name: "Empanada Cordon Bleu de Pollo", short: "CB Pollo", emoji: "🥟", category: "Empanadas", priceUsd: 2.20, costUsd: 0.95, stockBar: 22, stockKitchen: 50, kitchen: true, modifiers: ["Tártara extra", "Masa crujiente"] },
  { id: "emp-11", sku: "11", name: "Empanada Criolla de Pollo", short: "Criolla Pollo", emoji: "🥟", category: "Empanadas", priceUsd: 1.75, costUsd: 0.70, stockBar: 30, stockKitchen: 75, kitchen: true, modifiers: ["Guasacaca", "Masa crujiente"] },
  { id: "emp-12", sku: "12", name: "Empanada Criolla de Carne", short: "Criolla Carne", emoji: "🥟", category: "Empanadas", priceUsd: 1.80, costUsd: 0.75, stockBar: 28, stockKitchen: 70, kitchen: true, modifiers: ["Picante", "Masa crujiente"] },
  { id: "emp-13", sku: "13", name: "Empanada Pabellón Criollo", short: "Pabellón", emoji: "🫓", category: "Empanadas", priceUsd: 2.00, costUsd: 0.85, stockBar: 40, stockKitchen: 100, kitchen: true, modifiers: ["Tajada extra", "Masa crujiente"] },
  { id: "emp-14", sku: "020007", name: "Empanada Pollo con Amarillo", short: "Pollo/Amarillo", emoji: "🥟", category: "Empanadas", priceUsd: 1.75, costUsd: 0.70, stockBar: 25, stockKitchen: 60, kitchen: true, modifiers: ["Guasacaca", "Masa crujiente"] },
  { id: "emp-15", sku: "020001", name: "Empanada Pernil Horneado", short: "Pernil", emoji: "🥟", category: "Empanadas", priceUsd: 2.00, costUsd: 0.85, stockBar: 30, stockKitchen: 75, kitchen: true, modifiers: ["Con limón", "Masa crujiente"] },
  { id: "emp-16", sku: "1236001", name: "Empanada Dominó", short: "Dominó", emoji: "🥟", category: "Empanadas", priceUsd: 1.60, costUsd: 0.60, stockBar: 32, stockKitchen: 80, kitchen: true, modifiers: ["Queso extra", "Masa crujiente"] },
  { id: "emp-17", sku: "14", name: "Empanada Tajada con Queso", short: "Tajada/Queso", emoji: "🥟", category: "Empanadas", priceUsd: 1.60, costUsd: 0.60, stockBar: 28, stockKitchen: 65, kitchen: true, modifiers: ["Nata extra", "Masa crujiente"] },
  { id: "emp-18", sku: "15", name: "Empanada Cazón Margariteño", short: "Cazón", emoji: "🐟", category: "Empanadas", priceUsd: 2.00, costUsd: 0.85, stockBar: 30, stockKitchen: 70, kitchen: true, modifiers: ["Picante", "Tártara extra"] },

  // --- PASTELITOS ANDINOS ---
  { id: "pas-01", sku: "PAS-01", name: "Pastelito Carne Molida", short: "Pas. Molida", emoji: "🥟", category: "Pastelitos", priceUsd: 1.50, costUsd: 0.55, stockBar: 30, stockKitchen: 60, kitchen: true, modifiers: ["Picante"] },
  { id: "pas-02", sku: "PAS-02", name: "Pastelito Queso Llanero", short: "Pas. Queso", emoji: "🧀", category: "Pastelitos", priceUsd: 1.40, costUsd: 0.45, stockBar: 40, stockKitchen: 80, kitchen: true, modifiers: ["Tártara extra"] },
  { id: "pas-03", sku: "PAS-03", name: "Pastelito Pollo Guisado", short: "Pas. Pollo", emoji: "🥟", category: "Pastelitos", priceUsd: 1.50, costUsd: 0.55, stockBar: 25, stockKitchen: 50, kitchen: true, modifiers: ["Guasacaca"] },
  { id: "pas-04", sku: "PAS-04", name: "Pastelito Carne Mechada", short: "Pas. Mechada", emoji: "🥟", category: "Pastelitos", priceUsd: 1.60, costUsd: 0.60, stockBar: 25, stockKitchen: 50, kitchen: true, modifiers: ["Tártara extra"] },
  { id: "pas-05", sku: "PAS-05", name: "Pastelito Pizza (Jamón y Queso)", short: "Pas. Pizza", emoji: "🍕", category: "Pastelitos", priceUsd: 1.60, costUsd: 0.60, stockBar: 20, stockKitchen: 40, kitchen: true, modifiers: ["Orégano extra"] },

  // --- HORNEADOS ARTESANALES ---
  { id: "hor-01", sku: "HOR-01", name: "Cachito de Jamón Artesanal", short: "Cachito", emoji: "🥐", category: "Horneados", priceUsd: 2.20, costUsd: 0.80, stockBar: 35, stockKitchen: 35, kitchen: false, modifiers: ["Caliente"] },
  { id: "hor-02", sku: "HOR-02", name: "Cachito Jamón y Queso Crema", short: "Cachito Q.C.", emoji: "🥐", category: "Horneados", priceUsd: 2.50, costUsd: 0.95, stockBar: 25, stockKitchen: 25, kitchen: false, modifiers: ["Caliente"] },
  { id: "hor-03", sku: "HOR-03", name: "Empanada Gallega Horneada", short: "Gallega", emoji: "🥧", category: "Horneados", priceUsd: 2.20, costUsd: 0.85, stockBar: 20, stockKitchen: 20, kitchen: false, modifiers: ["Caliente"] },

  // --- BEBIDAS Y CAFETERÍA ---
  { id: "beb-01", sku: "BEB-01", name: "Malta Polar 355ml", short: "Malta", emoji: "🍺", category: "Bebidas", priceUsd: 1.50, costUsd: 0.70, stockBar: 80, stockKitchen: 0, kitchen: false, modifiers: ["Bien fría"] },
  { id: "beb-02", sku: "BEB-02", name: "Refresco Lata 355ml", short: "Refresco", emoji: "🥤", category: "Bebidas", priceUsd: 1.50, costUsd: 0.70, stockBar: 70, stockKitchen: 0, kitchen: false, modifiers: ["Con hielo", "Sin hielo"] },
  { id: "beb-03", sku: "BEB-03", name: "Café Guayoyo Criollo", short: "Guayoyo", emoji: "☕", category: "Bebidas", priceUsd: 0.80, costUsd: 0.20, stockBar: 150, stockKitchen: 0, kitchen: false, modifiers: ["Sin azúcar", "Poco dulce"] },
  { id: "beb-04", sku: "BEB-04", name: "Café con Leche Grande", short: "Café c/ Leche", emoji: "☕", category: "Bebidas", priceUsd: 1.50, costUsd: 0.45, stockBar: 100, stockKitchen: 0, kitchen: false, modifiers: ["Marrón claro", "Marrón oscuro"] },
  { id: "beb-05", sku: "BEB-05", name: "Jugo Natural de Naranja", short: "Jugo Naranja", emoji: "🍊", category: "Bebidas", priceUsd: 1.80, costUsd: 0.60, stockBar: 40, stockKitchen: 0, kitchen: false, modifiers: ["Sin azúcar"] },
  { id: "beb-06", sku: "BEB-06", name: "Jugo Natural de Parchita", short: "Jugo Parchita", emoji: "🥤", category: "Bebidas", priceUsd: 1.80, costUsd: 0.60, stockBar: 40, stockKitchen: 0, kitchen: false, modifiers: ["Bien frío"] },
  { id: "beb-07", sku: "BEB-07", name: "Agua Mineral 500ml", short: "Agua", emoji: "💧", category: "Bebidas", priceUsd: 1.00, costUsd: 0.35, stockBar: 120, stockKitchen: 0, kitchen: false, modifiers: ["Fría", "Natural"] },

  // --- SALSAS Y EXTRAS ---
  { id: "ext-01", sku: "EXT-01", name: "Salsa Guasacaca Especial", short: "Guasacaca", emoji: "🥑", category: "Salsas & Extras", priceUsd: 0.60, costUsd: 0.18, stockBar: 100, stockKitchen: 80, kitchen: true, modifiers: ["Picante"] },
  { id: "ext-02", sku: "EXT-02", name: "Salsa Tártara Criolla", short: "Tártara", emoji: "🥫", category: "Salsas & Extras", priceUsd: 0.60, costUsd: 0.18, stockBar: 100, stockKitchen: 80, kitchen: true, modifiers: ["Extra ajo"] },
  { id: "ext-03", sku: "EXT-03", name: "Picante Casero Especial", short: "Picante", emoji: "🌶️", category: "Salsas & Extras", priceUsd: 0.50, costUsd: 0.12, stockBar: 80, stockKitchen: 60, kitchen: true, modifiers: [] },
  { id: "ext-04", sku: "EXT-04", name: "Ración de Nata Criolla", short: "Nata", emoji: "🥛", category: "Salsas & Extras", priceUsd: 1.00, costUsd: 0.35, stockBar: 50, stockKitchen: 30, kitchen: true, modifiers: [] },
  { id: "ext-05", sku: "EXT-05", name: "Porción de Queso Rallado Extra", short: "Queso Extra", emoji: "🧀", category: "Salsas & Extras", priceUsd: 0.80, costUsd: 0.25, stockBar: 60, stockKitchen: 40, kitchen: true, modifiers: [] },

  // --- COMBOS DESAYUNO ---
  { id: "cmb-01", sku: "CMB-01", name: "Combo Tradicional: 2 Empanadas + Bebida", short: "Combo Trad.", emoji: "⚡", category: "Combos", priceUsd: 3.80, costUsd: 1.50, stockBar: 50, stockKitchen: 50, kitchen: true, modifiers: ["Con Malta", "Con Café"] },
  { id: "cmb-02", sku: "CMB-02", name: "Combo Dúo Especial: 2 Especiales + Jugo", short: "Combo Especial", emoji: "🥟", category: "Combos", priceUsd: 4.80, costUsd: 1.90, stockBar: 30, stockKitchen: 30, kitchen: true, modifiers: ["Pabellón + Cazón", "Masa crujiente"] },
];
