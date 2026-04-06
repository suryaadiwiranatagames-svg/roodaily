"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createDemoState } from "@/lib/demo-data";
import {
  canCheckInActivity,
  getCountsForActivity,
  getLastActiveCheckInForToday,
} from "@/lib/progress";
import { getPeriodKeys } from "@/lib/time";
import { normalizeText } from "@/lib/utils";
import type {
  Activity,
  ActivityFilter,
  ActivityInput,
  CheckIn,
  Profile,
  ViewTab,
} from "@/lib/types";

type AppStore = {
  hydrated: boolean;
  profile: Profile;
  activities: Activity[];
  checkIns: CheckIn[];
  rewardMilestones: number[];
  currentTab: ViewTab;
  activityFilter: ActivityFilter;
  setHydrated: (value: boolean) => void;
  setCurrentTab: (tab: ViewTab) => void;
  setActivityFilter: (filter: ActivityFilter) => void;
  upsertActivity: (input: ActivityInput) => void;
  toggleActivityArchived: (activityId: string) => void;
  addCheckIn: (activityId: string) => void;
  undoLastCheckIn: (activityId: string) => void;
  resetDemoState: () => void;
  clearCheckIns: () => void;
};

const demoState = createDemoState();

export const useQuestStore = create<AppStore>()(
  persist(
    (set, get) => ({
      hydrated: false,
      profile: demoState.profile,
      activities: demoState.activities,
      checkIns: demoState.checkIns,
      rewardMilestones: demoState.rewardMilestones,
      currentTab: "event",
      activityFilter: "all",
      setHydrated: (value) => set({ hydrated: value }),
      setCurrentTab: (tab) => set({ currentTab: tab }),
      setActivityFilter: (filter) => set({ activityFilter: filter }),
      upsertActivity: (input) =>
        set((state) => {
          const title = normalizeText(input.title);
          if (!title) {
            return state;
          }

          const now = new Date().toISOString();
          const cleanedRules = input.rules
            .map((rule) => ({
              ...rule,
              targetCount:
                rule.targetCount && rule.targetCount > 0 ? rule.targetCount : null,
              capCount: rule.capCount && rule.capCount > 0 ? rule.capCount : null,
            }))
            .filter((rule) => rule.targetCount !== null || rule.capCount !== null);

          if (cleanedRules.length === 0) {
            return state;
          }

          const nextActivity: Activity = input.id
            ? {
                ...(state.activities.find((activity) => activity.id === input.id) ??
                  state.activities[0]),
                ...input,
                title,
                category: normalizeText(input.category) || "General",
                notes: normalizeText(input.notes),
                scheduleWeekdays: [...input.scheduleWeekdays].sort(),
                rules: cleanedRules,
                updatedAt: now,
              }
            : {
                id: crypto.randomUUID(),
                title,
                category: normalizeText(input.category) || "General",
                notes: normalizeText(input.notes),
                colorHex: input.colorHex,
                pointsPerCheckin: input.pointsPerCheckin,
                isActive: input.isActive,
                sortOrder:
                  Math.max(0, ...state.activities.map((activity) => activity.sortOrder)) +
                  1,
                scheduleWeekdays: [...input.scheduleWeekdays].sort(),
                rules: cleanedRules.map((rule) => ({
                  ...rule,
                  id: crypto.randomUUID(),
                })),
                createdAt: now,
                updatedAt: now,
              };

          const activities = input.id
            ? state.activities.map((activity) =>
                activity.id === input.id ? nextActivity : activity,
              )
            : [...state.activities, nextActivity];

          return {
            activities: activities.sort((left, right) => left.sortOrder - right.sortOrder),
          };
        }),
      toggleActivityArchived: (activityId) =>
        set((state) => ({
          activities: state.activities.map((activity) =>
            activity.id === activityId
              ? {
                  ...activity,
                  isActive: !activity.isActive,
                  updatedAt: new Date().toISOString(),
                }
              : activity,
          ),
        })),
      addCheckIn: (activityId) =>
        set((state) => {
          const activity = state.activities.find(
            (candidate) => candidate.id === activityId && candidate.isActive,
          );
          if (!activity) {
            return state;
          }

          const keys = getPeriodKeys(new Date(), state.profile);
          const counts = getCountsForActivity(activityId, state.checkIns, keys);

          if (!canCheckInActivity(activity, counts)) {
            return state;
          }

          const newCheckIn: CheckIn = {
            id: crypto.randomUUID(),
            activityId,
            occurredAt: new Date().toISOString(),
            logicalDateKey: keys.dailyKey,
            weekKey: keys.weekKey,
            monthKey: keys.monthKey,
            yearKey: keys.yearKey,
            status: "active",
            revertedAt: null,
          };

          return {
            checkIns: [...state.checkIns, newCheckIn],
          };
        }),
      undoLastCheckIn: (activityId) =>
        set((state) => {
          const keys = getPeriodKeys(new Date(), state.profile);
          const latest = getLastActiveCheckInForToday(
            activityId,
            state.checkIns,
            keys.dailyKey,
          );

          if (!latest) {
            return state;
          }

          return {
            checkIns: state.checkIns.map((checkIn) =>
              checkIn.id === latest.id
                ? {
                    ...checkIn,
                    status: "reverted",
                    revertedAt: new Date().toISOString(),
                  }
                : checkIn,
            ),
          };
        }),
      resetDemoState: () =>
        set(() => ({
          ...createDemoState(),
          currentTab: "event",
          activityFilter: "all",
        })),
      clearCheckIns: () => set({ checkIns: [] }),
    }),
    {
      name: "roolive-store",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profile: state.profile,
        activities: state.activities,
        checkIns: state.checkIns,
        rewardMilestones: state.rewardMilestones,
        currentTab: state.currentTab,
        activityFilter: state.activityFilter,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
