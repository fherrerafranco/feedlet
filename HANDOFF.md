# Feedlet -- Agent Handoff Document

## What is this?

**Feedlet** is a baby feeding schedule calculator SPA. Parents enter their baby's daily constraints (wake/sleep times, total formula, stomach capacity) and the app computes an optimized feeding schedule with the right scoops and water per session.

**Live state:** The app builds and runs (`npm run build` passes, dev server at `localhost:5173`). It is feature-complete but has not been deployed yet.

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Vite 8 + React 19 + TypeScript 6 | Static SPA, no backend |
| Styling | Tailwind CSS v4 | `@theme` tokens in `src/index.css` for pastel palette |
| Icons | lucide-react | `Baby`, `Calculator`, `Clock`, `Droplets`, `Utensils`, etc. |
| Utils | clsx + tailwind-merge | Combined via `cn()` in `src/lib/utils.ts` |
| PWA | Manual service worker + manifest | `public/sw.js` (network-first cache), `public/manifest.json` |
| Deployment | Vercel static | `vercel.json` configured, output dir `dist/` |
| Font | Inter via Google Fonts CDN | Loaded in `index.html` with `font-display: swap` |

**No database.** Future plan discussed: Supabase free tier with 30-day history retention, but not implemented.

---

## Project Structure

```
baby-feeding-schedule/
├── index.html                 # Entry HTML with meta, fonts, PWA manifest link
├── package.json
├── vite.config.ts             # Tailwind plugin + @ alias
├── tsconfig.app.json          # Path aliases (@/* -> src/*)
├── vercel.json                # Vercel deployment config
├── public/
│   ├── favicon.svg            # Baby bottle SVG favicon
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker (network-first)
│   ├── icon-192.png           # PWA icon
│   ├── icon-512.png           # PWA icon
│   └── apple-touch-icon.png   # iOS home screen icon
└── src/
    ├── main.tsx               # Entry point + SW registration
    ├── App.tsx                # Layout shell: Header, Form, Results, Footer
    ├── index.css              # Tailwind imports, @theme tokens, animations
    ├── hooks/
    │   └── useSchedule.ts     # State hook: form -> validate -> compute -> results
    ├── lib/
    │   ├── types.ts           # FeedingInput, FeedingSession, FeedingSchedule, ScheduleWarning
    │   ├── constants.ts       # Interval bounds, defaults, form defaults
    │   ├── calculator.ts      # Pure functions: validateInput, computeSchedule, formatTime
    │   └── utils.ts           # cn() utility
    └── components/
        ├── Header.tsx         # App branding
        ├── Footer.tsx         # "Built with care for tiny humans"
        ├── FeedingForm.tsx    # All input fields + "Customize first meal" toggle
        ├── ScheduleDisplay.tsx # Timeline + Summary cards
        └── ui/
            ├── Button.tsx     # primary/secondary variants
            ├── Card.tsx       # Card, CardHeader, CardTitle, CardDescription, CardContent
            └── Input.tsx      # label, error, hint, suffix support
```

---

## Architecture & Data Flow

```
User fills FeedingForm
       │
       ▼
FeedingForm.handleSubmit()
  → validateInput(form)     ← src/lib/calculator.ts
  → if valid: onCalculate(form)
       │
       ▼
App.tsx receives via useSchedule.calculate()
  → computeSchedule(input)  ← src/lib/calculator.ts
  → sets schedule state
       │
       ▼
ScheduleDisplay renders:
  - Warning alerts (if any)
  - Vertical timeline of FeedingSession cards
  - Summary stats grid (sessions, scoops, water, interval)
```

---

## Key Business Logic (`src/lib/calculator.ts`)

### Input Parameters

| Field | Type | Description |
|-------|------|-------------|
| wakeUpTime | string (HH:MM) | Baby's wake-up time |
| firstMealTime | string (HH:MM) | Defaults to wakeUpTime unless custom toggle is on |
| nightSleepTime | string (HH:MM) | Target bedtime |
| restBeforeSleepMinutes | number | Gap between last feed and bedtime (0-120) |
| totalTargetScoops | number | Total formula scoops for the day |
| stomachCapacityOz | number | Max oz per feeding |
| waterOzPerScoop | number | Configurable ratio (default: 2 oz/scoop) |
| customFirstMeal? | boolean | Toggle for custom first meal |
| firstMealScoops? | number | Scoops for first meal (when custom) |
| firstMealWaterOz? | number | Water oz for first meal (when custom) |

