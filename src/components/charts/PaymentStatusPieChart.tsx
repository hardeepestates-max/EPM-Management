"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard } from "lucide-react"

interface PaymentStatusData {
  name: string
  value: number
  color: string
}

interface PaymentStatusPieChartProps {
  paid: number
  pending: number
  overdue: number
  title?: string
}

export function PaymentStatusPieChart({
  paid,
  pending,
  overdue,
  title = "Payment Status"
}: PaymentStatusPieChartProps) {
  const data: PaymentStatusData[] = [
    { name: "Paid", value: paid, color: "#22c55e" },
    { name: "Pending", value: pending, color: "#eab308" },
    { name: "Overdue", value: overdue, color: "#ef4444" }
  ].filter(d => d.value > 0)

  const total = paid + pending + overdue

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
    payload?: Array<{ payload: PaymentStatusData }>
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium" style={{ color: data.color }}>{data.name}</p>
          <p className="text-gray-600">{formatCurrency(data.value)}</p>
          <p className="text-sm text-gray-500">{percentage}% of total</p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy }: { cx: number; cy: number }) => {
    return (
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
        <tspan x={cx} dy="-0.5em" className="text-2xl font-bold fill-gray-900">
          {formatCurrency(total)}
        </tspan>
        <tspan x={cx} dy="1.5em" className="text-sm fill-gray-500">
          Total
        </tspan>
      </text>
    )
  }

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-gray-500">
            No payment data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={CustomLabel}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => {
                  const item = data.find(d => d.name === value)
                  return (
                    <span className="text-sm text-gray-600">
                      {value}: {item ? formatCurrency(item.value) : ""}
                    </span>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
