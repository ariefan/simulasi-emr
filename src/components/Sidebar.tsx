import React, { useState, useMemo } from 'react';
import { ClinicalCase, StudentAnswers } from '../types/clinical';
import { getCaseTitle, getCaseSetting, getCaseDepartment, getCaseDifficulty, getTabs } from '../lib/caseLoader';
import { Search, CheckCircle2, Hospital, Building2, Layers } from 'lucide-react';

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
    <aside className="w-80 md:w-96 bg-slate-950 border-r border-slate-800/80 flex flex-col h-[calc(100vh-4rem)] shrink-0 no-print">
      {/* Search & Filter Bar */}
      <div className="p-3 border-b border-slate-800/80 space-y-2.5 bg-slate-900/40">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kasus, diagnosis, SKDI..."
            className="w-full bg-slate-900 border border-slate-700/70 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition ${
              filterType === 'all'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Semua ({cases.length})
          </button>
          <button
            onClick={() => setFilterType('rajal')}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition flex items-center justify-center gap-1 ${
              filterType === 'rajal'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Building2 className="w-3 h-3" />
            Rajal
          </button>
          <button
            onClick={() => setFilterType('ranap')}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition flex items-center justify-center gap-1 ${
              filterType === 'ranap'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Hospital className="w-3 h-3" />
            Ranap
          </button>
        </div>
      </div>

      {/* Case List Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredCases.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Layers className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
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
                onClick={() => onSelectCase(originalIndex)}
                className={`p-3 rounded-xl cursor-pointer border transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {/* Active Indicator Strip */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                )}

                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase">
                    {c.case_id}
                  </span>
                  <div className="flex items-center gap-1">
                    {completed && (
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Selesai
                      </span>
                    )}
                    {c.skdi_level && (
                      <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-1.5 py-0.5 rounded border border-slate-700">
                        SKDI {c.skdi_level}
                      </span>
                    )}
                  </div>
                </div>

                <h4 className={`text-xs font-semibold leading-snug mb-2 line-clamp-2 ${
                  isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                }`}>
                  {getCaseTitle(c)}
                </h4>

                <div className="flex items-center flex-wrap gap-1.5 text-[10px] text-slate-400">
                  <span className="bg-slate-800/70 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/50">
                    {getCaseDepartment(c)}
                  </span>
                  <span className="bg-slate-800/70 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/50">
                    {getCaseSetting(c)}
                  </span>
                  <span className={`ml-auto capitalize px-1.5 py-0.5 rounded font-medium ${
                    difficulty.includes('ringan')
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : difficulty.includes('berat')
                      ? 'text-red-400 bg-red-500/10'
                      : 'text-amber-400 bg-amber-500/10'
                  }`}>
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
