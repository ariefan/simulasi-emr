import React from 'react';
import { ClinicalCase } from '../../types/clinical';
import { FileText, AlertTriangle, Stethoscope, TestTube2, Pill, Target, ClipboardList } from 'lucide-react';

interface EMRViewTabProps {
  currentCase: ClinicalCase;
}

export const EMRViewTab: React.FC<EMRViewTabProps> = ({ currentCase }) => {
  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* Overview & Chief Complaint Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
          <FileText className="w-4 h-4" />
          <span>Keluhan Utama & Riwayat Penyakit Sekarang (Anamnesis)</span>
        </div>
        <p className="text-sm font-semibold text-slate-100 mb-2">
          "{currentCase.chief_complaint}"
        </p>
        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
          {currentCase.synopsis || 'Tidak ada catatan sinopsis tambahan.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Physical Exam Findings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider mb-2.5">
              <Stethoscope className="w-4 h-4" />
              <span>Temuan Pemeriksaan Fisik Terarah</span>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 min-h-[90px]">
              {currentCase.key_exam_findings || 'Dalam batas normal atau tidak dilaporkan kelainan spesifik.'}
            </div>
          </div>
        </div>

        {/* Diagnostic & Lab Findings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-2.5">
              <TestTube2 className="w-4 h-4" />
              <span>Pemeriksaan Penunjang & Laboratorium</span>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 min-h-[90px]">
              {currentCase.key_lab_results || 'Pemeriksaan penunjang disesuaikan dengan indikasi klinis.'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Differential Diagnoses */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-3">
            <ClipboardList className="w-4 h-4" />
            <span>Diagnosis Banding (DDx)</span>
          </div>
          {currentCase.differential_diagnoses && currentCase.differential_diagnoses.length > 0 ? (
            <ul className="space-y-1.5">
              {currentCase.differential_diagnoses.map((ddx, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-center gap-2 bg-slate-950/50 px-2.5 py-1.5 rounded border border-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>{ddx}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">Tidak ada daftar diagnosis banding.</p>
          )}
        </div>

        {/* Clinical Red Flags */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-3">
            <AlertTriangle className="w-4 h-4" />
            <span>Tanda Bahaya (Red Flags)</span>
          </div>
          {currentCase.red_flags_clinical && currentCase.red_flags_clinical.length > 0 ? (
            <ul className="space-y-1.5">
              {currentCase.red_flags_clinical.map((rf, idx) => (
                <li key={idx} className="text-xs text-rose-300/90 flex items-start gap-2 bg-rose-950/20 px-2.5 py-1.5 rounded border border-rose-900/30">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>{rf}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">Evaluasi tanda bahaya umum.</p>
          )}
        </div>

        {/* Learning Objectives */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-3">
            <Target className="w-4 h-4" />
            <span>Capaian Pembelajaran SKDI</span>
          </div>
          {currentCase.learning_objectives && currentCase.learning_objectives.length > 0 ? (
            <ul className="space-y-1.5">
              {currentCase.learning_objectives.map((obj, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/50 px-2.5 py-1.5 rounded border border-slate-800">
                  <span className="text-amber-400 font-bold shrink-0">{idx + 1}.</span>
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2.5">
          <Pill className="w-4 h-4" />
          <span>Rangkuman Rencana Tatalaksana & Terapi Rasional</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
          {currentCase.management_summary || 'Tatalaksana sesuai panduan praktik klinis.'}
        </p>
      </div>
    </div>
  );
};
