// app/api/upload/route.ts (for example)

import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import fs from 'fs/promises'
import PDFParser from 'pdf2json'

// Define PDFData interface
interface PDFData {
  numpages: number
  text: string
  numrender?: number
  info?: any
  metadata?: any
  version?: string
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Add case studies directly in the code
const CASE_STUDIES = `
[Your case studies content here]
`.trim()

export const maxDuration = 300 // Set max duration to 300 seconds (5 minutes)
export const dynamic = 'force-dynamic' // Disable static optimization

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    }

    // Convert the File object to a Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Parse PDF
    const pdfText = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser()

      pdfParser.on('pdfParser_dataError', (errData: any) => {
        reject(new Error(errData.parserError))
      })

      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        const text = pdfData.Pages
          .map((page: any) => page.Texts
            .map((text: any) => decodeURIComponent(text.R[0].T))
            .join(' ')
          )
          .join('\n')
        resolve(text)
      })

      pdfParser.parseBuffer(buffer)
    })

    if (!pdfText.trim()) {
      return NextResponse.json({ error: 'No text content found in PDF' }, { status: 400 })
    }

    // Fetch case studies from public folder
    const caseStudiesResponse = await fetch(new URL('/case-studies.txt', request.url))
    const caseStudies = await caseStudiesResponse.text()

    // Create OpenAI completion with streaming
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert document reviewer specializing in GCP (Good Clinical Practice) inspections and clinical trial documentation. 
          Analyze the provided document and identify gaps based on the case studies. 
          
          Format your response in markdown with the following sections:
          
          # Key Findings
          - Use markdown bullet points for gaps and non-compliances
          
          # Analysis by Domain
          ## IP Management
          ## Informed Consent
          ## Study Staff & Training
          ## Protocol Compliance
          ## Data Management
          ## Safety Reporting
          (Include only relevant domains)
          
          # Recommendations
          - Use markdown bullet points for actionable steps
          - Include priority levels in bold
          
          Use markdown features like **bold**, *italic*, \`code\`, and > quotes for emphasis.`
        },
        {
          role: "user",
          content: `Document content: ${pdfText}\n\nReference Case Studies:\n${caseStudies}\n\nPlease analyze the document, identify gaps, and provide next steps based on the case studies and GCP requirements.`
        }
      ],
      temperature: 0,
      max_tokens: 4000,
      stream: true
    })

    // Use Web Streams API with error handling
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let hasError = false
          const timeoutId = setTimeout(() => {
            hasError = true
            controller.error(new Error('Stream timeout'))
          }, 240000) // 4 minute safety timeout

          for await (const chunk of completion) {
            if (hasError) break
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              for (const char of content) {
                controller.enqueue(`data: ${JSON.stringify({ content: char })}\n\n`)
              }
            }
          }

          clearTimeout(timeoutId)
          controller.enqueue(`data: ${JSON.stringify({ done: true })}\n\n`)
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      },
    })

    // Set appropriate headers for streaming
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering
      },
    })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Error processing request', 
      details: error.message 
    }, { status: 500 })
  }
}
