import { useState } from "react";
import {
  Rocket,
  Building2,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Sparkles,
  Store,
  FileCheck,
  Receipt,
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { Modal, btnGhost, btnPrimary, inputCls } from "./Modal";

interface BusinessSetupWizardModalProps {
  onClose: () => void;
}

export function BusinessSetupWizardModal({ onClose }: BusinessSetupWizardModalProps) {
  const pos = usePos();
  const current = pos.companySettings;

  const [name, setName] = useState(current.name || "Dr. Empanadas C.A.");
  const [rif, setRif] = useState(current.rif || "J-50123456-7");
  const [city, setCity] = useState(current.city || "Maracay, Edo. Aragua");
  const [address, setAddress] = useState(
    current.address || "Av. Bolívar Este c/c Av. Principal de San Jacinto, Maracay"
  );
  const [branch, setBranch] = useState(current.branch || "Sede Principal");
  const [phone, setPhone] = useState(current.phone || "0412-1234567");
  const [email, setEmail] = useState(current.email || "administracion@minegocio.com");
  const [footerMessage, setFooterMessage] = useState(
    current.ticketConfig?.footerMessage || `¡Gracias por preferir a ${current.name || "nosotros"}! Vuelva pronto 🥟`
  );
  const [businessType, setBusinessType] = useState<string>(current.businessType || "empanadas");

  // Mode: Keep products and reset sales to $0, or complete blank slate
  const [demoAction, setDemoAction] = useState<"clean_sales" | "blank_catalog" | "keep_all">(
    current.isLive ? "keep_all" : "clean_sales"
  );

  const presets = [
    { id: "empanadas", label: "🥟 Empanadas / Frituras", defaultName: "Dr. Empanadas C.A.", footer: "¡Gracias por preferir a Dr. Empanadas! Vuelva pronto 🥟" },
    { id: "bakery", label: "🥖 Panadería & Pastelería", defaultName: "Panadería & Pastelería Central C.A.", footer: "¡El mejor pan caliente todos los días! Gracias por su compra 🥖" },
    { id: "pizzeria", label: "🍕 Pizzería / Restaurante", defaultName: "Pizzería & Trattoria La Tradición", footer: "¡Buen provecho! Gracias por preferirnos 🍕" },
    { id: "store", label: "🛒 Minimarket / Abasto", defaultName: "Víveres & Minimarket Express C.A.", footer: "¡Gracias por su compra! Vuelva pronto 🛒" },
    { id: "general", label: "🏪 Comercio General", defaultName: "Inversiones Comerciales C.A.", footer: "¡Muchas gracias por su preferencia!" },
  ];

  function applyPreset(p: typeof presets[0]) {
    setBusinessType(p.id);
    if (!current.isLive || name === "Dr. Empanadas C.A.") {
      setName(p.defaultName);
      setFooterMessage(p.footer);
    }
  }

  function handleSaveSettings() {
    if (!name.trim()) {
      toast.error("Por favor ingresa el nombre de tu negocio");
      return;
    }

    // 1. Update company settings and mark system as real / live
    pos.updateCompanySettings({
      name: name.trim(),
      rif: rif.trim().toUpperCase(),
      city: city.trim(),
      address: address.trim(),
      branch: branch.trim(),
      phone: phone.trim(),
      email: email.trim(),
      businessType,
      isConfigured: true,
      isLive: true,
      ticketConfig: {
        ...(pos.companySettings.ticketConfig || {
          width: "80mm",
          density: "normal",
          showLogo: true,
          showFiscalData: true,
          showTaxBreakdown: true,
          showBcvRate: true,
          autoCut: true,
        }),
        footerMessage: footerMessage.trim() || `¡Gracias por su compra en ${name.trim()}! Vuelva pronto`,
      },
    });

    // 2. Process Demo Clean-up Action
    if (demoAction === "clean_sales") {
      pos.clearDemoOrders?.();
      toast.success(`🎉 ¡Modo Real Activado! Caja reiniciada a $0.00 para ${name.trim()}.`);
    } else if (demoAction === "blank_catalog") {
      pos.clearDemoOrders?.();
      pos.clearAllProducts?.();
      toast.success(`🎉 ¡Modo Real Activado! Catálogo limpio listo para ingresar los productos de ${name.trim()}.`);
    } else {
      toast.success(`✨ ¡Datos de tu empresa actualizados con éxito para ${name.trim()}!`);
    }

    onClose();
  }

  return (
    <Modal
      title={current.isLive ? `🏪 Personalizar Datos del Negocio: ${current.name}` : "🚀 Configura tus Datos Reales (Activar Modo Real)"}
      onClose={onClose}
      className="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Top welcome explanation */}
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 flex items-start gap-3 text-xs">
          <div className="text-2xl shrink-0">🏪</div>
          <div className="space-y-1">
            <h4 className="font-bold text-foreground text-sm">
              {current.isLive ? "Personalización de Empresa & Marca" : "¡Personaliza tu sistema y activa el Modo Real!"}
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Ingresa los datos fiscales y comerciales de tu negocio. Los tickets impresos, facturas SENIAT, WhatsApp de comandas, reportes de cierre Z y pantallas adoptarán automáticamente este nombre.
            </p>
          </div>
        </div>

        {/* Quick Presets for Business Type */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Rubro o Tipo de Negocio:
          </label>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                  businessType === p.id
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-secondary/70 border-border text-foreground hover:bg-secondary"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-primary" />
              Nombre Comercial / Empresa:
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Dr. Empanadas C.A., Panadería San José, Pizzería Roma..."
              className={`${inputCls} font-bold text-sm`}
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <FileCheck className="h-3.5 w-3.5 text-primary" />
              RIF del Negocio (SENIAT):
            </label>
            <input
              value={rif}
              onChange={(e) => setRif(e.target.value)}
              placeholder="J-50123456-7 o V-12345678-0"
              className={`${inputCls} font-mono`}
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary" />
              Teléfono / WhatsApp de Pedidos:
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0412-1234567"
              className={inputCls}
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Ciudad y Estado:
            </label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Maracay, Edo. Aragua (o cualquier ciudad)"
              className={inputCls}
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Sucursal / Punto de Venta:
            </label>
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="Sede Principal / Sucursal San Jacinto"
              className={inputCls}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Dirección Detallada (Aparecerá en los Tickets de Caja):
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Av. Bolívar Este, Local 01, Maracay"
              className={inputCls}
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-primary" />
              Correo Electrónico (Reportes automáticos de cierre Z):
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucomercio@gmail.com"
              className={inputCls}
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-primary" />
              Mensaje al Pie del Ticket:
            </label>
            <input
              value={footerMessage}
              onChange={(e) => setFooterMessage(e.target.value)}
              placeholder="¡Gracias por su compra! Vuelva pronto"
              className={inputCls}
            />
          </div>
        </div>

        {/* Demo Clean-Up Selector */}
        <div className="rounded-2xl border border-border bg-secondary/50 p-4 space-y-2.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <RefreshCw className="h-4 w-4 text-emerald-500" />
            ¿Qué deseas hacer con las ventas y productos de muestra?
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setDemoAction("clean_sales")}
              className={`p-3 rounded-xl border text-left transition text-xs space-y-1 ${
                demoAction === "clean_sales"
                  ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span>⭐ Recomendado</span>
              </div>
              <div className="font-semibold text-foreground">Limpiar Ventas ($0.00)</div>
              <p className="text-[10px] text-muted-foreground">
                Inicia la caja en cero ($0.00) para facturar ventas reales hoy, conservando los productos cargados.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setDemoAction("blank_catalog")}
              className={`p-3 rounded-xl border text-left transition text-xs space-y-1 ${
                demoAction === "blank_catalog"
                  ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="font-bold flex items-center gap-1 text-primary">
                <span>📦 En Blanco</span>
              </div>
              <div className="font-semibold text-foreground">Catálogo Limpio</div>
              <p className="text-[10px] text-muted-foreground">
                Elimina productos y ventas de prueba para que ingreses tu propio menú o inventario desde cero.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setDemoAction("keep_all")}
              className={`p-3 rounded-xl border text-left transition text-xs space-y-1 ${
                demoAction === "keep_all"
                  ? "border-amber-500 bg-amber-500/10 text-foreground ring-1 ring-amber-500"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="font-bold flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span>🔍 Conservar</span>
              </div>
              <div className="font-semibold text-foreground">Mantener Muestras</div>
              <p className="text-[10px] text-muted-foreground">
                Deja los datos y ventas de prueba intactos para seguir explorando los reportes.
              </p>
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            className={`${btnPrimary} flex items-center gap-2`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{current.isLive ? "Guardar Cambios del Negocio" : "Guardar y Activar Modo Real"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
