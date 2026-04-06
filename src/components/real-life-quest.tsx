"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Book,
  BookOpen,
  Briefcase,
  Calendar as CalendarIcon,
  Camera,
  Car,
  Check,
  ChevronRight,
  Clock,
  Code,
  Coffee,
  Droplets,
  Dumbbell,
  Flame,
  Gamepad2,
  Headphones,
  Heart,
  Monitor,
  Music,
  PenTool,
  Plane,
  Plus,
  ShoppingCart,
  Smile,
  Star,
  Stethoscope,
  Target,
  Tent,
  Utensils,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP = {
  Utensils,
  Droplets,
  Dumbbell,
  Tent,
  Stethoscope,
  BookOpen,
  Briefcase,
  Coffee,
  Heart,
  Music,
  ShoppingCart,
  Smile,
  Star,
  Zap,
  Gamepad2,
  Headphones,
  Monitor,
  Target,
  Plane,
  Code,
  PenTool,
  Book,
  Camera,
  Car,
} satisfies Record<string, LucideIcon>;

const COLOR_OPTIONS = [
  "text-red-500",
  "text-orange-500",
  "text-yellow-500",
  "text-green-500",
  "text-teal-500",
  "text-blue-500",
  "text-indigo-500",
  "text-purple-500",
  "text-pink-500",
  "text-slate-600",
] as const;

const COLOR_BG_MAP: Record<(typeof COLOR_OPTIONS)[number], string> = {
  "text-red-500": "bg-red-500",
  "text-orange-500": "bg-orange-500",
  "text-yellow-500": "bg-yellow-500",
  "text-green-500": "bg-green-500",
  "text-teal-500": "bg-teal-500",
  "text-blue-500": "bg-blue-500",
  "text-indigo-500": "bg-indigo-500",
  "text-purple-500": "bg-purple-500",
  "text-pink-500": "bg-pink-500",
  "text-slate-600": "bg-slate-600",
};

const AVATARS = [
  "🐰",
  "🦊",
  "🐼",
  "🐱",
  "🦄",
  "🐧",
  "🦉",
  "🐻",
  "🦁",
  "🐸",
  "🐢",
  "🦖",
  "🦋",
  "🐞",
  "🍄",
  "🌸",
] as const;

const STORAGE_KEY = "rlq_data";
const PRONTERA_BACKGROUND = 'url("/prontera-bg.jpg")';

type IconName = keyof typeof ICON_MAP;
type IconColor = (typeof COLOR_OPTIONS)[number];

type Task = {
  id: string;
  title: string;
  apReward: number;
  dailyProgress?: number;
  dailyMax?: number;
  weeklyProgress?: number;
  weeklyMax?: number;
  monthlyProgress?: number;
  monthlyMax?: number;
  yearlyProgress?: number;
  yearlyMax?: number;
  iconName: IconName;
  iconColor: string;
};

type HistoryEntry = {
  id: number;
  title: string;
  apReward: number;
  isExp: boolean;
  logicalDay: string;
  timeStr: string;
};

type ExpEffect = {
  id: number;
  milestone: number;
};

type UserProfile = {
  name: string;
  age: string;
  gender: string;
  avatar: string;
  totalExp: number;
};

type DraftProfile = Omit<UserProfile, "totalExp">;

type LogicalWeekDay = {
  logicalDay: string;
  dayName: string;
  shortDate: string;
};

type LogicalTime = {
  logicalDay: string;
  logicalWeek: string;
  logicalMonth: string;
  logicalYear: string;
  displayDate: string;
  weekDays: LogicalWeekDay[];
};

type PersistedData = {
  points?: number;
  dates?: LogicalTime;
  history?: HistoryEntry[];
  claimedChests?: number[];
  profile?: UserProfile;
  tasks?: Task[];
};

type NewTaskDraft = {
  title: string;
  apReward: number | string;
  dailyMax: string;
  weeklyMax: string;
  monthlyMax: string;
  yearlyMax: string;
  iconName: IconName;
  iconColor: IconColor;
};

const INITIAL_TASKS: Task[] = [
  {
    id: "t1",
    title: "Makan Bergizi",
    apReward: 10,
    dailyProgress: 0,
    dailyMax: 3,
    iconName: "Utensils",
    iconColor: "text-orange-500",
  },
  {
    id: "t2",
    title: "Minum Air (Gelas)",
    apReward: 5,
    dailyProgress: 0,
    dailyMax: 8,
    iconName: "Droplets",
    iconColor: "text-blue-500",
  },
  {
    id: "t_mandi",
    title: "Mandi & Bersih Diri",
    apReward: 10,
    dailyProgress: 0,
    dailyMax: 2,
    iconName: "Smile",
    iconColor: "text-teal-500",
  },
  {
    id: "t_tidur",
    title: "Tidur Cukup (7-8 Jam)",
    apReward: 15,
    dailyProgress: 0,
    dailyMax: 1,
    iconName: "Heart",
    iconColor: "text-indigo-400",
  },
  {
    id: "t3",
    title: "Sesi Gym",
    apReward: 20,
    dailyProgress: 0,
    dailyMax: 1,
    weeklyProgress: 0,
    weeklyMax: 5,
    iconName: "Dumbbell",
    iconColor: "text-slate-600",
  },
  {
    id: "t_baca",
    title: "Membaca / Belajar (30mnt)",
    apReward: 15,
    dailyProgress: 0,
    dailyMax: 1,
    iconName: "BookOpen",
    iconColor: "text-purple-500",
  },
  {
    id: "t_bersih",
    title: "Deep Clean Rumah",
    apReward: 30,
    weeklyProgress: 0,
    weeklyMax: 1,
    iconName: "Zap",
    iconColor: "text-yellow-500",
  },
  {
    id: "t4",
    title: "Staycation / Healing",
    apReward: 50,
    monthlyProgress: 0,
    monthlyMax: 1,
    iconName: "Tent",
    iconColor: "text-green-600",
  },
  {
    id: "t_tagihan",
    title: "Bayar Tagihan Bulanan",
    apReward: 40,
    monthlyProgress: 0,
    monthlyMax: 1,
    iconName: "Briefcase",
    iconColor: "text-slate-700",
  },
  {
    id: "t5",
    title: "Medical Check-up",
    apReward: 100,
    monthlyProgress: 0,
    monthlyMax: 1,
    yearlyProgress: 0,
    yearlyMax: 2,
    iconName: "Stethoscope",
    iconColor: "text-red-500",
  },
];

