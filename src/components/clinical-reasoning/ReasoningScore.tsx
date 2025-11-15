import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReasoningScoreBreakdown } from '@/types/clinical-reasoning';

interface ReasoningScoreProps {
  score: ReasoningScoreBreakdown | null;
  onCalculate: () => void;
  isCalculating: boolean;
}

export function ReasoningScore({ score, onCalculate, isCalculating }: ReasoningScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-sm text-purple-900 mb-2">
          💡 Penilaian Clinical Reasoning
        </h3>
        <p className="text-xs text-purple-800">
          Sistem akan menilai kualitas penalaran klinis Anda berdasarkan kelengkapan Problem
          Representation, kualitas DDx, dan justifikasi keputusan. Klik tombol di bawah untuk
          menghitung skor Anda.
        </p>
      </div>

      <Button
        onClick={onCalculate}
        disabled={isCalculating}
        className="w-full"
      >
        <TrendingUp className="w-4 h-4 mr-2" />
        {isCalculating ? 'Menghitung Skor...' : 'Hitung Skor Clinical Reasoning'}
      </Button>

      {score && (
        <div className="border border-slate-200 rounded-lg p-6 bg-white space-y-4">
          {/* Total Score */}
          <div className="text-center pb-4 border-b">
            <div className="text-sm text-slate-600 mb-2">Skor Total</div>
            <div className={`text-5xl font-bold ${getScoreColor(score.total).split(' ')[0]}`}>
              {score.total}
            </div>
            <div className="text-sm text-slate-500 mt-1">{getScoreLabel(score.total)}</div>
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-700 mb-2">Rincian Skor:</div>

            {/* Problem Representation Score */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Problem Representation</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${score.problemRep}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-blue-600 w-12 text-right">
                  {score.problemRep}
                </span>
              </div>
            </div>

            {/* DDx Score */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Differential Diagnosis</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${score.ddx}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-green-600 w-12 text-right">
                  {score.ddx}
                </span>
              </div>
            </div>

            {/* Justification Score */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Justifikasi Keputusan</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{ width: `${score.justification}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-purple-600 w-12 text-right">
                  {score.justification}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-slate-600 space-y-2">
              <p className="font-semibold">Feedback:</p>
              {score.problemRep < 60 && (
                <p className="text-red-600">
                  • Tingkatkan kelengkapan Problem Representation Anda dengan menambahkan lebih
                  banyak detail (demografi, timeline, konteks, semantic qualifiers).
                </p>
              )}
              {score.ddx < 60 && (
                <p className="text-red-600">
                  • Tambahkan lebih banyak diagnosis diferensial (minimal 3) dengan bukti yang
                  mendukung dan menolak.
                </p>
              )}
              {score.justification < 60 && (
                <p className="text-red-600">
                  • Perkuat justifikasi keputusan Anda dengan penjelasan yang lebih detail dan
                  tambahkan referensi evidence-based.
                </p>
              )}
              {score.total >= 80 && (
                <p className="text-green-600">
                  ✓ Excellent work! Penalaran klinis Anda sangat baik dan terstruktur dengan baik.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
