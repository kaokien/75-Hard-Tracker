import React, { useState } from 'react';
import { 
  X, 
  Wind, 
  Zap, 
  Eye, 
  Moon, 
  Flame, 
  Volume2, 
  VolumeX, 
  Play, 
  Sparkles, 
  FlameKindling
} from 'lucide-react';
import { calcMeditationMultiplier, MEDITATION_XP, BONUS_XP } from '../../gamification';

interface MeditationSetupProps {
  onStart: (config: {
    durationMinutes: number;
    mode: 'breath' | 'focus' | 'body' | 'sleep' | 'preworkout';
    guided: boolean;
    soundSetting: 'none' | 'rain' | 'ocean' | 'stream' | 'white';
    soundVolume: number;
  }) => void;
  onClose: () => void;
  meditationStreak: number;
  isComeback: boolean;
  overallMultiplier: number;
}

const MODES = [
  { id: 'breath', title: 'Breath Focus', desc: 'Box breathing (4-4-4-4) to oxygenate blood & calm nerves', icon: Wind },
  { id: 'focus', title: 'Focus Reset', desc: 'Single-point visual training to lock in absolute mental drive', icon: Zap },
  { id: 'body', title: 'Body Scan', desc: 'Deep muscle tension release to scan and accelerate recovery', icon: Sparkles },
  { id: 'sleep', title: 'Sleep Wind-down', desc: 'Extended exhalation pacing to shift into high parasympathetic rest', icon: Moon },
  { id: 'preworkout', title: 'Pre-Workout Calm', desc: 'Hyper-focused controlled breathing to activate athletic flow state', icon: Flame }
] as const;

const DURATIONS = [2, 5, 10, 15, 20];

const SOUNDS = [
  { id: 'none', title: 'Silence' },
  { id: 'ocean', title: 'Ocean Wind' },
  { id: 'rain', title: 'Deep Rain' },
  { id: 'white', title: 'White Noise' }
] as const;

