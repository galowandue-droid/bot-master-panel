import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Percent, DollarSign, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReferralSettingsProps {
  settings: Record<string, string>;
  onSave: (settings: Record<string, string>) => void;
  isSaving: boolean;
}

export function ReferralSettings({ settings, onSave, isSaving }: ReferralSettingsProps) {
  const [formData, setFormData] = useState({
    referral_enabled: settings.referral_enabled || "true",
    referral_reward_type: settings.referral_reward_type || "percentage",
    referral_reward_amount: settings.referral_reward_amount || "10",
    referral_min_purchase: settings.referral_min_purchase || "0",
    referral_reward_percent: settings.referral_reward_percent || "10",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormData(prev => ({
        ...prev,
        referral_enabled: settings.referral_enabled || prev.referral_enabled,
        referral_reward_type: settings.referral_reward_type || prev.referral_reward_type,
        referral_reward_amount: settings.referral_reward_amount || prev.referral_reward_amount,
        referral_min_purchase: settings.referral_min_purchase || prev.referral_min_purchase,
        referral_reward_percent: settings.referral_reward_percent || prev.referral_reward_percent,
      }));
    }
  }, [settings]);

  const isEnabled = formData.referral_enabled === "true";

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.referral_reward_amount) {
      newErrors.referral_reward_amount = "Укажите сумму вознаграждения";
    } else {
      const amount = Number(formData.referral_reward_amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.referral_reward_amount = "Сумма должна быть положительным числом";
      }
      if (formData.referral_reward_type === "percentage" && amount > 100) {
        newErrors.referral_reward_amount = "Процент не может быть больше 100";
      }
    }

    if (!formData.referral_min_purchase) {
      newErrors.referral_min_purchase = "Укажите минимальную сумму покупки";
    } else {
      const minPurchase = Number(formData.referral_min_purchase);
      if (isNaN(minPurchase) || minPurchase < 0) {
        newErrors.referral_min_purchase = "Сумма должна быть неотрицательным числом";
      }
    }

    if (formData.referral_reward_percent) {
      const percent = Number(formData.referral_reward_percent);
      if (isNaN(percent) || percent <= 0 || percent > 100) {
        newErrors.referral_reward_percent = "Процент должен быть от 1 до 100";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast({
        title: "Ошибка валидации",
        description: "Проверьте правильность заполнения полей",
        variant: "destructive",
      });
      return;
    }

    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Настройки реферальной системы</CardTitle>
        </div>
        <CardDescription>
          Настройте параметры вознаграждений и условия для рефералов
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Реферальная система</Label>
              <p className="text-sm text-muted-foreground">
                Включить или выключить реферальную программу
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, referral_enabled: checked ? "true" : "false" }))
              }
            />
          </div>

          {isEnabled && (
            <>
              {/* Reward Type */}
              <div className="space-y-2">
                <Label>Тип вознаграждения</Label>
                <Select
                  value={formData.referral_reward_type}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, referral_reward_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Процент от покупки
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Фиксированная сумма
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {formData.referral_reward_type === "percentage"
                    ? "Реферер получит процент от суммы покупки реферала"
                    : "Реферер получит фиксированную сумму за каждого реферала"}
                </p>
              </div>

              {/* Reward Amount */}
              <div className="space-y-2">
                <Label htmlFor="reward-amount">
                  {formData.referral_reward_type === "percentage"
                    ? "Процент вознаграждения"
                    : "Сумма вознаграждения (₽)"}
                </Label>
                <Input
                  id="reward-amount"
                  type="number"
                  min="0"
                  max={formData.referral_reward_type === "percentage" ? "100" : undefined}
                  step="0.01"
                  placeholder={formData.referral_reward_type === "percentage" ? "10" : "100"}
                  value={formData.referral_reward_amount}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, referral_reward_amount: e.target.value }))
                  }
                />
                {errors.referral_reward_amount && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.referral_reward_amount}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {formData.referral_reward_type === "percentage"
                    ? "От 1 до 100% от суммы покупки реферала"
                    : "Фиксированная сумма в рублях"}
                </p>
              </div>

              {/* Percentage for trigger (for database function) */}
              {formData.referral_reward_type === "percentage" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Автоматическое начисление:</strong> При покупке реферала автоматически начисляется {formData.referral_reward_amount}% от суммы покупки рефереру через триггер в базе данных.
                  </AlertDescription>
                </Alert>
              )}

              {/* Minimum Purchase */}
              <div className="space-y-2">
                <Label htmlFor="min-purchase">Минимальная сумма покупки (₽)</Label>
                <Input
                  id="min-purchase"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={formData.referral_min_purchase}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, referral_min_purchase: e.target.value }))
                  }
                />
                {errors.referral_min_purchase && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.referral_min_purchase}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Минимальная сумма покупки для активации вознаграждения (0 = без ограничений)
                </p>
              </div>
            </>
          )}

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Сохранение..." : "Сохранить настройки"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
