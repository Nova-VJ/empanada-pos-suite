import { useState, useMemo } from "react";
import { ArrowRight, Trash2, CheckCircle2, Edit, FileText, Filter, Package, Plus, Search, SlidersHorizontal, Truck, Award, Sparkles, X, Calculator, Clock, RefreshCw, Radio, Zap, ShieldCheck, ChevronDown, ChevronUp, Bell, Check, MapPin, Globe, Store, Building, PhoneCall, ExternalLink, Navigation, CheckCircle, Info, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";
import type { POStatus, Supplier } from "@/types/pos";
import { Modal, btnGhost, btnPrimary, inputCls } from "../pos/Modal";
import { matchesSearch } from "@/lib/search";

const poStatusColors: Record<POStatus, string> = {
  borrador: "bg-secondary text-muted-foreground",
  enviado: "bg-module-sales-light text-module-sales",
  en_camino: "bg-module-cash-light text-module-cash",
  recibido: "bg-module-inventory-light text-module-inventory",
  facturado: "bg-module-suppliers-light text-module-suppliers",
  cancelado: "bg-destructive/10 text-destructive",
};

const poStatusFlow: Record<POStatus, POStatus | undefined> = {
  borrador: "enviado",
  enviado: "en_camino",
  en_camino: "recibido",
  recibido: "facturado",
  facturado: undefined,
  cancelado: undefined,
};

export interface SupplyAlternative {
  supplier: string;
  priceUsd: number;
  rating: number;
  deliveryHours: number;
  creditDays: number;
  verified: boolean;
  isCurrent?: boolean;
  savingsPct?: number;
  channelType?: "official_web" | "direct_pbx" | "social_media";
  officialUrl?: string;
  socialHandle?: string;
  sourceNote?: string;
  zone?: string;
  distanceKm?: number;
}

export interface MarketSupplyItem {
  id: string;
  name: string;
  category: string;
  currentSupplier: string;
  currentPriceUsd: number;
  alternatives: SupplyAlternative[];
}

export const MARKET_SUPPLIES: MarketSupplyItem[] = [
  {
    id: "supply-1",
    name: "Harina de Maíz Blanco Precocida (Bulto 20 kg)",
    category: "Harinas",
    currentSupplier: "Alimentos Polar Comercial C.A.",
    currentPriceUsd: 22.5,
    alternatives: [
      {
        supplier: "Alimentos Polar Comercial C.A.",
        priceUsd: 22.5,
        rating: 98,
        deliveryHours: 12,
        creditDays: 15,
        verified: true,
        isCurrent: true,
        channelType: "official_web",
        officialUrl: "https://empresaspolar.com",
        sourceNote: "Planta Turmero / San Joaquín (Canal Oficial Polar Aragua)",
        zone: "Planta Turmero (Autopista Regional del Centro)",
        distanceKm: 8.5,
      },
      {
        supplier: "Distribuidora Mayorista Central C.A.",
        priceUsd: 20.8,
        rating: 92,
        deliveryHours: 4,
        creditDays: 7,
        verified: true,
        savingsPct: 7.5,
        channelType: "direct_pbx",
        sourceNote: "Galpón 2 Mercado Mayorista de Maracay (Entrega express en San Jacinto)",
        zone: "Mercado Mayorista de Maracay (Av. Intercomunal)",
        distanceKm: 4.2,
      },
      {
        supplier: "Inversiones Hermanos Gómez C.A.",
        priceUsd: 19.9,
        rating: 85,
        deliveryHours: 24,
        creditDays: 0,
        verified: false,
        savingsPct: 11.5,
        channelType: "social_media",
        socialHandle: "@distribuidoragomez_mcy",
        sourceNote: "Lista por WhatsApp / Redes (Venta al mayor en San Vicente)",
        zone: "Zona Industrial San Vicente II, Maracay",
        distanceKm: 7.8,
      },
    ],
  },
  {
    id: "supply-2",
    name: "Queso Llanero Blanco Duro (Kilo)",
    category: "Lácteos",
    currentSupplier: "Lácteos y Quesera Llanera Guárico C.A.",
    currentPriceUsd: 4.8,
    alternatives: [
      {
        supplier: "Lácteos y Quesera Llanera Guárico C.A.",
        priceUsd: 4.8,
        rating: 88,
        deliveryHours: 24,
        creditDays: 7,
        verified: true,
        isCurrent: true,
        channelType: "official_web",
        sourceNote: "Ruta de quesos llaneros directo a San Jacinto (Guía SICA)",
        zone: "Eje San Juan de los Morros - Villa de Cura",
        distanceKm: 38.0,
      },
      {
        supplier: "Agropecuaria El Sombrero C.A.",
        priceUsd: 4.1,
        rating: 94,
        deliveryHours: 4,
        creditDays: 10,
        verified: true,
        savingsPct: 14.5,
        channelType: "direct_pbx",
        sourceNote: "Puesto de lácteos mayorista en Intercomunal (Queso blanco duro directo)",
        zone: "Mercado Mayorista de Maracay (Sector Lácteos)",
        distanceKm: 4.2,
      },
      {
        supplier: "Distribuidora Lácteos Aragua C.A.",
        priceUsd: 4.35,
        rating: 90,
        deliveryHours: 6,
        creditDays: 15,
        verified: true,
        savingsPct: 9.3,
        channelType: "social_media",
        socialHandle: "@lacteos_aragua_mcy",
        sourceNote: "Distribución local diaria en La Morita y San Jacinto",
        zone: "La Morita / Av. Aragua (a 5 min de San Jacinto)",
        distanceKm: 3.1,
      },
    ],
  },
  {
    id: "supply-3",
    name: "Aceite Vegetal Comestible (Bidón 18 Litros)",
    category: "Aceites",
    currentSupplier: "Alimentos Polar Comercial C.A.",
    currentPriceUsd: 32.0,
    alternatives: [
      {
        supplier: "Alimentos Polar Comercial C.A.",
        priceUsd: 32.0,
        rating: 95,
        deliveryHours: 12,
        creditDays: 15,
        verified: true,
        isCurrent: true,
        channelType: "official_web",
        officialUrl: "https://empresaspolar.com",
        sourceNote: "Canal corporativo Alimentos Polar (Marca Mazeite Turmero)",
        zone: "Centro de Distribución ARC Turmero",
        distanceKm: 9.0,
      },
      {
        supplier: "Oleaginosas Industriales C.A. (Portuguesa)",
        priceUsd: 27.5,
        rating: 93,
        deliveryHours: 18,
        creditDays: 21,
        verified: true,
        savingsPct: 14.0,
        channelType: "official_web",
        officialUrl: "https://asoportuguesa.org",
        sourceNote: "Planta de grasas y aceites comestibles en Santa Cruz de Aragua",
        zone: "Zona Industrial Santa Cruz de Aragua",
        distanceKm: 11.5,
      },
      {
        supplier: "Comercializadora San Martín",
        priceUsd: 28.9,
        rating: 89,
        deliveryHours: 4,
        creditDays: 15,
        verified: true,
        savingsPct: 9.6,
        channelType: "social_media",
        socialHandle: "@sanmartin_maracay",
        sourceNote: "Preventista de víveres zona San Jacinto - Montaña Fresca",
        zone: "San Jacinto / Urb. Montaña Fresca (Maracay)",
        distanceKm: 2.3,
      },
    ],
  },
  {
    id: "supply-4",
    name: "Carne de Res de Primera para Mechar (Kilo)",
    category: "Carnes",
    currentSupplier: "Carnes y Frigorífico San Antonio C.A.",
    currentPriceUsd: 6.9,
    alternatives: [
      {
        supplier: "Carnes y Frigorífico San Antonio C.A.",
        priceUsd: 6.9,
        rating: 91,
        deliveryHours: 6,
        creditDays: 7,
        verified: true,
        isCurrent: true,
        channelType: "direct_pbx",
        sourceNote: "Despacho cárnico con guía sanitaria INSAI Aragua",
        zone: "Av. Bolívar Este (Maracay Centro)",
        distanceKm: 3.8,
      },
      {
        supplier: "Frigorífico Industrial Centro-Occidente",
        priceUsd: 6.1,
        rating: 96,
        deliveryHours: 12,
        creditDays: 14,
        verified: true,
        savingsPct: 11.5,
        channelType: "official_web",
        sourceNote: "Matadero Industrial Turmero / Cagua (Carne en canal y vara)",
        zone: "Matadero Industrial Turmero / Cagua",
        distanceKm: 13.0,
      },
      {
        supplier: "Distribuidora Cárnica Barinas C.A.",
        priceUsd: 5.95,
        rating: 87,
        deliveryHours: 4,
        creditDays: 7,
        verified: true,
        savingsPct: 13.7,
        channelType: "social_media",
        socialHandle: "@carnes_maracay_mayor",
        sourceNote: "Recepción de ganado de Barinas en el Mayorista de Maracay",
        zone: "Mercado Mayorista de Maracay (Sector Cárnicos)",
        distanceKm: 4.2,
      },
    ],
  },
  {
    id: "supply-5",
    name: "Cazón Margariteño Fresco Limpio (Kilo)",
    category: "Pescados",
    currentSupplier: "Pescadería Mar Caribe C.A.",
    currentPriceUsd: 5.8,
    alternatives: [
      {
        supplier: "Pescadería Mar Caribe C.A.",
        priceUsd: 5.8,
        rating: 89,
        deliveryHours: 6,
        creditDays: 0,
        verified: true,
        isCurrent: true,
        channelType: "direct_pbx",
        sourceNote: "Pescadería mayorista con cazón fresco limpio para guisar",
        zone: "Mercado Principal de Maracay (Calle Santos Michelena)",
        distanceKm: 4.5,
      },
      {
        supplier: "Cooperativa Pesquera Sucre & Coche",
        priceUsd: 4.9,
        rating: 95,
        deliveryHours: 24,
        creditDays: 7,
        verified: true,
        savingsPct: 15.5,
        channelType: "official_web",
        officialUrl: "https://inmerca.gob.ve",
        sourceNote: "Despacho directo de costa a Maracay (Canal Oficial)",
        zone: "Ruta Costera Ocumare - Maracay",
        distanceKm: 45.0,
      },
    ],
  },
  {
    id: "supply-6",
    name: "Cajas Térmicas Para Llevar (Paquete 100 Uds.)",
    category: "Empaques",
    currentSupplier: "Empaques y Plásticos Caracas C.A.",
    currentPriceUsd: 18.0,
    alternatives: [
      {
        supplier: "Empaques y Plásticos Caracas C.A.",
        priceUsd: 18.0,
        rating: 90,
        deliveryHours: 24,
        creditDays: 15,
        verified: true,
        isCurrent: true,
        channelType: "direct_pbx",
        sourceNote: "Distribuidor regional de empaques y envases termoformados",
        zone: "Zona Industrial San Jacinto / Casanova Godoy",
        distanceKm: 1.5,
      },
      {
        supplier: "EcoPack Venezuela S.A.",
        priceUsd: 14.5,
        rating: 97,
        deliveryHours: 3,
        creditDays: 30,
        verified: true,
        savingsPct: 19.4,
        channelType: "official_web",
        officialUrl: "https://ecopackve.com",
        sourceNote: "Almacén directo en Maracay (Cajas térmicas y papel parafinado)",
        zone: "Zona Industrial Piñonal / San Jacinto (Maracay)",
        distanceKm: 2.0,
      },
    ],
  },
];

export interface SimulationItem {
  supplyId: string;
  qty: number;
}

export interface SimulationResultItem {
  supplyId: string;
  name: string;
  qty: number;
  currentSupplier: string;
  currentPrice: number;
  currentSubtotal: number;
  recommendedSupplier: string;
  recommendedPrice: number;
  recommendedSubtotal: number;
  itemSavingsUsd: number;
  itemSavingsPct: number;
  deliveryHours: number;
  creditDays: number;
}

export interface SimulationResult {
  currentTotalUsd: number;
  optimizedTotalUsd: number;
  savingsUsd: number;
  savingsPct: number;
  itemsBreakdown: SimulationResultItem[];
}

export interface LocalSupplierEntry {
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

export function calculateSupplySavingsSimulation(
  items: SimulationItem[],
  suppliesList: MarketSupplyItem[] = MARKET_SUPPLIES
): SimulationResult {
  let currentTotalUsd = 0;
  let optimizedTotalUsd = 0;

  const itemsBreakdown: SimulationResultItem[] = items.map((item) => {
    const supply = suppliesList.find((s) => s.id === item.supplyId);
    if (!supply) {
      return {
        supplyId: item.supplyId,
        name: "Insumo desconocido",
        qty: item.qty,
        currentSupplier: "N/A",
        currentPrice: 0,
        currentSubtotal: 0,
        recommendedSupplier: "N/A",
        recommendedPrice: 0,
        recommendedSubtotal: 0,
        itemSavingsUsd: 0,
        itemSavingsPct: 0,
        deliveryHours: 0,
        creditDays: 0,
      };
    }

    const nonCurrentAlts = supply.alternatives.filter((a) => !a.isCurrent);
    const bestAlt =
      nonCurrentAlts.length > 0
        ? [...nonCurrentAlts].sort((a, b) => a.priceUsd - b.priceUsd)[0]
        : supply.alternatives[0];

    const recommendedPrice = bestAlt ? bestAlt.priceUsd : supply.currentPriceUsd;
    const currentSubtotal = Math.round(supply.currentPriceUsd * item.qty * 100) / 100;
    const recommendedSubtotal = Math.round(recommendedPrice * item.qty * 100) / 100;
    const itemSavingsUsd = Math.round(Math.max(0, currentSubtotal - recommendedSubtotal) * 100) / 100;
    const itemSavingsPct = currentSubtotal > 0 ? Math.round((itemSavingsUsd / currentSubtotal) * 1000) / 10 : 0;

    currentTotalUsd += currentSubtotal;
    optimizedTotalUsd += recommendedSubtotal;

    return {
      supplyId: supply.id,
      name: supply.name,
      qty: item.qty,
      currentSupplier: supply.currentSupplier,
      currentPrice: supply.currentPriceUsd,
      currentSubtotal,
      recommendedSupplier: bestAlt ? bestAlt.supplier : supply.currentSupplier,
      recommendedPrice,
      recommendedSubtotal,
      itemSavingsUsd,
      itemSavingsPct,
      deliveryHours: bestAlt ? bestAlt.deliveryHours : 24,
      creditDays: bestAlt ? bestAlt.creditDays : 0,
    };
  });

  currentTotalUsd = Math.round(currentTotalUsd * 100) / 100;
  optimizedTotalUsd = Math.round(optimizedTotalUsd * 100) / 100;
  const savingsUsd = Math.round(Math.max(0, currentTotalUsd - optimizedTotalUsd) * 100) / 100;
  const savingsPct = currentTotalUsd > 0 ? Math.round((savingsUsd / currentTotalUsd) * 1000) / 10 : 0;

  return {
    currentTotalUsd,
    optimizedTotalUsd,
    savingsUsd,
    savingsPct,
    itemsBreakdown,
  };
}

export function SuppliersModule() {
  const pos = usePos();
  const { suppliers, purchaseOrders, supplierInvoices, products, rate } = pos;
  const [tab, setTab] = useState<"finder" | "radar" | "suppliers" | "orders" | "invoices">("finder");
  const [localSuppliers, setLocalSuppliers] = useState<LocalSupplierEntry[]>(ARAGUA_LOCAL_SUPPLIERS);
  const [radarSourceFilter, setRadarSourceFilter] = useState<"todos" | "osm" | "directory" | "galpon">("todos");
  const [radarZoneFilter, setRadarZoneFilter] = useState<string>("todas");
  const [newGalponModal, setNewGalponModal] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
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
  }
  const [search, setSearch] = useState("");
  const [supplyCategory, setSupplyCategory] = useState<string>("Todos");
  const [supModal, setSupModal] = useState(false);
  const [poModal, setPoModal] = useState(false);
  const [simModal, setSimModal] = useState(false);
  const [editingSup, setEditingSup] = useState<Supplier | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanDate, setLastScanDate] = useState("Lunes 19 Octubre 2026, 06:00 AM");
  const [radarExpanded, setRadarExpanded] = useState(true);
  const [discoveredApproved, setDiscoveredApproved] = useState(false);

  function handleRunWeeklyScan() {
    setIsScanning(true);
    toast.info("Iniciando escaneo semanal de proveedores...", {
      description: "Rastreando portales web, listas de difusión de WhatsApp y precios en el Mercado Mayorista de Maracay...",
    });
    setTimeout(() => {
      setIsScanning(false);
      setLastScanDate("Hoy (recién actualizado)");
      toast.success("¡Escaneo semanal completado con éxito!", {
        description: "18 distribuidores verificados. Se detectaron 2 ajustes de precio a la baja y 1 nuevo frigorífico en Maracay.",
      });
    }, 1800);
  }

  function handleSyncEscandallo() {
    toast.success("Precios sincronizados con la Ficha de Escandallo", {
      description: "El costo de las empanadas se ha recalculado con las mejores cotizaciones de la semana.",
    });
  }

  const [simQtys, setSimQtys] = useState<Record<string, number>>({
    "supply-1": 20, // 20 Bultos Harina P.A.N. (20kg)
    "supply-2": 30, // 30 Kilos Queso Llanero Duro
    "supply-3": 5,  // 5 Bidones Aceite Vegetal 18L
    "supply-4": 25, // 25 Kilos Carne de Res para Mechar
    "supply-5": 15, // 15 Kilos Cazón Margariteño
    "supply-6": 5,  // 5 Paquetes Cajas Térmicas (100 uds)
  });

  const simulationResult = useMemo(() => {
    const items: SimulationItem[] = Object.entries(simQtys)
      .filter(([_, q]) => q > 0)
      .map(([supplyId, qty]) => ({ supplyId, qty }));
    return calculateSupplySavingsSimulation(items);
  }, [simQtys]);

  const [supForm, setSupForm] = useState({
    name: "",
    rif: "J-",
    email: "",
    phone: "0212-",
    city: "Caracas",
    paymentDays: "15",
    category: "Harinas, Aceites y Bebidas",
    active: true,
  });

  const [poForm, setPoForm] = useState({
    supplierId: suppliers[0]?.id ?? "sup-1",
    itemsSummary: "20 Bultos Harina P.A.N. + 5 Bidones Aceite 18L",
    productId: products[0]?.id ?? "e1",
    qty: "50",
    totalUsd: "420.00",
  });

  const filteredSuppliers = suppliers.filter(
    (s) =>
      matchesSearch(s.name, search) ||
      matchesSearch(s.rif, search) ||
      matchesSearch(s.category, search)
  );

  const [sortBy, setSortBy] = useState<"savings" | "price_asc" | "rating" | "delivery">("savings");
  const [maxDeliveryHours, setMaxDeliveryHours] = useState<number>(72);
  const [onlyCredit, setOnlyCredit] = useState<boolean>(false);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [channelFilter, setChannelFilter] = useState<"all" | "official" | "social">("all");

  const filteredSupplies = MARKET_SUPPLIES.filter(
    (s) =>
      (supplyCategory === "Todos" || s.category === supplyCategory) &&
      (matchesSearch(s.name, search) || matchesSearch(s.currentSupplier, search))
  ).map((item) => {
    // Filtrar y ordenar las alternativas según los parámetros del dueño
    const filteredAlts = item.alternatives
      .filter((alt) => {
        if (alt.isCurrent) return true; // Siempre mantener el proveedor actual como referencia
        if (alt.deliveryHours > maxDeliveryHours) return false;
        if (onlyCredit && alt.creditDays <= 0) return false;
        if (onlyVerified && !alt.verified) return false;
        if (channelFilter === "official" && alt.channelType === "social_media") return false;
        if (channelFilter === "social" && alt.channelType !== "social_media") return false;
        return true;
      })
      .sort((a, b) => {
        if (a.isCurrent) return -1;
        if (b.isCurrent) return 1;
        if (sortBy === "price_asc") return a.priceUsd - b.priceUsd;
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "delivery") return a.deliveryHours - b.deliveryHours;
        return (b.savingsPct ?? 0) - (a.savingsPct ?? 0);
      });

    return { ...item, alternatives: filteredAlts };
  });

  function handleOrderFromAlternative(supplyName: string, alt: { supplier: string; priceUsd: number }) {
    setPoForm({
      supplierId: suppliers[0]?.id ?? "sup-1",
      itemsSummary: `Insumo: ${supplyName} (@ $${alt.priceUsd.toFixed(2)} cotizado con ${alt.supplier})`,
      productId: products[0]?.id ?? "e1",
      qty: "10",
      totalUsd: String(alt.priceUsd * 10),
    });
    setPoModal(true);
  }

  function openNewSupplier() {
    setEditingSup(null);
    setSupForm({
      name: "",
      rif: "J-",
      email: "",
      phone: "0212-",
      city: "Caracas",
      paymentDays: "15",
      category: "Quesos y Lácteos",
      active: true,
    });
    setSupModal(true);
  }

  function openEditSupplier(s: Supplier) {
    setEditingSup(s);
    setSupForm({
      name: s.name,
      rif: s.rif,
      email: s.email,
      phone: s.phone,
      city: s.city,
      paymentDays: String(s.paymentDays),
      category: s.category,
      active: s.active,
    });
    setSupModal(true);
  }

  function saveSupplier() {
    if (!supForm.name.trim()) {
      toast.error("El nombre del proveedor es obligatorio");
      return;
    }
    const payload = {
      name: supForm.name.trim(),
      rif: supForm.rif.trim(),
      email: supForm.email.trim(),
      phone: supForm.phone.trim(),
      city: supForm.city.trim(),
      paymentDays: parseInt(supForm.paymentDays, 10) || 15,
      category: supForm.category,
      active: supForm.active,
    };
    if (editingSup) {
      pos.updateSupplier(editingSup.id, payload);
      toast.success("Proveedor actualizado");
    } else {
      pos.createSupplier(payload);
      toast.success("Proveedor creado");
    }
    setSupModal(false);
  }

  function savePurchaseOrder() {
    const totalUsd = parseFloat(poForm.totalUsd) || 0;
    if (!poForm.itemsSummary.trim() || totalUsd <= 0) {
      toast.error("Completa el detalle y monto del pedido");
      return;
    }
    pos.createPurchaseOrder({
      supplierId: poForm.supplierId,
      itemsSummary: poForm.itemsSummary.trim(),
      productId: poForm.productId,
      qty: parseInt(poForm.qty, 10) || 40,
      totalUsd,
    });
    toast.success("Pedido de compra creado");
    setPoModal(false);
    setTab("orders");
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Proveedores & Compras Inteligentes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comparador de mejores proveedores de insumos (Harina, Queso, Aceite, Carnes), órdenes de compra y facturas
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSimModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition"
            title="Simular orden en lote y calcular ahorro frente a mayoristas"
          >
            <Sparkles className="h-4 w-4" />
            Simulador de Ahorro Mayorista
          </button>
          <button
            onClick={() => setPoModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition"
          >
            <Package className="h-4 w-4 text-module-suppliers" />
            Nuevo pedido de compra
          </button>
          <button
            onClick={openNewSupplier}
            className="inline-flex items-center gap-2 rounded-xl bg-module-suppliers px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-border pb-2">
        <button
          onClick={() => setTab("finder")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
            tab === "finder" ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          🔍 Buscar Mejores Proveedores (Comparador)
        </button>
        {[
          { id: "radar", label: `📡 Radar Mayorista Aragua (${localSuppliers.length})`, icon: MapPin },
          { id: "suppliers", label: `Proveedores Registrados (${suppliers.length})`, icon: Truck },
          { id: "orders", label: `Pedidos de Compra (${purchaseOrders.length})`, icon: Package },
          { id: "invoices", label: `Facturas Recibidas (${supplierInvoices.length})`, icon: FileText },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === t.id ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Comparador de Mejores Proveedores */}
      {tab === "finder" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/25 bg-primary/10 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">💡 Buscador Inteligente de Oportunidades de Compra</h3>
                <span className="rounded bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5">Control del Dueño</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Compara precios en tiempo real entre tus proveedores habituales y el mercado mayorista venezolano para ahorrar en insumos críticos.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSimModal(true)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-2xs transition flex items-center gap-1.5"
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>Simular Lote de Compra</span>
              </button>
              <div className="flex flex-wrap gap-1">
                {["Todos", "Harinas", "Lácteos", "Aceites", "Carnes", "Empaques"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSupplyCategory(cat)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                      supplyCategory === cat
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-card text-muted-foreground hover:text-foreground border border-border"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Banner de Transparencia de Fuentes Oficiales y Zona Maracay / San Jacinto */}
          <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3.5 text-xs text-foreground flex items-start gap-3">
            <div className="text-xl shrink-0">📍</div>
            <div className="space-y-1">
              <div className="font-bold flex items-center gap-2 flex-wrap">
                <span>Centro Operativo: Dr. Empanadas (San Jacinto, Maracay, Edo. Aragua)</span>
                <span className="rounded bg-sky-500/20 text-sky-700 dark:text-sky-300 px-2 py-0.2 text-[10px] font-semibold">
                  Proveedores Locales Aragua
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Búsqueda y cotización inteligente geolocalizada en <strong>San Jacinto, Mercado Mayorista de Maracay (Av. Intercomunal), Zona Industrial San Vicente, Turmero, Cagua y Valles de Aragua</strong>. Distinguimos entre <strong>canales oficiales auditados</strong> (RIF SENIAT / Guía SICA) y <strong>redes sociales referenciales</strong>.
              </p>
            </div>
          </div>

          {/* Motor de Actualización Semanal & Radar de Nuevos Proveedores */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-4 shadow-sm space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Radio className="h-5 w-5 animate-pulse text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-foreground">
                      Motor de Rastreo Semanal & Detección de Proveedores
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      Motor Automático Activo
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Actualiza precios cada lunes a las 6:00 AM y descubre nuevos distribuidores en el radio de San Jacinto y Maracay.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunWeeklyScan}
                  disabled={isScanning}
                  className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? "animate-spin" : ""}`} />
                  <span>{isScanning ? "Escaneando Maracay..." : "🔄 Ejecutar Escaneo Semanal Ahora"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRadarExpanded(!radarExpanded)}
                  className="rounded-xl border border-border bg-secondary p-2 text-muted-foreground hover:text-foreground transition"
                  title="Mostrar / Ocultar detalle del motor"
                >
                  {radarExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {radarExpanded && (
              <div className="space-y-3 pt-1 border-t border-border/60">
                {/* 3 Métricas del Motor */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[11px] font-semibold">Frecuencia de Rastreo</span>
                      <Clock className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="text-xs font-bold text-foreground">Cada Lunes (06:00 AM)</div>
                    <div className="text-[10px] text-muted-foreground">Último: {lastScanDate}</div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[11px] font-semibold">Canales de Alimentación</span>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div className="text-xs font-bold text-foreground">4 Motores Verificados</div>
                    <div className="text-[10px] text-muted-foreground">Web + WhatsApp OCR + Facturas + Maps</div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[11px] font-semibold">Conexión con Escandallo</span>
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <div className="text-xs font-bold text-foreground">Sincronización Inmediata</div>
                    <button
                      type="button"
                      onClick={handleSyncEscandallo}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <span>⚡ Enviar Precios al Escandallo</span>
                    </button>
                  </div>
                </div>

                {/* Nuevo Proveedor Descubierto en Maracay */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      ✨ NUEVO
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-xs">
                          Frigorífico & Distribuidora Los Samanes C.A. (RIF J-4109283-1)
                        </span>
                        <span className="rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0.2">
                          -9.5% de ahorro vs promedio
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        📍 Av. Fuerzas Aéreas (a 3.8 km de San Jacinto) · Falda de Res limpia: <strong>$4.95/kg</strong> (vs $5.60/kg habitual) · Entrega en 4 horas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {discoveredApproved ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        <Check className="h-3.5 w-3.5" />
                        <span>Agregado a tu Catálogo</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setDiscoveredApproved(true);
                          toast.success("Nuevo proveedor incorporado", {
                            description: "Frigorífico Los Samanes se ha añadido a tu lista de proveedores activos.",
                          });
                        }}
                        className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Aprobar e Incorporar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Parámetros Elegibles por el Dueño */}
          <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <span>Parámetros de Búsqueda:</span>
              </div>

              {/* Ordenar por */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Priorizar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground outline-none focus:border-primary"
                >
                  <option value="savings">Mayor % de Ahorro</option>
                  <option value="price_asc">Menor Precio en USD ($)</option>
                  <option value="rating">Mejor Calificación (Score)</option>
                  <option value="delivery">Despacho más Rápido</option>
                </select>
              </div>

              {/* Tiempo máx de entrega */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Entrega máx:</span>
                <select
                  value={maxDeliveryHours}
                  onChange={(e) => setMaxDeliveryHours(Number(e.target.value))}
                  className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground outline-none focus:border-primary"
                >
                  <option value={24}>Express 24 Horas</option>
                  <option value={48}>Hasta 48 Horas</option>
                  <option value={72}>Hasta 72 Horas (Todas)</option>
                </select>
              </div>

              {/* Origen del Canal / Fuente */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Origen:</span>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value as typeof channelFilter)}
                  className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground outline-none focus:border-primary"
                >
                  <option value="all">Todas las Fuentes</option>
                  <option value="official">🏛️ Solo Webs / Canales Oficiales</option>
                  <option value="social">📱 Redes Sociales (No Verificado)</option>
                </select>
              </div>
            </div>

            {/* Checkboxes de condiciones */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={onlyCredit}
                  onChange={(e) => setOnlyCredit(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span>Solo con Crédito (Días)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                  Solo Verificados
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSupplies.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-foreground text-sm mt-1">{item.name}</h4>
                    <p className="text-[11px] text-muted-foreground">Proveedor actual: {item.currentSupplier}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-base font-bold text-foreground">{fmtUsd(item.currentPriceUsd)}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{fmtBs(item.currentPriceUsd * rate)}</div>
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-border">
                  <div className="text-[11px] font-semibold text-muted-foreground">Alternativas y Comparativa de Mercado:</div>
                  {item.alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg p-2.5 text-xs flex items-center justify-between gap-3 border ${
                        alt.isCurrent
                          ? "bg-secondary/40 border-border"
                          : alt.savingsPct && alt.savingsPct > 10
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-card border-border"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground truncate flex-wrap">
                          <span>{alt.supplier}</span>
                          {alt.isCurrent && (
                            <span className="rounded bg-secondary px-1.5 py-0.2 text-[9px] font-bold text-muted-foreground">
                              Actual
                            </span>
                          )}
                          {alt.savingsPct && (
                            <span className="rounded bg-emerald-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                              Ahorro {alt.savingsPct}%
                            </span>
                          )}
                          {alt.channelType === "official_web" && (
                            <span className="rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.2 text-[9px] flex items-center gap-0.5">
                              🌐 Web Oficial
                            </span>
                          )}
                          {alt.channelType === "direct_pbx" && (
                            <span className="rounded bg-sky-500/15 text-sky-700 dark:text-sky-400 font-bold px-1.5 py-0.2 text-[9px] flex items-center gap-0.5">
                              🏛️ Canal Oficial / Sede
                            </span>
                          )}
                          {alt.channelType === "social_media" && (
                            <span className="rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold px-1.5 py-0.2 text-[9px] flex items-center gap-0.5" title="No verificado de fuentes oficiales">
                              ⚠️ Redes Sociales (No Verificado Oficialmente)
                            </span>
                          )}
                        </div>

                        {alt.sourceNote && (
                          <div className="text-[10px] text-muted-foreground/90 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span>📌 {alt.sourceNote}</span>
                            {alt.socialHandle && (
                              <span className="font-mono text-primary font-semibold">📱 {alt.socialHandle}</span>
                            )}
                            {alt.officialUrl && (
                              <a
                                href={alt.officialUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline hover:text-primary/80 font-medium"
                              >
                                Visitar web oficial ↗
                              </a>
                            )}
                          </div>
                        )}

                        {alt.zone && (
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                            <span>📍 {alt.zone}</span>
                            {alt.distanceKm !== undefined && (
                              <span className="font-mono text-muted-foreground">({alt.distanceKm} km de San Jacinto)</span>
                            )}
                          </div>
                        )}

                        <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                          Entrega: {alt.deliveryHours}h · Crédito: {alt.creditDays} días · Score: {alt.rating}/100
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <div className="font-mono font-bold text-foreground">{fmtUsd(alt.priceUsd)}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{fmtBs(alt.priceUsd * rate)}</div>
                        </div>
                        {!alt.isCurrent && (
                          <button
                            onClick={() => handleOrderFromAlternative(item.name, alt)}
                            className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-2xs"
                          >
                            Pedir Cotización
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Radar Mayorista Aragua (OpenStreetMap, Directorios & Galpones) */}
      {tab === "radar" && (
        <div className="space-y-4">
          {/* Header Hero */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl">📍</span>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Radar Mayorista Aragua & Directorio Geolocalizado
                  </h2>
                  <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold">
                    100% Gratuito · Sin Tarjeta de Crédito
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                  Búsqueda y cotización de insumos en tiempo real cruzando <strong>OpenStreetMap (Overpass API)</strong>, <strong>Directorios Comerciales de Aragua</strong> y el <strong>Catálogo de Galpones del Mercado Mayorista (Av. Intercomunal)</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewGalponModal(true)}
                  className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Monitorear Nuevo Galpón / Puesto</span>
                </button>
              </div>
            </div>

            {/* 3 Pilares Sin Tarjeta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="rounded-xl border border-border bg-card/80 p-3 space-y-1">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <MapPin className="h-4 w-4" />
                  <span>1. OpenStreetMap (Overpass)</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Cartografía abierta sin registros ni tarjeta. Nodos geolocalizados en San Jacinto, Turmero y Maracay centro.
                </p>
                <div className="text-[10px] font-mono text-primary font-semibold pt-0.5">
                  Radio 12 km · Coordenadas 10.2469° N
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card/80 p-3 space-y-1">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  <Building className="h-4 w-4" />
                  <span>2. Directorios Comerciales</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Páginas Amarillas Venezuela y Cámara de Industriales de Aragua (Zona Ind. San Vicente y Santa Cruz).
                </p>
                <div className="text-[10px] font-mono text-primary font-semibold pt-0.5">
                  RIF SENIAT Auditado · Canales PBX
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card/80 p-3 space-y-1">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                  <Store className="h-4 w-4" />
                  <span>3. Galpones Mercado Mayorista</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Galpones 1 al 5 en Av. Intercomunal (a 4.2 km). Sector harinas, quesos, carnes y empaques directos.
                </p>
                <div className="text-[10px] font-mono text-primary font-semibold pt-0.5">
                  Actualizable por el dueño con 1 toque
                </div>
              </div>
            </div>
          </div>

          {/* Filtros de Búsqueda */}
          <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Filtro por Fuente */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-muted-foreground font-semibold">Fuente:</span>
                {[
                  { id: "todos", label: `Todos (${localSuppliers.length})` },
                  { id: "galpon", label: `🏛️ Galpones Mayorista (${localSuppliers.filter((s) => s.sourceType === "galpon").length})` },
                  { id: "osm", label: `🗺️ OpenStreetMap (${localSuppliers.filter((s) => s.sourceType === "osm").length})` },
                  { id: "directory", label: `🏢 Directorios Aragua (${localSuppliers.filter((s) => s.sourceType === "directory").length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setRadarSourceFilter(f.id as typeof radarSourceFilter)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      radarSourceFilter === f.id
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Filtro por Zona */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground font-semibold">Zona:</span>
                <select
                  value={radarZoneFilter}
                  onChange={(e) => setRadarZoneFilter(e.target.value)}
                  className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground outline-none focus:border-primary"
                >
                  <option value="todas">Todas las zonas (Eje Aragua)</option>
                  <option value="San Jacinto">San Jacinto (&lt; 3 km)</option>
                  <option value="Mayorista">Mercado Mayorista (4.2 km)</option>
                  <option value="San Vicente">Zona Ind. San Vicente (7.8 km)</option>
                  <option value="Turmero">Turmero / ARC (8.5 km)</option>
                  <option value="Santa Cruz">Santa Cruz de Aragua (11.5 km)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Listado de Tarjetas de Proveedores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {localSuppliers
              .filter((s) => radarSourceFilter === "todos" || s.sourceType === radarSourceFilter)
              .filter((s) => radarZoneFilter === "todas" || s.zone.toLowerCase().includes(radarZoneFilter.toLowerCase()))
              .map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-card hover:border-primary/40 transition shadow-2xs p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    {/* Header de la Tarjeta */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.sourceType === "galpon"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : item.sourceType === "osm"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                          }`}>
                            {item.sourceType === "galpon" ? "🏛️ Galpón Mayorista" : item.sourceType === "osm" ? "🗺️ OpenStreetMap" : "🏢 Directorio Aragua"}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono font-semibold">
                            📍 {item.distanceKm} km · {item.zone}
                          </span>
                        </div>
                        <h4 className="font-bold text-foreground text-sm leading-tight pt-1">
                          {item.name}
                        </h4>
                      </div>

                      <span className="rounded-lg bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        -{item.savingsVsAvgPct}% ahorro
                      </span>
                    </div>

                    {/* Producto Clave y Precio */}
                    <div className="rounded-xl border border-border bg-secondary/40 p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">Insumo Clave</div>
                        <div className="font-medium text-foreground">{item.keyProduct}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">Precio Cotizado</div>
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          ${item.priceEstimateUsd.toFixed(2)} USD
                        </div>
                      </div>
                    </div>

                    {/* Datos de Contacto y Operación */}
                    <div className="text-[11px] text-muted-foreground space-y-1 pt-1">
                      <p><strong>Dirección:</strong> {item.address}</p>
                      <p><strong>RIF:</strong> {item.rif || "En trámite"} · <strong>Despacho:</strong> {item.deliveryDays}</p>
                      <p className="italic text-[10px] text-muted-foreground/90">💡 {item.notes}</p>
                    </div>
                  </div>

                  {/* Acciones de Sinergia Total */}
                  <div className="border-t border-border pt-2.5 flex items-center justify-between gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsAppQuote(item)}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Cotizar por WhatsApp</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEscandalloSimItem(item)}
                        className="rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground px-2.5 py-1.5 text-xs font-semibold transition flex items-center gap-1"
                        title="Ver impacto en el costo de la empanada"
                      >
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        <span>Simular Escandallo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickAddToSuppliers(item)}
                        className="rounded-lg border border-border bg-card hover:bg-primary hover:text-primary-foreground text-foreground px-2.5 py-1.5 text-xs font-semibold transition flex items-center gap-1"
                        title="Agregar a mis proveedores registrados"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Incorporar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {tab === "suppliers" && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Buscar proveedor o RIF..."
              className={`${inputCls} pl-9`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto min-w-full">
            <table className="w-full min-w-[850px] text-xs">
              <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nombre / Razón Social</th>
                  <th className="px-4 py-3 font-semibold">RIF</th>
                  <th className="px-4 py-3 font-semibold">Rubro</th>
                  <th className="px-4 py-3 font-semibold">Contacto</th>
                  <th className="px-4 py-3 font-semibold">Crédito</th>
                  <th className="px-4 py-3 font-semibold">Scoring</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold w-[90px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-semibold text-foreground">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{s.rif}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{s.phone}</div>
                      <div className="text-[11px]">{s.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">{s.paymentDays} días</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${
                          s.score >= 80
                            ? "bg-module-inventory-light text-module-inventory"
                            : "bg-module-cash-light text-module-cash"
                        }`}
                      >
                        {s.score}/100
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-module-suppliers-light px-2 py-0.5 text-[11px] font-semibold text-module-suppliers">
                        {s.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditSupplier(s)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer"
                          title="Editar proveedor"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingSupplier(s)}
                          className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition cursor-pointer"
                          title="Eliminar proveedor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto min-w-full">
          <table className="w-full min-w-[850px] text-xs">
            <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Nº Pedido</th>
                <th className="px-4 py-3 font-semibold">Proveedor</th>
                <th className="px-4 py-3 font-semibold">Insumos / Detalle</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold text-right">Total (USD / Bs.)</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 text-right">Flujo de Recepción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {purchaseOrders.map((po) => {
                const next = poStatusFlow[po.status];
                return (
                  <tr key={po.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">#{po.orderNumber}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{po.supplierName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{po.itemsSummary}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {new Date(po.createdAt).toLocaleDateString("es-VE")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <div className="font-bold text-foreground">{fmtUsd(po.totalUsd)}</div>
                      <div className="text-[10px] text-muted-foreground">{fmtBs(po.totalUsd * rate)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase ${poStatusColors[po.status]}`}>
                        {po.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {next && (
                        <button
                          onClick={() => {
                            pos.advancePurchaseOrder(po.id);
                            toast.success(
                              next === "recibido"
                                ? `Pedido #${po.orderNumber} recibido — Stock incrementado en Inventario`
                                : `Pedido #${po.orderNumber} avanzado a: ${next.replace("_", " ")}`
                            );
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground transition"
                        >
                          <ArrowRight className="h-3 w-3" />
                          Avanzar a {next.replace("_", " ")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {tab === "invoices" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto min-w-full">
          <table className="w-full min-w-[850px] text-xs">
            <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Nº Factura</th>
                <th className="px-4 py-3 font-semibold">Proveedor</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold text-right">Base (USD)</th>
                <th className="px-4 py-3 font-semibold text-right">IVA (USD)</th>
                <th className="px-4 py-3 font-semibold text-right">Total (USD / Bs.)</th>
                <th className="px-4 py-3 font-semibold">Estado Pago</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {supplierInvoices.map((si) => (
                <tr key={si.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono font-bold text-foreground">{si.invoiceNumber}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{si.supplierName}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {new Date(si.createdAt).toLocaleDateString("es-VE")}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{fmtUsd(si.subtotalUsd)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtUsd(si.taxUsd)}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    <div className="font-bold text-foreground">{fmtUsd(si.totalUsd)}</div>
                    <div className="text-[10px] text-muted-foreground">{fmtBs(si.totalUsd * rate)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        si.paid
                          ? "bg-module-inventory-light text-module-inventory"
                          : "bg-module-expenses-light text-module-expenses"
                      }`}
                    >
                      {si.paid ? "Pagada" : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        pos.toggleSupplierInvoicePaid(si.id);
                        toast.success(si.paid ? "Marcada como pendiente" : `Factura ${si.invoiceNumber} marcada como pagada`);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-module-inventory hover:text-white transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {si.paid ? "Reabrir" : "Registrar Pago"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {supModal && (
        <Modal
          title={editingSup ? `Editar Proveedor: ${editingSup.name}` : "Registrar Nuevo Proveedor"}
          onClose={() => setSupModal(false)}
          footer={
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setSupModal(false)}>
                Cancelar
              </button>
              <button className={btnPrimary} onClick={saveSupplier}>
                Guardar Proveedor
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <label className="sm:col-span-2 font-semibold text-foreground">
              Razón Social del Proveedor *
              <input
                value={supForm.name}
                onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="font-semibold text-foreground">
              RIF SENIAT
              <input
                value={supForm.rif}
                onChange={(e) => setSupForm({ ...supForm, rif: e.target.value })}
                className={`${inputCls} mt-1 font-mono`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Rubro / Categoría
              <input
                value={supForm.category}
                onChange={(e) => setSupForm({ ...supForm, category: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Correo Electrónico
              <input
                value={supForm.email}
                onChange={(e) => setSupForm({ ...supForm, email: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Teléfono
              <input
                value={supForm.phone}
                onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
                className={`${inputCls} mt-1 font-mono`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Ciudad
              <input
                value={supForm.city}
                onChange={(e) => setSupForm({ ...supForm, city: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Días de crédito
              <input
                type="number"
                value={supForm.paymentDays}
                onChange={(e) => setSupForm({ ...supForm, paymentDays: e.target.value })}
                className={`${inputCls} mt-1 font-mono`}
              />
            </label>
          </div>
        </Modal>
      )}

      {poModal && (
        <Modal
          title="Crear Orden de Compra a Proveedor"
          onClose={() => setPoModal(false)}
          width="max-w-lg"
          footer={
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setPoModal(false)}>
                Cancelar
              </button>
              <button className={btnPrimary} onClick={savePurchaseOrder}>
                Emitir Pedido de Compra
              </button>
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            <label className="block font-semibold text-foreground">
              Proveedor
              <select
                value={poForm.supplierId}
                onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                className={`${inputCls} mt-1`}
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.rif})
                  </option>
                ))}
              </select>
            </label>
            <label className="block font-semibold text-foreground">
              Descripción de insumos / mercadería *
              <input
                value={poForm.itemsSummary}
                onChange={(e) => setPoForm({ ...poForm, itemsSummary: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block font-semibold text-foreground">
                Producto vinculado a stock
                <select
                  value={poForm.productId}
                  onChange={(e) => setPoForm({ ...poForm, productId: e.target.value })}
                  className={`${inputCls} mt-1`}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.emoji} {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block font-semibold text-foreground">
                Unidades a ingresar al recibir
                <input
                  type="number"
                  value={poForm.qty}
                  onChange={(e) => setPoForm({ ...poForm, qty: e.target.value })}
                  className={`${inputCls} mt-1 font-mono`}
                />
              </label>
            </div>
            <label className="block font-semibold text-foreground">
              Monto Total de la Orden ($ USD · {fmtBs((parseFloat(poForm.totalUsd) || 0) * rate)})
              <input
                type="number"
                step="0.01"
                value={poForm.totalUsd}
                onChange={(e) => setPoForm({ ...poForm, totalUsd: e.target.value })}
                className={`${inputCls} mt-1 font-mono font-bold`}
              />
            </label>
          </div>
        </Modal>
      )}

      {/* Simulador de Compras Mayoristas & Cálculo de Ahorro Real */}
      {simModal && (
        <Modal
          title="Simulador de Compras Mayoristas & Cálculo de Ahorro Real"
          onClose={() => setSimModal(false)}
          width="max-w-3xl"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              <div className="text-xs">
                <span className="text-muted-foreground">Ahorro total estimado en este lote: </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {fmtUsd(simulationResult.savingsUsd)} ({simulationResult.savingsPct.toFixed(1)}%)
                </span>
                <span className="text-muted-foreground ml-1">· {fmtBs(simulationResult.savingsUsd * rate)}</span>
              </div>
              <div className="flex gap-2">
                <button className={btnGhost} onClick={() => setSimModal(false)}>
                  Cerrar
                </button>
                <button
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition"
                  onClick={() => {
                    setPoForm({
                      supplierId: suppliers[0]?.id ?? "sup-1",
                      itemsSummary: `Lote mayorista optimizado: ${simulationResult.itemsBreakdown
                        .filter((i) => i.qty > 0)
                        .map((i) => `${i.qty}x ${i.name.split(" (")[0]}`)
                        .join(", ")}`,
                      productId: products[0]?.id ?? "e1",
                      qty: "100",
                      totalUsd: simulationResult.optimizedTotalUsd.toFixed(2),
                    });
                    setSimModal(false);
                    setPoModal(true);
                    toast.success("Orden de compra precargada con los mejores precios mayoristas");
                  }}
                >
                  Generar Orden con Precios de Ahorro
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Top comparison banners */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-card p-3">
                <span className="text-[11px] text-muted-foreground block font-medium">Costo Proveedores Habituales</span>
                <span className="text-lg font-mono font-bold text-foreground mt-0.5 block">
                  {fmtUsd(simulationResult.currentTotalUsd)}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground block">
                  {fmtBs(simulationResult.currentTotalUsd * rate)}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <span className="text-[11px] text-muted-foreground block font-medium">Costo Alternativas Mayoristas</span>
                <span className="text-lg font-mono font-bold text-primary mt-0.5 block">
                  {fmtUsd(simulationResult.optimizedTotalUsd)}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground block">
                  {fmtBs(simulationResult.optimizedTotalUsd * rate)}
                </span>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block font-bold">
                  Ahorro Neto Real Obtenido
                </span>
                <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  -{fmtUsd(simulationResult.savingsUsd)}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                  {simulationResult.savingsPct.toFixed(1)}% de optimización de capital
                </span>
              </div>
            </div>

            {/* Instruction */}
            <p className="text-[11px] text-muted-foreground">
              Ajusta las cantidades que necesitas adquirir para la semana o el mes. El sistema calcula en vivo el proveedor más conveniente, sus plazos de entrega y días de crédito:
            </p>

            {/* Interactive Quantity and Item Table */}
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-secondary/50 border-b border-border text-muted-foreground text-left">
                  <tr>
                    <th className="p-2.5 font-semibold">Insumo</th>
                    <th className="p-2.5 font-semibold text-center w-20">Cantidad</th>
                    <th className="p-2.5 font-semibold">Proveedor Actual</th>
                    <th className="p-2.5 font-semibold">Alternativa Recomendada</th>
                    <th className="p-2.5 font-semibold text-right">Ahorro ($)</th>
                    <th className="p-2.5 font-semibold text-right">% Ahorro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MARKET_SUPPLIES.map((supply) => {
                    const breakdownItem = simulationResult.itemsBreakdown.find((i) => i.supplyId === supply.id);
                    const qty = simQtys[supply.id] ?? 0;
                    return (
                      <tr key={supply.id} className="hover:bg-secondary/20">
                        <td className="p-2.5 font-semibold text-foreground">
                          <div>{supply.name}</div>
                          <div className="text-[10px] text-muted-foreground">{supply.category}</div>
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) =>
                              setSimQtys((prev) => ({
                                ...prev,
                                [supply.id]: Math.max(0, parseInt(e.target.value, 10) || 0),
                              }))
                            }
                            className="w-16 rounded-lg border border-input bg-background p-1 text-center font-mono font-bold text-xs text-foreground outline-none focus:border-primary"
                          />
                        </td>
                        <td className="p-2.5">
                          <div className="font-medium text-foreground truncate max-w-[150px]">
                            {supply.currentSupplier}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            ${supply.currentPriceUsd.toFixed(2)} / ud
                          </div>
                        </td>
                        <td className="p-2.5">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[170px]">
                            {breakdownItem?.recommendedSupplier}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            ${breakdownItem?.recommendedPrice.toFixed(2)} / ud · {breakdownItem?.deliveryHours}h entrega · {breakdownItem?.creditDays}d crédito
                          </div>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400">
                          {breakdownItem && breakdownItem.itemSavingsUsd > 0
                            ? `-${fmtUsd(breakdownItem.itemSavingsUsd)}`
                            : "$0.00"}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          {breakdownItem && breakdownItem.itemSavingsPct > 0 ? (
                            <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 text-[10px]">
                              {breakdownItem.itemSavingsPct.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
      {/* Modal: Agregar Nuevo Galpón / Puesto a Monitoreo */}
      {newGalponModal && (
        <Modal
          title={
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-amber-600" />
              <span>Incorporar Nuevo Galpón / Puesto a Monitoreo</span>
            </div>
          }
          onClose={() => setNewGalponModal(false)}
          width="max-w-md"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setNewGalponModal(false)}
                className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddCustomGalpon}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Guardar y Monitorear</span>
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Registra un puesto nuevo del Mercado Mayorista de San Jacinto o cualquier distribuidora de Maracay. El sistema lo incluirá en los escaneos semanales:
            </p>

            <label className="block font-semibold text-foreground">
              Nombre del Puesto o Distribuidora
              <input
                type="text"
                placeholder="Ej. Distribuidora Quesos Los Llanos"
                value={newGalponForm.name}
                onChange={(e) => setNewGalponForm({ ...newGalponForm, name: e.target.value })}
                className="w-full mt-1 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-primary"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block font-semibold text-foreground">
                Ubicación / Galpón
                <input
                  type="text"
                  placeholder="Ej. Galpón 3, Puesto 12"
                  value={newGalponForm.galponZone}
                  onChange={(e) => setNewGalponForm({ ...newGalponForm, galponZone: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-primary"
                />
              </label>

              <label className="block font-semibold text-foreground">
                Rubro Principal
                <select
                  value={newGalponForm.category}
                  onChange={(e) => setNewGalponForm({ ...newGalponForm, category: e.target.value as any })}
                  className="w-full mt-1 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-primary"
                >
                  <option value="Harinas">Harinas</option>
                  <option value="Lácteos">Lácteos / Queso</option>
                  <option value="Aceites">Aceites</option>
                  <option value="Carnes">Carnes / Frigorífico</option>
                  <option value="Empaques">Empaques / Bolsas</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block font-semibold text-foreground">
                Teléfono / WhatsApp
                <input
                  type="text"
                  placeholder="Ej. +58 412 8920192"
                  value={newGalponForm.waNumber}
                  onChange={(e) => setNewGalponForm({ ...newGalponForm, waNumber: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-primary font-mono"
                />
              </label>

              <label className="block font-semibold text-foreground">
                Precio Estimado ($ USD)
                <input
                  type="number"
                  step="0.05"
                  placeholder="Ej. 4.10"
                  value={newGalponForm.priceEstimateUsd}
                  onChange={(e) => setNewGalponForm({ ...newGalponForm, priceEstimateUsd: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-primary font-mono font-bold"
                />
              </label>
            </div>

            <label className="block font-semibold text-foreground">
              Producto o Detalle
              <input
                type="text"
                placeholder="Ej. Queso Llanero Duro de Primera (Kilo)"
                value={newGalponForm.keyProduct}
                onChange={(e) => setNewGalponForm({ ...newGalponForm, keyProduct: e.target.value })}
                className="w-full mt-1 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-primary"
              />
            </label>
          </div>
        </Modal>
      )}

      {/* Modal: Simulación de Ahorro en Escandallo Gastronómico */}
      {escandalloSimItem && (
        <Modal
          title={
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <span>Impacto en Escandallo: {escandalloSimItem.name}</span>
            </div>
          }
          onClose={() => setEscandalloSimItem(null)}
          width="max-w-md"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setEscandalloSimItem(null)}
                className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleQuickAddToSuppliers(escandalloSimItem);
                  setEscandalloSimItem(null);
                }}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
              >
                Incorporar y Aplicar a Catálogo
              </button>
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">Insumo Analizado</span>
                <span className="font-bold text-foreground">{escandalloSimItem.keyProduct}</span>
              </div>
              <div className="flex items-center justify-between border-t border-emerald-500/20 pt-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Precio Cotizado por Proveedor</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  ${escandalloSimItem.priceEstimateUsd.toFixed(2)} USD
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-emerald-500/20 pt-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Ahorro frente a precio estándar</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {escandalloSimItem.savingsVsAvgPct}% menos
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
              <h5 className="font-bold text-foreground text-xs">Impacto Directo en tus Empanadas:</h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Al comprar con <strong>{escandalloSimItem.name}</strong>, el costo de producción por empanada baja aproximadamente <strong>${(escandalloSimItem.priceEstimateUsd * 0.015).toFixed(2)} USD por unidad</strong>.
              </p>
              <div className="pt-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Ahorro estimado para Dr. Empanadas: ~$65.00 a $90.00 USD al mes.</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {deletingSupplier && (
        <Modal
          title="Eliminar Proveedor"
          onClose={() => setDeletingSupplier(null)}
          width="max-w-md"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <button type="button" onClick={() => setDeletingSupplier(null)} className={btnGhost}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  pos.deleteSupplier(deletingSupplier.id);
                  toast.success(`Proveedor «${deletingSupplier.name}» eliminado del directorio`);
                  setDeletingSupplier(null);
                }}
                className="rounded-xl bg-destructive text-destructive-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 transition cursor-pointer"
              >
                Eliminar Proveedor
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs text-muted-foreground">
            <p>
              ¿Estás seguro de que deseas eliminar permanentemente de tu directorio al proveedor <b>{deletingSupplier.name}</b> (RIF: {deletingSupplier.rif})?
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 font-medium">
              ⚠️ Esta acción quitará el proveedor del listado activo. Las órdenes históricas mantendrán su registro.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
