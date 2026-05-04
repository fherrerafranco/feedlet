import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { FORM_DEFAULTS } from "@/lib/constants";
import { validateInput, type ValidationError } from "@/lib/calculator";
import type { FeedingInput } from "@/lib/types";
import { Baby, Calculator } from "lucide-react";

interface FeedingFormProps {
  onCalculate: (input: FeedingInput) => void;
}

export function FeedingForm({ onCalculate }: FeedingFormProps) {
  const [form, setForm] = useState<FeedingInput>(FORM_DEFAULTS);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [customFirstMeal, setCustomFirstMeal] = useState(false);

  function fieldError(field: keyof FeedingInput): string | undefined {
    return errors.find((e) => e.field === field)?.message;
  }

  function handleChange(field: keyof FeedingInput, value: string | number) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "wakeUpTime" && !customFirstMeal) {
        next.firstMealTime = value as string;
      }
      return next;
    });
    setErrors((prev) => prev.filter((e) => e.field !== field));
  }

  function handleCustomFirstMealToggle(checked: boolean) {
    setCustomFirstMeal(checked);
    if (checked) {
      setForm((prev) => ({
        ...prev,
        customFirstMeal: true,
        firstMealScoops: prev.firstMealScoops ?? 2,
        firstMealWaterOz: prev.firstMealWaterOz ?? 4,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        customFirstMeal: false,
        firstMealTime: prev.wakeUpTime,
        firstMealScoops: undefined,
        firstMealWaterOz: undefined,
      }));
      setErrors((prev) =>
        prev.filter(
          (e) =>
            e.field !== "firstMealTime" &&
            e.field !== "firstMealScoops" &&
            e.field !== "firstMealWaterOz",
        ),
      );
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateInput(form);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    onCalculate(form);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
            <Baby className="h-5 w-5 text-primary-500" />
          </div>
          <div>
            <CardTitle>Feeding Parameters</CardTitle>
            <CardDescription>
              Set the schedule constraints for your baby's day
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 text-sm font-semibold text-primary-600 uppercase tracking-wide">
              Schedule Times
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Wake-up Time"
                type="time"
                value={form.wakeUpTime}
                onChange={(e) => handleChange("wakeUpTime", e.target.value)}
                error={fieldError("wakeUpTime")}
              />

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={customFirstMeal}
                    onChange={(e) => handleCustomFirstMealToggle(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-300 text-primary-500 accent-primary-500"
                  />
                  Customize first meal
                </label>
                {customFirstMeal ? (
                  <div className="flex flex-col gap-3 rounded-xl border border-surface-200 bg-surface-50 p-3">
                    <Input
                      label="First Meal Time"
                      type="time"
                      value={form.firstMealTime}
                      onChange={(e) => handleChange("firstMealTime", e.target.value)}
                      error={fieldError("firstMealTime")}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Scoops"
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={form.firstMealScoops ?? ""}
                        onChange={(e) =>
                          handleChange("firstMealScoops" as keyof FeedingInput, Number(e.target.value))
                        }
                        error={fieldError("firstMealScoops" as keyof FeedingInput)}
                      />
                      <Input
                        label="Water"
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={form.firstMealWaterOz ?? ""}
                        onChange={(e) =>
                          handleChange("firstMealWaterOz" as keyof FeedingInput, Number(e.target.value))
                        }
                        error={fieldError("firstMealWaterOz" as keyof FeedingInput)}
                        suffix="oz"
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      Remaining scoops will be distributed evenly across other sessions
                    </p>
                  </div>
                ) : (
                  <p className="px-1 text-xs text-gray-400">
                    First meal starts at wake-up ({form.wakeUpTime})
                  </p>
                )}
              </div>

              <Input
                label="Night Sleep Time"
                type="time"
                value={form.nightSleepTime}
                onChange={(e) => handleChange("nightSleepTime", e.target.value)}
                error={fieldError("nightSleepTime")}
              />
              <Input
                label="Rest Before Sleep"
                type="number"
                min={0}
                max={120}
                step={5}
                value={form.restBeforeSleepMinutes}
                onChange={(e) =>
                  handleChange("restBeforeSleepMinutes", Number(e.target.value))
                }
                error={fieldError("restBeforeSleepMinutes")}
                suffix="min"
                hint="Time between last feed and bedtime"
              />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 text-sm font-semibold text-primary-600 uppercase tracking-wide">
              Formula Settings
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Total Target Scoops"
                type="number"
                min={1}
                step={0.5}
                value={form.totalTargetScoops}
                onChange={(e) =>
                  handleChange("totalTargetScoops", Number(e.target.value))
                }
                error={fieldError("totalTargetScoops")}
                hint="Formula scoops for the entire day"
              />
              <Input
                label="Stomach Capacity"
                type="number"
                min={0.5}
                step={0.5}
                value={form.stomachCapacityOz}
                onChange={(e) =>
                  handleChange("stomachCapacityOz", Number(e.target.value))
                }
                error={fieldError("stomachCapacityOz")}
                suffix="oz"
                hint="Max oz per single feeding"
              />
              <Input
                label="Water per Scoop"
                type="number"
                min={0.5}
                step={0.5}
                value={form.waterOzPerScoop}
                onChange={(e) =>
                  handleChange("waterOzPerScoop", Number(e.target.value))
                }
                error={fieldError("waterOzPerScoop")}
                suffix="oz"
                hint="Formula brand ratio"
              />
            </div>
          </fieldset>

          <Button type="submit" className="mt-2 w-full sm:w-auto sm:self-end">
            <Calculator className="h-4 w-4" />
            Calculate Schedule
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
