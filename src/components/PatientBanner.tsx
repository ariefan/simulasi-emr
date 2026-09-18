import React from 'react';
import { ClinicalCase } from '../types/clinical';
import { getCaseTitle, getCaseDepartment, getCaseSetting } from '../lib/caseLoader';
import { User, Heart, Thermometer, Wind, Gauge } from 'lucide-react';

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
    <div className="bg-slate-900 border-b border-slate-800 p-4 shrink-0 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Patient Demographic & Diagnosis */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 shadow-inner">
            <User className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                RM-{currentCase.case_id}
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                {getCaseTitle(currentCase)}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
              <span>{getCaseDepartment(currentCase)}</span>
              <span>•</span>
              <span>{getCaseSetting(currentCase)}</span>
              <span>•</span>
              <span className="text-amber-300/90 font-medium">
                {currentCase.working_diagnosis || currentCase.primary_diagnosis || currentCase.skdi_condition || 'Kasus Klinis'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Vital Signs Strip */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
            <Gauge className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 text-[11px]">TD:</span>
            <span className="font-mono font-semibold text-slate-200">{bp}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-400 text-[11px]">HR:</span>
            <span className="font-mono font-semibold text-slate-200">{hr}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 text-[11px]">RR:</span>
            <span className="font-mono font-semibold text-slate-200">{rr}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 text-[11px]">T:</span>
            <span className="font-mono font-semibold text-slate-200">{temp}</span>
          </div>
        </div>

        {/* Right: Scaffolding Progress */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 min-w-[200px]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Progres Penalaran</span>
            <span className="font-bold text-emerald-400">
              {completedTabsCount} / {totalTabsCount} Tab ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {quizScore && quizScore.total > 0 && (
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Skor Kuis SKDI:</span>
              <span className="font-bold text-amber-400">
                {quizScore.correct}/{quizScore.total} ({Math.round((quizScore.correct / quizScore.total) * 100)}%)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
