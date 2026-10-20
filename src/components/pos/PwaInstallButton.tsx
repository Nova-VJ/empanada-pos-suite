import { useState, useEffect } from "react";
import { usePos } from "@/context/PosContext";
import { Download, Smartphone, Check, HelpCircle, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallButton() {
  const pos = usePos();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Listen for Chrome/Edge/Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function handleInstallClick() {
    if (isInstalled) return;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosModal(true);
    } else {
      // Guide for desktop / manual install
      setShowIosModal(true);
    }
  }

  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
        <Check className="h-3.5 w-3.5" />
        <span className="hidden md:inline">App Instalada</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-500 dark:text-amber-400 font-bold text-xs transition shadow-xs active:scale-95"
        title={`Instalar ${pos.companySettings.name} como aplicación en tu PC o teléfono`}
      >
        <Smartphone className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
        <span className="hidden sm:inline">Instalar App</span>
        <Download className="h-3 w-3 sm:hidden" />
      </button>

      {/* Instructions Modal for iOS / Desktop without prompt */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📱</span>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Instalar {pos.companySettings.name}</h3>
                  <p className="text-[11px] text-muted-foreground">Funciona como App nativa en tu pantalla</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground">
              {/* Windows Desktop Direct Installer Button */}
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 space-y-2">
                <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                  <span>💻 ¿Estás en Windows? (Opción Rápida)</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Descarga nuestro instalador directo de escritorio para abrir el Punto de Venta a pantalla completa y con soporte sin internet:
                </p>
                <a
                  href="/downloads/Instalar-NovaSystem-Windows.cmd"
                  download="Instalar-NovaSystem-Windows.cmd"
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 text-xs transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Download className="h-4 w-4" />
                  <span>Descargar Instalador Windows (.cmd)</span>
                </a>
              </div>

              {isIos ? (
                <ol className="space-y-2 list-decimal pl-4">
                  <li>
                    Pulsa el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) en la barra de Safari.
                  </li>
                  <li>
                    Baja en las opciones y selecciona <strong>"Agregar a la pantalla de inicio"</strong>.
                  </li>
                  <li>
                    Pulsa <strong>"Agregar"</strong> arriba a la derecha. ¡Listo! Tendrás el icono directo en tu iPhone o iPad.
                  </li>
                </ol>
              ) : (
                <div className="space-y-2">
                  <p>
                    También puedes instalar la aplicación directamente desde el navegador:
                  </p>
                  <ul className="space-y-1.5 list-disc pl-4">
                    <li>
                      <strong>En PC (Chrome o Edge):</strong> Pulsa en el icono de <strong>Instalar</strong> en la barra de direcciones arriba a la derecha.
                    </li>
                    <li>
                      <strong>En Android:</strong> Pulsa los tres puntos del menú del navegador y elige <strong>"Instalar aplicación"</strong>.
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowIosModal(false)}
                className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 text-xs transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