### Algorithm Summary

1. Compute feeding window: `firstMealTime` to `nightSleepTime - restBeforeSleep`
2. Calculate valid range of feedings based on 2.5-3.5 hour interval constraint
3. Pick optimal count (prefer ~3h intervals)
4. If custom first meal: subtract its scoops from total, distribute rest evenly
5. If per-feed water exceeds stomach capacity: increase feeding count
6. Generate evenly-spaced sessions with rounded scoops (0.5) and water (0.5)
7. Attach warnings if intervals are too tight or capacity is exceeded

### Rounding

All scoops and water values are rounded to the nearest 0.5 (`roundToHalf`).

### Time Display

`formatTime()` converts 24h strings to 12h AM/PM format.

---

## Custom First Meal Feature

The form has a "Customize first meal" checkbox that:
- **Off (default):** First meal time = wake-up time, scoops/water distributed evenly
- **On:** Reveals a sub-panel with:
  - Custom first meal time picker
  - First meal scoops input
  - First meal water (oz) input
  - Remaining scoops are distributed evenly across the other sessions

When toggled off, first meal fields reset and sync back to wake-up time.

---

## Design System

### Theme Colors (defined in `src/index.css` via `@theme`)

- **Primary:** Lavender scale (50-900), main: `#6b5aad`
- **Accent:** Warm peach scale (50-600), main: `#ffa371`
- **Surface:** Warm cream (50-300), background: `#fdfcfa`
- **Semantic:** success `#6db88f`, warning `#e8b44a`, danger `#d96b6b`

### UI Components

- `Card` - rounded-2xl, white bg, subtle border/shadow
- `Input` - rounded-xl, focus ring with primary color, supports label/error/hint/suffix
- `Button` - primary (lavender) and secondary (surface) variants, active scale effect

### Animations

- Timeline cards: staggered `slideUp` animation (`80ms` delay per card index)
- Results section: `translate-y + opacity` transition on mount
- Buttons: `active:scale-[0.98]`

---

## PWA Setup

- **Manifest:** `public/manifest.json` - standalone display, lavender theme color
- **Service Worker:** `public/sw.js` - network-first with cache fallback
- **Registration:** In `src/main.tsx` on window load
- **Icons:** `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` in `public/`

---

## Commands

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # TypeScript check + Vite production build -> dist/
npm run preview  # Preview production build locally
npm run lint     # ESLint
```

---

## Known Issues / Not Yet Done

1. **No git repo initialized** -- run `git init` and make first commit
2. **PWA icons are placeholders** -- the 192 and 512 PNGs are the same generated image (not properly sized)
3. **No unit tests** -- calculator.ts is pure functions, ideal for testing
4. **No database/history** -- discussed adding Supabase free tier with 30-day retention, deferred
5. **Water-per-scoop input step** -- currently 0.5; some brands may need 0.25 granularity
6. **`class-variance-authority`** package is installed but unused (can be removed)
7. **`vite-plugin-pwa`** was not installed (incompatible with Vite 8), manual SW used instead

---

## Deployment Checklist

- [ ] `git init && git add . && git commit`
- [ ] Push to GitHub
- [ ] Connect repo to Vercel
- [ ] Vercel auto-detects Vite, uses `vercel.json` config
- [ ] Verify PWA install prompt works on mobile
- [ ] (Optional) Add custom domain

---

## File Contents Reference

Every source file is listed below for quick copy-paste context.

### `src/lib/types.ts`

```typescript
export interface FeedingInput {
  wakeUpTime: string;
  firstMealTime: string;
  nightSleepTime: string;
  restBeforeSleepMinutes: number;
  totalTargetScoops: number;
  stomachCapacityOz: number;
  waterOzPerScoop: number;
  customFirstMeal?: boolean;
  firstMealScoops?: number;
  firstMealWaterOz?: number;
}

export interface FeedingSession {
  index: number;
  startTime: string;
  estimatedEndTime: string;
  scoops: number;
  waterOz: number;
}

export interface ScheduleWarning {
  type: "capacity_exceeded" | "impossible_schedule" | "tight_schedule";
  message: string;
}

