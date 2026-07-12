import type { ReactNode } from "react"
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

interface DepartmentAllocationChartProps {
  data: { departmentName: string; totalAssets: number; allocatedAssets: number; percentage: number }[]
}

// Same sequential-hue reasoning as MaintenanceFrequencyChart: one measure
// (allocation %) compared across departments, not distinct series that
// need identity color.
export function DepartmentAllocationChart({ data }: DepartmentAllocationChartProps) {
  return (
    <div className="report-department-chart w-full" style={{ height: Math.max(160, data.length * 40) }}>
      <style>{`
        .report-department-chart { --report-department-bar: #2a78d6; }
        .dark .report-department-chart { --report-department-bar: #3987e5; }
      `}</style>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 40, left: 8, bottom: 8 }}
        >
          <CartesianGrid horizontal={false} strokeOpacity={0.15} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            unit="%"
          />
          <YAxis
            type="category"
            dataKey="departmentName"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={140}
          />
          <Tooltip
            formatter={(value, _name, item) => {
              const point = item.payload as { allocatedAssets: number; totalAssets: number }
              return [`${value}% (${point.allocatedAssets} of ${point.totalAssets} assets)`, "Allocated"]
            }}
          />
          <Bar
            dataKey="percentage"
            fill="var(--report-department-bar)"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
          >
            <LabelList
              dataKey="percentage"
              position="right"
              fontSize={12}
              formatter={(v: ReactNode) => `${v}%`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
