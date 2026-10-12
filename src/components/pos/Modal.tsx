import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({ title, onClose, children, width = "max-w-2xl", footer }: { title: ReactNode; onClose: () => void; children: ReactNode; width?: string; footer?: ReactNode }) {
  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-overlay/85 p-4 backdrop-blur-md animate-in fade-in" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`flex max-h-[92vh] w-full ${width} flex-col overflow-hidden rounded-lg border border-border bg-card   animate-in zoom-in-95`}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-secondary">
          <h2 className="font-sans text-lg font-bold tracking-normal text-foreground">{title}</h2>
          <Button variant="plain" onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition" aria-label="Cerrar (Esc)">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="border-t border-border px-6 py-4 bg-background">{footer}</div>}
      </div>
    </div>
  );
}

export const inputCls = "w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
export const btnGhost = "rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-40";
export const btnPrimary = "rounded-md bg-accent px-5 py-2.5 text-sm font-bold text-background hover:bg-accent transition-all   disabled:cursor-not-allowed disabled:opacity-40";
export const btnDanger = "rounded-md bg-destructive px-4 py-2 text-sm font-bold text-foreground hover:bg-destructive transition-colors disabled:opacity-40";
export const btnGold = "rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-background hover:bg-primary transition-all   disabled:cursor-not-allowed disabled:opacity-40";
