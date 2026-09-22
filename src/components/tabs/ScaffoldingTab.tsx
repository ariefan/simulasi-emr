import React, { useState } from 'react';
import { NormalizedTab, ClinicalCase } from '../../types/clinical';
import { evaluateClinicalAnswer, getSampleAnswer, ClinicalEvaluationResult } from '../../lib/clinicalFeedback';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

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
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Case Context / Narrative for Current Step */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {currentTab.title} {currentTab.subtitle && `• ${currentTab.subtitle}`}
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Tahap {tabIndex + 1} dari {totalTabs}
          </span>
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
          {currentTab.case_narrative || currentCase.synopsis || currentCase.chief_complaint}
        </p>
      </div>

      {/* Scaffolding Gate Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Pertanyaan Evaluasi Klinis
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Semua pertanyaan wajib diisi untuk membuka tahap berikutnya
          </span>
        </div>

        {currentTab.gate_questions.map((q, idx) => {
          const answer = caseAnswers[q.id] || '';
          const evalResult = evaluations[q.id];

          return (
            <div
              key={q.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <label className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug flex-1">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold mr-1.5">{idx + 1}.</span>
                  {q.prompt}
                </label>

                {/* Booth Fast Demo Fill Button */}
                <button
                  type="button"
                  onClick={() => handleFillSample(q.id, q.prompt, q.expected)}
                  className="text-[11px] font-medium px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition shrink-0"
                >
                  Contoh Jawaban
                </button>
              </div>

              {/* Textarea */}
              <div>
                <textarea
                  value={answer}
                  onChange={(e) => onAnswerChange(q.id, e.target.value)}
                  placeholder="Ketik analisis penalaran klinis Anda..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition resize-y font-normal"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 px-1">
                  <span>{answer.length} karakter</span>
                  <button
                    type="button"
                    onClick={() => handleEvaluate(q.id, q.prompt, q.expected)}
                    disabled={answer.trim().length === 0}
                    className="text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 disabled:text-slate-400 font-semibold"
                  >
                    Evaluasi Jawaban
                  </button>
                </div>
              </div>

              {/* Evaluation Feedback Card */}
              {evalResult && (
                <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                  evalResult.level === 'Optimal'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : evalResult.level === 'Kompeten'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      {evalResult.level === 'Optimal' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      <span>Hasil Evaluasi: {evalResult.level} ({evalResult.score}/100)</span>
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-95">{evalResult.feedback}</p>
                  {evalResult.suggestedFocus && (
                    <p className="text-[11px] opacity-85 pt-1 border-t border-slate-200 dark:border-slate-800">
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
      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Progres: Langkah {tabIndex + 1} dari {totalTabs}
        </span>

        <button
          type="button"
          onClick={onSaveAndNext}
          disabled={!allQuestionsAnswered}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-xs transition ${
            allQuestionsAnswered
              ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>{tabIndex === totalTabs - 1 ? 'Selesaikan Modul & Buka Kuis' : 'Lanjut ke Tahap Berikutnya'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
