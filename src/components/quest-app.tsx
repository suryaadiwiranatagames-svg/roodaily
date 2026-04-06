"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ArchiveRestore,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  FlaskConical,
  HeartPulse,
  Medal,
  NotebookPen,
  Palmtree,
  Plus,
  RotateCcw,
  ShowerHead,
  Sparkles,
  Target,
  Trash2,
  Utensils,
} from "lucide-react";

import styles from "@/components/quest-app.module.css";
import {
  canCheckInActivity,
  formatScheduleLabel,
  getActivityCountForDate,
  getActivityStatus,
  getCountsForActivity,
  getEnrichedRules,
  getLastActiveCheckInForToday,
  getMonthCheckInTotal,
  getPeriodLabel,
  getRewardProgress,
  getStatusLabel,
  getStatusTone,
  getTodaySummary,
  hasPendingTargets,
  isScheduledToday,
} from "@/lib/progress";
import {
  formatCalendarDate,
  formatLogicalDate,
  formatLongWeekday,
  formatResetHour,
  formatShortWeekday,
  getPeriodKeys,
  getShiftedWeekStart,
  getWeekDates,
} from "@/lib/time";
import { PERIOD_TYPES } from "@/lib/types";
import type {
  Activity,
  ActivityFilter,
  ActivityInput,
  CountsByPeriod,
  PeriodRule,
  PeriodType,
  ViewTab,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuestStore } from "@/store/app-store";

type FormState = {
  title: string;
  category: string;
  notes: string;
  colorHex: string;
  pointsPerCheckin: string;
  isActive: boolean;
  scheduleWeekdays: number[];
  targets: Record<PeriodType, string>;
  caps: Record<PeriodType, string>;
};

const colorSwatches = [
  "#ff9f68",
  "#66c7ff",
  "#5a7cff",
  "#ffcf5a",
  "#72d49a",
  "#ff7e97",
];

const tabItems: Array<{
  id: ViewTab;
  label: string;
  icon: typeof Sparkles;
}> = [
  { id: "event", label: "Event", icon: Sparkles },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "manage", label: "Manage", icon: NotebookPen },
];

function createEmptyFormState(): FormState {
  return {
    title: "",
    category: "Self-care",
    notes: "",
    colorHex: colorSwatches[0],
    pointsPerCheckin: "10",
    isActive: true,
    scheduleWeekdays: [],
    targets: {
      daily: "",
      weekly: "",
      monthly: "",
      yearly: "",
    },
    caps: {
      daily: "",
      weekly: "",
      monthly: "",
      yearly: "",
    },
  };
}

function buildFormState(activity: Activity): FormState {
  const state = createEmptyFormState();
  for (const rule of activity.rules) {
    state.targets[rule.periodType] = rule.targetCount?.toString() ?? "";
    state.caps[rule.periodType] = rule.capCount?.toString() ?? "";
  }

  return {
    title: activity.title,
    category: activity.category,
    notes: activity.notes,
    colorHex: activity.colorHex,
    pointsPerCheckin: activity.pointsPerCheckin.toString(),
    isActive: activity.isActive,
    scheduleWeekdays: [...activity.scheduleWeekdays],
    targets: state.targets,
    caps: state.caps,
  };
}

function buildRulesFromForm(state: FormState): PeriodRule[] {
  return PERIOD_TYPES.map((periodType) => {
    const target = Number(state.targets[periodType]);
    const cap = Number(state.caps[periodType]);

    return {
      id: crypto.randomUUID(),
      periodType,
      targetCount: Number.isFinite(target) && target > 0 ? target : null,
      capCount: Number.isFinite(cap) && cap > 0 ? cap : null,
    };
  }).filter((rule) => rule.targetCount !== null || rule.capCount !== null);
}

