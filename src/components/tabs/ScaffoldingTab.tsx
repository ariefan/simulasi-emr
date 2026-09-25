import React, { useState } from 'react';
import { NormalizedTab, ClinicalCase } from '../../types/clinical';
import { evaluateClinicalAnswer, getSampleAnswer, ClinicalEvaluationResult } from '../../lib/clinicalFeedback';
import { getCaseTitle } from '../../lib/caseLoader';
import { ArrowRight, CheckCircle2, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

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
  const [evaluatingMap, setEvaluatingMap] = useState<{ [qId: string]: boolean }>({});

  const caseTitle = getCaseTitle(currentCase);

  const runEvaluation = async (qId: string, prompt: string, answerText: string, expected?: string) => {
    if (evaluatingMap[qId]) return;
    setEvaluatingMap(prev => ({ ...prev, [qId]: true }));
    try {
      const evalRes = await evaluateClinicalAnswer(prompt, answerText, expected, caseTitle);
      setEvaluations(prev => ({ ...prev, [qId]: evalRes }));
    } catch (e) {
      console.error(e);
    } finally {
      setEvaluatingMap(prev => ({ ...prev, [qId]: false }));
    }
  };

  const handleFillSample = async (qId: string, prompt: string, expected?: string) => {
    const sample = getSampleAnswer(prompt, expected);
    onAnswerChange(qId, sample);
    await runEvaluation(qId, prompt, sample, expected);
  };

  const handleEvaluate = async (qId: string, prompt: string, expected?: string) => {
    const ans = caseAnswers[qId] || '';
    if (ans.trim().length > 0) {
      await runEvaluation(qId, prompt, ans, expected);
    }
  };

  const handleBlurEvaluate = async (qId: string, prompt: string, expected?: string) => {
    const ans = caseAnswers[qId] || '';
    if (ans.trim().length > 5 && !evaluations[qId]) {
      await runEvaluation(qId, prompt, ans, expected);
    }
  };

  const allQuestionsAnswered = currentTab.gate_questions.every(
    q => (caseAnswers[q.id] || '').trim().length > 0
  );

  const handleProceed = async () => {
    // Auto-evaluate any answered questions that don't have evaluations yet in parallel
    const promises = currentTab.gate_questions.map(async (q) => {
      const ans = caseAnswers[q.id] || '';
      if (ans.trim().length > 0 && !evaluations[q.id]) {
        return evaluateClinicalAnswer(q.prompt, ans, q.expected, caseTitle).then(res => {
          setEvaluations(prev => ({ ...prev, [q.id]: res }));
        });
      }
    });

    await Promise.allSettled(promises);
    onSaveAndNext();
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-16">
      {/* Scaffolding Gate Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Pertanyaan Evaluasi Penalaran Klinis
          </h4>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Semua pertanyaan wajib diisi untuk membuka tahap berikutnya
          </span>
        </div>

        {currentTab.gate_questions.map((q, idx) => {
          const answer = caseAnswers[q.id] || '';
          const evalResult = evaluations[q.id];
          const isEvaluating = evaluatingMap[q.id] || false;

          return (
            <div
              key={q.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-4.5 space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2.5">
                <label className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug flex-1">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold mr-1.5">{idx + 1}.</span>
                  {q.prompt}
                </label>

                {/* Booth Fast Demo Fill Button */}
                <button
                  type="button"
                  onClick={() => handleFillSample(q.id, q.prompt, q.expected)}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition shrink-0 min-h-[36px] flex items-center touch-manipulation"
                >
                  Contoh Jawaban
                </button>
              </div>

              {/* Textarea with auto-scroll padding for on-screen keyboard */}
              <div>
                <textarea
                  value={answer}
                  onChange={(e) => onAnswerChange(q.id, e.target.value)}
                  onBlur={() => handleBlurEvaluate(q.id, q.prompt, q.expected)}
                  placeholder="Ketik analisis penalaran klinis Anda di sini..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition resize-y font-normal scroll-m-20"
                />
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1 px-1">
                  <span>{answer.length} karakter</span>
                  <button
                    type="button"
                    onClick={() => handleEvaluate(q.id, q.prompt, q.expected)}
                    disabled={answer.trim().length === 0 || isEvaluating}
                    className="text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 disabled:text-slate-400 font-semibold p-1 touch-manipulation flex items-center gap-1"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Menganalisis...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>Evaluasi Jawaban</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Evaluation Feedback Card */}
              {evalResult && (
                <div className={`p-3 rounded-lg border text-xs space-y-1.5 animate-fadeIn ${
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
                    {evalResult.isAIEvaluated && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-600/10 dark:bg-emerald-400/10 text-emerald-800 dark:text-emerald-300 font-medium">
                        AI Evaluator
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed opacity-95">{evalResult.feedback}</p>
                  {evalResult.suggestedFocus && (
                    <p className="text-xs opacity-85 pt-1 border-t border-slate-200 dark:border-slate-800">
                      <strong>Fokus Utama:</strong> {evalResult.suggestedFocus}
                    </p>
                  )}
                  {evalResult.keyPointsCovered && evalResult.keyPointsCovered.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Poin Teridentifikasi:</span>
                      {evalResult.keyPointsCovered.map((kp, kIdx) => (
                        <span key={kIdx} className="text-xs bg-white/70 dark:bg-slate-900/70 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                          {kp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Footer with touch-friendly button */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Tahap {tabIndex + 1} dari {totalTabs}
        </span>

        <button
          type="button"
          onClick={handleProceed}
          disabled={!allQuestionsAnswered}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-xs transition touch-manipulation min-h-[42px] ${
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
