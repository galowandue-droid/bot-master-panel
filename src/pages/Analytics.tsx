import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { PeriodComparison } from "@/components/analytics/PeriodComparison";
import { ConversionFunnel } from "@/components/analytics/ConversionFunnel";
import { BarChart3 } from "lucide-react";

export default function Analytics() {
  return (
    <PageContainer>
      <PageHeader
        title="Аналитика"
        description="Расширенная аналитика и метрики эффективности"
      />
      
      <div className="space-y-6">
        <PeriodComparison />
        <ConversionFunnel />
      </div>
    </PageContainer>
  );
}
