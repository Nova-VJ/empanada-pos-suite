import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({ title, onClose, children, width = "max-w-2xl", footer }: { title: ReactNode; onClose: () => void; children: ReactNode; width?: string; footer?: ReactNode }) {
  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#071210]/85 p-4 backdrop-blur-md animate-in fade-in" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`flex max-h-[92vh] w-full ${width} flex-col overflow-hidden rounded-3xl border border-[#1f3d37] bg-[#122623] shadow-2xl shadow-black/60 animate-in zoom-in-95`}>
        <div className="flex items-center justify-between border-b border-[#1b3530] px-6 py-4 bg-[#142b27]">
          <h2 className="font-serif text-lg font-bold tracking-tight text-[#fbf8f1]">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-[#9eb1a8] hover:bg-[#1a3530] hover:text-[#fbf8f1] transition" aria-label="Cerrar (Esc)">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="border-t border-[#1b3530] px-6 py-4 bg-[#0e1f1c]">{footer}</div>}
      </div>
    </div>
  );
}

export const inputCls = "w-full rounded-xl border border-[#1f3d37] bg-[#0c1816] px-3.5 py-2.5 text-sm text-[#fbf8f1] placeholder:text-[#6a8077] outline-none transition focus:border-[#cca06a] focus:ring-2 focus:ring-[#cca06a]/20";
export const btnGhost = "rounded-xl border border-[#1f3d37] bg-[#17302c] px-4 py-2 text-sm font-medium text-[#dce7e2] hover:bg-[#1d3d37] hover:text-white transition-colors disabled:opacity-40";
export const btnPrimary = "rounded-xl bg-[#2ea88c] px-5 py-2.5 text-sm font-bold text-[#0c1816] hover:bg-[#38b598] transition-all shadow-md shadow-[#2ea88c]/20 disabled:cursor-not-allowed disabled:opacity-40";
export const btnDanger = "rounded-xl bg-[#c85a48] px-4 py-2 text-sm font-bold text-white hover:bg-[#d86b58] transition-colors disabled:opacity-40";
export const btnGold = "rounded-xl bg-[#cca06a] px-5 py-2.5 text-sm font-bold text-[#0c1816] hover:bg-[#dca872] transition-all shadow-md shadow-[#cca06a]/20 disabled:cursor-not-allowed disabled:opacity-40";
