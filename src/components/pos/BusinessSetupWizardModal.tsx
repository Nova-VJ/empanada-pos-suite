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
  const [city, setCity] = useState(current.city || "San Jacinto, Maracay, Edo. Aragua");
  const [address, setAddress] = useState(
    current.address || "Av. Bolívar Este c/c Av. Principal de San Jacinto, Maracay"
  );
  const [branch, setBranch] = useState(current.branch || "Sucursal San Jacinto");
  const [phone, setPhone] = useState(current.phone || "0412-1234567");
  const [email, setEmail] = useState(current.email || "drempanadas.mcy@gmail.com");

  // Mode: Keep products and reset sales to $0, or complete blank slate
  const [demoAction, setDemoAction] = useState<"clean_sales" | "blank_catalog" | "keep_all">(
    "clean_sales"
  );

  function handleSaveSettings() {
    if (!name.trim()) {
      toast.error("Por favor ingresa el nombre de tu negocio");
      return;
    }

    // 1. Update company settings
    pos.updateCompanySettings({
      name: name.trim(),
      rif: rif.trim().toUpperCase(),
      city: city.trim(),
      address: address.trim(),
      branch: branch.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });

    // 2. Process Demo Clean-up Action
    if (demoAction === "clean_sales") {
      // Clear demo orders and reset shift to zero
      pos.clearDemoOrders?.();
      toast.success("✨ ¡Configuración lista! Ventas demo reiniciadas a $0.00 para empezar hoy.");
    } else if (demoAction === "blank_catalog") {
      pos.clearDemoOrders?.();
      toast.success("✨ ¡Configuración lista con catálogo listo para tus productos!");
    } else {
      toast.success("✨ ¡Datos de tu negocio actualizados con éxito!");
    }

    onClose();
  }

  return (
    <Modal
      title="🚀 Puesta en Marcha: Configura tus Datos Reales (Dejar Demo)"
      onClose={onClose}
      className="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Top welcome explanation */}
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 flex items-start gap-3 text-xs">
          <div className="text-2xl shrink-0">📍</div>
          <div className="space-y-1">
            <h4 className="font-bold text-foreground text-sm">
              ¡Bienvenido a bordo! Deja atrás los datos de prueba
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Ingresa los datos de tu comercio en <strong>San Jacinto, Maracay</strong> para que los
              tickets, facturas SENIAT, arqueos de caja y promociones salgan automáticamente con el nombre
              y RIF de tu empresa.
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-primary" />
              Nombre Comercial / Razón Social:
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Dr. Empanadas C.A."
              className={inputCls}
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
              placeholder="J-50123456-7"
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
              Ciudad y Zona:
            </label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="San Jacinto, Maracay, Edo. Aragua"
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
              placeholder="Sucursal San Jacinto"
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
              placeholder="Av. Bolívar Este c/c Av. Principal de San Jacinto, Maracay"
              className={inputCls}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
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
        </div>

        {/* Demo Clean-Up Selector */}
        <div className="rounded-2xl border border-border bg-secondary/50 p-4 space-y-2.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <RefreshCw className="h-4 w-4 text-emerald-500" />
            ¿Qué deseas hacer con las ventas y productos de prueba?
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
                Conserva los productos base (empanadas, pastelitos, bebidas) pero inicia la caja en cero
                para registrar ventas reales.
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
                Elimina productos y ventas de prueba para que ingreses tu propio menú desde cero.
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
                <span>🔍 Explorar</span>
              </div>
              <div className="font-semibold text-foreground">Mantener Demo</div>
              <p className="text-[10px] text-muted-foreground">
                Deja los datos de prueba intactos para seguir probando los reportes y módulos.
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
            <span>Guardar y Empezar a Facturar</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
