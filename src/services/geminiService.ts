import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const CANADA_DESIGNATED_SCHOOLS_URL = "https://www.canada.ca/en/services/benefits/education/schools.html";

export interface JobMatch {
  title: string;
  company: string;
  location: string;
  matchScore: number;
  description: string;
  url: string;
  whyMatch: string;
  matchedSkills?: string[];
  source?: string;
  isLinkedInVerified?: boolean;
  linkedInJobId?: string;
  alignedWorkExperience?: string;
  salaryEstimate?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryMidpoint?: number;
  postedDate?: string;
  postedDaysAgo?: number;
  workplaceType?: 'Remote' | 'Hybrid' | 'On-site';
}

export interface SkillGap {
  skill: string;
  importance: "High" | "Medium" | "Low";
  description: string;
}

export interface CourseRecommendation {
  title: string;
  provider: string;
  url: string;
  duration: string;
  skillsCovered: string[];
}

export interface CanadianInstitutionProgram {
  institutionName: string;
  province: string;
  programName: string;
  credentialType: string;
  url: string;
  canadaCaDirectoryUrl?: string;
  isDesignatedInstitution: boolean;
  financialAidEligible: boolean;
  financialAidDetails?: string;
  skillsCovered: string[];
  relevanceToTargetRole: string;
}

export interface CareerAnalysis {
  summary: string;
  matchedJobs: JobMatch[];
  skillGaps: SkillGap[];
  recommendedCourses: CourseRecommendation[];
  canadianUpskilling: CanadianInstitutionProgram[];
}

export interface LinkedInWorkExperience {
  title: string;
  company: string;
  duration?: string;
  description?: string;
}

export interface LinkedInEducation {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  dates?: string;
}

export interface LinkedInProfileData {
  fullName: string;
  headline?: string;
  location?: string;
  summary?: string;
  workHistory: LinkedInWorkExperience[];
  education: LinkedInEducation[];
  skills: string[];
  rawText: string;
}

export const SAMPLE_LINKEDIN_PROFILE: LinkedInProfileData = {
  fullName: "Marcus Vance",
  headline: "Software Engineering Student @ University of Waterloo | Ex-Fullstack Intern @ Shopify",
  location: "Waterloo, ON, Canada",
  summary: "Final-year Honours Computer Science co-op student at University of Waterloo with software engineering internship experience. Passionate about distributed systems, backend engineering (Go, TypeScript, Python), and cloud architecture (AWS, Docker, Kubernetes). Actively seeking full-time new grad software engineering roles.",
  workHistory: [
    {
      title: "Software Engineering Intern",
      company: "Shopify",
      duration: "May 2024 - August 2024 (4 mos)",
      description: "Built high-throughput payment webhook processing service handling 12,000 requests/sec with Go and Kafka. Reduced average p99 latency by 28% through Redis caching and optimized database connection pooling."
    },
    {
      title: "Full Stack Developer Co-op",
      company: "PointClickCare",
      duration: "Sept 2023 - Dec 2023 (4 mos)",
      description: "Developed patient dashboard modules using React, TypeScript, and Spring Boot REST APIs. Automated regression test suites using Cypress and Jest, improving sprint test coverage from 68% to 92%."
    },
    {
      title: "Undergraduate Teaching Assistant",
      company: "University of Waterloo",
      duration: "Jan 2023 - April 2023 (4 mos)",
      description: "Conducted weekly lab tutorials for 75+ students in CS 136 (Elementary Algorithm Design and Data Abstraction in C/C++)."
    }
  ],
  education: [
    {
      institution: "University of Waterloo",
      degree: "Bachelor of Computer Science (B.C.S.), Honours Co-op",
      fieldOfStudy: "Computer Science",
      dates: "2021 - 2025"
    }
  ],
  skills: [
    "Go (Golang)",
    "TypeScript",
    "Python",
    "React",
    "PostgreSQL",
    "Docker",
    "Kubernetes",
    "AWS",
    "Kafka",
    "Distributed Systems",
    "REST APIs",
    "Git"
  ],
  rawText: `Marcus Vance
Waterloo, ON, Canada
Headline: Software Engineering Student @ University of Waterloo | Ex-Fullstack Intern @ Shopify

About:
Final-year Honours Computer Science co-op student at University of Waterloo with software engineering internship experience. Passionate about distributed systems, backend engineering (Go, TypeScript, Python), and cloud architecture (AWS, Docker, Kubernetes). Actively seeking full-time new grad software engineering roles.

Work Experience:
- Software Engineering Intern at Shopify (May 2024 - August 2024): Built high-throughput payment webhook processing service handling 12,000 requests/sec with Go and Kafka; reduced p99 latency by 28%.
- Full Stack Developer Co-op at PointClickCare (Sept 2023 - Dec 2023): Developed patient dashboard modules using React, TypeScript, and Spring Boot REST APIs; automated Cypress and Jest test suites.
- Undergraduate Teaching Assistant at University of Waterloo (Jan 2023 - April 2023): Conducted weekly lab tutorials for 75+ students in CS 136 in C/C++.

Education:
- University of Waterloo: Bachelor of Computer Science (B.C.S.), Honours Co-op (2021 - 2025)

Skills:
Go (Golang), TypeScript, Python, React, PostgreSQL, Docker, Kubernetes, AWS, Kafka, Distributed Systems, REST APIs, Git`
};

