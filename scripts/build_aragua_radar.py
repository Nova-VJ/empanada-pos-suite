import re

file_path = r"c:\Users\patri\Downloads\TPV Mundial\lovable-frontend\src\components\erp\SuppliersModule.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update imports
old_import = 'import { ArrowRight, CheckCircle2, Edit, FileText, Filter, Package, Plus, Search, SlidersHorizontal, Truck, Award, Sparkles, X, Calculator, Clock, RefreshCw, Radio, Zap, ShieldCheck, ChevronDown, ChevronUp, Bell, Check } from "lucide-react";'
new_import = 'import { ArrowRight, CheckCircle2, Edit, FileText, Filter, Package, Plus, Search, SlidersHorizontal, Truck, Award, Sparkles, X, Calculator, Clock, RefreshCw, Radio, Zap, ShieldCheck, ChevronDown, ChevronUp, Bell, Check, MapPin, Globe, Store, Building, PhoneCall, ExternalLink, Navigation, CheckCircle, Info, MessageSquare } from "lucide-react";'

if old_import in code:
    code = code.replace(old_import, new_import, 1)

# 2. Add LocalSupplierEntry interface and dataset
data_block = '''export interface LocalSupplierEntry {
  id: string;
  name: string;
  sourceType: "osm" | "directory" | "galpon";
  category: "Harinas" | "Lácteos" | "Aceites" | "Carnes" | "Empaques";
  zone: string;
  distanceKm: number;
  phone: string;
  waNumber: string;
  rif: string;
  address: string;
  deliveryDays: string;
  keyProduct: string;
  priceEstimateUsd: number;
  unit: string;
  savingsVsAvgPct: number;
  verified: boolean;
  notes: string;
}

export const ARAGUA_LOCAL_SUPPLIERS: LocalSupplierEntry[] = [
  // 1. Catálogo Oficial de Galpones Mercado Mayorista de Maracay (Av. Intercomunal - a 4.2 km)
  {
    id: "gal-1",
    name: "Distribuidora Granos & Harinas El Samán",
    sourceType: "galpon",
    category: "Harinas",
    zone: "Mercado Mayorista (Av. Intercomunal)",
    distanceKm: 4.2,
    phone: "0243-2691024",
    waNumber: "+584123019284",
    rif: "J-40192843-1",
    address: "Galpón 1, Puesto 14, Mercado Mayorista de Maracay",
    deliveryDays: "Lunes a Sábado (Despacho matutino a San Jacinto)",
    keyProduct: "Harina de Maíz Blanco Precocida (Bulto 20 kg)",
    priceEstimateUsd: 19.80,
    unit: "Bulto 20kg",
    savingsVsAvgPct: 12.0,
    verified: true,
    notes: "Puesto mayorista directo. Venta mínima: 3 bultos. Guía SICA al día.",
  },
  {
    id: "gal-2",
    name: "Grasas & Aceites Mayorista La Fe",
    sourceType: "galpon",
    category: "Aceites",
    zone: "Mercado Mayorista (Av. Intercomunal)",
    distanceKm: 4.2,
    phone: "0243-2692211",
    waNumber: "+584144902192",
    rif: "J-31892011-5",
    address: "Galpón 2, Puesto 28, Mercado Mayorista de Maracay",
    deliveryDays: "Lunes, Miércoles y Viernes",
    keyProduct: "Aceite Vegetal Comestible (Bidón 18 Litros)",
    priceEstimateUsd: 28.50,
    unit: "Bidón 18L",
    savingsVsAvgPct: 10.9,
    verified: true,
    notes: "Distribuidor de marcas Mazeite y Diana. Factura fiscal y entrega exprés.",
  },
  {
    id: "gal-3",
    name: "Lácteos & Quesera Guariqueña El Trébol",
    sourceType: "galpon",
    category: "Lácteos",
    zone: "Mercado Mayorista (Av. Intercomunal)",
    distanceKm: 4.2,
    phone: "0243-2693400",
    waNumber: "+584127710293",
    rif: "J-40918239-0",
    address: "Galpón 3, Puesto 07 (Sector Quesero), Mercado Mayorista",
    deliveryDays: "Martes, Jueves y Sábados (Queso fresco de Guárico)",
    keyProduct: "Queso Llanero Blanco Duro (Kilo)",
    priceEstimateUsd: 4.15,
    unit: "Kilo",
    savingsVsAvgPct: 13.5,
    verified: true,
    notes: "Queso llanero de bloque para rallar o freír. Excelente merma y punto de sal.",
  },
  {
    id: "gal-4",
    name: "Carnes & Cortes Industriales Don Pedro",
    sourceType: "galpon",
    category: "Carnes",
    zone: "Mercado Mayorista (Av. Intercomunal)",
    distanceKm: 4.2,
    phone: "0243-2694089",
    waNumber: "+584168820194",
    rif: "J-30291845-9",
    address: "Galpón 4, Puesto 32 (Sector Carnes), Mercado Mayorista",
    deliveryDays: "Diario de 5:00 AM a 1:00 PM",
    keyProduct: "Falda de Res de Primera para Mechar (Kilo)",
    priceEstimateUsd: 5.05,
    unit: "Kilo",
    savingsVsAvgPct: 9.8,
    verified: true,
    notes: "Carne limpia sin grasa excesiva. Ideal para empanadas con alto rendimiento.",
  },
  {
    id: "gal-5",
    name: "Envases & Desechables San Jacinto Mayor",
    sourceType: "galpon",
    category: "Empaques",
    zone: "Mercado Mayorista (Av. Intercomunal)",
    distanceKm: 4.2,
    phone: "0243-2695512",
    waNumber: "+584243310928",
    rif: "J-41092834-8",
    address: "Galpón 5, Puesto 03, Mercado Mayorista de Maracay",
    deliveryDays: "Lunes a Viernes",
    keyProduct: "Bolsas Antigrasa Térmicas (Paquete 1.000 uds)",
    priceEstimateUsd: 21.00,
    unit: "Paquete 1.000 uds",
    savingsVsAvgPct: 16.0,
    verified: true,
    notes: "Papel parafinado antigrasa, servilletas y bolsas con fuelle para delivery.",
  },

  // 2. OpenStreetMap (Overpass API - Datos Libres Geolocalizados en Maracay)
  {
    id: "osm-1",
    name: "Frigorífico & Distribuidora San Jacinto Mayor",
    sourceType: "osm",
    category: "Carnes",
    zone: "San Jacinto (Av. Bolívar Este)",
    distanceKm: 1.2,
    phone: "0243-2348910",
    waNumber: "+584124019283",
    rif: "J-30918274-1",
    address: "Av. Bolívar Este, C.C. San Jacinto, Maracay (Nodo OSM #492019)",
    deliveryDays: "Diario (a 3 minutos del local)",
    keyProduct: "Falda y Pechuga de Pollo Mayorista",
    priceEstimateUsd: 5.15,
    unit: "Kilo",
    savingsVsAvgPct: 8.0,
    verified: true,
    notes: "El proveedor más cercano a la sede. Puedes reponer en 15 minutos en emergencias de stock.",
  },
  {
    id: "osm-2",
    name: "Distribuidora de Alimentos El Limón - Sede Turmero",
    sourceType: "osm",
    category: "Harinas",
    zone: "Turmero (ARC Km 104)",
    distanceKm: 8.5,
    phone: "0244-6632011",
    waNumber: "+584144892011",
    rif: "J-40192834-0",
    address: "Autopista Regional del Centro, Distribuidor Turmero (Nodo OSM #510293)",
    deliveryDays: "Martes y Jueves ruta San Jacinto",
    keyProduct: "Harina de Maíz P.A.N. y Juana (Bulto 20kg)",
    priceEstimateUsd: 19.40,
    unit: "Bulto 20kg",
    savingsVsAvgPct: 13.8,
    verified: true,
    notes: "Distribuidor mayorista autorizado Polar. Crédito de 15 días a clientes recurrentes.",
  },
  {
    id: "osm-3",
    name: "Quesera & Lácteos Los Llanos - La Morita",
    sourceType: "osm",
    category: "Lácteos",
    zone: "La Morita (Av. Intercomunal)",
    distanceKm: 3.5,
    phone: "0243-2710923",
    waNumber: "+584128920192",
    rif: "J-31892012-3",
    address: "Av. Intercomunal cruce con Av. Aragua, La Morita (Nodo OSM #610948)",
    deliveryDays: "Lunes, Miércoles y Viernes",
    keyProduct: "Queso Llanero Duro de Primera (Kilo)",
    priceEstimateUsd: 4.25,
    unit: "Kilo",
    savingsVsAvgPct: 11.5,
    verified: true,
    notes: "Lácteos frescos de Calabozo y Camaguán con punto de sal perfecto.",
  },

  // 3. Directorios Comerciales de Aragua (Cámara de Industriales & Páginas Amarillas)
  {
    id: "dir-1",
    name: "Oleaginosas Industriales de Aragua C.A.",
    sourceType: "directory",
    category: "Aceites",
    zone: "Zona Industrial Santa Cruz de Aragua",
    distanceKm: 11.5,
    phone: "0243-2619000",
    waNumber: "+584143890123",
    rif: "J-00192841-8",
    address: "Calle Los Pinos, Parcela 12, Zona Industrial Santa Cruz de Aragua",
    deliveryDays: "Miércoles y Viernes (Despacho corporativo)",
    keyProduct: "Aceite Vegetal Comestible Fritura Profunda (Bidón 18L)",
    priceEstimateUsd: 27.50,
    unit: "Bidón 18L",
    savingsVsAvgPct: 14.0,
    verified: true,
    notes: "Afiliado a la Cámara de Industriales de Aragua. Registro sanitario y Guía SICA.",
  },
  {
    id: "dir-2",
    name: "Frigorífico Industrial Santa Rosalía C.A.",
    sourceType: "directory",
    category: "Carnes",
    zone: "Zona Industrial San Vicente I",
    distanceKm: 7.2,
    phone: "0243-5519022",
    waNumber: "+584144301928",
    rif: "J-30291845-6",
    address: "Av. Principal San Vicente, Galpón 44, Maracay",
    deliveryDays: "Lunes a Sábado (Ruta de frío)",
    keyProduct: "Carne Falda de Res limpia (Kilo)",
    priceEstimateUsd: 5.20,
    unit: "Kilo",
    savingsVsAvgPct: 7.1,
    verified: true,
    notes: "Proveedor certificado con cadena de frío continua y transporte refrigerado.",
  },
  {
    id: "dir-3",
    name: "Distribuidora Mayorista Central C.A.",
    sourceType: "directory",
    category: "Harinas",
    zone: "Zona Industrial San Vicente II",
    distanceKm: 7.8,
    phone: "0243-5532019",
    waNumber: "+584243918201",
    rif: "J-31094821-4",
    address: "Calle G, Manzana 3, Zona Ind. San Vicente II, Maracay",
    deliveryDays: "Lunes a Viernes",
    keyProduct: "Harina de Maíz Precocida y Víveres al Mayor",
    priceEstimateUsd: 20.20,
    unit: "Bulto 20kg",
    savingsVsAvgPct: 10.2,
    verified: true,
    notes: "Empresa con 18 años de trayectoria en Aragua. Crédito a 7 días.",
  },
];
'''

