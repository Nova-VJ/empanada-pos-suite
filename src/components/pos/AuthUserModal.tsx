import { useState } from "react";
import {
  User,
  Mail,
  Lock,
  KeyRound,
  Shield,
  CheckCircle2,
  LogOut,
  UserPlus,
  Sparkles,
  Building2,
  BadgeCheck,
  Rocket,
  Bell,
  BellOff,
  Edit2,
  Save,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { Modal, btnGhost, btnPrimary, inputCls } from "./Modal";
import { BusinessSetupWizardModal } from "./BusinessSetupWizardModal";
import { UsersManagement } from "../erp/UsersManagement";

export interface AuthUserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  role: "propietario" | "administrador" | "cajero" | "contador" | "cocinero";
  authProvider: "google" | "local";
  avatarInitials: string;
}

const AUTH_USER_KEY = "novasystem_active_auth_user";

export function AuthUserModal({ onClose }: { onClose: () => void }) {
  const pos = usePos();

  const [activeUser, setActiveUser] = useState<AuthUserProfile>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return {
      id: "u-1",
      name: pos.shift.cashier || "María Pérez",
      email: "maria.perez@drempanadas.com",
      username: "mariap",
      role: "propietario",
      authProvider: "local",
      avatarInitials: "MP",
    };
  });

  const [tab, setTab] = useState<"profile" | "team" | "login" | "register">("profile");
  const [showWizard, setShowWizard] = useState(false);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(activeUser.name);
  const [editEmail, setEditEmail] = useState(activeUser.email);
  const [editUsername, setEditUsername] = useState(activeUser.username);
  const [editRole, setEditRole] = useState(activeUser.role);

  // Low stock alerts state from pos.companySettings
  const lowStockAlerts = pos.companySettings.lowStockAlertsEnabled !== false;

  function toggleLowStockAlerts() {
    const nextVal = !lowStockAlerts;
    pos.updateCompanySettings({ lowStockAlertsEnabled: nextVal });
    if (nextVal) {
      toast.success("🔔 Alertas de Stock Bajo ACTIVADAS", {
        description: "Se mostrarán insignias rojas de stock crítico en el TPV e inventario.",
      });
    } else {
      toast.info("🔕 Alertas de Stock Bajo SILENCIADAS", {
        description: "Las advertencias visuales de stock bajo han sido desactivadas para este perfil.",
      });
    }
  }

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<AuthUserProfile["role"]>("cajero");

  function saveAuthUser(user: AuthUserProfile) {
    setActiveUser(user);
    pos.shift.cashier = user.name;
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    }
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim() || !editUsername.trim()) {
      toast.error("El nombre y usuario no pueden estar vacíos");
      return;
    }
    const initials = editName
      .trim()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const updated: AuthUserProfile = {
      ...activeUser,
      name: editName.trim(),
      email: editEmail.trim(),
      username: editUsername.trim().toLowerCase(),
      role: editRole,
      avatarInitials: initials || activeUser.avatarInitials,
    };
    saveAuthUser(updated);
    setIsEditingProfile(false);
    toast.success("¡Perfil actualizado con éxito!");
  }

  function handleGoogleLogin() {
    const googleUser: AuthUserProfile = {
      id: "g-" + Date.now(),
      name: "María Pérez",
      email: "maria.perez@gmail.com",
      username: "maria.google",
      role: "propietario",
      authProvider: "google",
      avatarInitials: "MP",
    };
    saveAuthUser(googleUser);
    toast.success("¡Sesión iniciada correctamente con Google!", {
      description: "Conectado como María Pérez (Propietaria)",
    });
    setTab("profile");
  }

  function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      toast.error("Por favor ingresa tu usuario/correo y contraseña");
      return;
    }

    const initials = loginEmail.substring(0, 2).toUpperCase();
    const localUser: AuthUserProfile = {
      id: "u-" + Date.now(),
      name: loginEmail.includes("@") ? loginEmail.split("@")[0] : loginEmail,
      email: loginEmail.includes("@") ? loginEmail : `${loginEmail}@novasystem.com`,
      username: loginEmail.replace("@", "_"),
      role: "administrador",
      authProvider: "local",
      avatarInitials: initials,
    };

    saveAuthUser(localUser);
    toast.success(`Bienvenido(a), ${localUser.name}`);
    setTab("profile");
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regName.trim() || !regPassword.trim() || !regUsername.trim()) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    const parts = regName.trim().split(" ");
    const initials = (parts[0]?.[0] || "U") + (parts[1]?.[0] || "");
    const newUser: AuthUserProfile = {
      id: "u-" + Date.now(),
      name: regName.trim(),
      email: regEmail.trim() || `${regUsername.trim()}@novasystem.com`,
      username: regUsername.trim(),
      role: regRole,
      authProvider: "local",
      avatarInitials: initials.toUpperCase(),
    };

    saveAuthUser(newUser);
    toast.success("¡Cuenta creada y activada con éxito!", {
      description: `Usuario: ${newUser.username} · Rol: ${newUser.role.toUpperCase()}`,
    });
    setTab("profile");
  }

  function handleLogout() {
    toast.info("Has cerrado la sesión");
    setTab("login");
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg overflow-hidden border border-border shadow-xs bg-card flex items-center justify-center p-0.5">
            <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
          </div>
          <span>Cuentas de Usuario & Acceso</span>
        </div>
      }
      onClose={onClose}
      width={tab === "team" ? "max-w-4xl" : "max-w-md"}
    >
      <div className="space-y-4 text-xs">
        {/* Tab switcher */}
        <div className="flex rounded-xl bg-secondary/60 p-1 border border-border">
          <button
            onClick={() => {
              setTab("profile");
              setIsEditingProfile(false);
            }}
            className={`flex-1 rounded-lg py-1.5 font-bold transition text-xs ${
              tab === "profile"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mi Cuenta
          </button>
          <button
            onClick={() => setTab("team")}
            className={`flex-1 rounded-lg py-1.5 font-bold transition text-xs ${
              tab === "team"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Equipo & Monitoreo
          </button>
          <button
            onClick={() => setTab("login")}
            className={`flex-1 rounded-lg py-1.5 font-bold transition text-xs ${
              tab === "login"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Cambiar
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 rounded-lg py-1.5 font-bold transition text-xs ${
              tab === "register"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Nuevo
          </button>
        </div>

        {/* 1. Tab: Active Profile */}
        {tab === "profile" && (
          <div className="space-y-4">
            {!isEditingProfile ? (
              <>
                <div className="rounded-2xl border border-border bg-gradient-to-b from-secondary/40 to-card p-5 text-center flex flex-col items-center relative">
                  <button
                    onClick={() => {
                      setEditName(activeUser.name);
                      setEditEmail(activeUser.email);
                      setEditUsername(activeUser.username);
                      setEditRole(activeUser.role);
                      setIsEditingProfile(true);
                    }}
                    className="absolute top-3 right-3 rounded-lg border border-border bg-card p-1.5 text-xs text-primary hover:bg-secondary transition flex items-center gap-1 shadow-2xs"
                    title="Editar Mi Perfil"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-semibold">Editar</span>
                  </button>

                  <div className="h-16 w-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary font-bold text-xl mb-3 shadow-inner">
                    {activeUser.avatarInitials}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-foreground">{activeUser.name}</h3>
                    <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{activeUser.email}</p>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <span className="rounded-full bg-primary/10 border border-primary/25 px-2.5 py-0.5 text-[11px] font-bold text-primary uppercase">
                      {activeUser.role}
                    </span>
                    <span className="rounded-full bg-secondary border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground font-medium">
                      {pos.companySettings.name}
                    </span>
                  </div>
                </div>

                {/* Low Stock Alerts Switch (User Requested) */}
                <div className="rounded-xl border border-border bg-card p-3.5 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                        lowStockAlerts
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                          : "bg-secondary text-muted-foreground border border-border"
                      }`}
                    >
                      {lowStockAlerts ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                        <span>Alertas de Stock Bajo</span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                            lowStockAlerts ? "bg-amber-500/20 text-amber-600" : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {lowStockAlerts ? "ACTIVAS" : "SILENCIADAS"}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {lowStockAlerts
                          ? "Avisos en rojo en tarjetas de venta e inventario"
                          : "Silenciadas (oculta avisos en rojo para este perfil)"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={toggleLowStockAlerts}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      lowStockAlerts ? "bg-amber-500" : "bg-secondary"
                    }`}
                    title={lowStockAlerts ? "Desactivar alertas" : "Activar alertas"}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        lowStockAlerts ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="rounded-xl border border-border bg-card p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Método de Acceso:</span>
                    <span className="font-semibold text-foreground capitalize flex items-center gap-1">
                      {activeUser.authProvider === "google" ? "Cuenta Google" : "Usuario / Contraseña"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Sucursal Asignada:</span>
                    <span className="font-semibold text-foreground">{pos.companySettings.branch}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground">Caja / Terminal:</span>
                    <span className="font-semibold text-foreground">{pos.shift.register}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowWizard(true)}
                  className="w-full rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary py-2.5 px-3 text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Rocket className="h-4 w-4" />
                  <span>Configurar Datos Reales del Negocio (Dejar Demo)</span>
                </button>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      pos.lockTerminal();
                      onClose();
                      toast.info("Terminal bloqueado");
                    }}
                    className="flex-1 rounded-xl border border-border bg-secondary py-2 font-semibold text-foreground hover:bg-secondary/80 transition flex items-center justify-center gap-1.5"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Bloquear Terminal</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 rounded-xl border border-destructive/30 bg-destructive/10 py-2 font-semibold text-destructive hover:bg-destructive/20 transition flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </>
            ) : (
              /* Edit Profile Form */
              <form onSubmit={handleSaveProfile} className="space-y-3.5 rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Edit2 className="h-4 w-4 text-primary" />
                    <span>Editar Mi Perfil</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Nombre Completo</label>
                  <input
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Nombre de Usuario</label>
                  <input
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground text-xs font-mono focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Rol / Cargo</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as AuthUserProfile["role"])}
                    className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground text-xs font-medium focus:outline-hidden focus:border-primary"
                  >
                    <option value="propietario">Propietario / Gerente General</option>
                    <option value="administrador">Administrador / Supervisor</option>
                    <option value="cajero">Cajero Principal</option>
                    <option value="contador">Contador Colegiado (SENIAT)</option>
                    <option value="cocinero">Maestro Freidor (KDS)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="rounded-xl border border-border bg-secondary px-3.5 py-1.5 font-semibold text-foreground hover:bg-secondary/80 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-4 py-1.5 font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition flex items-center gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Guardar Perfil</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 2. Tab: Team / Users Management */}
        {tab === "team" && (
          <div className="py-1">
            <UsersManagement />
          </div>
        )}

        {/* 3. Tab: Login */}
        {tab === "login" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-card hover:bg-secondary py-2.5 px-4 font-semibold text-xs text-foreground shadow-xs transition"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-border w-full"></div>
              <span className="bg-card px-2 text-[10px] uppercase font-bold text-muted-foreground absolute">
                o con tu cuenta
              </span>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Usuario o Correo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="usuario o correo@ejemplo.com"
                    className="w-full rounded-xl border border-border bg-secondary/50 pl-9 pr-3 py-2 text-foreground text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Contraseña o PIN</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-border bg-secondary/50 pl-9 pr-3 py-2 text-foreground text-xs font-mono focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-2.5 font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition text-xs"
              >
                Ingresar al Terminal
              </button>
            </form>
          </div>
        )}

        {/* 4. Tab: Register */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Nombre Completo *</label>
              <input
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Ej. Carlos Gómez"
                className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground text-xs focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Usuario de Acceso *</label>
                <input
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="carlosg"
                  className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground text-xs font-mono focus:outline-hidden focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Contraseña / PIN *</label>
                <input
                  required
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground text-xs font-mono focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Rol en el Negocio</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as AuthUserProfile["role"])}
                className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground text-xs font-medium focus:outline-hidden focus:border-primary"
              >
                <option value="cajero">Cajero Principal (Cobro TPV)</option>
                <option value="cocinero">Maestro Freidor (KDS)</option>
                <option value="contador">Contador Colegiado (SENIAT)</option>
                <option value="administrador">Administrador / Supervisor</option>
                <option value="propietario">Gerente General</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-primary py-2.5 font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition text-xs"
            >
              Crear Cuenta & Activar
            </button>
          </form>
        )}
      </div>

      {showWizard && <BusinessSetupWizardModal onClose={() => setShowWizard(false)} />}
    </Modal>
  );
}
