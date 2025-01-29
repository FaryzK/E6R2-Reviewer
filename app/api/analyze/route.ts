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

    // Read case studies
    const caseStudies = await fs.readFile(process.cwd() + '/case-studies.txt', 'utf-8')

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert document reviewer specializing in GCP (Good Clinical Practice) inspections and clinical trial documentation. 
          Analyze the provided document and identify gaps based on the case studies. 
          Structure your response in the following format:
          
          1. Key Findings:
          - List major gaps or issues identified
          - Highlight critical non-compliances
          
          2. Analysis by Domain:
          - IP Management
          - Informed Consent
          - Study Staff & Training
          - Protocol Compliance
          - Data Management
          - Safety Reporting
          (Include only relevant domains)
          
          3. Recommendations:
          - Specific, actionable next steps
          - Priority level for each recommendation
          
          Be specific and reference relevant regulations or guidelines where applicable.`
        },
        {
          role: "user",
          content: `Document content: ${pdfText}\n\nReference Case Studies:\n${caseStudies}\n\nPlease analyze the document, identify gaps, and provide next steps based on the case studies and GCP requirements.`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })

    return NextResponse.json({ 
      analysis: completion.choices[0].message.content,
      textLength: pdfText.length
    })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Error processing request', 
      details: error.message 
    }, { status: 500 })
  }
}
