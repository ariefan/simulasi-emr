import React, { useState } from 'react';
import { QuizItem } from '../../types/clinical';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface QuizTabProps {
  quizItems: QuizItem[];
  quizAnswers: { [quizId: string]: string };
  onSelectOption: (quizId: string, optionKey: string) => void;
  onSubmitQuiz: (score: { correct: number; total: number }) => void;
  savedScore?: { correct: number; total: number };
}

export const QuizTab: React.FC<QuizTabProps> = ({
  quizItems,
  quizAnswers,
  onSelectOption,
  onSubmitQuiz,
  savedScore,
}) => {
  const [submitted, setSubmitted] = useState<boolean>(Boolean(savedScore && savedScore.total > 0));

  if (!quizItems || quizItems.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl mx-auto">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Kasus ini tidak memiliki kuis formatif</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Anda telah menyelesaikan seluruh modul scaffolding penalaran klinis.</p>
      </div>
    );
  }

  const handleCalculateScore = () => {
    let correct = 0;
    let total = 0;

    quizItems.forEach((q, idx) => {
      const qId = q.quiz_id || q.id || `q${idx + 1}`;
      const correctKey = (q.correct_option || q.correct_answer_key || '').trim().toUpperCase();
      if (!correctKey) return;
      total++;
      const userAns = (quizAnswers[qId] || '').trim().toUpperCase();
      if (userAns === correctKey) {
        correct++;
      }
    });

    setSubmitted(true);
    onSubmitQuiz({ correct, total: total || quizItems.length });
  };

  const allAnswered = quizItems.every((q, idx) => {
    const qId = q.quiz_id || q.id || `q${idx + 1}`;
    return Boolean(quizAnswers[qId]);
  });

  const percent = savedScore && savedScore.total > 0 ? Math.round((savedScore.correct / savedScore.total) * 100) : 0;

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-16">
      {/* Quiz Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Kuis Formatif Penalaran Klinis (Standar SKDI)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Jawab {quizItems.length} pertanyaan pilihan ganda berikut untuk menguji pemahaman tatalaksana dan diagnosis.
          </p>
        </div>

        {submitted && savedScore && (
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
            <div>
              <div className="text-xs uppercase font-semibold text-slate-400">Hasil Kuis:</div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {savedScore.correct} / {savedScore.total} Benar ({percent}%)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quiz Items List */}
      <div className="space-y-4">
        {quizItems.map((q, idx) => {
          const qId = q.quiz_id || q.id || `q${idx + 1}`;
          const selectedOption = quizAnswers[qId];
          const correctKey = (q.correct_option || q.correct_answer_key || '').trim().toUpperCase();
          const isCorrect = submitted && selectedOption && selectedOption.toUpperCase() === correctKey;
          const isWrong = submitted && selectedOption && selectedOption.toUpperCase() !== correctKey;

          return (
            <div
              key={qId}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm space-y-3.5 ${
                submitted
                  ? isCorrect
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : isWrong
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Question Stem */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                    {q.question || q.stem}
                  </p>
                </div>
                {submitted && (
                  <div className="shrink-0">
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Benar
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                        <XCircle className="w-3.5 h-3.5" />
                        Salah
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2 pt-1">
                {Object.entries(q.options || {}).map(([key, text]) => {
                  const isThisSelected = selectedOption === key;
                  const isThisCorrect = submitted && key.toUpperCase() === correctKey;

                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                        isThisSelected
                          ? 'bg-slate-100 dark:bg-slate-800 border-emerald-600 dark:border-emerald-500 text-slate-900 dark:text-slate-100 font-medium'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                      } ${
                        submitted && isThisCorrect
                          ? '!border-emerald-600 !bg-emerald-50 dark:!bg-emerald-950/40 !text-emerald-900 dark:!text-emerald-200 font-semibold'
                          : ''
                      } ${
                        submitted && isThisSelected && !isThisCorrect
                          ? '!border-rose-500 !bg-rose-50 dark:!bg-rose-950/40 !text-rose-900 dark:!text-rose-200'
                          : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name={`quiz_${qId}`}
                        value={key}
                        checked={isThisSelected}
                        onChange={() => !submitted && onSelectOption(qId, key)}
                        disabled={submitted}
                        className="text-emerald-600 focus:ring-emerald-600"
                      />
                      <span className="font-bold text-slate-500 dark:text-slate-400 mr-1">{key}.</span>
                      <span className="leading-snug">{text}</span>
                    </label>
                  );
                })}
              </div>

              {/* Explanation / Rationale */}
              {submitted && (q.explanation || (q.rationales && selectedOption && q.rationales[selectedOption])) && (
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-lg text-xs space-y-1 text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                    Pembahasan:
                  </span>
                  <p className="leading-relaxed">
                    {q.explanation || (q.rationales && selectedOption ? q.rationales[selectedOption] : '')}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {Object.keys(quizAnswers).length} dari {quizItems.length} soal dijawab
        </span>

        <div className="flex items-center gap-2">
          {submitted ? (
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ulangi Kuis</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCalculateScore}
              disabled={!allAnswered}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-xs transition ${
                allAnswered
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Jawaban</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
