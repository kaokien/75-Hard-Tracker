import React, { useState, useEffect } from 'react';
import { Flame, ChevronRight, Check, Dumbbell, Sun, Footprints, Droplet, Utensils, Moon, BookOpen, Camera, Target, Zap, Sparkles, Award } from 'lucide-react';
import { analytics } from '../analytics';

interface OnboardingProps {
  onComplete: (data: {
    name: string;
    startDate: string;
    waterGoal: number;
    why: string;
    pledge: string;
  }) => void;
  defaultName: string;
}

const TASK_CARDS = [
  { icon: Dumbbell, title: 'Workout 1', desc: '45 minutes, any style', color: '#ff2d55' },
  { icon: Sun, title: 'Workout 2 (Outdoor)', desc: '45 minutes under open sky', color: '#ff9f0a' },
  { icon: Footprints, title: '10,000 Steps', desc: 'Daily movement baseline', color: '#30d158' },
  { icon: Droplet, title: 'Drink 1 Gallon', desc: 'Hydration target', color: '#0a84ff' },
  { icon: Utensils, title: 'Follow a Diet', desc: 'Zero cheat meals, zero alcohol', color: '#ff375f' },
  { icon: Moon, title: 'Sleep 8 Hours', desc: 'Recovery is training', color: '#5e5ce6' },
  { icon: BookOpen, title: 'Read 10 Pages', desc: 'Non-fiction, self-improvement', color: '#bf5af2' },
  { icon: Camera, title: 'Progress Photo', desc: 'Daily visual record', color: '#64d2ff' },
];

