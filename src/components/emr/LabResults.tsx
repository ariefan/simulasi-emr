import type { CaseData } from '@/types/case';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface LabResultsProps {
  labData?: CaseData['laboratory'];
  imaging?: CaseData['imaging'] | null;
}

interface LabDefinition {
  label: string;
  unit?: string;
  min?: number;
  max?: number;
}

const LAB_REFERENCES: Record<string, LabDefinition> = {
  gdp_mg_dL: { label: 'Glukosa Darah Puasa', unit: 'mg/dL', min: 70, max: 100 },
  gd2jpp_mg_dL: { label: 'Glukosa Darah 2 jam PP', unit: 'mg/dL', min: 70, max: 140 },
  hba1c_percent: { label: 'HbA1c', unit: '%', min: 4, max: 6.5 },
  cholesterol_total_mg_dL: { label: 'Kolesterol Total', unit: 'mg/dL', min: 0, max: 200 },
  ldl_mg_dL: { label: 'LDL', unit: 'mg/dL', min: 0, max: 130 },
  hdl_mg_dL: { label: 'HDL', unit: 'mg/dL', min: 40, max: 60 },
  triglyceride_mg_dL: { label: 'Trigliserida', unit: 'mg/dL', min: 0, max: 150 },
  hb_g_dL: { label: 'Hemoglobin', unit: 'g/dL', min: 12, max: 16 },
  kreatinin_mg_dL: { label: 'Kreatinin', unit: 'mg/dL', min: 0.5, max: 1.3 },
  ureum_mg_dL: { label: 'Ureum', unit: 'mg/dL', min: 10, max: 45 },
};

const statusBadge = (status: 'normal' | 'low' | 'high') => {
  switch (status) {
    case 'high':
      return <Badge className="bg-rose-100 text-rose-700">Tinggi</Badge>;
    case 'low':
      return <Badge className="bg-amber-100 text-amber-700">Rendah</Badge>;
    default:
      return <Badge variant="secondary">Normal</Badge>;
  }
};

const evaluateStatus = (value: unknown, def?: LabDefinition): 'normal' | 'low' | 'high' => {
  if (!def || typeof value !== 'number') return 'normal';
  if (typeof def.min === 'number' && value < def.min) return 'low';
  if (typeof def.max === 'number' && value > def.max) return 'high';
  return 'normal';
};

export function LabResults({ labData, imaging }: LabResultsProps) {
  const entries = labData
    ? Object.entries(labData).filter(([key]) => key !== 'catatan')
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Hasil Laboratorium & Penunjang</CardTitle>
        <p className="text-xs text-slate-500">
          Soroti parameter dengan nilai tidak normal untuk fokus pada masalah klinis utama.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parameter</TableHead>
                <TableHead>Nilai</TableHead>
                <TableHead>Rujukan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(([key, rawValue]) => {
                const def = LAB_REFERENCES[key];
                const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
                const status = evaluateStatus(value, def);
                return (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{def?.label ?? key}</TableCell>
                    <TableCell>
                      {typeof rawValue === 'number' || typeof rawValue === 'string'
                        ? `${rawValue}${def?.unit ? ` ${def.unit}` : ''}`
                        : JSON.stringify(rawValue)}
                    </TableCell>
                    <TableCell>
                      {def?.min !== undefined && def?.max !== undefined
                        ? `${def.min} - ${def.max} ${def.unit ?? ''}`
                        : '-'}
                    </TableCell>
                    <TableCell>{statusBadge(status)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">Tidak ada data laboratorium.</p>
        )}

        {labData?.catatan && (
          <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            {String(labData.catatan)}
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-slate-700">Pemeriksaan Penunjang</p>
          {imaging && Object.keys(imaging).length > 0 ? (
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {Object.entries(imaging).map(([key, value]) => (
                <li key={key}>
                  <span className="font-medium">{key}:</span> {value}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada pemeriksaan penunjang.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