const DEFAULT_DRAFT_PROFILE: DraftProfile = {
  name: "",
  age: "",
  gender: "Laki-laki",
  avatar: "🐰",
};

const DEFAULT_NEW_TASK: NewTaskDraft = {
  title: "",
  apReward: 10,
  dailyMax: "",
  weeklyMax: "",
  monthlyMax: "",
  yearlyMax: "",
  iconName: "Star",
  iconColor: "text-orange-500",
};

const tabs = [
  { id: "event", label: "Event" },
  { id: "calendar", label: "Calendar" },
] as const;

const boxColors = [
  ["#bfdbfe", "#93c5fd"],
  ["#e9d5ff", "#d8b4fe"],
  ["#fecaca", "#fca5a5"],
  ["#fca5a5", "#f87171"],
  ["#f87171", "#ef4444"],
] as const;

const getLevelInfo = (totalExp = 0) => {
  let level = 1;
  let expForNextLevel = 50;
  let expInCurrentLevel = totalExp;

  while (expInCurrentLevel >= expForNextLevel) {
    expInCurrentLevel -= expForNextLevel;
    level += 1;
    expForNextLevel = level * 50;
  }

  return { level, currentExp: expInCurrentLevel, expToNext: expForNextLevel };
};

const getLogicalTime = (offsetDays = 0): LogicalTime => {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);
  const adjusted = new Date(now.getTime());

  if (adjusted.getHours() < 2) {
    adjusted.setDate(adjusted.getDate() - 1);
  }

  const logicalDay = adjusted.toDateString();
  const dayOfWeek = adjusted.getDay();
  const diffToMonday =
    adjusted.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(adjusted.getTime());
  monday.setDate(diffToMonday);
  const logicalWeek = monday.toDateString();
  const logicalMonth = `${adjusted.getFullYear()}-${adjusted.getMonth()}`;
  const logicalYear = `${adjusted.getFullYear()}`;

  const days = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const displayDate = `${days[adjusted.getDay()]}, ${adjusted.getDate()} ${
    months[adjusted.getMonth()]
  } ${adjusted.getFullYear()}`;

  const weekDays: LogicalWeekDay[] = [];
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(monday.getTime());
    date.setDate(monday.getDate() + index);
    weekDays.push({
      logicalDay: date.toDateString(),
      dayName: days[date.getDay()],
      shortDate: `${date.getDate()} ${months[date.getMonth()].substring(0, 3)}`,
    });
  }

  return {
    logicalDay,
    logicalWeek,
    logicalMonth,
    logicalYear,
    displayDate,
    weekDays,
  };
};

function applyResetLogic(
  sourceTasks: Task[],
  previousDates: LogicalTime,
  currentDates: LogicalTime,
) {
  const resetDaily = currentDates.logicalDay !== previousDates.logicalDay;
  const resetWeekly = currentDates.logicalWeek !== previousDates.logicalWeek;
  const resetMonthly = currentDates.logicalMonth !== previousDates.logicalMonth;
  const resetYearly = currentDates.logicalYear !== previousDates.logicalYear;

  return sourceTasks.map((task) => ({
    ...task,
    dailyProgress: resetDaily ? 0 : task.dailyProgress || 0,
    weeklyProgress: resetWeekly ? 0 : task.weeklyProgress || 0,
    monthlyProgress: resetMonthly ? 0 : task.monthlyProgress || 0,
    yearlyProgress: resetYearly ? 0 : task.yearlyProgress || 0,
  }));
}

function renderLimitText(task: Task) {
  const parts: string[] = [];
  if (task.dailyMax) {
    parts.push(`Daily: ${task.dailyProgress || 0}/${task.dailyMax}`);
  }
  if (task.weeklyMax) {
    parts.push(`Weekly: ${task.weeklyProgress || 0}/${task.weeklyMax}`);
  }
  if (task.monthlyMax) {
    parts.push(`Monthly: ${task.monthlyProgress || 0}/${task.monthlyMax}`);
  }
  if (task.yearlyMax) {
    parts.push(`Yearly: ${task.yearlyProgress || 0}/${task.yearlyMax}`);
  }
  return parts.join("; ");
}

function isTaskDisabled(task: Task) {
  return Boolean(
    (task.dailyMax && (task.dailyProgress || 0) >= task.dailyMax) ||
      (task.weeklyMax && (task.weeklyProgress || 0) >= task.weeklyMax) ||
      (task.monthlyMax && (task.monthlyProgress || 0) >= task.monthlyMax) ||
      (task.yearlyMax && (task.yearlyProgress || 0) >= task.yearlyMax),
  );
}

function BunnyGuide({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 100 150" className={className}>
      <path
        d="M 40 40 Q 30 10 40 10 Q 50 10 45 40 Z"
        fill="#ffffff"
        stroke="#e2d5c3"
        strokeWidth="2"
      />
      <path
        d="M 60 40 Q 70 10 60 10 Q 50 10 55 40 Z"
        fill="#ffffff"
        stroke="#e2d5c3"
        strokeWidth="2"
      />
      <path
        d="M 41 35 Q 35 15 40 15 Q 45 15 43 35 Z"
        fill="#fecaca"
      />
      <path
        d="M 59 35 Q 65 15 60 15 Q 55 15 57 35 Z"
        fill="#fecaca"
      />
      <circle cx="50" cy="50" r="20" fill="#fcd34d" />
      <circle cx="50" cy="56" r="18" fill="#ffedd5" />
      <circle cx="43" cy="54" r="2" fill="#0f172a" />
      <circle cx="57" cy="54" r="2" fill="#0f172a" />
      <circle cx="40" cy="58" r="3" fill="#fecaca" opacity="0.6" />
      <circle cx="60" cy="58" r="3" fill="#fecaca" opacity="0.6" />
      <path
        d="M 48 60 Q 50 63 52 60"
        fill="none"
        stroke="#0f172a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M 32 46 Q 50 36 68 46 Q 50 30 32 46 Z" fill="#fcd34d" />
      <path d="M 35 74 L 65 74 L 70 104 L 30 104 Z" fill="#60a5fa" />
      <path d="M 40 74 L 60 74 L 50 84 Z" fill="#ffffff" />
      <path d="M 35 74 L 25 94 L 32 94 Z" fill="#60a5fa" />
      <path d="M 65 74 L 75 94 L 68 94 Z" fill="#60a5fa" />
      <rect x="40" y="89" width="20" height="15" rx="2" fill="#1e3a8a" />
      <circle cx="35" cy="94" r="4" fill="#ffedd5" />
      <circle cx="65" cy="94" r="4" fill="#ffedd5" />
      <path d="M 40 104 L 40 134 L 48 134 L 48 104 Z" fill="#ffffff" />
      <path d="M 52 104 L 52 134 L 60 134 L 60 104 Z" fill="#ffffff" />
      <path d="M 38 134 L 48 134 L 48 139 L 38 139 Z" fill="#3b82f6" />
      <path d="M 52 134 L 62 134 L 62 139 L 52 139 Z" fill="#3b82f6" />
    </svg>
  );
}

