import {
  format,
  isSameDay,
  isSameMonth,
  isThisYear,
  parseISO,
  compareAsc,
} from "date-fns";

import type {
  Activity,
  ActivityStatus,
  CheckIn,
  CountsByPeriod,
  EnrichedRule,
  PeriodKeys,
  PeriodType,
  Profile,
  RewardProgress,
} from "@/lib/types";
import { PERIOD_TYPES } from "@/lib/types";

function createEmptyCounts(): CountsByPeriod {
  return {
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  };
}

export function getCountsForActivity(
  activityId: string,
  checkIns: CheckIn[],
  keys: PeriodKeys,
) {
  const counts = createEmptyCounts();

  for (const checkIn of checkIns) {
    if (checkIn.activityId !== activityId || checkIn.status !== "active") {
      continue;
    }

    if (checkIn.logicalDateKey === keys.dailyKey) {
      counts.daily += 1;
    }
    if (checkIn.weekKey === keys.weekKey) {
      counts.weekly += 1;
    }
    if (checkIn.monthKey === keys.monthKey) {
      counts.monthly += 1;
    }
    if (checkIn.yearKey === keys.yearKey) {
      counts.yearly += 1;
    }
  }

  return counts;
}

export function isScheduledToday(activity: Activity, weekday: number) {
  return (
    activity.scheduleWeekdays.length === 0 ||
    activity.scheduleWeekdays.includes(weekday)
  );
}

export function hasPendingTargets(activity: Activity, counts: CountsByPeriod) {
  return activity.rules.some(
    (rule) =>
      rule.targetCount !== null && counts[rule.periodType] < rule.targetCount,
  );
}

export function canCheckInActivity(
  activity: Activity,
  counts: CountsByPeriod,
) {
  return activity.rules.every(
    (rule) => rule.capCount === null || counts[rule.periodType] < rule.capCount,
  );
}

export function getActivityStatus(
  activity: Activity,
  counts: CountsByPeriod,
): ActivityStatus {
  const dailyRule = activity.rules.find((rule) => rule.periodType === "daily");
  const targetRules = activity.rules.filter((rule) => rule.targetCount !== null);
  const anyProgress = PERIOD_TYPES.some((period) => counts[period] > 0);
  const hasIncompleteLongerTarget = activity.rules.some(
    (rule) =>
      rule.periodType !== "daily" &&
      rule.targetCount !== null &&
      counts[rule.periodType] < rule.targetCount,
  );

  if (
    dailyRule?.capCount !== null &&
    dailyRule?.capCount !== undefined &&
    counts.daily >= dailyRule.capCount &&
    hasIncompleteLongerTarget
  ) {
    return "capped_today";
  }

  if (
    dailyRule?.targetCount !== null &&
    dailyRule?.targetCount !== undefined &&
    counts.daily >= dailyRule.targetCount
  ) {
    return "complete";
  }

  if (
    !dailyRule?.targetCount &&
    targetRules.length > 0 &&
    targetRules.every((rule) => counts[rule.periodType] >= (rule.targetCount ?? 0))
  ) {
    return "complete";
  }

  if (anyProgress) {
    return "in_progress";
  }

  return "not_started";
}

export function getEnrichedRules(activity: Activity, counts: CountsByPeriod) {
  return [...activity.rules]
    .sort(
      (left, right) =>
        PERIOD_TYPES.indexOf(left.periodType) - PERIOD_TYPES.indexOf(right.periodType),
    )
    .map<EnrichedRule>((rule) => ({
      ...rule,
      currentCount: counts[rule.periodType],
      isComplete:
        rule.targetCount !== null && counts[rule.periodType] >= rule.targetCount,
      isCapped: rule.capCount !== null && counts[rule.periodType] >= rule.capCount,
    }));
}

export function getStatusLabel(status: ActivityStatus) {
  switch (status) {
    case "complete":
      return "Complete";
    case "capped_today":
      return "Capped Today";
    case "in_progress":
      return "In Progress";
    default:
      return "Not Started";
  }
}

export function getStatusTone(status: ActivityStatus) {
  switch (status) {
    case "complete":
      return "success";
    case "capped_today":
      return "warning";
    case "in_progress":
      return "active";
    default:
      return "idle";
  }
}

