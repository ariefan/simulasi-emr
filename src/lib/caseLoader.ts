import { ClinicalCase, NormalizedTab, QuizItem } from '../types/clinical';

export const CASE_FILES = [
  "rme_rajal_batch2.json",
  "rme_rajal_batch3.json",
  "rme_rajal_batch4.json",
  "rme_ranap_diare_21.json",
  "rme_ranap_asma_22.json",
  "rme_ranap_pielo_23.json",
  "rme_ranap_hepa_24.json",
  "rme_ranap_hipogli_25.json"
];

export async function loadAllCases(): Promise<ClinicalCase[]> {
  const allCases: ClinicalCase[] = [];

  for (const file of CASE_FILES) {
    try {
      const res = await fetch(`/${file}`);
      if (!res.ok) {
        console.warn(`[Loader] Failed to fetch ${file}: ${res.status}`);
        continue;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        allCases.push(...data);
      } else if (data && typeof data === 'object') {
        allCases.push(data);
      }
    } catch (err) {
      console.error(`[Loader] Error loading ${file}:`, err);
    }
  }

  // Sort by case_id
  allCases.sort((a, b) => (a.case_id || '').localeCompare(b.case_id || '', undefined, { numeric: true, sensitivity: 'base' }));
  return allCases;
}

export function getCaseTitle(c: ClinicalCase): string {
  return c.title || c.case_title || c.case_id || 'Kasus Tanpa Judul';
}

export function getCaseSetting(c: ClinicalCase): string {
  return c.setting || c.encounter_type || 'Layanan Primer';
}

export function getCaseDepartment(c: ClinicalCase): string {
  return c.department || c.unit || 'Klinik Umum';
}

export function getCaseDifficulty(c: ClinicalCase): string {
  return (c.difficulty_label || c.difficulty || 'Sedang').toLowerCase();
}

export function getTabs(c: ClinicalCase): NormalizedTab[] {
  // 1. If explicit scaffolding.tabs exists
  if (c.scaffolding && Array.isArray(c.scaffolding.tabs)) {
    return c.scaffolding.tabs;
  }

  // 2. Outpatient scaffolding_steps
  if (Array.isArray(c.scaffolding_steps)) {
    return c.scaffolding_steps.map((step, idx) => {
      const tabId = step.step_id || `step_${idx + 1}`;
      const prompts = Array.isArray(step.prompt_student) ? step.prompt_student : [];

      return {
        id: tabId,
        title: step.tab || `Langkah ${idx + 1}`,
        subtitle: step.stage ? `Tahap: ${step.stage.replace(/_/g, ' ')}` : '',
        case_narrative: c.synopsis || c.chief_complaint || '',
        gate_questions: prompts.map((pText, qi) => ({
          id: `${tabId}_q${qi + 1}`,
          prompt: pText,
          expected: step.expected_focus
        }))
      };
    });
  }

  // 3. Inpatient timeline
  if (c.timeline && typeof c.timeline === 'object') {
    const dayEntries = Object.entries(c.timeline).sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    return dayEntries.map(([dayKey, dayVal], idx) => {
      const tabId = dayKey;
      const scaffArr = Array.isArray(dayVal.scaffolding) ? dayVal.scaffolding : [];

      const gate_questions = scaffArr.map((step, i) => ({
        id: `${tabId}_${step.step_id || 's' + (i + 1)}`,
        prompt: step.prompt || step.gate || `Langkah Evaluasi ${i + 1}`,
        expected: step.expected_focus
      }));

      return {
        id: tabId,
        title: dayVal.label || `Hari ${idx + 1}`,
        subtitle: 'Pemantauan & Evaluasi Klinis Ranap',
        case_narrative:
          dayVal.clinical_data?.summary ||
          c.synopsis ||
          c.chief_complaint ||
          '',
        gate_questions
      };
    });
  }

  return [];
}

export function getQuizItems(c: ClinicalCase): QuizItem[] {
  let all: QuizItem[] = [];

  if (Array.isArray(c.quiz_items)) {
    all = all.concat(c.quiz_items);
  }

  if (c.timeline && typeof c.timeline === 'object') {
    Object.values(c.timeline).forEach(day => {
      if (Array.isArray(day.quiz_items)) all = all.concat(day.quiz_items);
      if (Array.isArray(day.quiz)) all = all.concat(day.quiz);
      if (Array.isArray(day.final_quiz)) all = all.concat(day.final_quiz);
    });
  }

  if (Array.isArray(c.final_quiz)) {
    all = all.concat(c.final_quiz);
  }

  return all;
}
