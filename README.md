# Empanada POS Suite

# MASTER PROMPT: COMMERCEOS - DR. EMPANADAS POS, KDS & FISCAL BACKOFFICE (PRODUCTION SPEC)
Act as a Principal Frontend Architect & Senior Product Designer. Build an ultra-modern, tactile, offline-resilient restaurant web application for "Dr. Empanadas C.A." (RIF J-50123456-7, Caracas, Venezuela) containing three synchronized modules:
1. **POS Terminal (High-Speed Cashier Terminal)**
2. **KDS (Real-Time Kitchen & Fryer Display System)**
3. **Backoffice & Fiscal Auditing (Live KPIs, Shift Z-Cuts, and SENIAT Tax Book)**
CRITICAL TOKEN-SAVING & ARCHITECTURE RULE:
Do NOT generate massive static databases. Generate a clean, modular component tree with strict TypeScript contracts, reusable UI primitives, and a seed of 8 representative items. Every button, modal, keyboard shortcut, and audio event must be fully interactive with zero dead clicks.
---
## 🎨 1. DESIGN SYSTEM, SOUNDS & KEYBOARD ERGONOMICS
- **Aesthetic**: Premium high-contrast dark theme inspired by Square Register and Linear.
  - Canvas: `bg-slate-950` / Cards: `bg-slate-900 border border-slate-800`
  - Emerald: `bg-emerald-600 hover:bg-emerald-500 text-white` (Cash / Primary CTA)
  - Sky Blue: `text-sky-400 bg-sky-950/60 border-sky-500/30` (Currency / Metrics)
  - Amber: `text-amber-400 bg-amber-500/10 border-amber-500/20` (Fryer Warnings / Discrepancy)
  - Rose: `bg-rose-600 hover:bg-rose-500` (Fiscal Close / Overdue KDS orders)
- **Audio Synthesis (`src/services/sound.ts` via Web Audio API, 0 external assets)**:
  - `playBeep()`: 1200Hz 35ms pulse on item add / barcode scan.
  - `playCashChime()`: Ascending dual chord (523Hz -> 659Hz) on completed sale.
  - `playKitchenBell()`: 880Hz alert when a new order enters KDS.
- **Global Keyboard Shortcuts**:
  - `[F1]`: Navigate to POS Terminal.
  - `[F2]`: Navigate to Kitchen KDS.
  - `[F3]`: Navigate to Backoffice.
  - `[/]` or `[F5]`: Focus catalog search bar.
  - `[F10]` or `[Space]` (with active cart): Open Split Payment Checkout.
  - `[Escape]`: Close modals / cancel active actions.
---
## 🧭 2. TOPBAR & SHELL CONTROLS
Persistent top header across all views:
1. **Brand Badge**: "🥟 Dr. Empanadas C.A." · `RIF: J-50123456-7` · Barra Chacao.
2. **Live Official BCV Rate**:
   - `BCV: Bs. 36.50 / USD` pill with manual override modal (updates all Bs/USD calculations app-wide).
3. **Cashier Shift Session**:
   - Pill: `María P. (Caja 01) · 3h 24m` + Trigger `[ 🔒 Arqueo / Cierre X-Z ]`.
4. **Fiscal Hardware Status**:
   - Badge: `[ 🖨️ Fiscal HKA: COM3 ● ]` (opens Serial/WebSerial Hardware Diagnostic modal).
5. **View Tabs (with live badges)**:
   - `[ 🛒 Terminal TPV (F1) ]`
   - `[ 🍳 Cocina KDS (F2) ]` (displays active pending fryer orders counter badge)
   - `[ 📊 Backoffice Gerencial (F3) ]`
---
## 🛒 3. VIEW 1: POS TERMINAL (CAJA RÁPIDA)
Layout: 65% Catalog Grid (Left), 35% Ticket & Totals Sidebar (Right).
### A. Catalog & Quick Order (Left):
- Category filter pills: `Todos`, `Empanadas Clásicas`, `Empanadas Especiales`, `Combos`, `Bebidas`, `Salsas & Extras`.
- Search bar with instant keyboard auto-focus.
- **Product Card (`ProductCard.tsx`)**:
  - Emoji / thumbnail, product name, stock badge (`45 und`).
  - Prominent dual price: Bolívares primary (`Bs. 182,50`) + USD secondary (`$5.00 USD`).
  - Modifier quick-chips (e.g. "Tártara extra", "Masa crujiente").
  - Click adds item, triggers `playBeep()`, and animates cart icon.
