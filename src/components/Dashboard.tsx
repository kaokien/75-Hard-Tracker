import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dumbbell, 
  Droplet, 
  Utensils, 
  BookOpen, 
  Camera, 
  PenTool, 
  Check, 
  Flame, 
  Award,
  AlertTriangle,
  Moon,
  Footprints,
  ChevronRight,
  Sparkles,
  Lock,
  X,
  Wind
} from 'lucide-react';
import type { DayLog } from '../db';
import {
  saveGamificationState,
  calcTaskXP, calcPerfectDayXP, awardXP,
  incrementStreak, checkStarterQuests, checkMilestoneBadge,
  getStreakMilestoneMessage, MILESTONE_BADGES, BONUS_XP,
  type GamificationState, type LevelUpEvent,
} from '../gamification';
import { analytics } from '../analytics';
import { XPBar } from './XPBar';
import { XPPill, XPToast, PerfectDayCelebration, LevelUpOverlay, BadgeUnlock } from './Celebration';
import { StarterQuestFAB } from './StarterQuest';
import { MeditationContainer } from './Meditation/MeditationContainer';

interface DashboardProps {
  dayLog: DayLog | null;
  onSaveDayLog: (log: DayLog) => void;
  onFailAttempt: (dayNumber: number, reason: string) => void;
  userName: string;
  activeTabSetter: (view: 'today' | 'progress' | 'plan' | 'insights' | 'profile') => void;
  logs: DayLog[];
  gamification: GamificationState;
  onGamificationUpdate: (gs: GamificationState) => void;
  attemptId: string;
}

type LogSection = 'workout1' | 'workout2' | 'water' | 'diet' | 'reading' | 'journal' | 'photo' | 'fail' | 'meditation';

