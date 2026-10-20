import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Edit2,
  Trash2,
  KeyRound,
  CheckCircle2,
  Clock,
  DollarSign,
  Flame,
  FileCheck2,
  LogIn,
  Store,
  Smartphone,
  X,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { fmtBs, fmtUsd } from "@/lib/money";
import type { SystemUser } from "@/types/pos";

export const USERS_STORAGE_KEY = "novasystem_system_users_v1";

export const INITIAL_USERS: SystemUser[] = [
  {
    id: "usr-01",
    name: "María Pérez",
    username: "mariap",
    email: "maria.perez@drempanadas.com",
    role: "cajero",
    roleLabel: "Cajero Principal",
    station: "Caja 01 · TPV Ventas",
    pin: "1234",
    active: true,
    avatarInitials: "MP",
    phone: "0414-2345678",
    createdAt: "2026-01-15",
    stats: {
      totalSalesUsd: 1420.5,
      totalSalesBs: 1245778.5,
      ticketsCount: 84,
      ordersCooked: 0,
      avgPrepMinutes: 0,
      shiftsCount: 22,
      lastActive: "Hace 5 minutos (Turno Abierto)",
    },
  },
  {
    id: "usr-02",
    name: "Carlos Gómez",
    username: "carlosg",
    email: "carlos.kds@drempanadas.com",
    role: "cocinero",
    roleLabel: "Maestro Freidor (KDS)",
    station: "Estación Freidoras 1-3",
    pin: "4321",
    active: true,
    avatarInitials: "CG",
    phone: "0424-9876543",
    createdAt: "2026-02-01",
    stats: {
      totalSalesUsd: 0,
      totalSalesBs: 0,
      ticketsCount: 0,
      ordersCooked: 186,
      avgPrepMinutes: 3.8,
      shiftsCount: 19,
      lastActive: "En cocina ahora",
    },
  },
  {
    id: "usr-03",
    name: "Dr. Empanadas Admin",
    username: "admin",
    email: "gerencia@drempanadas.com",
    role: "propietario",
    roleLabel: "Gerente General",
    station: "Todas las Sucursales",
    pin: "9999",
    active: true,
    avatarInitials: "EA",
    phone: "0412-1112233",
    createdAt: "2025-11-10",
    stats: {
      totalSalesUsd: 3840.0,
      totalSalesBs: 3367680.0,
      ticketsCount: 142,
      ordersCooked: 0,
      avgPrepMinutes: 0,
      shiftsCount: 45,
      lastActive: "En línea",
    },
  },
  {
    id: "usr-04",
    name: "Lic. Luisana Torres",
    username: "luisanat",
    email: "contabilidad@drempanadas.com",
    role: "contador",
    roleLabel: "Contador Público Colegiado",
    station: "Contabilidad & SENIAT",
    pin: "5566",
    active: true,
    avatarInitials: "LT",
    phone: "0416-5556677",
    createdAt: "2026-01-20",
    stats: {
      totalSalesUsd: 0,
      totalSalesBs: 0,
      ticketsCount: 0,
      ordersCooked: 0,
      avgPrepMinutes: 0,
      shiftsCount: 8,
      lastActive: "Hoy a las 09:30 AM",
    },
  },
];