### B. Cart & Ticket Calculator (Right):
- Scrollable line items with `+`, `-`, trash, and custom kitchen note input ("Bien tostada", "Sin salsa").
- Order type toggle: `[ 🍽️ Para Comer Aquí ]` vs. `[ 🥡 Para Llevar ]`.
- Order discount pills: `0%`, `5%`, `10%`, `Cortesía`.
- **Financial Breakdown (Strict Venezuelan Accounting)**:
  - Base Imponible (16% IVA): `Bs. xxx` / `$ xxx`
  - Débito Fiscal IVA (16%): `Bs. xxx` / `$ xxx`
  - IGTF Proyectado (3% sobre divisas): Calculado dinámicamente según monto pagado en USD.
  - **TOTAL A PAGAR**: Bold visual in both `Bs.` and `$ USD`.
- Main CTA: `[ 💳 COBRAR ORDEN (F10) ]` (Large Emerald button).
---
## 💳 4. SPLIT PAYMENT MODAL (`PaymentModal.tsx` - PAGO MIXTO REAL)
Crucial: Implement true multi-tender split payments (e.g., customer pays $10 cash + remainder via Pago Móvil):
- Header shows: `Total Orden: Bs. X ($ Y USD)` and dynamic `Saldo Restante: Bs. X ($ Y USD)`.
- **Payment Tender Rows**:
  1. **💵 Divisas USD en Efectivo**:
     - Input in USD (Quick buttons: `$5`, `$10`, `$20`, `$50`).
     - **Exact IGTF (3%) Rule**: Automatically calculates 3% tax ONLY over the USD amount tendered:
       `IGTF (3%) = Monto_USD * 0.03 * Tasa_BCV`.
     - Vuelto / Change calculator in USD or Bs.
  2. **📱 Pago Móvil C2P / P2P**:
     - Dynamic interbank QR payload preview.
     - Bank selector (BDV, Banesco, Mercantil, Bancamiga), telephone, and last 4 reference digits.
  3. **💳 Punto de Venta / Tarjeta Débito**:
     - Reference number and POS terminal lot number inputs.
  4. **💵 Efectivo Bolívares (Bs.)**:
     - Quick bill denomination buttons (`Bs. 50`, `100`, `200`, `500`).
- Button `[ + Registrar Pago Parcial ]` appends tender row to an active payments list with a delete button.
- Completion rule: Confirm button is enabled ONLY when `Saldo Restante <= 0.00`.
- On confirmation:
  1. Triggers `playCashChime()`.
  2. Creates order and dispatches it directly to the KDS (with `playKitchenBell()`).
  3. Opens Thermal Ticket Preview Modal.
---
## 🍳 5. VIEW 2: KITCHEN DISPLAY SYSTEM (KDS - ESTACIÓN DE FREIDORAS)
Card grid for kitchen staff with live timers and status progression:
- **Order Card (`KdsTicketCard.tsx`)**:
  - Header: Ticket `#1042`, Type badge (`Para Llevar` / `Mesa 2`), Elapsed timer updated every second.
  - Dynamic Border Color based on elapsed time:
    - `< 5 min`: Green (`border-emerald-500/50`) - Normal.
    - `5 - 10 min`: Amber (`border-amber-500/60`) - Attention.
    - `> 10 min`: Pulsing Red (`border-rose-500 animate-pulse`) - Delayed.
  - Item List:
    - Empanadas bolded with quantity: `[ 3X ] PABELLÓN CRIOLLO`, `[ 2X ] QUESO BLANCO`.
    - Custom notes highlighted in yellow tags ("Bien tostada").
    - Drinks automatically filtered out or routed to a "Barra / Bebidas" sub-section.
  - Status Progression Buttons:
    `[ ⏱️ En Freidora ]` ➔ `[ ✅ Listo para Entrega ]` ➔ `[ 📦 Despachado ]`.
- Top summary bar: Total pending empanadas grouped by flavor (e.g. `12 Queso`, `7 Mechada`, `4 Cazón`).
---
## 🧾 6. THERMAL TICKET & FISCAL PREVIEW (`ThermalTicketModal.tsx`)
Monospace font preview with `[ 80mm ]` vs `[ 58mm ]` width selector:
- Tabs:
  1. `🧾 Factura Cliente (SENIAT)`: Legal company header (Dr. Empanadas C.A., RIF J-50123456-7), items, taxable base, VAT 16%, IGTF 3% breakdown, total in Bs. and USD, and payment breakdown.
  2. `🍳 Comanda Freidoras`: High-contrast fryer slip with ticket #, time, items in `[ 3X ]`, and kitchen notes. No drinks.
