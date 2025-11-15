import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  saveClinicalReasoning,
  getClinicalReasoning,
  calculateReasoningScore,
} from '@/lib/clinical-reasoning-actions';
import type {
  ProblemRepresentation,
  DifferentialDiagnosis,
  EvidenceReference,
} from '@/types/clinical-reasoning';

// Hook to fetch clinical reasoning for an attempt
export function useClinicalReasoning(attemptId: number | null) {
  return useQuery({
    queryKey: ['clinical-reasoning', attemptId],
    queryFn: () => getClinicalReasoning({ data: { attemptId } } as any),
    enabled: !!attemptId,
  });
}

// Hook to save clinical reasoning
export function useSaveClinicalReasoning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      attemptId: number;
      studentId: number;
      caseId: string;
      problemRepresentation?: ProblemRepresentation;
      differentialDiagnoses?: DifferentialDiagnosis[];
      decisionJustification?: string;
      evidenceReferences?: EvidenceReference[];
    }) => saveClinicalReasoning(data as any),
    onSuccess: (_, variables) => {
      // Invalidate clinical reasoning query to refresh
      queryClient.invalidateQueries({
        queryKey: ['clinical-reasoning', variables.attemptId],
      });
    },
  });
}

// Hook to calculate reasoning score
export function useCalculateReasoningScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { attemptId: number }) =>
      calculateReasoningScore(data as any),
    onSuccess: (_, variables) => {
      // Invalidate clinical reasoning query to refresh with new score
      queryClient.invalidateQueries({
        queryKey: ['clinical-reasoning', variables.attemptId],
      });
    },
  });
}
