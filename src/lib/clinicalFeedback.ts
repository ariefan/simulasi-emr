export interface ClinicalEvaluationResult {
  score: number; // 0 - 100
  level: 'Optimal' | 'Kompeten' | 'Perlu Perbaikan';
  feedback: string;
  keyPointsCovered: string[];
  suggestedFocus: string;
  isAIEvaluated?: boolean;
}

export async function evaluateClinicalAnswer(
  prompt: string,
  answer: string,
  expectedFocus?: string,
  caseTitle?: string
): Promise<ClinicalEvaluationResult> {
  const trimmed = answer.trim();
  if (trimmed.length < 5) {
    return {
      score: 10,
      level: 'Perlu Perbaikan',
      feedback: 'Jawaban terlalu singkat. Berikan analisis klinis yang lebih terstruktur.',
      keyPointsCovered: [],
      suggestedFocus: expectedFocus || 'Sebutkan anamnesis, pemeriksaan fisik, atau diagnosis banding yang spesifik.',
      isAIEvaluated: false
    };
  }

  // Try Serverless AI Evaluation first
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500); // 6.5s timeout for fast kiosk response

    const res = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, answer, expectedFocus, caseTitle }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.score === 'number') {
        return data as ClinicalEvaluationResult;
      }
    }
  } catch (err) {
    // Network offline or endpoint unreachable -> silent graceful fallback to local heuristic
    console.info('[ClinicalFeedback] Fallback to local heuristic evaluator:', err);
  }

  return evaluateLocalHeuristic(answer, expectedFocus);
}

export function evaluateLocalHeuristic(answer: string, expectedFocus?: string): ClinicalEvaluationResult {
  const trimmed = answer.trim();
  const answerLower = trimmed.toLowerCase();

  const clinicalKeywords = [
    'anamnesis', 'vital', 'tanda vital', 'tekanan darah', 'nadi', 'suhu', 'respirasi', 'spo2',
    'pemeriksaan fisik', 'inspeksi', 'palpasi', 'perkusi', 'auskultasi',
    'penunjang', 'laboratorium', 'darah lengkap', 'rontgen', 'foto toraks', 'ekg', 'ct scan',
    'gds', 'gula darah', 'elektrolit', 'urinalisis', 'crp',
    'diagnosis banding', 'diagnosis kerja', 'etiologi', 'tatalaksana', 'terapi',
    'rehidrasi', 'ringer laktat', 'cairan', 'oksigen', 'nebulisasi', 'antibiotik', 'analgetik',
    'edukasi', 'red flags', 'rujukan', 'monitoring', 'skdi', 'abc'
  ];

  const matchedKeywords = clinicalKeywords.filter(kw => answerLower.includes(kw));

  let score = 50;
  if (trimmed.length > 50) score += 20;
  if (trimmed.length > 120) score += 10;
  score += Math.min(matchedKeywords.length * 5, 20);
  score = Math.min(Math.max(score, 20), 100);

  let level: 'Optimal' | 'Kompeten' | 'Perlu Perbaikan' = 'Perlu Perbaikan';
  let feedback = '';

  if (score >= 80) {
    level = 'Optimal';
    feedback = 'Penalaran klinis terstruktur dan mencakup elemen penting evaluasi kasus.';
  } else if (score >= 60) {
    level = 'Kompeten';
    feedback = 'Penalaran klinis memadai. Pertajam korelasi tanda vital dan rencana evaluasi lanjut.';
  } else {
    level = 'Perlu Perbaikan';
    feedback = 'Perlu pendalaman lebih lanjut pada sistematika diagnosis dan pertimbangan red flags.';
  }

  return {
    score,
    level,
    feedback,
    keyPointsCovered: matchedKeywords.slice(0, 5),
    suggestedFocus: expectedFocus || 'Pertahankan ketepatan identifikasi kegawatdaruratan dan rasionalisasi terapi.',
    isAIEvaluated: false
  };
}

export function getSampleAnswer(prompt: string, expectedFocus?: string): string {
  const p = prompt.toLowerCase();

  if (p.includes('tiga hal') || p.includes('pertama') || p.includes('abc') || p.includes('kedatangan')) {
    return "1. Penilaian patensi jalan napas, laju dan pola pernapasan, serta sirkulasi (Airway, Breathing, Circulation).\n2. Pengukuran tanda vital lengkap (TD, Nadi, RR, Suhu, SpO2) dan evaluasi status kesadaran.\n3. Skrining cepat defisit neurologis fokal serta penentuan waktu pasti onset gejala (time window).";
  }

  if (p.includes('pemeriksaan fisik') || p.includes('dukung') || p.includes('pf') || p.includes('gejala')) {
    return "Melakukan pemeriksaan fisik terarah: evaluasi tanda vital, status lokalis/sistemik terkait, mencari tanda bahaya (red flags), serta mencatat temuan khas patognomonik untuk menyusun diagnosis diferensial secara sistematis.";
  }

  if (p.includes('ct scan') || p.includes('penunjang') || p.includes('lab') || p.includes('imaging') || p.includes('laboratorium')) {
    return "Pemeriksaan penunjang bertujuan mengonfirmasi diagnosis kerja dan menyingkirkan diagnosis banding kegawatdaruratan. Pemeriksaan darah lengkap, fungsi organ, gula darah, serta modalitas imaging (rontgen/CT) dilakukan sesuai indikasi klinis.";
  }

  if (p.includes('tatalaksana') || p.includes('terapi') || p.includes('rencana') || p.includes('manajemen') || p.includes('rehidrasi')) {
    return "1. Stabilisasi hemodinamik dan tatalaksana simtomatik awal.\n2. Terapi definitif sesuai guideline SKDI dan protokol klinis.\n3. Monitoring tanda vital ketat, evaluasi respon terapi, serta edukasi tanda bahaya kepada keluarga pasien.";
  }

  if (expectedFocus) {
    return `Analisis klinis berfokus pada: ${expectedFocus}. Melakukan pendekatan terstruktur mencakup anamnesis terarah, pemeriksaan fisik objektif, dan tatalaksana berbasis bukti.`;
  }

  return "Melakukan pendekatan penalaran klinis sistematis: evaluasi tanda vital, identifikasi masalah utama, konfirmasi diagnosis dengan pemeriksaan penunjang terarah, dan menyusun tatalaksana komprehensif.";
}
