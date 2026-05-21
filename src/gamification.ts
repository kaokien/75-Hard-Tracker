// ─── 75 Hard Gamification Engine ───
// XP economy, levels, streaks, multipliers, comebacks, quests, badges

// ─── Constants ───

export const LEVELS = [
  { level: 1,  title: 'Recruit',    xpRequired: 0,     cumulativeXp: 0,     unlock: 'Basic dashboard' },
  { level: 2,  title: 'Initiate',   xpRequired: 200,   cumulativeXp: 200,   unlock: 'Streak counter' },
  { level: 3,  title: 'Contender',  xpRequired: 350,   cumulativeXp: 550,   unlock: 'Weekly trend chart' },
  { level: 4,  title: 'Warrior',    xpRequired: 500,   cumulativeXp: 1050,  unlock: 'Journal feature' },
  { level: 5,  title: 'Gladiator',  xpRequired: 700,   cumulativeXp: 1750,  unlock: 'Photo comparison' },
  { level: 6,  title: 'Spartan',    xpRequired: 1000,  cumulativeXp: 2750,  unlock: 'Theme accent picker' },
  { level: 7,  title: 'Champion',   xpRequired: 1500,  cumulativeXp: 4250,  unlock: 'Export/Import backup' },
  { level: 8,  title: 'Titan',      xpRequired: 2000,  cumulativeXp: 6250,  unlock: 'Extra streak freeze' },
  { level: 9,  title: 'Legend',     xpRequired: 3000,  cumulativeXp: 9250,  unlock: 'Custom layout' },
  { level: 10, title: 'Immortal',   xpRequired: 5000,  cumulativeXp: 14250, unlock: 'Gold flame + title' },
] as const;

export const TASK_XP: Record<string, number> = {
  workout1: 15,
  workout2: 15,
  steps10k: 10,
  water: 10,
  diet: 10,
  sleep: 10,
  reading: 10,
  photo: 10,
  journal: 10,
};

export const MEDITATION_XP: Record<string, number> = {
  len2: 10,
  len5: 20,
  len10: 35,
  len15: 50,
  len20: 70,
};

export const BONUS_XP = {
  perfectDay: 100,
  weeklyStreak: 250,
  commitmentPledge: 50,
  chooseYourWhy: 25,
  firstTaskEver: 25,
  starterQuestChain: 100,
  milestoneBadge: 200,
  bounceBackQuest: 75,
  phoenixBadge: 150,
  returnWarrior: 75,
  meditationComeback: 50,
} as const;

export const MILESTONE_BADGES = [
  { id: 'genesis',   day: 1,  title: 'Genesis',  label: 'Day 1' },
  { id: 'vanguard',  day: 15, title: 'Vanguard', label: 'Day 15' },
  { id: 'iron_will', day: 30, title: 'Iron Will', label: 'Day 30' },
  { id: 'elite',     day: 45, title: 'Elite',     label: 'Day 45' },
  { id: 'titan',     day: 60, title: 'Titan',     label: 'Day 60' },
  { id: 'immortal',  day: 75, title: 'Immortal',  label: 'Day 75' },
] as const;

export const SPECIAL_BADGES = [
  { id: 'ignition', title: 'Ignition', label: 'Starter Quest Chain' },
  { id: 'phoenix',  title: 'Phoenix',  label: 'Comeback Achievement' },
] as const;

// ─── Types ───

export interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  streakMult: number;
  streakFreezes: number;
  why: string;
  pledge: string;
  onboardingComplete: boolean;
  starterQuest: StarterQuestState;
  comebackState: ComebackState;
  badgesEarned: string[];
  notificationPref: NotificationPref;
  lastSession: string;
  frozenDays: number[];
  firstTaskDone: boolean;
  meditationStreak: number;
  lastMeditationDate: string;
  requireMeditationForPerfectDay: boolean;
}

