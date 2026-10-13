import { useState } from "react";
import { ArrowRight, CheckCircle2, Edit, FileText, Package, Plus, Search, Truck } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";
import type { POStatus, Supplier } from "@/types/pos";
import { Modal, btnGhost, btnPrimary, inputCls } from "../pos/Modal";

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

export function SuppliersModule() {
  const pos = usePos();
  const { suppliers, purchaseOrders, supplierInvoices, products, rate } = pos;
  const [tab, setTab] = useState<"suppliers" | "orders" | "invoices">("suppliers");
  const [search, setSearch] = useState("");
  const [supModal, setSupModal] = useState(false);
  const [poModal, setPoModal] = useState(false);
  const [editingSup, setEditingSup] = useState<Supplier | null>(null);

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
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rif.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-2xl font-semibold text-foreground">Proveedores y Compras</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de proveedores de insumos, órdenes de compra con entrada automática a stock y facturas recibidas
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPoModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition"
          >
            <Package className="h-4 w-4 text-module-suppliers" />
            Nuevo pedido de compra
          </button>
          <button
            onClick={openNewSupplier}
            className="inline-flex items-center gap-2 rounded-xl bg-module-suppliers px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-border pb-2">
        {[
          { id: "suppliers", label: `Proveedores (${suppliers.length})`, icon: Truck },
          { id: "orders", label: `Pedidos de Compra (${purchaseOrders.length})`, icon: Package },
          { id: "invoices", label: `Facturas Recibidas (${supplierInvoices.length})`, icon: FileText },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

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
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nombre / Razón Social</th>
                  <th className="px-4 py-3 font-semibold">RIF</th>
                  <th className="px-4 py-3 font-semibold">Rubro</th>
                  <th className="px-4 py-3 font-semibold">Contacto</th>
                  <th className="px-4 py-3 font-semibold">Crédito</th>
                  <th className="px-4 py-3 font-semibold">Scoring</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 w-[60px]" />
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
                      <button
                        onClick={() => openEditSupplier(s)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-xs">
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
      )}

      {tab === "invoices" && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-xs">
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
    </div>
  );
}
