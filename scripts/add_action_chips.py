file_path = r"c:\Users\patri\Downloads\TPV Mundial\lovable-frontend\src\components\erp\AssistantsModule.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

target = '{/* Chat Input Bar */}'

chips_bar = '''{/* Acciones Rápidas en Lenguaje Natural */}
        <div className="border-t border-border/60 bg-secondary/30 px-3.5 py-2 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-muted-foreground font-bold shrink-0 text-[10px] uppercase tracking-wider mr-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Acciones IA:
          </span>
          <button
            type="button"
            onClick={() => sendMessage("Cambia el nombre de Empanada de Queso por Empanada de Queso Llanero Premium")}
            className="rounded-lg border border-border bg-card px-2.5 py-1 font-medium text-foreground hover:border-primary hover:text-primary transition shrink-0"
          >
            ✏️ Renombrar Queso Llanero
          </button>
          <button
            type="button"
            onClick={() => sendMessage("Pon el precio de la Empanada de Carne Mechada a $1.85")}
            className="rounded-lg border border-border bg-card px-2.5 py-1 font-medium text-foreground hover:border-primary hover:text-primary transition shrink-0"
          >
            💲 Ajustar Precio Carne Mechada
          </button>
          <button
            type="button"
            onClick={() => sendMessage("¿Qué productos faltan en stock?")}
            className="rounded-lg border border-border bg-card px-2.5 py-1 font-medium text-foreground hover:border-primary hover:text-primary transition shrink-0"
          >
            📦 ¿Qué productos faltan?
          </button>
          <button
            type="button"
            onClick={() => sendMessage("Dame el informe de ventas de hoy")}
            className="rounded-lg border border-border bg-card px-2.5 py-1 font-medium text-foreground hover:border-primary hover:text-primary transition shrink-0"
          >
            📊 Ventas en Vivo
          </button>
          <button
            type="button"
            onClick={() => sendMessage("Organiza el inventario por precio")}
            className="rounded-lg border border-border bg-card px-2.5 py-1 font-medium text-foreground hover:border-primary hover:text-primary transition shrink-0"
          >
            🗂️ Organizar Inventario
          </button>
          <button
            type="button"
            onClick={() => sendMessage("Activa las alertas de stock")}
            className="rounded-lg border border-border bg-card px-2.5 py-1 font-medium text-foreground hover:border-primary hover:text-primary transition shrink-0"
          >
            🔔 Alertas Stock
          </button>
        </div>

        {/* Chat Input Bar */}'''

if target in code:
    code = code.replace(target, chips_bar, 1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Chips bar added successfully")
