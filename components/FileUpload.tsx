'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FileUploadProps {
  setAnalysis: (analysis: string) => void
  setLoading: (loading: boolean) => void
  isProcessing: boolean  // New prop to handle disabled state
}

export default function FileUpload({ setAnalysis, setLoading, isProcessing }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [hasUploaded, setHasUploaded] = useState(false)
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(true)

  const handleDrag = (e: React.DragEvent) => {
    if (isProcessing) return
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    if (isProcessing) return
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type === "application/pdf") {
      await processFile(file)
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing) return
    const file = e.target.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  const processFile = async (file: File) => {
    setLoading(true)
    setAnalysis('')  // Clear previous analysis
    setHasUploaded(true)
    setIsDisclaimerOpen(false)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error processing file')
      }

      let analysisText = ''
      const reader = response.body?.getReader()
      
      if (!reader) {
        throw new Error('No response stream available')
      }

      // Read the stream
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }
        
        // Convert the chunk to text
        const text = new TextDecoder().decode(value)
        const lines = text.split('\n')
        
        // Process each line
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5).trim())
              if (data.content) {
                analysisText += data.content
                setAnalysis(analysisText)
              }
            } catch (e) {
              console.error('Error parsing stream:', e)
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error processing file:', error)
      setAnalysis(`Error: ${error.message || 'Error processing file. Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-6 rounded-lg transition-colors ${
          hasUploaded ? 'bg-gray-800' : 'bg-yellow-500/10 border border-yellow-500/20'
        }`}
      >
        <button
          onClick={() => setIsDisclaimerOpen(!isDisclaimerOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-left"
        >
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${
            hasUploaded ? 'text-gray-300' : 'text-yellow-400'
          }`}>
            ⚠️ Important Disclaimer
            <span className="text-sm font-normal text-gray-400">
              {isDisclaimerOpen ? '(click to collapse)' : '(click to expand)'}
            </span>
          </h3>
          <svg
            className={`w-5 h-5 transform transition-transform ${
              isDisclaimerOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        
        <AnimatePresence>
          {isDisclaimerOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                <p className="text-sm text-gray-300 mb-3">
                  This tool uses OpenAI's API to analyze documents. Please do not upload any confidential or 
                  sensitive information as the content will be processed by OpenAI's servers.
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Want to try it out?</span>
                  <a 
                    href="/Sample Clinical Trial Application.pdf" 
                    download
                    className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                  >
                    Download sample clinical trial application
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        className={`border-2 border-dashed rounded-lg p-8 text-center 
          ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          transition-opacity duration-200`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        whileHover={{ scale: isProcessing ? 1 : 1.01 }}
        whileTap={{ scale: isProcessing ? 1 : 0.99 }}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleChange}
          className="hidden"
          id="file-upload"
          disabled={isProcessing}
        />
        <label 
          htmlFor="file-upload" 
          className={isProcessing ? 'cursor-not-allowed' : 'cursor-pointer'}
        >
          <div className="flex flex-col items-center">
            <svg
              className={`w-12 h-12 mb-4 ${isProcessing ? 'text-gray-500' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg mb-2">
              {isProcessing ? 'Processing...' : 'Drag and drop your PDF here'}
            </p>
            <p className="text-sm text-gray-400">
              {isProcessing ? 'Please wait' : 'or click to select a file'}
            </p>
          </div>
        </label>
      </motion.div>
    </div>
  )
} 