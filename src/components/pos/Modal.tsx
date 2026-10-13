import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({ title, onClose, children, width = "max-w-2xl", footer }: { title: ReactNode; onClose: () => void; children: ReactNode; width?: string; footer?: ReactNode }) {
  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`flex max-h-[92vh] w-full ${width} flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl animate-in zoom-in-95`}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-secondary/40">
          <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition" aria-label="Cerrar (Esc)">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="border-t border-border px-6 py-4 bg-secondary/30">{footer}</div>}
      </div>
    </div>
  );
}

export const inputCls = "w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
export const btnGhost = "rounded-lg border border-border bg-secondary/70 px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-40";
export const btnPrimary = "rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs disabled:cursor-not-allowed disabled:opacity-40";
export const btnDanger = "rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-40";
export const btnGold = "rounded-lg bg-module-inventory px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition-all shadow-xs disabled:cursor-not-allowed disabled:opacity-40";
