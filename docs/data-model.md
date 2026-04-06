# Database Schema and State Model

## Recommended Stack Assumption
- Database: PostgreSQL
- Backend: Node.js API atau Next.js server actions
- Frontend state: React + Zustand atau reducer-based store

Dokumen ini mendesain model yang tetap sederhana untuk MVP, tetapi cukup kuat untuk aturan:
- multi-period targets
- multi-period caps
- undo check-in
- weekly reward progress
- reset berbasis timezone dan reset hour

## Core Concepts

### 1. Logical Time
Semua progres harus dihitung terhadap `logical day` milik user.

Contoh:
- timezone user: `Asia/Makassar`
- reset hour: `05:00`

Maka logical day berjalan dari `05:00 hari ini` sampai `04:59:59 hari berikutnya`.

Ini penting agar:
- check-in dini hari tidak salah masuk hari
- reset daily dan weekly konsisten
- cap harian benar

### 2. Period Types
Gunakan enum:
- `daily`
- `weekly`
- `monthly`
- `yearly`

## Relational Schema

### `users`
Satu user untuk MVP, tapi tetap simpan sebagai tabel agar modelnya siap berkembang.

```sql
create table users (
  id uuid primary key,
  email text unique,
  display_name text,
  timezone text not null default 'Asia/Makassar',
  reset_hour_local smallint not null default 5,
  week_starts_on smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Notes:
- `week_starts_on`: `1 = Monday`, `0 = Sunday` jika ingin fleksibel.

### `activity_categories`
Kategori sederhana untuk grouping UI.

```sql
create table activity_categories (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  color_hex text,
  icon_key text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
```

### `activities`
Definisi aktivitas utama.

```sql
create table activities (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  category_id uuid references activity_categories(id) on delete set null,
  title text not null,
  description text,
  icon_key text,
  color_hex text,
  points_per_checkin integer not null default 10,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `activity_period_rules`
Satu row per `activity_id + period_type`.

`target_count` = target progres periode itu.  
`cap_count` = batas maksimum check-in pada periode itu.

Contoh `Gym`:
- row `daily`: target `1`, cap `1`
- row `weekly`: target `5`, cap `5`

Contoh `Liburan`:
- row `weekly`: target `1`, cap `1`
- row `monthly`: target `2`, cap `2`

Kalau ingin `weekly 5` tetapi hanya boleh `1` per hari:
- buat row `daily` dengan `target_count = null`, `cap_count = 1`
- buat row `weekly` dengan `target_count = 5`, `cap_count = 5`

```sql
create type period_type as enum ('daily', 'weekly', 'monthly', 'yearly');

create table activity_period_rules (
  id uuid primary key,
  activity_id uuid not null references activities(id) on delete cascade,
  period_type period_type not null,
  target_count integer,
  cap_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activity_period_rules_target_positive
    check (target_count is null or target_count > 0),
  constraint activity_period_rules_cap_positive
    check (cap_count is null or cap_count > 0),
  constraint activity_period_rules_has_value
    check (target_count is not null or cap_count is not null),
  unique (activity_id, period_type)
);
```

### `activity_schedule_weekdays`
Opsional untuk halaman kalender.

```sql
create table activity_schedule_weekdays (
  id uuid primary key,
  activity_id uuid not null references activities(id) on delete cascade,
  weekday smallint not null,
  start_minute_local smallint,
  end_minute_local smallint,
  created_at timestamptz not null default now(),
  constraint activity_schedule_weekdays_weekday_valid
    check (weekday between 0 and 6),
  unique (activity_id, weekday)
);
```

Notes:
- `0 = Sunday`, `1 = Monday`.
- Jika activity tidak punya row schedule, frontend boleh tampilkan sebagai `any day`.

### `check_ins`
Log sumber kebenaran untuk progres.

```sql
create type checkin_status as enum ('active', 'reverted');

create table check_ins (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  activity_id uuid not null references activities(id) on delete cascade,
  quantity integer not null default 1,
  occurred_at timestamptz not null,
  logical_date date not null,
  source text not null default 'manual',
  note text,
  status checkin_status not null default 'active',
  reverted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint check_ins_quantity_positive check (quantity > 0)
);

create index check_ins_activity_occurred_idx
  on check_ins (activity_id, occurred_at desc);

create index check_ins_user_logical_date_idx
  on check_ins (user_id, logical_date desc);

create index check_ins_active_idx
  on check_ins (activity_id, status, occurred_at desc);
```

Notes:
- `logical_date` diisi saat insert untuk mempercepat query harian.
- Untuk MVP, `quantity` tetap `1`, tapi kolom ini memudahkan ekspansi.

### `reward_tracks`
Konfigurasi reward bar.

```sql
create table reward_tracks (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  period_type period_type not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

### `reward_milestones`
Milestone visual pada progress bar.

```sql
create table reward_milestones (
  id uuid primary key,
  reward_track_id uuid not null references reward_tracks(id) on delete cascade,
  threshold_points integer not null,
  label text,
  sort_order integer not null default 0,
  unique (reward_track_id, threshold_points)
);
```

Seed minimum:
- track `Weekly Progress`
- thresholds `20, 40, 60, 80, 100`

## Minimal Query Strategy

### Query 1: Active activities for Today / Event
Load:
- active `activities`
- their `activity_period_rules`
- latest `check_ins` for current windows
- category metadata

### Query 2: Progress by period
Untuk tiap activity:
- count active check-ins in current daily window
- count active check-ins in current weekly window
- count active check-ins in current monthly window
- count active check-ins in current yearly window

### Query 3: Weekly reward points
Sum:
- `activities.points_per_checkin * active_checkin_count`
untuk semua check-in pada reward track period aktif.

## Example Data Model

### Example: `Gym`
```json
{
  "activity": {
    "title": "Gym",
    "points_per_checkin": 15
  },
  "rules": [
    { "periodType": "daily", "targetCount": 1, "capCount": 1 },
    { "periodType": "weekly", "targetCount": 5, "capCount": 5 }
  ],
  "scheduleWeekdays": [1, 2, 3, 4, 5]
}
```

### Example: `Cek Lab`
```json
{
  "activity": {
    "title": "Cek Lab",
    "points_per_checkin": 30
  },
  "rules": [
    { "periodType": "monthly", "targetCount": 1, "capCount": 1 },
    { "periodType": "yearly", "targetCount": 2, "capCount": 2 }
  ]
}
```

## Derived Domain Objects
Backend atau frontend sebaiknya menghasilkan objek turunan seperti ini untuk UI:

```ts
type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

type ActivityProgress = {
  activityId: string;
  title: string;
  categoryName: string | null;
  pointsPerCheckin: number;
  status: 'not_started' | 'in_progress' | 'complete' | 'capped_today';
  rules: Array<{
    periodType: PeriodType;
    targetCount: number | null;
    capCount: number | null;
    currentCount: number;
    isComplete: boolean;
    isCapped: boolean;
  }>;
  canCheckIn: boolean;
  lastCheckInAt: string | null;
};
```

## Frontend State Model

### Store Shape
```ts
type AppState = {
  profile: {
    userId: string;
    timezone: string;
    resetHourLocal: number;
    weekStartsOn: number;
  };
  activities: Record<string, ActivityEntity>;
  categories: Record<string, CategoryEntity>;
  periodRulesByActivity: Record<string, PeriodRuleEntity[]>;
  schedulesByActivity: Record<string, ScheduleWeekdayEntity[]>;
  checkInsById: Record<string, CheckInEntity>;
  rewardTrack: RewardTrackEntity | null;
  rewardMilestones: RewardMilestoneEntity[];
  ui: {
    currentTab: 'event' | 'calendar' | 'manage';
    selectedWeekStart: string;
    isSubmittingCheckIn: boolean;
    optimisticCheckInIds: string[];
  };
};
```

### Normalized Entities
```ts
type ActivityEntity = {
  id: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  iconKey: string | null;
  colorHex: string | null;
  pointsPerCheckin: number;
  isActive: boolean;
  sortOrder: number;
};

type PeriodRuleEntity = {
  id: string;
  activityId: string;
  periodType: PeriodType;
  targetCount: number | null;
  capCount: number | null;
};

type CheckInEntity = {
  id: string;
  activityId: string;
  occurredAt: string;
  logicalDate: string;
  status: 'active' | 'reverted';
};
```

## Required Selectors
Selector ini harus ada karena hampir semua UI bergantung padanya.

### `getCurrentWindows(profile, now)`
Output:
- `dailyStart`, `dailyEnd`
- `weeklyStart`, `weeklyEnd`
- `monthlyStart`, `monthlyEnd`
- `yearlyStart`, `yearlyEnd`

### `getActivityCounts(activityId, checkIns, windows)`
Hitung jumlah check-in aktif per period untuk satu activity.

### `getActivityStatus(activity, rules, counts)`
Prioritas status:
1. `capped_today` jika daily cap tercapai dan ada target periode besar yang belum selesai
2. `complete` jika target harian atau semua target relevan tercapai
3. `in_progress` jika sudah ada count
4. `not_started`

### `canCheckIn(activityId, counts, rules)`
Return `false` jika salah satu cap aktif pada current window sudah penuh.

### `getWeeklyRewardProgress(checkIns, activities, rewardTrack, windows)`
Return:
- current points
- next milestone
- completed milestones

### `getCalendarWeekActivities(activities, schedules, selectedWeekStart)`
Mapping activity ke 7 kolom hari.

## Suggested Event Flow

### Create Activity
1. Submit form
2. Insert `activities`
3. Insert `activity_period_rules`
4. Insert optional `activity_schedule_weekdays`
5. Refresh store

### Check In
1. Frontend panggil `canCheckIn`
2. Backend validasi ulang dengan query current window
3. Insert `check_ins`
4. Recompute derived counts
5. Update reward progress

### Undo Last Check-In
1. Cari check-in `active` terakhir untuk activity pada current logical day
2. Update `status = reverted`
3. Set `reverted_at = now()`
4. Recompute counts

## Backend Validation Rules
- User hanya boleh check-in untuk activity miliknya sendiri.
- `reverted` check-in tidak ikut dihitung.
- Semua cap harus divalidasi di server, bukan hanya frontend.
- `logical_date` harus dihitung di server berdasarkan timezone user.
- Activity archived tidak bisa menerima check-in baru.

## Suggested API Surface
Jika memakai REST:

```txt
GET    /api/dashboard
POST   /api/activities
PATCH  /api/activities/:id
POST   /api/activities/:id/check-ins
POST   /api/check-ins/:id/revert
GET    /api/calendar?weekStart=YYYY-MM-DD
```

`GET /api/dashboard` idealnya mengembalikan:
- profile
- categories
- activities
- period rules
- today progress summary
- weekly reward progress

## Implementation Notes
- Source of truth progres adalah `check_ins`, bukan counter yang disimpan.
- Counter UI sebaiknya derived, bukan persisted.
- Kalau performa nanti jadi isu, tambahkan materialized summary per activity per period. Jangan lakukan itu di MVP.
