import React, { useState, useMemo } from 'react';
import { ClinicalCase, StudentAnswers } from '../types/clinical';
import { getCaseTitle, getCaseSetting, getCaseDepartment, getCaseDifficulty, getTabs } from '../lib/caseLoader';
import { Search, CheckCircle2, X } from 'lucide-react';

interface SidebarProps {
  cases: ClinicalCase[];
  selectedCaseIndex: number;
  onSelectCase: (index: number) => void;
  answers: StudentAnswers;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  cases,
  selectedCaseIndex,
  onSelectCase,
  answers,
  isOpen = false,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'rajal' | 'ranap'>('all');

  const filteredCases = useMemo(() => {
    return cases.map((c, originalIndex) => ({ c, originalIndex })).filter(({ c }) => {
      const title = getCaseTitle(c).toLowerCase();
      const setting = getCaseSetting(c).toLowerCase();
      const dept = getCaseDepartment(c).toLowerCase();
      const condition = (c.skdi_condition || c.primary_diagnosis || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        title.includes(query) ||
        setting.includes(query) ||
        dept.includes(query) ||
        condition.includes(query) ||
        (c.case_id && c.case_id.toLowerCase().includes(query));

      const isRanap = setting.includes('ranap') || setting.includes('inpatient') || c.encounter_type === 'inpatient' || Boolean(c.timeline);
      
      if (filterType === 'rajal' && isRanap) return false;
      if (filterType === 'ranap' && !isRanap) return false;

      return matchesSearch;
    });
  }, [cases, searchQuery, filterType]);

  const isCaseCompleted = (c: ClinicalCase) => {
    const caseAns = answers[c.case_id];
    if (!caseAns || !caseAns.tabsAnswers) return false;
    const tabs = getTabs(c);
    if (!tabs.length) return false;

    const allTabsFilled = tabs.every(tab => {
      const tabAns = caseAns.tabsAnswers[tab.id] || {};
      const gateQs = tab.gate_questions || [];
      return gateQs.length > 0 && gateQs.every(q => (tabAns[q.id] || '').trim().length > 0);
    });

    return allTabsFilled;
  };

  const handleCaseClick = (index: number) => {
    onSelectCase(index);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile/Tablet Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar / Off-canvas Drawer */}
      <aside
        className={`fixed lg:static top-14 bottom-0 left-0 z-40 w-72 sm:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] shrink-0 no-print transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Search & Filter */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center justify-between lg:hidden mb-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Daftar Kasus Pasien</span>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama kasus / diagnosis..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-md pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
            />
          </div>

          {/* Filter Segmented Buttons */}
          <div className="flex rounded-md bg-slate-200/70 dark:bg-slate-800 p-0.5 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition touch-manipulation ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Semua ({cases.length})
            </button>
            <button
              onClick={() => setFilterType('rajal')}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition touch-manipulation ${
                filterType === 'rajal'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Rawat Jalan
            </button>
            <button
              onClick={() => setFilterType('ranap')}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition touch-manipulation ${
                filterType === 'ranap'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Rawat Inap
            </button>
          </div>
        </div>

        {/* Case List Scroll Area */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredCases.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-xs text-slate-400">Tidak ada kasus yang sesuai kata kunci.</p>
            </div>
          ) : (
            filteredCases.map(({ c, originalIndex }) => {
              const isSelected = selectedCaseIndex === originalIndex;
              const completed = isCaseCompleted(c);
              const difficulty = getCaseDifficulty(c);

              return (
                <div
                  key={c.case_id || originalIndex}
                  onClick={() => handleCaseClick(originalIndex)}
                  className={`p-3 rounded-lg cursor-pointer border text-left transition-all touch-manipulation min-h-[56px] ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-slate-800 border-emerald-600 dark:border-emerald-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                      {c.case_id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {completed && (
                        <span className="flex items-center gap-0.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Selesai
                        </span>
                      )}
                      {c.skdi_level && (
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          SKDI {c.skdi_level}
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className={`text-xs font-semibold leading-snug mb-1.5 line-clamp-2 ${
                    isSelected ? 'text-emerald-950 dark:text-white' : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {getCaseTitle(c)}
                  </h4>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="truncate max-w-[150px]">
                      {getCaseDepartment(c)} • {getCaseSetting(c)}
                    </span>
                    <span className="capitalize font-medium">
                      {difficulty}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
