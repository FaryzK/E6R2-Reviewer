'use client'

import { motion } from 'framer-motion'

interface AnalysisProps {
  analysis: string
  loading: boolean
}

export default function Analysis({ analysis, loading }: AnalysisProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!analysis) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-700 rounded-lg p-6"
    >
      <h2 className="text-2xl font-semibold mb-4">Analysis Results</h2>
      <div className="prose prose-invert">
        {analysis.split('\n').map((paragraph, index) => (
          <p key={index} className="mb-4">{paragraph}</p>
        ))}
      </div>
    </motion.div>
  )
} 