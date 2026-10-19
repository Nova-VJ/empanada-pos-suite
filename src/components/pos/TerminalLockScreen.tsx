import { useState, useEffect } from "react";
import { Lock, Unlock, KeyRound, ShieldAlert, Sparkles, AlertCircle } from "lucide-react";
import { usePos } from "@/context/PosContext";
import { toast } from "sonner";

const PIN_STORAGE_KEY = "novasystem_terminal_security_pin";
const SESSION_UNLOCKED_KEY = "novasystem_terminal_unlocked_session";

interface TerminalLockScreenProps {
  onUnlock?: () => void;
}

export function TerminalLockScreen({ onUnlock }: TerminalLockScreenProps) {
  const pos = usePos();

  // Load configured PIN or default "1234"
  const [savedPin, setSavedPin] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(PIN_STORAGE_KEY) || "1234";
    }
    return "1234";
  });

  const [enteredPin, setEnteredPin] = useState<string>("");
  const [errorShake, setErrorShake] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");

  const maxDigits = 4;

  // Handle number pad click
  function handleDigit(digit: string) {
    if (enteredPin.length < maxDigits) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      if (next.length === maxDigits) {
        verifyPin(next);
      }
    }
  }

  function handleBackspace() {
    setEnteredPin((prev) => prev.slice(0, -1));
  }

  function handleClear() {
    setEnteredPin("");
  }

  function verifyPin(pinToCheck: string) {
    if (pinToCheck === savedPin) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(SESSION_UNLOCKED_KEY, "true");
      }
      toast.success("✓ Terminal Desbloqueado");
      onUnlock?.();
    } else {
      setErrorShake(true);
      toast.error("Clave incorrecta. Inténtalo de nuevo.");
      setTimeout(() => {
        setEnteredPin("");
        setErrorShake(false);
      }, 600);
    }
  }

  // Keyboard support for physical numpad
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isChangingPin) return;
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        handleClear();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enteredPin, savedPin, isChangingPin]);

  function handleChangePinSubmit() {
    if (currentPinInput !== savedPin) {
      toast.error("La clave actual es incorrecta");
      return;
    }
    if (!/^\d{4}$/.test(newPinInput)) {
      toast.error("La nueva clave debe tener exactamente 4 números");
      return;
    }
    if (newPinInput !== confirmPinInput) {
      toast.error("Las nuevas claves no coinciden");
      return;
    }

    setSavedPin(newPinInput);
    if (typeof window !== "undefined") {
      localStorage.setItem(PIN_STORAGE_KEY, newPinInput);
    }
    toast.success("✓ Nueva clave de seguridad configurada con éxito");
    setIsChangingPin(false);
    setCurrentPinInput("");
    setNewPinInput("");
    setConfirmPinInput("");
    setEnteredPin("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 text-slate-100 backdrop-blur-md p-4 animate-in fade-in select-none">
      {/* Decorative background glow */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900/90 p-7 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
        {/* Logo header */}
        <div className="h-16 w-16 rounded-2xl overflow-hidden border border-slate-700/80 shadow-lg mb-3">
          <img src="/logo.jpg" alt="NovaSystem Logo" className="h-full w-full object-cover" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white">Terminal Protegido</h2>
        <p className="text-xs text-slate-400 mt-1">
          {pos.companySettings.name} · {pos.shift.cashier}
        </p>

        {/* Asterisks Display (Screen Saver PIN display) */}
        <div className={`mt-6 mb-4 flex items-center justify-center gap-3.5 ${errorShake ? "animate-shake" : ""}`}>
          {Array.from({ length: maxDigits }).map((_, idx) => {
            const isFilled = idx < enteredPin.length;
            return (
              <div
                key={idx}
                className={`h-11 w-11 rounded-xl border flex items-center justify-center transition-all duration-200 text-2xl font-black ${
                  isFilled
                    ? "border-primary bg-primary/20 text-primary shadow-sm scale-105"
                    : "border-slate-800 bg-slate-950/60 text-slate-600"
                }`}
              >
                {isFilled ? "﹡" : "•"}
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-400 font-mono mb-6">
          Ingresa tu PIN de seguridad de 4 dígitos
        </p>

        {/* Numeric keypad (3x4) */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px] mb-5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-13 rounded-2xl border border-slate-800 bg-slate-800/60 text-lg font-bold text-white hover:bg-slate-700/80 active:scale-95 transition-all shadow-xs"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-13 rounded-2xl border border-slate-800/80 bg-slate-900/60 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
            title="Borrar todo"
          >
            C
          </button>
          <button
            type="button"
            onClick={() => handleDigit("0")}
            className="h-13 rounded-2xl border border-slate-800 bg-slate-800/60 text-lg font-bold text-white hover:bg-slate-700/80 active:scale-95 transition-all shadow-xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-13 rounded-2xl border border-slate-800/80 bg-slate-900/60 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center"
            title="Borrar dígito"
          >
            ⌫
          </button>
        </div>

        {/* Change PIN option for Cashier/Owner */}
        <div className="pt-2 border-t border-slate-800/80 w-full flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setIsChangingPin(true)}
            className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-primary transition font-medium"
          >
            <KeyRound className="h-3 w-3" />
            <span>Cambiar mi Clave</span>
          </button>
          <span className="text-[10px] text-slate-500 font-mono">
            {savedPin === "1234" ? "PIN por defecto: 1234" : "PIN Personalizado"}
          </span>
        </div>
      </div>

      {/* Modal to configure / change PIN */}
      {isChangingPin && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Elegir Nueva Clave</h3>
                <p className="text-xs text-slate-400">PIN de 4 dígitos para proteger la pantalla</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-left">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Clave Actual:</label>
                <input
                  type="password"
                  maxLength={4}
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-center font-mono text-base tracking-widest text-white outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Nueva Clave (4 números):</label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-center font-mono text-base tracking-widest text-white outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Confirmar Nueva Clave:</label>
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-center font-mono text-base tracking-widest text-white outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(false);
                  setCurrentPinInput("");
                  setNewPinInput("");
                  setConfirmPinInput("");
                }}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleChangePinSubmit}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition shadow-xs"
              >
                Guardar Clave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
