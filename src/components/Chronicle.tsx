import React, { useState } from 'react';
import type { DayLog } from '../db';
import { 
  Search, 
  BookOpen, 
  Dumbbell, 
  Droplet, 
  Utensils, 
  Camera, 
  Moon,
  Footprints,
  ChevronDown, 
  ChevronUp,
  Calendar,
  Layers
} from 'lucide-react';

interface ChronicleProps {
  logs: DayLog[];
}

export const Chronicle: React.FC<ChronicleProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'failed'>('all');
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});

  // Toggle single day details expansion
  const toggleExpand = (dayNum: number) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayNum]: !prev[dayNum]
    }));
  };

  // Filter & Search Logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.journal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.workout1Desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.workout2Desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.dietDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.readingBook.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `day ${log.dayNumber}`.includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'completed' && log.completed) ||
      (filterStatus === 'failed' && log.failed);

    return matchesSearch && matchesStatus;
  }).reverse(); // Latest logged days first for chronicle timeline

  // Compute stats
  const totalCompletedDays = logs.filter(l => l.completed).length;
  const totalWorkouts = logs.reduce((acc, log) => {
    return acc + (log.workout1 ? 1 : 0) + (log.workout2 ? 1 : 0);
  }, 0);
  const totalWaterMl = logs.reduce((acc, log) => acc + log.water, 0);
  const totalWaterGallons = (totalWaterMl / 3785.41).toFixed(1);
  const totalPhotos = logs.filter(l => l.photo !== null).length;
  
  // Get unique books read
  const books = Array.from(
    new Set(logs.map(l => l.readingBook).filter(book => book.trim() !== ''))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 16px' }}>
      
      {/* Page Header */}
      <div>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-move-ring)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          JOURNAL TIMELINE
        </span>
        <h1 className="ios-title" style={{ fontSize: '2.1rem', margin: '2px 0 0 0' }}>
          Day Chronicle
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
          Browse and search logged data, workouts, and photo updates.
        </p>
      </div>

      {/* Chronicle Stats Cards Grid */}
      <div className="chronicle-stats-grid">
        <div className="ios-card" style={{ padding: '12px', textAlign: 'center', marginBottom: 0 }}>
          <span style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Days Logged</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{logs.length}</span>
        </div>
        <div className="ios-card" style={{ padding: '12px', textAlign: 'center', marginBottom: 0 }}>
          <span style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Perfect Days</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-exercise-ring)' }}>{totalCompletedDays}</span>
        </div>
        <div className="ios-card" style={{ padding: '12px', textAlign: 'center', marginBottom: 0 }}>
          <span style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Workouts</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-move-ring)' }}>{totalWorkouts}</span>
        </div>
        <div className="ios-card" style={{ padding: '12px', textAlign: 'center', marginBottom: 0 }}>
          <span style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Water Int.</span>
          <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-recovery-ring)' }}>{totalWaterGallons} gal</span>
        </div>
        <div className="ios-card" style={{ padding: '12px', textAlign: 'center', marginBottom: 0 }}>
          <span style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Selfies</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-exercise-ring)' }}>{totalPhotos}</span>
        </div>
        <div className="ios-card" style={{ padding: '12px', textAlign: 'center', marginBottom: 0 }}>
          <span style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Books Read</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-orange)' }}>{books.length}</span>
        </div>
      </div>

      {/* Toolbar: Search and Status Filter */}
      <div className="chronicle-filter-bar">
        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="ios-input"
            placeholder="Search workouts, books, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '38px', height: '42px', marginBottom: 0 }}
          />
        </div>

        {/* Segmented Controller (Tabs filter) */}
        <div style={{ 
          display: 'flex', 
          background: 'rgba(255,255,255,0.04)', 
          borderRadius: '8px', 
          padding: '2px', 
          border: '1px solid rgba(255,255,255,0.02)',
          height: '42px',
          alignItems: 'center',
          width: '100%'
        }}>
          <button 
            onClick={() => setFilterStatus('all')}
            style={{ 
              flex: 1, 
              background: filterStatus === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent', 
              border: 'none', 
              color: '#fff', 
              height: '100%',
              fontSize: '0.8rem', 
              fontWeight: filterStatus === 'all' ? 700 : 500,
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            All
          </button>
          <button 
            onClick={() => setFilterStatus('completed')}
            style={{ 
              flex: 1, 
              background: filterStatus === 'completed' ? 'rgba(48, 209, 88, 0.2)' : 'transparent', 
              border: 'none', 
              color: filterStatus === 'completed' ? 'var(--color-exercise-ring)' : '#fff', 
              height: '100%',
              fontSize: '0.8rem', 
              fontWeight: filterStatus === 'completed' ? 700 : 500,
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Completed
          </button>
          <button 
            onClick={() => setFilterStatus('failed')}
            style={{ 
              flex: 1, 
              background: filterStatus === 'failed' ? 'rgba(255, 45, 85, 0.2)' : 'transparent', 
              border: 'none', 
              color: filterStatus === 'failed' ? 'var(--color-red)' : '#fff', 
              height: '100%',
              fontSize: '0.8rem', 
              fontWeight: filterStatus === 'failed' ? 700 : 500,
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Failed
          </button>
        </div>
      </div>

      {/* Feed Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <Layers size={38} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
            <p style={{ fontSize: '0.82rem', margin: 0 }}>No entries match your search criteria.</p>
          </div>
        ) : (
          filteredLogs.map(log => {
            const isExpanded = expandedDays[log.dayNumber] ?? true;

            return (
              <div 
                key={log.dayNumber} 
                className="ios-card" 
                style={{ 
                  padding: '0', 
                  overflow: 'hidden', 
                  marginBottom: 0,
                  borderLeft: log.completed 
                    ? '4px solid var(--color-exercise-ring)' 
                    : '4px solid var(--color-red)'
                }}
              >
                
                {/* Accordion header */}
                <div 
                  onClick={() => toggleExpand(log.dayNumber)}
                  style={{ 
                    padding: '14px 16px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.01)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>Day {log.dayNumber}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Calendar size={12} /> {log.date}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: 700, 
                      padding: '3px 8px', 
                      borderRadius: '4px',
                      background: log.completed ? 'rgba(48, 209, 88, 0.12)' : 'rgba(255, 45, 85, 0.12)',
                      color: log.completed ? 'var(--color-exercise-ring)' : 'var(--color-red)'
                    }}>
                      {log.completed ? 'PERFECT' : 'FAILED'}
                    </span>
                    {isExpanded ? <ChevronUp size={16} style={{ opacity: 0.6 }} /> : <ChevronDown size={16} style={{ opacity: 0.6 }} />}
                  </div>
                </div>

                {/* Collapsible details (grid side-by-side on desktop) */}
                {isExpanded && (
                  <div 
                    className="chronicle-detail-grid"
                    style={{ 
                      padding: '18px 20px', 
                      borderTop: '1px solid rgba(255,255,255,0.04)', 
                      background: 'rgba(0,0,0,0.1)' 
                    }}
                  >
                    
                    {/* Log items checklist specs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8rem' }}>
                      
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <Dumbbell size={14} style={{ flexShrink: 0, marginTop: '2px', color: log.workout1 ? 'var(--color-move-ring)' : 'var(--text-secondary)' }} />
                        <div>
                          <strong style={{ display: 'block', color: '#fff' }}>Workout 1</strong>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{log.workout1Desc || (log.workout1 ? 'Completed' : 'Skipped')}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <Dumbbell size={14} style={{ flexShrink: 0, marginTop: '2px', color: log.workout2 ? 'var(--color-exercise-ring)' : 'var(--text-secondary)' }} />
                        <div>
                          <strong style={{ display: 'block', color: '#fff' }}>Workout 2</strong>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{log.workout2Desc || (log.workout2 ? 'Completed' : 'Skipped')}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <Footprints size={14} style={{ flexShrink: 0, marginTop: '2px', color: log.steps10k ? 'var(--color-orange)' : 'var(--text-secondary)' }} />
                        <div>
                          <strong style={{ display: 'block', color: '#fff' }}>10k Steps</strong>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{log.steps10k ? 'Target met' : 'Skipped'}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <Droplet size={14} style={{ flexShrink: 0, marginTop: '2px', color: log.water >= log.waterGoal ? 'var(--color-recovery-ring)' : 'var(--text-secondary)' }} />
                        <div>
                          <strong style={{ display: 'block', color: '#fff' }}>Hydration</strong>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{log.water}ml consumed</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <Moon size={14} style={{ flexShrink: 0, marginTop: '2px', color: log.sleep ? '#7c4dff' : 'var(--text-secondary)' }} />
                        <div>
                          <strong style={{ display: 'block', color: '#fff' }}>Sleep Target</strong>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{log.sleep ? '8 Hours Rest' : 'Skipped'}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <Utensils size={14} style={{ flexShrink: 0, marginTop: '2px', color: log.diet ? 'var(--color-move-ring)' : 'var(--text-secondary)' }} />
                        <div>
                          <strong style={{ display: 'block', color: '#fff' }}>Clean Diet</strong>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{log.dietDesc || (log.diet ? 'Diet clean' : 'Skipped')}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <BookOpen size={14} style={{ flexShrink: 0, marginTop: '2px', color: log.reading ? 'var(--color-stand-ring)' : 'var(--text-secondary)' }} />
                        <div>
                          <strong style={{ display: 'block', color: '#fff' }}>Reading Pages</strong>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{log.readingBook ? `${log.readingBook} (${log.readingPages} pgs)` : (log.reading ? 'Completed' : 'Skipped')}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <Camera size={14} style={{ flexShrink: 0, marginTop: '2px', color: log.photo ? 'var(--color-exercise-ring)' : 'var(--text-secondary)' }} />
                        <div>
                          <strong style={{ display: 'block', color: '#fff' }}>Progress Photo</strong>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{log.photo ? 'Logged' : 'No photo'}</span>
                        </div>
                      </div>

                    </div>

                    {/* Image and journal section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {log.photo && (
                        <div style={{ width: '100%', height: '160px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <img src={log.photo} alt={`Day ${log.dayNumber} progress`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      
                      {log.journal && (
                        <div style={{ 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid rgba(255,255,255,0.04)', 
                          padding: '14px', 
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          color: '#fff',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {log.journal}
                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
