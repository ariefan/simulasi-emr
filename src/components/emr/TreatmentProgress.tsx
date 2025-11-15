import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import type { CaseData } from '@/types/case';

interface TreatmentProgressProps {
  caseId: string;
  plan?: CaseData['management_plan'];
}

interface TreatmentStep {
  id: string;
  label: string;
  category: string;
}

const buildSteps = (caseId: string, plan?: CaseData['management_plan']): TreatmentStep[] => {
  if (!plan) return [];

  const steps: TreatmentStep[] = [];
  const addStep = (prefix: string, label: string) => {
    steps.push({
      id: `${caseId}-${prefix}-${steps.length}`,
      label,
      category: prefix,
    });
  };

  plan.non_pharmacological?.forEach((item) => addStep('non-pharm', item));
  plan.pharmacological?.forEach((item) => addStep('pharm', item));
  if (plan.procedure) addStep('procedure', plan.procedure);
  if (plan.monitoring) addStep('monitoring', plan.monitoring);
  if (plan.referral) addStep('referral', plan.referral);

  return steps;
};

export function TreatmentProgress({ caseId, plan }: TreatmentProgressProps) {
  const steps = useMemo(() => buildSteps(caseId, plan), [caseId, plan]);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(`treatment-progress-${caseId}`);
    if (raw) {
      setCompletedSteps(JSON.parse(raw));
    } else {
      setCompletedSteps({});
    }
  }, [caseId]);

  const handleToggle = (stepId: string, checked: boolean) => {
    setCompletedSteps((prev) => {
      const updated = { ...prev, [stepId]: checked };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`treatment-progress-${caseId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const completedCount = steps.filter((step) => completedSteps[step.id]).length;
  const progressValue = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Treatment Progress Tracker</CardTitle>
        <p className="text-xs text-slate-500">
          Tandai intervensi yang telah dilakukan untuk memastikan rencana tatalaksana terpenuhi.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Progres</span>
            <span>{progressValue}%</span>
          </div>
          <Progress value={progressValue} className="mt-1" />
        </div>
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">Rencana tatalaksana belum tersedia.</p>
        ) : (
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.id} className="flex items-start gap-2 rounded-md border p-2">
                <Checkbox
                  id={step.id}
                  checked={completedSteps[step.id] || false}
                  onCheckedChange={(value) => handleToggle(step.id, Boolean(value))}
                />
                <div>
                  <Label htmlFor={step.id} className="text-sm font-medium leading-snug">
                    {step.label}
                  </Label>
                  <p className="text-[11px] uppercase text-slate-500">{step.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
