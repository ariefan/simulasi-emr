// Clinical Reasoning Types

export interface ProblemRepresentation {
  // One-liner summary
  summary: string;

  // Key features
  demographics: string; // e.g., "55yo M"
  chiefComplaint: string; // e.g., "chest pain"
  timeline: string; // e.g., "acute onset 2h ago"
  context: string; // e.g., "at rest, no exertion"

  // Semantic qualifiers
  acuity: 'acute' | 'subacute' | 'chronic' | '';
  severity: 'mild' | 'moderate' | 'severe' | '';
  pattern: string; // e.g., "intermittent vs constant"
}

export interface DifferentialDiagnosis {
  id: string;
  diagnosis: string;
  likelihood: 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
  supportingEvidence: string[];
  againstEvidence: string[];
  rank: number; // 1 = most likely
}

export interface EvidenceReference {
  source: string;
  url?: string;
  description: string;
}

export interface ReasoningScoreBreakdown {
  problemRep: number; // 0-100
  ddx: number; // 0-100
  justification: number; // 0-100
  total: number; // 0-100
}

export interface ClinicalReasoningData {
  id?: number;
  attemptId: number;
  studentId: number;
  caseId: string;
  problemRepresentation?: ProblemRepresentation | null;
  differentialDiagnoses?: DifferentialDiagnosis[] | null;
  decisionJustification?: string | null;
  evidenceReferences?: EvidenceReference[] | null;
  reasoningScore?: string | null; // Decimal as string from DB
  scoreBreakdown?: ReasoningScoreBreakdown | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Form state types
export interface ClinicalReasoningFormState {
  problemRepresentation: ProblemRepresentation;
  differentialDiagnoses: DifferentialDiagnosis[];
  decisionJustification: string;
  evidenceReferences: EvidenceReference[];
}

// Initial empty states
export const emptyProblemRepresentation: ProblemRepresentation = {
  summary: '',
  demographics: '',
  chiefComplaint: '',
  timeline: '',
  context: '',
  acuity: '',
  severity: '',
  pattern: '',
};

export const createEmptyDDx = (id: string): DifferentialDiagnosis => ({
  id,
  diagnosis: '',
  likelihood: 'medium',
  supportingEvidence: [],
  againstEvidence: [],
  rank: 1,
});

export const createEmptyEvidence = (): EvidenceReference => ({
  source: '',
  url: '',
  description: '',
});
