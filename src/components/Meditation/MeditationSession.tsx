import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  X, 
  Volume2, 
  VolumeX, 
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface MeditationSessionProps {
  durationMinutes: number;
  mode: 'breath' | 'focus' | 'body' | 'sleep' | 'preworkout';
  guided: boolean;
  soundSetting: 'none' | 'rain' | 'ocean' | 'stream' | 'white';
  soundVolume: number;
  onComplete: (elapsedSeconds: number) => void;
  onAbandon: (elapsedSeconds: number) => void;
}

// Breathing configs for modes: Inhale, Hold, Exhale, Hold Empty (seconds)
const BREATH_CONFIGS = {
  breath: { inhale: 4, hold: 4, exhale: 4, holdEmpty: 4 },
  focus: { inhale: 4, hold: 4, exhale: 4, holdEmpty: 0 },
  body: { inhale: 5, hold: 2, exhale: 5, holdEmpty: 0 },
  sleep: { inhale: 4, hold: 2, exhale: 7, holdEmpty: 2 },
  preworkout: { inhale: 3, hold: 1, exhale: 3, holdEmpty: 1 }
};

const MODE_TITLES = {
  breath: 'Box Breathing Focus',
  focus: 'Single-Point Focus Reset',
  body: 'Recovery Body Scan',
  sleep: 'Sleep Wind-down Pacing',
  preworkout: 'Pre-Workout Mind Control'
};

const CUES = {
  inhale: { label: 'Inhale', desc: 'Oxygenate. Expand lungs fully.' },
  hold: { label: 'Hold', desc: 'Lock in. Retain the stillness.' },
  exhale: { label: 'Exhale', desc: 'Empty. Push out stress.' },
  'hold-empty': { label: 'Hold Empty', desc: 'Suspended. Reset focus.' }
};

// Web Audio API Synthesizer Class
class AmbientSynth {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  start(type: 'ocean' | 'rain' | 'white', volume: number) {
    this.stop();
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    const bufferSize = this.ctx.sampleRate * 2.5; // 2.5 seconds loop
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'white') {
        data[i] = white * 0.15;
      } else {
        // Brown noise algorithm for deep rumbling ocean wind / rain
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Scale up
      }
    }

    this.source = this.ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime((volume / 100) * 0.4, this.ctx.currentTime);

    if (type === 'ocean') {
      // Modulate low-pass frequency filter slowly to mimic ocean tide waves
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);

      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 second tide waves

      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime((volume / 100) * 0.14, this.ctx.currentTime);

      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.gainNode.gain);

      this.source.connect(filter);
      filter.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
      this.lfo.start();
    } else if (type === 'rain') {
      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(450, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(0.8, this.ctx.currentTime);

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(800, this.ctx.currentTime);

      this.source.connect(bandpass);
      this.source.connect(lowpass);

      bandpass.connect(this.gainNode);
      lowpass.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
    } else {
      // White noise direct
      this.source.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
    }

    this.source.start();
  }

  setVolume(volume: number) {
    if (this.ctx && this.gainNode) {
      this.gainNode.gain.setValueAtTime((volume / 100) * 0.4, this.ctx.currentTime);
    }
  }

  playChime() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    }
    
    // Play dual oscillator chime
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(147.01, this.ctx.currentTime); // D3
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(294.02, this.ctx.currentTime); // D4 (Harmonic Octave)

    chimeGain.gain.setValueAtTime(0, this.ctx.currentTime);
    chimeGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.15);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.5);

    osc1.connect(chimeGain);
    osc2.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();

    osc1.stop(this.ctx.currentTime + 3.5);
    osc2.stop(this.ctx.currentTime + 3.5);
  }

  stop() {
    try {
      if (this.lfo) {
        this.lfo.stop();
        this.lfo.disconnect();
        this.lfo = null;
      }
      if (this.source) {
        this.source.stop();
        this.source.disconnect();
        this.source = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      if (this.ctx && this.ctx.state !== 'closed') {
        this.ctx.close();
        this.ctx = null;
      }
    } catch (e) {
      console.warn('Chime/Ambient Web Audio cleanup warning:', e);
    }
  }
}

