import { useQuery } from '@tanstack/react-query';
import { getCases, getCaseById, getDepartments } from '@/lib/case-actions';
import type { CaseData } from '@/types/case';

// Hook to fetch cases with optional filters
export function useCases(filters?: { department?: string; search?: string; skdiLevel?: string }) {
  return useQuery<CaseData[]>({
    queryKey: ['cases', filters],
    queryFn: () => getCases({ data: filters } as any),
  });
}

// Hook to fetch a single case by ID
export function useCase(caseId: string) {
  return useQuery<CaseData>({
    queryKey: ['case', caseId],
    queryFn: () => getCaseById({ data: { caseId } } as any),
    enabled: !!caseId,
  });
}

// Hook to fetch all departments for filter dropdown
export function useDepartments() {
  return useQuery<string[]>({
    queryKey: ['departments'],
    queryFn: () => getDepartments({ data: {} } as any),
  });
}
