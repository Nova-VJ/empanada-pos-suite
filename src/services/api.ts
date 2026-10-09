import type { Order, ShiftAudit } from "@/types/pos";

export const API_BASE = "http://localhost:4000/api/v1";
export const USE_MOCK = true;

async function request<T>(path: string, init?: RequestInit, mock?: T): Promise<T> {
  if (USE_MOCK) return Promise.resolve(mock as T);
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  createOrder: (o: Order) => request<Order>("/orders", { method: "POST", body: JSON.stringify(o) }, o),
  closeShift: (s: ShiftAudit) => request<ShiftAudit>("/shifts", { method: "POST", body: JSON.stringify(s) }, s),
  getBcvRate: () => request<{ rate: number }>("/bcv", undefined, { rate: 36.5 }),
};
