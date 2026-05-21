import React, { useState, useEffect } from 'react';
import { getAttemptLogs, getAllAttempts, deleteAttempt } from '../db';
import type { Attempt, DayLog } from '../db';
import { 
  History, 
  Trash2, 
  ChevronRight, 
  AlertTriangle, 
  Award, 
  Calendar, 
  X
} from 'lucide-react';

interface HistoryViewProps {
  activeAttemptId: string | null;
  onRefreshHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ 
  activeAttemptId,
  onRefreshHistory
}) => {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null);
  const [selectedAttemptLogs, setSelectedAttemptLogs] = useState<DayLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Load all attempts on mount
  useEffect(() => {
    loadAttempts();
  }, [activeAttemptId]);

  const loadAttempts = async () => {
    try {
      const all = await getAllAttempts();
      // Sort: active first, then latest start date first
      all.sort((a, b) => {
        if (a.id === activeAttemptId) return -1;
        if (b.id === activeAttemptId) return 1;
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      });
      setAttempts(all);
    } catch (err) {
      console.error("Failed to load attempts history", err);
    }
  };

  // Delete an old attempt
  const handleDeleteAttempt = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (id === activeAttemptId) {
      alert("Cannot delete the active tracking attempt!");
      return;
    }
    if (window.confirm("Are you sure you want to permanently delete this attempt and all its logs/photos? This cannot be undone!")) {
      try {
        await deleteAttempt(id);
        await loadAttempts();
        onRefreshHistory();
      } catch (err) {
        alert("Failed to delete attempt");
      }
    }
  };

  // Inspect logs of selected attempt
  const handleInspectAttempt = async (attempt: Attempt) => {
    setIsLoadingLogs(true);
    setSelectedAttempt(attempt);
    try {
      const logs = await getAttemptLogs(attempt.id);
      logs.sort((a, b) => a.dayNumber - b.dayNumber);
      setSelectedAttemptLogs(logs);
    } catch (err) {
      console.error("Failed to fetch logs for attempt", err);
      alert("Could not load logs for this attempt");
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const closeInspection = () => {
    setSelectedAttempt(null);
    setSelectedAttemptLogs([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 16px' }}>
      
      {/* Page Header */}
      <div>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-move-ring)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          CHALLENGE HISTORY
        </span>
        <h1 className="ios-title" style={{ fontSize: '2.1rem', margin: '2px 0 0 0' }}>
          Attempts Log
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
          Review your current and previous 75 Hard attempt archives.
        </p>
      </div>

      <div className="history-page-layout">
        
        {/* Left Column: Attempts list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {attempts.length === 0 ? (
            <div className="ios-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', marginBottom: 0 }}>
              <History size={38} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
              <p style={{ fontSize: '0.82rem', margin: 0 }}>No attempts history recorded yet.</p>
            </div>
          ) : (
            attempts.map((att) => {
              const isActive = att.id === activeAttemptId;

              return (
                <div 
                  key={att.id}
                  className="ios-card"
                  onClick={() => handleInspectAttempt(att)}
                  style={{ 
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    marginBottom: 0,
                    borderLeft: isActive 
                      ? '4px solid var(--color-orange)' 
                      : att.status === 'completed'
                        ? '4px solid var(--color-exercise-ring)'
                        : '4px solid var(--color-red)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1, marginRight: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>
                        {isActive ? 'Current Attempt' : `Attempt #${att.id.substring(8, 14)}`}
                      </span>
                      <span style={{ 
                        fontSize: '0.62rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        background: isActive 
                          ? 'rgba(255,159,10,0.12)' 
                          : att.status === 'completed' 
                            ? 'rgba(48, 209, 88, 0.12)' 
                            : 'rgba(255, 45, 85, 0.12)',
                        color: isActive 
                          ? 'var(--color-orange)' 
                          : att.status === 'completed' 
                            ? 'var(--color-exercise-ring)' 
                            : 'var(--color-red)'
                      }}>
                        {isActive ? 'ACTIVE' : att.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Calendar size={12} /> {att.startDate}
                      </span>
                      {att.endDate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          to {att.endDate}
                        </span>
                      )}
                    </div>

                    {att.status === 'failed' && (
                      <div style={{ 
                        fontSize: '0.74rem', 
                        color: 'var(--color-red)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        marginTop: '2px'
                      }}>
                        <AlertTriangle size={12} /> Failed on Day {att.failureDay}: "{att.failureReason || 'Missed core rule'}"
                      </div>
                    )}

                    {att.status === 'completed' && (
                      <div style={{ 
                        fontSize: '0.74rem', 
                        color: 'var(--color-exercise-ring)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        marginTop: '2px'
                      }}>
                        <Award size={12} /> Full 75 days completed successfully!
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                    {!isActive && (
                      <button 
                        onClick={(e) => handleDeleteAttempt(e, att.id)}
                        style={{ 
                          background: 'rgba(255, 45, 85, 0.08)', 
                          border: 'none', 
                          padding: '6px', 
                          borderRadius: '6px', 
                          color: 'var(--color-red)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <div onClick={() => handleInspectAttempt(att)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Desktop Attempt Detail Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="desktop-inspector-panel-container">
            {selectedAttempt ? (
              <div className="ios-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Attempt Log Archive
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                      Started {selectedAttempt.startDate}
                    </h3>
                  </div>
                  <button 
                    onClick={closeInspection}
                    style={{ background: 'rgba(255,255,255,0.06)', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Logs List Container inside right panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
                  {isLoadingLogs ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading archive logs...</div>
                  ) : selectedAttemptLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No logged days found.</div>
                  ) : (
                    selectedAttemptLogs.map((log) => (
                      <div 
                        key={log.dayNumber} 
                        className="ios-card"
                        style={{ 
                          padding: '12px',
                          background: 'rgba(0,0,0,0.15)',
                          marginBottom: 0,
                          borderLeft: log.completed ? '3px solid var(--color-exercise-ring)' : '3px solid var(--color-red)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: log.completed ? 'var(--color-exercise-ring)' : 'var(--color-red)' }}>
                            Day {log.dayNumber}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{log.date}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          <div><strong>Workout 1:</strong> {log.workout1Desc || (log.workout1 ? 'Completed' : 'Missed')}</div>
                          <div><strong>Workout 2:</strong> {log.workout2Desc || (log.workout2 ? 'Completed' : 'Missed')}</div>
                          <div><strong>Water:</strong> {log.water}ml / {log.waterGoal}ml</div>
                          <div><strong>Diet Plan:</strong> {log.dietDesc || (log.diet ? 'Clean Adherence' : 'Missed')}</div>
                          {log.reading && <div><strong>Reading:</strong> {log.readingBook} ({log.readingPages} pages)</div>}
                          {log.journal && (
                            <p style={{ margin: '6px 0 0 0', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', color: '#fff', fontStyle: 'italic', fontSize: '0.76rem', lineHeight: 1.4 }}>
                              "{log.journal}"
                            </p>
                          )}
                          {log.photo && (
                            <div style={{ width: '100%', height: '110px', borderRadius: '6px', overflow: 'hidden', marginTop: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                              <img src={log.photo} alt={`Day ${log.dayNumber}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="ios-card" style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center', minHeight: '260px', marginBottom: 0 }}>
                <History size={42} style={{ opacity: 0.2, marginBottom: '12px' }} />
                <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 4px 0' }}>Logs Archive</h4>
                <p style={{ fontSize: '0.78rem', maxWidth: '220px', margin: 0 }}>Select any previous or current attempt archive on the left to inspect its detailed daily logging history.</p>
              </div>
            )}
          </div>
          
        </div>

      </div>

      {/* iOS Slide-up drawer panel for attempt logs inspection - Mobile Only */}
      {selectedAttempt && (
        <div className="ios-bottom-sheet-overlay mobile-only-sheet" onClick={closeInspection}>
          <div className="ios-bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ios-bottom-sheet-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Attempt Details
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  Started {selectedAttempt.startDate}
                </h3>
              </div>
              <button 
                onClick={closeInspection}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Logs List Container inside drawer sheet */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingBottom: '20px' }}>
              {isLoadingLogs ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading archive logs...</div>
              ) : selectedAttemptLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No logged days found.</div>
              ) : (
                selectedAttemptLogs.map((log) => (
                  <div 
                    key={log.dayNumber} 
                    className="ios-card"
                    style={{ 
                      padding: '12px',
                      background: 'rgba(0,0,0,0.15)',
                      borderLeft: log.completed ? '3px solid var(--color-exercise-ring)' : '3px solid var(--color-red)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.88rem', color: log.completed ? 'var(--color-exercise-ring)' : 'var(--color-red)' }}>
                        Day {log.dayNumber}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{log.date}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <div><strong>W1:</strong> {log.workout1Desc || (log.workout1 ? 'Done' : 'Missed')}</div>
                      <div><strong>W2:</strong> {log.workout2Desc || (log.workout2 ? 'Done' : 'Missed')}</div>
                      <div><strong>Water:</strong> {log.water}ml / {log.waterGoal}ml</div>
                      <div><strong>Diet:</strong> {log.dietDesc || (log.diet ? 'Rules Met' : 'Missed')}</div>
                      {log.reading && <div><strong>Read:</strong> {log.readingBook} ({log.readingPages} p.)</div>}
                      {log.journal && (
                        <p style={{ margin: '6px 0 0 0', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontStyle: 'italic', fontSize: '0.76rem' }}>
                          "{log.journal}"
                        </p>
                      )}
                      {log.photo && (
                        <div style={{ width: '100%', height: '100px', borderRadius: '6px', overflow: 'hidden', marginTop: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <img src={log.photo} alt={`Day ${log.dayNumber}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button 
              className="ios-btn ios-btn-primary" 
              style={{ marginTop: '10px' }}
              onClick={closeInspection}
            >
              Close Archive
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
