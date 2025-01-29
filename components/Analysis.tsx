'use client'

import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ReactNode } from "react"

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-700 rounded-lg p-6"
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