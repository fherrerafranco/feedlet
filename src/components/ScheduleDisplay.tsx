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
