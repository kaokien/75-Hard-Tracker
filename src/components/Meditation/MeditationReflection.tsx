import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface MeditationReflectionProps {
  onSave: (reflection: {
    moodAfter: 'stressed' | 'neutral' | 'calm' | 'focused' | 'energized';
    note: string | null;
  }) => void;
  xpAwarded: number;
}

const MOODS = [
  { id: 'stressed', label: 'Stressed', icon: '😫' },
  { id: 'neutral', label: 'Neutral', icon: '😐' },
  { id: 'calm', label: 'Calm', icon: '😌' },
  { id: 'focused', label: 'Focused', icon: '🎯' },
  { id: 'energized', label: 'Energized', icon: '⚡' }
] as const;

export const MeditationReflection: React.FC<MeditationReflectionProps> = ({
  onSave,
  xpAwarded
}) => {
  const [mood, setMood] = useState<typeof MOODS[number]['id']>('calm');
  const [note, setNote] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(15);

  // Auto-submit countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Auto save on timeout
      onSave({ moodAfter: mood, note: note.trim() || null });
    }
  }, [countdown, mood, note, onSave]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSave({ moodAfter: mood, note: note.trim() || null });
  };

  return (
    <div 
      className="meditation-immersive-layer" 
      style={{ justifyContent: 'center', gap: '24px' }}
    >
      {/* Celebration Header */}
      <div style={{ textAlign: 'center', maxWidth: '380px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 226, 183, 0.15)', color: 'var(--color-calm-teal)', fontSize: '0.8rem', fontWeight: 800, padding: '4px 12px', borderRadius: '12px', marginBottom: '14px', border: '1px solid rgba(99, 226, 183, 0.2)' }}>
          <Sparkles size={12} fill="var(--color-calm-teal)" />
          RESET COMPLETE (+{xpAwarded} XP)
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Log Your State
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '6px' }}>
          Jot down a quick baseline. Saves automatically in <span style={{ color: 'var(--color-calm-teal)', fontWeight: 700 }}>{countdown}s</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Mood Selection Grid */}
        <div>
          <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '10px', textAlign: 'center' }}>
            Current Mental State
          </h3>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
            {MOODS.map((item) => {
              const active = mood === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setMood(item.id)}
                  style={{
                    flex: '1',
                    height: '64px',
                    borderRadius: '10px',
                    border: active ? '1px solid var(--color-calm-teal)' : '1px solid rgba(255,255,255,0.06)',
                    background: active ? 'rgba(99, 226, 183, 0.1)' : 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: active ? 'var(--shadow-glow-calm)' : 'none'
                  }}
                  aria-pressed={active}
                >
                  <span style={{ fontSize: '1.3rem' }} role="img" aria-label={item.label}>
                    {item.icon}
                  </span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: active ? 'var(--color-calm-teal)' : 'var(--text-secondary)' }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Note Textarea */}
        <div>
          <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Reflection Notes (Optional)
          </h3>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 140))} // limit to 140 characters
            placeholder="Jot down a quick thought (max 140 chars)..."
            style={{
              width: '100%',
              height: '80px',
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-calm-teal)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {note.length}/140
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          style={{
            width: '100%',
            height: '46px',
            borderRadius: '10px',
            border: 'none',
            background: 'var(--color-calm-teal)',
            color: '#000000',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.9rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-glow-calm)',
            transition: 'transform 0.15s ease'
          }}
        >
          LOCK IN STATE
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
};