export function getLastActiveCheckInForToday(
  activityId: string,
  checkIns: CheckIn[],
  dailyKey: string,
) {
  return [...checkIns]
    .filter(
      (checkIn) =>
        checkIn.activityId === activityId &&
        checkIn.status === "active" &&
        checkIn.logicalDateKey === dailyKey,
    )
    .sort((left, right) => compareAsc(parseISO(right.occurredAt), parseISO(left.occurredAt)))
    .at(0);
}

export function getRewardProgress(
  activities: Activity[],
  checkIns: CheckIn[],
  profile: Profile,
  keys: PeriodKeys,
  milestones: number[],
): RewardProgress {
  const lookup = new Map(activities.map((activity) => [activity.id, activity]));
  let points = 0;

  for (const checkIn of checkIns) {
    if (checkIn.status !== "active") {
      continue;
    }

    const activity = lookup.get(checkIn.activityId);
    if (!activity) {
      continue;
    }

    const matchesPeriod =
      profile.rewardTrackPeriod === "weekly"
        ? checkIn.weekKey === keys.weekKey
        : profile.rewardTrackPeriod === "monthly"
          ? checkIn.monthKey === keys.monthKey
          : checkIn.yearKey === keys.yearKey;

    if (matchesPeriod) {
      points += activity.pointsPerCheckin;
    }
  }

  const completedMilestones = milestones.filter((milestone) => points >= milestone);
  const nextMilestone = milestones.find((milestone) => points < milestone) ?? null;

  return {
    periodType: profile.rewardTrackPeriod,
    points,
    maxMilestone: milestones.at(-1) ?? 100,
    nextMilestone,
    completedMilestones,
  };
}

export function getTodaySummary(
  activities: Activity[],
  checkIns: CheckIn[],
  keys: PeriodKeys,
) {
  const activeActivities = activities.filter((activity) => activity.isActive);
  const visibleActivities = activeActivities.filter((activity) =>
    isScheduledToday(activity, keys.weekday),
  );
  let completedToday = 0;
  let readyToLog = 0;

  for (const activity of visibleActivities) {
    const counts = getCountsForActivity(activity.id, checkIns, keys);

    if (getActivityStatus(activity, counts) === "complete") {
      completedToday += 1;
    }

    if (canCheckInActivity(activity, counts)) {
      readyToLog += 1;
    }
  }

  return {
    totalVisible: visibleActivities.length,
    completedToday,
    readyToLog,
  };
}

export function getActivityCountForDate(
  activityId: string,
  checkIns: CheckIn[],
  dayKey: string,
) {
  return checkIns.filter(
    (checkIn) =>
      checkIn.activityId === activityId &&
      checkIn.status === "active" &&
      checkIn.logicalDateKey === dayKey,
  ).length;
}

export function getMonthCheckInTotal(
  activityId: string,
  checkIns: CheckIn[],
  monthKey: string,
) {
  return checkIns.filter(
    (checkIn) =>
      checkIn.activityId === activityId &&
      checkIn.status === "active" &&
      checkIn.monthKey === monthKey,
  ).length;
}

export function getPeriodLabel(period: PeriodType) {
  switch (period) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "yearly":
      return "Yearly";
  }
}

export function formatScheduleLabel(activity: Activity) {
  if (activity.scheduleWeekdays.length === 0) {
    return "Any day";
  }

  return activity.scheduleWeekdays
    .slice()
    .sort((left, right) => left - right)
    .map((weekday) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekday])
    .join(" · ");
}

export function isDateInCurrentWeek(date: Date, keys: PeriodKeys) {
  return format(date, "yyyy-MM-dd") >= keys.weekKey;
}

export function isCurrentLogicalDate(date: Date, keys: PeriodKeys) {
  return isSameDay(date, keys.logicalDate);
}

export function isCurrentLogicalMonth(date: Date, keys: PeriodKeys) {
  return isSameMonth(date, keys.logicalDate);
}

export function isCurrentLogicalYear(date: Date, keys: PeriodKeys) {
  return isThisYear(date);
}
