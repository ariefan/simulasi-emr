import React, { useState } from 'react';
import { ClinicalCase, StudentAnswers } from '../types/clinical';
import { getCaseTitle, getTabs } from '../lib/caseLoader';
import { Printer, X, CheckCircle2, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface ScoreReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  cases: ClinicalCase[];
  answers: StudentAnswers;
  totalXP?: number;
  level?: number;
}

export const ScoreReportModal: React.FC<ScoreReportModalProps> = ({
  isOpen,
  onClose,
  studentName,
  cases,
  answers,
}) => {
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Calculate summary stats
  let totalCasesCompleted = 0;
  let totalCorrect = 0;
  let totalQuestions = 0;

  cases.forEach(c => {
    const caseAns = answers[c.case_id];
    if (!caseAns) return;

    const tabs = getTabs(c);
    const tabsAns = caseAns.tabsAnswers || {};
    const isCompleted = tabs.length > 0 && tabs.every(tab => {
      const tabAns = tabsAns[tab.id] || {};
      const gateQs = tab.gate_questions || [];
      return gateQs.length > 0 && gateQs.every(q => (tabAns[q.id] || '').trim().length > 0);
    });

    if (isCompleted) totalCasesCompleted++;

    if (caseAns.quizScore && caseAns.quizScore.total > 0) {
      totalCorrect += caseAns.quizScore.correct;
      totalQuestions += caseAns.quizScore.total;
    }
  });

  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const attemptedCases = cases.filter(c => answers[c.case_id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden text-slate-900 dark:text-slate-100 relative my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Transkrip & Rekapitulasi Penalaran Klinis
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate / Report Body */}
        <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 print:p-0 space-y-6 overflow-y-auto flex-1">
          {/* Certificate Header */}
          <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-5">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              TRANSKRIP PENALARAN KLINIS & REKAM MEDIS ELEKTRONIK
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulasi Standar Kompetensi Dokter Indonesia (SKDI)
            </p>
          </div>

          {/* Student Info Box */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Nama Mahasiswa / Dokter Muda:</span>
              <strong className="text-sm text-emerald-800 dark:text-emerald-400 block mt-0.5">
                {studentName || 'Dokter Muda (Pengunjung Booth)'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Tanggal Simulasi:</span>
              <strong className="text-sm text-slate-900 dark:text-slate-100 block mt-0.5">
                {currentDate}
              </strong>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{totalCasesCompleted}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kasus Diselesaikan</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
              <div className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">{overallAccuracy}%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Akurasi Kuis Formatif</div>
            </div>
          </div>

          {/* Detailed Cases & Reasoning Responses */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              Rincian Kasus & Jawaban Penalaran Klinis:
            </h4>
            <div className="space-y-3">
              {attemptedCases.map(c => {
                const caseAns = answers[c.case_id] || { tabsAnswers: {} };
                const tabs = getTabs(c);
                const quizScore = caseAns.quizScore;
                const isExpanded = expandedCaseId === c.case_id;

                return (
                  <div
                    key={c.case_id}
                    className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                  >
                    {/* Case Summary Row */}
                    <div
                      onClick={() => setExpandedCaseId(isExpanded ? null : c.case_id)}
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-900/60 transition no-print"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 block">
                            {c.case_id} - {getCaseTitle(c)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {c.working_diagnosis || c.primary_diagnosis || c.skdi_condition}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {quizScore ? `Kuis: ${quizScore.correct}/${quizScore.total}` : 'Scaffolding Selesai'}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Print Header only for paper */}
                    <div className="hidden print:block p-3 border-b border-slate-200">
                      <strong className="text-xs">{c.case_id} - {getCaseTitle(c)}</strong>
                      <span className="text-xs text-slate-600 block">{c.working_diagnosis || c.primary_diagnosis}</span>
                    </div>

                    {/* Detailed Question & Student Answers (Visible in print always, accordion in UI) */}
                    <div className={`${isExpanded ? 'block' : 'hidden print:block'} p-3 pt-0 sm:p-4 sm:pt-0 space-y-2.5 border-t border-slate-200 dark:border-slate-800/80 mt-2`}>
                      {tabs.map((tab, tIdx) => {
                        const tabAns = caseAns.tabsAnswers?.[tab.id] || {};
                        const gateQs = tab.gate_questions || [];

                        return (
                          <div key={tab.id} className="pt-2">
                            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                              Tahap {tIdx + 1}: {tab.title}
                            </span>
                            <div className="space-y-2">
                              {gateQs.map((q, qIdx) => {
                                const ansText = tabAns[q.id] || '';
                                return (
                                  <div key={q.id} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                                    <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                                      {qIdx + 1}. {q.prompt}
                                    </p>
                                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                                      {ansText.trim() ? ansText : <span className="italic text-slate-400">Tidak ada jawaban.</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {attemptedCases.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  Belum ada kasus yang dikerjakan pada sesi ini.
                </p>
              )}
            </div>
          </div>

          {/* Footer Signature Box */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end text-xs text-slate-500 dark:text-slate-400">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">Simulator RME Koas v2.0</p>
              <p className="text-xs">Terstandarisasi Kurikulum SKDI</p>
            </div>
            <div className="text-right">
              <p className="border-b border-slate-300 dark:border-slate-700 pb-8 min-w-[140px]">Tanda Tangan Penguji / Booth</p>
              <p className="mt-1">(_______________________)</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 no-print shrink-0">
          <button
            onClick={onClose}
            className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen Transkrip (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