export interface FeedingSchedule {
  sessions: FeedingSession[];
  intervalMinutes: number;
  totalScoops: number;
  totalWaterOz: number;
  warnings: ScheduleWarning[];
}
```

### `src/lib/constants.ts`

```typescript
export const MIN_INTERVAL_HOURS = 2.5;
export const MAX_INTERVAL_HOURS = 3.5;
export const SESSION_DURATION_MIN_MINUTES = 10;
export const SESSION_DURATION_MAX_MINUTES = 20;
export const SESSION_DURATION_AVG_MINUTES = 15;

export const DEFAULT_WATER_OZ_PER_SCOOP = 2;
export const DEFAULT_REST_BEFORE_SLEEP_MINUTES = 30;
export const DEFAULT_STOMACH_CAPACITY_OZ = 4;
export const DEFAULT_TOTAL_SCOOPS = 12;

export const FORM_DEFAULTS = {
  wakeUpTime: "07:00",
  firstMealTime: "07:00",
  nightSleepTime: "20:00",
  restBeforeSleepMinutes: DEFAULT_REST_BEFORE_SLEEP_MINUTES,
  totalTargetScoops: DEFAULT_TOTAL_SCOOPS,
  stomachCapacityOz: DEFAULT_STOMACH_CAPACITY_OZ,
  waterOzPerScoop: DEFAULT_WATER_OZ_PER_SCOOP,
};
```

### `src/lib/calculator.ts`

```typescript
import type { FeedingInput, FeedingSchedule, FeedingSession, ScheduleWarning } from "./types";
import {
  MIN_INTERVAL_HOURS,
  MAX_INTERVAL_HOURS,
  SESSION_DURATION_AVG_MINUTES,
} from "./constants";

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number): string {
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = Math.round(normalizedMinutes % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatTime(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${String(m).padStart(2, "0")} ${period}`;
}

export interface ValidationError {
  field: keyof FeedingInput;
  message: string;
}

export function validateInput(input: FeedingInput): ValidationError[] {
  const errors: ValidationError[] = [];
  const wakeUp = timeToMinutes(input.wakeUpTime);
  const firstMeal = timeToMinutes(input.firstMealTime);
  const nightSleep = timeToMinutes(input.nightSleepTime);

  if (firstMeal < wakeUp) {
    errors.push({
      field: "firstMealTime",
      message: "First meal cannot be before wake-up time",
    });
  }

  if (nightSleep <= firstMeal) {
    errors.push({
      field: "nightSleepTime",
      message: "Night sleep time must be after first meal time",
    });
  }

  if (input.restBeforeSleepMinutes < 0 || input.restBeforeSleepMinutes > 120) {
    errors.push({
      field: "restBeforeSleepMinutes",
      message: "Rest before sleep must be between 0 and 120 minutes",
    });
  }

  if (input.totalTargetScoops <= 0) {
    errors.push({
      field: "totalTargetScoops",
      message: "Total scoops must be greater than 0",
    });
  }

  if (input.stomachCapacityOz <= 0) {
    errors.push({
      field: "stomachCapacityOz",
      message: "Stomach capacity must be greater than 0",
    });
  }

  if (input.waterOzPerScoop <= 0) {
    errors.push({
      field: "waterOzPerScoop",
      message: "Water per scoop must be greater than 0",
    });
  }

  if (input.customFirstMeal) {
    if (!input.firstMealScoops || input.firstMealScoops <= 0) {
      errors.push({
        field: "firstMealScoops",
        message: "First meal scoops must be greater than 0",
      });
    }
    if (!input.firstMealWaterOz || input.firstMealWaterOz <= 0) {
      errors.push({
        field: "firstMealWaterOz",
        message: "First meal water must be greater than 0",
      });
    }
    if (
      input.firstMealScoops &&
      input.firstMealScoops >= input.totalTargetScoops
    ) {
      errors.push({
        field: "firstMealScoops",
        message: "First meal scoops must be less than total daily scoops",
      });
    }
  }

  const lastFeedMinutes = nightSleep - input.restBeforeSleepMinutes;
  if (lastFeedMinutes <= firstMeal) {
    errors.push({
      field: "restBeforeSleepMinutes",
      message: "Rest time is too long — no feeding window remains",
    });
  }

  return errors;
}

export function computeSchedule(input: FeedingInput): FeedingSchedule {
  const warnings: ScheduleWarning[] = [];

  const customFirst = resolveCustomFirstMeal(input);

  const firstMealMin = timeToMinutes(input.firstMealTime);
  const nightSleepMin = timeToMinutes(input.nightSleepTime);
  const lastFeedMin = nightSleepMin - input.restBeforeSleepMinutes;

  const windowMinutes = lastFeedMin - firstMealMin;
  const windowHours = windowMinutes / 60;

  const minIntervalMinutes = MIN_INTERVAL_HOURS * 60;
  const maxIntervalMinutes = MAX_INTERVAL_HOURS * 60;

  let minFeedings = Math.floor(windowMinutes / maxIntervalMinutes) + 1;
  let maxFeedings = Math.floor(windowMinutes / minIntervalMinutes) + 1;

  if (minFeedings < 1) minFeedings = 1;
  if (maxFeedings < 1) maxFeedings = 1;

  const idealFeedings = Math.round(windowHours / 3) + 1;
  let numFeedings = Math.max(minFeedings, Math.min(maxFeedings, idealFeedings));

  const remainingScoops = customFirst
    ? input.totalTargetScoops - customFirst.scoops
    : input.totalTargetScoops;

  const remainingFeedings = customFirst ? numFeedings - 1 : numFeedings;

  if (remainingFeedings > 0) {
    const waterPerRemainingFeed =
      (remainingScoops / remainingFeedings) * input.waterOzPerScoop;

    if (waterPerRemainingFeed > input.stomachCapacityOz) {
      const minScoopsForCapacity =
        input.stomachCapacityOz / input.waterOzPerScoop;
      const neededRemaining = Math.ceil(remainingScoops / minScoopsForCapacity);
      const neededTotal = customFirst ? neededRemaining + 1 : neededRemaining;

      if (neededTotal > maxFeedings) {
        const possibleInterval = windowMinutes / (neededTotal - 1);
        if (possibleInterval < minIntervalMinutes) {
          warnings.push({
            type: "capacity_exceeded",
            message: `Cannot fit ${neededTotal} feedings within the time window while respecting the minimum interval. The schedule uses ~${Math.round(possibleInterval)} min intervals. Some feedings may exceed the stomach capacity (${input.stomachCapacityOz} oz limit).`,
          });
        }
      }
      numFeedings = Math.max(numFeedings, neededTotal);
    }
  }

  const sessions = buildSessions(
    numFeedings,
    firstMealMin,
    windowMinutes,
    input,
    customFirst,
  );

  const intervalMinutes =
    numFeedings > 1 ? windowMinutes / (numFeedings - 1) : 0;

  if (numFeedings > 1 && intervalMinutes < minIntervalMinutes) {
    warnings.push({
      type: "tight_schedule",
      message: `Feeding interval (${Math.round(intervalMinutes)} min) is below the recommended minimum of ${MIN_INTERVAL_HOURS * 60} min.`,
    });
  }

  return {
    sessions,
    intervalMinutes: Math.round(intervalMinutes),
    totalScoops: sessions.reduce((sum, s) => sum + s.scoops, 0),
    totalWaterOz: sessions.reduce((sum, s) => sum + s.waterOz, 0),
    warnings,
  };
}

function resolveCustomFirstMeal(
  input: FeedingInput,
): { scoops: number; waterOz: number } | null {
  if (
    input.customFirstMeal &&
    input.firstMealScoops != null &&
    input.firstMealWaterOz != null
  ) {
    return { scoops: input.firstMealScoops, waterOz: input.firstMealWaterOz };
  }
  return null;
}

function buildSessions(
  numFeedings: number,
  firstMealMin: number,
  windowMinutes: number,
  input: FeedingInput,
  customFirst: { scoops: number; waterOz: number } | null,
): FeedingSession[] {
  if (numFeedings === 1) {
    const scoops = customFirst?.scoops ?? input.totalTargetScoops;
    const waterOz =
      customFirst?.waterOz ?? input.totalTargetScoops * input.waterOzPerScoop;
    return [
      {
        index: 1,
        startTime: minutesToTime(firstMealMin),
        estimatedEndTime: minutesToTime(
          firstMealMin + SESSION_DURATION_AVG_MINUTES,
        ),
        scoops: roundToHalf(scoops),
        waterOz: roundToHalf(waterOz),
      },
    ];
  }

  const intervalMinutes = windowMinutes / (numFeedings - 1);
  const restScoops = customFirst
    ? input.totalTargetScoops - customFirst.scoops
    : input.totalTargetScoops;
  const restCount = customFirst ? numFeedings - 1 : numFeedings;
  const restScoopsPerFeed = restScoops / restCount;
  const restWaterPerFeed = restScoopsPerFeed * input.waterOzPerScoop;

  const sessions: FeedingSession[] = [];
  for (let i = 0; i < numFeedings; i++) {
    const startMin = firstMealMin + i * intervalMinutes;
    const isCustomFirst = i === 0 && customFirst != null;

    sessions.push({
      index: i + 1,
      startTime: minutesToTime(startMin),
      estimatedEndTime: minutesToTime(startMin + SESSION_DURATION_AVG_MINUTES),
      scoops: roundToHalf(isCustomFirst ? customFirst.scoops : restScoopsPerFeed),
      waterOz: roundToHalf(
        isCustomFirst ? customFirst.waterOz : restWaterPerFeed,
      ),
    });
  }
  return sessions;
}

function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}
```

### `src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### `src/hooks/useSchedule.ts`

```typescript
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
```

### `src/App.tsx`

```tsx
import { useRef, useEffect, useState } from "react";
import { Header } from "./components/Header";
import { FeedingForm } from "./components/FeedingForm";
import { ScheduleDisplay } from "./components/ScheduleDisplay";
import { Footer } from "./components/Footer";
import { Button } from "./components/ui/Button";
import { useSchedule } from "./hooks/useSchedule";
import { RotateCcw } from "lucide-react";

function App() {
  const { schedule, calculate, reset } = useSchedule();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (schedule) {
      setShowResults(true);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } else {
      setShowResults(false);
    }
  }, [schedule]);

  function handleReset() {
    reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 sm:px-6">
      <Header />

      <main className="flex flex-col gap-8 pb-4">
        <FeedingForm onCalculate={calculate} />

        {schedule && (
          <div
            ref={resultsRef}
            className={`flex flex-col gap-8 transition-all duration-500 ${
              showResults
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <ScheduleDisplay schedule={schedule} />

            <div className="flex justify-center">
              <Button variant="secondary" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
```

### `src/main.tsx`

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
```

### `src/components/FeedingForm.tsx`

```tsx
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
```

### `src/components/ScheduleDisplay.tsx`

```tsx
import { formatTime } from "@/lib/calculator";
import type { FeedingSchedule } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import {
  Clock,
  Droplets,
  AlertTriangle,
  CalendarClock,
  Utensils,
} from "lucide-react";

interface ScheduleDisplayProps {
  schedule: FeedingSchedule;
}

function formatInterval(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function ScheduleDisplay({ schedule }: ScheduleDisplayProps) {
  return (
    <div className="flex flex-col gap-8">
      {schedule.warnings.length > 0 && (
        <div className="flex flex-col gap-3">
          {schedule.warnings.map((warning, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-sm text-amber-800">{warning.message}</p>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daily Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative ml-3">
            <div className="absolute top-2 bottom-2 left-[7px] w-0.5 bg-surface-200" />

            <div className="flex flex-col gap-1">
              {schedule.sessions.map((session, i) => (
                <div
                  key={session.index}
                  className="timeline-card relative flex items-start gap-4 py-3"
                  style={
                    { "--idx": i } as React.CSSProperties
                  }
                >
                  <div className="relative z-10 mt-1 flex h-4 w-4 shrink-0 items-center justify-center">
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-primary-400 bg-white" />
                  </div>

                  <div className="flex flex-1 flex-col gap-1 rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-600">
                        {session.index}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {formatTime(session.startTime)}
                        </p>
                        <p className="text-xs text-gray-400">
                          ends ~{formatTime(session.estimatedEndTime)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex gap-4 sm:mt-0">
                      <div className="flex items-center gap-1.5">
                        <Utensils className="h-3.5 w-3.5 text-accent-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {session.scoops} scoop{session.scoops !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Droplets className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {session.waterOz} oz
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryItem
              icon={<CalendarClock className="h-5 w-5 text-primary-400" />}
              label="Sessions"
              value={String(schedule.sessions.length)}
            />
            <SummaryItem
              icon={<Utensils className="h-5 w-5 text-accent-400" />}
              label="Total Scoops"
              value={String(schedule.totalScoops)}
            />
            <SummaryItem
              icon={<Droplets className="h-5 w-5 text-blue-400" />}
              label="Total Water"
              value={`${schedule.totalWaterOz} oz`}
            />
            <SummaryItem
              icon={<Clock className="h-5 w-5 text-success-500" />}
              label="Interval"
              value={formatInterval(schedule.intervalMinutes)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-surface-50 px-3 py-4 text-center">
      {icon}
      <p className="text-lg font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
```

### `src/components/Header.tsx`

```tsx
import { Baby } from "lucide-react";

export function Header() {
  return (
    <header className="flex flex-col items-center gap-2 py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 shadow-sm">
        <Baby className="h-7 w-7 text-primary-500" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        Feedlet
      </h1>
      <p className="text-sm text-gray-500">
        Baby feeding schedule calculator
      </p>
    </header>
  );
}
```

### `src/components/Footer.tsx`

```tsx
export function Footer() {
  return (
    <footer className="py-8 text-center">
      <p className="text-xs text-gray-400">
        Built with care for tiny humans
      </p>
    </footer>
  );
}
```

### `src/components/ui/Button.tsx`

```tsx
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "active:scale-[0.98]",
        variant === "primary" &&
          "bg-primary-500 text-white shadow-md hover:bg-primary-600 focus:ring-primary-300",
        variant === "secondary" &&
          "bg-surface-200 text-gray-700 hover:bg-surface-300 focus:ring-surface-300",
        className,
      )}
      {...props}
    />
  );
}
```

### `src/components/ui/Card.tsx`

```tsx
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-surface-200 bg-white shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 px-6 pt-6 pb-2", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold leading-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-gray-500", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}
```

### `src/components/ui/Input.tsx`

```tsx
import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, suffix, className, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-2.5 text-sm transition-all duration-200",
              "placeholder:text-gray-400",
              "focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none",
              error && "border-danger-500 focus:border-danger-500 focus:ring-red-100",
              suffix && "pr-12",
              className,
            )}
            {...props}
          />
          {suffix && (
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-gray-400">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-danger-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
```

### `src/index.css`

```css
@import "tailwindcss";

@theme {
  --color-primary-50: #f0eef8;
  --color-primary-100: #e0dcf1;
  --color-primary-200: #c1b9e3;
  --color-primary-300: #a296d5;
  --color-primary-400: #8373c7;
  --color-primary-500: #6b5aad;
  --color-primary-600: #56488b;
  --color-primary-700: #403669;
  --color-primary-800: #2b2447;
  --color-primary-900: #151224;

  --color-accent-50: #fff5f0;
  --color-accent-100: #ffe8db;
  --color-accent-200: #ffd1b8;
  --color-accent-300: #ffba94;
  --color-accent-400: #ffa371;
  --color-accent-500: #e88a5a;
  --color-accent-600: #c07248;

  --color-surface-50: #fdfcfa;
  --color-surface-100: #f8f5f0;
  --color-surface-200: #f0ebe3;
  --color-surface-300: #e5ded4;

  --color-success-500: #6db88f;
  --color-warning-500: #e8b44a;
  --color-danger-500: #d96b6b;

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Inter", ui-sans-serif, system-ui, sans-serif;
}

@layer base {
  body {
    @apply bg-surface-50 text-gray-800 antialiased;
    font-family: var(--font-sans);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.timeline-card {
  animation: slideUp 0.4s ease-out both;
  animation-delay: calc(var(--idx, 0) * 80ms);
}
```

### Config Files

**`vite.config.ts`**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**`tsconfig.app.json`**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "ignoreDeprecations": "6.0",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

**`vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

**`public/manifest.json`**

```json
{
  "name": "Feedlet — Baby Feeding Schedule",
  "short_name": "Feedlet",
  "description": "Calculate your baby's daily feeding schedule with the right formula scoops and water per session.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fdfcfa",
  "theme_color": "#6b5aad",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**`public/sw.js`**

```javascript
const CACHE_NAME = "feedlet-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
```
