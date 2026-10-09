export const IVA = 0.16;
export const IGTF = 0.03;

const bsFmt = new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtBs = (n: number) => `Bs. ${bsFmt.format(n)}`;
export const fmtUsd = (n: number) => `$${n.toFixed(2)}`;
export const r2 = (n: number) => Math.round(n * 100) / 100;

/** Prices are IVA-inclusive. Returns breakdown in Bs. */
export function breakdown(grossUsd: number, discountPct: number, rate: number) {
  const totalUsd = r2(grossUsd * (1 - discountPct / 100));
  const totalBs = r2(totalUsd * rate);
  const baseBs = r2(totalBs / (1 + IVA));
  const ivaBs = r2(totalBs - baseBs);
  return { totalUsd, totalBs, baseBs, ivaBs };
}

export const igtfFor = (usdTendered: number, rate: number) => r2(usdTendered * IGTF * rate);

export function downloadCsv(name: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [headers, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