export const MeditationSetup: React.FC<MeditationSetupProps> = ({
  onStart,
  onClose,
  meditationStreak,
  isComeback,
  overallMultiplier
}) => {
  const [duration, setDuration] = useState<number>(2);
  const [mode, setMode] = useState<typeof MODES[number]['id']>('breath');
  const [guided, setGuided] = useState<boolean>(true);
  const [soundSetting, setSoundSetting] = useState<typeof SOUNDS[number]['id']>('ocean');
  const [soundVolume, setSoundVolume] = useState<number>(40);

  const medMult = calcMeditationMultiplier(meditationStreak);
  const baseXP = MEDITATION_XP[`len${duration}`] || 10;
  const projectedXP = Math.round(baseXP * overallMultiplier * medMult) + (isComeback ? BONUS_XP.meditationComeback : 0);

  return (
    <div 
      className="ios-drawer-overlay" 
      style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div 
        className="ios-drawer-content" 
        style={{ 
          maxHeight: '92vh', 
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #121214 0%, #08080a 100%)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 -20px 40px rgba(0,0,0,0.8)'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="med-setup-title"
      >
        {/* Drawer Drag Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 12px' }}>
          <div style={{ width: '36px', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 id="med-setup-title" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Mind Reset <span style={{ color: 'var(--color-calm-teal)', fontSize: '0.9rem', border: '1px solid rgba(99, 226, 183, 0.25)', padding: '2px 8px', borderRadius: '12px', background: 'rgba(99, 226, 183, 0.05)' }}>RECOVERY</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
              "The disciplined mind governs the relentless body."
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
            aria-label="Close setup panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Dynamic Streak/Gamification Callout */}
        <div 
          className="meditation-glow-card"
          style={{ 
            background: 'linear-gradient(135deg, rgba(99, 226, 183, 0.12), rgba(99, 226, 183, 0.02))', 
            border: '1px solid rgba(99, 226, 183, 0.25)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FlameKindling size={20} color="var(--color-calm-teal)" />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {meditationStreak > 0 ? `Mindfulness Streak: ${meditationStreak} Days` : 'Conditioning Cycle Active'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Meditation Mult: <span style={{ color: 'var(--color-calm-teal)', fontWeight: 600 }}>{medMult.toFixed(1)}x</span>
                {overallMultiplier > 1.0 && ` • Global Mult: ${overallMultiplier.toFixed(1)}x`}
              </div>
            </div>
          </div>
          {isComeback && (
            <div style={{ background: 'rgba(99, 226, 183, 0.15)', color: 'var(--color-calm-teal)', fontSize: '0.75rem', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(99, 226, 183, 0.2)' }}>
              +50 XP COMEBACK
            </div>
          )}
        </div>

        {/* Section: Duration Selector */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Session Duration
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {DURATIONS.map((dur) => {
              const active = duration === dur;
              return (
                <button
                  key={dur}
                  onClick={() => setDuration(dur)}
                  style={{
                    flex: '1 1 0px',
                    minWidth: '50px',
                    height: '42px',
                    borderRadius: '8px',
                    border: active ? '1px solid var(--color-calm-teal)' : '1px solid rgba(255,255,255,0.06)',
                    background: active ? 'rgba(99, 226, 183, 0.12)' : 'rgba(255,255,255,0.03)',
                    color: active ? 'var(--color-calm-teal)' : 'var(--text-primary)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: active ? 'var(--shadow-glow-calm)' : 'none'
                  }}
                  aria-pressed={active}
                >
                  {dur}m
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Training Mode */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Training Mode
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {MODES.map((item) => {
              const active = mode === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setMode(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '10px',
                    border: active ? '1px solid var(--color-calm-teal)' : '1px solid rgba(255,255,255,0.04)',
                    background: active ? 'rgba(99, 226, 183, 0.06)' : 'rgba(255,255,255,0.01)',
                    color: active ? 'var(--color-calm-teal)' : 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: active ? '0 4px 12px rgba(99, 226, 183, 0.05)' : 'none'
                  }}
                  aria-pressed={active}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: active ? 'rgba(99, 226, 183, 0.15)' : 'rgba(255,255,255,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: active ? 'var(--color-calm-teal)' : 'var(--text-secondary)',
                    flexShrink: 0
                  }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: active ? 'var(--text-primary)' : 'var(--text-primary)' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.25' }}>
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Ambient Audio */}
        <div style={{ marginBottom: '20px', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Ambient Audio Mix
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {soundSetting === 'none' ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{soundSetting === 'none' ? 'Muted' : `${soundVolume}%`}</span>
            </div>
          </div>
          
          {/* Sounds Pills */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            {SOUNDS.map((snd) => {
              const active = soundSetting === snd.id;
              return (
                <button
                  key={snd.id}
                  onClick={() => setSoundSetting(snd.id)}
                  style={{
                    flex: '1 1 0px',
                    height: '32px',
                    borderRadius: '6px',
                    border: 'none',
                    background: active ? 'var(--color-calm-teal)' : 'rgba(255,255,255,0.05)',
                    color: active ? '#000000' : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {snd.title}
                </button>
              );
            })}
          </div>

          {/* Volume Slider */}
          {soundSetting !== 'none' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <VolumeX size={14} color="var(--text-secondary)" />
              <input
                type="range"
                min="0"
                max="100"
                value={soundVolume}
                onChange={(e) => setSoundVolume(parseInt(e.target.value))}
                style={{
                  flexGrow: 1,
                  accentColor: 'var(--color-calm-teal)',
                  height: '4px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
                aria-label="Ambient volume"
              />
              <Volume2 size={14} color="var(--color-calm-teal)" />
            </div>
          )}
        </div>

        {/* Section: Guidance Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Visual Breathing Guide</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Displays real-time breath expanding/holding indicators</div>
          </div>
          <button
            onClick={() => setGuided(!guided)}
            style={{
              width: '54px',
              height: '28px',
              borderRadius: '14px',
              background: guided ? 'var(--color-calm-teal)' : 'rgba(255,255,255,0.1)',
              border: 'none',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            role="switch"
            aria-checked={guided}
          >
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#000000',
              position: 'absolute',
              top: '3px',
              left: guided ? '29px' : '3px',
              transition: 'left 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Eye size={10} color="var(--color-calm-teal)" />
            </div>
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onStart({ durationMinutes: duration, mode, guided, soundSetting, soundVolume })}
          style={{
            width: '100%',
            height: '50px',
            borderRadius: '12px',
            border: 'none',
            background: 'var(--color-calm-teal)',
            color: '#000000',
            fontFamily: 'var(--font-heading)',
            fontSize: '1rem',
            fontWeight: 800,
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, opacity 0.2s ease',
            boxShadow: 'var(--shadow-glow-calm)',
            marginBottom: '10px'
          }}
        >
          <Play size={16} fill="#000000" />
          START MIND RESET (+{projectedXP} XP)
        </button>
      </div>
    </div>
  );
};
