import React, { useState } from 'react';
import { QuizItem } from '../../types/clinical';
import { HelpCircle, CheckCircle2, XCircle, Award, RefreshCw } from 'lucide-react';

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
      <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-xl max-w-xl mx-auto">
        <HelpCircle className="w-10 h-10 mx-auto text-slate-600 mb-3" />
        <h3 className="text-sm font-bold text-slate-200">Kasus ini tidak memiliki kuis formatif</h3>
        <p className="text-xs text-slate-400 mt-1">Anda telah menyelesaikan seluruh modul scaffolding penalaran klinis.</p>
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
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Quiz Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <HelpCircle className="w-4 h-4" />
            <span>Kuis Formatif Penalaran Klinis (SKDI Standard)</span>
          </div>
          <p className="text-xs text-slate-300">
            Jawab {quizItems.length} pertanyaan multiple choice berikut untuk menguji pemahaman tatalaksana dan diagnosis.
          </p>
        </div>

        {submitted && savedScore && (
          <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 shrink-0">
            <Award className="w-6 h-6 text-amber-400" />
            <div>
              <div className="text-xs text-slate-400">Hasil Penilaian:</div>
              <div className="text-sm font-bold text-slate-100">
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
              className={`bg-slate-900/90 border rounded-xl p-5 shadow-sm transition space-y-4 ${
                submitted
                  ? isCorrect
                    ? 'border-emerald-500/50 bg-emerald-950/10'
                    : isWrong
                    ? 'border-rose-500/50 bg-rose-950/10'
                    : 'border-slate-800'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Question Stem */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0 mt-0.5">
                    Q{idx + 1}
                  </span>
                  <p className="text-xs font-semibold text-slate-100 leading-relaxed">
                    {q.question || q.stem}
                  </p>
                </div>
                {submitted && (
                  <div className="shrink-0">
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Benar (+5 XP)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        <XCircle className="w-3.5 h-3.5" />
                        Kurang Tepat
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
                      className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition ${
                        isThisSelected
                          ? 'bg-slate-800 border-emerald-500 text-slate-100 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                      } ${
                        submitted && isThisCorrect
                          ? '!border-emerald-500 !bg-emerald-950/30 !text-emerald-200'
                          : ''
                      } ${
                        submitted && isThisSelected && !isThisCorrect
                          ? '!border-rose-500 !bg-rose-950/30 !text-rose-200'
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
                        className="text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950"
                      />
                      <span className="font-bold text-emerald-400 mr-1">{key}.</span>
                      <span className="leading-snug">{text}</span>
                    </label>
                  );
                })}
              </div>

              {/* Explanation / Rationale */}
              {submitted && (q.explanation || (q.rationales && selectedOption && q.rationales[selectedOption])) && (
                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-lg text-xs space-y-1 text-slate-300">
                  <span className="font-bold text-amber-400 text-[11px] uppercase tracking-wider block">
                    💡 Pembahasan Klinis:
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
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <span className="text-xs text-slate-400">
          {Object.keys(quizAnswers).length} dari {quizItems.length} soal terjawab
        </span>

        <div className="flex items-center gap-3">
          {submitted ? (
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ulangi Kuis</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCalculateScore}
              disabled={!allAnswered}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition duration-200 ${
                allAnswered
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/50'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit & Hitung Skor Formatif</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
