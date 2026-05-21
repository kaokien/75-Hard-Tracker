import { useState, useEffect, useCallback } from 'react';
import { 
  Flame, 
  Grid, 
  BookOpen, 
  TrendingUp, 
  User,
  Settings
} from 'lucide-react';
import { 
  saveAttempt, 
  saveDayLog, 
  getAllAttempts, 
  getAttemptLogs
} from './db';
import type { Attempt, DayLog } from './db';
import { loadGamificationState, saveGamificationState, awardXP, BONUS_XP, type GamificationState } from './gamification';
import { analytics } from './analytics';
import { Dashboard } from './components/Dashboard';
import { Grid75 } from './components/Grid75';
import { Chronicle } from './components/Chronicle';
import { HistoryView } from './components/HistoryView';
import { Showcase } from './components/Showcase';
import { ConfirmModal } from './components/ConfirmModal';
import { Toast } from './components/Toast';
import { Onboarding } from './components/Onboarding';

type View = 'today' | 'progress' | 'plan' | 'insights' | 'profile';

function App() {
  const [activeTab, setActiveTab] = useState<View>('today');
  const [activeAttempt, setActiveAttempt] = useState<Attempt | null>(null);
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // Settings state
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('75hard_user_name') || 'Athlete');
  const [waterGoal, setWaterGoal] = useState(() => parseInt(localStorage.getItem('75hard_water_goal') || '3785')); // 1 Gallon in ml
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    requiresInput?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [toast, setToast] = useState<{ message: string; isVisible: boolean; variant?: 'success' | 'warning' | 'info' }>({ message: '', isVisible: false });

  const showConfirm = (opts: Omit<typeof confirmModal, 'isOpen'>) => {
    setConfirmModal({ ...opts, isOpen: true });
  };
  const showToast = (message: string, variant: 'success' | 'warning' | 'info' = 'success') => {
    setToast({ message, isVisible: true, variant });
  };
  
  // Start date for new attempts
  const [newAttemptDate, setNewAttemptDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Gamification state
  const [gamification, setGamification] = useState<GamificationState>(() => loadGamificationState());
  const [showOnboarding, setShowOnboarding] = useState(() => !loadGamificationState().onboardingComplete);



  // Load active attempt & its logs
  const loadActiveData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allAttempts = await getAllAttempts();
      const active = allAttempts.find(a => a.status === 'active');
      
      if (active) {
        setActiveAttempt(active);
        const attemptLogs = await getAttemptLogs(active.id);
        
        // Calculate Day Number based on date difference
        const start = new Date(active.startDate);
        const today = new Date();
        start.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        
        const diffTime = Math.abs(today.getTime() - start.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const computedDay = Math.min(75, Math.max(1, diffDays));
        setCurrentDay(computedDay);

        // Ensure DayLogs exist for all days from 1 to computedDay
        const updatedLogs = [...attemptLogs];
        let hasChanges = false;
        
        for (let i = 1; i <= computedDay; i++) {
          const exists = updatedLogs.find(l => l.dayNumber === i);
          if (!exists) {
            const dayDate = new Date(start);
            dayDate.setDate(start.getDate() + (i - 1));
            
            const newLog: DayLog = {
              id: `${active.id}-${i}`,
              attemptId: active.id,
              dayNumber: i,
              date: dayDate.toISOString().split('T')[0],
              workout1: false,
              workout1Desc: '',
              workout2: false,
              workout2Desc: '',
              water: 0,
              waterGoal: waterGoal,
              diet: false,
              dietDesc: '',
              reading: false,
              readingBook: '',
              readingPages: 0,
              photo: null,
              journal: '',
              completed: false,
              failed: false,
              sleep: false,
              steps10k: false
            };
            updatedLogs.push(newLog);
            await saveDayLog(newLog);
            hasChanges = true;
          }
        }

        if (hasChanges) {
          updatedLogs.sort((a, b) => a.dayNumber - b.dayNumber);
        }
        setLogs(updatedLogs);
      } else {
        setActiveAttempt(null);
        setLogs([]);
        setCurrentDay(1);
      }
    } catch (err) {
      console.error("Error loading challenge data", err);
    } finally {
      setIsLoading(false);
    }
  }, [waterGoal]);

  useEffect(() => {
    loadActiveData();
  }, [loadActiveData]);

  // Start new attempt
  const handleStartChallenge = async () => {
    const attemptId = `attempt_${Date.now()}`;
    const newAttempt: Attempt = {
      id: attemptId,
      startDate: newAttemptDate,
      endDate: null,
      status: 'active',
      failureDay: null,
      failureReason: null
    };

    setIsLoading(true);
    try {
      await saveAttempt(newAttempt);
      
      const day1: DayLog = {
        id: `${attemptId}-1`,
        attemptId: attemptId,
        dayNumber: 1,
        date: newAttemptDate,
        workout1: false,
        workout1Desc: '',
        workout2: false,
        workout2Desc: '',
        water: 0,
        waterGoal: waterGoal,
        diet: false,
        dietDesc: '',
        reading: false,
        readingBook: '',
        readingPages: 0,
        photo: null,
        journal: '',
        completed: false,
        failed: false,
        sleep: false,
        steps10k: false
      };
      await saveDayLog(day1);
      
      localStorage.setItem('75hard_user_name', userName);
      localStorage.setItem('75hard_water_goal', waterGoal.toString());
      
      setIsSetupOpen(false);
      await loadActiveData();
      setActiveTab('today');
    } catch (err) {
      showToast('Failed to start challenge', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  // Fail and archive attempt
  const handleFailAttempt = async (dayNumber: number, reason: string) => {
    if (!activeAttempt) return;

    showConfirm({
      title: 'Confirm Failure',
      message: `Log fail on Day ${dayNumber}? This archives current attempt data and resets to Day 1.`,
      confirmLabel: 'Yes, Log Failure',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsLoading(true);
        try {
          const archivedAttempt: Attempt = {
            ...activeAttempt,
            status: 'failed',
            endDate: new Date().toISOString().split('T')[0],
            failureDay: dayNumber,
            failureReason: reason
          };
          await saveAttempt(archivedAttempt);

          const failedDayLog = logs.find(l => l.dayNumber === dayNumber);
          if (failedDayLog) {
            failedDayLog.failed = true;
            await saveDayLog(failedDayLog);
          }

          showToast("Attempt archived. Let's start fresh!");
          await loadActiveData();
        } catch (err) {
          showToast('Failed to record failure', 'warning');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Save day log
  const handleSaveDayLog = async (updatedLog: DayLog) => {
    try {
      await saveDayLog(updatedLog);
      setLogs(prev => prev.map(l => l.dayNumber === updatedLog.dayNumber ? updatedLog : l));
      
      if (updatedLog.dayNumber === 75 && updatedLog.completed && activeAttempt) {
        const successAttempt: Attempt = {
          ...activeAttempt,
          status: 'completed',
          endDate: updatedLog.date
        };
        await saveAttempt(successAttempt);
        showToast('🏆 75 Days Completed! You are a beast!');
        loadActiveData();
      }
    } catch (err) {
      console.error("Failed to save progress log", err);
    }
  };

  return (
    <div className="app-layout">
      {/* Skip link for keyboard navigation */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Sidebar Navigation - Desktop */}
      {activeAttempt && (
        <div className="sidebar-nav">
          <div>
            <div className="sidebar-logo" onClick={() => setActiveTab('today')}>
              <Flame size={28} fill="var(--color-move-ring)" strokeWidth={0} />
              <span className="ios-title" style={{ fontSize: '1.25rem', letterSpacing: '-0.02em' }}>75 Day Track</span>
            </div>

            <nav className="sidebar-menu" aria-label="Main navigation">
              <div 
                className={`sidebar-menu-item ${activeTab === 'today' ? 'active' : ''}`}
                onClick={() => setActiveTab('today')}
              >
                <Flame size={18} fill={activeTab === 'today' ? 'var(--color-move-ring)' : 'none'} />
                <span>Today's Track</span>
              </div>

              <div 
                className={`sidebar-menu-item ${activeTab === 'progress' ? 'active' : ''}`}
                onClick={() => setActiveTab('progress')}
              >
                <Grid size={18} />
                <span>75 Day Grid</span>
              </div>

              <div 
                className={`sidebar-menu-item ${activeTab === 'plan' ? 'active' : ''}`}
                onClick={() => setActiveTab('plan')}
              >
                <BookOpen size={18} />
                <span>Chronicle Feed</span>
              </div>

              <div 
                className={`sidebar-menu-item ${activeTab === 'insights' ? 'active' : ''}`}
                onClick={() => setActiveTab('insights')}
              >
                <TrendingUp size={18} />
                <span>Attempts Archive</span>
              </div>

              <div 
                className={`sidebar-menu-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} fill={activeTab === 'profile' ? 'var(--color-move-ring)' : 'none'} />
                <span>Showcase Card</span>
              </div>
            </nav>
          </div>

          <div className="sidebar-status-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Flame size={16} fill="var(--color-move-ring)" strokeWidth={0} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Attempt Info</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Day {currentDay} of 75
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Athlete: {userName}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button 
                className="ios-btn ios-btn-secondary" 
                style={{ padding: '8px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
                onClick={() => setIsSetupOpen(true)}
              >
                <Settings size={12} /> Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="main-content" id="main-content">
        {/* Mobile Top Header */}
        {activeAttempt && (
          <div className="mobile-top-header">
            <div className="sidebar-logo" onClick={() => setActiveTab('today')}>
              <Flame size={24} fill="var(--color-move-ring)" strokeWidth={0} />
              <span className="ios-title" style={{ fontSize: '1.1rem' }}>75 Day Track</span>
            </div>
            <button 
              className="ios-btn ios-btn-secondary" 
              style={{ width: 'auto', padding: '8px', borderRadius: '50%' }}
              onClick={() => setIsSetupOpen(true)}
            >
              <Settings size={18} />
            </button>
          </div>
        )}

        {/* View render */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              border: '3px solid rgba(255,255,255,0.05)', 
              borderTopColor: 'var(--color-move-ring)', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              marginBottom: '12px'
            }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Synchronizing Database...</span>
          </div>
        ) : !activeAttempt ? (
          /* Onboarding gate + Setup landing view */
          showOnboarding ? (
            <Onboarding
              defaultName={userName}
              onComplete={(data) => {
                // Save onboarding data
                setUserName(data.name);
                localStorage.setItem('75hard_user_name', data.name);
                setNewAttemptDate(data.startDate);
                setWaterGoal(data.waterGoal);
                localStorage.setItem('75hard_water_goal', String(data.waterGoal));

                // Award onboarding XP
                const gs = { ...gamification };
                gs.onboardingComplete = true;
                gs.pledge = data.pledge;
                gs.why = data.why;
                awardXP(gs, BONUS_XP.commitmentPledge, 'commitment');
                awardXP(gs, BONUS_XP.chooseYourWhy, 'choose_why');
                gs.lastSession = new Date().toISOString();
                saveGamificationState(gs);
                setGamification(gs);
                setShowOnboarding(false);

                analytics.profileCreated(data.waterGoal, 0);
              }}
            />
          ) : (
          /* Setup landing view - expanded for desktop screen layout */
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '20px 0' }}>
            <div className="ios-card" style={{ maxWidth: '480px', width: '100%', padding: '30px', border: '1px solid var(--border-color)' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, var(--color-move-ring), var(--color-orange))', 
                color: '#fff', 
                width: '60px', 
                height: '60px', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '20px',
                boxShadow: '0 8px 16px rgba(255,45,85,0.3)'
              }}>
                <Flame size={32} fill="#fff" />
              </div>
              <h1 className="ios-title" style={{ fontSize: '2.2rem', marginBottom: '8px', lineHeight: '1.1' }}>
                75 Day Track
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '24px', lineHeight: '1.4' }}>
                A premium visual diary of mental toughness and physical consistency. Build streaks, log entries, and capture photos.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="ios-form-label">Athlete Name</label>
                  <input 
                    type="text" 
                    className="ios-input" 
                    value={userName} 
                    onChange={(e) => setUserName(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="ios-form-label">Challenge Start Date</label>
                  <input 
                    type="date" 
                    className="ios-input" 
                    value={newAttemptDate} 
                    onChange={(e) => setNewAttemptDate(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="ios-form-label">Daily Hydration Target</label>
                  <select 
                    className="ios-input" 
                    value={waterGoal} 
                    onChange={(e) => setWaterGoal(parseInt(e.target.value))}
                    style={{ height: '46px', WebkitAppearance: 'none' }}
                  >
                    <option value={3785}>1 Gallon (3,785 ml)</option>
                    <option value={4000}>4.0 Liters (4,000 ml)</option>
                    <option value={3000}>3.0 Liters (3,000 ml)</option>
                    <option value={3500}>3.5 Liters (3,500 ml)</option>
                  </select>
                </div>
              </div>

              <div style={{ width: '100%', marginTop: '24px' }}>
                <button 
                  className="ios-btn ios-btn-primary" 
                  onClick={handleStartChallenge}
                  style={{ background: 'linear-gradient(90deg, var(--color-move-ring), var(--color-orange))' }}
                >
                  Start Challenge
                </button>
                <button 
                  className="ios-btn ios-btn-secondary" 
                  style={{ marginTop: '10px' }}
                  onClick={async () => {
                    const list = await getAllAttempts();
                    if (list.length > 0) {
                      setActiveAttempt({ id: '', status: 'failed', startDate: '', endDate: null, failureDay: null, failureReason: null });
                      setActiveTab('insights');
                    } else {
                      showToast('No archived attempts found.', 'info');
                    }
                  }}
                >
                  Browse Archived History
                </button>
              </div>
            </div>
            </div>
          )
          /* end onboarding ternary */
        ) : (
          /* Active Views */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'today' && (
              <Dashboard 
                dayLog={logs.find(l => l.dayNumber === currentDay) || null}
                onSaveDayLog={handleSaveDayLog}
                onFailAttempt={handleFailAttempt}
                userName={userName}
                activeTabSetter={setActiveTab}
                logs={logs}
                gamification={gamification}
                onGamificationUpdate={(gs) => setGamification(gs)}
              />
            )}

            {activeTab === 'progress' && (
              <Grid75 
                logs={logs}
                currentDay={currentDay}
                onSelectDay={(dayNum) => {
                  if (dayNum === currentDay) {
                    setActiveTab('today');
                  }
                }}
              />
            )}

            {activeTab === 'plan' && (
              <Chronicle logs={logs} />
            )}

            {activeTab === 'insights' && (
              <HistoryView 
                activeAttemptId={activeAttempt.id}
                onRefreshHistory={loadActiveData}
              />
            )}

            {activeTab === 'profile' && (
              <Showcase 
                logs={logs} 
                currentDay={currentDay}
                onRefreshAllData={loadActiveData}
                onOpenSettings={() => setIsSetupOpen(true)}
              />
            )}
          </div>
        )}
      </main>

      {/* iOS Bottom Tab Bar (Visible on mobile screens) */}
      {activeAttempt && (
        <nav className="ios-tab-bar" aria-label="Tab navigation">
          <div 
            className={`ios-tab-item ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            <Flame size={20} fill={activeTab === 'today' ? 'var(--color-move-ring)' : 'none'} />
            <span>Today</span>
          </div>

          <div 
            className={`ios-tab-item ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            <Grid size={20} />
            <span>Progress</span>
          </div>

          <div 
            className={`ios-tab-item ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            <BookOpen size={20} />
            <span>Plan</span>
          </div>

          <div 
            className={`ios-tab-item ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <TrendingUp size={20} />
            <span>Insights</span>
          </div>

          <div 
            className={`ios-tab-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} fill={activeTab === 'profile' ? 'var(--color-move-ring)' : 'none'} />
            <span>Profile</span>
          </div>
        </nav>
      )}

      {/* Global Config Settings Slide-up Modal */}
      {isSetupOpen && (
        <div className="ios-bottom-sheet-overlay" onClick={() => setIsSetupOpen(false)}>
          <div className="ios-bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ios-bottom-sheet-handle" />
            
            <h2 className="ios-title" style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={22} className="text-secondary" /> Settings & Goals
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label className="ios-form-label">Athlete Name</label>
                <input 
                  type="text" 
                  className="ios-input" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                />
              </div>

              <div>
                <label className="ios-form-label">Water Target (ml)</label>
                <input 
                  type="number" 
                  className="ios-input" 
                  value={waterGoal} 
                  onChange={(e) => setWaterGoal(parseInt(e.target.value) || 0)} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                className="ios-btn ios-btn-primary" 
                onClick={() => {
                  localStorage.setItem('75hard_user_name', userName);
                  localStorage.setItem('75hard_water_goal', waterGoal.toString());
                  
                  if (activeAttempt) {
                    const updatedLogs = logs.map(l => {
                      if (l.dayNumber === currentDay) {
                        return { ...l, waterGoal };
                      }
                      return l;
                    });
                    setLogs(updatedLogs);
                    const currentLog = logs.find(l => l.dayNumber === currentDay);
                    if (currentLog) {
                      saveDayLog({ ...currentLog, waterGoal });
                    }
                  }
                  setIsSetupOpen(false);
                }}
              >
                Save Settings
              </button>

              <button 
                className="ios-btn ios-btn-secondary" 
                onClick={() => setIsSetupOpen(false)}
              >
                Cancel
              </button>

              <button 
                className="ios-btn ios-btn-danger" 
                style={{ marginTop: '10px' }}
                onClick={() => {
                  showConfirm({
                    title: 'Wipe All Data',
                    message: 'This will permanently delete ALL database logs, attempts history, and progress photos. This cannot be undone.',
                    confirmLabel: 'Delete Everything',
                    variant: 'danger',
                    requiresInput: 'DELETE ALL',
                    onConfirm: () => {
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                      indexedDB.deleteDatabase('75HardTrackerDB');
                      localStorage.clear();
                      window.location.reload();
                    }
                  });
                }}
              >
                Wipe All App Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled inline animation for loading spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
        requiresInput={confirmModal.requiresInput}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        variant={toast.variant}
        onDismiss={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}

export default App;
