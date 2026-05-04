import { useState, useCallback } from "react";
import { computeSchedule, validateInput, type ValidationError } from "@/lib/calculator";
import { FORM_DEFAULTS } from "@/lib/constants";
import type { FeedingInput, FeedingSchedule } from "@/lib/types";

export function useSchedule() {
  const [input, setInput] = useState<FeedingInput>(FORM_DEFAULTS);
  const [schedule, setSchedule] = useState<FeedingSchedule | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const calculate = useCallback((data: FeedingInput) => {
    const validationErrors = validateInput(data);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setSchedule(null);
      return;
    }
    setErrors([]);
    setInput(data);
    setSchedule(computeSchedule(data));
  }, []);

  const reset = useCallback(() => {
    setSchedule(null);
    setErrors([]);
  }, []);

  return { input, schedule, errors, calculate, reset } as const;
}
