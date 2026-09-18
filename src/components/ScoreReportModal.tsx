import React from 'react';
import { ClinicalCase, StudentAnswers } from '../types/clinical';
import { getCaseTitle, getTabs } from '../lib/caseLoader';
import { Award, Printer, X, CheckCircle2, Stethoscope } from 'lucide-react';

interface ScoreReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  cases: ClinicalCase[];
  answers: StudentAnswers;
  totalXP: number;
  level: number;
}

export const ScoreReportModal: React.FC<ScoreReportModalProps> = ({
  isOpen,
  onClose,
  studentName,
  cases,
  answers,
  totalXP,
  level,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 relative my-8">
        {/* Header with Close */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Award className="w-5 h-5" />
            <span>Lembar Evaluasi & Rekapitulasi Kinerja Koas</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate / Report Body */}
        <div className="p-8 bg-slate-900 print:bg-white print:text-black space-y-6">
          {/* Certificate Header */}
          <div className="text-center border-b border-slate-800 pb-6 print:border-slate-300">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 print:border print:border-emerald-600">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white print:text-black">
              TRANSKRIP PENALARAN KLINIS KOAS
            </h2>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
              Simulasi Rekam Medis Elektronik (RME) Terstandar SKDI
            </p>
          </div>

          {/* Student Info Box */}
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl grid grid-cols-2 gap-4 text-xs print:bg-slate-50 print:border-slate-300">
            <div>
              <span className="text-slate-400 print:text-slate-600 block">Nama Mahasiswa / Dokter Muda:</span>
              <strong className="text-sm text-emerald-400 print:text-black block mt-0.5">
                {studentName || 'Dokter Muda (Tamu Booth)'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 print:text-slate-600 block">Tanggal Simulasi:</span>
              <strong className="text-sm text-slate-200 print:text-black block mt-0.5">
                {currentDate}
              </strong>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl print:border-slate-300">
              <div className="text-xl font-bold text-amber-400 print:text-black">{totalXP}</div>
              <div className="text-[11px] text-slate-400 print:text-slate-600 font-medium">Total XP (Level {level})</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl print:border-slate-300">
              <div className="text-xl font-bold text-emerald-400 print:text-black">{totalCasesCompleted}</div>
              <div className="text-[11px] text-slate-400 print:text-slate-600 font-medium">Kasus Diselesaikan</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl print:border-slate-300">
              <div className="text-xl font-bold text-cyan-400 print:text-black">{overallAccuracy}%</div>
              <div className="text-[11px] text-slate-400 print:text-slate-600 font-medium">Akurasi Kuis SKDI</div>
            </div>
          </div>

          {/* Progress List Breakdown */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 print:text-black uppercase tracking-wider mb-2.5">
              Rincian Kasus yang Dikerjakan:
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {cases.filter(c => answers[c.case_id]).map(c => {
                const caseAns = answers[c.case_id] || { tabsAnswers: {} };
                const quizScore = caseAns.quizScore;

                return (
                  <div
                    key={c.case_id}
                    className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80 print:border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-medium text-slate-200 print:text-black">
                        {c.case_id} - {getCaseTitle(c)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 print:text-slate-600">
                      {quizScore ? `Kuis: ${quizScore.correct}/${quizScore.total}` : 'Scaffolding Lengkap'}
                    </div>
                  </div>
                );
              })}
              {cases.filter(c => answers[c.case_id]).length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-4">
                  Belum ada kasus yang dikerjakan pada sesi ini.
                </p>
              )}
            </div>
          </div>

          {/* Footer Signature Box */}
          <div className="pt-6 border-t border-slate-800 print:border-slate-300 flex justify-between items-end text-xs text-slate-400 print:text-black">
            <div>
              <p>Simulator RME Koas v2.0</p>
              <p className="text-[10px] text-slate-500 print:text-slate-600">Terverifikasi Sesuai Kurikulum SKDI</p>
            </div>
            <div className="text-right">
              <p className="border-b border-slate-600 print:border-slate-400 pb-8 min-w-[120px]">Tanda Tangan Penguji / Booth</p>
              <p className="mt-1">(_______________________)</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 no-print">
          <button
            onClick={onClose}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/50"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
