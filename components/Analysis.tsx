'use client'

import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ReactNode, useEffect, useRef, useState } from 'react'

interface AnalysisProps {
  analysis: string
  loading: boolean
}

export default function Analysis({ analysis, loading }: AnalysisProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [userHasScrolled, setUserHasScrolled] = useState(false)
  const lastScrollPosition = useRef(0)

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (!loading) return

      // Detect if user is manually scrolling up
      if (window.scrollY < lastScrollPosition.current) {
        setUserHasScrolled(true)
      }

      // If user scrolls back to bottom, resume auto-scroll
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50
      if (isAtBottom) {
        setUserHasScrolled(false)
      }

      lastScrollPosition.current = window.scrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loading])

  // Reset scroll state when new analysis starts
  useEffect(() => {
    if (!loading) {
      setUserHasScrolled(false)
      lastScrollPosition.current = 0
    }
  }, [loading])

  // Auto-scroll effect
  useEffect(() => {
    if (loading && containerRef.current && !userHasScrolled) {
      containerRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      })
    }
  }, [analysis, loading, userHasScrolled])

  if (loading && !analysis) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!analysis && !loading) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-700 rounded-lg p-6"
      ref={containerRef}
    >
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            code: ({ inline, ...props }: { inline?: boolean; children?: ReactNode }) => (
              inline 
                ? <code className="bg-gray-800 px-1 rounded" {...props} />
                : <pre className="block bg-gray-800 p-2 rounded my-2"><code {...props} /></pre>
            ),
          }}
        >
          {analysis}
        </ReactMarkdown>
        {loading && <span className="animate-pulse ml-[1px]">▌</span>}
      </div>
    </motion.div>
  )
} 