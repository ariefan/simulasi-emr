import React from 'react';
import { Activity, Award, RotateCcw, Printer, Stethoscope, Sparkles } from 'lucide-react';

interface NavbarProps {
  studentName: string;
  onStudentNameChange: (name: string) => void;
  totalXP: number;
  level: number;
  onResetKiosk: () => void;
  onOpenReport: () => void;
  totalCompletedCases: number;
  totalCases: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  studentName,
  onStudentNameChange,
  totalXP,
  level,
  onResetKiosk,
  onOpenReport,
  totalCompletedCases,
  totalCases,
}) => {
  return (
    <header className="h-16 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-between z-30 sticky top-0 no-print">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <Stethoscope className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-slate-100 tracking-tight">RME Simulator</span>
            <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
              Booth Edition
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Penalaran Klinis & Rekam Medis Elektronik Terintegrasi SKDI
          </p>
        </div>
      </div>

      {/* Center: Student Name Profile */}
      <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 max-w-xs w-full">
        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Koas:</span>
        <input
          type="text"
          value={studentName}
          onChange={(e) => onStudentNameChange(e.target.value)}
          placeholder="Tulis nama Anda..."
          className="bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-full font-medium"
        />
      </div>

      {/* Right Stats & Actions */}
      <div className="flex items-center gap-3">
        {/* XP & Level Badge */}
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold">{totalXP} XP</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1 text-emerald-400">
            <Award className="w-4 h-4" />
            <span className="text-xs font-bold">Lvl {level}</span>
          </div>
        </div>

        {/* Completed Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-800">
          <Activity className="w-3.5 h-3.5 text-teal-400" />
          <span>Selesai: <strong className="text-slate-200">{totalCompletedCases}/{totalCases}</strong></span>
        </div>

        {/* Print / Report Button */}
        <button
          onClick={onOpenReport}
          title="Cetak Resume Hasil Penilaian"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600/20 text-teal-300 border border-teal-500/30 hover:bg-teal-600/30 transition shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Cetak Resume</span>
        </button>

        {/* Reset Kiosk Button */}
        <button
          onClick={onResetKiosk}
          title="Reset Sesi Mahasiswa (Untuk Pengunjung Baru)"
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900/50 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Reset Booth</span>
        </button>
      </div>
    </header>
  );
};
