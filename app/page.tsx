'use client'

import { useState } from 'react'
import FileUpload from '@/components/FileUpload'
import Analysis from '@/components/Analysis'
import { motion } from 'framer-motion'

export default function Home() {
  const [analysis, setAnalysis] = useState<string>('')
  const [loading, setLoading] = useState(false)

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
        >
          E6(R2) Document Reviewer
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-lg p-8 shadow-xl"
        >
          <FileUpload 
            setAnalysis={setAnalysis} 
            setLoading={setLoading} 
            isProcessing={loading}
          />
          <Analysis analysis={analysis} loading={loading} />
        </motion.div>
      </div>
    </main>
  )
} 