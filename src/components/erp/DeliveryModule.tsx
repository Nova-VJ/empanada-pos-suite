import { useState, useMemo } from "react";
import {
  Bike,
  MessageSquare,
  PhoneCall,
  MapPin,
  Navigation,
  Send,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Check,
  Camera,
  RefreshCw,
  Trash2,
  Edit,
  DollarSign,
  UserCheck,
  Smartphone,
  QrCode,
  Sparkles,
  Info,
  ShoppingBag,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";
import type { DeliveryOrder } from "@/types/pos";
import { Modal, btnGhost, btnPrimary, inputCls } from "../pos/Modal";
import {
  openWhatsApp,
  normalizeWhatsAppPhone,
  isWhatsAppGroupLink,
  buildRidersGroupDeliveryMessage,
  buildCashierNotificationMessage,
  buildDeliveredCustomerMessage,
} from "@/lib/whatsapp";
import { matchesSearch } from "@/lib/search";
import { WhatsAppConnectionHub } from "./WhatsAppConnectionHub";

export function DeliveryModule() {
  const pos = usePos();
  const { deliveries, rate, companySettings } = pos;

  const [tab, setTab] = useState<"active" | "connections" | "riders">("active");
  const [statusFilter, setStatusFilter] = useState<"todos" | "delivery" | "pickup" | "pendiente" | "en_camino" | "entregado">("todos");
  const [search, setSearch] = useState("");
  const [modalNew, setModalNew] = useState(false);
  const [autoDeleteDelivered, setAutoDeleteDelivered] = useState(true);
  const [newRiderName, setNewRiderName] = useState("");

  // Nuevo delivery manual form
  const [form, setForm] = useState({
    serviceType: "delivery" as "delivery" | "pickup",
    clientName: "",
    clientPhone: "0412-",
    addressGps: "",
    mapsUrl: "",
    itemsText: "",
    totalUsd: "5.00",
    paymentMethod: "Pago Móvil Banesco",
    paymentReference: "",
    riderName: "Alfonzo Bolaños",
    notes: "",
  });

  const ridersList = companySettings.activeRiders || ["Alfonzo Bolaños", "Ezequiel Girón", "Pedro Motorizado", "Luis Express"];
  const deliveryGroupPhone = companySettings.deliveryGroupPhone || "https://chat.whatsapp.com/Hzy4BgdplZpl4lZ19hcx9T";
  const cashierPhone = companySettings.cashierPhone || "+58 414-4926284";

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      if (statusFilter === "delivery" && d.serviceType === "pickup") return false;
      if (statusFilter === "pickup" && d.serviceType !== "pickup") return false;
      if (statusFilter === "pendiente" && d.status !== "pendiente") return false;
      if (statusFilter === "en_camino" && d.status !== "en_camino") return false;
      if (statusFilter === "entregado" && d.status !== "entregado") return false;

      if (search.trim()) {
        const q = search.trim();
        const matchName = matchesSearch(d.clientName, q);
        const matchPhone = matchesSearch(d.clientPhone, q);
        const matchAddress = matchesSearch(d.addressGps, q);
        const matchRider = matchesSearch(d.riderName, q);
        const matchItems = matchesSearch(d.itemsText, q);
        if (!matchName && !matchPhone && !matchAddress && !matchRider && !matchItems) return false;
      }
      return true;
    });
  }, [deliveries, statusFilter, search]);

  const counts = useMemo(() => {
    const pendientes = deliveries.filter((d) => d.status === "pendiente").length;
    const enCamino = deliveries.filter((d) => d.status === "en_camino").length;
    const entregados = deliveries.filter((d) => d.status === "entregado").length;
    const onlyDeliveries = deliveries.filter((d) => d.serviceType !== "pickup").length;
    const onlyPickups = deliveries.filter((d) => d.serviceType === "pickup").length;
    const totalUsd = deliveries
      .filter((d) => d.status !== "cancelado")
      .reduce((sum, d) => sum + d.totalUsd, 0);
    return { pendientes, enCamino, entregados, onlyDeliveries, onlyPickups, totalUsd };
  }, [deliveries]);

  // Manejar envío al grupo de motorizados de WhatsApp
  function handleSendToGroup(delivery: DeliveryOrder) {
    const msg = buildRidersGroupDeliveryMessage({
      orderNumber: delivery.orderNumber,
      clientName: delivery.clientName,
      clientPhone: delivery.clientPhone,
      addressGps: delivery.addressGps,
      mapsUrl: delivery.mapsUrl,
      itemsText: delivery.itemsText,
      totalUsd: delivery.totalUsd,
      totalBs: delivery.totalBs,
      paymentMethod: delivery.paymentMethod,
      paymentReference: delivery.paymentReference,
      riderName: delivery.riderName,
    });
    openWhatsApp({ phone: deliveryGroupPhone, message: msg });
    if (isWhatsAppGroupLink(deliveryGroupPhone)) {
      toast.success(`📋 Comanda #${delivery.orderNumber} copiada al portapapeles. ¡Pégala en el chat de WhatsApp del grupo!`);
    } else {
      toast.success(`Comanda #${delivery.orderNumber} enviada al Grupo de WhatsApp de Motorizados`);
    }
  }

  // Notificar a la cajera ("Va vía el delivery")
  function handleNotifyCashier(delivery: DeliveryOrder) {
    const msg = buildCashierNotificationMessage({
      orderNumber: delivery.orderNumber,
      clientName: delivery.clientName,
      riderName: delivery.riderName,
    });
    openWhatsApp({ phone: cashierPhone, message: msg });
    toast.success(`Notificación enviada a la cajera: «Va vía el delivery con ${delivery.riderName}»`);
  }

  // Marcar como en camino
  function handleMarkOnTheWay(delivery: DeliveryOrder) {
    pos.updateDelivery(delivery.id, {
      status: "en_camino",
      dispatchedAt: Date.now(),
    });
    toast.success(`🚨 Comanda #${delivery.orderNumber} en camino con ${delivery.riderName}`);
    // Notificar al cliente por WhatsApp
    const clientMsg = `🛵 *¡HOLA ${delivery.clientName.toUpperCase()}! TU PEDIDO VA EN CAMINO*\nNuestro motorizado *${delivery.riderName}* ya va saliendo con tus empanadas calientitas.\n¡Estamos muy cerca! 🥟✨`;
    openWhatsApp({ phone: delivery.clientPhone, message: clientMsg });
  }

  // Marcar como entregado (con opción de auto-eliminar si está activo)
  function handleMarkDelivered(delivery: DeliveryOrder) {
    if (autoDeleteDelivered) {
      pos.deleteDelivery(delivery.id);
      toast.success(`🎉 ¡Comanda #${delivery.orderNumber} entregada y limpiada de la pantalla!`);
    } else {
      pos.updateDelivery(delivery.id, {
        status: "entregado",
        deliveredAt: Date.now(),
      });
      toast.success(`🎉 ¡Comanda #${delivery.orderNumber} entregada con éxito!`, {
        description: "Puedes eliminarla de la lista con el botón de papelera.",
      });
    }

    if (delivery.serviceType !== "pickup") {
      const msg = buildDeliveredCustomerMessage({
        orderNumber: delivery.orderNumber,
        clientName: delivery.clientName,
        riderName: delivery.riderName,
      });
      openWhatsApp({ phone: delivery.clientPhone, message: msg });
    }
  }

  function handleCreateManualDelivery() {
    if (!form.clientName.trim()) {
      toast.error("Por favor ingresa el nombre del cliente");
      return;
    }
    const isPickup = form.serviceType === "pickup";
    const totalUsd = parseFloat(form.totalUsd) || 5.0;
    const finalAddress = isPickup
      ? "🛍️ Retiro en Tienda / Mostrador San Jacinto"
      : form.addressGps.trim() || "San Jacinto, Maracay";
    const mapsUrl = isPickup
      ? ""
      : form.mapsUrl.trim() ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(finalAddress + " Aragua Venezuela")}`;

    const newDel = pos.createDelivery({
      clientName: form.clientName.trim(),
      clientPhone: form.clientPhone.trim(),
      addressGps: finalAddress,
      mapsUrl,
      itemsText: form.itemsText.trim() || "Empanadas surtidas",
      totalUsd,
      totalBs: Math.round(totalUsd * rate * 100) / 100,
      paymentMethod: form.paymentMethod,
      paymentReference: form.paymentReference.trim(),
      riderName: isPickup ? "🛍️ Retiro en Tienda (Pickup)" : form.riderName,
      status: "pendiente",
      serviceType: form.serviceType,
      notes: form.notes.trim(),
    });

    toast.success(
      isPickup
        ? `🛍️ Pedido Pickup #${newDel.orderNumber} registrado para mostrador`
        : `🛵 Delivery #${newDel.orderNumber} registrado con éxito`
    );
    setModalNew(false);
    setForm({
      serviceType: "delivery",
      clientName: "",
      clientPhone: "0412-",
      addressGps: "",
      mapsUrl: "",
      itemsText: "",
      totalUsd: "5.00",
      paymentMethod: "Pago Móvil Banesco",
      paymentReference: "",
      riderName: ridersList[0] || "Alfonzo Bolaños",
      notes: "",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header & Métricas */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl">
              🛵
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Control de Deliverys & Despacho</h2>
              <p className="text-xs text-muted-foreground">
                Pedidos en vivo por WhatsApp, despachos para motorizados y retiros Pickup en mostrador
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setModalNew(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-2 text-xs font-bold shadow-xs hover:bg-primary/90 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Nuevo Pedido / Delivery</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase">Pendientes Despacho</div>
          <div className="text-2xl font-black text-amber-500 mt-1">{counts.pendientes}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">En cocina o listos para salir</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase">En Camino (En Moto)</div>
          <div className="text-2xl font-black text-blue-500 mt-1">{counts.enCamino}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Con repartidores activos</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase">Entregados Hoy</div>
          <div className="text-2xl font-black text-emerald-500 mt-1">{counts.entregados}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Clientes satisfechos</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase">Total Facturado</div>
          <div className="text-2xl font-black text-foreground mt-1 font-mono">
            ${counts.totalUsd.toFixed(2)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
            Bs. {(counts.totalUsd * rate).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex gap-1.5 flex-wrap">
          {[
            { id: "active", label: `🛵 Deliverys & Pickups (${deliveries.length})`, icon: Bike },
            { id: "connections", label: "🔗 Conexión WhatsApp en Vivo (QR & Meta API)", icon: QrCode },
            { id: "riders", label: `👥 Motorizados & Grupos (${ridersList.length})`, icon: UserCheck },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Acciones de limpieza de pantalla */}
        {tab === "active" && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {counts.entregados > 0 && (
              <button
                type="button"
                onClick={() => {
                  pos.clearDeliveredDeliveries();
                  toast.success(`Se limpiaron ${counts.entregados} pedidos entregados de la pantalla`);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive hover:text-white px-2.5 py-1 text-xs font-bold transition cursor-pointer"
                title="Quitar todos los pedidos ya entregados para dejar la vista limpia"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Limpiar Entregados ({counts.entregados})</span>
              </button>
            )}

            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoDeleteDelivered}
                onChange={(e) => setAutoDeleteDelivered(e.target.checked)}
                className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <span>Auto-limpiar al entregar</span>
            </label>
          </div>
        )}
      </div>

      {/* Tab 1: Deliverys & Pickups Activos */}
      {tab === "active" && (
        <div className="space-y-4 animate-in fade-in-50">
          {/* Barra de Filtros y Búsqueda */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente, teléfono, motorizado o dirección..."
                className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-3 text-xs font-medium text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {[
                { id: "todos", label: `Todos (${deliveries.length})` },
                { id: "delivery", label: `🛵 Deliverys (${counts.onlyDeliveries})` },
                { id: "pickup", label: `🛍️ Pickups (${counts.onlyPickups})` },
                { id: "pendiente", label: `🟡 Pendientes (${counts.pendientes})` },
                { id: "en_camino", label: `🔵 En Moto (${counts.enCamino})` },
                { id: "entregado", label: `🟢 Entregados (${counts.entregados})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as typeof statusFilter)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    statusFilter === f.id
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Tarjetas de Delivery */}
          {filteredDeliveries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-2">
              <Bike className="h-10 w-10 text-muted-foreground mx-auto" />
              <div className="font-bold text-foreground text-sm">No hay pedidos pendientes en esta sección</div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Tu pantalla está limpia. Al cobrar pedidos «Para Llevar» o «Pickup» en el TPV, o al vincular tu WhatsApp,
                los pedidos caerán automáticamente en esta lista.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDeliveries.map((del) => {
                const isPickup = del.serviceType === "pickup";
                return (
                  <div
                    key={del.id}
                    className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-xs hover:border-primary/40 transition flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      {/* Header de la tarjeta */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-primary">#{del.orderNumber}</span>
                            <h4 className="font-bold text-foreground text-sm truncate">{del.clientName}</h4>
                            {isPickup && (
                              <span className="rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold px-2 py-0.2 text-[9px] uppercase tracking-wide">
                                🛍️ Pickup
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <PhoneCall className="h-3 w-3" />
                            <a href={`tel:${del.clientPhone}`} className="hover:underline font-mono">
                              {del.clientPhone}
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              del.status === "en_camino"
                                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 animate-pulse"
                                : del.status === "entregado"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {del.status === "en_camino"
                              ? "🛵 En Camino"
                              : del.status === "entregado"
                              ? "✅ Entregado"
                              : "⏳ Pendiente"}
                          </span>

                          {/* Botón para eliminar individualmente cualquier delivery */}
                          <button
                            type="button"
                            onClick={() => {
                              pos.deleteDelivery(del.id);
                              toast.success(`Pedido #${del.orderNumber} eliminado de la pantalla`);
                            }}
                            className="h-6 w-6 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-destructive flex items-center justify-center transition cursor-pointer"
                            title="Eliminar este pedido de la pantalla"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Dirección con enlace GPS o Mostrador */}
                      <div className="rounded-xl bg-secondary/50 p-2.5 space-y-1.5">
                        <div className="flex items-start gap-1.5">
                          {isPickup ? (
                            <Store className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                          ) : (
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          )}
                          <span className="text-[11px] text-foreground font-medium leading-tight">
                            {del.addressGps}
                          </span>
                        </div>
                        {!isPickup && del.mapsUrl && (
                          <a
                            href={del.mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-primary font-bold hover:underline"
                          >
                            <Navigation className="h-3 w-3" />
                            <span>Abrir Ubicación en Google Maps (GPS)</span>
                          </a>
                        )}
                      </div>

                      {/* Detalle del pedido */}
                      <div className="rounded-xl border border-border/80 p-2.5 bg-background/50 space-y-1">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">Pedido:</div>
                        <div className="text-xs text-foreground font-semibold leading-relaxed">
                          {del.itemsText}
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                          <span className="text-muted-foreground font-medium">{del.paymentMethod}</span>
                          <div className="text-right">
                            <span className="font-mono font-bold text-foreground">{fmtUsd(del.totalUsd)}</span>
                            <span className="text-[10px] text-muted-foreground ml-1">({fmtBs(del.totalBs)})</span>
                          </div>
                        </div>
                      </div>

                      {/* Motorizado asignado (solo si es delivery) */}
                      {!isPickup ? (
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-muted-foreground font-medium flex items-center gap-1">
                            <Bike className="h-3.5 w-3.5 text-primary" />
                            Repartidor:
                          </span>
                          <select
                            value={del.riderName}
                            onChange={(e) => pos.updateDelivery(del.id, { riderName: e.target.value })}
                            className="rounded-lg border border-input bg-background py-1 px-2 text-xs font-bold text-foreground outline-none focus:border-primary"
                          >
                            {ridersList.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 pt-1 font-medium">
                          <span>🏪 Retiro en mostrador por el cliente</span>
                        </div>
                      )}
                    </div>

                    {/* Botones de acción directa */}
                    <div className="space-y-1.5 pt-3 border-t border-border">
                      {isPickup ? (
                        del.status !== "entregado" ? (
                          <button
                            type="button"
                            onClick={() => handleMarkDelivered(del)}
                            className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>✅ ¡CLIENTE RETIRÓ EL PEDIDO!</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              pos.deleteDelivery(del.id);
                              toast.success(`Pedido #${del.orderNumber} eliminado de la pantalla`);
                            }}
                            className="w-full rounded-xl border border-border bg-secondary hover:bg-red-500/10 hover:text-red-500 text-muted-foreground py-1.5 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Eliminar de la Pantalla</span>
                          </button>
                        )
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSendToGroup(del)}
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-2 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                              title="Enviar comanda completa con GPS al grupo de WhatsApp"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>Grupo WhatsApp</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleNotifyCashier(del)}
                              className="rounded-xl border border-border bg-card hover:bg-secondary text-foreground py-1.5 px-2 text-[11px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                              title="Avisar a la cajera que va saliendo el motorizado"
                            >
                              <span>Avisar Cajera</span>
                            </button>
                          </div>

                          {del.status === "pendiente" && (
                            <button
                              type="button"
                              onClick={() => handleMarkOnTheWay(del)}
                              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            >
                              <Navigation className="h-3.5 w-3.5" />
                              <span>🚨 ¡MOTORIZADO EN CAMINO!</span>
                            </button>
                          )}

                          {del.status === "en_camino" && (
                            <button
                              type="button"
                              onClick={() => handleMarkDelivered(del)}
                              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>✅ ¡PEDIDO ENTREGADO!</span>
                            </button>
                          )}

                          {del.status === "entregado" && (
                            <button
                              type="button"
                              onClick={() => {
                                pos.deleteDelivery(del.id);
                                toast.success(`Pedido #${del.orderNumber} eliminado de la pantalla`);
                              }}
                              className="w-full rounded-xl border border-border bg-secondary hover:bg-red-500/10 hover:text-red-500 text-muted-foreground py-1.5 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Eliminar de la Pantalla</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Conexión WhatsApp en Vivo (QR & Meta API) */}
      {tab === "connections" && (
        <div className="animate-in fade-in-50">
          <WhatsAppConnectionHub
            onSimulateOrder={() => {
              setTab("active");
            }}
          />
        </div>
      )}

      {/* Tab 3: Configuración de Canales y Repartidores */}
      {tab === "riders" && (
        <div className="rounded-2xl border border-border bg-card p-5 max-w-2xl space-y-4 shadow-xs animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <div>
              <h3 className="font-bold text-foreground text-sm">Configuración de Canales y Repartidores</h3>
              <p className="text-xs text-muted-foreground">
                Ajusta los enlaces y teléfonos para que los botones de WhatsApp abran directamente los chats correspondientes:
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                👥 Enlace del Grupo de WhatsApp o Teléfono («Delivery Dr Empanadas»):
              </label>
              <input
                type="text"
                value={deliveryGroupPhone}
                onChange={(e) => pos.updateCompanySettings({ deliveryGroupPhone: e.target.value })}
                className={inputCls}
                placeholder="https://chat.whatsapp.com/Hzy4BgdplZpl4lZ19hcx9T o 584144969484"
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">
                💡 <strong>Si pegas el link de invitación (chat.whatsapp.com):</strong> Al pulsar «Grupo WhatsApp», el sistema copiará automáticamente el texto del pedido al portapapeles y te abrirá el grupo en WhatsApp para pulsar <em>Pegar</em>.
              </span>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                🏪 Teléfono de la Cajera / Local (María Dr Empanadas):
              </label>
              <input
                type="text"
                value={cashierPhone}
                onChange={(e) => pos.updateCompanySettings({ cashierPhone: e.target.value })}
                className={inputCls}
                placeholder="+58 414-4926284"
              />
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Para avisarle automáticamente: «Va vía el delivery con [Motorizado]».
              </span>
            </div>

            <div className="border-t border-border pt-3">
              <label className="font-semibold text-foreground block mb-1">
                🛵 Motorizados de Guardia (Repartidores Activos):
              </label>
              <p className="text-[11px] text-muted-foreground mb-2">
                Lista de repartidores disponibles para asignar en los deliverys:
              </p>

              {/* Badges interactivos para cada repartidor */}
              <div className="flex flex-wrap gap-2 mb-3">
                {ridersList.map((rider, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs"
                  >
                    <span>🛵 {rider}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = ridersList.filter((_, i) => i !== idx);
                        pos.updateCompanySettings({ activeRiders: updated });
                        toast.info(`Repartidor ${rider} removido`);
                      }}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-4 w-4 flex items-center justify-center transition cursor-pointer ml-1"
                      title={`Eliminar ${rider}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              {/* Agregar nuevo motorizado fácilmente */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRiderName}
                  onChange={(e) => setNewRiderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newRiderName.trim()) {
                        pos.updateCompanySettings({ activeRiders: [...ridersList, newRiderName.trim()] });
                        setNewRiderName("");
                        toast.success(`Repartidor ${newRiderName.trim()} agregado`);
                      }
                    }
                  }}
                  className={inputCls}
                  placeholder="Escribe el nombre del nuevo motorizado (ej: Alfonzo Bolaños)"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newRiderName.trim()) {
                      toast.error("Ingresa el nombre del repartidor");
                      return;
                    }
                    pos.updateCompanySettings({ activeRiders: [...ridersList, newRiderName.trim()] });
                    setNewRiderName("");
                    toast.success(`Repartidor ${newRiderName.trim()} agregado`);
                  }}
                  className="rounded-xl bg-primary text-primary-foreground px-4 py-2 font-bold text-xs shrink-0 hover:bg-primary/90 transition shadow-xs cursor-pointer"
                >
                  + Agregar
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => toast.success("Configuración de Canales y Repartidores guardada exitosamente")}
                className="rounded-xl bg-emerald-600 text-white px-5 py-2 text-xs font-bold shadow-xs hover:bg-emerald-700 transition cursor-pointer"
              >
                ✓ Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Delivery Manual */}
      {modalNew && (
        <Modal
          title="🛵 Registrar Nuevo Pedido (Delivery / Pickup)"
          onClose={() => setModalNew(false)}
          width="max-w-lg"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <button type="button" onClick={() => setModalNew(false)} className={btnGhost}>
                Cancelar
              </button>
              <button type="button" onClick={handleCreateManualDelivery} className={btnPrimary}>
                Guardar y Despachar
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            {/* Tipo de servicio: Delivery vs Pickup */}
            <div>
              <label className="font-semibold text-foreground block mb-1">Tipo de Servicio:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, serviceType: "delivery" })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    form.serviceType === "delivery"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <Bike className="h-4 w-4" />
                  <span>🛵 Delivery a Domicilio</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      serviceType: "pickup",
                      addressGps: "🛍️ Retiro en Tienda / Mostrador San Jacinto",
                      riderName: "🛍️ Retiro en Tienda (Pickup)",
                    })
                  }
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    form.serviceType === "pickup"
                      ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <Store className="h-4 w-4" />
                  <span>🛍️ Retiro en Tienda (Pickup)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">Nombre del Cliente *:</label>
                <input
                  type="text"
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  className={inputCls}
                  placeholder="Ej: Juan Carlos"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Teléfono WhatsApp:</label>
                <input
                  type="text"
                  value={form.clientPhone}
                  onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                  className={inputCls}
                  placeholder="0414-1234567"
                />
              </div>
            </div>

            {form.serviceType === "delivery" && (
              <div>
                <label className="font-semibold text-foreground block mb-1">Dirección / Coordenadas GPS *:</label>
                <input
                  type="text"
                  value={form.addressGps}
                  onChange={(e) => setForm({ ...form, addressGps: e.target.value })}
                  className={inputCls}
                  placeholder="Ej: Urb. San Jacinto, Manzana 3, Casa 12 / Link de Google Maps"
                />
              </div>
            )}

            <div>
              <label className="font-semibold text-foreground block mb-1">Detalle del Pedido *:</label>
              <textarea
                rows={3}
                value={form.itemsText}
                onChange={(e) => setForm({ ...form, itemsText: e.target.value })}
                className={inputCls}
                placeholder="Ej: 3x Empanada Mechada, 1x Empanada Queso, 2x Maltas bien frías"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">Total ($ USD):</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.totalUsd}
                  onChange={(e) => setForm({ ...form, totalUsd: e.target.value })}
                  className={`${inputCls} font-mono font-bold`}
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Forma de Pago:</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className={inputCls}
                >
                  <option value="Pago Móvil Banesco">Pago Móvil Banesco</option>
                  <option value="Pago Móvil Mercantil">Pago Móvil Mercantil</option>
                  <option value="Efectivo USD $">Efectivo USD $</option>
                  <option value="Efectivo Bolívares">Efectivo Bolívares</option>
                  <option value="Zelle">Zelle</option>
                </select>
              </div>

              {form.serviceType === "delivery" && (
                <div>
                  <label className="font-semibold text-foreground block mb-1">Motorizado:</label>
                  <select
                    value={form.riderName}
                    onChange={(e) => setForm({ ...form, riderName: e.target.value })}
                    className={inputCls}
                  >
                    {ridersList.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Referencia o Nota:</label>
              <input
                type="text"
                value={form.paymentReference}
                onChange={(e) => setForm({ ...form, paymentReference: e.target.value })}
                className={inputCls}
                placeholder="Ej: Ref 8912 / Pagar al recibir"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