export interface StarterQuestState {
  q1_firstTask: boolean;
  q2_threeTasks: boolean;
  q3_perfectDay: boolean;
  q4_journal: boolean;
  q5_photo: boolean;
  chainComplete: boolean;
}

export interface ComebackState {
  type: 'bounce_back' | 'redemption_arc' | 'return_warrior' | 'fresh_chapter' | null;
  daysMissed: number;
  progress: number; // 0-3 depending on type
  active: boolean;
}

export interface NotificationPref {
  enabled: boolean;
  time: string; // "HH:MM"
}

export interface XPEvent {
  amount: number;
  source: string;
  multiplied: boolean;
}

export interface LevelUpEvent {
  oldLevel: number;
  newLevel: number;
  title: string;
  unlock: string;
}

// ─── State Management (localStorage) ───

const STORAGE_KEYS = {
  xp: '75hard_user_xp',
  level: '75hard_user_level',
  streak: '75hard_user_streak',
  longestStreak: '75hard_user_longest_streak',
  streakMult: '75hard_user_streak_mult',
  streakFreezes: '75hard_user_streak_freezes',
  why: '75hard_user_why',
  pledge: '75hard_user_pledge',
  onboardingComplete: '75hard_onboarding_complete',
  starterQuest: '75hard_starter_quest',
  comebackState: '75hard_comeback_state',
  badgesEarned: '75hard_badges_earned',
  notificationPref: '75hard_notification_pref',
  lastSession: '75hard_last_session',
  frozenDays: '75hard_frozen_days',
  firstTaskDone: '75hard_first_task_done',
  meditationStreak: '75hard_user_meditation_streak',
  lastMeditationDate: '75hard_user_last_meditation_date',
  requireMeditationForPerfectDay: '75hard_user_require_meditation_perfect_day',
} as const;

