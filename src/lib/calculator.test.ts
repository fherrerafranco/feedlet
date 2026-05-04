import { describe, it, expect } from "vitest";
import { formatTime, validateInput, computeSchedule } from "./calculator";
import type { FeedingInput } from "./types";
import { FORM_DEFAULTS } from "./constants";

function makeInput(overrides: Partial<FeedingInput> = {}): FeedingInput {
  return { ...FORM_DEFAULTS, ...overrides };
}

describe("formatTime", () => {
  it("converts morning time", () => {
    expect(formatTime("07:30")).toBe("7:30 AM");
  });

  it("converts afternoon time", () => {
    expect(formatTime("14:05")).toBe("2:05 PM");
  });

  it("converts noon", () => {
    expect(formatTime("12:00")).toBe("12:00 PM");
  });

  it("converts midnight", () => {
    expect(formatTime("00:00")).toBe("12:00 AM");
  });

  it("converts 12:59 PM", () => {
    expect(formatTime("12:59")).toBe("12:59 PM");
  });
});

describe("validateInput", () => {
  it("returns no errors for valid defaults", () => {
    expect(validateInput(makeInput())).toEqual([]);
  });

  it("rejects first meal before wake-up", () => {
    const errors = validateInput(
      makeInput({ wakeUpTime: "08:00", firstMealTime: "07:00" }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "firstMealTime" }),
    );
  });

  it("rejects night sleep at or before first meal", () => {
    const errors = validateInput(
      makeInput({ firstMealTime: "20:00", nightSleepTime: "20:00" }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "nightSleepTime" }),
    );
  });

  it("rejects negative rest before sleep", () => {
    const errors = validateInput(makeInput({ restBeforeSleepMinutes: -10 }));
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "restBeforeSleepMinutes" }),
    );
  });

  it("rejects rest before sleep over 120 minutes", () => {
    const errors = validateInput(makeInput({ restBeforeSleepMinutes: 150 }));
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "restBeforeSleepMinutes" }),
    );
  });

  it("rejects zero total scoops", () => {
    const errors = validateInput(makeInput({ totalTargetScoops: 0 }));
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "totalTargetScoops" }),
    );
  });

  it("rejects zero stomach capacity", () => {
    const errors = validateInput(makeInput({ stomachCapacityOz: 0 }));
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "stomachCapacityOz" }),
    );
  });

  it("rejects zero water per scoop", () => {
    const errors = validateInput(makeInput({ waterOzPerScoop: 0 }));
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "waterOzPerScoop" }),
    );
  });

  it("rejects rest time that eliminates the feeding window", () => {
    const errors = validateInput(
      makeInput({
        firstMealTime: "07:00",
        nightSleepTime: "08:00",
        restBeforeSleepMinutes: 120,
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "restBeforeSleepMinutes" }),
    );
  });

  describe("custom first meal validation", () => {
    it("rejects missing first meal scoops", () => {
      const errors = validateInput(
        makeInput({
          customFirstMeal: true,
          firstMealScoops: 0,
          firstMealWaterOz: 4,
        }),
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ field: "firstMealScoops" }),
      );
    });

    it("rejects missing first meal water", () => {
      const errors = validateInput(
        makeInput({
          customFirstMeal: true,
          firstMealScoops: 2,
          firstMealWaterOz: 0,
        }),
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ field: "firstMealWaterOz" }),
      );
    });

    it("rejects first meal scoops >= total scoops", () => {
      const errors = validateInput(
        makeInput({
          customFirstMeal: true,
          firstMealScoops: 12,
          firstMealWaterOz: 4,
          totalTargetScoops: 12,
        }),
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ field: "firstMealScoops" }),
      );
    });

    it("accepts valid custom first meal", () => {
      const errors = validateInput(
        makeInput({
          customFirstMeal: true,
          firstMealScoops: 2,
          firstMealWaterOz: 4,
        }),
      );
      expect(errors).toEqual([]);
    });
  });
});

describe("computeSchedule", () => {
  it("produces sessions with the default input", () => {
    const schedule = computeSchedule(makeInput());
    expect(schedule.sessions.length).toBeGreaterThanOrEqual(1);
    expect(schedule.totalScoops).toBeGreaterThan(0);
    expect(schedule.totalWaterOz).toBeGreaterThan(0);
  });

  it("first session starts at first meal time", () => {
    const schedule = computeSchedule(makeInput({ firstMealTime: "07:00" }));
    expect(schedule.sessions[0].startTime).toBe("07:00");
  });

  it("all scoops are rounded to nearest 0.5", () => {
    const schedule = computeSchedule(makeInput({ totalTargetScoops: 7 }));
    for (const session of schedule.sessions) {
      expect(session.scoops % 0.5).toBe(0);
      expect(session.waterOz % 0.5).toBe(0);
    }
  });

  it("total scoops approximately match target (within rounding)", () => {
    const target = 12;
    const schedule = computeSchedule(makeInput({ totalTargetScoops: target }));
    expect(schedule.totalScoops).toBeCloseTo(target, 0);
  });

  it("respects stomach capacity by adding more sessions", () => {
    const small = computeSchedule(makeInput({ stomachCapacityOz: 8 }));
    const large = computeSchedule(makeInput({ stomachCapacityOz: 2 }));
    expect(large.sessions.length).toBeGreaterThanOrEqual(
      small.sessions.length,
    );
  });

  it("single feeding when window is very short and capacity allows", () => {
    const schedule = computeSchedule(
      makeInput({
        firstMealTime: "19:00",
        nightSleepTime: "20:00",
        restBeforeSleepMinutes: 0,
        totalTargetScoops: 1,
        stomachCapacityOz: 8,
      }),
    );
    expect(schedule.sessions.length).toBe(1);
    expect(schedule.intervalMinutes).toBe(0);
  });

  it("returns no warnings for a normal schedule", () => {
    const schedule = computeSchedule(
      makeInput({ stomachCapacityOz: 8, restBeforeSleepMinutes: 15 }),
    );
    expect(schedule.warnings).toEqual([]);
  });

  it("warns when intervals are too tight", () => {
    const schedule = computeSchedule(
      makeInput({
        firstMealTime: "07:00",
        nightSleepTime: "10:00",
        restBeforeSleepMinutes: 0,
        totalTargetScoops: 30,
        stomachCapacityOz: 2,
        waterOzPerScoop: 2,
      }),
    );
    const hasWarning = schedule.warnings.some(
      (w) => w.type === "tight_schedule" || w.type === "capacity_exceeded",
    );
    expect(hasWarning).toBe(true);
  });

  describe("custom first meal", () => {
    it("uses custom scoops for first session", () => {
      const schedule = computeSchedule(
        makeInput({
          customFirstMeal: true,
          firstMealScoops: 3,
          firstMealWaterOz: 5,
        }),
      );
      expect(schedule.sessions[0].scoops).toBe(3);
      expect(schedule.sessions[0].waterOz).toBe(5);
    });

    it("distributes remaining scoops across other sessions", () => {
      const input = makeInput({
        totalTargetScoops: 12,
        customFirstMeal: true,
        firstMealScoops: 2,
        firstMealWaterOz: 4,
      });
      const schedule = computeSchedule(input);
      const otherScoops = schedule.sessions
        .slice(1)
        .reduce((sum, s) => sum + s.scoops, 0);
      expect(otherScoops).toBeCloseTo(10, 0);
    });
  });
});
