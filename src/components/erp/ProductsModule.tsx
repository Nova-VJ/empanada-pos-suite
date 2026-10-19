import { useState } from "react";
import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { CATEGORIES } from "@/data/mockProducts";
import { fmtBs, fmtUsd } from "@/lib/money";
import type { Category, Product } from "@/types/pos";
import { Modal, btnGhost, btnPrimary, inputCls } from "../pos/Modal";
import { matchesSearch } from "@/lib/search";

const VALID_CATS: Category[] = ["Empanadas", "Pastelitos", "Horneados", "Bebidas", "Salsas & Extras", "Combos"];

export function ProductsModule() {
  const pos = usePos();
  const { products, rate } = pos;
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<(typeof CATEGORIES)[number]>("Todos");
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    short: "",
    sku: "",
    emoji: "🥟",
    category: "Empanadas" as Category,
    priceUsd: "1.80",
    costUsd: "0.75",
    stockBar: "45",
    stockKitchen: "80",
    kitchen: true,
    modifiers: "+ Salsa Guasacaca, + Salsa Tártara, Bien tostada",
  });

  const filtered = products.filter(
    (p) =>
      (catFilter === "Todos" || p.category === catFilter) &&
      (matchesSearch(p.name, search) ||
        matchesSearch(p.sku, search) ||
        matchesSearch(p.short, search))
  );

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      short: "",
      sku: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      emoji: "🥟",
      category: "Empanadas",
      priceUsd: "2.00",
      costUsd: "0.85",
      stockBar: "40",
      stockKitchen: "70",
      kitchen: true,
      modifiers: "+ Salsa Guasacaca, + Salsa Tártara, Bien tostada",
    });
    setFormOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      short: p.short,
      sku: p.sku,
      emoji: p.emoji,
      category: p.category,
      priceUsd: String(p.priceUsd),
      costUsd: String(p.costUsd),
      stockBar: String(p.stockBar),
      stockKitchen: String(p.stockKitchen),
      kitchen: p.kitchen,
      modifiers: p.modifiers.join(", "),
    });
    setFormOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("El nombre del producto es obligatorio");
      return;
    }
    const payload: Omit<Product, "id"> = {
      name: form.name.trim(),
      short: form.short.trim() || form.name.trim().slice(0, 16),
      sku: form.sku.trim() || "SKU-001",
      emoji: form.emoji || "🥟",
      category: form.category,
      priceUsd: parseFloat(form.priceUsd) || 1.5,
      costUsd: parseFloat(form.costUsd) || 0.6,
      stockBar: parseInt(form.stockBar, 10) || 0,
      stockKitchen: parseInt(form.stockKitchen, 10) || 0,
      kitchen: form.kitchen,
      modifiers: form.modifiers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    if (editing) {
      pos.updateProduct(editing.id, payload);
      toast.success("Producto actualizado");
    } else {
      pos.createProduct(payload);
      toast.success("Producto creado en el catálogo");
    }
    setFormOpen(false);
  }

  function handleDelete(p: Product) {
    if (!confirm(`¿Eliminar "${p.name}" del catálogo?`)) return;
    pos.deleteProduct(p.id);
    toast.success("Producto eliminado");
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Productos y Fichas de Costo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} productos activos en el catálogo de Dr. Empanadas C.A.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-module-products px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar por nombre, sabor o SKU..."
            className={`${inputCls} pl-9`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                catFilter === c
                  ? "bg-module-products text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 font-semibold">Estación</th>
                  <th className="px-4 py-3 font-semibold text-right">P. Coste</th>
                  <th className="px-4 py-3 font-semibold text-right">P. Venta (USD)</th>
                  <th className="px-4 py-3 font-semibold text-right">P. Venta (Bs.)</th>
                  <th className="px-4 py-3 font-semibold text-right">Margen</th>
                  <th className="px-4 py-3 font-semibold text-right">Stock</th>
                  <th className="px-4 py-3 w-[90px]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const margin = p.priceUsd > 0 ? ((p.priceUsd - p.costUsd) / p.priceUsd) * 100 : 0;
                  return (
                    <tr key={p.id} className="hover:bg-secondary/40 transition-colors cursor-pointer" onClick={() => openEdit(p)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{p.emoji}</span>
                          <div>
                            <div className="font-semibold text-foreground">{p.name}</div>
                            {p.modifiers.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {p.modifiers.slice(0, 3).map((m) => (
                                  <span key={m} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{p.sku}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-module-products-light px-2 py-0.5 text-[11px] font-medium text-module-products">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.kitchen ? "🍳 Freidora KDS" : "🥤 Barra"}</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">{fmtUsd(p.costUsd)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-module-inventory">{fmtUsd(p.priceUsd)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">{fmtBs(p.priceUsd * rate)}</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">{margin.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right font-mono">
                        <span className={p.stockBar < 25 ? "text-destructive font-bold" : "text-foreground font-medium"}>
                          {p.stockBar}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-medium text-foreground">Sin productos coincidentes</h3>
          </div>
        )}
      </div>

      {formOpen && (
        <Modal
          title={editing ? `Editar Producto: ${editing.name}` : "Nuevo Producto del Catálogo"}
          onClose={() => setFormOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setFormOpen(false)}>
                Cancelar
              </button>
              <button className={btnPrimary} onClick={handleSave}>
                Guardar Producto
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <label className="sm:col-span-2 font-semibold text-foreground">
              Nombre comercial *
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`${inputCls} mt-1`}
                placeholder="Ej. Empanada de Pabellón Criollo"
              />
            </label>
            <label className="font-semibold text-foreground">
              Nombre corto (KDS)
              <input
                value={form.short}
                onChange={(e) => setForm({ ...form, short: e.target.value })}
                className={`${inputCls} mt-1`}
                placeholder="Ej. Pabellón"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="font-semibold text-foreground">
                SKU
                <input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className={`${inputCls} mt-1 font-mono`}
                />
              </label>
              <label className="font-semibold text-foreground">
                Icono / Emoji
                <input
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  className={`${inputCls} mt-1 text-center text-lg`}
                />
              </label>
            </div>
            <label className="font-semibold text-foreground">
              Categoría
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                className={`${inputCls} mt-1`}
              >
                {VALID_CATS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="font-semibold text-foreground flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                checked={form.kitchen}
                onChange={(e) => setForm({ ...form, kitchen: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              Enviar a pantalla de Freidoras (Cocina KDS)
            </label>
            <label className="font-semibold text-foreground">
              Precio Costo ($ USD)
              <input
                type="number"
                step="0.05"
                value={form.costUsd}
                onChange={(e) => setForm({ ...form, costUsd: e.target.value })}
                className={`${inputCls} mt-1 font-mono`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Precio Venta ($ USD · Bs. {((parseFloat(form.priceUsd) || 0) * rate).toFixed(2)})
              <input
                type="number"
                step="0.10"
                value={form.priceUsd}
                onChange={(e) => setForm({ ...form, priceUsd: e.target.value })}
                className={`${inputCls} mt-1 font-mono font-bold`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Stock disponible (Barra / Exhibidor)
              <input
                type="number"
                value={form.stockBar}
                onChange={(e) => setForm({ ...form, stockBar: e.target.value })}
                className={`${inputCls} mt-1 font-mono`}
              />
            </label>
            <label className="font-semibold text-foreground">
              Stock en preparación (Cocina)
              <input
                type="number"
                value={form.stockKitchen}
                onChange={(e) => setForm({ ...form, stockKitchen: e.target.value })}
                className={`${inputCls} mt-1 font-mono`}
              />
            </label>
            <label className="sm:col-span-2 font-semibold text-foreground">
              Modificadores rápidos (separados por coma)
              <input
                value={form.modifiers}
                onChange={(e) => setForm({ ...form, modifiers: e.target.value })}
                className={`${inputCls} mt-1`}
              />
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}
