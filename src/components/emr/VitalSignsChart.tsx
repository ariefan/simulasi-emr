import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CaseData } from '@/types/case';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type VitalSigns = CaseData['physical_exam']['vital_signs'];

interface VitalSignsChartProps {
  vitalSigns?: VitalSigns | null;
}

const trendLabels = ['-3 hari', '-2 hari', '-1 hari', 'Hari ini'];

const generateTrend = (value: number | undefined, delta: number) => {
  if (typeof value !== 'number') {
    return trendLabels.map((label) => ({ label, value: null as number | null }));
  }

  return trendLabels.map((label, index) => {
    const modifier = (index - (trendLabels.length - 1)) * delta;
    return {
      label,
      value: Number((value + modifier).toFixed(1)),
    };
  });
};

export function VitalSignsChart({ vitalSigns }: VitalSignsChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => {
    if (!vitalSigns) return [];

    const hr = generateTrend(vitalSigns.hr_bpm, 2);
    const rr = generateTrend(vitalSigns.rr_per_min, 0.5);
    const temp = generateTrend(vitalSigns.temp_c, 0.1);
    const spo2 = generateTrend(vitalSigns.spo2_percent, 0.5);

    return trendLabels.map((label, index) => ({
      label,
      heartRate: hr[index]?.value ?? null,
      respiratoryRate: rr[index]?.value ?? null,
      temperature: temp[index]?.value ?? null,
      spo2: spo2[index]?.value ?? null,
    }));
  }, [vitalSigns]);

  if (!vitalSigns) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grafik Tanda Vital</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Belum ada data tanda vital untuk kasus ini.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Grafik Tanda Vital</CardTitle>
        <p className="text-xs text-slate-500">
          Amati tren parameter penting untuk memahami kondisi pasien secara dinamis.
        </p>
      </CardHeader>
      <CardContent className="h-72">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" />
              <YAxis yAxisId="temp" orientation="left" width={40} />
              <YAxis yAxisId="rate" orientation="right" width={50} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                yAxisId="temp"
                name="Suhu (°C)"
              />
              <Line
                type="monotone"
                dataKey="heartRate"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                yAxisId="rate"
                name="Nadi (bpm)"
              />
              <Line
                type="monotone"
                dataKey="respiratoryRate"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                yAxisId="rate"
                name="RR (x/menit)"
              />
              <Line
                type="monotone"
                dataKey="spo2"
                stroke="#9333ea"
                strokeWidth={2}
                dot={false}
                yAxisId="rate"
                name="SpO₂ (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Memuat grafik...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
