import { createFileRoute } from "@tanstack/react-router";
import { usePos } from "@/context/PosContext";
import { DashboardModule } from "@/components/erp/DashboardModule";
import { ProductsModule } from "@/components/erp/ProductsModule";
import { InventoryModule } from "@/components/erp/InventoryModule";
import { CustomersModule } from "@/components/erp/CustomersModule";
import { InvoicingModule } from "@/components/erp/InvoicingModule";
import { SuppliersModule } from "@/components/erp/SuppliersModule";
import { CashModule } from "@/components/erp/CashModule";
import { ExpensesModule } from "@/components/erp/ExpensesModule";
import { ReportsModule } from "@/components/erp/ReportsModule";
import { AccountingModule } from "@/components/erp/AccountingModule";
import { AssistantsModule } from "@/components/erp/AssistantsModule";
import { RecommendationsModule } from "@/components/erp/RecommendationsModule";
import { SettingsModule } from "@/components/erp/SettingsModule";

export const Route = createFileRoute("/backoffice")({
  head: () => ({
    meta: [
      { title: "NovaSystem ERP & Backoffice · Dr. Empanadas C.A." },
      { name: "description", content: "Suite integral ERP, CRM, Inventario, Compras, Contabilidad, IA y Fiscal SENIAT de Dr. Empanadas C.A." },
      { property: "og:title", content: "NovaSystem ERP & Backoffice · Dr. Empanadas C.A." },
      { property: "og:description", content: "Gestión empresarial, auditoría fiscal SENIAT, compras, bancos e inteligencia artificial." },
    ],
  }),
  component: Backoffice,
});

function Backoffice() {
  const { activeModule } = usePos();

  const renderActive = () => {
    switch (activeModule) {
      case "products":
        return <ProductsModule />;
      case "inventory":
        return <InventoryModule />;
      case "customers":
        return <CustomersModule />;
      case "invoicing":
        return <InvoicingModule />;
      case "suppliers":
        return <SuppliersModule />;
      case "cash":
        return <CashModule />;
      case "expenses":
        return <ExpensesModule />;
      case "reports":
        return <ReportsModule />;
      case "accounting":
        return <AccountingModule />;
      case "assistants":
        return <AssistantsModule />;
      case "recommendations":
        return <RecommendationsModule />;
      case "settings":
        return <SettingsModule />;
      case "dashboard":
      default:
        return <DashboardModule />;
    }
  };

  return (
    <div className="p-6 bg-background min-h-[calc(100vh-56px)]">
      {renderActive()}
    </div>
  );
}
