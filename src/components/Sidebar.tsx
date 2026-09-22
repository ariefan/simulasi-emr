import React, { useState, useMemo } from 'react';
import { ClinicalCase, StudentAnswers } from '../types/clinical';
import { getCaseTitle, getCaseSetting, getCaseDepartment, getCaseDifficulty, getTabs } from '../lib/caseLoader';
import { Search, CheckCircle2 } from 'lucide-react';

interface SidebarProps {
  cases: ClinicalCase[];
  selectedCaseIndex: number;
  onSelectCase: (index: number) => void;
  answers: StudentAnswers;
}

export const Sidebar: React.FC<SidebarProps> = ({
  cases,
  selectedCaseIndex,
  onSelectCase,
  answers,
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

  return (
    <aside className="w-80 md:w-88 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] shrink-0 no-print transition-colors">
      {/* Search & Filter */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kasus atau diagnosis..."
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
          />
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex rounded-md bg-slate-200/70 dark:bg-slate-800 p-0.5 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1 text-[11px] font-medium rounded transition ${
              filterType === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Semua ({cases.length})
          </button>
          <button
            onClick={() => setFilterType('rajal')}
            className={`flex-1 py-1 text-[11px] font-medium rounded transition ${
              filterType === 'rajal'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Rawat Jalan
          </button>
          <button
            onClick={() => setFilterType('ranap')}
            className={`flex-1 py-1 text-[11px] font-medium rounded transition ${
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
            <p className="text-xs text-slate-400">Tidak ada kasus yang sesuai filter.</p>
          </div>
        ) : (
          filteredCases.map(({ c, originalIndex }) => {
            const isSelected = selectedCaseIndex === originalIndex;
            const completed = isCaseCompleted(c);
            const difficulty = getCaseDifficulty(c);

            return (
              <div
                key={c.case_id || originalIndex}
                onClick={() => onSelectCase(originalIndex)}
                className={`p-2.5 rounded-lg cursor-pointer border text-left transition-all ${
                  isSelected
                    ? 'bg-emerald-50/70 dark:bg-slate-800 border-emerald-600 dark:border-emerald-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                    {c.case_id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {completed && (
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Selesai
                      </span>
                    )}
                    {c.skdi_level && (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
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

                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
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
  );
};