function renderActivityIcon(activity: Activity): ReactNode {
  const label = `${activity.title} ${activity.category}`.toLowerCase();

  if (label.includes("makan") || label.includes("meal")) {
    return <Utensils size={22} strokeWidth={2.2} />;
  }
  if (label.includes("mandi") || label.includes("bath")) {
    return <ShowerHead size={22} strokeWidth={2.2} />;
  }
  if (label.includes("gym") || label.includes("workout")) {
    return <Dumbbell size={22} strokeWidth={2.2} />;
  }
  if (label.includes("lab")) {
    return <FlaskConical size={22} strokeWidth={2.2} />;
  }
  if (label.includes("health")) {
    return <HeartPulse size={22} strokeWidth={2.2} />;
  }
  if (label.includes("liburan") || label.includes("travel")) {
    return <Palmtree size={22} strokeWidth={2.2} />;
  }

  return <Target size={22} strokeWidth={2.2} />;
}

function formatRuleCounter(rule: PeriodRule, counts: CountsByPeriod) {
  const target = rule.targetCount ?? rule.capCount ?? 0;
  const capMarker =
    rule.capCount !== null && rule.targetCount !== rule.capCount
      ? ` · cap ${rule.capCount}`
      : "";

  return `${getPeriodLabel(rule.periodType)} ${counts[rule.periodType]}/${target}${capMarker}`;
}

function formatMilestoneSummary(points: number, nextMilestone: number | null) {
  if (nextMilestone === null) {
    return "All milestones cleared";
  }

  return `${nextMilestone - points} pts to next milestone`;
}

function getFilterLabel(filter: ActivityFilter) {
  return filter === "all" ? "All" : "Focus";
}

type ActivityCardModel = {
  activity: Activity;
  counts: CountsByPeriod;
  status: ReturnType<typeof getActivityStatus>;
  canCheckIn: boolean;
  enrichedRules: ReturnType<typeof getEnrichedRules>;
  scheduledToday: boolean;
  pendingTarget: boolean;
  canUndo: boolean;
};

function ActivityCard({
  item,
  onCheckIn,
  onUndo,
}: {
  item: ActivityCardModel;
  onCheckIn: (activityId: string) => void;
  onUndo: (activityId: string) => void;
}) {
  const tone = getStatusTone(item.status);

  return (
    <article
      className={styles.activityCard}
      style={
        {
          "--card-accent": item.activity.colorHex,
        } as CSSProperties
      }
    >
      <div className={styles.activityTop}>
        <div className={styles.activityIdentity}>
          <div className={styles.iconBadge}>{renderActivityIcon(item.activity)}</div>
          <div>
            <div className={styles.activityMeta}>
              <span className={styles.categoryChip}>{item.activity.category}</span>
              {!item.scheduledToday ? (
                <span className={styles.ghostChip}>Flexible</span>
              ) : (
                <span className={styles.ghostChip}>Today</span>
              )}
            </div>
            <h3>{item.activity.title}</h3>
            <p>{item.activity.notes || "No note yet. Keep the cadence clean."}</p>
          </div>
        </div>
        <div className={cn(styles.statusBadge, styles[`status_${tone}`])}>
          {getStatusLabel(item.status)}
        </div>
      </div>

      <div className={styles.ruleGrid}>
        {item.enrichedRules.map((rule) => (
          <div
            key={rule.id}
            className={cn(
              styles.rulePill,
              rule.isComplete && styles.ruleComplete,
              rule.isCapped && styles.ruleCapped,
            )}
          >
            <span>{formatRuleCounter(rule, item.counts)}</span>
          </div>
        ))}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.cardFacts}>
          <span>{formatScheduleLabel(item.activity)}</span>
          <span>{item.activity.pointsPerCheckin} pts / check-in</span>
        </div>
        <div className={styles.cardActions}>
          <button
            className={styles.secondaryButton}
            disabled={!item.canUndo}
            onClick={() => onUndo(item.activity.id)}
            type="button"
          >
            <RotateCcw size={16} />
            Undo
          </button>
          <button
            className={styles.primaryButton}
            disabled={!item.canCheckIn}
            onClick={() => onCheckIn(item.activity.id)}
            type="button"
          >
            <Plus size={18} />
            Log +1
          </button>
        </div>
      </div>
    </article>
  );
}

