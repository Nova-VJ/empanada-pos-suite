import { useState } from "react";
import { toast } from "sonner";
import { usePos } from "@/context/PosContext";
import { Modal, btnDanger, btnGhost, inputCls } from "./Modal";

const PORTS = ["COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "USB-Serial"];
const BRIDGE = "http://localhost:8080/fiscal";

type SerialNav = { serial?: { requestPort: () => Promise<{ open: (o: { baudRate: number }) => Promise<void>; writable: WritableStream<Uint8Array> | null; close: () => Promise<void> }> } };

export function FiscalPrinterModal() {
  const pos = usePos();
  const f = pos.fiscal;
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const push = (m: string) => setLog((l) => [`${new Date().toLocaleTimeString("es-VE")} ${m}`, ...l].slice(0, 30));

  async function send(cmd: string, label: string) {
    setBusy(true);
    push(`→ ${cmd} (${label})`);
    const nav = navigator as unknown as SerialNav;
    try {
      if (f.fiscalMode && nav.serial) {
        const port = await nav.serial.requestPort();
        await port.open({ baudRate: f.baud });
        const w = port.writable?.getWriter();
        await w?.write(new TextEncoder().encode(`\x02${cmd}\x03`));
        w?.releaseLock();
        await port.close();
        push(`← ACK vía Web Serial @ ${f.baud} bps`);
      } else if (f.fiscalMode) {
        const r = await fetch(BRIDGE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ port: f.port, baud: f.baud, cmd }) });
        push(`← Bridge ${r.status}`);
      } else {
        await new Promise((r) => setTimeout(r, 350));
        push("← ACK (Ticket Virtual · simulado)");
      }
      if (cmd === "I0Z") pos.setFiscal({ lastZ: f.lastZ + 1 });
      toast.success(`${label}: OK`);
    } catch (e) {
      push(`✕ ${(e as Error).message}`);
      toast.error(`${label}: sin respuesta del puerto ${f.port}`);
      pos.setFiscal({ connected: false });
    } finally {
      setBusy(false);
    }
  }

  const Stat = ({ k, v, ok = true }: { k: string; v: string; ok?: boolean }) => (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{k}</div>
      <div className={`font-mono text-sm font-semibold ${ok ? "text-emerald-400" : "text-rose-400"}`}>{v}</div>
    </div>
  );

  return (
    <Modal title="🖨️ Impresora Fiscal · Diagnóstico de Hardware" onClose={() => pos.setModal(null)}>
      <button onClick={() => pos.setFiscal({ fiscalMode: !f.fiscalMode })} className={`w-full rounded-xl border px-4 py-3 text-left font-mono text-sm font-bold ${f.fiscalMode ? "border-emerald-500/50 bg-emerald-600/15 text-emerald-300" : "border-slate-700 bg-slate-950 text-slate-400"}`}>
        {f.fiscalMode ? "● MODO FISCAL ACTIVO" : "○ TICKET VIRTUAL"}
        <span className="ml-2 text-xs font-normal opacity-70">— toca para cambiar</span>
      </button>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <label className="text-xs text-slate-400">Modelo
          <select value={f.model} onChange={(e) => pos.setFiscal({ model: e.target.value })} className={`${inputCls} mt-1`}>
            {["The Factory HKA80", "Bixolon SRP-350", "Bematech MP-4200"].map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-400">Puerto
          <select value={f.port} onChange={(e) => pos.setFiscal({ port: e.target.value })} className={`${inputCls} mt-1`}>{PORTS.map((p) => <option key={p}>{p}</option>)}</select>
        </label>
        <label className="text-xs text-slate-400">Baudios
          <select value={f.baud} onChange={(e) => pos.setFiscal({ baud: Number(e.target.value) as 9600 | 19200 })} className={`${inputCls} mt-1`}>
            <option value={9600}>9600 bps</option><option value={19200}>19200 bps</option>
          </select>
        </label>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Comunicación: Web Serial API (navigator.serial) con respaldo a puente local {BRIDGE}.</p>
      <div className="mt-4 grid grid-cols-4 gap-2">
        <Stat k="Papel" v={f.paperOk ? "OK" : "SIN PAPEL"} ok={f.paperOk} />
        <Stat k="Memoria Fiscal" v={f.memoryOk ? "OK" : "ERROR"} ok={f.memoryOk} />
        <Stat k="Últ. Factura" v={String(f.lastInvoice).padStart(8, "0")} />
        <Stat k="Últ. Reporte Z" v={`#${f.lastZ}`} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <button disabled={busy} className={btnGhost} onClick={async () => { await send("S1", "Test Status"); pos.setFiscal({ connected: true }); }}>⚡ Test Status (S1)</button>
        <button disabled={busy} className={btnGhost} onClick={() => send("7", "Abrir Gaveta")}>🗄️ Abrir Gaveta (7)</button>
        <button disabled={busy} className={btnGhost} onClick={() => send("I0X", "Reporte X")}>📄 Reporte X (I0X)</button>
        <button disabled={busy} className={btnDanger} onClick={() => confirm("¿Emitir Reporte Z en la impresora fiscal?") && send("I0Z", "Reporte Z")}>🔒 Reporte Z (I0Z)</button>
      </div>
      <pre className="mt-4 h-32 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-2 font-mono text-[11px] text-slate-400">{log.length ? log.join("\n") : "Consola serial lista…"}</pre>
    </Modal>
  );
}
