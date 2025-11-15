import { createServerFn } from '@tanstack/react-start';
import { db } from '@/db';
import { clinicalReasoning } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type {
  ClinicalReasoningData,
  ProblemRepresentation,
  DifferentialDiagnosis,
  EvidenceReference,
  ReasoningScoreBreakdown,
} from '@/types/clinical-reasoning';

// Save or update clinical reasoning
export const saveClinicalReasoning = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    const {
      attemptId,
      studentId,
      caseId,
      problemRepresentation,
      differentialDiagnoses,
      decisionJustification,
      evidenceReferences,
    } = data as {
      attemptId: number;
      studentId: number;
      caseId: string;
      problemRepresentation?: ProblemRepresentation;
      differentialDiagnoses?: DifferentialDiagnosis[];
      decisionJustification?: string;
      evidenceReferences?: EvidenceReference[];
    };

    try {
      // Check if reasoning already exists for this attempt
      const existing = await db
        .select()
        .from(clinicalReasoning)
        .where(eq(clinicalReasoning.attemptId, attemptId))
        .limit(1);

      const reasoningData = {
        problemRepresentation: problemRepresentation ? (problemRepresentation as any) : null,
        differentialDiagnoses: differentialDiagnoses ? (differentialDiagnoses as any) : null,
        decisionJustification: decisionJustification || null,
        evidenceReferences: evidenceReferences ? (evidenceReferences as any) : null,
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        // Update existing reasoning
        const [updated] = await db
          .update(clinicalReasoning)
          .set(reasoningData)
          .where(eq(clinicalReasoning.id, existing[0].id))
          .returning();

        return updated as any;
      } else {
        // Create new reasoning
        const [created] = await db
          .insert(clinicalReasoning)
          .values({
            attemptId,
            studentId,
            caseId,
            ...reasoningData,
          })
          .returning();

        return created as any;
      }
    } catch (error) {
      console.error('Error saving clinical reasoning:', error);
      throw new Error('Failed to save clinical reasoning');
    }
  }
);

// Get clinical reasoning for an attempt
export const getClinicalReasoning = createServerFn({ method: 'GET' }).handler(
  async ({ data }: { data: unknown }) => {
    const { attemptId } = data as { attemptId: number };

    try {
      const result = await db
        .select()
        .from(clinicalReasoning)
        .where(eq(clinicalReasoning.attemptId, attemptId))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const reasoning = result[0];

      return {
        ...reasoning,
        problemRepresentation: reasoning.problemRepresentation as ProblemRepresentation | null,
        differentialDiagnoses: reasoning.differentialDiagnoses as DifferentialDiagnosis[] | null,
        evidenceReferences: reasoning.evidenceReferences as EvidenceReference[] | null,
        scoreBreakdown: reasoning.scoreBreakdown as ReasoningScoreBreakdown | null,
      } as ClinicalReasoningData;
    } catch (error) {
      console.error('Error fetching clinical reasoning:', error);
      throw new Error('Failed to fetch clinical reasoning');
    }
  }
);

// Calculate reasoning score
export const calculateReasoningScore = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    const { attemptId } = data as { attemptId: number };

    try {
      const result = await db
        .select()
        .from(clinicalReasoning)
        .where(eq(clinicalReasoning.attemptId, attemptId))
        .limit(1);

      if (result.length === 0) {
        throw new Error('Clinical reasoning not found');
      }

      const reasoning = result[0];

      // Scoring algorithm
      let problemRepScore = 0;
      let ddxScore = 0;
      let justificationScore = 0;

      // Score Problem Representation (0-100)
      if (reasoning.problemRepresentation) {
        const pr = reasoning.problemRepresentation as ProblemRepresentation;
        if (pr.summary && pr.summary.length > 20) problemRepScore += 25;
        if (pr.demographics) problemRepScore += 15;
        if (pr.chiefComplaint) problemRepScore += 15;
        if (pr.timeline) problemRepScore += 15;
        if (pr.context) problemRepScore += 10;
        if (pr.acuity) problemRepScore += 10;
        if (pr.severity) problemRepScore += 10;
      }

      // Score Differential Diagnoses (0-100)
      if (reasoning.differentialDiagnoses) {
        const ddxList = reasoning.differentialDiagnoses as DifferentialDiagnosis[];
        if (ddxList.length > 0) ddxScore += 20;
        if (ddxList.length >= 3) ddxScore += 20; // At least 3 differentials

        // Check for evidence
        const withSupporting = ddxList.filter(d => d.supportingEvidence && d.supportingEvidence.length > 0);
        const withAgainst = ddxList.filter(d => d.againstEvidence && d.againstEvidence.length > 0);

        ddxScore += (withSupporting.length / Math.max(ddxList.length, 1)) * 30; // Supporting evidence
        ddxScore += (withAgainst.length / Math.max(ddxList.length, 1)) * 30; // Against evidence
      }

      // Score Decision Justification (0-100)
      if (reasoning.decisionJustification) {
        const justification = reasoning.decisionJustification;
        if (justification.length > 50) justificationScore += 30;
        if (justification.length > 150) justificationScore += 30;
        if (reasoning.evidenceReferences && (reasoning.evidenceReferences as EvidenceReference[]).length > 0) {
          justificationScore += 40; // Has references
        }
      }

      // Calculate total
      const totalScore = Math.round((problemRepScore + ddxScore + justificationScore) / 3);

      const scoreBreakdown: ReasoningScoreBreakdown = {
        problemRep: Math.round(problemRepScore),
        ddx: Math.round(ddxScore),
        justification: Math.round(justificationScore),
        total: totalScore,
      };

      // Update reasoning with score
      await db
        .update(clinicalReasoning)
        .set({
          reasoningScore: totalScore.toString(),
          scoreBreakdown: scoreBreakdown as any,
          updatedAt: new Date(),
        })
        .where(eq(clinicalReasoning.id, reasoning.id));

      return scoreBreakdown;
    } catch (error) {
      console.error('Error calculating reasoning score:', error);
      throw new Error('Failed to calculate reasoning score');
    }
  }
);
