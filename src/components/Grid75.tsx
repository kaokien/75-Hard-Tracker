import React, { useState } from 'react';
import type { DayLog } from '../db';
import { 
  Check, 
  X, 
  Dumbbell, 
  Droplet, 
  Utensils, 
  BookOpen, 
  Moon, 
  Footprints, 
  Camera,
  Award,
  AlertTriangle
} from 'lucide-react';

interface Grid75Props {
  logs: DayLog[];
  currentDay: number;
  onSelectDay: (dayNumber: number) => void;
}

export const Grid75: React.FC<Grid75Props> = ({ logs, currentDay, onSelectDay }) => {
  const [selectedDayDetail, setSelectedDayDetail] = useState<DayLog | null>(null);

  // Helper to map log by day number
  const getLogForDay = (dayNum: number): DayLog | undefined => {
    return logs.find(log => log.dayNumber === dayNum);
  };

  // Generate 75 days array
  const daysArray = Array.from({ length: 75 }, (_, i) => i + 1);

  // Calculate statistics for progress summary
  const completedCount = logs.filter(l => l.completed).length;
  const failedCount = logs.filter(l => l.failed).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 16px' }}>
      
      {/* Page Header */}
      <div>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-move-ring)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          TRACKER MATRIX
        </span>
        <h1 className="ios-title" style={{ fontSize: '2.1rem', margin: '2px 0 0 0' }}>
          75 Day Grid
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
          Chronicle board of your entire mental toughness journey.
        </p>
      </div>

      <div className="grid-page-layout">
        
        {/* Left Column: Stats + Matrix Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Mini Stats Banner */}
          <div className="ios-card" style={{ display: 'flex', justifyContent: 'space-around', padding: '14px', textAlign: 'center', marginBottom: 0 }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Completed</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-exercise-ring)', marginTop: '2px' }}>
                {completedCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>/ 75</span>
              </div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Failed</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-red)', marginTop: '2px' }}>
                {failedCount}
              </div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Remaining</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-stand-ring)', marginTop: '2px' }}>
                {Math.max(0, 75 - currentDay + (logs.find(l => l.dayNumber === currentDay)?.completed ? 0 : 1))}
              </div>
            </div>
          </div>

          {/* Grid Grid container */}
          <div className="ios-card" style={{ padding: '16px', marginBottom: 0 }}>
            <div className="grid-matrix-container">
              {daysArray.map((dayNum) => {
                const log = getLogForDay(dayNum);
                let cellClass = 'cell-untouched';

                if (dayNum === currentDay) {
                  cellClass = 'cell-current';
                } else if (log) {
                  if (log.completed) {
                    cellClass = 'cell-completed';
                  } else if (log.failed) {
                    cellClass = 'cell-failed';
                  } else {
                    cellClass = 'cell-failed';
                  }
                }

                // Click behavior
                const handleClick = () => {
                  if (log) {
                    setSelectedDayDetail(log);
                  } else if (dayNum === currentDay) {
                    onSelectDay(dayNum);
                  }
                };

                const cellStatus = dayNum === currentDay ? 'current day' : log?.completed ? 'completed' : log?.failed ? 'failed' : dayNum < currentDay ? 'missed' : 'upcoming';

                return (
                  <div 
                    key={dayNum} 
                    className={`grid-matrix-cell ${cellClass}`}
                    onClick={handleClick}
                    role="gridcell"
                    aria-label={`Day ${dayNum} - ${cellStatus}`}
                    tabIndex={dayNum === currentDay || log ? 0 : -1}
                  >
                    <span>{dayNum}</span>
                    {log?.completed && (
                      <Check size={8} strokeWidth={4} style={{ position: 'absolute', bottom: '2px', right: '2px', color: '#fff' }} />
                    )}
                    {log?.failed && (
                      <X size={8} strokeWidth={4} style={{ position: 'absolute', bottom: '2px', right: '2px', color: '#fff' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Desktop Inspector & Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Desktop Inspector Panel */}
          <div className="desktop-inspector-panel-container">
            {selectedDayDetail ? (
              <div className="ios-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Day {selectedDayDetail.dayNumber} Inspector
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                      {new Date(selectedDayDetail.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedDayDetail(null)}
                    style={{ background: 'rgba(255,255,255,0.06)', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Status Banner */}
                <div style={{ 
                  background: selectedDayDetail.completed ? 'rgba(48, 209, 88, 0.12)' : 'rgba(255, 45, 85, 0.12)',
                  border: selectedDayDetail.completed ? '1px solid rgba(48, 209, 88, 0.2)' : '1px solid rgba(255, 45, 85, 0.2)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: selectedDayDetail.completed ? 'var(--color-exercise-ring)' : 'var(--color-red)'
                }}>
                  {selectedDayDetail.completed ? (
                    <><Award size={16} /> All daily requirements successfully met.</>
                  ) : (
                    <><AlertTriangle size={16} /> Incomplete day or failed task rules.</>
                  )}
                </div>

                {/* Progress selfie */}
                {selectedDayDetail.photo && (
                  <div style={{ width: '100%', height: '180px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={selectedDayDetail.photo} alt="Progress Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                {/* Task Checklist details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Checklist Log</span>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Dumbbell size={14} color={selectedDayDetail.workout1 ? 'var(--color-move-ring)' : 'var(--text-secondary)'} />
                      <span style={{ textDecoration: selectedDayDetail.workout1 ? 'none' : 'line-through' }}>Workout 1</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Dumbbell size={14} color={selectedDayDetail.workout2 ? 'var(--color-exercise-ring)' : 'var(--text-secondary)'} />
                      <span style={{ textDecoration: selectedDayDetail.workout2 ? 'none' : 'line-through' }}>Workout 2</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Footprints size={14} color={selectedDayDetail.steps10k ? 'var(--color-orange)' : 'var(--text-secondary)'} />
                      <span style={{ textDecoration: selectedDayDetail.steps10k ? 'none' : 'line-through' }}>10k Steps</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Droplet size={14} color={selectedDayDetail.water >= selectedDayDetail.waterGoal ? 'var(--color-stand-ring)' : 'var(--text-secondary)'} />
                      <span>Water: {selectedDayDetail.water}ml</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Moon size={14} color={selectedDayDetail.sleep ? '#7c4dff' : 'var(--text-secondary)'} />
                      <span style={{ textDecoration: selectedDayDetail.sleep ? 'none' : 'line-through' }}>Sleep</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Utensils size={14} color={selectedDayDetail.diet ? 'var(--color-move-ring)' : 'var(--text-secondary)'} />
                      <span style={{ textDecoration: selectedDayDetail.diet ? 'none' : 'line-through' }}>Clean Diet</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={14} color={selectedDayDetail.reading ? 'var(--color-stand-ring)' : 'var(--text-secondary)'} />
                      <span style={{ textDecoration: selectedDayDetail.reading ? 'none' : 'line-through' }}>Reading</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Camera size={14} color={selectedDayDetail.photo ? 'var(--color-exercise-ring)' : 'var(--text-secondary)'} />
                      <span style={{ textDecoration: selectedDayDetail.photo ? 'none' : 'line-through' }}>Photo</span>
                    </div>
                  </div>

                  {/* Sub-descriptions details */}
                  {(selectedDayDetail.workout1Desc || selectedDayDetail.workout2Desc || selectedDayDetail.dietDesc || selectedDayDetail.readingBook) && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {selectedDayDetail.workout1Desc && <div><strong>Workout 1:</strong> {selectedDayDetail.workout1Desc}</div>}
                      {selectedDayDetail.workout2Desc && <div><strong>Outdoor Workout:</strong> {selectedDayDetail.workout2Desc}</div>}
                      {selectedDayDetail.dietDesc && <div><strong>Diet Rules:</strong> {selectedDayDetail.dietDesc}</div>}
                      {selectedDayDetail.readingBook && <div><strong>Book:</strong> {selectedDayDetail.readingBook} ({selectedDayDetail.readingPages} pages)</div>}
                    </div>
                  )}
                </div>

                {/* Reflection journal */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Journal Reflection</span>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: '1.4', color: '#fff', whiteSpace: 'pre-wrap' }}>
                    {selectedDayDetail.journal || <em>No reflection journal logged for this day.</em>}
                  </p>
                </div>
              </div>
            ) : (
              <div className="ios-card" style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center', minHeight: '260px', marginBottom: 0 }}>
                <Award size={42} style={{ opacity: 0.2, marginBottom: '12px' }} />
                <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 4px 0' }}>Day Inspector</h4>
                <p style={{ fontSize: '0.78rem', maxWidth: '220px', margin: 0 }}>Tap any completed or failed day cell in the matrix grid to view detailed logs.</p>
              </div>
            )}
          </div>

          {/* Legend Card */}
          <div className="ios-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', marginBottom: 0 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.7rem' }}>Legend</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--color-exercise-ring)' }} />
                <span>Completed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--color-red)' }} />
                <span>Failed / Missed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', border: '1.5px solid var(--color-orange)', background: 'transparent' }} />
                <span>Active Today</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <span>Locked / Future</span>
              </div>
            </div>
          </div>
          
        </div>

      </div>

      {/* iOS Detail Inspect Drawer Sheet - Mobile Only */}
      {selectedDayDetail && (
        <div className="ios-bottom-sheet-overlay mobile-only-sheet" onClick={() => setSelectedDayDetail(null)}>
          <div className="ios-bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ios-bottom-sheet-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Day {selectedDayDetail.dayNumber} Summary
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  {new Date(selectedDayDetail.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDayDetail(null)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Status Banner */}
            <div style={{ 
              background: selectedDayDetail.completed ? 'rgba(48, 209, 88, 0.12)' : 'rgba(255, 45, 85, 0.12)',
              border: selectedDayDetail.completed ? '1px solid rgba(48, 209, 88, 0.2)' : '1px solid rgba(255, 45, 85, 0.2)',
              padding: '10px 14px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: selectedDayDetail.completed ? 'var(--color-exercise-ring)' : 'var(--color-red)'
            }}>
              {selectedDayDetail.completed ? (
                <><Award size={16} /> All daily requirements successfully met.</>
              ) : (
                <><AlertTriangle size={16} /> Incomplete day or failed task rules.</>
              )}
            </div>

            {/* Content list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '350px', overflowY: 'auto', paddingBottom: '20px' }}>
              
              {selectedDayDetail.photo && (
                <div style={{ width: '100%', height: '160px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={selectedDayDetail.photo} alt="Progress Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div className="ios-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Core Checklist Log</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Dumbbell size={14} color={selectedDayDetail.workout1 ? 'var(--color-move-ring)' : 'var(--text-secondary)'} />
                    <span style={{ textDecoration: selectedDayDetail.workout1 ? 'none' : 'line-through' }}>Workout 1</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Dumbbell size={14} color={selectedDayDetail.workout2 ? 'var(--color-exercise-ring)' : 'var(--text-secondary)'} />
                    <span style={{ textDecoration: selectedDayDetail.workout2 ? 'none' : 'line-through' }}>Workout 2</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Footprints size={14} color={selectedDayDetail.steps10k ? 'var(--color-orange)' : 'var(--text-secondary)'} />
                    <span style={{ textDecoration: selectedDayDetail.steps10k ? 'none' : 'line-through' }}>10k Steps</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Droplet size={14} color={selectedDayDetail.water >= selectedDayDetail.waterGoal ? 'var(--color-stand-ring)' : 'var(--text-secondary)'} />
                    <span>Water: {selectedDayDetail.water}ml</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Moon size={14} color={selectedDayDetail.sleep ? '#7c4dff' : 'var(--text-secondary)'} />
                    <span style={{ textDecoration: selectedDayDetail.sleep ? 'none' : 'line-through' }}>Sleep Target</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Utensils size={14} color={selectedDayDetail.diet ? 'var(--color-move-ring)' : 'var(--text-secondary)'} />
                    <span style={{ textDecoration: selectedDayDetail.diet ? 'none' : 'line-through' }}>Strict Diet</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={14} color={selectedDayDetail.reading ? 'var(--color-stand-ring)' : 'var(--text-secondary)'} />
                    <span style={{ textDecoration: selectedDayDetail.reading ? 'none' : 'line-through' }}>Reading</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Camera size={14} color={selectedDayDetail.photo ? 'var(--color-exercise-ring)' : 'var(--text-secondary)'} />
                    <span style={{ textDecoration: selectedDayDetail.photo ? 'none' : 'line-through' }}>Progress Photo</span>
                  </div>
                </div>

                {(selectedDayDetail.workout1Desc || selectedDayDetail.workout2Desc || selectedDayDetail.dietDesc || selectedDayDetail.readingBook) && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    {selectedDayDetail.workout1Desc && <div><strong>W1:</strong> {selectedDayDetail.workout1Desc}</div>}
                    {selectedDayDetail.workout2Desc && <div><strong>W2:</strong> {selectedDayDetail.workout2Desc}</div>}
                    {selectedDayDetail.dietDesc && <div><strong>Diet:</strong> {selectedDayDetail.dietDesc}</div>}
                    {selectedDayDetail.readingBook && <div><strong>Reading:</strong> {selectedDayDetail.readingBook} ({selectedDayDetail.readingPages} pages)</div>}
                  </div>
                )}
              </div>

              <div className="ios-card" style={{ padding: '12px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Journal Reflection</span>
                <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4', color: '#fff', whiteSpace: 'pre-wrap' }}>
                  {selectedDayDetail.journal || <em>No reflection journal logged for this day.</em>}
                </p>
              </div>

            </div>

            <button 
              className="ios-btn ios-btn-primary" 
              style={{ marginTop: '10px' }}
              onClick={() => setSelectedDayDetail(null)}
            >
              Close Summary
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
