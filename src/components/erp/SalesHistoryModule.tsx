import { useState, useMemo } from "react";
import {
  Search,
  FileText,
  Printer,
  Edit3,
  XCircle,
  Eye,
  CheckCircle2,
  Calendar,
  Filter,
  DollarSign,
  CreditCard,
  Phone,
  User,
  ShoppingBag,
  ArrowUpDown,
  Share2,
  Save,
  Clock,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";
import type { Order, OrderType, PaymentType } from "@/types/pos";
import { Modal, btnGhost, btnPrimary, btnDanger, inputCls } from "../pos/Modal";
import { matchesSearch } from "@/lib/search";
import { openWhatsApp, buildCustomerTicketWhatsApp } from "@/lib/whatsapp";

export function SalesHistoryModule() {
  const pos = usePos();
  const { orders, rate, shift, companySettings } = pos;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmada" | "anulada">("all");
  const [shiftFilter, setShiftFilter] = useState<"all" | "open" | "closed">("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [voidingOrder, setVoidingOrder] = useState<Order | null>(null);
  const [voidReason, setVoidReason] = useState("");

  // Edit form state
  const [editForm, setEditForm] = useState<{
    customerName: string;
    customerRif: string;
    customerPhone: string;
    orderType: OrderType;
    table: string;
    paymentType0: PaymentType;
    paymentRef0: string;
    paymentType1?: PaymentType;
    paymentRef1?: string;
  }>({
    customerName: "",
    customerRif: "",
    customerPhone: "",
    orderType: "dine_in",
    table: "",
    paymentType0: "usd_cash",
    paymentRef0: "",
  });

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // Status filter
        if (statusFilter !== "all") {
          const st = o.status || "confirmada";
          if (st !== statusFilter) return false;
        }

        // Shift filter (open shift has zNumber === undefined)
        if (shiftFilter === "open" && o.zNumber !== undefined) return false;
        if (shiftFilter === "closed" && o.zNumber === undefined) return false;

        // Payment filter
        if (paymentFilter !== "all") {
          const hasPayment = o.payments.some((p) => p.type === paymentFilter);
          if (!hasPayment) return false;
        }

        // Search text
        if (search.trim()) {
          const s = search.trim();
          const matchInvoice = matchesSearch(o.invoiceNo, s);
          const matchControl = matchesSearch(o.controlNo, s);
          const matchCustomer = matchesSearch(o.customer?.name || "", s) || matchesSearch(o.customer?.rif || "", s);
          const matchCashier = matchesSearch(o.cashier, s);
          const matchLines = o.lines.some((l) => matchesSearch(l.name, s));
          if (!matchInvoice && !matchControl && !matchCustomer && !matchCashier && !matchLines) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, statusFilter, shiftFilter, paymentFilter, search]);

  // Aggregate KPI metrics
  const activeOrders = useMemo(() => orders.filter((o) => o.status !== "anulada"), [orders]);
  const totalVolumeUsd = useMemo(() => activeOrders.reduce((sum, o) => sum + o.totalUsd, 0), [activeOrders]);
  const totalVolumeBs = useMemo(() => activeOrders.reduce((sum, o) => sum + o.totalBs, 0), [activeOrders]);
  const currentShiftOrders = useMemo(() => activeOrders.filter((o) => o.zNumber === undefined), [activeOrders]);
  const currentShiftUsd = useMemo(() => currentShiftOrders.reduce((sum, o) => sum + o.totalUsd, 0), [currentShiftOrders]);

  // Open edit modal
  function openEditModal(order: Order) {
    setEditingOrder(order);
    const p0 = order.payments[0];
    const p1 = order.payments[1];
    setEditForm({
      customerName: order.customer?.name || "",
      customerRif: order.customer?.rif || "",
      customerPhone: order.customer?.phone || "",
      orderType: order.type || "dine_in",
      table: order.table || "",
      paymentType0: p0?.type || "usd_cash",
      paymentRef0: p0?.reference || "",
      paymentType1: p1?.type,
      paymentRef1: p1?.reference || "",
    });
  }

  // Save edits to order
  function handleSaveOrderEdit() {
    if (!editingOrder) return;

    const updatedPayments = [...editingOrder.payments];
    if (updatedPayments[0]) {
      updatedPayments[0] = {
        ...updatedPayments[0],
        type: editForm.paymentType0,
        reference: editForm.paymentRef0.trim() || undefined,
      };
    }
    if (updatedPayments[1] && editForm.paymentType1) {
      updatedPayments[1] = {
        ...updatedPayments[1],
        type: editForm.paymentType1,
        reference: editForm.paymentRef1?.trim() || undefined,
      };
    }

    pos.updateOrder(editingOrder.id, {
      type: editForm.orderType,
      table: editForm.table.trim() || undefined,
      customer: {
        name: editForm.customerName.trim() || "Consumidor Final",
        rif: editForm.customerRif.trim() || "V-00000000",
        phone: editForm.customerPhone.trim() || undefined,
      },
      payments: updatedPayments,
    });

    toast.success(`Pedido #${editingOrder.invoiceNo} modificado exitosamente`);
    setEditingOrder(null);
  }

  // Void order
  function handleConfirmVoid() {
    if (!voidingOrder) return;
    pos.updateOrder(voidingOrder.id, {
      status: "anulada",
    });
    toast.success(`Factura #${voidingOrder.invoiceNo} anulada mediante Nota de Crédito`);
    setVoidingOrder(null);
    setVoidReason("");
  }

  // WhatsApp share
  function handleSendWhatsApp(order: Order) {
    const text = buildCustomerTicketWhatsApp(order, companySettings.name, companySettings.rif);
    openWhatsApp({ phone: order.customer?.phone, message: text });
  }

  // Reprint ticket
  function handleReprint(order: Order) {
    pos.setTicketOrderId(order.id);
    pos.setModal("ticket");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="h-7 w-7 text-primary" />
            <span>Ventas Realizadas & Historial de Pedidos</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Consulta, auditoría, reimpresión de tickets fiscales y modificación de pedidos anteriores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => pos.setModal("shift")}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition"
          >
            <Calendar className="h-4 w-4" />
            {shift.isOpen ? "Caja Abierta (Corte X/Z)" : "Caja Cerrada (Abrir Caja)"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Ventas Turno Actual</span>
            <Clock className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black font-mono text-foreground">{fmtUsd(currentShiftUsd)}</div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              {currentShiftOrders.length} tickets
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">{fmtBs(currentShiftUsd * rate)}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Volumen Histórico Total</span>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black font-mono text-foreground">{fmtUsd(totalVolumeUsd)}</div>
            <span className="text-xs font-mono text-muted-foreground font-bold">
              {activeOrders.length} tickets
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">{fmtBs(totalVolumeBs)}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Ticket Promedio</span>
            <Tag className="h-4 w-4 text-violet-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black font-mono text-foreground">
              {fmtUsd(activeOrders.length ? totalVolumeUsd / activeOrders.length : 0)}
            </div>
            <span className="text-xs font-mono text-muted-foreground">USD / venta</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">
            {fmtBs(activeOrders.length ? totalVolumeBs / activeOrders.length : 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Tasa BCV Aplicada</span>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black font-mono text-foreground">Bs. {rate.toFixed(2)}</div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              Oficial
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Dr. Empanadas C.A. · Maracay</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Nº Factura, Control, Cliente, RIF, Cajero o Producto..."
              className={`${inputCls} pl-10 text-xs`}
            />
          </div>

          <div>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value as typeof shiftFilter)}
              className={`${inputCls} text-xs`}
            >
              <option value="all">📅 Todos los turnos</option>
              <option value="open">🟢 Turno Actual (Sin Cierre Z)</option>
              <option value="closed">🔒 Turnos Cerrados (Con Cierre Z)</option>
            </select>
          </div>

          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className={`${inputCls} text-xs`}
            >
              <option value="all">💳 Todos los medios de pago</option>
              <option value="usd_cash">💵 Efectivo Dólares ($)</option>
              <option value="pago_movil">📲 Pago Móvil</option>
              <option value="pos_card">💳 Punto de Venta (Tarjeta)</option>
              <option value="bs_cash">🇻🇪 Efectivo Bolívares (Bs.)</option>
            </select>
          </div>
        </div>

        {/* Quick status tabs */}
        <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
          <div className="flex gap-2">
            {(
              [
                ["all", "Todas las Ventas"],
                ["confirmada", "Confirmadas / Válidas"],
                ["anulada", "Anuladas / Notas de Crédito"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`rounded-lg px-3 py-1.5 font-medium transition ${
                  statusFilter === val
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="text-muted-foreground text-xs font-mono">
            Mostrando <b>{filteredOrders.length}</b> de <b>{orders.length}</b> pedidos
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full min-w-[850px] text-xs">
            <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Factura / Control</th>
                <th className="px-4 py-3 font-semibold">Fecha y Hora</th>
                <th className="px-4 py-3 font-semibold">Cliente & RIF</th>
                <th className="px-4 py-3 font-semibold">Modalidad</th>
                <th className="px-4 py-3 font-semibold text-right">Total (USD / Bs.)</th>
                <th className="px-4 py-3 font-semibold">Pago</th>
                <th className="px-4 py-3 font-semibold">Cajero</th>
                <th className="px-4 py-3 font-semibold text-center">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-foreground">No se encontraron ventas con los filtros aplicados</p>
                    <p className="text-[11px] mt-1">Prueba cambiando los términos de búsqueda o filtros.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const isVoid = o.status === "anulada";
                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-secondary/30 transition ${
                        isVoid ? "opacity-60 bg-destructive/5" : ""
                      }`}
                    >
                      {/* Invoice */}
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-foreground">#{o.invoiceNo}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">Ctrl: {o.controlNo}</div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                        <div>{new Date(o.createdAt).toLocaleDateString("es-VE")}</div>
                        <div className="text-[10px]">
                          {new Date(o.createdAt).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground truncate max-w-[150px]">
                          {o.customer?.name || "Consumidor Final"}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {o.customer?.rif || "V-00000000"}
                        </div>
                      </td>

                      {/* Mode */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                          {o.type === "dine_in" ? "🍽️ En Salón" : "🥡 Para Llevar"}
                          {o.table ? ` (${o.table})` : ""}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 text-right font-mono">
                        <div className={`font-bold ${isVoid ? "line-through text-destructive" : "text-foreground"}`}>
                          {fmtUsd(o.totalUsd)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{fmtBs(o.totalBs)}</div>
                      </td>

                      {/* Payment tender badges */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {o.payments.map((p, idx) => {
                            const label =
                              p.type === "usd_cash"
                                ? `💵 $${p.amountUsd?.toFixed(2) ?? ""}`
                                : p.type === "pago_movil"
                                ? `📲 PM`
                                : p.type === "pos_card"
                                ? `💳 POS`
                                : `🇻🇪 Bs`;
                            return (
                              <span
                                key={idx}
                                className="inline-block rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground font-semibold"
                                title={p.reference ? `Ref: ${p.reference}` : undefined}
                              >
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Cashier */}
                      <td className="px-4 py-3 text-muted-foreground font-medium">{o.cashier}</td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {isVoid ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                            <XCircle className="h-3 w-3" /> Anulada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Confirmada
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Detalle */}
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                            title="Ver detalle del pedido"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Reimprimir ticket */}
                          <button
                            onClick={() => handleReprint(o)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                            title="Reimprimir Ticket Fiscal / Comprobante"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          {/* Enviar WhatsApp */}
                          <button
                            onClick={() => handleSendWhatsApp(o)}
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-500/10 transition"
                            title="Enviar Ticket por WhatsApp al cliente"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>

                          {/* Modificar / Editar */}
                          {!isVoid && (
                            <button
                              onClick={() => openEditModal(o)}
                              className="rounded-lg p-1.5 text-primary hover:bg-primary/10 transition"
                              title="Modificar / Editar Venta (Cliente, Pago, Referencia, Tipo)"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}

                          {/* Anular */}
                          {!isVoid && (
                            <button
                              onClick={() => setVoidingOrder(o)}
                              className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition"
                              title="Anular venta y generar Nota de Crédito"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: VER DETALLE DE VENTA */}
      {selectedOrder && (
        <Modal
          title={`Detalle de Venta · Factura #${selectedOrder.invoiceNo}`}
          onClose={() => setSelectedOrder(null)}
          width="max-w-lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => handleSendWhatsApp(selectedOrder)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-500/20"
              >
                <Share2 className="h-3.5 w-3.5" /> Enviar por WhatsApp
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleReprint(selectedOrder)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary/80"
                >
                  <Printer className="h-3.5 w-3.5" /> Reimprimir Ticket
                </button>
                <button type="button" onClick={() => setSelectedOrder(null)} className={btnPrimary}>
                  Cerrar
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="rounded-xl border border-border bg-secondary/30 p-3 grid grid-cols-2 gap-2 font-mono">
              <div>
                <span className="text-muted-foreground block text-[10px]">Nº Factura:</span>
                <span className="font-bold text-foreground">#{selectedOrder.invoiceNo}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Nº Control SENIAT:</span>
                <span className="font-bold text-foreground">{selectedOrder.controlNo}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Fecha y Hora:</span>
                <span className="text-foreground">
                  {new Date(selectedOrder.createdAt).toLocaleString("es-VE")}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Cajero / Turno:</span>
                <span className="text-foreground">{selectedOrder.cashier}</span>
              </div>
            </div>

            {/* Customer info */}
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="font-semibold text-foreground mb-1">Datos del Cliente</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-muted-foreground">Nombre: </span>
                  <span className="font-medium text-foreground">{selectedOrder.customer?.name || "Consumidor Final"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">RIF / CI: </span>
                  <span className="font-mono text-foreground">{selectedOrder.customer?.rif || "V-00000000"}</span>
                </div>
                {selectedOrder.customer?.phone && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Teléfono: </span>
                    <span className="font-mono text-foreground">{selectedOrder.customer.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product lines */}
            <div>
              <div className="font-semibold text-foreground mb-2">Productos Facturados</div>
              <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                {selectedOrder.lines.map((l, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5">
                    <div>
                      <div className="font-medium text-foreground">
                        {l.qty}x {l.name}
                      </div>
                      {l.note && <div className="text-[10px] text-muted-foreground italic">Nota: {l.note}</div>}
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-foreground">${(l.qty * l.unitUsd).toFixed(2)}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Bs. {(l.qty * l.unitUsd * selectedOrder.rate).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Tax */}
            <div className="rounded-xl border border-border bg-secondary/20 p-3 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-muted-foreground">
                <span>Base Imponible:</span>
                <span>{fmtBs(selectedOrder.baseBs)} (${(selectedOrder.baseBs / selectedOrder.rate).toFixed(2)})</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>IVA (16%):</span>
                <span>{fmtBs(selectedOrder.ivaBs)} (${(selectedOrder.ivaBs / selectedOrder.rate).toFixed(2)})</span>
              </div>
              {selectedOrder.igtfBs > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>IGTF Divisas (3%):</span>
                  <span>{fmtBs(selectedOrder.igtfBs)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-1.5">
                <span>TOTAL:</span>
                <span className="text-primary">{fmtUsd(selectedOrder.totalUsd)} ({fmtBs(selectedOrder.totalBs)})</span>
              </div>
            </div>

            {/* Payments breakdown */}
            <div>
              <div className="font-semibold text-foreground mb-1">Medios de Pago Utilizados</div>
              <div className="space-y-1">
                {selectedOrder.payments.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-border/80 bg-card p-2 font-mono text-[11px]"
                  >
                    <div>
                      <span className="font-bold text-foreground">
                        {p.type === "usd_cash" && "💵 Efectivo Divisas ($)"}
                        {p.type === "pago_movil" && "📲 Pago Móvil"}
                        {p.type === "pos_card" && "💳 Punto de Venta"}
                        {p.type === "bs_cash" && "🇻🇪 Efectivo Bolívares"}
                      </span>
                      {p.reference && (
                        <span className="ml-2 text-muted-foreground text-[10px]">Ref: {p.reference}</span>
                      )}
                    </div>
                    <div className="font-bold text-foreground">
                      {p.amountUsd ? `$${p.amountUsd.toFixed(2)}` : fmtBs(p.amountBs)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: MODIFICAR / EDITAR VENTA VIEJA */}
      {editingOrder && (
        <Modal
          title={`✏️ Modificar Venta · Factura #${editingOrder.invoiceNo}`}
          onClose={() => setEditingOrder(null)}
          width="max-w-md"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingOrder(null)} className={btnGhost}>
                Cancelar
              </button>
              <button type="button" onClick={handleSaveOrderEdit} className={btnPrimary}>
                <Save className="h-4 w-4" /> Guardar Modificación
              </button>
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-muted-foreground text-[11px]">
              ℹ️ Aquí puedes corregir errores de caja en pedidos pasados: cambiar el RIF o nombre del cliente, corregir el medio de pago (ej. de Pago Móvil a Divisas) o agregar números de referencia bancaria.
            </div>

            {/* Customer fields */}
            <div>
              <label className="font-semibold text-foreground block mb-1">Nombre o Razón Social del Cliente</label>
              <input
                value={editForm.customerName}
                onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                className={inputCls}
                placeholder="Nombre del cliente"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">RIF o Cédula</label>
                <input
                  value={editForm.customerRif}
                  onChange={(e) => setEditForm({ ...editForm, customerRif: e.target.value })}
                  className={`${inputCls} font-mono`}
                  placeholder="V-12345678"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Teléfono (WhatsApp)</label>
                <input
                  value={editForm.customerPhone}
                  onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                  className={`${inputCls} font-mono`}
                  placeholder="0412-1234567"
                />
              </div>
            </div>

            {/* Order type and table */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">Modalidad de Consumo</label>
                <select
                  value={editForm.orderType}
                  onChange={(e) => setEditForm({ ...editForm, orderType: e.target.value as OrderType })}
                  className={inputCls}
                >
                  <option value="dine_in">🍽️ Comer en Salón</option>
                  <option value="takeout">🥡 Para Llevar / Delivery</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Mesa / Ubicación</label>
                <input
                  value={editForm.table}
                  onChange={(e) => setEditForm({ ...editForm, table: e.target.value })}
                  className={inputCls}
                  placeholder="Ej. Mesa 4 o Barra"
                />
              </div>
            </div>

            {/* Payment method 1 */}
            <div className="border-t border-border pt-3">
              <label className="font-semibold text-foreground block mb-1">Forma de Pago Principal</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={editForm.paymentType0}
                  onChange={(e) => setEditForm({ ...editForm, paymentType0: e.target.value as PaymentType })}
                  className={inputCls}
                >
                  <option value="usd_cash">💵 Efectivo Dólares ($)</option>
                  <option value="pago_movil">📲 Pago Móvil</option>
                  <option value="pos_card">💳 Punto de Venta (Tarjeta)</option>
                  <option value="bs_cash">🇻🇪 Efectivo Bolívares</option>
                </select>
                <input
                  value={editForm.paymentRef0}
                  onChange={(e) => setEditForm({ ...editForm, paymentRef0: e.target.value })}
                  className={`${inputCls} font-mono`}
                  placeholder="Nº Referencia / Lote"
                />
              </div>
            </div>

            {/* Payment method 2 if split */}
            {editForm.paymentType1 && (
              <div>
                <label className="font-semibold text-foreground block mb-1">Forma de Pago Secundaria (Mixto)</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editForm.paymentType1}
                    onChange={(e) => setEditForm({ ...editForm, paymentType1: e.target.value as PaymentType })}
                    className={inputCls}
                  >
                    <option value="usd_cash">💵 Efectivo Dólares ($)</option>
                    <option value="pago_movil">📲 Pago Móvil</option>
                    <option value="pos_card">💳 Punto de Venta (Tarjeta)</option>
                    <option value="bs_cash">🇻🇪 Efectivo Bolívares</option>
                  </select>
                  <input
                    value={editForm.paymentRef1 || ""}
                    onChange={(e) => setEditForm({ ...editForm, paymentRef1: e.target.value })}
                    className={`${inputCls} font-mono`}
                    placeholder="Nº Referencia 2"
                  />
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL: ANULAR CON NOTA DE CRÉDITO */}
      {voidingOrder && (
        <Modal
          title={`⚠️ Anular Venta #${voidingOrder.invoiceNo}`}
          onClose={() => setVoidingOrder(null)}
          width="max-w-md"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setVoidingOrder(null)} className={btnGhost}>
                Cancelar
              </button>
              <button type="button" onClick={handleConfirmVoid} className={btnDanger}>
                Confirmar Anulación
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-muted-foreground">
              ¿Estás seguro de anular la <b>Factura #{voidingOrder.invoiceNo}</b> por un monto de{" "}
              <b>{fmtUsd(voidingOrder.totalUsd)} ({fmtBs(voidingOrder.totalBs)})</b>?
            </p>
            <p className="text-[11px] text-destructive bg-destructive/10 p-2.5 rounded-xl border border-destructive/20 font-medium">
              Esta operación registrará una Nota de Crédito fiscal de reversión y ajustará el informe de caja.
            </p>
            <div>
              <label className="font-semibold text-foreground block mb-1">Motivo de Anulación:</label>
              <input
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Ej. Error en cobro de tarjeta, cliente solicitó cambio..."
                className={inputCls}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
