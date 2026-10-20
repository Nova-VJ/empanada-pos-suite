import { useState } from "react";
import { Building2, Pencil, Plus, Search, Trash2, User, Users } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";
import type { CustomerRecord } from "@/types/pos";
import { Modal, btnGhost, btnPrimary, inputCls } from "../pos/Modal";
import { matchesSearch } from "@/lib/search";

const segmentColors: Record<string, string> = {
  VIP: "bg-module-cash-light text-module-cash",
  Regular: "bg-module-sales-light text-module-sales",
  Ocasional: "bg-secondary text-muted-foreground",
  Inactivo: "bg-module-expenses-light text-module-expenses",
};

export function CustomersModule() {
  const pos = usePos();
  const { customers, rate } = pos;
  const [tab, setTab] = useState<"crm" | "debtors">("debtors");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CustomerRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [abonoCust, setAbonoCust] = useState<CustomerRecord | null>(null);
  const [abonoAmount, setAbonoAmount] = useState("");
  const [abonoMethod, setAbonoMethod] = useState("Pago Móvil");
  const [abonoNote, setAbonoNote] = useState("");

  const [form, setForm] = useState({
    docType: "V" as "V" | "J" | "E" | "G",
    rifNumber: "",
    name: "",
    email: "",
    phone: "",
    city: "Caracas - Chacao",
    address: "",
    isBusiness: false,
    debtUsd: 0,
    creditLimitUsd: 100,
  });

  const debtors = customers.filter((c) => (c.debtUsd ?? 0) > 0);
  const totalDebtUsd = debtors.reduce((sum, c) => sum + (c.debtUsd ?? 0), 0);
  const totalDebtBs = totalDebtUsd * rate;

  const filtered = (tab === "debtors" ? debtors : customers).filter(
    (c) =>
      matchesSearch(c.name, search) ||
      matchesSearch(c.rif, search) ||
      matchesSearch(c.email, search)
  );

  function openCreate() {
    setEditing(null);
    setForm({
      docType: "V",
      rifNumber: "",
      name: "",
      email: "",
      phone: "0414-",
      city: "Caracas - Chacao",
      address: "",
      isBusiness: false,
      debtUsd: 0,
      creditLimitUsd: 100,
    });
    setFormOpen(true);
  }

  function openEdit(c: CustomerRecord) {
    setEditing(c);
    setForm({
      docType: c.docType,
      rifNumber: c.rif.replace(/^[VJEG]-/i, ""),
      name: c.name,
      email: c.email,
      phone: c.phone,
      city: c.city,
      address: c.address,
      isBusiness: c.isBusiness,
      debtUsd: c.debtUsd ?? 0,
      creditLimitUsd: c.creditLimitUsd ?? 100,
    });
    setFormOpen(true);
  }

  function handleSave() {
    if (!form.name.trim() || !form.rifNumber.trim()) {
      toast.error("Nombre y RIF/Cédula son obligatorios");
      return;
    }
    const rif = `${form.docType}-${form.rifNumber.trim()}`;
    const payload = {
      docType: form.docType,
      rif,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      isBusiness: form.docType === "J" || form.docType === "G" || form.isBusiness,
      debtUsd: form.debtUsd,
      creditLimitUsd: form.creditLimitUsd,
    };
    if (editing) {
      pos.updateCustomer(editing.id, payload);
      toast.success("Cliente actualizado");
    } else {
      pos.createCustomer(payload);
      toast.success("Cliente registrado en CRM");
    }
    setFormOpen(false);
  }

  function handleDelete(c: CustomerRecord) {
    if (!confirm(`¿Eliminar cliente "${c.name}"?`)) return;
    pos.deleteCustomer(c.id);
    toast.success("Cliente eliminado");
  }

  function handleOpenAbono(c: CustomerRecord) {
    setAbonoCust(c);
    setAbonoAmount(String(c.debtUsd ?? ""));
    setAbonoMethod("Pago Móvil");
    setAbonoNote("");
  }

  function handleSaveAbono() {
    if (!abonoCust) return;
    const val = parseFloat(abonoAmount.replace(",", ".")) || 0;
    if (val <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    pos.registerCustomerDebtPayment(abonoCust.id, val, abonoMethod, abonoNote);
    toast.success(`Abono de $${val.toFixed(2)} registrado para ${abonoCust.name}`);
    setAbonoCust(null);
  }

  function sendWhatsAppReminder(c: CustomerRecord) {
    const cleanPhone = c.phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("0") ? `58${cleanPhone.slice(1)}` : cleanPhone;
    const text = encodeURIComponent(
      `Hola ${c.name}, le saludamos cordialmente de ${pos.companySettings.name} Le recordamos su saldo pendiente de $${(c.debtUsd ?? 0).toFixed(2)} (${fmtBs((c.debtUsd ?? 0) * rate)} a la tasa de hoy). Puede cancelarlo vía Pago Móvil o en nuestro local. ¡Muchas gracias!`
    );
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, "_blank");
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Clientes & Control de Deudores</h1>
          <p className="text-sm text-muted-foreground mt-1">
            CRM fiscal SENIAT, historial de compras y cuentas por cobrar (Ventas a crédito / Fiado)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-module-customers px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          onClick={() => setTab("debtors")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            tab === "debtors"
              ? "bg-amber-600 text-white shadow-xs"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <span>💸 Deudores / Cuentas por Cobrar</span>
          {debtors.length > 0 && (
            <span className="rounded-full bg-black/20 px-1.5 py-0.2 font-mono text-[11px] font-bold">
              {debtors.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("crm")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            tab === "crm"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <span>👥 Directorio General Clientes ({customers.length})</span>
        </button>
      </div>

      {/* KPI Cards when in Debtors view */}
      {tab === "debtors" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border border-l-4 border-l-amber-500 bg-card p-4 shadow-xs">
            <p className="text-xs text-muted-foreground">Total por Cobrar (Divisas $)</p>
            <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">{fmtUsd(totalDebtUsd)}</p>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{debtors.length} clientes con cuentas pendientes</p>
          </div>
          <div className="rounded-xl border border-border border-l-4 border-l-primary bg-card p-4 shadow-xs">
            <p className="text-xs text-muted-foreground">Equivalente al Cambio de Hoy</p>
            <p className="text-2xl font-bold font-mono text-foreground mt-0.5">{fmtBs(totalDebtBs)}</p>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">Tasa activa: Bs. {rate.toFixed(2)} / $</p>
          </div>
          <div className="rounded-xl border border-border border-l-4 border-l-emerald-500 bg-card p-4 shadow-xs">
            <p className="text-xs text-muted-foreground">Política de Fiado</p>
            <p className="text-sm font-semibold text-foreground mt-1">Indexado a Divisas USD ($)</p>
            <p className="text-xs text-muted-foreground mt-0.5">Protege el inventario contra devaluación</p>
          </div>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Buscar por nombre, RIF/Cédula o email..."
          className={`${inputCls} pl-9`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cliente / Razón Social</th>
                  <th className="px-4 py-3 font-semibold">RIF / Cédula</th>
                  <th className="px-4 py-3 font-semibold">Teléfono</th>
                  {tab === "debtors" ? (
                    <>
                      <th className="px-4 py-3 font-semibold text-right">Saldo Deudor (USD)</th>
                      <th className="px-4 py-3 font-semibold text-right">Saldo Deudor (Bs.)</th>
                      <th className="px-4 py-3 font-semibold text-right">Límite Crédito</th>
                      <th className="px-4 py-3 text-right">Cobro / Recordatorio</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Zona</th>
                      <th className="px-4 py-3 font-semibold">Tipo</th>
                      <th className="px-4 py-3 font-semibold">Segmento</th>
                      <th className="px-4 py-3 font-semibold text-right">Facturado</th>
                    </>
                  )}
                  <th className="px-4 py-3 w-[80px]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="cursor-pointer hover:bg-secondary/40 transition-colors" onClick={() => openEdit(c)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            (c.debtUsd ?? 0) > 0
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : c.isBusiness
                              ? "bg-module-suppliers-light text-module-suppliers"
                              : "bg-module-customers-light text-module-customers"
                          }`}
                        >
                          {(c.debtUsd ?? 0) > 0 ? "💸" : c.isBusiness ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{c.name}</div>
                          <div className="text-[11px] text-muted-foreground">{c.orderCount} compras</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-foreground">{c.rif}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{c.phone || "—"}</td>

                    {tab === "debtors" ? (
                      <>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          {fmtUsd(c.debtUsd ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                          {fmtBs((c.debtUsd ?? 0) * rate)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                          ${c.creditLimitUsd ?? 100}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenAbono(c)}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                            >
                              💵 Abonar
                            </button>
                            {c.phone && (
                              <button
                                onClick={() => sendWhatsAppReminder(c)}
                                className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground hover:bg-secondary transition"
                                title="Enviar recordatorio por WhatsApp"
                              >
                                📲 WhatsApp
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-muted-foreground">{c.email || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.city || "—"}</td>
                        <td className="px-4 py-3">
                          {c.isBusiness ? (
                            <span className="rounded-md bg-module-suppliers-light px-2 py-0.5 text-[11px] font-semibold text-module-suppliers">
                              B2B Corporativo
                            </span>
                          ) : (
                            <span className="rounded-md bg-module-customers-light px-2 py-0.5 text-[11px] font-semibold text-module-customers">
                              B2C Natural
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${segmentColors[c.segment]}`}>
                            {c.segment}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          <div className="font-bold text-foreground">{fmtUsd(c.totalSpentUsd)}</div>
                          <div className="text-[10px] text-muted-foreground">{fmtBs(c.totalSpentUsd * rate)}</div>
                        </td>
                      </>
                    )}

                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-medium text-foreground">
              {tab === "debtors" ? "No hay cuentas deudoras pendientes 🎉" : "Sin clientes registrados"}
            </h3>
          </div>
        )}
      </div>

      {formOpen && (
        <Modal
          title={editing ? `Editar Cliente: ${editing.name}` : "Registrar Cliente Fiscal SENIAT"}
          onClose={() => setFormOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setFormOpen(false)}>
                Cancelar
              </button>
              <button className={btnPrimary} onClick={handleSave}>
                Guardar Cliente
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="sm:col-span-2 grid grid-cols-[95px_1fr] gap-2">
              <label className="font-semibold text-foreground">
                Tipo Doc.
                <select
                  value={form.docType}
                  onChange={(e) => {
                    const dt = e.target.value as "V" | "J" | "E" | "G";
                    setForm({ ...form, docType: dt, isBusiness: dt === "J" || dt === "G" });
                  }}
                  className={`${inputCls} mt-1 font-bold`}
                >
                  <option value="V">V- Natural</option>
                  <option value="J">J- Jurídico</option>
                  <option value="E">E- Extranjero</option>
                  <option value="G">G- Gob.</option>
                </select>
              </label>
              <label className="font-semibold text-foreground">
                Número de RIF o Cédula *
                <input
                  value={form.rifNumber}
                  onChange={(e) => setForm({ ...form, rifNumber: e.target.value.replace(/[^0-9-]/g, "") })}
                  className={`${inputCls} mt-1 font-mono`}
                  placeholder="Ej. 00002967-9 o 14892301"
                />
              </label>
            </div>
            <label className="sm:col-span-2 font-semibold text-foreground">
              Nombre o Razón Social Fiscal *
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`${inputCls} mt-1`}
                placeholder="Ej. Inversiones Chacao C.A."
              />
            </label>
            <label className="font-semibold text-foreground">
              Correo electrónico
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Teléfono / WhatsApp
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={`${inputCls} mt-1 font-mono`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Ciudad / Zona
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Dirección Fiscal SENIAT
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Límite de Crédito / Fiado ($ USD)
              <input
                type="number"
                value={form.creditLimitUsd}
                onChange={(e) => setForm({ ...form, creditLimitUsd: parseFloat(e.target.value) || 0 })}
                className={`${inputCls} mt-1 font-mono`}
                placeholder="100.00"
              />
            </label>
            <label className="font-semibold text-foreground">
              Saldo Pendiente Deudor Actual ($ USD)
              <input
                type="number"
                step="0.01"
                value={form.debtUsd}
                onChange={(e) => setForm({ ...form, debtUsd: parseFloat(e.target.value) || 0 })}
                className={`${inputCls} mt-1 font-mono font-bold text-amber-600 dark:text-amber-400`}
                placeholder="0.00"
              />
            </label>
          </div>
        </Modal>
      )}

      {/* Modal Registrar Abono de Deudor */}
      {abonoCust && (
        <Modal
          title={`💵 Registrar Abono de Deuda: ${abonoCust.name}`}
          onClose={() => setAbonoCust(null)}
          width="max-w-md"
          footer={
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setAbonoCust(null)}>
                Cancelar
              </button>
              <button className={btnPrimary} onClick={handleSaveAbono}>
                Confirmar Abono
              </button>
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
              <div className="text-muted-foreground">Deuda total pendiente:</div>
              <div className="font-mono text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {fmtUsd(abonoCust.debtUsd ?? 0)}
              </div>
              <div className="font-mono text-xs text-foreground mt-0.5">
                Equivalente al cambio: {fmtBs((abonoCust.debtUsd ?? 0) * rate)} (Tasa: Bs. {rate.toFixed(2)})
              </div>
            </div>

            <label className="block font-semibold text-foreground">
              Monto a Abonar en Divisas ($ USD)
              <div className="mt-1 flex gap-2">
                <input
                  autoFocus
                  type="number"
                  step="0.01"
                  value={abonoAmount}
                  onChange={(e) => setAbonoAmount(e.target.value)}
                  className={`${inputCls} font-mono font-bold text-base`}
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => setAbonoAmount(String(abonoCust.debtUsd ?? 0))}
                  className="rounded-lg border border-border bg-secondary px-3 py-1 font-semibold text-xs text-foreground hover:bg-card"
                >
                  Pagar Todo
                </button>
              </div>
            </label>

            {parseFloat(abonoAmount) > 0 && (
              <div className="rounded-lg bg-secondary/50 p-2 font-mono text-xs text-muted-foreground">
                Equivalente a pagar: <b>{fmtBs((parseFloat(abonoAmount) || 0) * rate)}</b>
              </div>
            )}

            <label className="block font-semibold text-foreground">
              Método de Pago
              <select
                value={abonoMethod}
                onChange={(e) => setAbonoMethod(e.target.value)}
                className={`${inputCls} mt-1`}
              >
                <option value="Pago Móvil">📱 Pago Móvil</option>
                <option value="Efectivo USD">💵 Divisas USD en Efectivo</option>
                <option value="Punto de Venta">💳 Punto de Venta (Tarjeta)</option>
                <option value="Transferencia Banesco / BDV">🏦 Transferencia Bancaria</option>
                <option value="Zelle">🇺🇸 Zelle / Binance P2P</option>
              </select>
            </label>

            <label className="block font-semibold text-foreground">
              Referencia / Nota del Abono
              <input
                value={abonoNote}
                onChange={(e) => setAbonoNote(e.target.value)}
                className={`${inputCls} mt-1`}
                placeholder="Ej. Ref 4819 / Entregó $20 en caja..."
              />
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}
