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
import confetti from 'canvas-confetti';
import { FileText, Brain, HelpCircle, AlertCircle, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'simulasi_rme_v2_state';

export const App: React.FC = () => {
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCaseIndex, setSelectedCaseIndex] = useState<number>(0);
  const [activeMainTab, setActiveMainTab] = useState<'emr' | 'scaffolding' | 'quiz'>('scaffolding');
  const [scaffoldingTabIndex, setScaffoldingTabIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<StudentAnswers>({});
  const [studentName, setStudentName] = useState<string>('');
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

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

  // Calculate Total XP & Level
  let totalXP = 0;
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
        totalXP += 10;
        cCompleted++;
      }
    });

    if (cTabs.length > 0 && cCompleted === cTabs.length) {
      completedCasesCount++;
    }

    if (caseSession.quizScore && typeof caseSession.quizScore.correct === 'number') {
      totalXP += caseSession.quizScore.correct * 5;
    }
  });

  const level = Math.floor(totalXP / 50) + 1;

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
      // Completed all tabs! Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      // Switch to quiz if quiz exists
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

    if (score.correct > 0) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  const handleResetKiosk = () => {
    if (window.confirm('Reset semua progress dan data untuk pengunjung booth berikutnya?')) {
      setAnswers({});
      setStudentName('');
      setSelectedCaseIndex(0);
      setScaffoldingTabIndex(0);
      setActiveMainTab('scaffolding');
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 gap-3">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Memuat Bank Kasus Penalaran Klinis...</p>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-base font-bold">Gagal memuat bank kasus</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Pastikan file JSON kasus tersedia di direktori public aplikasi.
        </p>
      </div>
    );
  }

  const currentTab = tabs[scaffoldingTabIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <Navbar
        studentName={studentName}
        onStudentNameChange={setStudentName}
        totalXP={totalXP}
        level={level}
        onResetKiosk={handleResetKiosk}
        onOpenReport={() => setIsReportOpen(true)}
        totalCompletedCases={completedCasesCount}
        totalCases={cases.length}
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
        <main className="flex-1 flex flex-col overflow-y-auto bg-slate-950">
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
              <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-2 flex items-center justify-between no-print sticky top-0 z-20 backdrop-blur">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveMainTab('emr')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeMainTab === 'emr'
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Rekam Medis (EMR Chart)</span>
                  </button>

                  <button
                    onClick={() => setActiveMainTab('scaffolding')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeMainTab === 'scaffolding'
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>Alur Scaffolding & Penalaran</span>
                  </button>

                  {quizItems.length > 0 && (
                    <button
                      onClick={() => setActiveMainTab('quiz')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                        activeMainTab === 'quiz'
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Kuis SKDI ({quizItems.length})</span>
                    </button>
                  )}
                </div>

                {/* Sub-steps pills for scaffolding */}
                {activeMainTab === 'scaffolding' && tabs.length > 1 && (
                  <div className="hidden md:flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {tabs.map((t, idx) => {
                      const tabAns = currentTabsAnswers[t.id] || {};
                      const gateQs = t.gate_questions || [];
                      const isCompleted = gateQs.length > 0 && gateQs.every(q => (tabAns[q.id] || '').trim().length > 0);
                      const isCurrent = idx === scaffoldingTabIndex;

                      return (
                        <button
                          key={t.id}
                          onClick={() => setScaffoldingTabIndex(idx)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition flex items-center gap-1.5 ${
                            isCurrent
                              ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                              : isCompleted
                              ? 'text-emerald-400 hover:bg-slate-800'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <span>{t.title}</span>
                          {isCompleted && !isCurrent && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
        totalXP={totalXP}
        level={level}
      />
    </div>
  );
};
