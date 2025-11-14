export interface CaseData {
  case_id: string;
  department: string;
  skdi_diagnosis: string;
  icd10: string;
  skdi_level: string;
  difficulty?: string;
  time_limit_minutes?: number;
  competencies?: Array<string>;
  tags?: Array<string>;
  patient: {
    name: string;
    age: number;
    sex: 'L' | 'P';
    marital_status?: string;
    gravida?: number | null;
    para?: number | null;
    address_type?: string;
    insurance_status?: string;
  };
  chief_complaint: string;
  history_of_present_illness: string;
  past_medical_history?: string;
  family_history?: string;
  social_history?: string;
  physical_exam: {
    general?: string;
    vital_signs?: {
      bp_mmHg?: string;
      hr_bpm?: number;
      rr_per_min?: number;
      temp_c?: number;
      spo2_percent?: number;
    };
    systemic?: {
      respiratory?: string;
      cardiovascular?: string;
      abdomen?: string;
      neuro?: string;
      extremities?: string;
    };
    obstetric_exam?: {
      tfu_cm?: number;
      fetal_heart_rate_bpm?: number;
      presentation?: string;
      edema?: string;
    } | null;
  };
  laboratory?: Record<string, any>;
  imaging?: Record<string, string> | null;
  procedures?: Array<any>;
  working_diagnosis: string;
  differential_diagnoses?: Array<string>;
  management_plan?: {
    non_pharmacological?: Array<string>;
    pharmacological?: Array<string>;
    procedure?: string;
    monitoring?: string;
    referral?: string;
  };
  red_flags?: Array<string>;
  learning_points?: Array<string>;
  assessment_items?: {
    key_diagnosis: string;
    key_icd10: string;
    key_skdi_level: string;
    estimated_difficulty?: string;
    max_score?: number;
    critical_actions?: Array<string>;
    possible_mcq_questions?: Array<{
      id: string;
      stem: string;
      options: Array<string>;
      answer_index: number;
    }>;
  };
}

export interface StudentProgress {
  [caseId: string]: {
    attempts: number;
    lastScore: number;
    reflection?: {
      what?: string;
      so_what?: string;
      now_what?: string;
    };
    reflection_last_saved?: string;
  };
}