function getJSON<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function setJSON(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadGamificationState(): GamificationState {
  return {
    xp: parseInt(localStorage.getItem(STORAGE_KEYS.xp) || '0'),
    level: parseInt(localStorage.getItem(STORAGE_KEYS.level) || '1'),
    streak: parseInt(localStorage.getItem(STORAGE_KEYS.streak) || '0'),
    longestStreak: parseInt(localStorage.getItem(STORAGE_KEYS.longestStreak) || '0'),
    streakMult: parseFloat(localStorage.getItem(STORAGE_KEYS.streakMult) || '1.0'),
    streakFreezes: parseInt(localStorage.getItem(STORAGE_KEYS.streakFreezes) || '0'),
    why: localStorage.getItem(STORAGE_KEYS.why) || '',
    pledge: localStorage.getItem(STORAGE_KEYS.pledge) || '',
    onboardingComplete: localStorage.getItem(STORAGE_KEYS.onboardingComplete) === 'true',
    starterQuest: getJSON<StarterQuestState>(STORAGE_KEYS.starterQuest, {
      q1_firstTask: false, q2_threeTasks: false, q3_perfectDay: false,
      q4_journal: false, q5_photo: false, chainComplete: false,
    }),
    comebackState: getJSON<ComebackState>(STORAGE_KEYS.comebackState, {
      type: null, daysMissed: 0, progress: 0, active: false,
    }),
    badgesEarned: getJSON<string[]>(STORAGE_KEYS.badgesEarned, []),
    notificationPref: getJSON<NotificationPref>(STORAGE_KEYS.notificationPref, {
      enabled: false, time: '08:00',
    }),
    lastSession: localStorage.getItem(STORAGE_KEYS.lastSession) || '',
    frozenDays: getJSON<number[]>(STORAGE_KEYS.frozenDays, []),
    firstTaskDone: localStorage.getItem(STORAGE_KEYS.firstTaskDone) === 'true',
    meditationStreak: parseInt(localStorage.getItem(STORAGE_KEYS.meditationStreak) || '0'),
    lastMeditationDate: localStorage.getItem(STORAGE_KEYS.lastMeditationDate) || '',
    requireMeditationForPerfectDay: localStorage.getItem(STORAGE_KEYS.requireMeditationForPerfectDay) === 'true',
  };
}

export function saveGamificationState(state: GamificationState): void {
  localStorage.setItem(STORAGE_KEYS.xp, String(state.xp));
  localStorage.setItem(STORAGE_KEYS.level, String(state.level));
  localStorage.setItem(STORAGE_KEYS.streak, String(state.streak));
  localStorage.setItem(STORAGE_KEYS.longestStreak, String(state.longestStreak));
  localStorage.setItem(STORAGE_KEYS.streakMult, String(state.streakMult));
  localStorage.setItem(STORAGE_KEYS.streakFreezes, String(state.streakFreezes));
  localStorage.setItem(STORAGE_KEYS.why, state.why);
  localStorage.setItem(STORAGE_KEYS.pledge, state.pledge);
  localStorage.setItem(STORAGE_KEYS.onboardingComplete, String(state.onboardingComplete));
  setJSON(STORAGE_KEYS.starterQuest, state.starterQuest);
  setJSON(STORAGE_KEYS.comebackState, state.comebackState);
  setJSON(STORAGE_KEYS.badgesEarned, state.badgesEarned);
  setJSON(STORAGE_KEYS.notificationPref, state.notificationPref);
  localStorage.setItem(STORAGE_KEYS.lastSession, state.lastSession);
  setJSON(STORAGE_KEYS.frozenDays, state.frozenDays);
  localStorage.setItem(STORAGE_KEYS.firstTaskDone, String(state.firstTaskDone));
  localStorage.setItem(STORAGE_KEYS.meditationStreak, String(state.meditationStreak || 0));
  localStorage.setItem(STORAGE_KEYS.lastMeditationDate, state.lastMeditationDate || '');
  localStorage.setItem(STORAGE_KEYS.requireMeditationForPerfectDay, String(state.requireMeditationForPerfectDay || false));
}

// ─── XP Calculation Engine ───

/** Calculate streak multiplier: min(4.0, 1.0 + streak × 0.1) */
export function calcStreakMultiplier(streak: number): number {
  return Math.min(4.0, 1.0 + streak * 0.1);
}

/** Award XP for a task completion. Returns XP event with multiplied amount. */
export function calcTaskXP(taskKey: string, streakMult: number): XPEvent {
  const base = TASK_XP[taskKey] || 0;
  const amount = Math.round(base * streakMult);
  return { amount, source: taskKey, multiplied: streakMult > 1.0 };
}

/** Award Perfect Day bonus */
export function calcPerfectDayXP(streakMult: number): XPEvent {
  const amount = Math.round(BONUS_XP.perfectDay * streakMult);
  return { amount, source: 'perfect_day', multiplied: streakMult > 1.0 };
}

/** Calculate meditation streak multiplier: 1.0 + min(1.0, streak * 0.1) */
export function calcMeditationMultiplier(consecutiveDays: number): number {
  return 1.0 + Math.min(1.0, (consecutiveDays || 0) * 0.1);
}

/** Award XP for meditation. Returns XP event. */
export function calcMeditationXP(lengthKey: string, overallMult: number, medStreak: number, isComeback: boolean): XPEvent {
  const base = MEDITATION_XP[lengthKey] || 10;
  const medMult = calcMeditationMultiplier(medStreak);
  let amount = Math.round(base * overallMult * medMult);

  if (isComeback) {
    amount += BONUS_XP.meditationComeback;
  }

  return {
    amount,
    source: `meditation_${lengthKey}`,
    multiplied: overallMult > 1.0 || medMult > 1.0,
  };
}

/** Determine level from total XP */
export function getLevelFromXP(totalXP: number): { level: number; title: string; xpRequired: number; cumulativeXp: number; unlock: string } {
  let result: typeof LEVELS[number] = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalXP >= lvl.cumulativeXp) {
      result = lvl;
    } else {
      break;
    }
  }
  return result;
}

