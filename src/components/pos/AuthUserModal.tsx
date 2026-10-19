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
} from "lucide-react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { Modal, btnGhost, btnPrimary, inputCls } from "./Modal";

export interface AuthUserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  role: "propietario" | "administrador" | "cajero";
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

  const [tab, setTab] = useState<"profile" | "login" | "register">("profile");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"propietario" | "administrador" | "cajero">("administrador");

  function saveAuthUser(user: AuthUserProfile) {
    setActiveUser(user);
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    }
  }

  function handleGoogleLogin() {
    // Simulated Google OAuth login
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
      width="max-w-md"
    >
      <div className="space-y-4 text-xs">
        {/* Tab switcher */}
        <div className="flex rounded-xl bg-secondary/60 p-1 border border-border">
          <button
            onClick={() => setTab("profile")}
            className={`flex-1 rounded-lg py-1.5 font-bold transition text-xs ${
              tab === "profile"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mi Cuenta
          </button>
          <button
            onClick={() => setTab("login")}
            className={`flex-1 rounded-lg py-1.5 font-bold transition text-xs ${
              tab === "login"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 rounded-lg py-1.5 font-bold transition text-xs ${
              tab === "register"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* 1. Tab: Active Profile */}
        {tab === "profile" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-gradient-to-b from-secondary/40 to-card p-5 text-center flex flex-col items-center">
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

            <div className="flex gap-2 pt-2">
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
          </div>
        )}

        {/* 2. Tab: Login */}
        {tab === "login" && (
          <div className="space-y-4">
            {/* Google OAuth Button */}
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
              <div className="w-full border-t border-border" />
              <span className="absolute bg-card px-2 text-[10px] text-muted-foreground uppercase font-semibold">
                o con usuario y contraseña
              </span>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Correo Electrónico o Usuario:
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="ej. admin@drempanadas.com o mariap"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Contraseña:</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-2.5 font-bold text-xs text-primary-foreground hover:bg-primary/90 transition shadow-xs mt-2"
              >
                Entrar al Sistema
              </button>
            </form>
          </div>
        )}

        {/* 3. Tab: Register */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <p className="text-[11px] text-muted-foreground">
              Crea una cuenta de usuario para administradores, socios o cajeros de tu negocio:
            </p>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                placeholder="ej. Carlos Mendoza"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Usuario *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. cmendoza"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Rol en el Negocio</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as typeof regRole)}
                  className={`${inputCls} font-semibold`}
                >
                  <option value="propietario">👑 Propietario</option>
                  <option value="administrador">🛡️ Administrador</option>
                  <option value="cajero">💵 Cajero TPV</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Correo Electrónico</label>
              <input
                type="email"
                placeholder="carlos@drempanadas.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Contraseña *</label>
              <input
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className={inputCls}
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 font-bold text-xs text-white transition shadow-xs mt-2 flex items-center justify-center gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              <span>Registrar y Activar Cuenta</span>
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
