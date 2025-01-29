'use client'

import { motion } from 'framer-motion'

interface AnalysisProps {
  analysis: string
  loading: boolean
}

export default function Analysis({ analysis, loading }: AnalysisProps) {
  if (loading && !analysis) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!analysis && !loading) return null

  const paragraphs = analysis.split('\n')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-700 rounded-lg p-6"
    >
      <h2 className="text-2xl font-semibold mb-4">Analysis Results</h2>
      <div className="prose prose-invert">
        {paragraphs.map((paragraph, index) => {
          if (!paragraph.trim()) return null

          const isHeading = /^\d+\./.test(paragraph.trim())
          const isBullet = paragraph.trim().startsWith('-')
          const isLastParagraph = index === paragraphs.length - 1

          return (
            <p
              key={index}
              className={`mb-4 ${isHeading ? 'text-xl font-semibold text-blue-400' : ''} 
                ${isBullet ? 'pl-4 border-l-2 border-gray-600' : ''}`}
            >
              {paragraph}
              {isLastParagraph && loading && (
                <span className="animate-pulse ml-[1px]">▌</span>
              )}
            </p>
          )
        })}
      </div>
    </motion.div>
  )
} 