const WHY_OPTIONS = [
  { emoji: '🧠', label: 'Mental Toughness' },
  { emoji: '💪', label: 'Physical Transformation' },
  { emoji: '🏆', label: 'Prove Something To Myself' },
  { emoji: '🔥', label: 'Build Discipline' },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, defaultName }) => {
  const [screen, setScreen] = useState(0);
  const [name, setName] = useState(defaultName || '');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [waterGoal, setWaterGoal] = useState(3785);
  const [why, setWhy] = useState('');
  const [customWhy, setCustomWhy] = useState('');
  const [pledgeChecked, setPledgeChecked] = useState(false);
  const [taskCardIndex, setTaskCardIndex] = useState(0);
  const startTime = useState(() => Date.now())[0];

  useEffect(() => {
    analytics.onboardingStarted();
  }, []);

  useEffect(() => {
    const screenNames = ['splash', 'what_is', 'tasks', 'why_fail', 'commitment', 'profile', 'choose_why', 'first_xp'];
    if (screen < screenNames.length) {
      analytics.onboardingScreenViewed(screen, screenNames[screen]);
    }
  }, [screen]);

  const next = () => setScreen(s => s + 1);

  const handleComplete = () => {
    const finalWhy = why === 'custom' ? customWhy : why;
    analytics.onboardingCompleted(Date.now() - startTime);
    if (finalWhy) analytics.whySelected(finalWhy, why === 'custom');
    analytics.commitmentSigned(name.length);
    onComplete({
      name: name || 'Athlete',
      startDate,
      waterGoal,
      why: finalWhy,
      pledge: name,
    });
  };

  // Auto-advance splash
  useEffect(() => {
    if (screen === 0) {
      const t = setTimeout(next, 2500);
      return () => clearTimeout(t);
    }
  }, [screen]);

  // ─── Screen 0: Splash ───
  if (screen === 0) {
    return (
      <div className="onb-screen onb-splash" onClick={next}>
        <div className="onb-splash-flame">
          <Flame size={72} fill="#ff2d55" strokeWidth={0} />
        </div>
        <h1 className="onb-splash-title">75 HARD</h1>
        <p className="onb-splash-sub">The Mental Toughness Program</p>
      </div>
    );
  }

  // ─── Screen 1: What Is 75 Hard? ───
  if (screen === 1) {
    return (
      <div className="onb-screen">
        <div className="onb-dots">{renderDots(0, 4)}</div>
        <div className="onb-content">
          <h2 className="onb-heading">75 Days. Zero Compromises.</h2>
          <p className="onb-body">
            75 Hard isn't a fitness program. It's a <strong>mental toughness challenge</strong> designed by Andy Frisella.
            Complete 8 daily tasks for 75 consecutive days. Miss one? Start over from Day 1.
          </p>
          <div className="onb-counter">
            <span className="onb-counter-num">75</span>
            <span className="onb-counter-label">DAYS</span>
          </div>
        </div>
        <button className="ios-btn ios-btn-primary onb-cta" onClick={next}>
          Show Me The Tasks <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  // ─── Screen 2: The 8 Tasks Carousel ───
  if (screen === 2) {
    const card = TASK_CARDS[taskCardIndex];
    const Icon = card.icon;
    return (
      <div className="onb-screen">
        <div className="onb-dots">{renderDots(1, 4)}</div>
        <div className="onb-content">
          <div className="onb-task-counter">Task {taskCardIndex + 1} of 8</div>
          <div className="onb-task-card" style={{ borderColor: card.color + '40' }}>
            <div className="onb-task-icon" style={{ background: card.color + '20', color: card.color }}>
              <Icon size={32} />
            </div>
            <h3 className="onb-task-title">{card.title}</h3>
            <p className="onb-task-desc">{card.desc}</p>
          </div>
          <div className="onb-task-nav">
            {taskCardIndex > 0 && (
              <button className="ios-btn ios-btn-secondary" style={{ flex: 0.4 }}
                onClick={() => setTaskCardIndex(i => i - 1)}>
                ← Back
              </button>
            )}
            {taskCardIndex < 7 ? (
              <button className="ios-btn ios-btn-primary" style={{ flex: 1 }}
                onClick={() => {
                  setTaskCardIndex(i => i + 1);
                }}>
                Next Task <ChevronRight size={16} />
              </button>
            ) : (
              <button className="ios-btn ios-btn-primary" style={{ flex: 1 }}
                onClick={() => { next(); }}>
                Got It, All 8 <Check size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Screen 3: Why Most People Fail ───
  if (screen === 3) {
    return (
      <div className="onb-screen">
        <div className="onb-dots">{renderDots(2, 4)}</div>
        <div className="onb-content">
          <h2 className="onb-heading" style={{ fontSize: '2rem' }}>
            92% quit before Day 30.
          </h2>
          <p className="onb-body">
            Not because it's physically impossible. Because they have no system, no tracking, and no accountability.
            <strong> This app is your system.</strong>
          </p>
          <div className="onb-stats-grid">
            <div className="onb-stat-card">
              <span className="onb-stat-value">Day 19</span>
              <span className="onb-stat-label">Average quit day</span>
            </div>
            <div className="onb-stat-card">
              <span className="onb-stat-value">#1</span>
              <span className="onb-stat-label">"Forgot a task"</span>
            </div>
          </div>
          <div className="onb-success-bar">
            <div className="onb-success-fill" />
            <span className="onb-success-text">You will be in the 8%</span>
          </div>
        </div>
        <button className="ios-btn ios-btn-primary onb-cta" onClick={next}>
          I'm Ready <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  // ─── Screen 4: Commitment Moment ───
  if (screen === 4) {
    return (
      <div className="onb-screen onb-commitment">
        <div className="onb-dots">{renderDots(3, 4)}</div>
        <div className="onb-content">
          <div className="onb-pledge-card">
            <Sparkles size={28} style={{ color: 'var(--color-orange)', marginBottom: '12px' }} />
            <h2 className="onb-heading" style={{ fontSize: '1.4rem' }}>Make Your Pledge</h2>
            <p className="onb-pledge-text">
              I commit to completing all 8 daily tasks for 75 consecutive days.
              I understand that missing even one task means starting over.
              I choose discipline over comfort.
            </p>
            <input
              type="text"
              className="ios-input onb-pledge-input"
              placeholder="Sign your name here"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
            <label className="onb-pledge-checkbox" onClick={() => setPledgeChecked(v => !v)}>
              <div className={`ios-checkbox ${pledgeChecked ? 'checked-move' : ''}`} style={{ width: 22, height: 22 }}>
                {pledgeChecked && <Check size={14} />}
              </div>
              <span>I accept that this will be hard. That's the point.</span>
            </label>
          </div>
        </div>
        <button
          className="ios-btn ios-btn-primary onb-cta"
          disabled={!name.trim() || !pledgeChecked}
          style={{ opacity: name.trim() && pledgeChecked ? 1 : 0.4 }}
          onClick={next}
        >
          I Pledge — Let's Begin <Flame size={16} />
        </button>
      </div>
    );
  }

  // ─── Screen 5: Profile Setup ───
  if (screen === 5) {
    return (
      <div className="onb-screen">
        <div className="onb-content">
          <h2 className="onb-heading">Quick Setup</h2>
          <p className="onb-body" style={{ marginBottom: '20px' }}>30 seconds, then you're in.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="ios-form-label">Athlete Name</label>
              <input type="text" className="ios-input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="ios-form-label">Challenge Start Date</label>
              <input type="date" className="ios-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="ios-form-label">Daily Hydration Target</label>
              <select className="ios-input" value={waterGoal} onChange={e => setWaterGoal(parseInt(e.target.value))} style={{ height: '46px' }}>
                <option value={3785}>1 Gallon (3,785 ml)</option>
                <option value={4000}>4.0 Liters</option>
                <option value={3500}>3.5 Liters</option>
                <option value={3000}>3.0 Liters</option>
              </select>
            </div>
          </div>
        </div>
        <button className="ios-btn ios-btn-primary onb-cta" onClick={next}>
          Create My Chronicle <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  // ─── Screen 6: Choose Your Why ───
  if (screen === 6) {
    return (
      <div className="onb-screen">
        <div className="onb-content">
          <Target size={28} style={{ color: 'var(--color-recovery-ring)', marginBottom: '8px' }} />
          <h2 className="onb-heading">What's driving you?</h2>
          <p className="onb-body" style={{ marginBottom: '16px' }}>We'll remind you on tough days.</p>

          <div className="onb-why-grid">
            {WHY_OPTIONS.map(opt => (
              <button
                key={opt.label}
                className={`onb-why-pill ${why === opt.label ? 'selected' : ''}`}
                onClick={() => setWhy(opt.label)}
              >
                <span>{opt.emoji}</span> {opt.label}
              </button>
            ))}
            <button
              className={`onb-why-pill ${why === 'custom' ? 'selected' : ''}`}
              onClick={() => setWhy('custom')}
            >
              ✍️ Custom...
            </button>
          </div>

          {why === 'custom' && (
            <input
              type="text"
              className="ios-input"
              placeholder="What's your reason?"
              value={customWhy}
              onChange={e => setCustomWhy(e.target.value)}
              autoFocus
              style={{ marginTop: '12px' }}
            />
          )}
        </div>
        <button
          className="ios-btn ios-btn-primary onb-cta"
          disabled={!why || (why === 'custom' && !customWhy.trim())}
          style={{ opacity: why && (why !== 'custom' || customWhy.trim()) ? 1 : 0.4 }}
          onClick={next}
        >
          Lock It In <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  // ─── Screen 7: First XP Earned ───
  if (screen === 7) {
    return (
      <div className="onb-screen onb-xp-screen">
        <div className="onb-content" style={{ textAlign: 'center' }}>
          <div className="onb-xp-burst">
            <Zap size={48} fill="var(--color-orange)" strokeWidth={0} />
          </div>
          <div className="onb-xp-amount">+75 XP</div>
          <h2 className="onb-heading">You're already ahead.</h2>
          <p className="onb-body">
            75 XP earned just for showing up. Most people never even start. You're already in the top 8%.
          </p>

          <div className="onb-xp-bar-demo">
            <div className="onb-xp-bar-label">
              <span>Level 1 — Recruit</span>
              <span>75 / 200 XP</span>
            </div>
            <div className="xp-bar-track">
              <div className="xp-bar-fill" style={{ width: '37.5%', transition: 'width 1.5s var(--ease-out-expo)' }} />
            </div>
          </div>

          <div className="onb-badge-demo">
            <Award size={32} style={{ color: '#ff9f0a' }} />
            <span>RECRUIT</span>
          </div>
        </div>
        <button className="ios-btn ios-btn-primary onb-cta" onClick={handleComplete}
          style={{ background: 'linear-gradient(90deg, #30d158, #5de882)' }}>
          Let's Crush Day 1 <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  return null;
};

// ─── Helper ───
function renderDots(active: number, total: number) {
  return (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '20px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === active ? '20px' : '6px',
          height: '6px',
          borderRadius: '3px',
          background: i === active ? 'var(--color-move-ring)' : 'rgba(255,255,255,0.15)',
          transition: 'all 0.3s ease',
        }} />
      ))}
    </div>
  );
}
