import type { VercelRequest, VercelResponse } from '@vercel/node';

interface EvaluationPayload {
  prompt: string;
  answer: string;
  expectedFocus?: string;
  caseTitle?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { prompt, answer, expectedFocus, caseTitle } = req.body as EvaluationPayload;

  if (!answer || typeof answer !== 'string' || answer.trim().length < 3) {
    return res.status(400).json({
      score: 10,
      level: 'Perlu Perbaikan',
      feedback: 'Jawaban terlalu singkat. Berikan analisis klinis yang lebih komprehensif.',
      suggestedFocus: expectedFocus || 'Sebutkan analisis anamnesis, pemeriksaan fisik, atau tatalaksana spesifik.',
      keyPointsCovered: []
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  // Fallback to local heuristic evaluation if no OpenRouter key is configured
  if (!apiKey) {
    return res.status(200).json(evaluateLocally(answer, expectedFocus));
  }

  try {
    const systemPrompt = `Anda adalah Dokter Spesialis Konsulen & Penilai Ujian OSCE / Penalaran Klinis Dokter Muda (SKDI).
Tugas Anda adalah mengevaluasi jawaban penalaran klinis mahasiswa kedokteran secara objektif, konstruktif, dan ringkas.

Kriteria Penilaian:
- Score: 0 - 100
- Level: "Optimal" (Score 80-100), "Kompeten" (Score 60-79), atau "Perlu Perbaikan" (Score < 60).
- Feedback: 1-2 kalimat feedback klinis yang tajam mengenai ketepatan logika, tatalaksana, atau temuan medis penting.
- suggestedFocus: 1 kalimat fokus utama yang perlu diingat / diperbaiki.
- keyPointsCovered: array 2-4 poin klinis penting yang berhasil disebutkan mahasiswa.

OUTPUT HARUS BERUPA VALID JSON SAJA TANPA MARKDOWN / BACKTICKS:
{
  "score": number,
  "level": "Optimal" | "Kompeten" | "Perlu Perbaikan",
  "feedback": "string",
  "suggestedFocus": "string",
  "keyPointsCovered": ["string"]
}`;

    const userMessage = `Kasus: ${caseTitle || 'Simulasi Kasus Klinis'}
Pertanyaan Evaluasi: ${prompt}
Fokus Kunci Kasus: ${expectedFocus || 'Penalaran klinis terstruktur'}
Jawaban Mahasiswa: "${answer}"`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout for fast expo response

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://simulasi-rme-s.vercel.app',
        'X-Title': 'RME Simulator Kiosk'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.2,
        max_tokens: 350,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[OpenRouter API Error] ${response.status}: ${await response.text()}`);
      return res.status(200).json(evaluateLocally(answer, expectedFocus));
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(200).json(evaluateLocally(answer, expectedFocus));
    }

    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json({
      score: Math.min(100, Math.max(10, Number(parsed.score) || 60)),
      level: ['Optimal', 'Kompeten', 'Perlu Perbaikan'].includes(parsed.level) ? parsed.level : 'Kompeten',
      feedback: String(parsed.feedback || 'Evaluasi penalaran klinis selesai.'),
      suggestedFocus: String(parsed.suggestedFocus || expectedFocus || 'Pertahankan ketepatan diagnosis dan terapi.'),
      keyPointsCovered: Array.isArray(parsed.keyPointsCovered) ? parsed.keyPointsCovered : [],
      isAIEvaluated: true
    });
  } catch (error) {
    console.error('[OpenRouter Evaluate Handler Error]', error);
    // Graceful offline heuristic fallback
    return res.status(200).json(evaluateLocally(answer, expectedFocus));
  }
}

function evaluateLocally(answer: string, expectedFocus?: string) {
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
