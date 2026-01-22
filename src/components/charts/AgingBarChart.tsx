"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

interface AgingData {
  name: string
  amount: number
  count: number
  color: string
}

interface AgingBarChartProps {
  current: number
  days30: number
  days60: number
  days90Plus: number
  title?: string
}

export function AgingBarChart({
  current,
  days30,
  days60,
  days90Plus,
  title = "Accounts Receivable Aging"
}: AgingBarChartProps) {
  const data: AgingData[] = [
    { name: "Current", amount: current, count: 0, color: "#22c55e" },
    { name: "31-60 Days", amount: days30, count: 0, color: "#eab308" },
    { name: "61-90 Days", amount: days60, count: 0, color: "#f97316" },
    { name: "90+ Days", amount: days90Plus, count: 0, color: "#ef4444" }
  ]

  const total = current + days30 + days60 + days90Plus

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const CustomTooltip = ({ active, payload }: {
    active?: boolean
    payload?: Array<{ payload: AgingData }>
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      const percentage = total > 0 ? ((item.amount / total) * 100).toFixed(1) : 0
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium" style={{ color: item.color }}>{item.name}</p>
          <p className="text-gray-900 font-bold">{formatCurrency(item.amount)}</p>
          <p className="text-sm text-gray-500">{percentage}% of total outstanding</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="text-sm">
            Total: <span className="font-bold">{formatCurrency(total)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
              <Bar
                dataKey="amount"
                radius={[0, 4, 4, 0]}
                barSize={30}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary below chart */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t">
          {data.map((item) => (
            <div key={item.name} className="text-center">
              <div
                className="text-lg font-bold"
                style={{ color: item.color }}
              >
                {formatCurrency(item.amount)}
              </div>
              <div className="text-xs text-gray-500">{item.name}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
