export const PERIOD_TYPES = ["daily", "weekly", "monthly", "yearly"] as const;

export type PeriodType = (typeof PERIOD_TYPES)[number];
export type ViewTab = "event" | "calendar" | "manage";
export type ActivityFilter = "all" | "focus";
export type ActivityStatus =
  | "not_started"
  | "in_progress"
  | "complete"
  | "capped_today";

export type Profile = {
  timezone: string;
  resetHourLocal: number;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  rewardTrackPeriod: Extract<PeriodType, "weekly" | "monthly" | "yearly">;
};

export type PeriodRule = {
  id: string;
  periodType: PeriodType;
  targetCount: number | null;
  capCount: number | null;
};

export type Activity = {
  id: string;
  title: string;
  category: string;
  notes: string;
  colorHex: string;
  pointsPerCheckin: number;
  isActive: boolean;
  sortOrder: number;
  scheduleWeekdays: number[];
  rules: PeriodRule[];
  createdAt: string;
  updatedAt: string;
};

export type CheckIn = {
  id: string;
  activityId: string;
  occurredAt: string;
  logicalDateKey: string;
  weekKey: string;
  monthKey: string;
  yearKey: string;
  status: "active" | "reverted";
  revertedAt: string | null;
};

export type PeriodKeys = {
  dailyKey: string;
  weekKey: string;
  monthKey: string;
  yearKey: string;
  logicalDate: Date;
  weekStart: Date;
  weekday: number;
};

export type CountsByPeriod = Record<PeriodType, number>;

export type EnrichedRule = PeriodRule & {
  currentCount: number;
  isComplete: boolean;
  isCapped: boolean;
};

export type ActivityInput = {
  id?: string;
  title: string;
  category: string;
  notes: string;
  colorHex: string;
  pointsPerCheckin: number;
  isActive: boolean;
  scheduleWeekdays: number[];
  rules: PeriodRule[];
};

export type RewardProgress = {
  periodType: Profile["rewardTrackPeriod"];
  points: number;
  maxMilestone: number;
  nextMilestone: number | null;
  completedMilestones: number[];
};
