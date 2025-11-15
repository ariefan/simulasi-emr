import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDashboardStats,
  getStudentProgress,
  saveReflection,
  startCaseAttempt,
  submitQuiz,
} from '@/lib/progress-actions';

// Hook to fetch student progress for all cases
export function useStudentProgress(studentId: number) {
  return useQuery({
    queryKey: ['student-progress', studentId],
    queryFn: () => getStudentProgress({ data: { studentId } } as any),
    enabled: !!studentId,
  });
}

// Hook to start a new case attempt
export function useStartCaseAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { studentId: number; caseId: string }) =>
      startCaseAttempt(data as any),
    onSuccess: (_, variables) => {
      // Invalidate student progress to refresh
      queryClient.invalidateQueries({
        queryKey: ['student-progress', variables.studentId],
      });
    },
  });
}

// Hook to submit quiz answers
export function useSubmitQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      attemptId: number;
      studentId: number;
      caseId: string;
      answers: Record<string, number>;
      score: number;
      maxScore: number;
      timeSpentSeconds?: number;
    }) => submitQuiz(data as any),
    onSuccess: (_, variables) => {
      // Invalidate student progress to refresh
      queryClient.invalidateQueries({
        queryKey: ['student-progress', variables.studentId],
      });
    },
  });
}

// Hook to save or update reflection
export function useSaveReflection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      studentId: number;
      caseId: string;
      attemptId?: number;
      what: string;
      soWhat: string;
      nowWhat: string;
    }) => saveReflection(data as any),
    onSuccess: (_, variables) => {
      // Invalidate student progress to refresh
      queryClient.invalidateQueries({
        queryKey: ['student-progress', variables.studentId],
      });
    },
  });
}

// Hook to fetch dashboard statistics
export function useDashboardStats(studentId: number) {
  return useQuery({
    queryKey: ['dashboard-stats', studentId],
    queryFn: () => getDashboardStats({ data: { studentId } } as any),
    enabled: !!studentId,
  });
}
