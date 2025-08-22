'use client'

import { useEffect, useState } from 'react'

interface IssueCounterDisplayProps {
  count: number
  isLoading: boolean
}

export default function IssueCounterDisplay({ count, isLoading }: IssueCounterDisplayProps) {
  const [displayCount, setDisplayCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (!isLoading && count !== displayCount) {
      setIsAnimating(true)
      
      // Animate the counter change
      const duration = 1000
      const steps = Math.min(Math.abs(count - displayCount), 20)
      const increment = (count - displayCount) / steps
      
      let currentStep = 0
      const timer = setInterval(() => {
        currentStep++
        if (currentStep >= steps) {
          setDisplayCount(count)
          clearInterval(timer)
          setTimeout(() => setIsAnimating(false), 500)
        } else {
          setDisplayCount(Math.round(displayCount + increment * currentStep))
        }
      }, duration / steps)
      
      return () => clearInterval(timer)
    }
  }, [count, displayCount, isLoading])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-pulse">
          <div className="h-32 w-64 bg-gray-200 rounded-3xl mb-4"></div>
          <div className="h-8 w-48 bg-gray-200 rounded-lg mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className={`
        bg-white/90 backdrop-blur-sm rounded-3xl p-8 md:p-12 
        shadow-2xl border border-white/30 transition-all duration-500
        ${isAnimating ? 'scale-105 glow' : 'scale-100'}
      `}>
        <div className={`
          text-6xl md:text-8xl lg:text-9xl font-bold 
          bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 
          bg-clip-text text-transparent text-center
          transition-all duration-300
          ${isAnimating ? 'animate-pulse-glow' : ''}
        `}>
          {displayCount.toLocaleString()}
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-lg md:text-xl text-gray-600 font-medium">
          Times Claude spotted the issue
        </p>
        {isAnimating && (
          <p className="text-sm text-orange-600 mt-2 animate-bounce">
            🔍 Issue detected! 🔍
          </p>
        )}
      </div>
    </div>
  )
}