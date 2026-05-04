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
