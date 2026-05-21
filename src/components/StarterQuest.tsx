import React, { useState } from 'react';
import { Flame, Check, Lock, ChevronRight, Award } from 'lucide-react';
import type { StarterQuestState } from '../gamification';
import { countCompletedQuests } from '../gamification';

interface StarterQuestProps {
  questState: StarterQuestState;
  visible: boolean;
}

const QUESTS = [
  { id: 'q1_firstTask', name: 'First Blood', desc: 'Complete any 1 task', xp: 25 },
  { id: 'q2_threeTasks', name: 'Building Momentum', desc: 'Complete 3 different tasks', xp: 50 },
  { id: 'q3_perfectDay', name: 'The Full Eight', desc: 'Complete ALL 8 tasks', xp: 200 },
  { id: 'q4_journal', name: 'Reflect & Record', desc: 'Write a journal entry (min 20 chars)', xp: 25 },
  { id: 'q5_photo', name: 'Visual Proof', desc: 'Take your first progress photo', xp: 25 },
];

export const StarterQuestFAB: React.FC<StarterQuestProps> = ({ questState, visible }) => {
  const [isOpen, setIsOpen] = useState(false);
  const completed = countCompletedQuests(questState);

  if (!visible || questState.chainComplete) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        className="quest-fab"
        onClick={() => setIsOpen(true)}
        aria-label="Starter Quests"
      >
        <Flame size={18} fill="#fff" strokeWidth={0} />
        <span className="quest-fab-count">{completed}/5</span>
      </button>

      {/* Quest Sheet */}
      {isOpen && (
        <div className="ios-bottom-sheet-overlay" onClick={() => setIsOpen(false)}>
          <div className="ios-bottom-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh' }}>
            <div className="ios-bottom-sheet-handle" />

            <div style={{ padding: '8px 4px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <Flame size={22} fill="var(--color-orange)" strokeWidth={0} />
                <h3 className="ios-title" style={{ fontSize: '1.1rem', margin: 0 }}>Starter Quest: Ignition Protocol</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '6px 0 16px' }}>
                Complete all 5 quests to unlock the <strong style={{ color: 'var(--color-orange)' }}>Ignition Badge</strong> 🔥
              </p>

              {/* Progress bar */}
              <div className="quest-progress-track">
                <div className="quest-progress-fill" style={{ width: `${(completed / 5) * 100}%` }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                {completed}/5 complete
              </div>

              {/* Quest list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                {QUESTS.map(q => {
                  const done = questState[q.id as keyof StarterQuestState] as boolean;
                  return (
                    <div key={q.id} className={`quest-item ${done ? 'quest-done' : ''}`}>
                      <div className={`quest-check ${done ? 'checked' : ''}`}>
                        {done ? <Check size={14} /> : <Lock size={10} />}
                      </div>
                      <div className="quest-info">
                        <span className="quest-name">{q.name}</span>
                        <span className="quest-desc">{q.desc}</span>
                      </div>
                      <div className="quest-xp">
                        {done ? (
                          <span style={{ color: 'var(--color-exercise-ring)', fontWeight: 700 }}>✓ +{q.xp}</span>
                        ) : (
                          <span>+{q.xp} XP</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Chain bonus */}
                <div className={`quest-item quest-chain ${questState.chainComplete ? 'quest-done' : ''}`}>
                  <div className={`quest-check chain-check ${questState.chainComplete ? 'checked' : ''}`}>
                    {questState.chainComplete ? <Award size={14} /> : <Award size={12} />}
                  </div>
                  <div className="quest-info">
                    <span className="quest-name" style={{ color: 'var(--color-orange)' }}>Chain Bonus: Ignition Badge</span>
                    <span className="quest-desc">Complete all 5 quests above</span>
                  </div>
                  <div className="quest-xp">+100 XP</div>
                </div>
              </div>

              <button
                className="ios-btn ios-btn-secondary"
                style={{ marginTop: '16px' }}
                onClick={() => setIsOpen(false)}
              >
                <ChevronRight size={16} /> Keep Going
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