- Actions: `[ 🖨️ Imprimir Ticket ]` (clean `@media print` CSS without browser headers) and `[ 📑 Imprimir Ambos ]`.
---
## 🔒 7. BLIND CASH SHIFT AUDIT (`CashShiftModal.tsx` - CORTE X / Z)
Blind cash drawer reconciliation (Arqueo Ciego):
- Inputs for physical drawer count:
  - Efectivo Bolívares (`Bs.`)
  - Efectivo Dólares (`$ USD`)
  - Lote Datáfono / Punto de Venta (`Bs.`)
  - Total Comprobantes Pago Móvil (`Bs.`)
  - Observaciones del cajero.
- Calculation: Compares declared total vs. theoretical system sales without revealing expected figures beforehand.
- Alert: `✓ Cuadre Exacto`, `⚠️ Sobrante en Gaveta` or `⚠️ Faltante en Gaveta`.
- Actions:
  - `[ 📄 Generar Corte X ]`: Partial shift audit without resetting counters.
  - `[ 🔒 Ejecutar Cierre Z ]`: Daily fiscal close with cashier/manager signature lines, archiving into shift history and resetting sales counters.
---
## 📊 8. VIEW 3: BACKOFFICE GERENCIAL
Tabs layout:
1. **KPI Dashboard**: 4 Summary cards (Facturación Bruta Bs/USD, Tickets emitidos, Ticket Promedio USD, Margen Bruto 60.3%), live transaction audit table.
2. **Inventario & Fichas de Costo**: Table with SKU, Producto, Categoría, Precio Venta, Costo, Margen %, Stock en Barra, Stock en Cocina.
3. **Auditoría de Turnos y Cortes Z**: History of shift closures, discrepancies, and cashiers.
4. **Libro de Ventas Fiscal (SENIAT Providencia 0071)**: Official sales tax log with invoice numbers, control numbers, tax bases, VAT, and IGTF.
5. **Excel Export Engine**: Every table has a working `[ 📥 Exportar a Excel ]` button generating CSV with `\uFEFF` UTF-8 BOM encoding so Microsoft Excel opens it without corrupted characters.
---
## ⚙️ 9. PHYSICAL FISCAL PRINTER MODAL (`FiscalPrinterModal.tsx`)
Serial hardware bridge modal for physical fiscal printers (The Factory HKA / Bixolon SRP-350 / Bematech):
- Activation toggle: `[ ● MODO FISCAL ACTIVO / ○ TICKET VIRTUAL ]`.
- Communication architecture: Supports Web Serial API (`navigator.serial`) with fallback to local proxy bridge (`http://localhost:8080/fiscal`).
- Port selector (`COM1` to `COM8`, `USB-Serial`) and Baud Rate (`9600 bps`, `19200 bps`).
- Status panel: Paper sensor, Fiscal Memory status, Last Invoice #, Last Z-Report #.
- Direct hardware buttons: `[ ⚡ Test Status (S1) ]`, `[ 🗄️ Abrir Gaveta (7) ]`, `[ 📄 Reporte X (I0X) ]`, `[ 🔒 Reporte Z (I0Z) ]`.
---
## 🧱 10. FILE STRUCTURE & SEED MOCK DATA
Organize the project cleanly:
- `src/types/pos.ts`: Interfaces for `Product`, `CartItem`, `PaymentSplit`, `Order`, `KdsTicket`, `ShiftAudit`, `FiscalConfig`.
- `src/data/mockProducts.ts`: Seed array with 8 realistic items:
  1. Empanada Mechada (Bs. 182,50 / $5.00)
  2. Empanada Pabellón Criollo (Bs. 219,00 / $6.00)
  3. Empanada Queso Blanco Llanero (Bs. 146,00 / $4.00)
  4. Empanada Cazón Margariteño (Bs. 182,50 / $5.00)
  5. Combo Mañanero 2 Empanadas + Café (Bs. 328,50 / $9.00)
  6. Malta Polar 355ml (Bs. 54,75 / $1.50)
  7. Café Guayoyo Criollo (Bs. 36,50 / $1.00)
  8. Salsa Guasacaca Especial (Bs. 25,00 / $0.68)
- `src/context/PosContext.tsx`: Central state with `localStorage` persistence (cart, orders, KDS tickets, BCV rate, active shift, shift history).
- `src/services/api.ts`: HTTP client pointing to `http://localhost:4000/api/v1` with a `USE_MOCK = true` fallback flag.
Build a cohesive, responsive, fully interactive web application with smooth transitions, dialogs, and tactile feedback!

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/51a2d117-8063-470a-b096-51538fb5dde3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
