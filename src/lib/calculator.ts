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
