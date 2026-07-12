import type { ReactNode } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  ALLOCATED: "Allocated",
  UNDER_MAINTENANCE: "Under maintenance",
  RETIRED: "Retired",
  LOST: "Lost",
}

// Extends the dashboard's (#28) 4-slot validated categorical palette with
// one more slot (violet, the next hue in the reference palette's fixed
// order) for LOST. Re-validated as a 5-slot set with
// scripts/validate_palette.js: light-mode worst adjacent CVD DeltaE 24.2
// (PASS), dark-mode 10.3 (floor-band WARN, mitigated by the direct count
// labels on every bar, same as #28).
const SLOT_VARS = [
  "--report-utilization-slot-1",
  "--report-utilization-slot-2",
  "--report-utilization-slot-3",
  "--report-utilization-slot-4",
  "--report-utilization-slot-5",
]

interface AssetUtilizationChartProps {
  data: { status: string; count: number; percentage: number }[]
}

export function AssetUtilizationChart({ data }: AssetUtilizationChartProps) {
  const chartData = data.map((d, i) => ({
    ...d,
    label: STATUS_LABELS[d.status] ?? d.status,
    fill: `var(${SLOT_VARS[i % SLOT_VARS.length]})`,
  }))

  return (
    <div className="report-utilization-chart h-64 w-full">
      <style>{`
        .report-utilization-chart {
          --report-utilization-slot-1: #2a78d6;
          --report-utilization-slot-2: #1baf7a;
          --report-utilization-slot-3: #eda100;
          --report-utilization-slot-4: #008300;
          --report-utilization-slot-5: #4a3aa7;
        }
        .dark .report-utilization-chart {
          --report-utilization-slot-1: #3987e5;
          --report-utilization-slot-2: #199e70;
          --report-utilization-slot-3: #c98500;
          --report-utilization-slot-4: #008300;
          --report-utilization-slot-5: #9085e9;
        }
      `}</style>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeOpacity={0.15} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={36}
            unit="%"
          />
          <Tooltip
            formatter={(value, _name, item) => {
              const point = item.payload as { count: number; label: string }
              return [`${value}% (${point.count} assets)`, point.label]
            }}
          />
          <Bar dataKey="percentage" radius={[4, 4, 0, 0]} maxBarSize={56}>
            <LabelList
              dataKey="percentage"
              position="top"
              fontSize={12}
              formatter={(v: ReactNode) => `${v}%`}
            />
            {chartData.map((entry) => (
              <Cell key={entry.status} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