function CatChest({
  milestone,
  claimed,
  canClaim,
  colors,
  onClaim,
}: {
  milestone: number;
  claimed: boolean;
  canClaim: boolean;
  colors: readonly [string, string];
  onClaim: () => void;
}) {
  return (
    <button
      onClick={onClaim}
      disabled={!canClaim}
      type="button"
      className={`quest-progress-chest relative z-10 -mt-12 md:-mt-14 focus:outline-none ${
        canClaim
          ? "cursor-pointer drop-shadow-lg transition-transform duration-200 hover:scale-110"
          : "cursor-not-allowed drop-shadow-sm transition-transform duration-200 hover:scale-105"
      } ${!canClaim && !claimed ? "opacity-80 grayscale-[30%]" : ""}`}
      aria-label={`Milestone ${milestone}`}
    >
      <div className="quest-progress-chest-art relative h-12 w-10 md:h-[54px] md:w-12">
        <svg viewBox="0 0 48 56" className="h-full w-full drop-shadow-sm overflow-visible">
          <defs>
            <linearGradient id={`grad-${milestone}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors[0]} />
              <stop offset="100%" stopColor={colors[1]} />
            </linearGradient>
          </defs>

          <path
            d="M 14 24 L 10 8 L 22 18 Z"
            fill="#ffffff"
            stroke="#475569"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M 34 24 L 38 8 L 26 18 Z"
            fill="#ffffff"
            stroke="#475569"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M 31 15 Q 38 7 42 12 Q 37 18 31 15 Z" fill="#4ade80" stroke="#166534" strokeWidth="1" />
          <path
            d="M 10 32 C 10 12, 38 12, 38 32 Z"
            fill="#ffffff"
            stroke="#475569"
            strokeWidth="1.5"
          />
          <circle cx="18" cy="23" r="1.5" fill="#0f172a" />
          <circle cx="30" cy="23" r="1.5" fill="#0f172a" />
          <path
            d="M 22 25 Q 24 28 26 25"
            fill="none"
            stroke="#0f172a"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M 24 26 L 24 28"
            fill="none"
            stroke="#0f172a"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M 8 32 L 8 50 C 8 55, 40 55, 40 50 L 40 32 Z"
            fill={`url(#grad-${milestone})`}
            stroke="#475569"
            strokeWidth="1.5"
          />
          <path
            d="M 8 32 C 8 36, 40 36, 40 32"
            fill="none"
            stroke="#475569"
            strokeWidth="1.5"
          />
          <rect x="18" y="38" width="12" height="6" rx="1" fill="#ffffff" stroke="#475569" strokeWidth="1" />
          <line x1="20" y1="41" x2="28" y2="41" stroke="#ef4444" strokeWidth="1.5" />
          <circle cx="24" cy="29" r="5.5" fill="#f472b6" stroke="#475569" strokeWidth="1" />
          <path
            d="M 22 26 Q 26 24 27 28 T 24 32"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        {claimed ? (
          <div className="absolute -top-1 -right-2 z-20 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[#4ade80] shadow-sm md:-right-3 md:h-5 md:w-5">
            <Check className="h-3 w-3 text-white md:h-4 md:w-4" strokeWidth={4} />
          </div>
        ) : null}
      </div>
    </button>
  );
}

function LiveClockChip({ displayDate }: { displayDate: string }) {
  const [realTime, setRealTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setRealTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="hidden items-center gap-2 rounded-full border border-white/50 bg-white/85 px-3 py-1 shadow-sm sm:flex">
      <div className="flex items-center text-xs font-bold text-[#5c85d6]">
        <CalendarIcon className="mr-1 h-3.5 w-3.5" />
        {displayDate}
      </div>
      <div className="h-3 w-px bg-slate-300" />
      <div className="flex items-center text-xs font-bold text-orange-500">
        <Clock className="mr-1 h-3.5 w-3.5" />
        {realTime.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </div>
    </div>
  );
}

export default function RealLifeQuest() {
  const historyIdRef = useRef(1);
  const customTaskIdRef = useRef(1);
  const effectIdRef = useRef(1);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activeTab, setActiveTab] = useState<"event" | "calendar">("event");
  const [activityPoints, setActivityPoints] = useState(0);
  const [offsetDays, setOffsetDays] = useState(0);
  const [dates, setDates] = useState<LogicalTime>(() => getLogicalTime(0));
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [claimedChests, setClaimedChests] = useState<number[]>([]);
  const [expEffects, setExpEffects] = useState<ExpEffect[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [draftProfile, setDraftProfile] =
    useState<DraftProfile>(DEFAULT_DRAFT_PROFILE);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState<NewTaskDraft>(DEFAULT_NEW_TASK);

  useEffect(() => {
    const savedData = window.localStorage.getItem(STORAGE_KEY);
    const currentTime = getLogicalTime(0);
    let loadedPoints = 0;
    let loadedTasks = [...INITIAL_TASKS];
    let loadedHistory: HistoryEntry[] = [];
    let loadedClaimedChests: number[] = [];
    let loadedProfile: UserProfile | null = null;

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData) as PersistedData;
        const previousDates = parsed.dates || currentTime;
        const resetDaily = currentTime.logicalDay !== previousDates.logicalDay;

        loadedPoints = resetDaily ? 0 : parsed.points || 0;
        loadedClaimedChests = resetDaily ? [] : parsed.claimedChests || [];
        loadedHistory = parsed.history || [];

        if (parsed.profile) {
          loadedProfile = {
            ...parsed.profile,
            totalExp: parsed.profile.totalExp || 0,
          };
        }

        if (parsed.tasks) {
          loadedTasks = applyResetLogic(parsed.tasks, previousDates, currentTime);
        }

        historyIdRef.current = (parsed.history?.length || 0) + 1;
        customTaskIdRef.current =
          (parsed.tasks?.filter((task) => task.id.startsWith("custom_")).length || 0) + 1;
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    queueMicrotask(() => {
      setTasks(loadedTasks);
      setActivityPoints(loadedPoints);
      setClaimedChests(loadedClaimedChests);
      setHistory(loadedHistory);
      setUserProfile(loadedProfile);
      setDates(currentTime);
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const dataToSave: PersistedData = {
      points: activityPoints,
      dates,
      history,
      claimedChests,
      profile: userProfile || undefined,
      tasks,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [tasks, activityPoints, dates, history, claimedChests, userProfile, isLoaded]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const interval = window.setInterval(() => {
      const currentTime = getLogicalTime(offsetDays);
      if (currentTime.logicalDay !== dates.logicalDay) {
        setDates(currentTime);
        setActivityPoints(0);
        setClaimedChests([]);
        setTasks((previousTasks) => applyResetLogic(previousTasks, dates, currentTime));
        window.alert(
          "SERVER RESET: Hari telah berganti (02:00 AM)! Waktunya kerjakan quest harian baru.",
        );
      }
    }, 60000);

    return () => window.clearInterval(interval);
  }, [dates, isLoaded, offsetDays]);

  const handleAction = (task: Task) => {
    if (task.dailyMax && (task.dailyProgress || 0) >= task.dailyMax) {
      window.alert(`Limit harian untuk ${task.title} sudah habis!`);
      return;
    }
    if (task.weeklyMax && (task.weeklyProgress || 0) >= task.weeklyMax) {
      window.alert(`Limit mingguan untuk ${task.title} sudah habis!`);
      return;
    }
    if (task.monthlyMax && (task.monthlyProgress || 0) >= task.monthlyMax) {
      window.alert(`Limit bulanan untuk ${task.title} sudah habis!`);
      return;
    }
    if (task.yearlyMax && (task.yearlyProgress || 0) >= task.yearlyMax) {
      window.alert(`Limit tahunan untuk ${task.title} sudah habis!`);
      return;
    }

    setTasks((previousTasks) =>
      previousTasks.map((currentTask) => {
        if (currentTask.id !== task.id) {
          return currentTask;
        }

        return {
          ...currentTask,
          dailyProgress: currentTask.dailyMax
            ? (currentTask.dailyProgress || 0) + 1
            : currentTask.dailyProgress,
          weeklyProgress: currentTask.weeklyMax
            ? (currentTask.weeklyProgress || 0) + 1
            : currentTask.weeklyProgress,
          monthlyProgress: currentTask.monthlyMax
            ? (currentTask.monthlyProgress || 0) + 1
            : currentTask.monthlyProgress,
          yearlyProgress: currentTask.yearlyMax
            ? (currentTask.yearlyProgress || 0) + 1
            : currentTask.yearlyProgress,
        };
      }),
    );

    setActivityPoints((previousValue) => previousValue + task.apReward);

    const now = new Date();
    const historyId = historyIdRef.current;
    historyIdRef.current += 1;
    setHistory((previousHistory) => [
      ...previousHistory,
      {
        id: historyId,
        title: task.title,
        apReward: task.apReward,
        isExp: false,
        logicalDay: dates.logicalDay,
        timeStr: now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const resetProgress = () => {
    setTasks(INITIAL_TASKS);
    setActivityPoints(0);
    setClaimedChests([]);
    setHistory([]);
    setUserProfile(null);
    setDraftProfile(DEFAULT_DRAFT_PROFILE);
    setShowAddModal(false);
    setNewTask(DEFAULT_NEW_TASK);
    setOffsetDays(0);
    setDates(getLogicalTime(0));
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const simulateNextDay = () => {
    const newOffset = offsetDays + 1;
    setOffsetDays(newOffset);
    const currentTime = getLogicalTime(newOffset);

    const resetDaily = currentTime.logicalDay !== dates.logicalDay;
    const resetWeekly = currentTime.logicalWeek !== dates.logicalWeek;
    const resetMonthly = currentTime.logicalMonth !== dates.logicalMonth;
    const resetYearly = currentTime.logicalYear !== dates.logicalYear;

    setDates(currentTime);
    setActivityPoints(resetDaily ? 0 : activityPoints);
    if (resetDaily) {
      setClaimedChests([]);
    }
    setTasks((previousTasks) =>
      previousTasks.map((task) => ({
        ...task,
        dailyProgress: resetDaily ? 0 : task.dailyProgress,
        weeklyProgress: resetWeekly ? 0 : task.weeklyProgress,
        monthlyProgress: resetMonthly ? 0 : task.monthlyProgress,
        yearlyProgress: resetYearly ? 0 : task.yearlyProgress,
      })),
    );

    let message = `SIMULASI: Waktu dipercepat 1 Hari ke ${currentTime.displayDate}!\n`;
    if (resetDaily) {
      message += "- Daily Reset\n";
    }
    if (resetWeekly) {
      message += "- Weekly Reset (Hari Senin!)\n";
    }
    window.alert(message);
  };

  const handleCreateCustomTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newTask.title.trim()) {
      window.alert("Judul event tidak boleh kosong!");
      return;
    }
    if (
      !newTask.dailyMax &&
      !newTask.weeklyMax &&
      !newTask.monthlyMax &&
      !newTask.yearlyMax
    ) {
      window.alert("Pilih minimal satu batas (limit) waktu!");
      return;
    }

    const customTask: Task = {
      id: `custom_${customTaskIdRef.current}`,
      title: newTask.title,
      apReward: Number(newTask.apReward),
      iconName: newTask.iconName,
      iconColor: newTask.iconColor,
      dailyProgress: 0,
      weeklyProgress: 0,
      monthlyProgress: 0,
      yearlyProgress: 0,
    };

    customTaskIdRef.current += 1;

    if (newTask.dailyMax) {
      customTask.dailyMax = Number(newTask.dailyMax);
    }
    if (newTask.weeklyMax) {
      customTask.weeklyMax = Number(newTask.weeklyMax);
    }
    if (newTask.monthlyMax) {
      customTask.monthlyMax = Number(newTask.monthlyMax);
    }
    if (newTask.yearlyMax) {
      customTask.yearlyMax = Number(newTask.yearlyMax);
    }

    setTasks((previousTasks) => [...previousTasks, customTask]);
    setShowAddModal(false);
    setNewTask(DEFAULT_NEW_TASK);
  };

  const handleClaimChest = (milestone: number) => {
    if (activityPoints < milestone || claimedChests.includes(milestone)) {
      return;
    }

    setClaimedChests((previousClaimed) => [...previousClaimed, milestone]);
    setUserProfile((previousProfile) =>
      previousProfile
        ? { ...previousProfile, totalExp: (previousProfile.totalExp || 0) + 10 }
        : previousProfile,
    );

    const effectId = effectIdRef.current;
    effectIdRef.current += 1;
    setExpEffects((previousEffects) => [
      ...previousEffects,
      { id: effectId, milestone },
    ]);
    window.setTimeout(() => {
      setExpEffects((previousEffects) =>
        previousEffects.filter((effect) => effect.id !== effectId),
      );
    }, 1200);

    const now = new Date();
    const historyId = historyIdRef.current;
    historyIdRef.current += 1;
    setHistory((previousHistory) => [
      ...previousHistory,
      {
        id: historyId,
        title: `Claim Hadiah ${milestone} AP`,
        apReward: 10,
        isExp: true,
        logicalDay: dates.logicalDay,
        timeStr: now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const renderProgressBar = () => {
    const milestones = [20, 40, 60, 80, 100];
    const maxPoints = 100;
    const progressPercentage = Math.min((activityPoints / maxPoints) * 100, 100);

    return (
      <div className="quest-progress-bar relative z-10 flex w-full items-end overflow-visible border-t-[3px] border-[#f0e6d2] bg-[#fffaf0] px-4 pt-12 pb-3 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] md:px-8">
        <div className="quest-progress-reset-label pointer-events-none absolute right-4 top-2 text-[10px] font-bold tracking-wide text-[#a08b74]">
          Refreshes at 2 AM every day
        </div>
        <div className="quest-progress-floor pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#e2d5c3]/40 to-transparent" />

        <div className="quest-progress-left z-20 mb-1 flex shrink-0 items-end">
          <div className="quest-progress-bunny-shell relative mr-2 flex h-20 w-12 items-end justify-center md:h-24 md:w-16">
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-blue-200/80 to-transparent opacity-70 blur-md" />
            <BunnyGuide className="quest-progress-bunny relative z-10 w-[50px] origin-bottom pb-1 drop-shadow-md md:h-[105px] md:w-[70px]" />
          </div>

          <div className="quest-progress-ap relative mb-3 mr-4 flex items-center overflow-hidden rounded-xl border-2 border-orange-200 bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-orange-50/50" />
            <Flame className="quest-progress-ap-icon relative z-10 mr-1 h-5 w-5 animate-pulse text-orange-400 drop-shadow-sm md:h-6 md:w-6" />
            <span className="quest-progress-ap-value relative z-10 ml-1 text-xl font-black text-[#1dbb8f] md:text-2xl">
              {activityPoints}
            </span>
          </div>
        </div>

        <div className="quest-progress-track relative mb-4 ml-2 mr-2 h-2.5 flex-1 rounded-full border border-[#c1c9d2] bg-[#dbe0e5] shadow-inner md:mr-8 md:h-3">
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-[#1dbb8f] shadow-[0_0_8px_#1dbb8f] transition-all duration-700 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />

          {milestones.map((milestone, index) => {
            const isReached = activityPoints >= milestone;
            const isClaimed = claimedChests.includes(milestone);
            const canClaim = isReached && !isClaimed;

            return (
              <div
                key={milestone}
                className="absolute top-1/2 flex flex-col items-center"
                style={{
                  left: `${(milestone / maxPoints) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div className="quest-progress-node absolute top-0 z-0 h-2 w-2 -translate-y-1/2 rounded-full border border-white/50 bg-[#6ca4f4] shadow-[0_0_4px_#5c85d6] md:h-2.5 md:w-2.5" />

                {expEffects.map(
                  (effect) =>
                    effect.milestone === milestone && (
                      <div
                        key={effect.id}
                        className="animate-float-up absolute -top-20 z-50 whitespace-nowrap text-sm font-black text-green-500 drop-shadow-md md:text-lg"
                      >
                        +10 EXP
                      </div>
                    ),
                )}

                <CatChest
                  canClaim={canClaim}
                  claimed={isClaimed}
                  colors={boxColors[index]}
                  milestone={milestone}
                  onClaim={() => handleClaimChest(milestone)}
                />

                <span
                  className={`quest-progress-milestone mt-2.5 text-[11px] font-black md:text-[13px] ${
                    isReached ? "text-[#1dbb8f]" : "text-[#94a3b8]"
                  }`}
                >
                  {milestone}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="quest-pop-in rounded-2xl border border-white/30 bg-[#fffaf0]/90 px-5 py-3 text-sm font-bold text-slate-700 shadow-xl">
          Loading quest board...
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div
        className="relative flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans"
        style={{
          backgroundImage: PRONTERA_BACKGROUND,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/45" />
        <div className="quest-pop-in relative z-10 w-full max-w-md rounded-3xl border-[3px] border-[#e8d5b5] bg-[#fffaf0]/96 p-6 shadow-2xl md:p-8">
          <div className="mb-6 text-center">
            <div className="relative mx-auto mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#e8d5b5] text-4xl shadow-md">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
              <span className="relative z-10">{draftProfile.avatar}</span>
            </div>
            <h2 className="text-2xl font-black tracking-wide text-slate-800">
              Buat Karakter
            </h2>
            <p className="mt-1 text-sm font-medium text-[#a08b74]">
              Persiapkan dirimu sebelum memulai Quest!
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              setUserProfile({ ...draftProfile, totalExp: 0 });
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-xs font-bold tracking-wider text-[#a08b74] uppercase">
                Nama Karakter
              </label>
              <input
                type="text"
                required
                maxLength={20}
                placeholder="Nama jagoanmu..."
                value={draftProfile.name}
                onChange={(event) =>
                  setDraftProfile({ ...draftProfile, name: event.target.value })
                }
                className="w-full rounded-xl border border-[#e8d5b5] bg-white px-4 py-2.5 font-bold text-slate-800 shadow-inner outline-none transition-all focus:border-[#d4a373] focus:ring-2 focus:ring-[#d4a373]/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold tracking-wider text-[#a08b74] uppercase">
                  Usia
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  required
                  placeholder="Tahun"
                  value={draftProfile.age}
                  onChange={(event) =>
                    setDraftProfile({ ...draftProfile, age: event.target.value })
                  }
                  className="w-full rounded-xl border border-[#e8d5b5] bg-white px-4 py-2.5 text-center font-bold text-slate-800 shadow-inner outline-none transition-all focus:border-[#d4a373] focus:ring-2 focus:ring-[#d4a373]/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold tracking-wider text-[#a08b74] uppercase">
                  Gender
                </label>
                <select
                  value={draftProfile.gender}
                  onChange={(event) =>
                    setDraftProfile({
                      ...draftProfile,
                      gender: event.target.value,
                    })
                  }
                  className="w-full cursor-pointer rounded-xl border border-[#e8d5b5] bg-white px-4 py-2.5 font-bold text-slate-800 shadow-inner outline-none transition-all focus:border-[#d4a373] focus:ring-2 focus:ring-[#d4a373]/30"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold tracking-wider text-[#a08b74] uppercase">
                Pilih Avatar
              </label>
              <div className="custom-scrollbar h-40 overflow-y-auto rounded-xl border border-[#e8d5b5] bg-white p-3 shadow-inner">
                <div className="grid grid-cols-4 gap-2">
                  {AVATARS.map((avatar) => (
                    <button
                      type="button"
                      key={avatar}
                      onClick={() => setDraftProfile({ ...draftProfile, avatar })}
                      className={`rounded-xl p-2 text-2xl transition-all duration-200 ${
                        draftProfile.avatar === avatar
                          ? "scale-105 transform border-2 border-orange-200 bg-[#d4a373] text-white shadow-md"
                          : "border border-slate-100 bg-slate-50 hover:scale-105 hover:bg-slate-100"
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-xl border border-[#8ec0ff] bg-gradient-to-b from-[#6ca4f4] to-[#4b7dd1] py-3.5 text-lg font-black tracking-wide text-white shadow-[0_4px_0_#2b5296] transition-all active:scale-95 hover:translate-y-[2px] hover:from-[#5b90dd] hover:to-[#3a6bc0] hover:shadow-[0_2px_0_#2b5296]"
              >
                <Flame className="mr-2 h-5 w-5" />
                Mulai Petualangan
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-2 font-sans sm:p-4 md:p-8"
      style={{
        backgroundImage: PRONTERA_BACKGROUND,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[#fffaf0]/55" />

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4 backdrop-blur-[1px]">
          <div className="quest-pop-in w-full max-w-md overflow-hidden rounded-2xl border-[3px] border-[#e8d5b5] bg-[#fffaf0] shadow-xl">
            <div className="flex items-center justify-between border-b-2 border-[#3a6bc0] bg-gradient-to-r from-[#6ca4f4] to-[#4b7dd1] p-4 text-white">
              <h3 className="flex items-center text-lg font-bold tracking-wide">
                <Star className="mr-2 h-5 w-5 fill-yellow-300 text-yellow-300" />
                Buat Custom Event
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-1 transition-colors hover:bg-white/20"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateCustomTask}
              className="custom-scrollbar max-h-[80vh] space-y-4 overflow-y-auto p-6"
            >
              <div>
                <label className="mb-1 block text-xs font-bold tracking-wider text-[#a08b74] uppercase">
                  Nama Event
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Baca Buku 30 Menit"
                  value={newTask.title}
                  onChange={(event) =>
                    setNewTask({ ...newTask, title: event.target.value })
                  }
                  className="w-full rounded-lg border border-[#e8d5b5] bg-white px-3 py-2 font-medium text-slate-800 shadow-inner outline-none focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold tracking-wider text-[#a08b74] uppercase">
                  Hadiah Activity Point (AP)
                </label>
                <div className="flex items-center">
                  <Flame className="mr-2 h-5 w-5 text-orange-500 drop-shadow-sm" />
                  <input
                    type="number"
                    min="1"
                    required
                    value={newTask.apReward}
                    onChange={(event) =>
                      setNewTask({ ...newTask, apReward: event.target.value })
                    }
                    className="w-24 rounded-lg border border-[#e8d5b5] bg-white px-3 py-2 text-center font-bold text-orange-600 shadow-inner outline-none focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold tracking-wider text-[#a08b74] uppercase">
                  Pilih Ikon & Warna
                </label>
                <div className="rounded-lg border border-[#e8d5b5] bg-white p-3 shadow-inner">
                  <div className="custom-scrollbar mb-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto p-1">
                    {Object.keys(ICON_MAP).map((iconKey) => {
                      const IconComponent = ICON_MAP[iconKey as IconName];
                      return (
                        <button
                          type="button"
                          key={iconKey}
                          onClick={() =>
                            setNewTask({
                              ...newTask,
                              iconName: iconKey as IconName,
                            })
                          }
                          className={`rounded-lg border p-2 transition-all ${
                            newTask.iconName === iconKey
                              ? `border-blue-400 bg-[#fffaf0] shadow-md ${newTask.iconColor}`
                              : "border-transparent text-[#a08b74] hover:bg-slate-100 hover:text-slate-600"
                          }`}
                        >
                          <IconComponent className="h-5 w-5" />
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-[#e8d5b5] pt-3">
                    {COLOR_OPTIONS.map((colorClass) => (
                      <button
                        type="button"
                        key={colorClass}
                        onClick={() =>
                          setNewTask({ ...newTask, iconColor: colorClass })
                        }
                        className={`h-6 w-6 rounded-full border-2 transition-transform ${
                          COLOR_BG_MAP[colorClass]
                        } ${
                          newTask.iconColor === colorClass
                            ? "scale-110 border-slate-800 shadow-md"
                            : "border-transparent"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold tracking-wider text-[#a08b74] uppercase">
                  Batas / Limit Pelaksanaan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "dailyMax", label: "Daily Max" },
                    { key: "weeklyMax", label: "Weekly Max" },
                    { key: "monthlyMax", label: "Monthly Max" },
                    { key: "yearlyMax", label: "Yearly Max" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-lg border border-[#e8d5b5] bg-slate-50 p-2"
                    >
                      <span className="text-sm font-semibold text-slate-600">
                        {item.label}
                      </span>
                      <input
                        type="number"
                        min="1"
                        placeholder="-"
                        value={newTask[item.key as keyof NewTaskDraft] as string}
                        onChange={(event) =>
                          setNewTask({
                            ...newTask,
                            [item.key]: event.target.value,
                          })
                        }
                        className="w-12 rounded border border-[#e8d5b5] bg-white px-1 py-1 text-center text-sm font-bold outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#e8d5b5] pt-4">
                <button
                  type="submit"
                  className="w-full rounded-xl border border-[#4adeb9] bg-[#1dbb8f] py-3 font-bold text-white shadow-[0_4px_0_#138263] transition-all active:scale-95 hover:translate-y-[2px] hover:bg-[#19a57e] hover:shadow-[0_2px_0_#138263]"
                >
                  Tambahkan ke Quest Board
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="relative z-10 flex h-[90vh] max-h-[850px] w-full max-w-6xl flex-col md:flex-row">
        <div className="absolute top-2 right-0 z-30 flex items-center gap-2">
          <LiveClockChip displayDate={dates.displayDate} />
          <button
            onClick={simulateNextDay}
            className="rounded-full border border-purple-400 bg-purple-500 px-3 py-1.5 text-xs font-bold text-white shadow-md transition hover:bg-purple-600"
            type="button"
          >
            ⏩ Skip
          </button>
          <button
            onClick={resetProgress}
            className="rounded-full border border-red-400 bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-md transition hover:bg-red-600"
            type="button"
          >
            Reset
          </button>
        </div>

        <div className="z-20 flex w-full flex-row pt-12 pl-2 md:w-44 md:flex-col md:pt-16 md:pl-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              className={`relative px-5 py-3 text-left text-sm font-black shadow-sm transition-all md:py-4 md:text-base ${
                activeTab === tab.id
                  ? "z-20 rounded-t-xl bg-gradient-to-r from-[#6ca4f4] to-[#5c85d6] text-white md:translate-x-2 md:rounded-t-none md:rounded-l-2xl md:rounded-r-md"
                  : "z-10 rounded-t-xl border border-slate-200/50 bg-[#f5f5f5] text-slate-500 hover:bg-white md:rounded-t-none md:rounded-l-2xl"
              }`}
            >
              {tab.label}
              {activeTab === tab.id ? (
                <div className="absolute -right-2 top-1/2 hidden h-10 w-4 -translate-y-1/2 rounded-r-lg bg-[#5c85d6] md:block" />
              ) : null}
            </button>
          ))}

          <button
            onClick={() => setShowAddModal(true)}
            type="button"
            className="z-10 mt-0 flex items-center justify-center whitespace-nowrap rounded-xl border border-[#ffd28a] bg-gradient-to-b from-[#ffb347] to-[#ff7b00] px-4 py-3 text-xs font-bold text-white shadow-[0_3px_0_#cc6200] transition-all active:translate-y-[2px] active:shadow-none md:mt-4 md:mr-4 md:ml-4 md:rounded-full md:py-4 md:text-sm"
          >
            <Plus className="mr-1 h-4 w-4 drop-shadow-sm md:h-5 md:w-5" />
            Custom Event
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border-4 border-white/80 bg-[#fffaf0]/96 shadow-[0_10px_30px_rgba(0,0,0,0.2)] md:rounded-3xl">
          <div className="absolute top-0 left-0 h-8 w-8 rounded-tl-2xl border-t-4 border-l-4 border-[#e2d5c3] opacity-50" />
          <div className="absolute top-0 right-0 h-8 w-8 rounded-tr-2xl border-t-4 border-r-4 border-[#e2d5c3] opacity-50" />

          <div className="flex h-full min-h-0 w-full flex-1 flex-col">
            <div className="shrink-0 border-b-2 border-[#f0e6d2] bg-gradient-to-b from-white/50 to-transparent px-6 pt-6 pb-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-[#e8d5b5] text-3xl shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
                    <BunnyGuide className="relative z-10 w-[50px] origin-bottom pb-1 drop-shadow-md" />
                  </div>
                  <div className="min-w-0 rounded-full border border-white/50 bg-white/92 px-4 py-2 shadow-md">
                    <h1 className="truncate text-base leading-tight font-black text-[#5c85d6] drop-shadow-sm">
                      {userProfile.name}
                    </h1>
                    {(() => {
                      const levelInfo = getLevelInfo(userProfile.totalExp);
                      return (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="shrink-0 text-xs font-bold text-slate-600">
                            Lvl. {levelInfo.level}
                          </span>
                          <div className="h-2.5 w-24 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full bg-green-500"
                              style={{
                                width: `${(levelInfo.currentExp / levelInfo.expToNext) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="shrink-0 text-[11px] font-bold text-green-700">
                            {levelInfo.currentExp}/{levelInfo.expToNext}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="hidden flex-1 justify-center sm:flex">
                  <span className="rounded-full border border-[#e8d5b5] bg-[#fffaf0] px-3 py-1 text-xs font-bold text-[#d4a373] shadow-sm">
                    Daily Retrieval
                  </span>
                </div>
                <div className="hidden sm:block sm:w-[120px]" />
              </div>
            </div>

            <div className="custom-scrollbar relative flex-1 overflow-y-auto bg-[#fdfbf7]/50 px-6 py-4">
              {activeTab === "event" ? (
                <div className="grid grid-cols-1 overflow-hidden rounded-lg border-t border-l border-[#e2d5c3] bg-white shadow-sm md:grid-cols-2">
                  {[...tasks]
                    .sort((left, right) => Number(isTaskDisabled(left)) - Number(isTaskDisabled(right)))
                    .map((task) => {
                      const disabled = isTaskDisabled(task);
                      const RenderIcon = ICON_MAP[task.iconName] || Star;

                      return (
                        <div
                          key={task.id}
                          className={`group relative flex min-h-[130px] flex-col justify-center overflow-hidden border-r border-b border-[#e2d5c3] p-5 transition-colors hover:bg-[#fffaf0] ${
                            disabled ? "bg-slate-50/50" : "bg-white"
                          }`}
                        >
                          <h3
                            className={`mb-3 text-[14px] font-bold tracking-tight text-slate-700 ${
                              disabled ? "opacity-60 blur-[0.5px]" : ""
                            }`}
                          >
                            {task.title}
                          </h3>

                          <div className="flex items-center">
                            <div
                              className={`relative mr-4 h-14 w-14 flex-shrink-0 ${
                                disabled ? "opacity-50 blur-[0.5px] grayscale" : ""
                              }`}
                            >
                              <div className="absolute inset-0 rotate-3 rounded-lg bg-gradient-to-br from-[#f1ede6] to-[#e6e0d4] shadow-inner" />
                              <div className="absolute inset-0 flex -rotate-1 items-center justify-center rounded-lg border border-[#e2d5c3] bg-white shadow-sm">
                                <RenderIcon className={`h-7 w-7 ${task.iconColor}`} />
                              </div>
                            </div>

                            <div
                              className={`flex flex-1 flex-col justify-center pr-2 ${
                                disabled ? "opacity-50 blur-[0.5px]" : ""
                              }`}
                            >
                              <div className="mb-1 flex items-center">
                                <Flame className="mr-1.5 h-4 w-4 text-yellow-500" />
                                <span className="text-[13px] font-black text-slate-700">
                                  {task.apReward} AP
                                </span>
                              </div>
                              <div className="mt-1 text-[12px] font-bold tracking-wide text-[#475569]">
                                {renderLimitText(task)}
                              </div>
                            </div>

                            <div
                              className={`flex items-center justify-center pl-1 ${
                                disabled ? "opacity-0" : ""
                              }`}
                            >
                              <button
                                onClick={() => handleAction(task)}
                                disabled={disabled}
                                type="button"
                                className="flex -space-x-1.5 p-1 text-[#ffb347] transition-transform hover:text-[#ff8c1a] active:scale-95"
                              >
                                <ChevronRight className="h-6 w-6" />
                                <ChevronRight className="h-6 w-6" />
                              </button>
                            </div>
                          </div>

                          {disabled ? (
                            <div className="pointer-events-none absolute top-1/2 right-4 z-10 flex -translate-y-1/2 items-center justify-center">
                              <div className="relative flex h-24 w-24 rotate-[-20deg] items-center justify-center rounded-full border-[3px] border-[#c07c50]/90 bg-white/10 shadow-sm backdrop-blur-[0.5px]">
                                <div className="absolute inset-1 rounded-full border border-[#c07c50]/70" />
                                <span className="bg-[#faf9f5]/80 px-1 text-[12px] font-black tracking-widest text-[#c07c50] uppercase drop-shadow-sm">
                                  Complete
                                </span>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                </div>
              ) : null}

              {activeTab === "calendar" ? (
                <div className="flex h-full flex-col">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center text-lg font-black text-slate-800">
                      <CalendarIcon className="mr-2 h-5 w-5 text-[#5c85d6]" />
                      Track Record Mingguan
                    </h2>
                  </div>
                  <div className="flex flex-1 flex-col overflow-hidden rounded-xl border-2 border-[#e2d5c3] bg-white shadow-sm">
                    <div className="grid grid-cols-7 divide-x divide-[#e2d5c3] border-b-2 border-[#e2d5c3] bg-[#fdfbf7] text-center text-[11px] font-black text-slate-600">
                      {dates.weekDays.map((weekDay, index) => {
                        const isToday = weekDay.logicalDay === dates.logicalDay;
                        return (
                          <div
                            key={`${weekDay.logicalDay}-${index}`}
                            className={`py-2 uppercase tracking-wide ${
                              isToday ? "bg-[#5c85d6] text-white shadow-inner" : ""
                            }`}
                          >
                            {weekDay.dayName}
                            <br />
                            <span
                              className={`text-[10px] font-bold ${
                                isToday ? "text-blue-100" : "text-slate-400"
                              }`}
                            >
                              {weekDay.shortDate}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="custom-scrollbar grid flex-1 grid-cols-7 divide-x divide-[#f1ede6] overflow-y-auto">
                      {dates.weekDays.map((weekDay, index) => {
                        const dayHistory = history.filter(
                          (entry) => entry.logicalDay === weekDay.logicalDay,
                        );
                        const isToday = weekDay.logicalDay === dates.logicalDay;

                        return (
                          <div
                            key={`${weekDay.logicalDay}-${index}-items`}
                            className={`flex min-h-[300px] flex-col gap-2 p-2 ${
                              isToday ? "bg-blue-50/30" : "bg-[#faf9f5]"
                            }`}
                          >
                            {dayHistory.length === 0 ? (
                              <div className="mt-4 text-center text-[10px] italic text-gray-400 opacity-70">
                                Belum ada data
                              </div>
                            ) : (
                              dayHistory.map((item) => (
                                <div
                                  key={item.id}
                                  className="group relative overflow-hidden rounded border border-[#e2d5c3] bg-white p-1.5 text-[10px] shadow-sm"
                                >
                                  <div className="absolute top-0 left-0 h-full w-1 bg-[#ffaa00]" />
                                  <div className="pl-1.5">
                                    <span className="block truncate font-bold text-slate-700">
                                      {item.title}
                                    </span>
                                    <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1">
                                      <span className="font-bold text-gray-400">
                                        {item.timeStr}
                                      </span>
                                      <span
                                        className={`flex items-center font-black ${
                                          item.isExp
                                            ? "text-green-600"
                                            : "text-[#ffaa00]"
                                        }`}
                                      >
                                        +{item.apReward}{" "}
                                        {item.isExp ? (
                                          "EXP"
                                        ) : (
                                          <Flame className="ml-0.5 h-2 w-2" />
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {activeTab === "event" ? renderProgressBar() : null}
          </div>
        </div>
      </div>
    </div>
  );
}