export function UsersManagement() {
  const pos = usePos();

  const [users, setUsers] = useState<SystemUser[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return INITIAL_USERS;
  });

  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState<SystemUser["role"]>("cajero");
  const [formStation, setFormStation] = useState("Caja 01 · TPV Ventas");
  const [formPin, setFormPin] = useState("1234");
  const [formActive, setFormActive] = useState(true);

  // Save changes
  function persistUsers(updated: SystemUser[]) {
    setUsers(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
    }
  }

  function handleOpenAdd() {
    setFormName("");
    setFormUsername("");
    setFormEmail("");
    setFormPhone("");
    setFormRole("cajero");
    setFormStation("Caja 01 · TPV Ventas");
    setFormPin("1234");
    setFormActive(true);
    setEditingUser(null);
    setShowAddModal(true);
  }

  function handleOpenEdit(user: SystemUser) {
    setEditingUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormPhone(user.phone || "");
    setFormRole(user.role);
    setFormStation(user.station);
    setFormPin(user.pin);
    setFormActive(user.active);
    setShowAddModal(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim()) {
      toast.error("El nombre y usuario son obligatorios");
      return;
    }

    const initials = formName
      .trim()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const roleLabels: Record<SystemUser["role"], string> = {
      cajero: "Cajero TPV",
      cocinero: "Maestro Freidor (KDS)",
      contador: "Contador Público SENIAT",
      administrador: "Administrador / Supervisor",
      propietario: "Gerente General",
    };

    if (editingUser) {
      // Update
      const updated = users.map((u) => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            name: formName.trim(),
            username: formUsername.trim().toLowerCase(),
            email: formEmail.trim() || `${formUsername.trim()}@novasystem.com`,
            phone: formPhone.trim(),
            role: formRole,
            roleLabel: roleLabels[formRole],
            station: formStation,
            pin: formPin || "1234",
            active: formActive,
            avatarInitials: initials || u.avatarInitials,
          };
        }
        return u;
      });
      persistUsers(updated);
      toast.success(`Usuario "${formName}" actualizado correctamente`);
    } else {
      // Create new
      const newUser: SystemUser = {
        id: "usr-" + Date.now(),
        name: formName.trim(),
        username: formUsername.trim().toLowerCase(),
        email: formEmail.trim() || `${formUsername.trim()}@novasystem.com`,
        phone: formPhone.trim(),
        role: formRole,
        roleLabel: roleLabels[formRole],
        station: formStation,
        pin: formPin || "1234",
        active: formActive,
        avatarInitials: initials || "US",
        createdAt: new Date().toISOString().split("T")[0],
        stats: {
          totalSalesUsd: 0,
          totalSalesBs: 0,
          ticketsCount: 0,
          ordersCooked: 0,
          avgPrepMinutes: 0,
          shiftsCount: 0,
          lastActive: "Recién registrado",
        },
      };
      persistUsers([...users, newUser]);
      toast.success(`¡Nuevo usuario "${formName}" creado con rol de ${roleLabels[formRole]}!`);
    }

    setShowAddModal(false);
  }

  function handleDelete(id: string, name: string) {
    if (confirm(`¿Estás seguro de eliminar el usuario "${name}"?`)) {
      const updated = users.filter((u) => u.id !== id);
      persistUsers(updated);
      toast.info(`Usuario "${name}" eliminado`);
    }
  }

  function handleSwitchUser(user: SystemUser) {
    // Switch active cashier in POS
    pos.shift.cashier = user.name;
    // Save to active auth user storage
    const authProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role === "propietario" ? "propietario" : user.role === "administrador" ? "administrador" : "cajero",
      authProvider: "local",
      avatarInitials: user.avatarInitials,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("novasystem_active_auth_user", JSON.stringify(authProfile));
    }
    toast.success(`Sesión cambiada a: ${user.name} (${user.roleLabel})`, {
      description: `Estación actual: ${user.station}`,
    });
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.roleLabel.toLowerCase().includes(search.toLowerCase()) ||
      u.station.toLowerCase().includes(search.toLowerCase())
  );

  // Compute live KPIs
  const activeCount = users.filter((u) => u.active).length;
  const totalSalesUsd = users.reduce((sum, u) => sum + u.stats.totalSalesUsd, 0);
  const totalTickets = users.reduce((sum, u) => sum + u.stats.ticketsCount, 0);
  const totalCooked = users.reduce((sum, u) => sum + u.stats.ordersCooked, 0);

  return (
    <div className="space-y-5">
      {/* KPI Monitoring Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Equipo Activo</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="font-mono text-xl font-bold text-foreground">
            {activeCount} <span className="text-xs text-muted-foreground font-normal">/ {users.length} miembros</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="h-3 w-3" /> Todas las estaciones cubiertas
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Ventas por Cajeros</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="font-mono text-xl font-bold text-foreground">
            {fmtUsd(totalSalesUsd)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 truncate">
            {totalTickets} tickets emitidos en TPV
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cocina KDS</span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <div className="font-mono text-xl font-bold text-foreground">
            {totalCooked} <span className="text-xs text-muted-foreground font-normal">empanadas</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Tiempo prom: <b>3.8 min</b> por tanda
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Fiscal & Auditoría</span>
            <FileCheck2 className="h-4 w-4 text-violet-500" />
          </div>
          <div className="font-mono text-xl font-bold text-foreground">
            100% <span className="text-xs text-muted-foreground font-normal">Conforme</span>
          </div>
          <div className="text-[10px] text-violet-600 dark:text-violet-400 mt-1">
            Contador SENIAT vinculado
          </div>
        </div>
      </div>

      {/* Action Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, usuario, rol o estación..."
            className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>+ Agregar Nuevo Usuario</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-border bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Usuario & Nombre</th>
                <th className="px-4 py-3 font-semibold">Rol & Permisos</th>
                <th className="px-4 py-3 font-semibold">Estación Asignada</th>
                <th className="px-4 py-3 font-semibold">PIN Acceso</th>
                <th className="px-4 py-3 font-semibold text-right">Rendimiento en Vivo</th>
                <th className="px-4 py-3 font-semibold text-center">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((u) => {
                const isCurrentCashier = pos.shift.cashier === u.name;
                return (
                  <tr key={u.id} className="hover:bg-secondary/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center font-bold text-primary text-xs shrink-0 shadow-2xs">
                          {u.avatarInitials}
                        </div>
                        <div>
                          <div className="font-bold text-foreground flex items-center gap-1.5">
                            {u.name}
                            {isCurrentCashier && (
                              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-[9px] font-bold">
                                En Caja Ahora
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">@{u.username} · {u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          u.role === "propietario"
                            ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                            : u.role === "administrador"
                              ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                              : u.role === "contador"
                                ? "bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/20"
                                : u.role === "cocinero"
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {u.roleLabel}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{u.station}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] tracking-wider rounded bg-secondary px-2 py-0.5 border border-border">
                        ••••
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      {u.role === "cajero" || u.role === "propietario" || u.role === "administrador" ? (
                        <div>
                          <div className="font-mono font-bold text-foreground">{fmtUsd(u.stats.totalSalesUsd)}</div>
                          <div className="text-[10px] text-muted-foreground">{u.stats.ticketsCount} tickets ({u.stats.shiftsCount} turnos)</div>
                        </div>
                      ) : u.role === "cocinero" ? (
                        <div>
                          <div className="font-mono font-bold text-amber-600 dark:text-amber-400">{u.stats.ordersCooked} despachos</div>
                          <div className="text-[10px] text-muted-foreground">{u.stats.avgPrepMinutes}m tiempo medio</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-semibold text-foreground">SENIAT & Balances</div>
                          <div className="text-[10px] text-muted-foreground">Libros de Venta al día</div>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          u.active
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                            : "bg-secondary text-muted-foreground border border-border"
                        }`}
                      >
                        {u.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSwitchUser(u)}
                          className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                          title="Iniciar Sesión / Cambiar a este usuario"
                        >
                          <LogIn className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="rounded-lg border border-border bg-card p-1.5 text-primary hover:bg-primary/10 transition"
                          title="Editar Usuario & Permisos"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {users.length > 1 && (
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            className="rounded-lg border border-border bg-card p-1.5 text-destructive hover:bg-destructive/10 transition"
                            title="Eliminar Usuario"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {editingUser ? "Editar Usuario & Permisos" : "Crear Nuevo Usuario"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Configura rol, estación y PIN de acceso</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Nombre Completo *</label>
                <input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Pedro Pérez"
                  className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Nombre de Usuario *</label>
                  <input
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="pedrop"
                    className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground font-mono focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">PIN Rápido (4 dígitos) *</label>
                  <input
                    required
                    maxLength={6}
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="1234"
                    className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground font-mono font-bold tracking-widest focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="pedro@drempanadas.com"
                    className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Teléfono Móvil</label>
                  <input
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0414-1234567"
                    className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Rol en el Negocio</label>
                <select
                  value={formRole}
                  onChange={(e) => {
                    const r = e.target.value as SystemUser["role"];
                    setFormRole(r);
                    if (r === "cocinero") setFormStation("Estación Freidoras KDS");
                    if (r === "contador") setFormStation("Contabilidad & SENIAT");
                    if (r === "propietario") setFormStation("Todas las Sucursales");
                  }}
                  className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground focus:outline-hidden focus:border-primary font-medium"
                >
                  <option value="cajero">Cajero Principal (Cobro TPV, Cuadre de Caja y Arqueo)</option>
                  <option value="cocinero">Maestro Freidor (KDS Pantalla de Cocina y Despacho)</option>
                  <option value="contador">Contador Colegiado (Libros de Venta, SENIAT e Informes)</option>
                  <option value="administrador">Administrador / Supervisor (Control de Turno, Gastos y Precios)</option>
                  <option value="propietario">Gerente General / Dueño (Control Absoluto del Negocio)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Estación de Trabajo Asignada</label>
                <input
                  value={formStation}
                  onChange={(e) => setFormStation(e.target.value)}
                  placeholder="Ej. Caja 01 · TPV Ventas"
                  className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-foreground">Usuario Activo con Acceso al Sistema</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-border bg-secondary px-4 py-2 font-semibold text-foreground hover:bg-secondary/80 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
                >
                  {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
