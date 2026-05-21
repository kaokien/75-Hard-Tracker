import React, { useState } from 'react';
import { exportBackup, importBackup } from '../db';
import type { DayLog, BackupData } from '../db';
import { 
  Download, 
  Upload, 
  Sparkles, 
  Info,
  ChevronRight,
  Settings
} from 'lucide-react';

interface ShowcaseProps {
  logs: DayLog[];
  currentDay: number;
  onRefreshAllData: () => void;
  onOpenSettings: () => void;
}

export const Showcase: React.FC<ShowcaseProps> = ({ 
  logs, 
  currentDay,
  onRefreshAllData,
  onOpenSettings
}) => {
  const [photoDay1, setPhotoDay1] = useState<number>(1);
  const [photoDay2, setPhotoDay2] = useState<number>(currentDay);
  const [cardAccent, setCardAccent] = useState<'orange' | 'cyan' | 'purple'>('orange');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Filter logs that actually have photos
  const logsWithPhotos = logs.filter(log => log.photo !== null);
  
  const getPhotoForDay = (dayNum: number): string | null => {
    const found = logs.find(log => log.dayNumber === dayNum);
    return found ? found.photo : null;
  };

  const img1Src = getPhotoForDay(photoDay1);
  const img2Src = getPhotoForDay(photoDay2);

  // Handle Export Backup
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportBackup();
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `75hard_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export backup data");
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Import Backup
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Importing a backup will overwrite your current progress, attempts history, and photos. Are you sure you want to proceed?")) {
      return;
    }

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const raw = event.target?.result as string;
          const parsed = JSON.parse(raw) as BackupData;
          
          if (!parsed.attempts || !parsed.days) {
            throw new Error("Invalid backup format");
          }

          await importBackup(parsed);
          alert("Backup imported successfully!");
          onRefreshAllData();
        } catch (err) {
          alert("Failed to parse backup file. Make sure it's a valid 75 Hard backup JSON.");
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      alert("Failed to read backup file");
      setIsImporting(false);
    }
  };

  // Accent mapping helper
  const accentColorMap = {
    orange: 'var(--color-orange)',
    cyan: 'var(--color-exercise-ring)',
    purple: '#7c4dff'
  };

  const totalCompleted = logs.filter(l => l.completed).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 16px' }}>
      
      {/* Page Header */}
      <div>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-move-ring)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          CHRONICLE SHOWCASE
        </span>
        <h1 className="ios-title" style={{ fontSize: '2.1rem', margin: '2px 0 0 0' }}>
          Share Poster
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
          Build side-by-side progress visuals and manage local backups.
        </p>
      </div>

      <div className="grid-page-layout">
        
        {/* Left Column: Visual Poster Board */}
        <div 
          style={{ 
            background: '#0a0a0a',
            borderRadius: '16px',
            border: `1.5px solid ${accentColorMap[cardAccent]}33`,
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Header inside poster */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: accentColorMap[cardAccent], letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                75 HARD CHRONICLE
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '2px 0 0 0', color: '#fff', letterSpacing: '-0.02em' }}>
                MIND OVER BODY
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block' }}>Current Status</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', display: 'block' }}>Day {currentDay}</span>
              <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>{totalCompleted} / 75 Perfect</span>
            </div>
          </div>

          {/* Comparison Images Section */}
          <div>
            {logsWithPhotos.length < 2 ? (
              <div style={{ 
                height: '240px', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '12px', 
                border: '1.5px dashed rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                color: 'var(--text-secondary)',
                padding: '24px',
                textAlign: 'center'
              }}>
                <Info size={28} style={{ marginBottom: '10px', opacity: 0.5, color: accentColorMap[cardAccent] }} />
                <p style={{ fontSize: '0.82rem', margin: 0, fontWeight: 600, color: '#fff' }}>Needs 2 progress photos</p>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', maxWidth: '280px' }}>
                  Log progress selfies from at least two separate days in your active tracker checklist to unlock this frame comparison.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Dropdown selectors */}
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', paddingBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Compare Day</span>
                    <select 
                      value={photoDay1}
                      onChange={(e) => setPhotoDay1(parseInt(e.target.value))}
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', padding: '3px 8px', outline: 'none' }}
                    >
                      {logsWithPhotos.map(l => (
                        <option key={l.dayNumber} value={l.dayNumber}>Day {l.dayNumber}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>with Day</span>
                    <select 
                      value={photoDay2}
                      onChange={(e) => setPhotoDay2(parseInt(e.target.value))}
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', padding: '3px 8px', outline: 'none' }}
                    >
                      {logsWithPhotos.map(l => (
                        <option key={l.dayNumber} value={l.dayNumber}>Day {l.dayNumber}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Grid side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="poster-image-frame">
                    {img1Src ? (
                      <>
                      <img src={img1Src} alt={`Day ${photoDay1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, border: '0.5px solid rgba(255,255,255,0.1)' }}>
                          DAY {photoDay1}
                        </div>
                      </>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No photo</div>
                    )}
                  </div>

                  <div className="poster-image-frame">
                    {img2Src ? (
                      <>
                        <img src={img2Src} alt={`Day ${photoDay2}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: accentColorMap[cardAccent], padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, color: '#000' }}>
                          DAY {photoDay2}
                        </div>
                      </>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No photo</div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Micro visual consistency matrix */}
          <div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em' }}>
              Grid Consistency Map
            </span>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(15, 1fr)', 
              gap: '4px',
              background: 'rgba(255,255,255,0.02)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              {Array.from({ length: 75 }, (_, i) => i + 1).map(dNum => {
                const dayLog = logs.find(l => l.dayNumber === dNum);
                let bg = 'rgba(255,255,255,0.02)';
                let border = '1px solid rgba(255,255,255,0.04)';

                if (dNum === currentDay) {
                  bg = 'rgba(255, 159, 10, 0.2)';
                  border = '1px solid var(--color-orange)';
                } else if (dayLog) {
                  if (dayLog.completed) {
                    bg = `${accentColorMap[cardAccent]}22`;
                    border = `1px solid ${accentColorMap[cardAccent]}`;
                  } else {
                    bg = 'rgba(255, 45, 85, 0.15)';
                    border = '1px solid var(--color-red)';
                  }
                }

                return (
                  <div 
                    key={dNum} 
                    style={{ 
                      aspectRatio: 1, 
                      borderRadius: '2px', 
                      background: bg,
                      border: border
                    }} 
                  />
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Settings & Utilities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Theme customizer card */}
          <div className="ios-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: 0 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Customize Showcase</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>Theme Accent Tint</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setCardAccent('orange')}
                  style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--color-orange)', border: cardAccent === 'orange' ? '2.5px solid #fff' : 'none', cursor: 'pointer' }}
                />
                <button 
                  onClick={() => setCardAccent('cyan')}
                  style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--color-exercise-ring)', border: cardAccent === 'cyan' ? '2.5px solid #fff' : 'none', cursor: 'pointer' }}
                />
                <button 
                  onClick={() => setCardAccent('purple')}
                  style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#7c4dff', border: cardAccent === 'purple' ? '2.5px solid #fff' : 'none', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Backup and restore panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,0.05)', borderRadius: '14px', overflow: 'hidden' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 16px 8px 16px' }}>
              Local Data Backup
            </span>
            
            <button 
              onClick={onOpenSettings}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: '#1c1c1e', 
                border: 'none', 
                padding: '14px 16px', 
                color: '#fff', 
                cursor: 'pointer',
                width: '100%',
                borderBottom: '1px solid rgba(255,255,255,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Settings size={16} style={{ color: 'var(--color-orange)' }} />
                <span style={{ fontSize: '0.85rem' }}>Challenge & Name Settings</span>
              </div>
              <ChevronRight size={16} style={{ opacity: 0.5 }} />
            </button>

            <button 
              onClick={handleExport}
              disabled={isExporting}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: '#1c1c1e', 
                border: 'none', 
                padding: '14px 16px', 
                color: '#fff', 
                cursor: 'pointer',
                width: '100%',
                borderBottom: '1px solid rgba(255,255,255,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Download size={16} style={{ color: 'var(--color-exercise-ring)' }} />
                <span style={{ fontSize: '0.85rem' }}>{isExporting ? 'Creating Backup...' : 'Export Backup JSON'}</span>
              </div>
              <ChevronRight size={16} style={{ opacity: 0.5 }} />
            </button>

            <label 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: '#1c1c1e', 
                border: 'none', 
                padding: '14px 16px', 
                color: '#fff', 
                cursor: 'pointer',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Upload size={16} style={{ color: '#7c4dff' }} />
                <span style={{ fontSize: '0.85rem' }}>{isImporting ? 'Importing JSON...' : 'Import Backup JSON'}</span>
              </div>
              <ChevronRight size={16} style={{ opacity: 0.5 }} />
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImport} 
                style={{ display: 'none' }}
                disabled={isImporting}
              />
            </label>
          </div>

          {/* Share instructions info panel */}
          <div className="ios-card" style={{ display: 'flex', gap: '12px', padding: '14px 16px', background: 'rgba(255, 159, 10, 0.05)', border: '1px solid rgba(255, 159, 10, 0.15)', marginBottom: 0 }}>
            <Sparkles size={16} style={{ color: 'var(--color-orange)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>Immersive Visual Share</h4>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                Take a screen capture of the poster board on the left. It is optimized to share directly to Instagram, Twitter/X, or workout logs.
              </p>
            </div>
          </div>
          
        </div>

      </div>

    </div>
  );
};
