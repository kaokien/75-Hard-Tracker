import React from 'react';
import { X, Brain, Droplet, BookOpen, Dumbbell, ShieldAlert, Award } from 'lucide-react';

interface ScienceExplainerProps {
  onClose: () => void;
}

export const ScienceExplainer: React.FC<ScienceExplainerProps> = ({ onClose }) => {
  return (
    <div 
      className="celebration-overlay" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true" 
      style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div 
        className="ios-card" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          width: 'calc(100% - 32px)', 
          maxWidth: '650px', 
          maxHeight: '85vh', 
          overflowY: 'auto', 
          background: 'rgba(10, 10, 12, 0.92)', 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255,255,255,0.04)',
          borderRadius: '24px',
          padding: '24px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-move-ring)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Brain size={16} /> NEUROBIOLOGY & PHYSIOLOGY
            </div>
            <h2 className="ios-title" style={{ fontSize: '1.8rem', marginTop: '4px', lineHeight: '1.1' }}>
              The Science of the Grind 🧠
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
              Why this training arc shapes your aura and builds permanent discipline, fr fr.
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'rgba(255,255,255,0.06)', 
              border: 'none', 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#fff', 
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Categories grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Section 1: The Core Mechanism */}
          <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
              <Award size={18} style={{ color: 'var(--color-orange)' }} />
              1. Basal Ganglia & The Habit Loop
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Habits are wired in the <strong>basal ganglia</strong>. Standard training relies on motivation (prefrontal cortex), which is energy-expensive and fails when you are tired. 
              By committing to 75 days of <em>zero tolerance</em>, you bypass the "should I or shouldn't I" decision-making fatigue. 
              After ~30 days, tasks transition from conscious efforts to automated circuits.
            </p>
          </div>

          {/* Section 2: Grind (Activity) */}
          <div style={{ padding: '16px', background: 'rgba(255, 0, 127, 0.03)', borderRadius: '14px', border: '1px solid rgba(255, 0, 127, 0.1)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-move-ring)' }}>
              <Dumbbell size={18} />
              2. GRIND: Double Workouts & Boxing Science
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Doing two distinct 45-minute workouts builds physical stamina, but the real benefit is cognitive. The second workout forces you to execute when fatigue has set in, building mental resilience.
              <br /><br />
              <strong>Boxing Conditioning:</strong> Shadowboxing, heavy bag, or mitt drills demand high cognitive-motor coordination (neuro-muscular pathway activation). 
              This increases anaerobic capacity, sharpens spatial awareness, and stimulates BDNF (Brain-Derived Neurotrophic Factor) for rapid learning.
            </p>
          </div>

          {/* Section 3: Fuel */}
          <div style={{ padding: '16px', background: 'rgba(204, 255, 0, 0.03)', borderRadius: '14px', border: '1px solid rgba(204, 255, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-exercise-ring)' }}>
              <Droplet size={18} />
              3. FUEL: Hydration & Nutritional Integrity
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Chugging 3.7+ liters (1 Gallon) of water daily is crucial for cellular volume, maintaining cognitive performance, and joint lubrication. 
              Even a 2% drop in hydration drops focus and physical strength.
              <br /><br />
              <strong>Strict Diet & Zero Cheat Meals:</strong> Eliminating processed sugars and alcohol keeps insulin levels stable, reduces systemic inflammation, and removes the dopamine-seeking habits of emotional eating.
            </p>
          </div>

          {/* Section 4: Mind & Rest */}
          <div style={{ padding: '16px', background: 'rgba(0, 240, 255, 0.03)', borderRadius: '14px', border: '1px solid rgba(0, 240, 255, 0.1)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-recovery-ring)' }}>
              <BookOpen size={18} />
              4. MIND & REST: Active Reading & Cortisol Reset
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              <strong>Physical Reading (10 pages):</strong> Forces focused visual attention, strengthening the prefrontal cortex's attention network. Unlike infinite digital feeds (which trigger chaotic dopamine spikes), structured text increases long-term comprehension and vocabulary.
              <br /><br />
              <strong>Mindfulness Reset (Meditation):</strong> Actively activates the parasympathetic nervous system (vagus nerve stimulation). This lowers systemic cortisol, shrinks amygdala hyperactivity (the fear/anxiety center), and improves sleep architecture for cellular recovery.
            </p>
          </div>

          {/* Section 5: The No-Exceptions Ruleset */}
          <div style={{ padding: '16px', background: 'rgba(255, 69, 58, 0.03)', borderRadius: '14px', border: '1px solid rgba(255, 69, 58, 0.1)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-red)' }}>
              <ShieldAlert size={18} />
              5. The Psychology of the Reset Rule
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Why reset to Day 1 if you fold? 
              Because partial compromises build a habit of compromise. By enforcing absolute rules, you train your brain to view compliance as non-negotiable. 
              This increases self-efficacy—the deep psychological belief that you will do exactly what you set out to execute, no cap.
            </p>
          </div>

        </div>

        {/* Footer info */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button 
            className="ios-btn ios-btn-primary" 
            style={{ width: '100%' }} 
            onClick={onClose}
          >
            Aura Calibrated — Lock In ⚡
          </button>
        </div>

      </div>
    </div>
  );
};
