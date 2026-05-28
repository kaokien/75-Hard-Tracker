import React, { useEffect, useState } from 'react';
import { Award, TrendingUp, Zap, Star } from 'lucide-react';
import type { LevelUpEvent } from '../gamification';

// ─── XP Pill (floats up and fades) ───

interface XPPillProps {
  amount: number;
  source: string;
  visible: boolean;
  onDone: () => void;
}

export const XPPill: React.FC<XPPillProps> = ({ amount, visible, onDone }) => {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onDone, 1800);
      return () => clearTimeout(t);
    }
  }, [visible, onDone]);

  if (!visible || amount <= 0) return null;

  return (
    <div className="xp-pill-float" role="status" aria-live="polite" aria-label={`Plus ${amount * 10} aura points earned`}>
      <Zap size={14} fill="var(--color-orange)" strokeWidth={0} />
      <span>+{amount * 10} AURA</span>
    </div>
  );
};

// ─── XP Toast (bottom notification with XP details) ───

interface XPToastProps {
  message: string;
  xp: number;
  visible: boolean;
  onDone: () => void;
}

export const XPToast: React.FC<XPToastProps> = ({ message, xp, visible, onDone }) => {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onDone, 3000);
      return () => clearTimeout(t);
    }
  }, [visible, onDone]);

  return (
    <div className={`xp-toast ${visible ? 'visible' : ''}`} role="alert" aria-live="polite">
      <div className="xp-toast-icon">
        <Star size={18} fill="var(--color-orange)" strokeWidth={0} />
      </div>
      <div className="xp-toast-content">
        <span className="xp-toast-msg">{message}</span>
        {xp > 0 && <span className="xp-toast-amount">+{xp * 10} AURA</span>}
      </div>
    </div>
  );
};

// ─── Level Up Overlay ───

interface LevelUpOverlayProps {
  event: LevelUpEvent | null;
  onDismiss: () => void;
}

export const LevelUpOverlay: React.FC<LevelUpOverlayProps> = ({ event, onDismiss }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (event) {
      setShow(true);
      const t = setTimeout(() => { setShow(false); onDismiss(); }, 4000);
      return () => clearTimeout(t);
    }
  }, [event, onDismiss]);

  if (!event || !show) return null;

  return (
    <div className="level-up-overlay" onClick={onDismiss} role="dialog" aria-modal="true" aria-label={`Level up! You reached level ${event.newLevel}, ${event.title}`}>
      <div className="level-up-card" onClick={e => e.stopPropagation()}>
        <div className="level-up-icon-ring">
          <TrendingUp size={32} />
        </div>
        <div className="level-up-label">LIMIT BREAK 💥</div>
        <div className="level-up-number">
          Aura Rank {event.newLevel}
        </div>
        <div className="level-up-title">{event.title}</div>
        <div className="level-up-unlock">
          <Award size={14} /> Unlocked: {event.unlock}
        </div>
        <button className="ios-btn ios-btn-primary" style={{ marginTop: '16px', width: '100%' }} onClick={onDismiss}>
          Continue
        </button>
      </div>
    </div>
  );
};

// ─── Perfect Day Celebration ───

interface PerfectDayCelebrationProps {
  dayNumber: number;
  xpEarned: number;
  streak: number;
  visible: boolean;
  onDismiss: () => void;
}

export const PerfectDayCelebration: React.FC<PerfectDayCelebrationProps> = ({ dayNumber, xpEarned, streak, visible, onDismiss }) => {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onDismiss, 6000);
      return () => clearTimeout(t);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div className="celebration-overlay" onClick={onDismiss} role="dialog" aria-modal="true" aria-label={`Perfect Day ${dayNumber}! You earned ${xpEarned} XP with a ${streak} day streak`}>
      <div className="celebration-card" onClick={e => e.stopPropagation()}>
        {/* Confetti particles */}
        <div className="confetti-container">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="confetti-particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                backgroundColor: ['#ff2d55', '#30d158', '#0a84ff', '#ff9f0a', '#bf5af2', '#5de882'][i % 6],
              }}
            />
          ))}
        </div>

        <div className="celebration-emoji">🏆</div>
        <div className="celebration-title">TRAINING ARC DAY {dayNumber} CLEARED ⚔️</div>
        <div className="celebration-subtitle">
          92% of people folded. You did not. Absolute boss behavior, fr fr.
        </div>

        <div className="celebration-stats">
          <div className="celebration-stat">
            <span className="celebration-stat-value">+{xpEarned * 10}</span>
            <span className="celebration-stat-label">AURA GAINED</span>
          </div>
          <div className="celebration-stat-divider" />
          <div className="celebration-stat">
            <span className="celebration-stat-value">{streak}</span>
            <span className="celebration-stat-label">Day Streak</span>
          </div>
        </div>

        <button className="ios-btn ios-btn-primary" style={{ marginTop: '20px', width: '100%', background: 'linear-gradient(90deg, #30d158, #5de882)' }} onClick={onDismiss}>
          {dayNumber === 75 ? 'You Are Immortal' : 'Nah, I\'d Win Tomorrow 🤫'}
        </button>
      </div>
    </div>
  );
};

// ─── Badge Unlock Overlay ───

interface BadgeUnlockProps {
  badgeTitle: string;
  badgeDay: number;
  visible: boolean;
  onDismiss: () => void;
}

export const BadgeUnlock: React.FC<BadgeUnlockProps> = ({ badgeTitle, badgeDay, visible, onDismiss }) => {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onDismiss, 3500);
      return () => clearTimeout(t);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div className="badge-unlock-overlay" onClick={onDismiss} role="dialog" aria-modal="true" aria-label={`Badge unlocked: ${badgeTitle}, Day ${badgeDay} milestone achieved`}>
      <div className="badge-unlock-card">
        <div className="badge-unlock-glow" />
        <Award size={48} style={{ color: '#ff9f0a', filter: 'drop-shadow(0 0 12px rgba(255,159,10,0.6))' }} />
        <div className="badge-unlock-title">🎖️ {badgeTitle.toUpperCase()}</div>
        <div className="badge-unlock-subtitle">Day {badgeDay} Milestone Achieved</div>
        <div className="badge-unlock-footer">Only forward from here.</div>
      </div>
    </div>
  );
};
