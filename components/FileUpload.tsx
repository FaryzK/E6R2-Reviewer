'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface FileUploadProps {
  setAnalysis: (analysis: string) => void
  setLoading: (loading: boolean) => void
}

export default function FileUpload({ setAnalysis, setLoading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type === "application/pdf") {
      await processFile(file)
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  const processFile = async (file: File) => {
    setLoading(true)
    setAnalysis('')
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
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center">
            <svg
              className="w-12 h-12 mb-4 text-gray-400"
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
            <p className="text-lg mb-2">Drag and drop your PDF here</p>
            <p className="text-sm text-gray-400">or click to select a file</p>
          </div>
        </label>
      </motion.div>
    </div>
  )
} 