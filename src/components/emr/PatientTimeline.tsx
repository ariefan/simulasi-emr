import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CaseData } from '@/types/case';

type EventType = 'note' | 'vital' | 'lab' | 'medication' | 'procedure' | 'plan';

interface TimelineEvent {
  id: string;
  timestamp: Date;
  eventType: EventType;
  title: string;
  description: string;
  severity: 'normal' | 'warning' | 'critical';
  details?: string;
}

const eventTypeLabels: Record<EventType, string> = {
  note: 'Catatan',
  vital: 'Vital',
  lab: 'Lab',
  medication: 'Obat',
  procedure: 'Tindakan',
  plan: 'Rencana',
};

const severityClasses: Record<TimelineEvent['severity'], string> = {
  normal: 'border-emerald-200 bg-emerald-50',
  warning: 'border-amber-200 bg-amber-50',
  critical: 'border-rose-200 bg-rose-50',
};

const filterOptions: Array<{ label: string; value: EventType | 'all' }> = [
  { label: 'Semua', value: 'all' },
  { label: 'Catatan', value: 'note' },
  { label: 'Vital', value: 'vital' },
  { label: 'Lab', value: 'lab' },
  { label: 'Obat', value: 'medication' },
  { label: 'Tindakan', value: 'procedure' },
  { label: 'Rencana', value: 'plan' },
];

const HOURS = 60 * 60 * 1000;

const buildTimelineEvents = (caseData: CaseData): TimelineEvent[] => {
  const baseTime = new Date();
  const events: TimelineEvent[] = [];

  events.push({
    id: `${caseData.case_id}-presentation`,
    timestamp: new Date(baseTime.getTime() - HOURS * 72),
    eventType: 'note',
    title: 'Presentasi Awal',
    description: caseData.chief_complaint,
    severity: 'warning',
    details: caseData.history_of_present_illness,
  });

  if (caseData.physical_exam?.vital_signs) {
    const vital = caseData.physical_exam.vital_signs;
    const bpValue = vital.bp_mmHg ? parseInt(vital.bp_mmHg.split('/')[0] ?? '0', 10) : 0;
    const severity: TimelineEvent['severity'] =
      bpValue > 160 || (vital.hr_bpm && vital.hr_bpm > 120)
        ? 'critical'
        : bpValue > 140 || (vital.hr_bpm && vital.hr_bpm > 100)
          ? 'warning'
          : 'normal';

    events.push({
      id: `${caseData.case_id}-vitals`,
      timestamp: new Date(baseTime.getTime() - HOURS * 48),
      eventType: 'vital',
      title: 'Pemeriksaan Vital',
      description: `TD ${vital.bp_mmHg || '-'}, HR ${vital.hr_bpm || '-'} bpm, RR ${
        vital.rr_per_min || '-'
      }x/menit`,
      severity,
      details: `Suhu ${vital.temp_c ?? '-'}°C • SpO₂ ${vital.spo2_percent ?? '-'}%`,
    });
  }

  if (caseData.laboratory) {
    const hba1c = caseData.laboratory.hba1c_percent;
    const severity: TimelineEvent['severity'] =
      typeof hba1c === 'number' && hba1c >= 10
        ? 'critical'
        : typeof hba1c === 'number' && hba1c >= 8
          ? 'warning'
          : 'normal';

    const labSummary = [
      hba1c ? `HbA1c ${hba1c}%` : null,
      caseData.laboratory.gdp_mg_dL ? `GDP ${caseData.laboratory.gdp_mg_dL} mg/dL` : null,
      caseData.laboratory.gd2jpp_mg_dL ? `GD2JPP ${caseData.laboratory.gd2jpp_mg_dL} mg/dL` : null,
    ]
      .filter(Boolean)
      .join(' • ');

    if (labSummary.length > 0) {
      events.push({
        id: `${caseData.case_id}-labs`,
        timestamp: new Date(baseTime.getTime() - HOURS * 30),
        eventType: 'lab',
        title: 'Hasil Laboratorium',
        description: labSummary,
        severity,
        details: (caseData.laboratory.catatan as string) || undefined,
      });
    }
  }

  if (caseData.management_plan?.pharmacological?.length) {
    events.push({
      id: `${caseData.case_id}-therapy`,
      timestamp: new Date(baseTime.getTime() - HOURS * 24),
      eventType: 'medication',
      title: 'Penyesuaian Terapi',
      description: caseData.management_plan.pharmacological[0],
      severity: 'normal',
      details:
        caseData.management_plan.pharmacological.slice(1, 3).join(' • ') || undefined,
    });
  }

  if (caseData.management_plan?.non_pharmacological?.length) {
    events.push({
      id: `${caseData.case_id}-education`,
      timestamp: new Date(baseTime.getTime() - HOURS * 12),
      eventType: 'plan',
      title: 'Edukasi & Rencana Tindak Lanjut',
      description: caseData.management_plan.non_pharmacological[0],
      severity: 'normal',
      details: caseData.management_plan.monitoring || undefined,
    });
  }

  if (caseData.procedures && caseData.procedures.length > 0) {
    events.push({
      id: `${caseData.case_id}-procedure`,
      timestamp: new Date(baseTime.getTime() - HOURS * 6),
      eventType: 'procedure',
      title: 'Tindakan / Prosedur',
      description: caseData.procedures[0],
      severity: 'normal',
    });
  }

  return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

interface PatientTimelineProps {
  caseData: CaseData;
}

export function PatientTimeline({ caseData }: PatientTimelineProps) {
  const [filter, setFilter] = useState<EventType | 'all'>('all');
  const events = useMemo(() => buildTimelineEvents(caseData), [caseData]);
  const filteredEvents = filter === 'all' ? events : events.filter((event) => event.eventType === filter);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-base">Timeline Pasien</CardTitle>
          <p className="text-xs text-slate-500">
            Ikuti perjalanan klinis pasien dari presentasi awal hingga rencana tindak lanjut.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={filter === option.value ? 'default' : 'outline'}
              className="h-7 text-xs"
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {filteredEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada data timeline untuk kategori ini.</p>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className={cn(
                  'relative rounded-lg border px-4 py-3 pl-8 shadow-sm',
                  severityClasses[event.severity]
                )}
              >
                <span className="absolute left-3 top-5 h-2 w-2 rounded-full bg-slate-400" />
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{format(event.timestamp, 'dd MMM yyyy HH:mm')}</span>
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {eventTypeLabels[event.eventType]}
                  </Badge>
                </div>
                <div className="mt-1">
                  <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                  <p className="text-xs text-slate-700">{event.description}</p>
                  {event.details && (
                    <p className="mt-1 text-xs text-slate-600">{event.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
