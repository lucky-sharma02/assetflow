import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
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

// Validated categorical palette (dataviz skill default), fixed order
// matching the AssetStatus enum — never cycled, never reassigned when
// a status count is zero. See scripts/validate_palette.js: light-mode
// worst adjacent CVD ΔE 24.2 (PASS), dark-mode 10.3 (floor-band WARN,
// mitigated here by the direct count labels on every bar).
//
// 5th slot (violet) added in #34: this chart was still stuck at 4 slots
// even though AssetStatus gained LOST back in #27 — #31's
// AssetUtilizationChart.tsx already extended to 5 slots for the reports
// page, but this dashboard chart never got the same fix, so a LOST asset
// would have silently rendered in slot 1's color, identical to AVAILABLE.
// Reuses #31's exact validated violet, not a newly-invented color.
const SLOT_VARS = [
  "--asset-status-slot-1",
  "--asset-status-slot-2",
  "--asset-status-slot-3",
  "--asset-status-slot-4",
  "--asset-status-slot-5",
]

interface AssetStatusChartProps {
  data: { status: string; count: number }[]
}

export function AssetStatusChart({ data }: AssetStatusChartProps) {
  const chartData = data.map((d, i) => ({
    ...d,
    label: STATUS_LABELS[d.status] ?? d.status,
    fill: `var(${SLOT_VARS[i % SLOT_VARS.length]})`,
  }))

  return (
    <div className="asset-status-chart h-60 w-full">
      <style>{`
        .asset-status-chart {
          --asset-status-slot-1: #2a78d6;
          --asset-status-slot-2: #1baf7a;
          --asset-status-slot-3: #eda100;
          --asset-status-slot-4: #008300;
          --asset-status-slot-5: #4a3aa7;
        }
        .dark .asset-status-chart {
          --asset-status-slot-1: #3987e5;
          --asset-status-slot-2: #199e70;
          --asset-status-slot-3: #c98500;
          --asset-status-slot-4: #008300;
          --asset-status-slot-5: #9085e9;
        }
      `}</style>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeOpacity={0.15} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={56}>
            <LabelList dataKey="count" position="top" fontSize={12} />
            {chartData.map((entry) => (
              <Cell key={entry.status} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
