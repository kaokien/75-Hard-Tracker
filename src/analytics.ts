// ─── 75 Hard Analytics Instrumentation ───
// Console-based event tracking. Swap transport for production.

interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

const IS_DEV = import.meta.env?.DEV ?? true;

/** Core track function — logs to console in dev, extensible for production */
function track(eventName: string, properties?: EventProperties): void {
  if (IS_DEV) {
    console.log(`%c[Analytics] ${eventName}`, 'color: #bf5af2; font-weight: bold;', properties || '');
  }
  // Production: send to Mixpanel/Amplitude/PostHog
  // window.posthog?.capture(eventName, properties);
}

// ─── Onboarding Events ───

export const analytics = {
  onboardingStarted: () =>
    track('onboarding_started', { timestamp: Date.now() }),

  onboardingScreenViewed: (screenNumber: number, screenName: string) =>
    track('onboarding_screen_viewed', { screen_number: screenNumber, screen_name: screenName }),

  commitmentSigned: (nameLength: number) =>
    track('commitment_signed', { name_length: nameLength, timestamp: Date.now() }),

  profileCreated: (waterGoal: number, startDateOffset: number) =>
    track('profile_created', { water_goal: waterGoal, start_date_offset: startDateOffset }),

  whySelected: (category: string, isCustom: boolean) =>
    track('why_selected', { why_category: category, is_custom: isCustom }),

  onboardingCompleted: (totalTimeMs: number) =>
    track('onboarding_completed', { total_time_ms: totalTimeMs }),

  // ─── Task Events ───

  taskCompleted: (taskType: string, dayNumber: number, streak: number, xpEarned: number) =>
    track('task_completed', { task_type: taskType, day_number: dayNumber, streak, xp_earned: xpEarned, time_of_day: new Date().getHours() }),

  taskUncompleted: (taskType: string, dayNumber: number) =>
    track('task_uncompleted', { task_type: taskType, day_number: dayNumber }),

  perfectDayAchieved: (dayNumber: number, streak: number, totalXp: number) =>
    track('perfect_day_achieved', { day_number: dayNumber, streak, total_xp: totalXp }),

  // ─── XP & Progression ───

  xpEarned: (amount: number, source: string, streakMult: number, newTotal: number) =>
    track('xp_earned', { amount, source, streak_mult: streakMult, new_total: newTotal }),

  levelUp: (oldLevel: number, newLevel: number, totalXp: number, dayNumber: number) =>
    track('level_up', { old_level: oldLevel, new_level: newLevel, total_xp: totalXp, day_number: dayNumber }),

  // ─── Streak Events ───

  streakBroken: (oldStreak: number, tasksCompleted: number, dayNumber: number) =>
    track('streak_broken', { old_streak: oldStreak, tasks_completed: tasksCompleted, day_number: dayNumber }),

  streakFreezeUsed: (streakPreserved: number, freezesRemaining: number) =>
    track('streak_freeze_used', { streak_preserved: streakPreserved, freezes_remaining: freezesRemaining }),

  // ─── Quest Events ───

  questCompleted: (questId: string, questName: string, dayNumber: number) =>
    track('quest_completed', { quest_id: questId, quest_name: questName, day_number: dayNumber }),

  questChainCompleted: (dayNumber: number) =>
    track('quest_chain_completed', { day_number: dayNumber }),

  // ─── Comeback Events ───

  comebackQuestStarted: (daysMissed: number, comebackType: string) =>
    track('comeback_quest_started', { days_missed: daysMissed, comeback_type: comebackType }),

  comebackQuestCompleted: (daysMissed: number, comebackType: string, xpEarned: number) =>
    track('comeback_quest_completed', { days_missed: daysMissed, comeback_type: comebackType, xp_earned: xpEarned }),

  // ─── Badge Events ───

  badgeUnlocked: (badgeName: string, badgeDay: number, totalBadges: number) =>
    track('badge_unlocked', { badge_name: badgeName, badge_day: badgeDay, total_badges: totalBadges }),

  // ─── Session Events ───

  sessionStarted: (dayNumber: number, streak: number, level: number, lastSessionGapHours: number) =>
    track('session_started', { day_number: dayNumber, streak, level, last_session_gap_hours: lastSessionGapHours }),

  sessionEnded: (durationMs: number, tasksCompleted: number) =>
    track('session_ended', { duration_ms: durationMs, tasks_completed: tasksCompleted }),

  // ─── Settings & Data ───

  drawerOpened: (section: string, dayNumber: number) =>
    track('drawer_opened', { section, day_number: dayNumber }),

  settingsChanged: (settingName: string, oldValue: string, newValue: string) =>
    track('settings_changed', { setting_name: settingName, old_value: oldValue, new_value: newValue }),

  dataExported: (totalDays: number, totalAttempts: number) =>
    track('data_exported', { total_days: totalDays, total_attempts: totalAttempts }),

  dataWiped: (totalDaysLost: number) =>
    track('data_wiped', { total_days_lost: totalDaysLost }),

  attemptFailed: (dayNumber: number, reasonLength: number, streakAtFail: number) =>
    track('attempt_failed', { day_number: dayNumber, reason_length: reasonLength, streak_at_fail: streakAtFail }),

  attemptRestarted: (previousMaxDay: number, totalAttempts: number, xpPreserved: number) =>
    track('attempt_restarted', { previous_max_day: previousMaxDay, total_attempts: totalAttempts, xp_preserved: xpPreserved }),

  track: (eventName: string, properties?: EventProperties) =>
    track(eventName, properties),
};