/** Get XP progress within current level */
export function getLevelProgress(totalXP: number): { current: number; max: number; percent: number } {
  const currentLevel = getLevelFromXP(totalXP);
  const levelIndex = LEVELS.findIndex(l => l.level === currentLevel.level);
  const nextLevel = LEVELS[levelIndex + 1];

  if (!nextLevel) {
    return { current: totalXP - currentLevel.cumulativeXp, max: currentLevel.xpRequired, percent: 100 };
  }

  const currentInLevel = totalXP - currentLevel.cumulativeXp;
  const maxInLevel = nextLevel.cumulativeXp - currentLevel.cumulativeXp;
  return {
    current: currentInLevel,
    max: maxInLevel,
    percent: Math.min(100, Math.round((currentInLevel / maxInLevel) * 100)),
  };
}

/** Award XP and check for level-up. Mutates state. Returns level-up event if triggered. */
export function awardXP(state: GamificationState, amount: number, _source: string): LevelUpEvent | null {
  const oldLevel = getLevelFromXP(state.xp);
  state.xp += amount;
  const newLevel = getLevelFromXP(state.xp);

  if (newLevel.level > oldLevel.level) {
    state.level = newLevel.level;
    return {
      oldLevel: oldLevel.level,
      newLevel: newLevel.level,
      title: newLevel.title,
      unlock: newLevel.unlock,
    };
  }
  state.level = newLevel.level;
  return null;
}

// ─── Streak Engine ───

/** Update streak after a perfect day. Mutates state. */
export function incrementStreak(state: GamificationState): void {
  state.streak += 1;
  state.streakMult = calcStreakMultiplier(state.streak);
  if (state.streak > state.longestStreak) {
    state.longestStreak = state.streak;
  }
  // Earn streak freeze every 7 days
  if (state.streak > 0 && state.streak % 7 === 0) {
    state.streakFreezes = Math.min(3, state.streakFreezes + 1);
  }
}

/** Break streak after an incomplete day. Mutates state. Returns old streak. */
export function breakStreak(state: GamificationState): number {
  const oldStreak = state.streak;
  state.streak = 0;
  state.streakMult = 1.0;
  return oldStreak;
}

/** Use a streak freeze. Returns true if successful. */
export function useStreakFreeze(state: GamificationState, dayNumber: number): boolean {
  if (state.streakFreezes <= 0) return false;
  state.streakFreezes -= 1;
  state.frozenDays.push(dayNumber);
  return true;
}

// ─── Comeback Mechanics ───

/** Determine comeback type based on days missed */
export function determineComeback(daysMissed: number): ComebackState {
  if (daysMissed <= 0) return { type: null, daysMissed: 0, progress: 0, active: false };
  if (daysMissed === 1) return { type: 'bounce_back', daysMissed, progress: 0, active: true };
  if (daysMissed <= 3) return { type: 'redemption_arc', daysMissed, progress: 0, active: true };
  if (daysMissed <= 7) return { type: 'return_warrior', daysMissed, progress: 0, active: true };
  return { type: 'fresh_chapter', daysMissed, progress: 0, active: true };
}

/** Get comeback quest info */
export function getComebackInfo(comeback: ComebackState): {
  title: string;
  description: string;
  tasks: string[];
  xpReward: number;
  badge: string | null;
} {
  switch (comeback.type) {
    case 'bounce_back':
      return {
        title: 'Bounce Back',
        description: 'Complete 6/8 tasks today to recover your momentum.',
        tasks: ['Complete 6 or more tasks today'],
        xpReward: BONUS_XP.bounceBackQuest,
        badge: null,
      };
    case 'redemption_arc':
      return {
        title: 'Redemption Arc',
        description: 'Three steps back to greatness.',
        tasks: ['Log any 1 task', 'Complete 4 tasks in a day', 'Achieve a Perfect Day'],
        xpReward: BONUS_XP.phoenixBadge,
        badge: 'phoenix',
      };
    case 'return_warrior':
      return {
        title: 'Return of the Warrior',
        description: 'Start small. Complete 3 tasks today.',
        tasks: ['Complete 3 tasks today'],
        xpReward: BONUS_XP.returnWarrior,
        badge: null,
      };
    case 'fresh_chapter':
      return {
        title: 'Fresh Chapter',
        description: 'Your XP and level are yours forever. Only the streak resets.',
        tasks: ['Complete any 1 task to begin again'],
        xpReward: BONUS_XP.firstTaskEver,
        badge: null,
      };
    default:
      return { title: '', description: '', tasks: [], xpReward: 0, badge: null };
  }
}

