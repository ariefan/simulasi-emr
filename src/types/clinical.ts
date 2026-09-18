export interface ScaffoldingStep {
  step_id?: string;
  stage?: string;
  tab?: string;
  prompt_student?: string[];
  expected_focus?: string;
  unlocks_next_tab?: string;
  prompt?: string;
  gate?: string;
}

export interface QuizOption {
  [key: string]: string;
}

export interface QuizItem {
  quiz_id?: string;
  id?: string;
  type?: string;
  question?: string;
  stem?: string;
  options?: QuizOption;
  correct_option?: string;
  correct_answer_key?: string;
  explanation?: string;
  rationales?: { [key: string]: string };
}

export interface DayTimeline {
  label?: string;
  clinical_data?: {
    summary?: string;
    history?: Record<string, string>;
    physical_exam?: Record<string, string>;
    lab_orders?: Record<string, any>;
    orders?: Record<string, any>;
    [key: string]: any;
  };
  scaffolding?: ScaffoldingStep[];
  quiz_items?: QuizItem[];
  quiz?: QuizItem[];
  final_quiz?: QuizItem[];
}

export interface NormalizedTab {
  id: string;
  title: string;
  subtitle: string;
  case_narrative: string;
  gate_questions: {
    id: string;
    prompt: string;
    expected?: string;
  }[];
}

export interface ClinicalCase {
  case_id: string;
  title?: string;
  case_title?: string;
  setting?: string;
  department?: string;
  unit?: string;
  skdi_condition?: string;
  skdi_level?: string;
  difficulty?: string;
  difficulty_label?: string;
  encounter_type?: 'outpatient' | 'inpatient' | string;
  chief_complaint?: string;
  synopsis?: string;
  key_exam_findings?: string;
  key_lab_results?: string;
  working_diagnosis?: string;
  primary_diagnosis?: string;
  differential_diagnoses?: string[];
  management_summary?: string;
  red_flags_clinical?: string[];
  learning_objectives?: string[];
  tags?: string[];
  scaffolding_steps?: ScaffoldingStep[];
  timeline?: Record<string, DayTimeline>;
  quiz_items?: QuizItem[];
  final_quiz?: QuizItem[];
  scaffolding?: {
    tabs: NormalizedTab[];
  };
}

export interface CaseSessionState {
  tabsAnswers: {
    [tabId: string]: {
      [questionId: string]: string;
    };
  };
  quiz?: {
    [quizId: string]: string;
  };
  quizScore?: {
    correct: number;
    total: number;
  };
  feedback?: {
    [questionId: string]: {
      score: number;
      feedbackText: string;
      matchedKeywords: string[];
    };
  };
}

export interface StudentAnswers {
  [caseId: string]: CaseSessionState;
}
