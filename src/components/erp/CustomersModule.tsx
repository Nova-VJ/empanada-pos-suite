import { useState } from "react";
import { Building2, Pencil, Plus, Search, Trash2, User, Users } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";
import type { CustomerRecord } from "@/types/pos";
import { Modal, btnGhost, btnPrimary, inputCls } from "../pos/Modal";

const segmentColors: Record<string, string> = {
  VIP: "bg-module-cash-light text-module-cash",
  Regular: "bg-module-sales-light text-module-sales",
  Ocasional: "bg-secondary text-muted-foreground",
  Inactivo: "bg-module-expenses-light text-module-expenses",
};

export function CustomersModule() {
  const pos = usePos();
  const { customers, rate } = pos;
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CustomerRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [form, setForm] = useState({
    docType: "V" as "V" | "J" | "E" | "G",
    rifNumber: "",
    name: "",
    email: "",
    phone: "",
    city: "Caracas - Chacao",
    address: "",
    isBusiness: false,
  });

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.rif.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Clientes (CRM Fiscal SENIAT)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {customers.length} clientes registrados · Conectados directamente con facturación en el TPV
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
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Teléfono</th>
                  <th className="px-4 py-3 font-semibold">Zona</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Segmento</th>
                  <th className="px-4 py-3 font-semibold text-right">Facturado</th>
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
                            c.isBusiness ? "bg-module-suppliers-light" : "bg-module-customers-light"
                          }`}
                        >
                          {c.isBusiness ? (
                            <Building2 className="h-4 w-4 text-module-suppliers" />
                          ) : (
                            <User className="h-4 w-4 text-module-customers" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{c.name}</div>
                          <div className="text-[11px] text-muted-foreground">{c.orderCount} compras</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-foreground">{c.rif}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email || "—"}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{c.phone || "—"}</td>
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
            <h3 className="text-base font-medium text-foreground">Sin clientes registrados</h3>
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
          </div>
        </Modal>
      )}
    </div>
  );
}