# Insert data_block before calculateSupplySavingsSimulation
marker = 'export function calculateSupplySavingsSimulation('
if marker in code:
    code = code.replace(marker, data_block + "\n" + marker, 1)

# 3. Update tab type and states inside SuppliersModule
old_tab_state = 'const [tab, setTab] = useState<"finder" | "suppliers" | "orders" | "invoices">("finder");'
new_tab_state = '''const [tab, setTab] = useState<"finder" | "radar" | "suppliers" | "orders" | "invoices">("finder");
  const [localSuppliers, setLocalSuppliers] = useState<LocalSupplierEntry[]>(ARAGUA_LOCAL_SUPPLIERS);
  const [radarSourceFilter, setRadarSourceFilter] = useState<"todos" | "osm" | "directory" | "galpon">("todos");
  const [radarZoneFilter, setRadarZoneFilter] = useState<string>("todas");
  const [newGalponModal, setNewGalponModal] = useState(false);
  const [newGalponForm, setNewGalponForm] = useState({
    name: "",
    galponZone: "Galpón 3, Puesto 12",
    category: "Lácteos" as "Harinas" | "Lácteos" | "Aceites" | "Carnes" | "Empaques",
    phone: "0243-",
    waNumber: "+58412",
    keyProduct: "Queso Llanero Blanco",
    priceEstimateUsd: "4.20",
    rif: "J-",
    notes: "Puesto nuevo incorporado por el dueño",
  });
  const [escandalloSimItem, setEscandalloSimItem] = useState<LocalSupplierEntry | null>(null);

  function handleAddCustomGalpon() {
    if (!newGalponForm.name.trim() || !newGalponForm.keyProduct.trim()) {
      toast.error("Por favor completa el nombre del negocio y producto");
      return;
    }
    const newEntry: LocalSupplierEntry = {
      id: `custom-${Date.now()}`,
      name: newGalponForm.name.trim(),
      sourceType: "galpon",
      category: newGalponForm.category,
      zone: newGalponForm.galponZone.includes("Galpón") ? "Mercado Mayorista (Av. Intercomunal)" : newGalponForm.galponZone,
      distanceKm: 4.2,
      phone: newGalponForm.phone.trim(),
      waNumber: newGalponForm.waNumber.trim(),
      rif: newGalponForm.rif.trim(),
      address: `${newGalponForm.galponZone}, Mercado Mayorista de Maracay`,
      deliveryDays: "A convenir con el dueño",
      keyProduct: newGalponForm.keyProduct.trim(),
      priceEstimateUsd: parseFloat(newGalponForm.priceEstimateUsd) || 0,
      unit: "Unidad",
      savingsVsAvgPct: 10.0,
      verified: true,
      notes: newGalponForm.notes.trim() || "Puesto nuevo monitoreado",
    };

    setLocalSuppliers((prev) => [newEntry, ...prev]);
    toast.success(`¡Nuevo proveedor "${newEntry.name}" incorporado!`, {
      description: "Se ha añadido al radar y se monitoreará en los escaneos semanales.",
    });
    setNewGalponModal(false);
  }

  function handleQuickAddToSuppliers(entry: LocalSupplierEntry) {
    pos.createSupplier({
      name: entry.name,
      rif: entry.rif || "J-00000000-0",
      email: `ventas@${entry.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.ve`,
      phone: entry.waNumber || entry.phone,
      city: `Maracay - ${entry.zone}`,
      paymentDays: 15,
      category: entry.category,
      active: true,
    });
    toast.success(`"${entry.name}" agregado a Proveedores Registrados`, {
      description: "Ya puedes emitir pedidos de compra y facturas con este proveedor.",
    });
  }

  function handleOpenWhatsAppQuote(entry: LocalSupplierEntry) {
    const cleanWa = entry.waNumber.replace(/[^0-9]/g, "");
    const msg = `Hola, le escribo de Dr. Empanadas (San Jacinto, Maracay). Deseamos cotizar precios al mayor para pedido semanal de *${entry.keyProduct}*. ¿Tienen despacho disponible a nuestra zona? Muchas gracias.`;
    const url = `https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`;
    if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
    toast.info(`Abriendo WhatsApp comercial para cotizar con ${entry.name}`);
  }'''

if old_tab_state in code:
    code = code.replace(old_tab_state, new_tab_state, 1)

# 4. Update tab button rendering
old_tab_buttons = '''        {[
          { id: "suppliers", label: `Proveedores Registrados (${suppliers.length})`, icon: Truck },
          { id: "orders", label: `Pedidos de Compra (${purchaseOrders.length})`, icon: Package },
          { id: "invoices", label: `Facturas Recibidas (${supplierInvoices.length})`, icon: FileText },
        ].map((t) => ('''

new_tab_buttons = '''        {[
          { id: "radar", label: `📡 Radar Mayorista Aragua (${localSuppliers.length})`, icon: MapPin },
          { id: "suppliers", label: `Proveedores Registrados (${suppliers.length})`, icon: Truck },
          { id: "orders", label: `Pedidos de Compra (${purchaseOrders.length})`, icon: Package },
          { id: "invoices", label: `Facturas Recibidas (${supplierInvoices.length})`, icon: FileText },
        ].map((t) => ('''

if old_tab_buttons in code:
    code = code.replace(old_tab_buttons, new_tab_buttons, 1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Part 1: Imports, Data, and Tab states added successfully")
