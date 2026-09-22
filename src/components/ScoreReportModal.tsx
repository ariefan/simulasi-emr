import React from 'react';
import { ClinicalCase, StudentAnswers } from '../types/clinical';
import { getCaseTitle, getTabs } from '../lib/caseLoader';
import { Printer, X, CheckCircle2 } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden text-slate-900 dark:text-slate-100 relative my-8">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Lembar Transkrip Penalaran Klinis
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate / Report Body */}
        <div className="p-8 bg-white dark:bg-slate-900 print:p-0 space-y-6">
          {/* Certificate Header */}
          <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-5">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
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
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalCasesCompleted}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kasus Diselesaikan</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{overallAccuracy}%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Akurasi Kuis Formatif</div>
            </div>
          </div>

          {/* Progress List Breakdown */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Daftar Kasus yang Diselesaikan:
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {cases.filter(c => answers[c.case_id]).map(c => {
                const caseAns = answers[c.case_id] || { tabsAnswers: {} };
                const quizScore = caseAns.quizScore;

                return (
                  <div
                    key={c.case_id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {c.case_id} - {getCaseTitle(c)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {quizScore ? `Kuis: ${quizScore.correct}/${quizScore.total} Benar` : 'Scaffolding Selesai'}
                    </div>
                  </div>
                );
              })}
              {cases.filter(c => answers[c.case_id]).length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  Belum ada kasus yang diselesaikan pada sesi ini.
                </p>
              )}
            </div>
          </div>

          {/* Footer Signature Box */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end text-xs text-slate-500 dark:text-slate-400">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">Simulator RME Koas</p>
              <p className="text-[10px]">Terstandarisasi Kurikulum SKDI</p>
            </div>
            <div className="text-right">
              <p className="border-b border-slate-300 dark:border-slate-700 pb-8 min-w-[120px]">Verifikasi Fasilitator</p>
              <p className="mt-1">(_______________________)</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 no-print">
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
            <span>Cetak Transkrip (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
