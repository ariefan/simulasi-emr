import React from 'react';
import { ClinicalCase } from '../../types/clinical';

interface EMRViewTabProps {
  currentCase: ClinicalCase;
}

export const EMRViewTab: React.FC<EMRViewTabProps> = ({ currentCase }) => {
  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* Overview & Chief Complaint Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Anamnesis & Keluhan Utama
        </h3>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          "{currentCase.chief_complaint}"
        </p>
        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
          {currentCase.synopsis || 'Tidak ada catatan sinopsis tambahan.'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Physical Exam Findings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            Pemeriksaan Fisik Terarah
          </h3>
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 min-h-[90px]">
            {currentCase.key_exam_findings || 'Dalam batas normal atau tidak dilaporkan kelainan spesifik.'}
          </div>
        </div>

        {/* Diagnostic & Lab Findings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            Pemeriksaan Penunjang / Laboratorium
          </h3>
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 min-h-[90px]">
            {currentCase.key_lab_results || 'Pemeriksaan penunjang disesuaikan dengan indikasi klinis.'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Differential Diagnoses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            Diagnosis Banding (DDx)
          </h3>
          {currentCase.differential_diagnoses && currentCase.differential_diagnoses.length > 0 ? (
            <ul className="space-y-1.5">
              {currentCase.differential_diagnoses.map((ddx, idx) => (
                <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                  <span>{ddx}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">Tidak ada daftar diagnosis banding.</p>
          )}
        </div>

        {/* Clinical Red Flags */}
        <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-xl p-4.5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-2.5">
            Tanda Bahaya (Red Flags)
          </h3>
          {currentCase.red_flags_clinical && currentCase.red_flags_clinical.length > 0 ? (
            <ul className="space-y-1.5">
              {currentCase.red_flags_clinical.map((rf, idx) => (
                <li key={idx} className="text-xs text-rose-800 dark:text-rose-300 flex items-start gap-1.5 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1.5 rounded border border-rose-200 dark:border-rose-900/30">
                  <span className="font-bold">•</span>
                  <span>{rf}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">Evaluasi tanda bahaya umum.</p>
          )}
        </div>

        {/* Learning Objectives */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            Capaian Pembelajaran
          </h3>
          {currentCase.learning_objectives && currentCase.learning_objectives.length > 0 ? (
            <ul className="space-y-1.5">
              {currentCase.learning_objectives.map((obj, idx) => (
                <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-800">
                  <span className="font-semibold text-slate-400 shrink-0">{idx + 1}.</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">Kompetensi klinis standar dokter umum.</p>
          )}
        </div>
      </div>

      {/* Management Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Rencana Tatalaksana & Terapi
        </h3>
        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
          {currentCase.management_summary || 'Tatalaksana sesuai panduan praktik klinis.'}
        </div>
      </div>
    </div>
  );
};
