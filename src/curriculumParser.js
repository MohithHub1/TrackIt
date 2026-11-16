
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

export async function extractPdfText(file) {
  if (!file || file.type !== 'application/pdf') {
    throw new Error('Please upload a valid PDF file.')
  }

  const arrayBuffer = await file.arrayBuffer()

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
  }).promise

  let extractedText = ''

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()

    const rows = new Map()

    for (const item of content.items) {
      if (!item.str?.trim()) continue

      const y = Math.round(item.transform[5])

      if (!rows.has(y)) {
        rows.set(y, [])
      }

      rows.get(y).push({
        x: item.transform[4],
        text: item.str.trim(),
      })
    }

    const pageText = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) =>
        items
          .sort((a, b) => a.x - b.x)
          .map(item => item.text)
          .join(' ')
      )
      .join('\n')

    extractedText += pageText + '\n'
  }

  return extractedText
}

export function parseCoursesFromText(text) {
  const lines = text
    .split(/\n/)
    .map(line => line.trim())
    .filter(Boolean)

  const courses = []
  const seenCodes = new Set()

  let mainSection = 'School Core'
  let subsection = 'School Core'

  const headings = [
    [/^A\.\s*School Core/i, 'School Core', 'School Core'],
    [/^B\.\s*Electrical and Electronics/i, 'School Core', 'Electrical and Electronics'],
    [/^C\.\s*Modern Physics/i, 'School Core', 'Modern Physics'],
    [/^D\.\s*English Basket/i, 'School Core', 'English'],
    [/^E\.\s*Foreign Languages/i, 'School Core', 'Foreign Languages'],
    [/^F\.\s*Behavioural Science/i, 'School Core', 'Behavioural Science'],
    [/^G\.\s*Soft Skills/i, 'School Core', 'Soft Skills'],
    [/^H\.?\s*Python Basket/i, 'Python Basket', 'Python'],
    [/^Kannada Basket/i, 'Kannada Basket', 'Kannada'],
    [/^Non-Credit Pass/i, 'Non-Credit Courses', 'Pass / Fail'],
    [/^Program Core/i, 'Program Core', 'Program Core'],
    [/^Common Electives Basket/i, 'Discipline Electives', 'Common Electives'],
    [/^Specialized Electives Baskets/i, 'Discipline Electives', 'Specialized Electives'],
    [/^I\.\s*AI\s*&\s*ML Basket/i, 'Discipline Electives', 'AI & ML'],
    [/^J\.\s*Cyber Security Basket/i, 'Discipline Electives', 'Cyber Security'],
    [/^K\.\s*Data Analytics Basket/i, 'Discipline Electives', 'Data Analytics'],
    [/^L\.\s*IoT Basket/i, 'Discipline Electives', 'IoT'],
    [/^M\.\s*Cloud Computing Basket/i, 'Discipline Electives', 'Cloud Computing'],
    [/^N\.\s*Robotics Basket/i, 'Discipline Electives', 'Robotics'],
    [/^O\.\s*Big Data Basket/i, 'Discipline Electives', 'Big Data'],
    [/^P\.\s*Full Stack Basket/i, 'Discipline Electives', 'Full Stack Development'],
    [/^Q\.\s*DevOps Basket/i, 'Discipline Electives', 'DevOps'],
    [/^Open Elective basket/i, 'Open Electives', 'Open Electives'],
  ]

  for (const line of lines) {
    for (const [pattern, main, sub] of headings) {
      if (pattern.test(line)) {
        mainSection = main
        subsection = sub
        break
      }
    }

    const match = line.match(
      /\b([A-Z]{3}\d{4})\s+(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/
    )

    if (!match) continue

    const [, code, title, theory, practical, credits] = match

    if (seenCodes.has(code)) continue

    seenCodes.add(code)

    courses.push({
      code,
      title: title.trim(),
      theory: Number(theory),
      practical: Number(practical),
      credits: Number(credits),
      mainSection,
      subsection,
      basket: subsection,
      category: 'Courses',
      status: 'Planned',
    })
  }

  return courses
}