/**
 * Scrapes and extracts public professional profile data from a LinkedIn profile URL
 */
export async function fetchLinkedInProfile(url: string): Promise<LinkedInProfileData> {
  const cleanUrl = url.trim();

  // 1. Try Express backend scraper route
  try {
    const backendResponse = await fetch('/api/fetch-linkedin-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl }),
    });

    if (backendResponse.ok) {
      const data = await backendResponse.json();
      if (data && data.fullName) {
        return data as LinkedInProfileData;
      }
    } else {
      console.warn('Backend /api/fetch-linkedin-profile non-200, trying client-side extraction fallback...');
    }
  } catch (err) {
    console.warn('Backend endpoint unreachable, running client-side LinkedIn retrieval fallback:', err);
  }

  // 2. Client-side fallback via Gemini with Google Search tool
  const prompt = `
    You are an automated web scraper and profile retrieval agent.
    Your task is to fetch and extract the public professional background of the user from this LinkedIn profile URL:
    "${cleanUrl}"

    CRITICAL SCRAPING & EXTRACTION INSTRUCTIONS:
    1. Use the Google Search tool to search for and retrieve indexed information from this specific LinkedIn profile: "${cleanUrl}".
    2. Extract:
       - Full Name
       - Professional Headline / Current Role
       - Location
       - Summary / About Section
       - Work Experience / History: Extract every role with job title, company name, duration, and key accomplishments.
       - Education History: Institutions attended, degree/diploma earned, field of study, and dates.
       - Skills: List of technical, programming, domain, and soft skills listed on their profile.
    3. Construct a clean, comprehensive "rawText" representation of this profile that reads like a structured resume.
    4. If the profile is restricted or has limited public information, extract all publicly indexed snippets and information available on the web for this person's profile, and provide a helpful, accurate summary.

    Return the extracted data strictly formatted as JSON according to the schema.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction:
        'You are an expert LinkedIn profile scraper and parser. You use Google Search to fetch real, public professional profiles from LinkedIn and extract structured work history, skills, and education.',
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fullName: { type: Type.STRING },
          headline: { type: Type.STRING },
          location: { type: Type.STRING },
          summary: { type: Type.STRING },
          workHistory: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                company: { type: Type.STRING },
                duration: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ['title', 'company'],
            },
          },
          education: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                institution: { type: Type.STRING },
                degree: { type: Type.STRING },
                fieldOfStudy: { type: Type.STRING },
                dates: { type: Type.STRING },
              },
              required: ['institution'],
            },
          },
          skills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          rawText: { type: Type.STRING },
        },
        required: ['fullName', 'workHistory', 'education', 'skills', 'rawText'],
      },
    },
  });

  try {
    return JSON.parse(response.text || '{}') as LinkedInProfileData;
  } catch (e) {
    console.error('Failed to parse LinkedIn profile extraction response', e);
    throw new Error('Failed to extract data from this LinkedIn profile. Please ensure the profile is public or upload your resume.');
  }
}

export interface AnalyzeCareerInput {
  resumeText?: string;
  linkedinUrl?: string;
  linkedInProfile?: LinkedInProfileData | null;
}

/**
 * Queries the LinkedIn API endpoint specifically for active job listings
 * aligned with extracted work history and profile skills.
 */
export async function queryLinkedInJobs(params: {
  keywords?: string;
  location?: string;
  skills?: string[];
  workHistory?: LinkedInWorkExperience[];
  headline?: string;
}): Promise<JobMatch[]> {
  try {
    const res = await fetch('/api/linkedin/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.jobs)) {
        return data.jobs as JobMatch[];
      }
    }
  } catch (err) {
    console.warn('Backend /api/linkedin/jobs error:', err);
  }
  return [];
}

export async function analyzeCareer(input: AnalyzeCareerInput): Promise<CareerAnalysis> {
  // First, attempt to call the Express backend proxy endpoint (/api/analyze)
  try {
    const backendResponse = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeText: input.resumeText,
        linkedinUrl: input.linkedinUrl,
        linkedInProfile: input.linkedInProfile,
      }),
    });

    if (backendResponse.ok) {
      const data = await backendResponse.json();
      if (data && data.matchedJobs && Array.isArray(data.matchedJobs)) {
        return data as CareerAnalysis;
      }
    } else {
      console.warn('Backend /api/analyze returned non-200, attempting client-side fallback...');
    }
  } catch (err) {
    console.warn('Backend endpoint unreachable, running client-side analysis fallback:', err);
  }

  // Fallback: Direct Gemini SDK generation with Google Search grounding and Canada.ca integration
  const profileSkills = input.linkedInProfile?.skills || [];
  const profileWorkHistory = input.linkedInProfile?.workHistory || [];
  const effectiveText = input.linkedInProfile?.rawText || input.resumeText || `LinkedIn Profile: ${input.linkedinUrl}`;

  const prompt = `
    You are a high-end career strategy engine and educational advisor with deep expertise in the Canadian and international job market and higher education landscape.
    Your task is to perform an analysis of a student's profile, match them with verified real-world jobs on LinkedIn, identify skill gaps, and recommend both micro-courses (Coursera) AND formal Canadian post-secondary upskilling programs grounded in the Government of Canada's Designated Educational Institutions framework (${CANADA_DESIGNATED_SCHOOLS_URL}).

    USER PROFILE INPUT:
    ${effectiveText}

    ${profileSkills.length > 0 ? `EXTRACTED SKILLS: ${profileSkills.join(', ')}` : ''}
    ${profileWorkHistory.length > 0 ? `EXTRACTED WORK HISTORY: ${JSON.stringify(profileWorkHistory)}` : ''}

    EXECUTION STEPS (MANDATORY):
    1. PROFILE EXTRACTION & WORK HISTORY ALIGNMENT: 
       - Analyze candidate's extracted roles, companies, internships, and technical skills.
       - Query and find real LinkedIn job postings specifically aligned with their previous roles and skills.
       - Query pattern: "site:linkedin.com/jobs/view [Job Title]" with Canada location.
       - CRITICAL: You MUST ONLY provide "Deep Links" (direct URLs to specific job postings: https://www.linkedin.com/jobs/view/...).
       - Include "matchedSkills", "source" ("LinkedIn Jobs API"), and "isLinkedInVerified" (true).
       - In "whyMatch", detail how the job directly builds upon their past work experience and verifies their profile skills.

    2. SKILL GAP ANALYSIS:
       - Compare the user's current skills against the requirements of the found jobs.
       - Identify specific, high-impact skills they are missing.

    3. RAPID UPSKILLING PATHWAY (COURSERA):
       - Search for REAL, CURRENT Coursera courses that specifically address the identified skill gaps.
       - Provide the exact course title, the university/company providing it, and the direct Coursera URL found in search results.

    4. CANADIAN DESIGNATED INSTITUTIONS & FUTURE UPSKILLING (CANADA.CA):
       - Reference the official Government of Canada Designated Educational Institutions guide and Master List at ${CANADA_DESIGNATED_SCHOOLS_URL}.
       - Recommend 3 to 5 real, prestigious Canadian post-secondary institutions (colleges, polytechnics, or universities across Canadian provinces like Seneca Polytechnic, University of Toronto, BCIT, Humber Polytechnic, George Brown College, University of Waterloo, McGill, SAIT).
       - Suggest specific programs (e.g., Post-Graduate Certificate, Applied Diploma, Professional Master's, Advanced Graduate Diploma) eligible under Canada Student Grants and Loans (CSL) or provincial student financial assistance.

    OUTPUT REQUIREMENTS:
    - Return a JSON object following the schema.
    - Every "url" provided MUST be a real, functioning DEEP LINK.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: `You are a precise career analyst and Canadian education specialist. You use Google Search to verify every piece of information. You NEVER provide fake jobs, fake courses, or fake institutions. CRITICAL: For jobs, you must only provide DEEP LINKS to specific LinkedIn job postings (site:linkedin.com/jobs/view). For Canadian upskilling, recommend accredited Canadian institutions listed under the Government of Canada's Designated Educational Institutions database (${CANADA_DESIGNATED_SCHOOLS_URL}), highlighting Canada Student Financial Assistance eligibility.`,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          matchedJobs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                company: { type: Type.STRING },
                location: { type: Type.STRING },
                matchScore: { type: Type.NUMBER },
                description: { type: Type.STRING },
                url: { type: Type.STRING },
                whyMatch: { type: Type.STRING },
                matchedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                source: { type: Type.STRING },
                isLinkedInVerified: { type: Type.BOOLEAN },
                linkedInJobId: { type: Type.STRING },
                salaryEstimate: { type: Type.STRING },
                postedDate: { type: Type.STRING },
                workplaceType: { type: Type.STRING, enum: ["Remote", "Hybrid", "On-site"] },
              },
              required: ["title", "company", "matchScore", "url"],
            },
          },
          skillGaps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                skill: { type: Type.STRING },
                importance: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                description: { type: Type.STRING },
              },
              required: ["skill", "importance"],
            },
          },
          recommendedCourses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                provider: { type: Type.STRING },
                url: { type: Type.STRING },
                duration: { type: Type.STRING },
                skillsCovered: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["title", "provider", "url"],
            },
          },
          canadianUpskilling: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                institutionName: { type: Type.STRING },
                province: { type: Type.STRING },
                programName: { type: Type.STRING },
                credentialType: { type: Type.STRING },
                url: { type: Type.STRING },
                canadaCaDirectoryUrl: { type: Type.STRING },
                isDesignatedInstitution: { type: Type.BOOLEAN },
                financialAidEligible: { type: Type.BOOLEAN },
                financialAidDetails: { type: Type.STRING },
                skillsCovered: { type: Type.ARRAY, items: { type: Type.STRING } },
                relevanceToTargetRole: { type: Type.STRING },
              },
              required: [
                "institutionName",
                "province",
                "programName",
                "credentialType",
                "url",
                "isDesignatedInstitution",
                "financialAidEligible",
              ],
            },
          },
        },
        required: ["summary", "matchedJobs", "skillGaps", "recommendedCourses", "canadianUpskilling"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}") as CareerAnalysis;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to analyze career path. Please try again.");
  }
}