const INTENTIONS = [
  { id: 'focus', title: 'Anchor Focus', detail: 'Lock mental state onto checklist tasks' },
  { id: 'calm', title: 'Regulate Nervous System', detail: 'De-escalate fight/flight physical reactions' },
  { id: 'recovery', title: 'Physical Recovery', detail: 'Relieve muscle tension and speed cellular restoration' },
  { id: 'sleep', title: 'Deep Sleep Rest', detail: 'Prepare brainwaves for restorative deep cycles' },
  { id: 'resilience', title: 'Amplify Resilience', detail: 'Strengthen grit and resolve for challenge completion' }
] as const;

export const MeditationSession: React.FC<MeditationSessionProps> = ({
  durationMinutes,
  mode,
  guided,
  soundSetting,
  soundVolume,
  onComplete,
  onAbandon
}) => {
  // Navigation states: 'intention' -> 'countdown' -> 'active'
  const [sessionState, setSessionState] = useState<'intention' | 'countdown' | 'active'>('intention');
  const [selectedIntention, setSelectedIntention] = useState<string>('focus');
  const [countdown, setCountdown] = useState<number>(3);

  // Active Session states
  const [timeLeft, setTimeLeft] = useState<number>(durationMinutes * 60);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(soundVolume);

  // Breathing Phase states
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold-empty'>('inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(BREATH_CONFIGS[mode].inhale);

  // Alerts
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [showCheatWarning, setShowCheatWarning] = useState<boolean>(false);
  const [hasInterrupted, setHasInterrupted] = useState<boolean>(false);

  const synthRef = useRef<AmbientSynth | null>(null);
  const totalSeconds = durationMinutes * 60;
  const elapsedSeconds = totalSeconds - timeLeft;

  // Initialize Synth
  useEffect(() => {
    synthRef.current = new AmbientSynth();
    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
      }
    };
  }, []);

  // Handle Countdown timer
  useEffect(() => {
    if (sessionState !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown complete -> Play Chime & Enter active meditation loop
      if (synthRef.current) {
        synthRef.current.playChime();
        if (soundSetting !== 'none') {
          synthRef.current.start(soundSetting as any, volume);
        }
      }
      setSessionState('active');
    }
  }, [countdown, sessionState]);

  // Main Active Session Loop
  useEffect(() => {
    if (sessionState !== 'active' || !isPlaying || showExitConfirm) return;

    // 1-second ticks
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer finished! Play chime and complete session
          if (synthRef.current) {
            synthRef.current.playChime();
            synthRef.current.stop();
          }
          clearInterval(interval);
          onComplete(totalSeconds);
          return 0;
        }
        return prev - 1;
      });

      // Handle breathing loop
      setPhaseSecondsLeft((prevPhase) => {
        if (prevPhase <= 1) {
          // Advance breathing phase
          let nextPhase: typeof breathPhase = 'inhale';
          let nextSeconds = BREATH_CONFIGS[mode].inhale;

          if (breathPhase === 'inhale') {
            if (BREATH_CONFIGS[mode].hold > 0) {
              nextPhase = 'hold';
              nextSeconds = BREATH_CONFIGS[mode].hold;
            } else {
              nextPhase = 'exhale';
              nextSeconds = BREATH_CONFIGS[mode].exhale;
            }
          } else if (breathPhase === 'hold') {
            nextPhase = 'exhale';
            nextSeconds = BREATH_CONFIGS[mode].exhale;
          } else if (breathPhase === 'exhale') {
            if (BREATH_CONFIGS[mode].holdEmpty > 0) {
              nextPhase = 'hold-empty';
              nextSeconds = BREATH_CONFIGS[mode].holdEmpty;
            } else {
              nextPhase = 'inhale';
              nextSeconds = BREATH_CONFIGS[mode].inhale;
            }
          } else if (breathPhase === 'hold-empty') {
            nextPhase = 'inhale';
            nextSeconds = BREATH_CONFIGS[mode].inhale;
          }

          setBreathPhase(nextPhase);
          return nextSeconds;
        }
        return prevPhase - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionState, isPlaying, breathPhase, showExitConfirm, mode, onComplete, totalSeconds]);

  // Focus lock: Auto pause on tab blur / window hide
  useEffect(() => {
    if (sessionState !== 'active') return;

    const handleBlur = () => {
      setIsPlaying(false);
      setHasInterrupted(true);
      if (synthRef.current) {
        synthRef.current.stop();
      }
    };

    const handleFocus = () => {
      // Audio needs click to resume, leave paused so user clicks play
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBlur();
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionState]);

  // Toggle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (synthRef.current) {
        synthRef.current.stop();
      }
    } else {
      setIsPlaying(true);
      if (synthRef.current && soundSetting !== 'none') {
        synthRef.current.start(soundSetting as any, volume);
      }
    }
  };

  // Adjust volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    if (synthRef.current) {
      synthRef.current.setVolume(val);
    }
  };

  // Attempt to exit early
  const handleRequestExit = () => {
    // 80% rule
    const isUnder80 = elapsedSeconds < totalSeconds * 0.8;
    if (isUnder80) {
      setShowCheatWarning(true);
    } else {
      setShowExitConfirm(true);
    }
  };

  const confirmExit = (forceFail: boolean) => {
    if (synthRef.current) {
      synthRef.current.stop();
    }
    if (forceFail) {
      onAbandon(elapsedSeconds);
    } else {
      onComplete(elapsedSeconds);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Intention Selector Phase
  if (sessionState === 'intention') {
    return (
      <div 
        className="meditation-immersive-layer" 
        style={{ justifyContent: 'center', gap: '30px' }}
      >
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--color-calm-teal)" />
            Set Intention
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '6px' }}>
            Lock your mind on a single tactical objective before starting.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '380px' }}>
          {INTENTIONS.map((item) => {
            const active = selectedIntention === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedIntention(item.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: active ? '1px solid var(--color-calm-teal)' : '1px solid rgba(255,255,255,0.06)',
                  background: active ? 'rgba(99, 226, 183, 0.1)' : 'rgba(255,255,255,0.02)',
                  color: active ? 'var(--color-calm-teal)' : 'var(--text-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: active ? 'var(--shadow-glow-calm)' : 'none'
                }}
              >
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: active ? 'var(--text-primary)' : 'var(--text-primary)' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {item.detail}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '380px', marginTop: '10px' }}>
          <button
            onClick={() => onAbandon(0)}
            style={{
              flex: '1',
              height: '46px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => setSessionState('countdown')}
            style={{
              flex: '2',
              height: '46px',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--color-calm-teal)',
              color: '#000000',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-glow-calm)'
            }}
          >
            BEGIN COUNTDOWN
          </button>
        </div>
      </div>
    );
  }

  // Countdown Phase
  if (sessionState === 'countdown') {
    return (
      <div 
        className="meditation-immersive-layer" 
        style={{ justifyContent: 'center' }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-calm-teal)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Preparing Mind
          </p>
          <div style={{ 
            fontFamily: 'var(--font-heading)', 
            fontSize: '5rem', 
            fontWeight: 900, 
            color: '#fff',
            textShadow: '0 0 30px rgba(255,255,255,0.15)',
            transform: 'scale(1)',
            transition: 'transform 0.5s ease'
          }}>
            {countdown}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '16px' }}>
            Get in posture. Focus your eyes.
          </p>
        </div>
      </div>
    );
  }

  // Active Session Phase
  return (
    <div className="meditation-immersive-layer">
      {/* Upper Controls */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={togglePlay}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {isPlaying ? <Pause size={14} fill="#fff" /> : <Play size={14} fill="#fff" />}
          {isPlaying ? 'PAUSE' : 'RESUME'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {MODE_TITLES[mode]}
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-calm-teal)', marginTop: '2px' }}>
            Intention: {INTENTIONS.find(i => i.id === selectedIntention)?.title}
          </div>
        </div>

        <button
          onClick={handleRequestExit}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
          aria-label="End session"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Center Area: Breathing Ring */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'center' }}>
        {guided ? (
          <div className="meditation-breath-circle-container">
            <div className="meditation-breath-glow" />
            <div className={`meditation-breath-circle ${breathPhase}`}>
              {CUES[breathPhase].label}
            </div>
          </div>
        ) : (
          <div className="meditation-breath-circle-container" style={{ opacity: 0.15 }}>
            <div className="meditation-breath-circle hold-empty">
              SILENT
            </div>
          </div>
        )}

        {/* Breathing Sub-Cue text */}
        {guided && (
          <div style={{ marginTop: '24px', textAlign: 'center', minHeight: '60px', padding: '0 20px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {CUES[breathPhase].desc}
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Phase time remaining: <span style={{ color: 'var(--color-calm-teal)', fontWeight: 700 }}>{phaseSecondsLeft}s</span>
            </p>
          </div>
        )}
      </div>

      {/* Footer Details: Timer, volume and haptic guidance info */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        {/* Timer */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900, color: '#fff', letterSpacing: '0.02em' }}>
            {formatTime(timeLeft)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Remaining of {durationMinutes}m
          </div>
        </div>

        {/* Dynamic sound adjustment inside session */}
        {soundSetting !== 'none' && (
          <div style={{ width: '100%', maxWidth: '280px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <VolumeX size={12} color="var(--text-secondary)" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              style={{
                flexGrow: 1,
                accentColor: 'var(--color-calm-teal)',
                height: '3px',
                background: 'rgba(255,255,255,0.1)'
              }}
              aria-label="Ambient volume mixer"
            />
            <Volume2 size={12} color="var(--color-calm-teal)" />
          </div>
        )}

        {hasInterrupted && !isPlaying && (
          <div style={{ background: 'rgba(255, 159, 10, 0.1)', border: '1px solid rgba(255, 159, 10, 0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--color-orange)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={12} />
            <span>Focus lost. Timer paused. Tap Resume.</span>
          </div>
        )}
      </div>

      {/* Early Exit / Cheat Warning Dialog */}
      {showCheatWarning && (
        <div className="ios-drawer-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ width: '88%', maxWidth: '340px', background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '20px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
            <AlertTriangle size={36} color="var(--color-orange)" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Exit Training Early?</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '8px', lineHeight: '1.4' }}>
              Minimum 80% duration ({formatTime(Math.round(totalSeconds * 0.8))}) required to earn XP and increment streak. Exiting now yields 0 XP.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '18px' }}>
              <button
                onClick={() => {
                  setShowCheatWarning(false);
                  setIsPlaying(true);
                  if (synthRef.current && soundSetting !== 'none') {
                    synthRef.current.start(soundSetting as any, volume);
                  }
                }}
                style={{ height: '40px', borderRadius: '8px', border: 'none', background: 'var(--color-calm-teal)', color: '#000', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Continue Training
              </button>
              <button
                onClick={() => {
                  setShowCheatWarning(false);
                  confirmExit(true); // Abandon
                }}
                style={{ height: '40px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,45,85,0.1)', color: 'var(--color-move-ring)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Abandon & Get 0 XP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog (when >= 80% elapsed) */}
      {showExitConfirm && (
        <div className="ios-drawer-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ width: '88%', maxWidth: '340px', background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '20px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
            <RotateCcw size={32} color="var(--color-calm-teal)" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Secure Progress?</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '8px', lineHeight: '1.4' }}>
              You have completed {formatTime(elapsedSeconds)} of your session. This is enough to count as completed. Save now or finish the full session?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '18px' }}>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  setIsPlaying(true);
                  if (synthRef.current && soundSetting !== 'none') {
                    synthRef.current.start(soundSetting as any, volume);
                  }
                }}
                style={{ height: '40px', borderRadius: '8px', border: 'none', background: 'var(--color-calm-teal)', color: '#000', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Complete Full Session
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  confirmExit(false); // Complete early with partial elapsed seconds
                }}
                style={{ height: '40px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Save & Exit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
