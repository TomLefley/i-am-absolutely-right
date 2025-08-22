'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface IssueHistogramChartProps {
  data: { date: string; count: number }[]
}

export default function IssueHistogramChart({ data }: IssueHistogramChartProps) {
  // Format data for the chart
  const chartData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }))

  // Generate colors based on count (using orange/red theme for issue detection)
  const getBarColor = (count: number, maxCount: number) => {
    if (count === 0) return '#e5e7eb'
    const intensity = count / maxCount
    if (intensity > 0.8) return '#dc2626' // red-600
    if (intensity > 0.6) return '#ea580c' // orange-600
    if (intensity > 0.4) return '#f97316' // orange-500
    if (intensity > 0.2) return '#fb923c' // orange-400
    return '#fed7aa' // orange-200
  }

  const maxCount = Math.max(...data.map(d => d.count), 1)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">
            {new Date(data.date).toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          <p className="text-orange-600">
            {data.count === 1 ? '1 issue' : `${data.count} issues`} spotted
          </p>
        </div>
      )
    }
    return null
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">🔍</div>
          <p>No issues spotted yet! Claude is getting better at debugging.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="formattedDate" 
            tick={{ fontSize: 12 }}
            stroke="#666"
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#666"
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="count" 
            radius={[4, 4, 0, 0]}
            animationDuration={1000}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(entry.count, maxCount)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}