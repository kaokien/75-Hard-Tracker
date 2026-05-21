import React from 'react';
import { Zap, Flame, Snowflake } from 'lucide-react';
import { getLevelProgress, getLevelFromXP, LEVELS } from '../gamification';

interface XPBarProps {
  totalXP: number;
  streak: number;
  streakMult: number;
  streakFreezes: number;
  compact?: boolean;
}

export const XPBar: React.FC<XPBarProps> = ({ totalXP, streak, streakMult, streakFreezes, compact = false }) => {
  const level = getLevelFromXP(totalXP);
  const progress = getLevelProgress(totalXP);
  const nextLevel = LEVELS.find(l => l.level === level.level + 1);

  if (compact) {
    return (
      <div className="xp-bar-compact">
        <div className="xp-bar-level-badge-sm">
          <Zap size={10} fill="var(--color-orange)" strokeWidth={0} />
          <span>{level.level}</span>
        </div>
        <div className="xp-bar-track-sm">
          <div className="xp-bar-fill-sm" style={{ width: `${progress.percent}%` }} />
        </div>
        {streak > 0 && (
          <div className="xp-bar-streak-sm">
            <Flame size={10} fill="var(--color-move-ring)" strokeWidth={0} />
            <span>{streak}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="xp-bar-full">
      <div className="xp-bar-top-row">
        <div className="xp-bar-level-badge">
          <Zap size={14} fill="var(--color-orange)" strokeWidth={0} />
          <span className="xp-bar-level-num">Lv.{level.level}</span>
          <span className="xp-bar-level-title">{level.title}</span>
        </div>
        <div className="xp-bar-xp-text">
          {totalXP.toLocaleString()} XP
        </div>
      </div>

      <div className="xp-bar-track">
        <div className="xp-bar-fill" style={{ width: `${progress.percent}%` }} />
      </div>

      <div className="xp-bar-bottom-row">
        <span className="xp-bar-progress-text">
          {nextLevel ? `${progress.current} / ${progress.max} to Level ${nextLevel.level}` : 'MAX LEVEL'}
        </span>
        <div className="xp-bar-meta">
          {streak > 0 && (
            <div className="xp-bar-streak-pill">
              <Flame size={12} fill="var(--color-move-ring)" strokeWidth={0} />
              <span>{streak}d</span>
              {streakMult > 1 && <span className="xp-bar-mult">×{streakMult.toFixed(1)}</span>}
            </div>
          )}
          {streakFreezes > 0 && (
            <div className="xp-bar-freeze-pill">
              <Snowflake size={12} />
              <span>{streakFreezes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
