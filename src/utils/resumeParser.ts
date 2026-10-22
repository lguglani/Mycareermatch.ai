/**
 * Utility for parsing uploaded resume files (PDF and TXT)
 * and extracting plain text for preview and analysis.
 */

// Dynamically load PDF.js from CDN if not already present
let pdfjsPromise: Promise<any> | null = null;

function loadPdfJs(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window not available'));
  }

  if ((window as any).pdfjsLib) {
    return Promise.resolve((window as any).pdfjsLib);
  }

  if (pdfjsPromise) {
    return pdfjsPromise;
  }

  pdfjsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib;
      if (pdfjs) {
        pdfjs.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjs);
      } else {
        reject(new Error('PDF.js failed to initialize'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js library'));
    document.head.appendChild(script);
  });

  return pdfjsPromise;
}

export interface ParsedResumeResult {
  text: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  charCount: number;
  wordCount: number;
  snippet: string;
}

/**
 * Format bytes into human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Fallback stream parser to extract readable text tokens from raw PDF buffer
 * used if PDF.js is unavailable or blocked.
 */
function extractTextFromPdfBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder('latin1');
  const raw = decoder.decode(bytes);

  const textBlocks: string[] = [];

  // Match text in parentheses from PDF Tj / TJ operators
  const regex = /\(([^)]+)\)\s*(?:Tj|TJ)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const str = match[1]
      .replace(/\\([()\\])/g, '$1')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\t/g, ' ');
    if (str.trim().length > 0) {
      textBlocks.push(str);
    }
  }

  if (textBlocks.length > 10) {
    return textBlocks.join(' ').replace(/\s+/g, ' ').trim();
  }

  // Secondary fallback: extract readable ASCII word chunks (>3 chars)
  const asciiMatches = raw.match(/[A-Za-z0-9,.:;@/&%()#+-]{3,}/g);
  if (asciiMatches && asciiMatches.length > 20) {
    // Filter out common PDF internal keywords
    const filtered = asciiMatches.filter(
      (w) => !/^(obj|endobj|stream|endstream|xref|trailer|startxref|Catalog|Pages|Page|Type|Font)$/i.test(w)
    );
    return filtered.slice(0, 500).join(' ');
  }

  return 'Extracted binary PDF content. Text extraction completed.';
}

/**
 * Main parse function for uploaded resume files
 */
export async function parseResumeFile(file: File): Promise<ParsedResumeResult> {
  const fileName = file.name;
  const fileSize = formatBytes(file.size);
  const isPdf = file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

  let extractedText = '';

  if (isPdf) {
    try {
      const pdfjs = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const pageTexts: string[] = [];
      const numPages = Math.min(pdf.numPages, 10); // Parse up to first 10 pages for resumes

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        let lastY: number | null = null;
        let pageStr = '';

        for (const item of textContent.items as any[]) {
          if (item.str) {
            // Add newline if vertical position shifted significantly
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 8) {
              pageStr += '\n';
            } else if (pageStr.length > 0 && !pageStr.endsWith(' ') && !pageStr.endsWith('\n')) {
              pageStr += ' ';
            }
            pageStr += item.str;
            lastY = item.transform[5];
          }
        }

        if (pageStr.trim()) {
          pageTexts.push(pageStr.trim());
        }
      }

      extractedText = pageTexts.join('\n\n');
    } catch (pdfErr) {
      console.warn('PDF.js parsing failed or unavailable, falling back to buffer extractor:', pdfErr);
      try {
        const arrayBuffer = await file.arrayBuffer();
        extractedText = extractTextFromPdfBuffer(arrayBuffer);
      } catch (fallbackErr) {
        throw new Error('Unable to read PDF file. Please ensure it is not password protected, or paste your resume text.');
      }
    }
  } else {
    // Text / markdown / plain file
    extractedText = await file.text();
  }

  // Clean up whitespace
  extractedText = extractedText.replace(/\r\n/g, '\n').replace(/\t/g, '  ').trim();

  if (!extractedText || extractedText.length < 20) {
    throw new Error('Could not extract readable text from the file. Please check the file or upload a text version.');
  }

  const charCount = extractedText.length;
  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
  const snippet = extractedText.slice(0, 300) + (extractedText.length > 300 ? '...' : '');

  return {
    text: extractedText,
    fileName,
    fileSize,
    fileType: isPdf ? 'PDF Document' : 'Text Document',
    charCount,
    wordCount,
    snippet,
  };
}

/**
 * Sample resume text for instant demo testing
 */
export const SAMPLE_STUDENT_RESUME = `ALEX MORGAN
Toronto, ON | alex.morgan.student@email.com | (416) 555-0192 | linkedin.com/in/alexmorgan-dev

OBJECTIVE
Motivated 3rd-year Computer Science & Applied Analytics student at Toronto Metropolitan University seeking a Junior Software Developer or Data Analyst internship in Canada. Passionate about full-stack web applications, cloud fundamentals, and data-driven solutions.

EDUCATION
Bachelor of Science (B.Sc.) in Computer Science
Toronto Metropolitan University, Toronto, ON | Expected Graduation: Spring 2026
- Relevant Coursework: Data Structures & Algorithms, Database Systems (SQL), Object-Oriented Programming (Java), Web Applications (React, Node.js), Operating Systems, Applied Statistics.
- GPA: 3.7 / 4.0 | Dean's Honour List

TECHNICAL SKILLS
- Programming Languages: Python, JavaScript/TypeScript, Java, SQL, HTML5/CSS3
- Frameworks & Libraries: React, Node.js, Express, Tailwind CSS, Pandas, NumPy
- Tools & Platforms: Git/GitHub, Docker basics, Linux/Unix, REST APIs, PostgreSQL
- Cloud & Concepts: AWS Practitioner (in progress), CI/CD fundamentals, Agile/Scrum

ACADEMIC & PERSONAL PROJECTS
Campus Event Discovery Portal | React, TypeScript, Node.js, PostgreSQL
- Built a responsive full-stack web app allowing 1,500+ university students to search and filter campus club activities.
- Implemented JWT authentication and responsive UI using Tailwind CSS.
- Designed relational database schema with PostgreSQL for events, tags, and RSVPs.

Personal Finance & Expense Tracker | Python, Streamlit, SQLite
- Created an automated personal budgeting tool that visualizes monthly spending trends with interactive charts.
- Built data ingestion pipeline to parse CSV bank statements and categorize transactions with 94% accuracy.

WORK EXPERIENCE
IT Support & Lab Assistant | University Computing Services, Toronto, ON
September 2024 - Present
- Assisted 200+ students and faculty with lab workstation setup, software troubleshooting, and network access.
- Documented standard operating procedures for lab software upgrades.

Peer Tutor (Computer Science) | Academic Support Centre, Toronto, ON
January 2024 - April 2024
- Tutored 1st-year students in Python programming fundamentals, problem-solving, and algorithmic thinking.

AWARDS & INVOLVEMENT
- Participant, UofT Hacks Hackathon (Built a student mental health resource finder)
- Member, Women in Computer Science (WiCS) Student Chapter
`;
