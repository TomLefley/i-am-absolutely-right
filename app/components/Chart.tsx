'use client'

import { useMemo } from 'react'

interface DataPoint {
  date: string
  count: number
}

interface ChartProps {
  rightData: DataPoint[]
  issueData: DataPoint[]
}

export default function Chart({ rightData, issueData }: ChartProps) {
  const combinedData = useMemo(() => {
    const dateMap = new Map<string, { right: number; issue: number }>()
    
    // Initialize with all dates from both datasets
    const allData = [...rightData, ...issueData]
    allData.forEach(({ date }) => {
      if (!dateMap.has(date)) {
        dateMap.set(date, { right: 0, issue: 0 })
      }
    })
    
    // Populate right data
    rightData.forEach(({ date, count }) => {
      const entry = dateMap.get(date)!
      entry.right = count
    })
    
    // Populate issue data
    issueData.forEach(({ date, count }) => {
      const entry = dateMap.get(date)!
      entry.issue = count
    })
    
    // Convert to array, sort by date, and take only the last 14 days
    const allEntries = Array.from(dateMap.entries())
      .map(([date, counts]) => ({
        date,
        right: counts.right,
        issue: counts.issue,
        total: counts.right + counts.issue
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Return only the last 14 days
    return allEntries.slice(-14)
  }, [rightData, issueData])

  const maxCount = useMemo(() => {
    return Math.max(...combinedData.map(d => Math.max(d.right, d.issue)), 1)
  }, [combinedData])

  if (combinedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded"></div>
          <span className="text-gray-700">"You're absolutely right!"</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded"></div>
          <span className="text-gray-700">"I can see the issue"</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex">
        {/* Y-axis */}
        <div className="flex flex-col justify-between text-xs text-gray-400 pr-3" style={{ height: '200px', paddingTop: '10px', paddingBottom: '10px' }}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="text-right">
              {Math.round(maxCount - (i * maxCount / 4))}
            </div>
          ))}
        </div>
        
        {/* Chart area */}
        <div className="flex-1 relative">
          {/* Grid lines */}
          <div className="absolute inset-0" style={{ height: '200px' }}>
            {/* Horizontal grid lines */}
            <div className="flex flex-col justify-between px-12" style={{ height: '180px', marginTop: '10px', marginBottom: '10px' }}>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="border-t border-dashed border-gray-300 opacity-60 -mx-12" />
              ))}
            </div>
            {/* Vertical grid lines */}
            <div className="absolute inset-0 flex justify-between px-2">
              {combinedData.map((_, index) => (
                <div key={index} className="border-l border-dashed border-gray-300 opacity-60 h-full" />
              ))}
            </div>
          </div>
          
          <div className="flex items-end justify-between px-2 relative" style={{ height: '200px', paddingTop: '10px', paddingBottom: '10px' }}>
            {combinedData.map((item, index) => {
              const rightHeight = (item.right / maxCount) * 160
              const issueHeight = (item.issue / maxCount) * 160
              
              return (
                <div key={index} className="flex flex-col items-center space-y-2 flex-1 min-w-0">
                  {/* Side-by-side bars */}
                  <div className="flex items-end justify-center space-x-1" style={{ height: '160px' }}>
                    {/* Right bar */}
                    <div className="flex flex-col justify-end">
                      <div
                        className="bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-sm transition-all duration-300 hover:from-blue-600 hover:to-blue-700 cursor-pointer group relative"
                        style={{ 
                          height: `${rightHeight}px`,
                          width: '8px',
                          minHeight: item.right > 0 ? '2px' : '0px'
                        }}
                      >
                        <div className="absolute -top-8 left-12 p-4 bg-white text-gray-800 text-sm rounded-lg shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50" style={{ minWidth: '220px', whiteSpace: 'normal' }}>
                          <p className="font-semibold text-gray-800 mb-1">
                            {new Date(item.date).toLocaleDateString('en-US', { 
                              weekday: 'long',
                              month: 'long', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-blue-600">
                            {item.right === 1 ? '1 time' : `${item.right} times`} absolutely right
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Issue bar */}
                    <div className="flex flex-col justify-end">
                      <div
                        className="bg-gradient-to-t from-orange-500 to-red-500 rounded-t-sm transition-all duration-300 hover:from-orange-600 hover:to-red-600 cursor-pointer group relative"
                        style={{ 
                          height: `${issueHeight}px`,
                          width: '8px',
                          minHeight: item.issue > 0 ? '2px' : '0px'
                        }}
                      >
                        <div className="absolute -top-8 -left-56 p-4 bg-white text-gray-800 text-sm rounded-lg shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50" style={{ minWidth: '220px', whiteSpace: 'normal' }}>
                          <p className="font-semibold text-gray-800 mb-1">
                            {new Date(item.date).toLocaleDateString('en-US', { 
                              weekday: 'long',
                              month: 'long', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-orange-600">
                            {item.issue === 1 ? '1 issue' : `${item.issue} issues`} spotted
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date label - horizontal */}
                  <div className="text-xs text-gray-500 text-center truncate w-full">
                    {new Date(item.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex justify-center space-x-8 text-sm text-gray-600 pt-4 border-t border-gray-200">
        <div>
          <span className="font-medium text-blue-600">
            {rightData.reduce((sum, d) => sum + d.count, 0)}
          </span>
          <span className="ml-1">total "right"</span>
        </div>
        <div>
          <span className="font-medium text-orange-600">
            {issueData.reduce((sum, d) => sum + d.count, 0)}
          </span>
          <span className="ml-1">total "issues"</span>
        </div>
      </div>
    </div>
  )
}