import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface MaintenanceFrequencyChartProps {
  data: { assetName: string; assetTag: string; requestCount: number }[]
}

// Ranking a handful of individual assets, not a small fixed category set
// -- this is a magnitude job, so it takes the sequential default (one
// hue, per the dataviz skill's color formula) rather than a categorical
// palette. No legend needed: a single series is already named by the
// chart title. Reuses the reference palette's sequential anchor hue
// (same blue as categorical slot 1 elsewhere in the app).
export function MaintenanceFrequencyChart({ data }: MaintenanceFrequencyChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: `${d.assetName} (${d.assetTag})`,
  }))

  return (
    <div className="report-frequency-chart w-full" style={{ height: Math.max(160, chartData.length * 36) }}>
      <style>{`
        .report-frequency-chart { --report-frequency-bar: #2a78d6; }
        .dark .report-frequency-chart { --report-frequency-bar: #3987e5; }
      `}</style>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 32, left: 8, bottom: 8 }}
        >
          <CartesianGrid horizontal={false} strokeOpacity={0.15} />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={180}
          />
          <Tooltip formatter={(value) => [`${value} requests`, "Maintenance requests"]} />
          <Bar
            dataKey="requestCount"
            fill="var(--report-frequency-bar)"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
          >
            <LabelList dataKey="requestCount" position="right" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