// ─── Starter Quest Engine ───

export interface QuestCheckResult {
  questId: string;
  questName: string;
  justCompleted: boolean;
  xpReward: number;
}

/** Check starter quest progress based on current day state. Returns newly completed quests. */
export function checkStarterQuests(
  state: GamificationState,
  tasksCompletedCount: number,
  isPerfectDay: boolean,
  hasJournal: boolean,
  hasPhoto: boolean,
): QuestCheckResult[] {
  const results: QuestCheckResult[] = [];
  const sq = state.starterQuest;
  if (sq.chainComplete) return results;

  // Q1: First task ever
  if (!sq.q1_firstTask && tasksCompletedCount >= 1) {
    sq.q1_firstTask = true;
    results.push({ questId: 'q1', questName: 'First Blood', justCompleted: true, xpReward: BONUS_XP.firstTaskEver });
  }

  // Q2: 3 tasks
  if (!sq.q2_threeTasks && tasksCompletedCount >= 3) {
    sq.q2_threeTasks = true;
    results.push({ questId: 'q2', questName: 'Building Momentum', justCompleted: true, xpReward: 50 });
  }

  // Q3: Perfect day
  if (!sq.q3_perfectDay && isPerfectDay) {
    sq.q3_perfectDay = true;
    results.push({ questId: 'q3', questName: 'The Full Eight', justCompleted: true, xpReward: 200 });
  }

  // Q4: Journal
  if (!sq.q4_journal && hasJournal) {
    sq.q4_journal = true;
    results.push({ questId: 'q4', questName: 'Reflect & Record', justCompleted: true, xpReward: 25 });
  }

  // Q5: Photo
  if (!sq.q5_photo && hasPhoto) {
    sq.q5_photo = true;
    results.push({ questId: 'q5', questName: 'Visual Proof', justCompleted: true, xpReward: 25 });
  }

  // Chain complete check
  if (sq.q1_firstTask && sq.q2_threeTasks && sq.q3_perfectDay && sq.q4_journal && sq.q5_photo && !sq.chainComplete) {
    sq.chainComplete = true;
    results.push({ questId: 'chain', questName: 'Ignition Protocol Complete', justCompleted: true, xpReward: BONUS_XP.starterQuestChain });
    if (!state.badgesEarned.includes('ignition')) {
      state.badgesEarned.push('ignition');
    }
  }

  return results;
}

/** Count completed quests */
export function countCompletedQuests(sq: StarterQuestState): number {
  return [sq.q1_firstTask, sq.q2_threeTasks, sq.q3_perfectDay, sq.q4_journal, sq.q5_photo].filter(Boolean).length;
}

// ─── Badge Engine ───

/** Check if a milestone badge should be unlocked. Returns badge id if newly earned. */
export function checkMilestoneBadge(
  state: GamificationState,
  dayNumber: number,
  dayCompleted: boolean,
): string | null {
  const badge = MILESTONE_BADGES.find(b => b.day === dayNumber);
  if (!badge || !dayCompleted) return null;
  if (state.badgesEarned.includes(badge.id)) return null;
  state.badgesEarned.push(badge.id);
  return badge.id;
}

// ─── Microcopy ───

