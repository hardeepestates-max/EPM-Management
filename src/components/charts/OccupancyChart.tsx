"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home } from "lucide-react"

interface OccupancyData {
  month: string
  rate: number
  units?: number
  occupied?: number
}

interface OccupancyChartProps {
  data: OccupancyData[]
  title?: string
  targetRate?: number
}

export function OccupancyChart({
  data,
  title = "Occupancy Rate",
  targetRate = 95
}: OccupancyChartProps) {
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ value: number; dataKey: string }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0]
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-1">{label}</p>
          <p className="text-blue-600">{item.value.toFixed(1)}% Occupancy</p>
        </div>
      )
    }
    return null
  }

  const avgRate = data.length > 0
    ? data.reduce((sum, d) => sum + d.rate, 0) / data.length
    : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="text-sm text-gray-500">
            Avg: <span className={`font-medium ${avgRate >= targetRate ? "text-green-600" : "text-orange-600"}`}>
              {avgRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={targetRate}
                stroke="#22c55e"
                strokeDasharray="5 5"
                label={{
                  value: `Target ${targetRate}%`,
                  position: "right",
                  fill: "#22c55e",
                  fontSize: 11
                }}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
