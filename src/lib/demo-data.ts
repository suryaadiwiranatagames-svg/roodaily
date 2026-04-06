import { addDays, setHours, setMinutes } from "date-fns";

import { getPeriodKeys } from "@/lib/time";
import type { Activity, CheckIn, Profile } from "@/lib/types";

export const defaultProfile: Profile = {
  timezone:
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Makassar"
      : "Asia/Makassar",
  resetHourLocal: 5,
  weekStartsOn: 1,
  rewardTrackPeriod: "weekly",
};

const seededActivities: Activity[] = [
  {
    id: "meal",
    title: "Makan",
    category: "Self-care",
    notes: "Sarapan, makan siang, dan makan malam tetap tercatat.",
    colorHex: "#ff9f68",
    pointsPerCheckin: 8,
    isActive: true,
    sortOrder: 1,
    scheduleWeekdays: [],
    rules: [
      {
        id: "meal-daily",
        periodType: "daily",
        targetCount: 3,
        capCount: 3,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "bath",
    title: "Mandi",
    category: "Self-care",
    notes: "Jaga ritme pagi dan malam.",
    colorHex: "#66c7ff",
    pointsPerCheckin: 6,
    isActive: true,
    sortOrder: 2,
    scheduleWeekdays: [],
    rules: [
      {
        id: "bath-daily",
        periodType: "daily",
        targetCount: 2,
        capCount: 2,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "gym",
    title: "Gym",
    category: "Health",
    notes: "Target mingguan dicicil satu sesi per hari.",
    colorHex: "#5a7cff",
    pointsPerCheckin: 18,
    isActive: true,
    sortOrder: 3,
    scheduleWeekdays: [1, 2, 4, 5, 6],
    rules: [
      {
        id: "gym-daily",
        periodType: "daily",
        targetCount: 1,
        capCount: 1,
      },
      {
        id: "gym-weekly",
        periodType: "weekly",
        targetCount: 5,
        capCount: 5,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "liburan",
    title: "Liburan",
    category: "Lifestyle",
    notes: "Mini trip atau hari santai keluar rumah.",
    colorHex: "#ffcf5a",
    pointsPerCheckin: 28,
    isActive: true,
    sortOrder: 4,
    scheduleWeekdays: [6, 0],
    rules: [
      {
        id: "liburan-weekly",
        periodType: "weekly",
        targetCount: 1,
        capCount: 1,
      },
      {
        id: "liburan-monthly",
        periodType: "monthly",
        targetCount: 2,
        capCount: 2,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "lab",
    title: "Cek Lab",
    category: "Health",
    notes: "Pemeriksaan berkala supaya tidak telat kontrol.",
    colorHex: "#72d49a",
    pointsPerCheckin: 35,
    isActive: true,
    sortOrder: 5,
    scheduleWeekdays: [1],
    rules: [
      {
        id: "lab-monthly",
        periodType: "monthly",
        targetCount: 1,
        capCount: 1,
      },
      {
        id: "lab-yearly",
        periodType: "yearly",
        targetCount: 2,
        capCount: 2,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function buildCheckIn(activityId: string, when: Date, profile: Profile): CheckIn {
  const keys = getPeriodKeys(when, profile);

  return {
    id: crypto.randomUUID(),
    activityId,
    occurredAt: when.toISOString(),
    logicalDateKey: keys.dailyKey,
    weekKey: keys.weekKey,
    monthKey: keys.monthKey,
    yearKey: keys.yearKey,
    status: "active",
    revertedAt: null,
  };
}

function withClock(baseDate: Date, hour: number, minute: number) {
  return setMinutes(setHours(baseDate, hour), minute);
}

export function createDemoState(now = new Date()) {
  const today = now;
  const yesterday = addDays(today, -1);
  const twoDaysAgo = addDays(today, -2);
  const fiveDaysAgo = addDays(today, -5);
  const fifteenDaysAgo = addDays(today, -15);

  const checkIns: CheckIn[] = [
    buildCheckIn("meal", withClock(today, 8, 0), defaultProfile),
    buildCheckIn("meal", withClock(today, 13, 0), defaultProfile),
    buildCheckIn("bath", withClock(today, 6, 30), defaultProfile),
    buildCheckIn("gym", withClock(today, 18, 45), defaultProfile),
    buildCheckIn("gym", withClock(yesterday, 18, 20), defaultProfile),
    buildCheckIn("gym", withClock(twoDaysAgo, 18, 10), defaultProfile),
    buildCheckIn("liburan", withClock(fiveDaysAgo, 16, 10), defaultProfile),
    buildCheckIn("lab", withClock(fifteenDaysAgo, 10, 0), defaultProfile),
  ];

  return {
    profile: defaultProfile,
    activities: seededActivities,
    checkIns,
    rewardMilestones: [20, 40, 60, 80, 100],
  };
}
