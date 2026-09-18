import React, { useState } from 'react';
import { NormalizedTab, ClinicalCase } from '../../types/clinical';
import { evaluateClinicalAnswer, getSampleAnswer, ClinicalEvaluationResult } from '../../lib/clinicalFeedback';
import { Sparkles, Brain, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ScaffoldingTabProps {
  currentTab: NormalizedTab;
  tabIndex: number;
  totalTabs: number;
  caseAnswers: { [questionId: string]: string };
  onAnswerChange: (questionId: string, value: string) => void;
  onSaveAndNext: () => void;
  currentCase: ClinicalCase;
}

export const ScaffoldingTab: React.FC<ScaffoldingTabProps> = ({
  currentTab,
  tabIndex,
  totalTabs,
  caseAnswers,
  onAnswerChange,
  onSaveAndNext,
  currentCase,
}) => {
  const [evaluations, setEvaluations] = useState<{ [qId: string]: ClinicalEvaluationResult }>({});

  const handleFillSample = (qId: string, prompt: string, expected?: string) => {
    const sample = getSampleAnswer(prompt, expected);
    onAnswerChange(qId, sample);
    // Automatically trigger evaluation for the sample
    const evalRes = evaluateClinicalAnswer(prompt, sample, expected);
    setEvaluations(prev => ({ ...prev, [qId]: evalRes }));
  };

  const handleEvaluate = (qId: string, prompt: string, expected?: string) => {
    const ans = caseAnswers[qId] || '';
    const evalRes = evaluateClinicalAnswer(prompt, ans, expected);
    setEvaluations(prev => ({ ...prev, [qId]: evalRes }));
  };

  const allQuestionsAnswered = currentTab.gate_questions.every(
    q => (caseAnswers[q.id] || '').trim().length > 0
  );

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-12">
      {/* Case Context / Narrative for Current Step */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">{currentTab.title}</h3>
          </div>
          {currentTab.subtitle && (
            <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {currentTab.subtitle}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
          {currentTab.case_narrative || currentCase.synopsis || currentCase.chief_complaint}
        </p>
      </div>

      {/* Scaffolding Gate Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Brain className="w-4 h-4" />
            <span>Pertanyaan Penalaran Klinis (Scaffolding Gate)</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Wajib dijawab sebelum membuka tahap berikutnya
          </span>
        </div>

        {currentTab.gate_questions.map((q, idx) => {
          const answer = caseAnswers[q.id] || '';
          const evalResult = evaluations[q.id];

          return (
            <div
              key={q.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-4.5 space-y-3 shadow-sm hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <label className="text-xs font-semibold text-slate-200 leading-snug flex-1">
                  <span className="text-emerald-400 font-bold mr-1.5">{idx + 1}.</span>
                  {q.prompt}
                </label>

                {/* Booth Fast Demo Fill Button */}
                <button
                  type="button"
                  onClick={() => handleFillSample(q.id, q.prompt, q.expected)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition shrink-0"
                  title="Isi otomatis dengan contoh jawaban penalaran klinis yang ideal"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Isi Contoh Jawaban</span>
                </button>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={answer}
                  onChange={(e) => onAnswerChange(q.id, e.target.value)}
                  placeholder="Tuliskan analisis dan penalaran klinis Anda di sini..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-y font-normal"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 px-1">
                  <span>{answer.length} karakter</span>
                  <button
                    type="button"
                    onClick={() => handleEvaluate(q.id, q.prompt, q.expected)}
                    disabled={answer.trim().length === 0}
                    className="text-teal-400 hover:text-teal-300 disabled:text-slate-600 font-medium flex items-center gap-1"
                  >
                    <Brain className="w-3 h-3" />
                    <span>Evaluasi Penalaran</span>
                  </button>
                </div>
              </div>

              {/* Evaluation Feedback Card */}
              {evalResult && (
                <div className={`p-3 rounded-lg border text-xs space-y-1.5 animate-fadeIn ${
                  evalResult.level === 'Optimal'
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : evalResult.level === 'Kompeten'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      {evalResult.level === 'Optimal' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5" />
                      )}
                      <span>Evaluasi: {evalResult.level} ({evalResult.score}/100)</span>
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">{evalResult.feedback}</p>
                  {evalResult.suggestedFocus && (
                    <p className="text-[11px] opacity-80 pt-1 border-t border-slate-700/50">
                      <strong>Fokus Utama:</strong> {evalResult.suggestedFocus}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <span className="text-xs text-slate-400">
          Langkah <strong className="text-slate-200">{tabIndex + 1}</strong> dari <strong className="text-slate-200">{totalTabs}</strong>
        </span>

        <button
          type="button"
          onClick={onSaveAndNext}
          disabled={!allQuestionsAnswered}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition duration-200 ${
            allQuestionsAnswered
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/50'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          <span>{tabIndex === totalTabs - 1 ? 'Selesaikan Semua Tahap & Buka Kuis' : 'Simpan & Lanjut Tahap Berikutnya'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