export const Dashboard: React.FC<DashboardProps> = ({
  dayLog,
  onSaveDayLog,
  onFailAttempt,
  userName,
  activeTabSetter,
  logs,
  gamification,
  onGamificationUpdate,
  attemptId,
}) => {
  // Active logging section in bottom sheet drawer
  const [activeDrawerSection, setActiveDrawerSection] = useState<LogSection | null>(null);

  // ─── Gamification celebration state ───
  const [xpPill, setXpPill] = useState<{ amount: number; source: string; visible: boolean }>({ amount: 0, source: '', visible: false });
  const [xpToast, setXpToast] = useState<{ message: string; xp: number; visible: boolean }>({ message: '', xp: 0, visible: false });
  const [levelUpEvent, setLevelUpEvent] = useState<LevelUpEvent | null>(null);
  const [perfectDayCelebration, setPerfectDayCelebration] = useState<{ visible: boolean; xp: number }>({ visible: false, xp: 0 });
  const [badgeUnlock, setBadgeUnlock] = useState<{ title: string; day: number; visible: boolean }>({ title: '', day: 0, visible: false });
  const [prevCompleted, setPrevCompleted] = useState<Record<string, boolean>>({});

  // Local state reflecting DB model
  const [workout1, setWorkout1] = useState(dayLog?.workout1 ?? false);
  const [workout1Desc, setWorkout1Desc] = useState(dayLog?.workout1Desc ?? '');
  const [workout2, setWorkout2] = useState(dayLog?.workout2 ?? false);
  const [workout2Desc, setWorkout2Desc] = useState(dayLog?.workout2Desc ?? '');
  const [water, setWater] = useState(dayLog?.water ?? 0);
  const [diet, setDiet] = useState(dayLog?.diet ?? false);
  const [dietDesc, setDietDesc] = useState(dayLog?.dietDesc ?? '');
  const [reading, setReading] = useState(dayLog?.reading ?? false);
  const [readingBook, setReadingBook] = useState(dayLog?.readingBook ?? '');
  const [readingPages, setReadingPages] = useState(dayLog?.readingPages ?? 0);
  const [photo, setPhoto] = useState<string | null>(dayLog?.photo ?? null);
  const [journal, setJournal] = useState(dayLog?.journal ?? '');
  const [sleep, setSleep] = useState(dayLog?.sleep ?? false);
  const [steps10k, setSteps10k] = useState(dayLog?.steps10k ?? false);
  const [meditation, setMeditation] = useState(dayLog?.meditation ?? false);

  // Failure state reason
  const [failureReason, setFailureReason] = useState('');

  if (!dayLog) {
    return (
      <div className="ios-setup-container" style={{ justifyContent: 'center', height: '100%' }}>
        <h2 className="ios-title text-center" style={{ fontSize: '1.4rem' }}>No Active Attempt</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.88rem' }}>
          Please go to Profile tab or start a fresh challenge from setup.
        </p>
      </div>
    );
  }

  // Sync component state with dayLog updates
  useEffect(() => {
    setWorkout1(dayLog.workout1);
    setWorkout1Desc(dayLog.workout1Desc);
    setWorkout2(dayLog.workout2);
    setWorkout2Desc(dayLog.workout2Desc);
    setWater(dayLog.water);
    setDiet(dayLog.diet);
    setDietDesc(dayLog.dietDesc);
    setReading(dayLog.reading);
    setReadingBook(dayLog.readingBook);
    setReadingPages(dayLog.readingPages);
    setPhoto(dayLog.photo);
    setJournal(dayLog.journal);
    setSleep(dayLog.sleep || false);
    setSteps10k(dayLog.steps10k || false);
    setMeditation(dayLog.meditation || false);
  }, [dayLog]);

  // ─── XP Award Helper ───
  const showXP = useCallback((amount: number, source: string) => {
    if (amount <= 0) return;
    setXpPill({ amount, source, visible: true });
  }, []);

  // Helper to commit edits to DB + award XP
  const saveChanges = (overrides: Partial<DayLog> = {}) => {
    const updatedLog: DayLog = {
      ...dayLog,
      workout1,
      workout1Desc,
      workout2,
      workout2Desc,
      water,
      diet,
      dietDesc,
      reading,
      readingBook,
      readingPages,
      photo,
      journal,
      sleep,
      steps10k,
      meditation,
      ...overrides
    };

    // Calculate overall completion (8 or 9 items required for a perfect day)
    const isCompleted = 
      updatedLog.workout1 && 
      updatedLog.workout2 && 
      updatedLog.steps10k && 
      updatedLog.water >= updatedLog.waterGoal && 
      updatedLog.diet && 
      updatedLog.sleep && 
      updatedLog.reading && 
      updatedLog.photo !== null &&
      (!gamification.requireMeditationForPerfectDay || updatedLog.meditation);

    updatedLog.completed = !!isCompleted;
    onSaveDayLog(updatedLog);

    // ─── XP Awards ───
    const gs = { ...gamification };
    let totalXPThisSave = 0;

    // Track which tasks just flipped from false→true
    const taskMap: Record<string, boolean> = {
      workout1: updatedLog.workout1, workout2: updatedLog.workout2,
      steps10k: !!updatedLog.steps10k, water: updatedLog.water >= updatedLog.waterGoal,
      diet: updatedLog.diet, sleep: !!updatedLog.sleep,
      reading: updatedLog.reading, photo: updatedLog.photo !== null,
    };
    for (const [key, val] of Object.entries(taskMap)) {
      if (val && !prevCompleted[key]) {
        const xpEvt = calcTaskXP(key, gs.streakMult);
        const lvl = awardXP(gs, xpEvt.amount, key);
        totalXPThisSave += xpEvt.amount;
        analytics.taskCompleted(key, dayLog.dayNumber, gs.streak, xpEvt.amount);
        if (lvl) setLevelUpEvent(lvl);
      }
    }
    setPrevCompleted(taskMap);

    // Perfect Day bonus
    if (isCompleted && !dayLog.completed) {
      const pdXP = calcPerfectDayXP(gs.streakMult);
      const lvl = awardXP(gs, pdXP.amount, 'perfect_day');
      totalXPThisSave += pdXP.amount;
      incrementStreak(gs);
      analytics.perfectDayAchieved(dayLog.dayNumber, gs.streak, gs.xp);
      if (lvl) setLevelUpEvent(lvl);

      // Streak milestone message
      const streakMsg = getStreakMilestoneMessage(gs.streak);
      if (streakMsg) {
        setTimeout(() => setXpToast({ message: streakMsg, xp: 0, visible: true }), 2000);
      }

      // Milestone badge check
      const badge = checkMilestoneBadge(gs, dayLog.dayNumber, true);
      if (badge) {
        const badgeInfo = MILESTONE_BADGES.find(b => b.id === badge);
        if (badgeInfo) {
          awardXP(gs, BONUS_XP.milestoneBadge, 'badge');
          totalXPThisSave += BONUS_XP.milestoneBadge;
          setTimeout(() => setBadgeUnlock({ title: badgeInfo.title, day: badgeInfo.day, visible: true }), 1500);
        }
      }

      // Show celebration
      setPerfectDayCelebration({ visible: true, xp: totalXPThisSave });
    }

    // Starter quest checks
    const tasksCount = Object.values(taskMap).filter(Boolean).length;
    const hasJournal = (updatedLog.journal || '').length >= 20;
    const hasPhoto = updatedLog.photo !== null;
    const quests = checkStarterQuests(gs, tasksCount, !!isCompleted, hasJournal, hasPhoto);
    for (const q of quests) {
      const lvl = awardXP(gs, q.xpReward, q.questId);
      totalXPThisSave += q.xpReward;
      analytics.questCompleted(q.questId, q.questName, dayLog.dayNumber);
      if (lvl) setLevelUpEvent(lvl);
    }

    // Show XP pill for total
    if (totalXPThisSave > 0) showXP(totalXPThisSave, 'save');

    // Persist gamification state
    saveGamificationState(gs);
    onGamificationUpdate(gs);
  };

  // Preset water adjustment
  const adjustWater = (amount: number) => {
    const newWater = Math.max(0, water + amount);
    setWater(newWater);
    saveChanges({ water: newWater });
  };

  // Base64 file conversion for progress photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhoto(base64String);
        saveChanges({ photo: base64String });
        setActiveDrawerSection(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- STATS CALCULATIONS ---
  // 1. Current Streak
  let currentStreak = 0;
  const startCheck = dayLog.completed ? dayLog.dayNumber : dayLog.dayNumber - 1;
  for (let d = startCheck; d >= 1; d--) {
    const l = logs.find(log => log.dayNumber === d);
    if (l && l.completed && !l.failed) {
      currentStreak++;
    } else {
      break;
    }
  }
  // Add today to current streak if completed
  if (dayLog.completed && !dayLog.failed) {
    currentStreak = Math.max(1, currentStreak);
  }

  // 2. Longest Streak
  let longestStreak = 0;
  let running = 0;
  for (let d = 1; d <= dayLog.dayNumber; d++) {
    const l = logs.find(log => log.dayNumber === d);
    if (l && l.completed && !l.failed) {
      running++;
      if (running > longestStreak) {
        longestStreak = running;
      }
    } else {
      running = 0;
    }
  }

  // 3. Completion Rate
  const totalDaysSoFar = dayLog.dayNumber;
  const completedCount = logs.filter(l => l.dayNumber <= totalDaysSoFar && l.completed).length;
  const completionRate = totalDaysSoFar > 0 ? Math.round((completedCount / totalDaysSoFar) * 100) : 0;

  // 4. Activity Rings metrics
  // Ring 1 (Move - Red/Pink): Workouts & Steps (3 items)
  const moveMax = 3;
  const moveScore = (workout1 ? 1 : 0) + (workout2 ? 1 : 0) + (steps10k ? 1 : 0);
  const movePercent = Math.round((moveScore / moveMax) * 100);

  // Ring 2 (Exercise - Green): Hydration & Nutrition (2 items)
  const exerciseMax = 2;
  const exerciseScore = (water >= dayLog.waterGoal ? 1 : 0) + (diet ? 1 : 0);
  const exercisePercent = Math.round((exerciseScore / exerciseMax) * 100);

  // Ring 3 (Recovery - Blue): Sleep, Reading, Photo (3 or 4 items)
  const standMax = gamification.requireMeditationForPerfectDay ? 4 : 3;
  const standScore = (reading ? 1 : 0) + (photo !== null ? 1 : 0) + (sleep ? 1 : 0) + (gamification.requireMeditationForPerfectDay && meditation ? 1 : 0);
  const standPercent = Math.round((standScore / standMax) * 100);

  // 5. Weekly trend dataset (Last 7 days completion)
  const trendDivisor = gamification.requireMeditationForPerfectDay ? 9 : 8;
  const trendDays = [];
  for (let i = 6; i >= 0; i--) {
    const dayNum = dayLog.dayNumber - i;
    if (dayNum >= 1) {
      const match = logs.find(l => l.dayNumber === dayNum);
      // Calculate how many items were completed
      let completedItems = 0;
      if (match) {
        if (match.workout1) completedItems++;
        if (match.workout2) completedItems++;
        if (match.steps10k) completedItems++;
        if (match.water >= match.waterGoal) completedItems++;
        if (match.diet) completedItems++;
        if (match.sleep) completedItems++;
        if (match.reading) completedItems++;
        if (match.photo) completedItems++;
        if (gamification.requireMeditationForPerfectDay && match.meditation) completedItems++;
      }
      trendDays.push({
        dayNumber: dayNum,
        score: completedItems,
        label: `D${dayNum}`,
        completed: match ? match.completed : false,
        failed: match ? match.failed : false
      });
    }
  }

  // 6. Focus Engine priority selection
  interface FocusItem {
    id: LogSection;
    label: string;
    action: string;
  }
  let currentFocus: FocusItem = { id: 'journal', label: 'Spill the Tea', action: 'Standard tasks done! Spill the tea in your journal.' };
  if (!workout1) {
    currentFocus = { id: 'workout1', label: 'Workout 1 (Main Character Energy)', action: 'Time to build that aesthetic body. 45 min sweat session.' };
  } else if (!workout2) {
    currentFocus = { id: 'workout2', label: 'Touch Grass Workout', action: 'Must be 45 min outdoor under open sky. Go look at trees.' };
  } else if (water < dayLog.waterGoal) {
    currentFocus = { id: 'water', label: 'Hydro Homie Target', action: `Chug another ${dayLog.waterGoal - water}ml of water.` };
  } else if (!diet) {
    currentFocus = { id: 'diet', label: 'Strict Eats', action: 'No cheat meals, zero alcohol, no cap.' };
  } else if (!steps10k) {
    currentFocus = { id: 'steps10k' as LogSection, label: 'Touch Grass Steps', action: 'Walk 10,000 steps. Go explore.' };
  } else if (!sleep) {
    currentFocus = { id: 'sleep' as LogSection, label: 'Sleep (Demure & Rested)', action: 'Get 8 hours of solid sleep. Recovery is goated.' };
  } else if (!reading) {
    currentFocus = { id: 'reading', label: 'Big Brain Reading', action: 'Flip 10 pages of self-improvement. No scroll, actual pages.' };
  } else if (!photo) {
    currentFocus = { id: 'photo', label: 'Selfie Check 🤳', action: 'Capture today\'s visual progress check. Zero filters.' };
  }

  // Badge list status
  const badges = [
    { day: 1, title: 'Genesis', label: 'Day 1' },
    { day: 15, title: 'Vanguard', label: 'Day 15' },
    { day: 30, title: 'Iron Will', label: 'Day 30' },
    { day: 45, title: 'Elite', label: 'Day 45' },
    { day: 60, title: 'Titan', label: 'Day 60' },
    { day: 75, title: 'Immortal', label: 'Day 75' }
  ];

  // SVG ring properties
  const getStrokeDashOffset = (percent: number, radius: number) => {
    const circumference = 2 * Math.PI * radius;
    const cappedPercent = Math.min(100, Math.max(0, percent));
    return circumference - (cappedPercent / 100) * circumference;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* XP Progress Bar */}
      <XPBar
        totalXP={gamification.xp}
        streak={gamification.streak}
        streakMult={gamification.streakMult}
        streakFreezes={gamification.streakFreezes}
      />
      
      {/* Premium Dashboard Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-move-ring)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {new Date(dayLog.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            <h1 className="ios-title" style={{ fontSize: '2.4rem', margin: 0, letterSpacing: '-0.03em' }}>
              Day {dayLog.dayNumber} of 75 (Locked In ⚡)
            </h1>
            {dayLog.completed && (
              <span className="ios-badge" style={{ background: 'rgba(48, 209, 88, 0.15)', color: 'var(--color-exercise-ring)', border: '1px solid rgba(48, 209, 88, 0.3)' }}>
                Goated Day 🏆
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: '4px 0 0 0' }}>
            Welcome back, bestie <strong style={{ color: '#fff' }}>{userName}</strong>. Let's get this bread.
          </p>
        </div>
        <div>
          <button 
            className="ios-btn" 
            style={{ 
              background: 'rgba(255, 69, 58, 0.1)', 
              color: 'var(--color-red)', 
              border: '1px solid rgba(255, 69, 58, 0.25)',
              padding: '10px 16px', 
              borderRadius: '10px', 
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            onClick={() => setActiveDrawerSection('fail')}
          >
            <AlertTriangle size={16} /> I folded today 💀 (Fail)
          </button>
        </div>
      </div>

      {/* Main Bento Grid layout */}
      <div className="dashboard-bento-grid">
        
        {/* Column 1: Progress Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Concentric Rings Visual Card */}
          <div className="ios-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em' }}>Consistency Rings</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Daily Drip Balance</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
                <svg width="130" height="130" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                  {/* Ring 1: Move (Outer) Background & Fill */}
                  <circle cx="75" cy="75" r="62" fill="transparent" stroke="rgba(255, 45, 85, 0.12)" strokeWidth="12" />
                  <circle 
                    cx="75" cy="75" r="62" fill="transparent" 
                    stroke="var(--color-move-ring)" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 62}
                    strokeDashoffset={getStrokeDashOffset(movePercent, 62)}
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                  />

                  {/* Ring 2: Exercise (Middle) Background & Fill */}
                  <circle cx="75" cy="75" r="47" fill="transparent" stroke="rgba(48, 209, 88, 0.12)" strokeWidth="12" />
                  <circle 
                    cx="75" cy="75" r="47" fill="transparent" 
                    stroke="var(--color-exercise-ring)" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 47}
                    strokeDashoffset={getStrokeDashOffset(exercisePercent, 47)}
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                  />

                  {/* Ring 3: Recovery (Inner) Background & Fill */}
                  <circle cx="75" cy="75" r="32" fill="transparent" stroke="rgba(0, 122, 255, 0.12)" strokeWidth="12" />
                  <circle 
                    cx="75" cy="75" r="32" fill="transparent" 
                    stroke="var(--color-stand-ring)" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 32}
                    strokeDashoffset={getStrokeDashOffset(standPercent, 32)}
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                  />
                </svg>
                
                {/* Center icon */}
                <div style={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#fff' 
                }}>
                  {dayLog.completed ? (
                    <Award size={28} style={{ color: 'var(--color-orange)', filter: 'drop-shadow(0 0 8px rgba(255,159,10,0.5))' }} />
                  ) : (
                    <Flame size={26} style={{ color: 'var(--color-move-ring)' }} />
                  )}
                </div>
              </div>

              {/* Rings Metrics Legend */}
              <div style={{ flexGrow: 1, minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--color-move-ring)' }}>MOVE</span>
                    <span>{moveScore}/3</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '2px' }}>
                    <div style={{ width: `${movePercent}%`, height: '100%', borderRadius: '2px', background: 'var(--color-move-ring)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--color-exercise-ring)' }}>EXERCISE</span>
                    <span>{exerciseScore}/2</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '2px' }}>
                    <div style={{ width: `${exercisePercent}%`, height: '100%', borderRadius: '2px', background: 'var(--color-exercise-ring)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--color-stand-ring)' }}>STAND</span>
                    <span>{standScore}/{standMax}</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '2px' }}>
                    <div style={{ width: `${standPercent}%`, height: '100%', borderRadius: '2px', background: 'var(--color-stand-ring)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Global Progress Linear Tracker */}
          <div className="ios-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <span>Challenge Progress</span>
              <span style={{ color: '#fff' }}>{Math.round((dayLog.dayNumber / 75) * 100)}% Complete</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${(dayLog.dayNumber / 75) * 100}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, var(--color-move-ring), var(--color-orange))', 
                  borderRadius: '3px' 
                }} 
              />
            </div>
          </div>

          {/* 2-Minute Quick Reset Bento Promo */}
          {!meditation && (
            <div 
              className="ios-card animate-hover" 
              style={{ 
                background: 'linear-gradient(135deg, rgba(99, 226, 183, 0.15), rgba(255, 255, 255, 0.01))', 
                border: '1px solid rgba(99, 226, 183, 0.25)',
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onClick={() => setActiveDrawerSection('meditation')}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '10px', 
                    background: 'rgba(99, 226, 183, 0.15)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'var(--color-calm-teal)' 
                  }}
                >
                  <Wind size={20} className="breath-icon-pulse" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>2-Min Mind Reset (Demure & Mindful)</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Pause the scroll. Reset and center your thoughts, no cap.
                  </p>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--color-calm-teal)', opacity: 0.8 }} />
            </div>
          )}

          {/* Focus recommendation Panel */}
          <div 
            className="ios-card animate-hover" 
            style={{ 
              background: 'linear-gradient(135deg, rgba(255, 45, 85, 0.12), rgba(255, 159, 10, 0.04))', 
              border: '1px solid rgba(255, 45, 85, 0.2)',
              padding: '16px',
              cursor: 'pointer'
            }}
            onClick={() => {
              if (currentFocus.id === 'steps10k' as any) {
                const val = !steps10k;
                setSteps10k(val);
                saveChanges({ steps10k: val });
              } else if (currentFocus.id === 'sleep' as any) {
                const val = !sleep;
                setSleep(val);
                saveChanges({ sleep: val });
              } else {
                setActiveDrawerSection(currentFocus.id);
              }
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ color: 'var(--color-move-ring)', marginTop: '2px' }}>
                  <Sparkles size={20} fill="var(--color-move-ring)" style={{ filter: 'drop-shadow(0 0 6px var(--color-move-ring))' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-move-ring)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    NEXT QUEST: LET HIM COOK 🍳
                  </span>
                  <h3 style={{ margin: '2px 0', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                    {currentFocus.label}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                    {currentFocus.action}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--color-move-ring)', opacity: 0.8 }} />
            </div>
          </div>
        </div>

        {/* Column 2: Requirements Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px 0', paddingLeft: '4px' }}>
            Daily Requirements
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* 1. Indoor Workout */}
            <div className="ios-checklist-card" role="checkbox" aria-checked={workout1} aria-label={`Workout 1 - ${workout1 ? 'completed' : 'incomplete'}`} tabIndex={0} onClick={() => setActiveDrawerSection('workout1')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveDrawerSection('workout1'); } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}>
                <div 
                  className="ios-checklist-icon-sphere" 
                  style={{ 
                    background: workout1 ? 'rgba(255, 45, 85, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: workout1 ? 'var(--color-move-ring)' : 'var(--text-secondary)'
                  }}
                >
                  <Dumbbell size={18} />
                </div>
                <div>
                  <span className="title">Workout 1 (Main Character Energy)</span>
                  <span className="desc">
                    {workout1 ? (workout1Desc || 'Indoor Workout') : 'Log sweat session details'}
                  </span>
                </div>
              </div>
              <div 
                className={`ios-checklist-checkbox-round ${workout1 ? 'checked' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const val = !workout1;
                  setWorkout1(val);
                  saveChanges({ workout1: val });
                }}
              >
                <Check size={14} strokeWidth={3.5} />
              </div>
            </div>

            {/* 2. Outdoor Workout */}
            <div className="ios-checklist-card" role="checkbox" aria-checked={workout2} aria-label={`Workout 2 Outdoor - ${workout2 ? 'completed' : 'incomplete'}`} tabIndex={0} onClick={() => setActiveDrawerSection('workout2')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveDrawerSection('workout2'); } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}>
                <div 
                  className="ios-checklist-icon-sphere" 
                  style={{ 
                    background: workout2 ? 'rgba(48, 209, 88, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: workout2 ? 'var(--color-exercise-ring)' : 'var(--text-secondary)'
                  }}
                >
                  <Dumbbell size={18} />
                </div>
                <div>
                  <span className="title">Touch Grass (Outdoor Workout)</span>
                  <span className="desc">
                    {workout2 ? (workout2Desc || 'Outdoor Workout') : '45 min workout in the elements. No cap.'}
                  </span>
                </div>
              </div>
              <div 
                className={`ios-checklist-checkbox-round ${workout2 ? 'checked' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const val = !workout2;
                  setWorkout2(val);
                  saveChanges({ workout2: val });
                }}
              >
                <Check size={14} strokeWidth={3.5} />
              </div>
            </div>

            {/* 3. 10k Steps Target */}
            <div className="ios-checklist-card" role="checkbox" aria-checked={steps10k} aria-label={`10000 Steps - ${steps10k ? 'completed' : 'incomplete'}`} tabIndex={0} onClick={() => {
              const val = !steps10k;
              setSteps10k(val);
              saveChanges({ steps10k: val });
            }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const val = !steps10k; setSteps10k(val); saveChanges({ steps10k: val }); } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}>
                <div 
                  className="ios-checklist-icon-sphere" 
                  style={{ 
                    background: steps10k ? 'rgba(255, 159, 10, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: steps10k ? 'var(--color-orange)' : 'var(--text-secondary)'
                  }}
                >
                  <Footprints size={18} />
                </div>
                <div>
                  <span className="title">10,000 Steps (No cap, keep walking)</span>
                  <span className="desc">Keep moving, bestie</span>
                </div>
              </div>
              <div className={`ios-checklist-checkbox-round ${steps10k ? 'checked' : ''}`}>
                <Check size={14} strokeWidth={3.5} />
              </div>
            </div>

            {/* 4. Hydration Target */}
            <div className="ios-checklist-card" role="checkbox" aria-checked={water >= dayLog.waterGoal} aria-label={`Hydration - ${water} of ${dayLog.waterGoal} ml${water >= dayLog.waterGoal ? ' - goal met' : ''}`} tabIndex={0} onClick={() => setActiveDrawerSection('water')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveDrawerSection('water'); } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}>
                <div 
                  className="ios-checklist-icon-sphere" 
                  style={{ 
                    background: water >= dayLog.waterGoal ? 'rgba(0, 122, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: water >= dayLog.waterGoal ? 'var(--color-stand-ring)' : 'var(--text-secondary)'
                  }}
                >
                  <Droplet size={18} fill={water >= dayLog.waterGoal ? 'var(--color-stand-ring)' : 'none'} />
                </div>
                <div style={{ flexGrow: 1 }}>
                  <span className="title">Hydro Homie Target (Stay hydrated)</span>
                  <span className="desc">{water >= dayLog.waterGoal ? 'Water goal fully cooked!' : `Remaining: ${dayLog.waterGoal - water}ml`}</span>
                  
                  {/* Small indicator bar */}
                  <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '6px' }}>
                    <div 
                      style={{ 
                        width: `${Math.min(100, (water / dayLog.waterGoal) * 100)}%`, 
                        height: '100%', 
                        background: 'var(--color-stand-ring)', 
                        borderRadius: '2px',
                        transition: 'width 0.3s ease'
                      }} 
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    {[250, 500].map(amt => (
                      <button
                        key={amt}
                        className="ios-badge-btn"
                        aria-label={`Add ${amt} milliliters of water`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newWater = water + amt;
                          setWater(newWater);
                          saveChanges({ water: newWater });
                        }}
                      >
                        +{amt}ml
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className={`ios-checklist-checkbox-round ${water >= dayLog.waterGoal ? 'checked' : ''}`}>
                <Check size={14} strokeWidth={3.5} />
              </div>
            </div>

            {/* 5. Sleep Target */}
            <div className="ios-checklist-card" role="checkbox" aria-checked={sleep} aria-label={`Sleep Target - ${sleep ? 'completed' : 'incomplete'}`} tabIndex={0} onClick={() => {
              const val = !sleep;
              setSleep(val);
              saveChanges({ sleep: val });
            }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const val = !sleep; setSleep(val); saveChanges({ sleep: val }); } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}>
                <div 
                  className="ios-checklist-icon-sphere" 
                  style={{ 
                    background: sleep ? 'rgba(98, 0, 234, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: sleep ? '#7c4dff' : 'var(--text-secondary)'
                  }}
                >
                  <Moon size={18} fill={sleep ? '#7c4dff' : 'none'} />
                </div>
                <div>
                  <span className="title">Sleep Quality (Demure & Rested)</span>
                  <span className="desc">8 hours of deep recovery</span>
                </div>
              </div>
              <div className={`ios-checklist-checkbox-round ${sleep ? 'checked' : ''}`}>
                <Check size={14} strokeWidth={3.5} />
              </div>
            </div>

            {/* 6. Strict Diet */}
            <div className="ios-checklist-card" role="checkbox" aria-checked={diet} aria-label={`Nutrition Plan - ${diet ? 'completed' : 'incomplete'}`} tabIndex={0} onClick={() => setActiveDrawerSection('diet')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveDrawerSection('diet'); } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}>
                <div 
                  className="ios-checklist-icon-sphere" 
                  style={{ 
                    background: diet ? 'rgba(255, 45, 85, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: diet ? 'var(--color-move-ring)' : 'var(--text-secondary)'
                  }}
                >
                  <Utensils size={18} />
                </div>
                <div>
                  <span className="title">Strict Eats (No cheat meals, zero alcohol)</span>
                  <span className="desc">
                    {diet ? (dietDesc || 'Clean eating adherence') : 'Zero cheat meals, zero alcohol, no cap'}
                  </span>
                </div>
              </div>
              <div 
                className={`ios-checklist-checkbox-round ${diet ? 'checked' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const val = !diet;
                  setDiet(val);
                  saveChanges({ diet: val });
                }}
              >
                <Check size={14} strokeWidth={3.5} />
              </div>
            </div>

            {/* 7. Reading Target */}
            <div className="ios-checklist-card" role="checkbox" aria-checked={reading} aria-label={`Read 10 Pages - ${reading ? 'completed' : 'incomplete'}`} tabIndex={0} onClick={() => setActiveDrawerSection('reading')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveDrawerSection('reading'); } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}>
                <div 
                  className="ios-checklist-icon-sphere" 
                  style={{ 
                    background: reading ? 'rgba(0, 122, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: reading ? 'var(--color-stand-ring)' : 'var(--text-secondary)'
                  }}
                >
                  <BookOpen size={18} />
                </div>
                <div>
                  <span className="title">Big Brain Pages (Read 10 pages)</span>
                  <span className="desc">
                    {reading ? `${readingPages} pages of ${readingBook || 'Book'}` : 'No TikTok, actual physical pages'}
                  </span>
                </div>
              </div>
              <div 
                className={`ios-checklist-checkbox-round ${reading ? 'checked' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const val = !reading;
                  setReading(val);
                  saveChanges({ reading: val });
                }}
              >
                <Check size={14} strokeWidth={3.5} />
              </div>
            </div>

            {/* Daily Mind Reset checklist card */}
            <div 
              className="ios-checklist-card" 
              role="checkbox" 
              aria-checked={meditation} 
              aria-label={`Daily Mind Reset - ${meditation ? 'completed' : 'incomplete'}`} 
              tabIndex={0} 
              onClick={() => setActiveDrawerSection('meditation')} 
              onKeyDown={(e) => { 
                if (e.key === 'Enter' || e.key === ' ') { 
                  e.preventDefault(); 
                  setActiveDrawerSection('meditation'); 
                } 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}>
                <div 
                  className="ios-checklist-icon-sphere" 
                  style={{ 
                    background: meditation ? 'rgba(99, 226, 183, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: meditation ? 'var(--color-calm-teal)' : 'var(--text-secondary)'
                  }}
                >
                  <Wind size={18} />
                </div>
                <div>
                  <span className="title">Demure & Mindful Reset (Meditation)</span>
                  <span className="desc">
                    {meditation ? 'Mindfulness session completed' : 'Silence the thoughts, bestie'}
                  </span>
                </div>
              </div>
              <div 
                className={`ios-checklist-checkbox-round ${meditation ? 'checked calm-teal' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (meditation) {
                    setMeditation(false);
                    saveChanges({ meditation: false });
                  } else {
                    setActiveDrawerSection('meditation');
                  }
                }}
              >
                <Check size={14} strokeWidth={3.5} />
              </div>
            </div>

            {/* 8. Progress Photo */}
            <div className="ios-checklist-card" role="checkbox" aria-checked={!!photo} aria-label={`Progress Photo - ${photo ? 'uploaded' : 'not taken'}`} tabIndex={0} onClick={() => setActiveDrawerSection('photo')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveDrawerSection('photo'); } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}>
                <div 
                  className="ios-checklist-icon-sphere" 
                  style={{ 
                    background: photo ? 'rgba(48, 209, 88, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: photo ? 'var(--color-exercise-ring)' : 'var(--text-secondary)'
                  }}
                >
                  <Camera size={18} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <span className="title">Selfie Check 🤳 (No filters)</span>
                    <span className="desc">{photo ? 'Photo logged successfully' : 'Tap to log your aesthetic gains'}</span>
                  </div>
                  {photo && (
                    <img 
                      src={photo} 
                      alt="Selfie thumbnail" 
                      style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  )}
                </div>
              </div>
              <div className={`ios-checklist-checkbox-round ${photo ? 'checked' : ''}`}>
                <Check size={14} strokeWidth={3.5} />
              </div>
            </div>

          </div>
        </div>

        {/* Column 3: Streaks, Weekly Charts, Badges & Journal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Consistency & Streaks */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px 0', paddingLeft: '4px' }}>
              Streak Go Brrr 🔥
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="ios-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Streak</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-move-ring)' }}>{currentStreak}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>days</span>
                </div>
              </div>

              <div className="ios-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Max Streak</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-orange)' }}>{longestStreak}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>days</span>
                </div>
              </div>

              <div className="ios-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>W Rate</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-exercise-ring)' }}>{completionRate}%</span>
                </div>
              </div>

              <div className="ios-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Locked In</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Day {dayLog.dayNumber}/75</span>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Trend Chart */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px 0', paddingLeft: '4px' }}>
              Weekly Vibe Check ⚡
            </h2>
            <div className="ios-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '80px', padding: '0 8px 4px 8px' }}>
                {trendDays.map((t, idx) => {
                  const heightPercent = Math.round((t.score / trendDivisor) * 100);
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                      {/* Vertical Pill */}
                      <div style={{ 
                        width: '12px', 
                        height: '56px', 
                        background: 'rgba(255,255,255,0.04)', 
                        borderRadius: '6px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          width: '100%',
                          height: `${heightPercent}%`,
                          borderRadius: '6px',
                          background: t.failed 
                            ? 'var(--color-red)'
                            : t.score === trendDivisor 
                              ? 'linear-gradient(to top, var(--color-exercise-ring), var(--color-stand-ring))'
                              : 'linear-gradient(to top, var(--color-orange), var(--color-move-ring))',
                          transition: 'height 0.3s ease'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.68rem', color: t.dayNumber === dayLog.dayNumber ? '#fff' : 'var(--text-secondary)', fontWeight: t.dayNumber === dayLog.dayNumber ? 700 : 500 }}>
                        {t.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Milestone Badges Grid */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 12px 0' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, paddingLeft: '4px' }}>
                Aesthetic Badges & Trophies 🏆
              </h2>
              <button 
                onClick={() => activeTabSetter('progress')}
                style={{ background: 'none', border: 'none', color: 'var(--color-orange)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', paddingRight: '4px' }}
              >
                View Grid
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {badges.map((b, idx) => {
                const isAchieved = logs.find(l => l.dayNumber === b.day)?.completed === true;
                return (
                  <div 
                    key={idx} 
                    className="ios-card" 
                    style={{ 
                      padding: '12px 8px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: isAchieved 
                        ? 'linear-gradient(135deg, rgba(255,159,10,0.1), rgba(255,255,255,0.01))' 
                        : 'var(--card-bg)',
                      border: isAchieved ? '1px solid rgba(255,159,10,0.3)' : '1px solid var(--border-color)',
                      opacity: isAchieved ? 1 : 0.4
                    }}
                  >
                    <div style={{ 
                      width: '38px', 
                      height: '38px', 
                      borderRadius: '50%', 
                      background: isAchieved ? 'linear-gradient(135deg, var(--color-orange), var(--color-move-ring))' : 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isAchieved ? '#fff' : 'var(--text-secondary)',
                      marginBottom: '8px',
                      boxShadow: isAchieved ? '0 0 12px rgba(255,159,10,0.4)' : 'none'
                    }}>
                      {isAchieved ? <Award size={20} /> : <Lock size={16} />}
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: '1.2' }}>{b.title}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{b.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Journal Card */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px 0', paddingLeft: '4px' }}>
              Spill the Tea Journal ☕
            </h2>
            <div className="ios-card animate-hover" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', cursor: 'pointer' }} onClick={() => setActiveDrawerSection('journal')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PenTool size={18} style={{ color: 'var(--color-move-ring)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Daily reflection check</span>
              </div>
              <p style={{ 
                margin: 0, 
                fontSize: '0.82rem', 
                color: journal ? '#fff' : 'var(--text-secondary)', 
                lineHeight: '1.4',
                whiteSpace: 'pre-wrap',
                fontStyle: journal ? 'normal' : 'italic'
              }}>
                {journal || "How's the physical and mental vibe today? Spill the tea in your daily reflection log..."}
              </p>
            </div>
          </div>        </div>

      </div>

      <div style={{ height: '30px' }} />

      {/* iOS Slider Overlay bottom sheet for detailed edits */}
      {activeDrawerSection !== null && (
        <div className="ios-bottom-sheet-overlay" onClick={() => setActiveDrawerSection(null)}>
          {activeDrawerSection === 'meditation' ? (
            <MeditationContainer 
              attemptId={attemptId}
              dayNumber={dayLog.dayNumber}
              gamification={gamification}
              onGamificationUpdate={onGamificationUpdate}
              startSetupDirectly={true}
              onClose={() => setActiveDrawerSection(null)}
              onMeditationLogged={() => {
                setMeditation(true);
                saveChanges({ meditation: true });
              }}
            />
          ) : (
            <div className="ios-bottom-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="ios-bottom-sheet-handle" />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeDrawerSection === 'workout1' && <><Dumbbell size={20} color="var(--color-move-ring)" /> Workout 1 Details</>}
                {activeDrawerSection === 'workout2' && <><Dumbbell size={20} color="var(--color-exercise-ring)" /> Touch Grass Details</>}
                {activeDrawerSection === 'water' && <><Droplet size={20} color="var(--color-stand-ring)" /> Hydro Homie Hydration</>}
                {activeDrawerSection === 'diet' && <><Utensils size={20} color="var(--color-move-ring)" /> Strict Eats Log</>}
                {activeDrawerSection === 'reading' && <><BookOpen size={20} color="var(--color-stand-ring)" /> Big Brain Book Log</>}
                {activeDrawerSection === 'photo' && <><Camera size={20} color="var(--color-exercise-ring)" /> Aesthetic Progress Selfie</>}
                {activeDrawerSection === 'journal' && <><PenTool size={20} color="var(--color-move-ring)" /> Spill the Tea Reflection</>}
                {activeDrawerSection === 'fail' && <><AlertTriangle size={20} color="var(--color-red)" /> I Folded Check 💀</>}
              </h3>
              <button 
                onClick={() => setActiveDrawerSection(null)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
              >
                <X size={16} style={{ margin: 'auto' }} />
              </button>
            </div>

            {/* Content areas mapping to active sheet selection */}
            
            {/* Workout 1 Details */}
            {activeDrawerSection === 'workout1' && (
              <div>
                <label className="ios-form-label">Workout Description</label>
                <input 
                  type="text" 
                  className="ios-input" 
                  value={workout1Desc}
                  onChange={(e) => setWorkout1Desc(e.target.value)}
                  placeholder="e.g. Strength Training, HIIIT, Treadmill walk..."
                />
                <button 
                  className="ios-btn ios-btn-primary" 
                  style={{ marginTop: '16px' }}
                  onClick={() => {
                    setWorkout1(true);
                    saveChanges({ workout1: true, workout1Desc });
                    setActiveDrawerSection(null);
                  }}
                >
                  Save & Complete Workout
                </button>
              </div>
            )}

            {/* Workout 2 Details */}
            {activeDrawerSection === 'workout2' && (
              <div>
                <label className="ios-form-label">Outdoor Activity Description</label>
                <input 
                  type="text" 
                  className="ios-input" 
                  value={workout2Desc}
                  onChange={(e) => setWorkout2Desc(e.target.value)}
                  placeholder="e.g. Trail Run, Outdoor Walk, Road Cycle..."
                />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.3' }}>
                  *Reminder: Must be a full 45 minutes outdoors under open skies. Rain, snow, or heat do not count as excuses to skip the outdoors!
                </p>
                <button 
                  className="ios-btn ios-btn-primary" 
                  style={{ marginTop: '16px' }}
                  onClick={() => {
                    setWorkout2(true);
                    saveChanges({ workout2: true, workout2Desc });
                    setActiveDrawerSection(null);
                  }}
                >
                  Save & Complete Outdoor Workout
                </button>
              </div>
            )}

            {/* Hydration Logger */}
            {activeDrawerSection === 'water' && (
              <div>
                <div style={{ textAlign: 'center', margin: '10px 0 20px 0' }}>
                  <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--color-stand-ring)' }}>
                    {water}ml <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>/ {dayLog.waterGoal}ml</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {water >= dayLog.waterGoal ? 'Water goal completed!' : `${dayLog.waterGoal - water}ml remaining`}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                  <button className="ios-badge-btn" onClick={() => adjustWater(-250)} style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                    -250ml
                  </button>
                  <button className="ios-badge-btn" onClick={() => adjustWater(250)} style={{ border: '1px solid rgba(0, 122, 255, 0.2)' }}>
                    +250ml
                  </button>
                  <button className="ios-badge-btn" onClick={() => adjustWater(500)} style={{ border: '1px solid rgba(0, 122, 255, 0.2)' }}>
                    +500ml
                  </button>
                  <button className="ios-badge-btn" onClick={() => adjustWater(1000)} style={{ border: '1px solid rgba(0, 122, 255, 0.2)' }}>
                    +1.0L
                  </button>
                </div>

                <button 
                  className="ios-btn ios-btn-primary" 
                  onClick={() => setActiveDrawerSection(null)}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Diet Details */}
            {activeDrawerSection === 'diet' && (
              <div>
                <label className="ios-form-label">Nutrition / Fasting Plan</label>
                <input 
                  type="text" 
                  className="ios-input" 
                  value={dietDesc}
                  onChange={(e) => setDietDesc(e.target.value)}
                  placeholder="e.g. Keto diet under 1800 kcal, clean food only..."
                />
                <p style={{ fontSize: '0.78rem', color: 'var(--color-red)', marginTop: '8px', lineHeight: '1.3', fontWeight: 600 }}>
                  *Reminder: Absolutely no cheat meals, no snacks outside plan, and zero alcohol consumption for 75 days straight.
                </p>
                <button 
                  className="ios-btn ios-btn-primary" 
                  style={{ marginTop: '16px' }}
                  onClick={() => {
                    setDiet(true);
                    saveChanges({ diet: true, dietDesc });
                    setActiveDrawerSection(null);
                  }}
                >
                  Confirm Clean Diet Completed
                </button>
              </div>
            )}

            {/* Reading Details */}
            {activeDrawerSection === 'reading' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="ios-form-label">Book Title</label>
                  <input 
                    type="text" 
                    className="ios-input" 
                    value={readingBook}
                    onChange={(e) => setReadingBook(e.target.value)}
                    placeholder="e.g. Atomic Habits"
                  />
                </div>
                <div>
                  <label className="ios-form-label">Pages Read Today</label>
                  <input 
                    type="number" 
                    className="ios-input" 
                    value={readingPages || ''}
                    onChange={(e) => setReadingPages(parseInt(e.target.value) || 0)}
                    placeholder="e.g. 10"
                  />
                </div>
                <button 
                  className="ios-btn ios-btn-primary" 
                  style={{ marginTop: '8px' }}
                  onClick={() => {
                    const pagesCompleted = readingPages >= 10;
                    setReading(pagesCompleted);
                    saveChanges({ reading: pagesCompleted, readingBook, readingPages });
                    setActiveDrawerSection(null);
                  }}
                >
                  Save Page Count & Complete
                </button>
              </div>
            )}

            {/* Photo Details */}
            {activeDrawerSection === 'photo' && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  {photo ? (
                    <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={photo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        onClick={() => {
                          setPhoto(null);
                          saveChanges({ photo: null });
                        }}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', color: '#fff', cursor: 'pointer' }}
                      >
                        <X size={18} style={{ margin: 'auto' }} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '180px', 
                      borderRadius: '12px', 
                      border: '1px dashed var(--border-color)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.2)',
                      color: 'var(--text-secondary)'
                    }}>
                      <Camera size={38} style={{ opacity: 0.4, marginBottom: '8px' }} />
                      <span style={{ fontSize: '0.8rem' }}>No photo logged</span>
                    </div>
                  )}

                  <label className="ios-btn ios-btn-primary" style={{ cursor: 'pointer', textAlign: 'center' }}>
                    {photo ? 'Replace Progress Photo' : 'Upload Progress Photo'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Journal Reflection details */}
            {activeDrawerSection === 'journal' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label className="ios-form-label">How did your day go?</label>
                <textarea 
                  className="ios-input" 
                  rows={5}
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  placeholder="Record thoughts, daily notes, energy levels..."
                  style={{ height: 'auto', resize: 'vertical' }}
                />
                <button 
                  className="ios-btn ios-btn-primary" 
                  onClick={() => {
                    saveChanges({ journal });
                    setActiveDrawerSection(null);
                  }}
                >
                  Save Reflection Log
                </button>
              </div>
            )}

            {/* Failure Action */}
            {activeDrawerSection === 'fail' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label className="ios-form-label">Failure Reason / Log Note</label>
                <input 
                  type="text" 
                  className="ios-input" 
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="e.g. Forgot reading / cheated diet rules..."
                />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Folding now will wipe your streak and send you back to Day 1, which is a certified bruh moment. Your overall XP and levels are saved, but the streak resets.
                </p>
                <button 
                  className="ios-btn ios-btn-danger" 
                  onClick={() => {
                    onFailAttempt(dayLog.dayNumber, failureReason || 'Missed daily requirement');
                    setActiveDrawerSection(null);
                  }}
                >
                  Log Fail & Reset Challenge
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    )}

    {/* ─── Gamification Overlays ─── */}
    <XPPill amount={xpPill.amount} source={xpPill.source} visible={xpPill.visible} onDone={() => setXpPill(p => ({ ...p, visible: false }))} />
    <XPToast message={xpToast.message} xp={xpToast.xp} visible={xpToast.visible} onDone={() => setXpToast(p => ({ ...p, visible: false }))} />
    <LevelUpOverlay event={levelUpEvent} onDismiss={() => setLevelUpEvent(null)} />
    <PerfectDayCelebration
      dayNumber={dayLog.dayNumber}
      xpEarned={perfectDayCelebration.xp}
      streak={gamification.streak}
      visible={perfectDayCelebration.visible}
      onDismiss={() => setPerfectDayCelebration({ visible: false, xp: 0 })}
    />
    <BadgeUnlock
      badgeTitle={badgeUnlock.title}
      badgeDay={badgeUnlock.day}
      visible={badgeUnlock.visible}
      onDismiss={() => setBadgeUnlock({ title: '', day: 0, visible: false })}
    />
    <StarterQuestFAB questState={gamification.starterQuest} visible={!gamification.starterQuest.chainComplete} />

    </div>
  );
};