export const MICROCOPY = {
  empty: {
    dashboard: { title: 'Start Your Chronicle', body: '75 days of discipline. 8 daily tasks. Zero excuses. Your future self will thank you.' },
    grid: { title: 'Your Grid Is Ready', body: '75 cells. Each one is a day you chose hard over easy. Light up your first one today.' },
    chronicle: { title: 'Nothing Written Yet', body: 'Your story starts with Day 1. Every workout, every page, every glass of water — it all gets recorded here.' },
    history: { title: 'First Timer', body: 'No past attempts. This is your debut. Make it count.' },
    journal: { title: 'Capture Today', body: 'How are you feeling? What did you learn? Even one sentence is worth writing.' },
    photo: { title: 'No Photo Yet', body: 'Your future self wants to see this moment. Take 3 seconds.' },
    streakBroken: { title: 'Streak Reset', body: "The counter resets, but you don't. Every day you showed up still counts. Go again." },
  },
  success: {
    perfectDay: (day: number, xp: number, streak: number) =>
      `PERFECT DAY ${day}! +${xp} XP earned. ${streak}-day streak and counting.`,
    streak7: '🔥 7 DAYS STRONG. Streak multiplier: 1.7×. You\'re officially in the groove.',
    streak14: '🔥 TWO WEEKS. Most people quit by now. You didn\'t. Multiplier: 2.4×',
    streak30: '🔥 THIRTY. ONE MONTH. You\'ve silenced every doubt. Multiplier: 4.0× (MAX)',
    levelUp: (level: number, title: string, unlock: string, xpToNext: number) =>
      `LEVEL ${level}: ${title}. Unlocked: ${unlock}. ${xpToNext} XP to next level.`,
    badgeUnlock: (name: string, day: number) =>
      `🎖️ ${name.toUpperCase()} EARNED. Day ${day} milestone achieved. Only forward from here.`,
    day75: '🏆 IMMORTAL. 75 consecutive days. 600 tasks. Zero compromises. You are in the 8%.',
    waterGoal: (goal: number) => `💧 Hydrated. ${goal}ml down. Your body thanks you.`,
    bounceBack: 'PHOENIX RISING. You came back stronger. +150 XP and a badge nobody else has.',
  },
  missed: {
    zeroTasks: "Today was quiet. Tomorrow doesn't have to be. Your tasks reset at midnight.",
    partial: (x: number) => `You showed up for ${x} tasks today. That's ${x} more than zero. Tomorrow, aim for 8.`,
    streakBrokenShort: (old: number) =>
      `Streak paused at ${old}. No sweat — Bounce Back quest unlocked. Do 6/8 tomorrow to soften the reset.`,
    streakBrokenLong: (old: number, xp: number) =>
      `That ${old}-day streak was real. Your ${xp} XP is permanent. The multiplier resets, but your level doesn't. Let's rebuild.`,
    afternoon: 'Quick check-in: nothing logged yet. Start with the easiest one. Momentum builds.',
    waterBehind: (remaining: number) => {
      const cups = Math.ceil(remaining / 250);
      return `You're ${remaining}ml short. That's roughly ${cups} cups. Small sips add up.`;
    },
  },
  restart: {
    voluntary: (xp: number, level: number) =>
      `Restarting isn't failure. It's choosing to try again. Your XP (${xp}) and Level (${level}) carry forward. Only the day counter resets.`,
    returnWeek: (name: string, xp: number, level: number) =>
      `Welcome back, ${name}. We kept your spot. ${xp} XP, Level ${level}. Ready to write the next chapter?`,
    returnMonth: 'Hey. It\'s been a while. No judgment. Your progress is still here. One task today — that\'s all. Let\'s go.',
    multipleAttempts: (n: number) =>
      `Attempt #${n}. You know what? Edison took 1,000 attempts. You're building resilience with every restart.`,
  },
} as const;

// ─── Streak Message Helper ───

export function getStreakMilestoneMessage(streak: number): string | null {
  if (streak === 7) return MICROCOPY.success.streak7;
  if (streak === 14) return MICROCOPY.success.streak14;
  if (streak === 30) return MICROCOPY.success.streak30;
  return null;
}
