import React, { useState, useEffect } from 'react';
import { ClinicalCase, StudentAnswers } from './types/clinical';
import { loadAllCases, getTabs, getQuizItems } from './lib/caseLoader';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PatientBanner } from './components/PatientBanner';
import { EMRViewTab } from './components/tabs/EMRViewTab';
import { ScaffoldingTab } from './components/tabs/ScaffoldingTab';
import { QuizTab } from './components/tabs/QuizTab';
import { ScoreReportModal } from './components/ScoreReportModal';
import { IdleResetModal } from './components/IdleResetModal';
import { useIdleTimer } from './hooks/useIdleTimer';
import { FileText, Brain, HelpCircle, AlertCircle, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'simulasi_rme_v2_state';
const THEME_KEY = 'simulasi_rme_theme';

export const App: React.FC = () => {
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCaseIndex, setSelectedCaseIndex] = useState<number>(0);
  const [activeMainTab, setActiveMainTab] = useState<'emr' | 'scaffolding' | 'quiz'>('scaffolding');
  const [scaffoldingTabIndex, setScaffoldingTabIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<StudentAnswers>({});
  const [studentName, setStudentName] = useState<string>('');
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme from storage or default to light
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;
    const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Pure reset function without confirm dialog for automated idle reset
  const resetKioskState = () => {
    setAnswers({});
    setStudentName('');
    setSelectedCaseIndex(0);
    setScaffoldingTabIndex(0);
    setActiveMainTab('scaffolding');
    setIsReportOpen(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Check if student has started interacting with any content
  const hasUserProgress = Object.keys(answers).length > 0 || studentName.trim().length > 0;

  // 2-minute inactivity timer with 15s warning modal before auto-reset
  const { isWarning, secondsRemaining, stayActive, triggerReset } = useIdleTimer({
    timeoutMs: 120_000,
    countdownMs: 15_000,
    onReset: resetKioskState,
    enabled: !loading && hasUserProgress,
  });

  // Load cases and saved state on mount
  useEffect(() => {
    async function init() {
      try {
        const loadedCases = await loadAllCases();
        setCases(loadedCases);

        // Load saved state from localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.answers) setAnswers(parsed.answers);
            if (parsed.studentName) setStudentName(parsed.studentName);
            if (typeof parsed.selectedCaseIndex === 'number' && parsed.selectedCaseIndex < loadedCases.length) {
              setSelectedCaseIndex(parsed.selectedCaseIndex);
            }
          } catch (e) {
            console.error('Failed to parse saved state:', e);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Persist state
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        answers,
        studentName,
        selectedCaseIndex
      }));
    }
  }, [answers, studentName, selectedCaseIndex, loading]);

  const currentCase = cases[selectedCaseIndex];
  const tabs = currentCase ? getTabs(currentCase) : [];
  const quizItems = currentCase ? getQuizItems(currentCase) : [];

  // Calculate completed tabs count for current case
  const currentCaseSession = currentCase ? (answers[currentCase.case_id] || { tabsAnswers: {} }) : { tabsAnswers: {} };
  const currentTabsAnswers = currentCaseSession.tabsAnswers || {};

  let completedTabsCount = 0;
  tabs.forEach(tab => {
    const tabAns = currentTabsAnswers[tab.id] || {};
    const gateQs = tab.gate_questions || [];
    if (gateQs.length > 0 && gateQs.every(q => (tabAns[q.id] || '').trim().length > 0)) {
      completedTabsCount++;
    }
  });

  // Calculate completed cases count
  let completedCasesCount = 0;
  cases.forEach(c => {
    const caseSession = answers[c.case_id];
    if (!caseSession) return;
    const cTabs = getTabs(c);
    const cTabsAns = caseSession.tabsAnswers || {};
    let cCompleted = 0;

    cTabs.forEach(tab => {
      const tabAns = cTabsAns[tab.id] || {};
      const gateQs = tab.gate_questions || [];
      if (gateQs.length > 0 && gateQs.every(q => (tabAns[q.id] || '').trim().length > 0)) {
        cCompleted++;
      }
    });

    if (cTabs.length > 0 && cCompleted === cTabs.length) {
      completedCasesCount++;
    }
  });

  // Handlers
  const handleSelectCase = (index: number) => {
    setSelectedCaseIndex(index);
    setScaffoldingTabIndex(0);
    setActiveMainTab('scaffolding');
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    if (!currentCase) return;
    const currentTab = tabs[scaffoldingTabIndex];
    if (!currentTab) return;

    setAnswers(prev => {
      const caseSession = prev[currentCase.case_id] || { tabsAnswers: {} };
      const currentTabMap = caseSession.tabsAnswers?.[currentTab.id] || {};

      return {
        ...prev,
        [currentCase.case_id]: {
          ...caseSession,
          tabsAnswers: {
            ...caseSession.tabsAnswers,
            [currentTab.id]: {
              ...currentTabMap,
              [questionId]: value,
            }
          }
        }
      };
    });
  };

  const handleSaveAndNext = () => {
    if (!currentCase) return;

    if (scaffoldingTabIndex < tabs.length - 1) {
      setScaffoldingTabIndex(prev => prev + 1);
    } else {
      if (quizItems.length > 0) {
        setActiveMainTab('quiz');
      }
    }
  };

  const handleQuizOptionSelect = (quizId: string, optionKey: string) => {
    if (!currentCase) return;
    setAnswers(prev => {
      const caseSession = prev[currentCase.case_id] || { tabsAnswers: {} };
      return {
        ...prev,
        [currentCase.case_id]: {
          ...caseSession,
          quiz: {
            ...(caseSession.quiz || {}),
            [quizId]: optionKey,
          }
        }
      };
    });
  };

  const handleQuizSubmit = (score: { correct: number; total: number }) => {
    if (!currentCase) return;
    setAnswers(prev => {
      const caseSession = prev[currentCase.case_id] || { tabsAnswers: {} };
      return {
        ...prev,
        [currentCase.case_id]: {
          ...caseSession,
          quizScore: score,
        }
      };
    });
  };

  const handleManualReset = () => {
    if (window.confirm('Reset semua progress dan data untuk pengunjung booth berikutnya?')) {
      resetKioskState();
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-slate-100 gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Memuat Bank Kasus Klinis...</p>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-slate-100 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-600 mb-3" />
        <h2 className="text-base font-bold">Gagal memuat bank kasus</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Pastikan file kasus tersedia di direktori public aplikasi.
        </p>
      </div>
    );
  }

  const currentTab = tabs[scaffoldingTabIndex];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden transition-colors">
      {/* Top Navigation */}
      <Navbar
        studentName={studentName}
        onStudentNameChange={setStudentName}
        onResetKiosk={handleManualReset}
        onOpenReport={() => setIsReportOpen(true)}
        totalCompletedCases={completedCasesCount}
        totalCases={cases.length}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          cases={cases}
          selectedCaseIndex={selectedCaseIndex}
          onSelectCase={handleSelectCase}
          answers={answers}
        />

        {/* Right Main Stage */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50/50 dark:bg-slate-950">
          {currentCase && (
            <>
              {/* Patient Banner */}
              <PatientBanner
                currentCase={currentCase}
                completedTabsCount={completedTabsCount}
                totalTabsCount={tabs.length}
                quizScore={currentCaseSession.quizScore}
              />

              {/* Mode Switcher Tabs Header */}
              <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between no-print sticky top-0 z-20">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveMainTab('scaffolding')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeMainTab === 'scaffolding'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>Penalaran Klinis (Scaffolding)</span>
                  </button>

                  <button
                    onClick={() => setActiveMainTab('emr')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeMainTab === 'emr'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Rekam Medis (EMR View)</span>
                  </button>

                  {quizItems.length > 0 && (
                    <button
                      onClick={() => setActiveMainTab('quiz')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        activeMainTab === 'quiz'
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Kuis Formatif ({quizItems.length})</span>
                    </button>
                  )}
                </div>

                {/* Sub-steps pills for scaffolding */}
                {activeMainTab === 'scaffolding' && tabs.length > 1 && (
                  <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                    {tabs.map((t, idx) => {
                      const tabAns = currentTabsAnswers[t.id] || {};
                      const gateQs = t.gate_questions || [];
                      const isCompleted = gateQs.length > 0 && gateQs.every(q => (tabAns[q.id] || '').trim().length > 0);
                      const isCurrent = idx === scaffoldingTabIndex;

                      return (
                        <button
                          key={t.id}
                          onClick={() => setScaffoldingTabIndex(idx)}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded transition flex items-center gap-1.5 ${
                            isCurrent
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                              : isCompleted
                              ? 'text-emerald-700 dark:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          <span>{t.title}</span>
                          {isCompleted && !isCurrent && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tab Stage Content */}
              <div className="p-6 flex-1">
                {activeMainTab === 'emr' && (
                  <EMRViewTab currentCase={currentCase} />
                )}

                {activeMainTab === 'scaffolding' && currentTab && (
                  <ScaffoldingTab
                    currentTab={currentTab}
                    tabIndex={scaffoldingTabIndex}
                    totalTabs={tabs.length}
                    caseAnswers={currentTabsAnswers[currentTab.id] || {}}
                    onAnswerChange={handleAnswerChange}
                    onSaveAndNext={handleSaveAndNext}
                    currentCase={currentCase}
                  />
                )}

                {activeMainTab === 'quiz' && (
                  <QuizTab
                    quizItems={quizItems}
                    quizAnswers={currentCaseSession.quiz || {}}
                    onSelectOption={handleQuizOptionSelect}
                    onSubmitQuiz={handleQuizSubmit}
                    savedScore={currentCaseSession.quizScore}
                  />
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Score / Certificate Report Modal */}
      <ScoreReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        studentName={studentName}
        cases={cases}
        answers={answers}
      />

      {/* Kiosk Auto-Reset Idle Modal */}
      <IdleResetModal
        isOpen={isWarning}
        secondsRemaining={secondsRemaining}
        onStay={stayActive}
        onResetNow={triggerReset}
      />
    </div>
  );
};
