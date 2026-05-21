import React, { useState, useEffect } from 'react';
import { 
  Wind, 
  Play, 
  Plus, 
  Calendar, 
  Clock, 
  Award, 
  X, 
  History
} from 'lucide-react';
import { 
  getMeditationLogs, 
  saveMeditationLog, 
  type MeditationLog 
} from '../../db';
import { 
  awardXP, 
  calcMeditationXP, 
  saveGamificationState, 
  type GamificationState, 
  type LevelUpEvent 
} from '../../gamification';
import { analytics } from '../../analytics';
import { MeditationSetup } from './MeditationSetup';
import { MeditationSession } from './MeditationSession';
import { MeditationReflection } from './MeditationReflection';

interface MeditationContainerProps {
  attemptId: string;
  dayNumber: number;
  gamification: GamificationState;
  onGamificationUpdate: (gs: GamificationState) => void;
  onClose?: () => void;
  onMeditationLogged?: (durationMinutes: number) => void;
  // If true, starts setup flow immediately (modal sheet drawer style)
  startSetupDirectly?: boolean;
}

export const MeditationContainer: React.FC<MeditationContainerProps> = ({
  attemptId,
  dayNumber,
  gamification,
  onGamificationUpdate,
  onClose,
  onMeditationLogged,
  startSetupDirectly = false
}) => {
  // Navigation states: 'dashboard' | 'setup' | 'session' | 'reflection'
  const [viewState, setViewState] = useState<'dashboard' | 'setup' | 'session' | 'reflection'>(
    startSetupDirectly ? 'setup' : 'dashboard'
  );

  // Active Session Config
  const [activeConfig, setActiveConfig] = useState<{
    durationMinutes: number;
    mode: 'breath' | 'focus' | 'body' | 'sleep' | 'preworkout';
    guided: boolean;
    soundSetting: 'none' | 'rain' | 'ocean' | 'stream' | 'white';
    soundVolume: number;
  } | null>(null);

  // Session Results
  const [sessionXP, setSessionXP] = useState<number>(0);
  const [actualDurationSeconds, setActualDurationSeconds] = useState<number>(0);

  // Database logs state
  const [logs, setLogs] = useState<MeditationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);

  // Level Up overlay state
  const [levelUp, setLevelUp] = useState<LevelUpEvent | null>(null);

  // Load history from DB
  const loadHistory = async () => {
    try {
      setLoadingLogs(true);
      const data = await getMeditationLogs(attemptId);
      setLogs(data);
    } catch (e) {
      console.error('Failed to load meditation history:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [attemptId, viewState]);

  // Streak/comeback parameters
  const isComeback = !!(gamification.comebackState && gamification.comebackState.active);
  const overallMult = gamification.streakMult || 1.0;

  // Handle Session Start
  const handleStartSession = (config: typeof activeConfig) => {
    setActiveConfig(config);
    setViewState('session');
    
    // Log analytics
    analytics.track('meditation_started', {
      attemptId,
      dayNumber,
      durationMinutes: config!.durationMinutes,
      mode: config!.mode,
      guided: config!.guided,
      soundSetting: config!.soundSetting,
      streakState: gamification.meditationStreak
    });
  };

  // Launch quick 2-minute reset
  const handleQuickReset = () => {
    handleStartSession({
      durationMinutes: 2,
      mode: 'breath',
      guided: true,
      soundSetting: 'ocean',
      soundVolume: 40
    });
  };

  // Session complete callback (>= 80% duration)
  const handleSessionComplete = (elapsedSeconds: number) => {
    setActualDurationSeconds(elapsedSeconds);
    if (!activeConfig) return;

    // Calculate XP
    const baseXPKey = `len${activeConfig.durationMinutes}`;
    const xpEvent = calcMeditationXP(baseXPKey, overallMult, gamification.meditationStreak, isComeback);
    setSessionXP(xpEvent.amount);

    setViewState('reflection');
  };

  // Session early cancel / abandon callback (< 80% duration)
  const handleSessionAbandon = (elapsedSeconds: number) => {
    // Log analytics
    analytics.track('meditation_abandoned', {
      durationElapsedSeconds: elapsedSeconds,
      durationRemainingSeconds: activeConfig ? (activeConfig.durationMinutes * 60 - elapsedSeconds) : 0,
      reason: 'cancelled_by_user'
    });

    // Reset back
    if (startSetupDirectly && onClose) {
      onClose();
    } else {
      setViewState('dashboard');
    }
  };

  // Save reflection logging
  const handleSaveReflection = async (reflection: {
    moodAfter: MeditationLog['moodAfter'];
    note: string | null;
  }) => {
    if (!activeConfig) return;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Build log model
    const log: MeditationLog = {
      id: `${attemptId}-${now.getTime()}`,
      attemptId,
      dayNumber,
      date: todayStr,
      timestamp: now.toISOString(),
      durationSeconds: actualDurationSeconds,
      targetDurationSeconds: activeConfig.durationMinutes * 60,
      mode: activeConfig.mode,
      guided: activeConfig.guided,
      soundSetting: activeConfig.soundSetting,
      intention: reflection.moodAfter === 'focused' ? 'Focus Reset' : 'Calm Conditioning',
      moodBefore: null,
      moodAfter: reflection.moodAfter,
      note: reflection.note,
      xpAwarded: sessionXP,
      completed: true
    };

    try {
      // Save log to db
      await saveMeditationLog(log);

      // Determine streak update logic
      let newStreak = gamification.meditationStreak || 0;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (gamification.lastMeditationDate === yesterdayStr) {
        newStreak += 1;
      } else if (gamification.lastMeditationDate !== todayStr) {
        newStreak = 1;
      }

      // Mutate state copy
      const updatedGamification = {
        ...gamification,
        meditationStreak: newStreak,
        lastMeditationDate: todayStr
      };

      // Award XP
      const levelUpEvent = awardXP(updatedGamification, sessionXP, `meditation_${activeConfig.durationMinutes}`);
      
      // Save state to store
      saveGamificationState(updatedGamification);
      onGamificationUpdate(updatedGamification);

      if (levelUpEvent) {
        setLevelUp(levelUpEvent);
      }

      // Update analytics
      analytics.track('meditation_completed', {
        attemptId,
        dayNumber,
        durationMinutes: activeConfig.durationMinutes,
        mode: activeConfig.mode,
        xpAwarded: sessionXP,
        meditationStreak: newStreak,
        streakRecovered: isComeback
      });

      analytics.track('mood_logged', {
        moodBefore: null,
        moodAfter: reflection.moodAfter,
        noteAdded: !!reflection.note
      });

      // Call dashboard row trigger completed state
      if (onMeditationLogged) {
        onMeditationLogged(activeConfig.durationMinutes);
      }

      // Complete flow
      if (startSetupDirectly && onClose) {
        // Delay slightly if levelUp is not active, else let user dismiss levelUp
        if (!levelUpEvent) {
          onClose();
        }
      } else {
        setViewState('dashboard');
      }

    } catch (e) {
      console.error('Error committing meditation reflection logs:', e);
      setViewState('dashboard');
    }
  };

  // Stat calculations
  const totalResets = logs.length;
  const totalMinutes = Math.round(logs.reduce((sum, log) => sum + (log.durationSeconds || 0), 0) / 60);

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'stressed': return '😫';
      case 'neutral': return '😐';
      case 'calm': return '😌';
      case 'focused': return '🎯';
      case 'energized': return '⚡';
      default: return '🧘';
    }
  };

  const getModeLabel = (modeKey: string) => {
    switch (modeKey) {
      case 'breath': return 'Breath Focus';
      case 'focus': return 'Focus Reset';
      case 'body': return 'Body Scan';
      case 'sleep': return 'Sleep Wind-down';
      case 'preworkout': return 'Pre-Workout';
      default: return 'Mind Reset';
    }
  };

  // Sub-navigation render routers
  if (viewState === 'setup') {
    return (
      <MeditationSetup
        onStart={handleStartSession}
        onClose={onClose || (() => setViewState('dashboard'))}
        meditationStreak={gamification.meditationStreak || 0}
        isComeback={isComeback}
        overallMultiplier={overallMult}
      />
    );
  }

  if (viewState === 'session') {
    return activeConfig ? (
      <MeditationSession
        durationMinutes={activeConfig.durationMinutes}
        mode={activeConfig.mode}
        guided={activeConfig.guided}
        soundSetting={activeConfig.soundSetting}
        soundVolume={activeConfig.soundVolume}
        onComplete={handleSessionComplete}
        onAbandon={handleSessionAbandon}
      />
    ) : null;
  }

  if (viewState === 'reflection') {
    return (
      <>
        <MeditationReflection
          onSave={handleSaveReflection}
          xpAwarded={sessionXP}
        />
        {levelUp && (
          <div className="ios-drawer-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 }}>
            <div style={{ width: '85%', maxWidth: '340px', background: '#121214', border: '1px solid rgba(99, 226, 183, 0.3)', borderRadius: '14px', padding: '24px', textAlign: 'center', boxShadow: '0 15px 40px rgba(99,226,183,0.15)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(99, 226, 183, 0.15)', color: 'var(--color-calm-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Award size={32} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>LEVEL UP!</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                You reached <span style={{ color: 'var(--color-calm-teal)', fontWeight: 700 }}>Level {levelUp.newLevel}</span>
              </p>
              <div style={{ margin: '16px 0', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-calm-teal)' }}>{levelUp.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Unlocked: {levelUp.unlock}</div>
              </div>
              <button
                onClick={() => {
                  setLevelUp(null);
                  if (startSetupDirectly && onClose) {
                    onClose();
                  } else {
                    setViewState('dashboard');
                  }
                }}
                style={{ width: '100%', height: '40px', borderRadius: '8px', border: 'none', background: 'var(--color-calm-teal)', color: '#000', fontWeight: 800, cursor: 'pointer' }}
              >
                DISMISS
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Dashboard Page view
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '100%', background: '#08080a', overflowY: 'auto' }}>
      
      {/* Tab Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '0.02em' }}>
            Mindfulness Training
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
            Train your mind. Unlock athletic mental stamina.
          </p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Grid: Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <div className="ios-card text-center" style={{ padding: '12px 6px', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-calm-teal)' }}>
            {gamification.meditationStreak || 0}
          </div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '4px' }}>
            Med Streak
          </div>
        </div>

        <div className="ios-card text-center" style={{ padding: '12px 6px', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>
            {totalResets}
          </div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '4px' }}>
            Total Resets
          </div>
        </div>

        <div className="ios-card text-center" style={{ padding: '12px 6px', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>
            {totalMinutes}m
          </div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '4px' }}>
            Total Focus
          </div>
        </div>
      </div>

      {/* Main CTA: Quick Reset Card */}
      <div 
        className="ios-card meditation-glow-card animate-hover" 
        style={{ 
          background: 'linear-gradient(135deg, rgba(99, 226, 183, 0.12) 0%, rgba(99, 226, 183, 0.02) 100%)', 
          border: '1px solid rgba(99, 226, 183, 0.25)', 
          padding: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(99, 226, 183, 0.15)', color: 'var(--color-calm-teal)', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>
              Low-Friction Habit
            </span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginTop: '8px' }}>
              Quick 2-Minute Reset
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px', maxWidth: '85%' }}>
              Lock in visual box breathing to anchor focus and recover autonomic control.
            </p>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 226, 183, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-calm-teal)' }}>
            <Wind size={20} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={handleQuickReset}
            style={{
              flex: '2',
              height: '42px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--color-calm-teal)',
              color: '#000000',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-glow-calm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Play size={12} fill="#000" />
            START RESET (+10 XP)
          </button>
          
          <button
            onClick={() => setViewState('setup')}
            style={{
              flex: '1',
              height: '42px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
              color: '#fff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Plus size={14} />
            CUSTOM
          </button>
        </div>
      </div>

      {/* History Log Title */}
      <div>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <History size={15} />
          Conditioning Logs
        </h3>

        {loadingLogs ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            Retrieving local telemetry logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              No conditioning logs captured on this attempt yet.
            </p>
            <button
              onClick={() => setViewState('setup')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--color-calm-teal)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}
            >
              Start custom reset <Plus size={12} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {logs.slice().reverse().map((logItem) => (
              <div 
                key={logItem.id} 
                className="ios-card"
                style={{ 
                  padding: '12px 14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: '12px',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.002) 100%)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexGrow: 1 }}>
                  <div style={{ fontSize: '1.25rem', width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                    {getMoodEmoji(logItem.moodAfter)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {getModeLabel(logItem.mode)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <Clock size={10} />
                        {Math.round(logItem.durationSeconds / 60)}m
                      </span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <Calendar size={10} />
                        Day {logItem.dayNumber} ({logItem.date})
                      </span>
                    </div>
                    {logItem.note && (
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '6px', borderLeft: '1.5px solid var(--color-calm-teal)', paddingLeft: '6px', fontStyle: 'italic' }}>
                        "{logItem.note}"
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--color-calm-teal)', background: 'rgba(99, 226, 183, 0.08)', padding: '4px 8px', borderRadius: '6px', fontWeight: 800 }}>
                  +{logItem.xpAwarded} XP
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
