import React from 'react';
import { ClinicalCase } from '../types/clinical';
import { getCaseTitle, getCaseDepartment, getCaseSetting } from '../lib/caseLoader';

interface PatientBannerProps {
  currentCase: ClinicalCase;
  completedTabsCount: number;
  totalTabsCount: number;
  quizScore?: { correct: number; total: number };
}

export const PatientBanner: React.FC<PatientBannerProps> = ({
  currentCase,
  completedTabsCount,
  totalTabsCount,
  quizScore,
}) => {
  // Parse vital signs if present in key_exam_findings
  const examText = currentCase.key_exam_findings || '';
  
  // Extract BP
  const bpMatch = examText.match(/TD\s*([0-9]+\/[0-9]+)\s*mmHg/i);
  const bp = bpMatch ? bpMatch[1] : '120/80';

  // Extract HR
  const hrMatch = examText.match(/nadi\s*([0-9]+)/i);
  const hr = hrMatch ? `${hrMatch[1]} bpm` : '80 bpm';

  // Extract RR
  const rrMatch = examText.match(/RR\s*([0-9]+)/i);
  const rr = rrMatch ? `${rrMatch[1]} x/m` : '18 x/m';

  // Extract Temp
  const tempMatch = examText.match(/suhu\s*([0-9]+[.,]?[0-9]*)\s*°?C/i);
  const temp = tempMatch ? `${tempMatch[1]}°C` : '36.8°C';

  const progressPercent = totalTabsCount > 0 ? Math.round((completedTabsCount / totalTabsCount) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 shrink-0 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Patient Demographic & Diagnosis */}
        <div className="flex items-center gap-3">
          <div className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
            {currentCase.case_id}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {getCaseTitle(currentCase)}
              </h2>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                {currentCase.working_diagnosis || currentCase.primary_diagnosis || currentCase.skdi_condition || 'Kasus Klinis'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{getCaseDepartment(currentCase)}</span>
              <span>•</span>
              <span>{getCaseSetting(currentCase)}</span>
              {currentCase.skdi_level && (
                <>
                  <span>•</span>
                  <span>Tingkat Kemampuan SKDI {currentCase.skdi_level}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Clean Medical Vital Signs Table */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="px-2 py-0.5 text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">TD</span>
            <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{bp}</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="px-2 py-0.5 text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">HR</span>
            <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{hr}</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="px-2 py-0.5 text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">RR</span>
            <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{rr}</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="px-2 py-0.5 text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Suhu</span>
            <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{temp}</span>
          </div>
        </div>

        {/* Right: Clean Progress Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Tahap Evaluasi: {completedTabsCount}/{totalTabsCount}
            </span>
            {quizScore && quizScore.total > 0 && (
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">
                Skor Kuis: {quizScore.correct}/{quizScore.total}
              </span>
            )}
          </div>
          <div className="w-20 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
