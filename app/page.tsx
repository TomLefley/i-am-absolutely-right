'use client'

import { useState, useEffect } from 'react'
import CounterDisplay from './components/CounterDisplay'
import IssueCounterDisplay from './components/IssueCounterDisplay'
import Chart from './components/Chart'

interface CounterData {
  total: number
  dailyCounts: { date: string; count: number }[]
}

interface Stats {
  right: CounterData
  issue: CounterData
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({ 
    right: { total: 0, dailyCounts: [] },
    issue: { total: 0, dailyCounts: [] }
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent px-4 py-2">
            Claude Code Phrase Tracker
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-light">
            Tracking Claude's favorite expressions
          </p>
        </div>

        {/* Counters Grid */}
        <div className="grid md:grid-cols-2 gap-8 w-full">
          {/* Absolutely Right Counter */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                "You're absolutely right!"
              </h2>
              <p className="text-gray-600 mt-2">Confidence tracker</p>
            </div>
            <CounterDisplay count={stats.right.total} isLoading={isLoading} />
          </div>

          {/* Issue Detection Counter */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                "Now I can see the issue"
              </h2>
              <p className="text-gray-600 mt-2">Problem detection tracker</p>
            </div>
            <IssueCounterDisplay count={stats.issue.total} isLoading={isLoading} />
          </div>
        </div>

        {/* Combined Chart */}
        <div className="w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
              Phrase Activity Comparison (Last 14 Days)
            </h3>
            <Chart rightData={stats.right.dailyCounts} issueData={stats.issue.dailyCounts} />
          </div>
        </div>

        {/* Fun Facts */}
        <div className="grid md:grid-cols-4 gap-4 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-2xl font-bold text-blue-600">
              {stats.right.dailyCounts.length > 0 
                ? Math.max(...stats.right.dailyCounts.map(d => d.count))
                : 0}
            </div>
            <div className="text-gray-600 mt-2 text-sm">Peak "Right" Day</div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-2xl font-bold text-orange-600">
              {stats.issue.dailyCounts.length > 0 
                ? Math.max(...stats.issue.dailyCounts.map(d => d.count))
                : 0}
            </div>
            <div className="text-gray-600 mt-2 text-sm">Peak Issue Day</div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-2xl font-bold text-green-600">
              {stats.right.total + stats.issue.total}
            </div>
            <div className="text-gray-600 mt-2 text-sm">Total Phrases</div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-2xl font-bold text-purple-600">
              {Math.max(
                stats.right.dailyCounts.filter(d => d.count > 0).length,
                stats.issue.dailyCounts.filter(d => d.count > 0).length
              )}
            </div>
            <div className="text-gray-600 mt-2 text-sm">Most Active Days</div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm space-y-2">
          <p>Powered by Claude Code enthusiasm 🤖</p>
          <p>
            <a 
              href={process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/yourusername/i-am-absolutely-right"} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 transition-colors underline"
            >
              View source on GitHub
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}