function RewardTrack({
  points,
  milestones,
}: {
  points: number;
  milestones: number[];
}) {
  const maxMilestone = milestones.at(-1) ?? 100;
  const progress = Math.min((points / maxMilestone) * 100, 100);

  return (
    <section className={styles.rewardTrack}>
      <div className={styles.rewardHeader}>
        <div>
          <span className={styles.eyebrow}>Weekly Reward Track</span>
          <h3>{points} pts gathered</h3>
        </div>
        <div className={styles.rewardSummary}>
          <Medal size={18} />
          <span>{points > maxMilestone ? `+${points - maxMilestone} overflow` : "On track"}</span>
        </div>
      </div>

      <div className={styles.trackBar}>
        <div className={styles.trackFill} style={{ width: `${progress}%` }} />
        {milestones.map((milestone) => (
          <div
            key={milestone}
            className={cn(
              styles.trackMarker,
              points >= milestone && styles.trackMarkerActive,
            )}
            style={{ left: `${(milestone / maxMilestone) * 100}%` }}
          >
            <span>{milestone}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CalendarBoard({
  activities,
  checkIns,
  profile,
  currentKeys,
  weekOffset,
  onShiftWeek,
}: {
  activities: Activity[];
  checkIns: ReturnType<typeof useQuestStore.getState>["checkIns"];
  profile: ReturnType<typeof useQuestStore.getState>["profile"];
  currentKeys: ReturnType<typeof getPeriodKeys>;
  weekOffset: number;
  onShiftWeek: (offset: number) => void;
}) {
  const weekStart = getShiftedWeekStart(profile, new Date(), weekOffset);
  const weekDates = getWeekDates(weekStart);

  return (
    <section className={styles.calendarPanel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>Calendar</span>
          <h2>Weekly cadence</h2>
        </div>
        <div className={styles.calendarControls}>
          <button className={styles.iconButton} onClick={() => onShiftWeek(-1)} type="button">
            <ChevronLeft size={16} />
          </button>
          <span className={styles.weekLabel}>
            {format(weekDates[0], "d MMM")} - {format(weekDates[6], "d MMM")}
          </span>
          <button className={styles.iconButton} onClick={() => onShiftWeek(1)} type="button">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className={styles.calendarGrid}>
        {weekDates.map((date) => {
          const dayKeys = getPeriodKeys(date, profile);
          const isToday = dayKeys.dailyKey === currentKeys.dailyKey;
          const dayActivities = activities.filter(
            (activity) =>
              activity.isActive &&
              (activity.scheduleWeekdays.length === 0 ||
                activity.scheduleWeekdays.includes(dayKeys.weekday)),
          );

          return (
            <section
              key={dayKeys.dailyKey}
              className={cn(styles.calendarDay, isToday && styles.calendarToday)}
            >
              <header className={styles.calendarDayHeader}>
                <span>{formatShortWeekday(date)}</span>
                <strong>{formatCalendarDate(date)}</strong>
              </header>
              <div className={styles.calendarEvents}>
                {dayActivities.length === 0 ? (
                  <div className={styles.calendarEmpty}>No scheduled quests</div>
                ) : (
                  dayActivities.map((activity) => {
                    const dayCount = getActivityCountForDate(
                      activity.id,
                      checkIns,
                      dayKeys.dailyKey,
                    );
                    return (
                      <article key={`${activity.id}-${dayKeys.dailyKey}`} className={styles.calendarItem}>
                        <span
                          className={styles.calendarDot}
                          style={{ backgroundColor: activity.colorHex }}
                        />
                        <div>
                          <h4>{activity.title}</h4>
                          <p>
                            {dayCount > 0 ? `${dayCount} logged` : formatScheduleLabel(activity)}
                          </p>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function ManagePanel({
  activities,
  checkIns,
  formState,
  editingId,
  onChange,
  onSubmit,
  onEdit,
  onCancelEdit,
  onToggleArchive,
  onResetDemo,
  onClearLogs,
}: {
  activities: Activity[];
  checkIns: ReturnType<typeof useQuestStore.getState>["checkIns"];
  formState: FormState;
  editingId: string | null;
  onChange: (next: FormState) => void;
  onSubmit: () => void;
  onEdit: (activity: Activity) => void;
  onCancelEdit: () => void;
  onToggleArchive: (activityId: string) => void;
  onResetDemo: () => void;
  onClearLogs: () => void;
}) {
  return (
    <section className={styles.manageLayout}>
      <div className={styles.formCard}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.eyebrow}>Manage Activities</span>
            <h2>{editingId ? "Edit quest" : "Create a new quest"}</h2>
          </div>
        </div>

        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>Title</span>
            <input
              className={styles.input}
              onChange={(event) => onChange({ ...formState, title: event.target.value })}
              placeholder="Gym, Makan, Cek Lab..."
              value={formState.title}
            />
          </label>
          <label className={styles.field}>
            <span>Category</span>
            <input
              className={styles.input}
              onChange={(event) => onChange({ ...formState, category: event.target.value })}
              placeholder="Self-care, Health, Lifestyle"
              value={formState.category}
            />
          </label>
          <label className={styles.field}>
            <span>Points per check-in</span>
            <input
              className={styles.input}
              inputMode="numeric"
              onChange={(event) =>
                onChange({ ...formState, pointsPerCheckin: event.target.value })
              }
              placeholder="10"
              value={formState.pointsPerCheckin}
            />
          </label>
          <label className={styles.field}>
            <span>Accent color</span>
            <div className={styles.colorRow}>
              <input
                className={styles.colorInput}
                onChange={(event) => onChange({ ...formState, colorHex: event.target.value })}
                type="color"
                value={formState.colorHex}
              />
              <div className={styles.swatchRow}>
                {colorSwatches.map((swatch) => (
                  <button
                    key={swatch}
                    className={cn(
                      styles.swatch,
                      formState.colorHex === swatch && styles.swatchActive,
                    )}
                    onClick={() => onChange({ ...formState, colorHex: swatch })}
                    style={{ backgroundColor: swatch }}
                    type="button"
                  />
                ))}
              </div>
            </div>
          </label>
        </div>

        <label className={styles.field}>
          <span>Notes</span>
          <textarea
            className={cn(styles.input, styles.textarea)}
            onChange={(event) => onChange({ ...formState, notes: event.target.value })}
            placeholder="Describe the cadence or why this quest matters."
            value={formState.notes}
          />
        </label>

        <div className={styles.ruleTable}>
          <div className={styles.ruleTableHeader}>
            <span>Period</span>
            <span>Target</span>
            <span>Cap</span>
          </div>
          {PERIOD_TYPES.map((periodType) => (
            <div key={periodType} className={styles.ruleTableRow}>
              <span>{getPeriodLabel(periodType)}</span>
              <input
                className={styles.input}
                inputMode="numeric"
                onChange={(event) =>
                  onChange({
                    ...formState,
                    targets: {
                      ...formState.targets,
                      [periodType]: event.target.value,
                    },
                  })
                }
                placeholder="0"
                value={formState.targets[periodType]}
              />
              <input
                className={styles.input}
                inputMode="numeric"
                onChange={(event) =>
                  onChange({
                    ...formState,
                    caps: {
                      ...formState.caps,
                      [periodType]: event.target.value,
                    },
                  })
                }
                placeholder="0"
                value={formState.caps[periodType]}
              />
            </div>
          ))}
        </div>

        <div className={styles.weekdayPicker}>
          <span>Calendar weekdays</span>
          <div className={styles.weekdayRow}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, index) => {
              const active = formState.scheduleWeekdays.includes(index);
              return (
                <button
                  key={label}
                  className={cn(styles.weekdayButton, active && styles.weekdayButtonActive)}
                  onClick={() =>
                    onChange({
                      ...formState,
                      scheduleWeekdays: active
                        ? formState.scheduleWeekdays.filter((day) => day !== index)
                        : [...formState.scheduleWeekdays, index],
                    })
                  }
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className={styles.helperText}>
            Leave all weekdays unselected if this quest can be logged on any day.
          </p>
        </div>

        <div className={styles.formActions}>
          {editingId ? (
            <button className={styles.secondaryButton} onClick={onCancelEdit} type="button">
              Cancel edit
            </button>
          ) : null}
          <button className={styles.primaryButton} onClick={onSubmit} type="button">
            {editingId ? "Save changes" : "Create quest"}
          </button>
        </div>
      </div>

      <div className={styles.manageSide}>
        <section className={styles.utilityCard}>
          <div className={styles.utilityActions}>
            <button className={styles.secondaryButton} onClick={onResetDemo} type="button">
              <RotateCcw size={16} />
              Reload demo
            </button>
            <button className={styles.secondaryButton} onClick={onClearLogs} type="button">
              <Trash2 size={16} />
              Clear logs
            </button>
          </div>
        </section>

        <section className={styles.activityList}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Quest Registry</span>
              <h2>Existing activities</h2>
            </div>
          </div>
          <div className={styles.registryList}>
            {activities.map((activity) => (
              <article key={activity.id} className={styles.registryItem}>
                <div className={styles.registryTop}>
                  <div>
                    <div className={styles.activityMeta}>
                      <span className={styles.categoryChip}>{activity.category}</span>
                      <span className={styles.ghostChip}>
                        {activity.isActive ? "Active" : "Archived"}
                      </span>
                    </div>
                    <h3>{activity.title}</h3>
                    <p>{formatScheduleLabel(activity)}</p>
                  </div>
                  <div className={styles.registryStats}>
                    <strong>
                      {getMonthCheckInTotal(
                        activity.id,
                        checkIns,
                        format(new Date(), "yyyy-MM"),
                      )}
                    </strong>
                    <span>This month</span>
                  </div>
                </div>

                <div className={styles.ruleGrid}>
                  {activity.rules.map((rule) => (
                    <div key={rule.id} className={styles.rulePill}>
                      <span>
                        {getPeriodLabel(rule.periodType)} {rule.targetCount ?? 0}
                        {rule.capCount !== null && rule.capCount !== rule.targetCount
                          ? ` · cap ${rule.capCount}`
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.registryActions}>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => onEdit(activity)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => onToggleArchive(activity.id)}
                    type="button"
                  >
                    <ArchiveRestore size={16} />
                    {activity.isActive ? "Archive" : "Restore"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export function QuestApp() {
  const hydrated = useQuestStore((state) => state.hydrated);
  const profile = useQuestStore((state) => state.profile);
  const activities = useQuestStore((state) => state.activities);
  const checkIns = useQuestStore((state) => state.checkIns);
  const rewardMilestones = useQuestStore((state) => state.rewardMilestones);
  const currentTab = useQuestStore((state) => state.currentTab);
  const activityFilter = useQuestStore((state) => state.activityFilter);
  const setCurrentTab = useQuestStore((state) => state.setCurrentTab);
  const setActivityFilter = useQuestStore((state) => state.setActivityFilter);
  const upsertActivity = useQuestStore((state) => state.upsertActivity);
  const toggleActivityArchived = useQuestStore((state) => state.toggleActivityArchived);
  const addCheckIn = useQuestStore((state) => state.addCheckIn);
  const undoLastCheckIn = useQuestStore((state) => state.undoLastCheckIn);
  const resetDemoState = useQuestStore((state) => state.resetDemoState);
  const clearCheckIns = useQuestStore((state) => state.clearCheckIns);

  const [now, setNow] = useState(() => new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(() => createEmptyFormState());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const currentKeys = getPeriodKeys(now, profile);
  const reward = getRewardProgress(
    activities.filter((activity) => activity.isActive),
    checkIns,
    profile,
    currentKeys,
    rewardMilestones,
  );
  const summary = getTodaySummary(activities, checkIns, currentKeys);

  const activityCards = activities
    .filter((activity) => activity.isActive)
    .map<ActivityCardModel>((activity) => {
      const counts = getCountsForActivity(activity.id, checkIns, currentKeys);
      return {
        activity,
        counts,
        status: getActivityStatus(activity, counts),
        canCheckIn: canCheckInActivity(activity, counts),
        enrichedRules: getEnrichedRules(activity, counts),
        scheduledToday: isScheduledToday(activity, currentKeys.weekday),
        pendingTarget: hasPendingTargets(activity, counts),
        canUndo:
          getLastActiveCheckInForToday(activity.id, checkIns, currentKeys.dailyKey) !==
          undefined,
      };
    })
    .sort((left, right) => {
      const leftPriority =
        Number(left.scheduledToday) * 4 +
        Number(left.pendingTarget) * 3 +
        Number(left.canCheckIn) * 2;
      const rightPriority =
        Number(right.scheduledToday) * 4 +
        Number(right.pendingTarget) * 3 +
        Number(right.canCheckIn) * 2;

      if (leftPriority !== rightPriority) {
        return rightPriority - leftPriority;
      }

      return left.activity.sortOrder - right.activity.sortOrder;
    });

  const visibleCards =
    activityFilter === "focus"
      ? activityCards.filter(
          (item) =>
            item.scheduledToday ||
            (item.pendingTarget && item.canCheckIn) ||
            item.status === "capped_today",
        )
      : activityCards;

  const queueItems = activityCards.slice(0, 4);

  function handleSaveActivity() {
    const rules = buildRulesFromForm(formState);
    if (rules.length === 0) {
      return;
    }

    const input: ActivityInput = {
      id: editingId ?? undefined,
      title: formState.title,
      category: formState.category,
      notes: formState.notes,
      colorHex: formState.colorHex,
      pointsPerCheckin: Number(formState.pointsPerCheckin) || 10,
      isActive: formState.isActive,
      scheduleWeekdays: [...formState.scheduleWeekdays].sort(),
      rules,
    };

    upsertActivity(input);
    setEditingId(null);
    setFormState(createEmptyFormState());
    setCurrentTab("event");
  }

  function handleEditActivity(activity: Activity) {
    setEditingId(activity.id);
    setFormState(buildFormState(activity));
    setCurrentTab("manage");
  }

  function handleResetForm() {
    setEditingId(null);
    setFormState(createEmptyFormState());
  }

  if (!hydrated) {
    return (
      <main className={styles.pageShell}>
        <div className={styles.loadingPanel}>
          <Sparkles size={22} />
          <span>Loading your quest board...</span>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.pageShell}>
      <div className={styles.board}>
        <aside className={styles.leftRail}>
          <div className={styles.brandMark}>
            <div className={styles.brandRing}>
              <Sparkles size={20} />
            </div>
            <div>
              <span className={styles.eyebrow}>ROOlive</span>
              <strong>Life Quest Board</strong>
            </div>
          </div>

          <nav className={styles.tabRail}>
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={cn(
                    styles.tabButton,
                    currentTab === tab.id && styles.tabButtonActive,
                  )}
                  onClick={() => setCurrentTab(tab.id)}
                  type="button"
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <section className={styles.helperCard}>
            <span className={styles.eyebrow}>Local rules</span>
            <p>Reset at {formatResetHour(profile.resetHourLocal)}</p>
            <p>{profile.timezone}</p>
          </section>
        </aside>

        <section className={styles.mainBoard}>
          <header className={styles.hero}>
            <div>
              <span className={styles.eyebrow}>{formatLongWeekday(currentKeys.logicalDate)}</span>
              <h1>Track real-life quests with the same clarity as a game event panel.</h1>
              <p>{formatLogicalDate(currentKeys.logicalDate)}</p>
            </div>

            <div className={styles.heroActions}>
              {currentTab === "event" ? (
                <div className={styles.filterRow}>
                  {(["all", "focus"] as const).map((filter) => (
                    <button
                      key={filter}
                      className={cn(
                        styles.filterButton,
                        activityFilter === filter && styles.filterButtonActive,
                      )}
                      onClick={() => setActivityFilter(filter)}
                      type="button"
                    >
                      {getFilterLabel(filter)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </header>

          {currentTab === "event" ? (
            <section className={styles.contentColumn}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.eyebrow}>Today / Event</span>
                  <h2>
                    {visibleCards.length} quest{visibleCards.length === 1 ? "" : "s"} on board
                  </h2>
                </div>
                <div className={styles.panelHint}>Filter: {getFilterLabel(activityFilter)}</div>
              </div>

              <div className={styles.activityList}>
                {visibleCards.map((item) => (
                  <ActivityCard
                    key={item.activity.id}
                    item={item}
                    onCheckIn={addCheckIn}
                    onUndo={undoLastCheckIn}
                  />
                ))}
              </div>

              <RewardTrack milestones={rewardMilestones} points={reward.points} />
            </section>
          ) : null}

          {currentTab === "calendar" ? (
            <CalendarBoard
              activities={activities}
              checkIns={checkIns}
              currentKeys={currentKeys}
              onShiftWeek={(offset) => setWeekOffset((value) => value + offset)}
              profile={profile}
              weekOffset={weekOffset}
            />
          ) : null}

          {currentTab === "manage" ? (
            <ManagePanel
              activities={activities}
              checkIns={checkIns}
              editingId={editingId}
              formState={formState}
              onCancelEdit={handleResetForm}
              onChange={setFormState}
              onClearLogs={clearCheckIns}
              onEdit={handleEditActivity}
              onResetDemo={resetDemoState}
              onSubmit={handleSaveActivity}
              onToggleArchive={toggleActivityArchived}
            />
          ) : null}
        </section>

        <aside className={styles.rightRail}>
          <section className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <span className={styles.eyebrow}>Queue</span>
              <strong>{queueItems.length} highlighted</strong>
            </div>
            <div className={styles.queueList}>
              {queueItems.map((item) => (
                <article key={item.activity.id} className={styles.queueItem}>
                  <div className={styles.queueMeta}>
                    <span
                      className={styles.queueAccent}
                      style={{ backgroundColor: item.activity.colorHex }}
                    />
                    <div>
                      <h4>{item.activity.title}</h4>
                      <p>{item.enrichedRules[0] ? formatRuleCounter(item.enrichedRules[0], item.counts) : "No active rules"}</p>
                    </div>
                  </div>
                  {item.status === "complete" ? <Check size={16} /> : <Plus size={16} />}
                </article>
              ))}
            </div>
          </section>

          <section className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <span className={styles.eyebrow}>Snapshot</span>
              <strong>Today</strong>
            </div>
            <div className={styles.metricGrid}>
              <article className={styles.metricCard}>
                <span>Visible</span>
                <strong>{summary.totalVisible}</strong>
              </article>
              <article className={styles.metricCard}>
                <span>Complete</span>
                <strong>{summary.completedToday}</strong>
              </article>
              <article className={styles.metricCard}>
                <span>Ready</span>
                <strong>{summary.readyToLog}</strong>
              </article>
              <article className={styles.metricCard}>
                <span>Reward</span>
                <strong>{reward.points}</strong>
              </article>
            </div>
          </section>

          <section className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <span className={styles.eyebrow}>Reward pulse</span>
              <strong>{formatMilestoneSummary(reward.points, reward.nextMilestone)}</strong>
            </div>
            <div className={styles.milestoneList}>
              {rewardMilestones.map((milestone) => (
                <div
                  key={milestone}
                  className={cn(
                    styles.milestoneItem,
                    reward.completedMilestones.includes(milestone) && styles.milestoneDone,
                  )}
                >
                  <span>{milestone} pts</span>
                  <strong>
                    {reward.completedMilestones.includes(milestone) ? "Unlocked" : "Pending"}
                  </strong>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
