import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Link as LinkIcon, 
  Search, 
  Briefcase, 
  GraduationCap, 
  Target, 
  ChevronRight, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  School,
  MapPin,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Info,
  X,
  Award,
  Building2,
  FileText,
  Eye,
  Edit3,
  Copy,
  Check,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Printer,
  User,
  Globe,
  RefreshCw,
  BadgeCheck,
  Download,
  SlidersHorizontal,
  ArrowUpDown,
  DollarSign,
  Clock,
  Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  analyzeCareer, 
  CANADA_DESIGNATED_SCHOOLS_URL, 
  type CareerAnalysis, 
  type JobMatch, 
  type SkillGap, 
  type CourseRecommendation,
  type CanadianInstitutionProgram,
  fetchLinkedInProfile,
  SAMPLE_LINKEDIN_PROFILE,
  type LinkedInProfileData,
  queryLinkedInJobs
} from './services/geminiService';
import { 
  parseResumeFile, 
  SAMPLE_STUDENT_RESUME, 
  type ParsedResumeResult 
} from './utils/resumeParser';
import { exportReportToPdf } from './utils/pdfExport';
import {
  type JobSortOption,
  type WorkplaceFilterOption,
  normalizeJobMatch,
  filterAndSortJobs
} from './utils/jobFilters';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to detect common resume sections for quick verification
function getDetectedSections(text: string): string[] {
  const sections: string[] = [];
  const lower = text.toLowerCase();
  if (lower.includes('education') || lower.includes('degree') || lower.includes('university') || lower.includes('college')) {
    sections.push('Education');
  }
  if (lower.includes('skill') || lower.includes('technical') || lower.includes('technologies') || lower.includes('programming')) {
    sections.push('Technical Skills');
  }
  if (lower.includes('experience') || lower.includes('employment') || lower.includes('work') || lower.includes('internship')) {
    sections.push('Experience');
  }
  if (lower.includes('project') || lower.includes('portfolio') || lower.includes('capstone')) {
    sections.push('Projects');
  }
  if (lower.includes('award') || lower.includes('certif') || lower.includes('honour') || lower.includes('honor')) {
    sections.push('Certifications & Awards');
  }
  return sections;
}

interface LinkedInVerificationBadgeProps {
  type: 'profile' | 'job';
  profileData?: LinkedInProfileData | null;
  jobData?: JobMatch;
  url?: string;
  className?: string;
}

function LinkedInVerificationBadge({
  type,
  profileData,
  jobData,
  url,
  className
}: LinkedInVerificationBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  const isProfile = type === 'profile';
  const isRightAligned = !isProfile;

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex items-center gap-1.5 group/tooltip", className)}
    >
      {/* The 'LinkedIn Verified' Badge */}
      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#0A66C2] bg-blue-50/90 px-2 py-0.5 rounded-full border border-blue-200/90 print:text-[9px] print:border-zinc-300 shadow-2xs select-none">
        <span className="w-3.5 h-3.5 rounded-xs bg-[#0A66C2] text-white flex items-center justify-center text-[9px] font-black shrink-0">
          in
        </span>
        <span>LinkedIn Verified</span>
      </span>

      {/* Visual Indicator / Tooltip Trigger */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-label="Verification status details: Validated via LinkedIn API"
        title="Verification details: Validated via LinkedIn API"
        className={cn(
          "inline-flex items-center justify-center w-4.5 h-4.5 rounded-full transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/40 print:hidden",
          isOpen
            ? "bg-[#0A66C2] text-white shadow-xs scale-105"
            : "bg-blue-100/70 hover:bg-blue-200/80 text-[#0A66C2] hover:text-[#004182]"
        )}
      >
        <Info className="w-2.5 h-2.5 stroke-[2.5]" />
      </button>

      {/* Tooltip Card (Interactive on click or hover) */}
      <div
        role="tooltip"
        className={cn(
          "absolute top-full mt-2 z-50 w-72 sm:w-80 p-3.5 bg-white/95 backdrop-blur-md text-zinc-800 rounded-xl shadow-xl border border-blue-200/90 transition-all duration-200 text-left print:hidden",
          isRightAligned ? "right-0 left-auto" : "left-0 sm:left-0",
          isOpen
            ? "opacity-100 visible pointer-events-auto scale-100"
            : "opacity-0 invisible pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:visible group-hover/tooltip:pointer-events-auto scale-95 group-hover/tooltip:scale-100"
        )}
      >
        {/* Pointer Arrow */}
        <div
          className={cn(
            "absolute -top-1.5 w-3 h-3 bg-white border-t border-l border-blue-200/90 rotate-45",
            isRightAligned ? "right-5" : "left-6"
          )}
        />

        {/* Tooltip Header */}
        <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-zinc-100 relative">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-[#0A66C2] text-white flex items-center justify-center text-[10px] font-black shrink-0">
              in
            </span>
            <div>
              <div className="font-bold text-xs text-zinc-900 flex items-center gap-1">
                <span>Validated via LinkedIn API</span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              </div>
              <p className="text-[10px] text-zinc-500 font-medium">Verified Live Integration</p>
            </div>
          </div>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
            Active
          </span>
        </div>

        {/* Explanation text */}
        <p className="text-xs text-zinc-600 leading-relaxed mb-2.5">
          {isProfile
            ? "Validated via LinkedIn API: Candidate profile data, employment chronology, and skills were verified directly from public LinkedIn member records to power accurate Canadian career analysis."
            : "Validated via LinkedIn API: Live job listing queried directly from LinkedIn Jobs API, cross-referenced with your verified profile work history and matched skills."}
        </p>

        {/* Verification Metadata Box */}
        <div className="bg-blue-50/60 rounded-lg p-2.5 space-y-1.5 border border-blue-100/80 text-[11px]">
          <div className="flex items-center justify-between text-zinc-600">
            <span className="text-zinc-500 font-medium">Verification Protocol:</span>
            <span className="font-semibold text-zinc-800">LinkedIn REST API</span>
          </div>

          {isProfile && profileData && (
            <>
              <div className="flex items-center justify-between text-zinc-600">
                <span className="text-zinc-500 font-medium">Verified Records:</span>
                <span className="font-semibold text-zinc-800">
                  {profileData.workHistory?.length || 0} Roles • {profileData.skills?.length || 0} Skills
                </span>
              </div>
              {profileData.location && (
                <div className="flex items-center justify-between text-zinc-600">
                  <span className="text-zinc-500 font-medium">Profile Location:</span>
                  <span className="font-semibold text-zinc-800 truncate max-w-[130px]">
                    {profileData.location}
                  </span>
                </div>
              )}
            </>
          )}

          {!isProfile && jobData && (
            <>
              {jobData.alignedWorkExperience && (
                <div className="flex items-center justify-between text-zinc-600">
                  <span className="text-zinc-500 font-medium">Aligned Role:</span>
                  <span className="font-semibold text-zinc-800 truncate max-w-[130px]">
                    {jobData.alignedWorkExperience}
                  </span>
                </div>
              )}
              {jobData.matchedSkills && jobData.matchedSkills.length > 0 && (
                <div className="flex items-center justify-between text-zinc-600">
                  <span className="text-zinc-500 font-medium">Aligned Skills:</span>
                  <span className="font-semibold text-indigo-700">
                    {jobData.matchedSkills.length} Verified Skills
                  </span>
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between text-zinc-600 pt-1 border-t border-blue-200/50">
            <span className="text-zinc-500 font-medium">Validation Status:</span>
            <span className="font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verified & Synchronized
            </span>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
          <span>Hover or tap icon to inspect</span>
          <span className="font-mono text-zinc-400">API-LI-VERIFIED</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [inputMode, setInputMode] = useState<'resume' | 'linkedin'>('resume');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [linkedInProfile, setLinkedInProfile] = useState<LinkedInProfileData | null>(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [fetchProfileError, setFetchProfileError] = useState<string | null>(null);
  const [isEditingLinkedIn, setIsEditingLinkedIn] = useState(false);
  const [isLinkedInSnippetExpanded, setIsLinkedInSnippetExpanded] = useState(false);
  const [copiedLinkedIn, setCopiedLinkedIn] = useState(false);

  const [resumeText, setResumeText] = useState('');
  const [fileInfo, setFileInfo] = useState<ParsedResumeResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isEditingResume, setIsEditingResume] = useState(false);
  const [isSnippetExpanded, setIsSnippetExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isRefreshingLinkedInJobs, setIsRefreshingLinkedInJobs] = useState(false);

  // PDF Export State
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExportStatus, setPdfExportStatus] = useState<string | null>(null);
  const [pdfExportError, setPdfExportError] = useState<string | null>(null);
  const [pdfExportSuccess, setPdfExportSuccess] = useState(false);

  // Job Filtering & Sorting State (Dynamic client-side without page refresh)
  const [jobSortBy, setJobSortBy] = useState<JobSortOption>('match-desc');
  const [jobWorkplaceFilter, setJobWorkplaceFilter] = useState<WorkplaceFilterOption>('all');
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobMinSalary, setJobMinSalary] = useState<number>(0);

  // Normalize jobs with consistent salary estimates, dates, and workplace types
  const normalizedMatchedJobs = useMemo(() => {
    if (!analysis?.matchedJobs) return [];
    return analysis.matchedJobs.map((job, idx) => normalizeJobMatch(job, idx));
  }, [analysis?.matchedJobs]);

  // Dynamically filter and sort jobs client-side
  const filteredJobs = useMemo(() => {
    return filterAndSortJobs(normalizedMatchedJobs, {
      sortBy: jobSortBy,
      workplace: jobWorkplaceFilter,
      searchQuery: jobSearchQuery,
      minSalary: jobMinSalary,
    });
  }, [normalizedMatchedJobs, jobSortBy, jobWorkplaceFilter, jobSearchQuery, jobMinSalary]);

  // Workplace counts for filter tabs
  const workplaceCounts = useMemo(() => {
    const counts = { all: normalizedMatchedJobs.length, Remote: 0, Hybrid: 0, 'On-site': 0 };
    for (const j of normalizedMatchedJobs) {
      if (j.workplaceType === 'Remote') counts.Remote++;
      else if (j.workplaceType === 'Hybrid') counts.Hybrid++;
      else if (j.workplaceType === 'On-site') counts['On-site']++;
    }
    return counts;
  }, [normalizedMatchedJobs]);

  const isAnyFilterActive =
    jobSortBy !== 'match-desc' ||
    jobWorkplaceFilter !== 'all' ||
    jobSearchQuery.trim().length > 0 ||
    jobMinSalary > 0;

  const handleResetJobFilters = () => {
    setJobSortBy('match-desc');
    setJobWorkplaceFilter('all');
    setJobSearchQuery('');
    setJobMinSalary(0);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setIsParsing(true);
      setParseError(null);
      setError(null);
      try {
        const result = await parseResumeFile(file);
        setResumeText(result.text);
        setFileInfo(result);
        setIsEditingResume(false);
        setIsSnippetExpanded(false);
      } catch (err: any) {
        setParseError(err.message || 'Failed to parse resume file.');
      } finally {
        setIsParsing(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.txt', '.md'], 'application/pdf': ['.pdf'] },
    multiple: false
  } as any);

  const handleLoadSampleResume = () => {
    const text = SAMPLE_STUDENT_RESUME;
    const words = text.split(/\s+/).filter(Boolean).length;
    setResumeText(text);
    setFileInfo({
      text,
      fileName: 'Sample_Student_Resume.txt',
      fileSize: '2.8 KB',
      fileType: 'Sample Student Resume',
      charCount: text.length,
      wordCount: words,
      snippet: text.slice(0, 300) + '...',
    });
    setParseError(null);
    setIsEditingResume(false);
    setIsSnippetExpanded(false);
  };

  const handleClearResume = () => {
    setResumeText('');
    setFileInfo(null);
    setParseError(null);
    setIsEditingResume(false);
    setIsSnippetExpanded(false);
  };

  const handleCopyResumeText = () => {
    if (!resumeText) return;
    navigator.clipboard.writeText(resumeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResumeTextChange = (newText: string) => {
    setResumeText(newText);
    if (fileInfo) {
      setFileInfo({
        ...fileInfo,
        text: newText,
        charCount: newText.length,
        wordCount: newText.split(/\s+/).filter(Boolean).length,
        snippet: newText.slice(0, 300) + (newText.length > 300 ? '...' : ''),
      });
    }
  };

  // LinkedIn Scraping & Profile Retrieval Handlers
  const handleFetchLinkedInProfile = async (targetUrl?: string) => {
    const urlToUse = (targetUrl !== undefined ? targetUrl : linkedinUrl).trim();
    if (!urlToUse) {
      setFetchProfileError('Please enter a valid LinkedIn profile URL (e.g. https://linkedin.com/in/username).');
      return;
    }
    setIsFetchingProfile(true);
    setFetchProfileError(null);
    setError(null);
    try {
      const data = await fetchLinkedInProfile(urlToUse);
      setLinkedInProfile(data);
      setIsEditingLinkedIn(false);
      setIsLinkedInSnippetExpanded(false);
    } catch (err: any) {
      setFetchProfileError(
        err.message || 'Unable to fetch public LinkedIn profile data. Try our sample profile or check the URL.'
      );
    } finally {
      setIsFetchingProfile(false);
    }
  };

  const handleLoadSampleLinkedIn = () => {
    const sampleUrl = 'https://linkedin.com/in/marcus-vance-cs';
    setLinkedinUrl(sampleUrl);
    setLinkedInProfile(SAMPLE_LINKEDIN_PROFILE);
    setFetchProfileError(null);
    setIsEditingLinkedIn(false);
    setIsLinkedInSnippetExpanded(false);
  };

  const handleClearLinkedIn = () => {
    setLinkedinUrl('');
    setLinkedInProfile(null);
    setFetchProfileError(null);
    setIsEditingLinkedIn(false);
    setIsLinkedInSnippetExpanded(false);
  };

  const handleCopyLinkedInText = () => {
    if (!linkedInProfile?.rawText) return;
    navigator.clipboard.writeText(linkedInProfile.rawText);
    setCopiedLinkedIn(true);
    setTimeout(() => setCopiedLinkedIn(false), 2000);
  };

  const handleLinkedInTextChange = (newText: string) => {
    if (!linkedInProfile) return;
    setLinkedInProfile({
      ...linkedInProfile,
      rawText: newText,
    });
  };

  const handleAnalyze = async () => {
    if (inputMode === 'linkedin' && !linkedinUrl && !linkedInProfile) return;
    if (inputMode === 'resume' && !resumeText) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      let effectiveResumeText = inputMode === 'resume' ? resumeText : undefined;
      let effectiveLinkedInUrl = inputMode === 'linkedin' ? linkedinUrl : undefined;

      // When in LinkedIn mode, pass extracted structured profile as resumeText
      if (inputMode === 'linkedin') {
        if (linkedInProfile) {
          effectiveResumeText = linkedInProfile.rawText;
        } else if (linkedinUrl) {
          // Auto-fetch profile if user clicked Analyze directly with URL
          try {
            const profile = await fetchLinkedInProfile(linkedinUrl);
            setLinkedInProfile(profile);
            effectiveResumeText = profile.rawText;
          } catch (fetchErr) {
            console.warn('Profile scraper fell back to standard LinkedIn analysis', fetchErr);
          }
        }
      }

      const result = await analyzeCareer({
        resumeText: effectiveResumeText,
        linkedinUrl: effectiveLinkedInUrl,
        linkedInProfile: linkedInProfile || undefined,
      });
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Something went wrong during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRefreshLinkedInJobs = async () => {
    if (!analysis) return;
    setIsRefreshingLinkedInJobs(true);
    try {
      const topRole = linkedInProfile?.workHistory?.[0]?.title || linkedInProfile?.headline || 'Software Engineer';
      const skills = linkedInProfile?.skills || [];
      const newJobs = await queryLinkedInJobs({
        workHistory: linkedInProfile?.workHistory || [],
        skills,
        headline: linkedInProfile?.headline,
        location: linkedInProfile?.location || 'Canada',
        keywords: `${topRole} ${skills.slice(0, 2).join(' ')}`.trim(),
      });
      if (newJobs && newJobs.length > 0) {
        setAnalysis({
          ...analysis,
          matchedJobs: newJobs,
        });
      }
    } catch (err) {
      console.warn('Failed to refresh LinkedIn jobs:', err);
    } finally {
      setIsRefreshingLinkedInJobs(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (!analysis) return;
    setIsExportingPdf(true);
    setPdfExportError(null);
    setPdfExportSuccess(false);

    try {
      // Derive clean, personalized filename
      let candidateName = 'Candidate';
      if (fileInfo?.fileName) {
        candidateName = fileInfo.fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      } else if (linkedInProfile?.fullName) {
        candidateName = linkedInProfile.fullName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `CareerMatch_AI_Report_${candidateName}_${dateStr}.pdf`;

      await exportReportToPdf('printable-career-report', {
        fileName,
        candidateName,
        onProgress: (status) => setPdfExportStatus(status),
      });

      setPdfExportSuccess(true);
      setTimeout(() => setPdfExportSuccess(false), 3500);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setPdfExportError(err.message || 'Unable to generate PDF directly. You can use the "Print Report" option to save as PDF via your browser.');
    } finally {
      setIsExportingPdf(false);
      setPdfExportStatus(null);
    }
  };

  const detectedSections = resumeText ? getDetectedSections(resumeText) : [];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between print:bg-white print:min-h-0">
      {/* Header (Hidden when printing report) */}
      <header className="sticky top-0 z-40 glass border-b border-zinc-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <Target className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-zinc-900">CareerMatch AI</span>
            <span className="hidden sm:inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
              🇨🇦 Canada.ca Integrated
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
            <button 
              onClick={() => setIsResourcesOpen(true)}
              className="hover:text-indigo-600 transition-colors cursor-pointer font-medium"
            >
              Resources
            </button>
            <a 
              href={CANADA_DESIGNATED_SCHOOLS_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
            >
              <span>Canada.ca Directory</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </a>
            <button className="bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors shadow-sm">
              Sign In
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 flex-1 w-full print:p-0 print:m-0 print:max-w-none">
        {!analysis ? (
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
                <Sparkles className="w-4 h-4" />
                Live Job Search + Coursera & Government of Canada Educational Upskilling
              </div>

              <h1 className="text-5xl font-bold tracking-tight text-zinc-900 mb-6 leading-tight">
                Bridge the gap between your <span className="text-indigo-600">skills</span>, your <span className="text-indigo-600">dream job</span>, and <span className="text-red-600">Canadian education</span>.
              </h1>
              <p className="text-xl text-zinc-600 mb-8 leading-relaxed">
                Upload your resume or link your LinkedIn profile to uncover matched job opportunities, online micro-courses, and accredited Canadian Designated Educational Institutions.
              </p>

              {/* Canadian Education Spotlight Callout */}
              <div className="mb-8 p-3.5 bg-red-50/80 border border-red-200/80 rounded-2xl flex items-center justify-center gap-2.5 shadow-xs text-sm font-semibold text-zinc-800">
                <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0 text-red-700">
                  <School className="w-4 h-4" />
                </div>
                <span>Grounded in official Government of Canada framework.</span>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-xl border border-zinc-200 text-left">
                {/* Switch between Resume and LinkedIn */}
                <div className="flex p-1 bg-zinc-100 rounded-xl mb-6 w-fit mx-auto">
                  <button
                    onClick={() => setInputMode('resume')}
                    className={cn(
                      "px-6 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                      inputMode === 'resume' ? "bg-white shadow-sm text-indigo-600 font-semibold" : "text-zinc-500 hover:text-zinc-700"
                    )}
                  >
                    Resume Upload
                  </button>
                  <button
                    onClick={() => setInputMode('linkedin')}
                    className={cn(
                      "px-6 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                      inputMode === 'linkedin' ? "bg-white shadow-sm text-indigo-600 font-semibold" : "text-zinc-500 hover:text-zinc-700"
                    )}
                  >
                    LinkedIn Profile
                  </button>
                </div>

                {inputMode === 'resume' ? (
                  <div className="space-y-4">
                    {/* Parsing Loading State */}
                    {isParsing && (
                      <div className="p-8 border-2 border-indigo-200 rounded-2xl bg-indigo-50/50 flex flex-col items-center justify-center gap-3 text-center animate-pulse">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        <div>
                          <p className="font-semibold text-zinc-900 text-sm">Parsing Resume Document...</p>
                          <p className="text-xs text-zinc-500 mt-0.5">Extracting text content, skills, and education history</p>
                        </div>
                      </div>
                    )}

                    {/* Parse Error Alert */}
                    {parseError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-xs">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                          <span>{parseError}</span>
                        </div>
                        <button
                          onClick={() => setParseError(null)}
                          className="text-zinc-400 hover:text-zinc-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Dropzone (shown when no resume is uploaded or as a compact re-upload trigger) */}
                    {!resumeText && !isParsing && (
                      <div
                        {...getRootProps()}
                        className={cn(
                          "border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer text-center",
                          isDragActive ? "border-indigo-500 bg-indigo-50" : "border-zinc-200 hover:border-indigo-400 hover:bg-zinc-50/50"
                        )}
                      >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center shadow-xs">
                            <Upload className="text-indigo-600 w-7 h-7" />
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 text-base">
                              Click to upload or drag & drop your resume
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              Supports PDF and TXT formats (Max 5MB)
                            </p>
                          </div>
                          
                          {/* Quick Demo Action */}
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLoadSampleResume();
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Try with Sample Student Resume</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Resume Preview Pane (shown when resume content has been uploaded / parsed) */}
                    {resumeText && !isParsing && (
                      <div className="border border-zinc-200 rounded-2xl bg-zinc-50/50 overflow-hidden shadow-xs transition-all">
                        {/* Preview Header Bar */}
                        <div className="bg-white px-5 py-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-zinc-900 truncate max-w-xs">
                                  {fileInfo?.fileName || 'Uploaded Resume'}
                                </h3>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Parsed
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-0.5">
                                {fileInfo?.fileSize || 'Text'} • {fileInfo?.wordCount || resumeText.split(/\s+/).filter(Boolean).length} words • {resumeText.length.toLocaleString()} characters
                              </p>
                            </div>
                          </div>

                          {/* Toolbar Actions */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            {/* Toggle Edit Mode */}
                            <button
                              type="button"
                              onClick={() => setIsEditingResume(!isEditingResume)}
                              className={cn(
                                "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                                isEditingResume 
                                  ? "bg-indigo-600 text-white" 
                                  : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                              )}
                              title={isEditingResume ? "Switch to preview view" : "Edit parsed text before analysis"}
                            >
                              {isEditingResume ? (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Preview</span>
                                </>
                              ) : (
                                <>
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit Text</span>
                                </>
                              )}
                            </button>

                            {/* Copy Text */}
                            <button
                              type="button"
                              onClick={handleCopyResumeText}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                              title="Copy extracted text to clipboard"
                            >
                              {copied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-600 font-semibold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-zinc-500" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            {/* Clear / Replace File */}
                            <button
                              type="button"
                              onClick={handleClearResume}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-zinc-200 text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                              title="Remove file and upload another"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Change File</span>
                            </button>
                          </div>
                        </div>

                        {/* Detected Resume Sections Pill Bar */}
                        {detectedSections.length > 0 && (
                          <div className="px-5 py-2.5 bg-zinc-100/70 border-b border-zinc-200/80 flex items-center gap-2 overflow-x-auto text-[11px]">
                            <span className="text-zinc-500 font-medium shrink-0 flex items-center gap-1">
                              <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                              Detected Sections:
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {detectedSections.map((sec, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-zinc-700 font-medium">
                                  {sec} ✓
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Content Area: Either Textarea (Editing) or Formatted Preview (Reading) */}
                        <div className="p-4">
                          {isEditingResume ? (
                            <div>
                              <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                                <span className="font-medium text-zinc-700">Edit extracted content directly:</span>
                                <span>Changes update in real-time</span>
                              </div>
                              <textarea
                                value={resumeText}
                                onChange={(e) => handleResumeTextChange(e.target.value)}
                                rows={8}
                                className="w-full p-3.5 font-mono text-xs text-zinc-800 bg-white border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed resize-y"
                                placeholder="Paste or edit resume text here..."
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                                <span className="font-medium text-zinc-700 flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                                  Parsed Content Snippet & Verification:
                                </span>
                                <span className="text-zinc-400 text-[11px]">Verify text accuracy before matching</span>
                              </div>
                              <div 
                                className={cn(
                                  "p-4 bg-white border border-zinc-200 rounded-xl font-mono text-xs text-zinc-700 whitespace-pre-wrap leading-relaxed select-text overflow-y-auto transition-all",
                                  isSnippetExpanded ? "max-h-96" : "max-h-48"
                                )}
                              >
                                {isSnippetExpanded 
                                  ? resumeText 
                                  : (resumeText.slice(0, 600) + (resumeText.length > 600 ? '\n\n... [Click "Show Full Text" below to expand remaining content]' : ''))}
                              </div>

                              {/* Expand / Collapse Footer */}
                              {resumeText.length > 600 && (
                                <div className="mt-2.5 flex items-center justify-between">
                                  <button
                                    type="button"
                                    onClick={() => setIsSnippetExpanded(!isSnippetExpanded)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                                  >
                                    {isSnippetExpanded ? (
                                      <>
                                        <ChevronUp className="w-3.5 h-3.5" />
                                        <span>Show Brief Snippet</span>
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3.5 h-3.5" />
                                        <span>Show Full Resume Text ({fileInfo?.wordCount || resumeText.split(/\s+/).length} words)</span>
                                      </>
                                    )}
                                  </button>

                                  <span className="text-[11px] text-zinc-400">
                                    {isSnippetExpanded ? 'Showing complete parsed resume' : 'Showing first 600 characters'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Preview Footer Notification */}
                        <div className="px-5 py-2.5 bg-emerald-50/80 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
                          <span className="flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Content verified — ready for live job search & Canadian educational matching.</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsEditingResume(true)}
                            className="text-emerald-700 hover:underline font-semibold cursor-pointer hidden sm:inline"
                          >
                            Need to tweak anything?
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* LinkedIn Input & Automated Scraping Mode */
                  <div className="space-y-4">
                    {/* URL Input Bar with inline Fetch button */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                        <input
                          type="url"
                          placeholder="https://linkedin.com/in/username"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleFetchLinkedInProfile();
                            }
                          }}
                          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFetchLinkedInProfile()}
                        disabled={isFetchingProfile || !linkedinUrl.trim()}
                        className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
                      >
                        {isFetchingProfile ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Scraping...</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-4 h-4" />
                            <span>Fetch Profile</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Sub-bar: 1-Click Sample Profile & Microcopy */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                      <button
                        type="button"
                        onClick={handleLoadSampleLinkedIn}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer self-start"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Try Sample Public Profile (Marcus Vance - CS Grad)</span>
                      </button>
                      <p className="text-[11px] text-zinc-400">
                        Extracts work history, Canadian education credentials & skills
                      </p>
                    </div>

                    {/* Scraping Loading State */}
                    {isFetchingProfile && (
                      <div className="p-8 border-2 border-indigo-200 rounded-2xl bg-indigo-50/50 flex flex-col items-center justify-center gap-3 text-center animate-pulse">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        <div>
                          <p className="font-semibold text-zinc-900 text-sm">Scraping & Extracting LinkedIn Profile...</p>
                          <p className="text-xs text-zinc-500 mt-0.5">Fetching public work history, university/college education, and technical skills...</p>
                        </div>
                      </div>
                    )}

                    {/* Fetch Error Alert */}
                    {fetchProfileError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-xs">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                          <span>{fetchProfileError}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleLoadSampleLinkedIn}
                            className="text-xs font-semibold underline hover:text-red-900 cursor-pointer"
                          >
                            Try Sample
                          </button>
                          <button
                            type="button"
                            onClick={() => setFetchProfileError(null)}
                            className="text-zinc-400 hover:text-zinc-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* LinkedIn Profile Preview Pane */}
                    {linkedInProfile && !isFetchingProfile && (
                      <div className="border border-zinc-200 rounded-2xl bg-zinc-50/50 overflow-hidden shadow-xs transition-all">
                        {/* Preview Header Bar */}
                        <div className="bg-white px-5 py-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 font-bold text-sm">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-zinc-900 truncate max-w-xs">
                                  {linkedInProfile.fullName}
                                </h3>
                                <LinkedInVerificationBadge
                                  type="profile"
                                  profileData={linkedInProfile}
                                  url={linkedinUrl}
                                />
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-0.5">
                                {linkedInProfile.headline || 'LinkedIn Professional Profile'}
                                {linkedInProfile.location ? ` • ${linkedInProfile.location}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Toolbar Actions */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            {/* Toggle Edit Mode */}
                            <button
                              type="button"
                              onClick={() => setIsEditingLinkedIn(!isEditingLinkedIn)}
                              className={cn(
                                "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                                isEditingLinkedIn
                                  ? "bg-indigo-600 text-white"
                                  : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                              )}
                              title={isEditingLinkedIn ? "Switch to formatted preview" : "Edit raw extracted profile text"}
                            >
                              {isEditingLinkedIn ? (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Preview</span>
                                </>
                              ) : (
                                <>
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit Text</span>
                                </>
                              )}
                            </button>

                            {/* Copy Profile Text */}
                            <button
                              type="button"
                              onClick={handleCopyLinkedInText}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                              title="Copy extracted profile text to clipboard"
                            >
                              {copiedLinkedIn ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-600 font-semibold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-zinc-500" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            {/* Clear / Change Profile */}
                            <button
                              type="button"
                              onClick={handleClearLinkedIn}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-zinc-200 text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                              title="Clear extracted profile and enter another URL"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Change Profile</span>
                            </button>
                          </div>
                        </div>

                        {/* Extracted Profile Highlights Bar */}
                        <div className="px-5 py-2.5 bg-zinc-100/70 border-b border-zinc-200/80 flex items-center justify-between text-[11px] flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 font-semibold text-zinc-700">
                              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                              {linkedInProfile.workHistory?.length || 0} Roles Extracted
                            </span>
                            <span className="text-zinc-300">•</span>
                            <span className="flex items-center gap-1 font-semibold text-zinc-700">
                              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                              {linkedInProfile.education?.length || 0} Credentials
                            </span>
                            <span className="text-zinc-300">•</span>
                            <span className="flex items-center gap-1 font-semibold text-zinc-700">
                              <Target className="w-3.5 h-3.5 text-indigo-600" />
                              {linkedInProfile.skills?.length || 0} Skills Detected
                            </span>
                          </div>
                          <span className="text-zinc-500">
                            {linkedInProfile.rawText?.split(/\s+/).filter(Boolean).length || 0} words parsed
                          </span>
                        </div>

                        {/* Main Content Area */}
                        <div className="p-5 space-y-4">
                          {/* Summary / About callout */}
                          {linkedInProfile.summary && (
                            <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-zinc-700 leading-relaxed">
                              <div className="font-semibold text-indigo-900 mb-1 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-indigo-600" />
                                About & Professional Focus
                              </div>
                              <p>{linkedInProfile.summary}</p>
                            </div>
                          )}

                          {/* Work History Extracted Cards */}
                          {linkedInProfile.workHistory && linkedInProfile.workHistory.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                                Extracted Work Experience ({linkedInProfile.workHistory.length})
                              </h4>
                              <div className="space-y-2">
                                {linkedInProfile.workHistory.map((role, idx) => (
                                  <div key={idx} className="p-3 bg-white rounded-xl border border-zinc-200/90 text-xs shadow-2xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                      <span className="font-bold text-zinc-900 text-xs">{role.title}</span>
                                      {role.duration && (
                                        <span className="text-[11px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full shrink-0">
                                          {role.duration}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-indigo-600 font-medium text-[11px] mb-1">
                                      {role.company}
                                    </div>
                                    {role.description && (
                                      <p className="text-zinc-600 text-[11px] leading-relaxed line-clamp-2">
                                        {role.description}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Education Extracted Cards */}
                          {linkedInProfile.education && linkedInProfile.education.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                                Extracted Education & Credentials ({linkedInProfile.education.length})
                              </h4>
                              <div className="space-y-2">
                                {linkedInProfile.education.map((edu, idx) => (
                                  <div key={idx} className="p-3 bg-white rounded-xl border border-zinc-200/90 text-xs shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <div>
                                      <span className="font-bold text-zinc-900 text-xs block">{edu.institution}</span>
                                      <span className="text-zinc-600 text-[11px]">
                                        {edu.degree || ''} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                                      </span>
                                    </div>
                                    {edu.dates && (
                                      <span className="text-[11px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full shrink-0 self-start sm:self-auto">
                                        {edu.dates}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Skills Cloud */}
                          {linkedInProfile.skills && linkedInProfile.skills.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5 text-indigo-600" />
                                Extracted Skills ({linkedInProfile.skills.length})
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {linkedInProfile.skills.map((skill, idx) => (
                                  <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-zinc-200 text-zinc-800 shadow-2xs">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Edit Mode vs Structured Textarea */}
                          <div className="pt-2 border-t border-zinc-200/80">
                            {isEditingLinkedIn ? (
                              <div>
                                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                                  <span className="font-medium text-zinc-700">Edit extracted profile content directly:</span>
                                  <span>Changes feed directly into analysis</span>
                                </div>
                                <textarea
                                  value={linkedInProfile.rawText}
                                  onChange={(e) => handleLinkedInTextChange(e.target.value)}
                                  rows={8}
                                  className="w-full p-3.5 font-mono text-xs text-zinc-800 bg-white border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed resize-y"
                                  placeholder="Edit parsed profile text..."
                                />
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                                  <span className="font-medium text-zinc-700 flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5 text-zinc-400" />
                                    Compiled Profile Text for AI Analysis:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setIsLinkedInSnippetExpanded(!isLinkedInSnippetExpanded)}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                                  >
                                    {isLinkedInSnippetExpanded ? 'Show Brief Snippet' : 'Show Full Text'}
                                  </button>
                                </div>
                                <div 
                                  className={cn(
                                    "p-3.5 bg-white border border-zinc-200 rounded-xl font-mono text-xs text-zinc-700 whitespace-pre-wrap leading-relaxed select-text overflow-y-auto transition-all",
                                    isLinkedInSnippetExpanded ? "max-h-96" : "max-h-36"
                                  )}
                                >
                                  {isLinkedInSnippetExpanded 
                                    ? linkedInProfile.rawText 
                                    : (linkedInProfile.rawText.slice(0, 500) + (linkedInProfile.rawText.length > 500 ? '\n\n... [Click "Show Full Text" to view all parsed text]' : ''))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Verification Footer Banner */}
                        <div className="px-5 py-2.5 bg-emerald-50/80 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
                          <span className="flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>LinkedIn profile verified and structured — ready for live job search & Canadian educational matching.</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsEditingLinkedIn(true)}
                            className="text-emerald-700 hover:underline font-semibold cursor-pointer hidden sm:inline"
                          >
                            Need to tweak anything?
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (inputMode === 'resume' ? !resumeText : (!linkedinUrl && !linkedInProfile))}
                  className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Analyzing profile & searching jobs and Canadian institutions...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-6 h-6" />
                      <span>Analyze My Career & Upskilling Paths</span>
                    </>
                  )}
                </button>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        ) : (
          /* Report Printable Container */
          <div id="printable-career-report" className="space-y-12 print:space-y-6 print:m-0 print:p-0">
            {/* Print-Only Header: Executive Briefing Layout for Paper / PDF Export */}
            <div className="hidden print:block border-b-2 border-zinc-900 pb-5 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">CareerMatch AI</h1>
                    <p className="text-xs text-zinc-600 font-medium">Personalized Career Strategy & Canadian Educational Pathways</p>
                  </div>
                </div>
                <div className="text-right text-xs text-zinc-600">
                  <div className="font-bold text-zinc-900">Career Analysis Report</div>
                  <div>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-200 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 font-medium block">Profile Source:</span>
                  <span className="font-semibold text-zinc-900 truncate block">
                    {fileInfo?.fileName || (linkedInProfile?.fullName ? `${linkedInProfile.fullName} (LinkedIn Profile)` : (linkedinUrl ? 'LinkedIn Profile' : 'Uploaded Student Profile'))}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 font-medium block">Educational Standard:</span>
                  <span className="font-semibold text-zinc-900 block">Canada.ca Designated Institutions</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-medium block">Verification:</span>
                  <span className="font-semibold text-emerald-700 block">Live Market & Grant Grounding</span>
                </div>
              </div>
            </div>

            {/* Analysis Results Header & Interactive Controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-zinc-200 print:border-b-0 print:pb-0">
              <div>
                <button 
                  onClick={() => setAnalysis(null)}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 mb-3 flex items-center gap-1 group cursor-pointer print:hidden"
                >
                  <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Upload another resume / profile
                </button>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight print:text-2xl">
                    Career & Upskilling Analysis
                  </h2>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 print:text-[10px] print:py-0.5">
                    Live Verified
                  </span>
                </div>
                <p className="text-zinc-600 mt-2 max-w-3xl leading-relaxed print:text-xs print:mt-1">
                  {analysis.summary}
                </p>
              </div>

              {/* Action Buttons (Hidden when printing or inside PDF clone) */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
                <button
                  onClick={() => setIsResourcesOpen(true)}
                  className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50/70 text-red-700 text-xs sm:text-sm font-semibold hover:bg-red-100 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="View Canadian Designated Educational Institutions guide"
                >
                  <BookOpen className="w-4 h-4 text-red-600" />
                  <span>Canada.ca Guide</span>
                </button>

                {/* Print Report Trigger */}
                <button 
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-xs sm:text-sm font-semibold hover:bg-zinc-100 hover:text-zinc-900 transition-all shadow-xs cursor-pointer flex items-center gap-2"
                  title="Open browser print dialog for paper or PDF printer"
                >
                  <Printer className="w-4 h-4 text-zinc-600" />
                  <span>Print Report</span>
                </button>

                {/* Save as PDF Trigger (jspdf) */}
                <button 
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer flex items-center gap-2",
                    pdfExportSuccess 
                      ? "bg-emerald-600 hover:bg-emerald-700" 
                      : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-indigo-100"
                  )}
                  title="Generate and download formatted PDF file using jsPDF"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{pdfExportStatus ? pdfExportStatus.replace('...', '') : 'Generating PDF...'}</span>
                    </>
                  ) : pdfExportSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>PDF Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Save as PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* PDF Export Feedback Alert */}
            {pdfExportError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-xs print:hidden animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{pdfExportError}</span>
                </div>
                <button 
                  onClick={() => setPdfExportError(null)} 
                  className="text-zinc-400 hover:text-zinc-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Main Grid: Jobs & Skill Gaps + Coursera */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block print:space-y-6">
              {/* Job Matches */}
              <div className="lg:col-span-2 space-y-6 print:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="text-indigo-600 w-6 h-6 print:w-5 print:h-5" />
                    <h3 className="text-2xl font-bold text-zinc-900 print:text-lg">Top Job Matches</h3>
                  </div>
                  <div className="flex items-center gap-2 print:hidden">
                    {linkedInProfile && (
                      <button
                        onClick={handleRefreshLinkedInJobs}
                        disabled={isRefreshingLinkedInJobs}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-blue-50 text-[#0A66C2] hover:bg-blue-100 transition-colors border border-blue-200/80 cursor-pointer disabled:opacity-50"
                        title="Re-query LinkedIn Jobs API using your extracted work history and skills"
                      >
                        <RefreshCw className={cn("w-3 h-3", isRefreshingLinkedInJobs && "animate-spin")} />
                        <span>{isRefreshingLinkedInJobs ? 'Querying...' : 'Re-query LinkedIn'}</span>
                      </button>
                    )}
                    <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">
                      Direct Deep Links
                    </span>
                  </div>
                </div>

                {/* LinkedIn API Query Status Banner */}
                <div className="p-3 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/70 rounded-xl border border-blue-100 text-xs text-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:border-zinc-300 print:bg-white print:p-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#0A66C2] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      in
                    </span>
                    <span className="font-medium text-zinc-800 print:text-[10px]">
                      <span className="font-bold text-[#0A66C2]">LinkedIn Jobs API: </span>
                      {linkedInProfile
                        ? `Live job postings queried specifically for your background (${linkedInProfile.workHistory?.[0]?.title || 'Recent Role'}) and ${linkedInProfile.skills?.length || 0} extracted skills.`
                        : 'Jobs queried and aligned with your profile skills and technical background.'}
                    </span>
                  </div>
                  {linkedInProfile?.location && (
                    <span className="text-[11px] text-zinc-500 font-medium shrink-0 print:hidden flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-400" />
                      {linkedInProfile.location}
                    </span>
                  )}
                </div>
                {/* LinkedIn Jobs Filtering & Sorting Panel (Dynamic Client-Side) */}
                <div className="bg-white border border-zinc-200/90 rounded-2xl p-3.5 sm:p-4 space-y-3 print:hidden shadow-xs">
                  {/* Top Control Bar: Workplace Segmented Filter & Sort Options */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Remote / Hybrid / On-site Filter Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-zinc-100/90 rounded-xl overflow-x-auto text-xs font-medium scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setJobWorkplaceFilter('all')}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer",
                          jobWorkplaceFilter === 'all'
                            ? "bg-white text-zinc-900 font-semibold shadow-xs"
                            : "text-zinc-600 hover:text-zinc-900"
                        )}
                      >
                        <span>All</span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.2 rounded-md font-mono tabular-nums",
                          jobWorkplaceFilter === 'all' ? "bg-zinc-100 text-zinc-800" : "bg-zinc-200/60 text-zinc-600"
                        )}>
                          {workplaceCounts.all}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setJobWorkplaceFilter('Remote')}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer",
                          jobWorkplaceFilter === 'Remote'
                            ? "bg-white text-sky-700 font-semibold shadow-xs"
                            : "text-zinc-600 hover:text-zinc-900"
                        )}
                      >
                        <Globe className="w-3 h-3 text-sky-600 shrink-0" />
                        <span>Remote</span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.2 rounded-md font-mono tabular-nums",
                          jobWorkplaceFilter === 'Remote' ? "bg-sky-50 text-sky-800" : "bg-zinc-200/60 text-zinc-600"
                        )}>
                          {workplaceCounts.Remote}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setJobWorkplaceFilter('Hybrid')}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer",
                          jobWorkplaceFilter === 'Hybrid'
                            ? "bg-white text-violet-700 font-semibold shadow-xs"
                            : "text-zinc-600 hover:text-zinc-900"
                        )}
                      >
                        <Laptop className="w-3 h-3 text-violet-600 shrink-0" />
                        <span>Hybrid</span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.2 rounded-md font-mono tabular-nums",
                          jobWorkplaceFilter === 'Hybrid' ? "bg-violet-50 text-violet-800" : "bg-zinc-200/60 text-zinc-600"
                        )}>
                          {workplaceCounts.Hybrid}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setJobWorkplaceFilter('On-site')}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer",
                          jobWorkplaceFilter === 'On-site'
                            ? "bg-white text-amber-800 font-semibold shadow-xs"
                            : "text-zinc-600 hover:text-zinc-900"
                        )}
                      >
                        <Building2 className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>On-site</span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.2 rounded-md font-mono tabular-nums",
                          jobWorkplaceFilter === 'On-site' ? "bg-amber-50 text-amber-900" : "bg-zinc-200/60 text-zinc-600"
                        )}>
                          {workplaceCounts['On-site']}
                        </span>
                      </button>
                    </div>

                    {/* Sort Selector: Salary, Posted Date, or Match Score */}
                    <div className="flex items-center gap-2 shrink-0">
                      <label htmlFor="job-sort-select" className="text-xs font-medium text-zinc-500 whitespace-nowrap flex items-center gap-1">
                        <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>Sort:</span>
                      </label>
                      <div className="relative">
                        <select
                          id="job-sort-select"
                          value={jobSortBy}
                          onChange={(e) => setJobSortBy(e.target.value as JobSortOption)}
                          className="appearance-none bg-zinc-50 hover:bg-zinc-100/90 border border-zinc-200 text-zinc-900 text-xs font-semibold rounded-xl pl-3 pr-8 py-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="match-desc">Best Match (Score)</option>
                          <option value="salary-desc">Salary (Estimate): High to Low</option>
                          <option value="salary-asc">Salary (Estimate): Low to High</option>
                          <option value="date-newest">Posted Date: Most Recent</option>
                          <option value="date-oldest">Posted Date: Oldest First</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Secondary Filter Row: Search Keyword, Minimum Salary, and Active Status Counter */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-zinc-100">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      {/* Search Input */}
                      <div className="relative flex-1 min-w-[190px]">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={jobSearchQuery}
                          onChange={(e) => setJobSearchQuery(e.target.value)}
                          placeholder="Filter by title, company, location, or skill..."
                          className="w-full pl-8 pr-7 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                        {jobSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setJobSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                            title="Clear search query"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Minimum Salary Threshold */}
                      <div className="relative shrink-0">
                        <select
                          value={jobMinSalary}
                          onChange={(e) => setJobMinSalary(Number(e.target.value))}
                          className="appearance-none bg-zinc-50 hover:bg-zinc-100/90 border border-zinc-200 text-zinc-800 text-xs font-medium rounded-xl pl-3 pr-7 py-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value={0}>All Salaries</option>
                          <option value={80000}>$80k+ CAD</option>
                          <option value={100000}>$100k+ CAD</option>
                          <option value={120000}>$120k+ CAD</option>
                          <option value={140000}>$140k+ CAD</option>
                          <option value={160000}>$160k+ CAD</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Results Counter and Reset Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-2.5 text-xs text-zinc-500 font-medium shrink-0">
                      <span className="tabular-nums">
                        Showing <strong className="text-zinc-900">{filteredJobs.length}</strong> of {normalizedMatchedJobs.length}
                      </span>
                      {isAnyFilterActive && (
                        <button
                          type="button"
                          onClick={handleResetJobFilters}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Job Matches Grid (Dynamically updated without page reload) */}
                {filteredJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
                    {filteredJobs.map((job, i) => (
                      <JobCard key={job.linkedInJobId || `${job.company}-${job.title}-${i}`} job={job} index={i} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto">
                      <SlidersHorizontal className="w-6 h-6 text-zinc-400" />
                    </div>
                    <h4 className="font-bold text-zinc-900 text-base">No Job Matches for Selected Criteria</h4>
                    <p className="text-sm text-zinc-500 max-w-md mx-auto">
                      No LinkedIn jobs match your active combination of workplace type ({jobWorkplaceFilter}), minimum salary, or search keywords.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetJobFilters}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset All Filters</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Skill Gaps & Courses */}
              <div className="space-y-8 print:space-y-6 print:pt-4">
                {/* Skill Gaps */}
                <section>
                  <div className="flex items-center gap-2 mb-4 print:mb-2">
                    <Target className="text-indigo-600 w-6 h-6 print:w-5 print:h-5" />
                    <h3 className="text-xl font-bold text-zinc-900 print:text-base">Identified Skill Gaps</h3>
                  </div>
                  <div className="space-y-3 print:space-y-2">
                    {analysis.skillGaps.map((gap, i) => (
                      <SkillGapItem key={i} gap={gap} index={i} />
                    ))}
                  </div>
                </section>

                {/* Course Recommendations */}
                <section>
                  <div className="flex items-center gap-2 mb-4 print:mb-2">
                    <GraduationCap className="text-indigo-600 w-6 h-6 print:w-5 print:h-5" />
                    <h3 className="text-xl font-bold text-zinc-900 print:text-base">Rapid Coursera Courses</h3>
                  </div>
                  <div className="space-y-4 print:space-y-2.5">
                    {analysis.recommendedCourses.map((course, i) => (
                      <CourseCard key={i} course={course} index={i} />
                    ))}
                  </div>
                </section>
              </div>
            </div>

            {/* Canadian Higher Education & Further Upskilling Section */}
            <section className="pt-8 border-t border-zinc-200 print:pt-6 print:mt-6 print:border-zinc-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:mb-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 print:w-6 print:h-6">
                      <School className="w-5 h-5 print:w-4 print:h-4" />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 flex items-center gap-2 print:text-lg">
                      <span>Canadian Higher Education & Future Upskilling</span>
                      <span className="text-lg print:text-sm">🇨🇦</span>
                    </h3>
                  </div>
                  <p className="text-sm text-zinc-600 max-w-3xl leading-relaxed print:text-xs">
                    Formal post-secondary credentials from institutions verified under the Government of Canada's{' '}
                    <span className="text-red-700 font-semibold underline print:no-underline">
                      Master List of Designated Educational Institutions
                    </span>
                    . Eligible for federal and provincial student aid (Canada Student Grants & Loans) and the Lifelong Learning Plan (LLP).
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 print:hidden">
                  <button
                    onClick={() => setIsResourcesOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>View Directory in Resources</span>
                  </button>
                  <a 
                    href={CANADA_DESIGNATED_SCHOOLS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Canada.ca Directory</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {analysis.canadianUpskilling && analysis.canadianUpskilling.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
                  {analysis.canadianUpskilling.map((item, i) => (
                    <CanadianInstitutionCard key={i} item={item} index={i} />
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-white border border-zinc-200 rounded-2xl text-center text-zinc-500">
                  <p>Searching for specialized Canadian designated learning institution programs matching this profile...</p>
                </div>
              )}
            </section>

            {/* Print-Only Footer for Paper & PDF Exports */}
            <div className="hidden print:block pt-6 mt-8 border-t border-zinc-300 text-[9.5pt] text-zinc-500">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-zinc-800">CareerMatch AI Report</span> • Powered by Google Gemini Search Grounding
                </div>
                <div>
                  Grounded in Government of Canada Designated Educational Institutions (ESDC)
                </div>
              </div>
              <div className="mt-1 text-zinc-400 text-[8.5pt]">
                Canada.ca Directory Reference: {CANADA_DESIGNATED_SCHOOLS_URL}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer (Hidden when printing report) */}
      <footer className="border-t border-zinc-200 py-12 bg-white mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-500 text-sm">
          <p>© 2026 CareerMatch AI. Powered by Google Gemini.</p>
          <div className="flex items-center gap-6 text-xs">
            <button
              onClick={() => setIsResourcesOpen(true)}
              className="text-red-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Canada.ca Directory Resources Guide</span>
            </button>
            <a 
              href={CANADA_DESIGNATED_SCHOOLS_URL} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
            >
              <span>Canada.ca Master List</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Resources Modal (Hidden during print) */}
      <ResourcesModal isOpen={isResourcesOpen} onClose={() => setIsResourcesOpen(false)} />
    </div>
  );
}

function ResourcesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in print:hidden">
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 my-8 max-h-[90vh] overflow-y-auto flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Modal Header */}
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-zinc-200">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold mb-2">
                <span>🇨🇦 Government of Canada Directory Guide</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                Designated Educational Institutions & Upskilling in Canada
              </h2>
              <p className="text-sm text-zinc-600 mt-1 leading-relaxed">
                Comprehensive reference guide to Canadian post-secondary institutions, recognized credentials, provinces, career impact, and official verification links under Employment and Social Development Canada (ESDC).
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer shrink-0"
              aria-label="Close resources dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Directory Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-6">
            {/* 1. Institution Credentials */}
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center mb-3">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 mb-1">
                Institution Credentials & Levels
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed mb-3">
                Recognized Canadian public colleges, polytechnics, and universities offer industry-aligned credentials:
              </p>
              <ul className="text-xs text-zinc-700 space-y-1.5 list-disc list-inside">
                <li><span className="font-semibold text-zinc-900">Ontario & BC College Graduate Certificates:</span> 1 to 2-year fast-track post-grad programs.</li>
                <li><span className="font-semibold text-zinc-900">Polytechnic Advanced Diplomas:</span> Applied hands-on technology credentials (BCIT, Seneca, SAIT).</li>
                <li><span className="font-semibold text-zinc-900">Applied Master's & Degrees:</span> University programs (U of T, Waterloo, McGill, UBC).</li>
                <li><span className="font-semibold text-zinc-900">Continuing Education & Micro-credentials:</span> Certified for occupational skills development.</li>
              </ul>
            </div>

            {/* 2. Canadian Provinces & Territories */}
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 mb-1">
                Canadian Provinces & Designated Coverage
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed mb-3">
                Each province and territory designates specific educational institutions and programs eligible for student aid:
              </p>
              <ul className="text-xs text-zinc-700 space-y-1.5 list-disc list-inside">
                <li><span className="font-semibold text-zinc-900">Ontario:</span> Over 24 public colleges and 20+ universities (OSAP eligible).</li>
                <li><span className="font-semibold text-zinc-900">British Columbia:</span> BCIT, UBC, Simon Fraser, and regional colleges (StudentAid BC).</li>
                <li><span className="font-semibold text-zinc-900">Alberta:</span> SAIT, NAIT, University of Alberta, University of Calgary.</li>
                <li><span className="font-semibold text-zinc-900">Quebec, Atlantic & Prairies:</span> CEGEPs, universities, and polytechnics across Canada.</li>
              </ul>
            </div>

            {/* 3. Career Impact & Skills Covered */}
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 mb-1">
                Career Impact & Skills Covered
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed mb-3">
                Canadian post-secondary upskilling connects students directly to in-demand labor market needs:
              </p>
              <ul className="text-xs text-zinc-700 space-y-1.5 list-disc list-inside">
                <li><span className="font-semibold text-zinc-900">Industry Co-ops & Work Terms:</span> Direct Canadian workplace experience and employer networking.</li>
                <li><span className="font-semibold text-zinc-900">High-Growth Sectors:</span> Cloud architecture, AI/ML, data analytics, cybersecurity, green energy, and health informatics.</li>
                <li><span className="font-semibold text-zinc-900">Resume Credibility:</span> Canadian employers highly value local accredited credentials.</li>
              </ul>
            </div>

            {/* 4. Financial Aid & Lifelong Learning Plan */}
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 mb-1">
                Financial Aid & Lifelong Learning Plan
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed mb-3">
                Designated institutions allow students to access non-repayable grants and interest-free loans:
              </p>
              <ul className="text-xs text-zinc-700 space-y-1.5 list-disc list-inside">
                <li><span className="font-semibold text-zinc-900">Canada Student Grants (CSG):</span> Up to thousands of dollars in non-repayable federal grants.</li>
                <li><span className="font-semibold text-zinc-900">Canada Student Loans (CSL):</span> Permanent interest-free federal student loans.</li>
                <li><span className="font-semibold text-zinc-900">Lifelong Learning Plan (LLP):</span> Withdraw up to $20,000 tax-free from your RRSP to pay for full-time training.</li>
              </ul>
            </div>
          </div>

          {/* Official Verification Callout */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs text-zinc-700">
                <div className="font-bold text-zinc-900 text-sm">Official Canada.ca Master List of Designated Institutions</div>
                Check any Canadian university or college by province or 4-digit Educational Institution Code.
              </div>
            </div>
            <a
              href={CANADA_DESIGNATED_SCHOOLS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <span>Open Canada.ca Directory</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-6 border-t border-zinc-200 mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, index }: any) {
  const isLinkedIn = job.isLinkedInVerified || job.source === 'LinkedIn Jobs API' || (typeof job.url === 'string' && job.url.includes('linkedin.com/jobs/view'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white p-6 rounded-2xl border border-zinc-200 hover:border-indigo-300 transition-all group flex flex-col justify-between print-avoid-break print:p-4 print:border-zinc-300 print:shadow-none"
    >
      <div>
        <div className="flex justify-between items-start mb-3 gap-2 print:mb-2">
          <div>
            <h4 className="font-bold text-lg text-zinc-900 group-hover:text-indigo-600 transition-colors leading-snug print:text-base">
              {job.title}
            </h4>
            <p className="text-zinc-600 text-sm mt-0.5 print:text-xs">
              <span className="font-semibold text-zinc-900">{job.company}</span> • {job.location}
            </p>
            {/* Salary Estimate, Workplace Type & Posted Date */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 mt-2 font-medium">
              {job.salaryEstimate && (
                <span className="font-semibold text-emerald-700 tabular-nums flex items-center gap-0.5 print:text-[10px]">
                  <DollarSign className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{job.salaryEstimate}</span>
                </span>
              )}
              {job.workplaceType && (
                <>
                  <span aria-hidden="true" className="text-zinc-300">·</span>
                  <span className="flex items-center gap-1 text-zinc-700 print:text-[10px]">
                    {job.workplaceType === 'Remote' ? (
                      <Globe className="w-3 h-3 text-sky-600 shrink-0" />
                    ) : job.workplaceType === 'Hybrid' ? (
                      <Laptop className="w-3 h-3 text-violet-600 shrink-0" />
                    ) : (
                      <Building2 className="w-3 h-3 text-amber-600 shrink-0" />
                    )}
                    <span>{job.workplaceType}</span>
                  </span>
                </>
              )}
              {job.postedDate && (
                <>
                  <span aria-hidden="true" className="text-zinc-300">·</span>
                  <span className="flex items-center gap-1 text-zinc-500 print:text-[10px]">
                    <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span>{job.postedDate}</span>
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold print:border print:border-indigo-200 print:text-[10px] print:px-2 print:py-0.5">
              {job.matchScore}% Match
            </div>
            {isLinkedIn && (
              <LinkedInVerificationBadge
                type="job"
                jobData={job}
              />
            )}
          </div>
        </div>

        {/* Matched Profile Skills */}
        {job.matchedSkills && job.matchedSkills.length > 0 && (
          <div className="mb-3 print:mb-2">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 print:text-[9px]">
              <Target className="w-3 h-3 text-indigo-500" />
              <span>Aligned Profile Skills ({job.matchedSkills.length}):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {job.matchedSkills.map((skill: string, sIdx: number) => (
                <span
                  key={sIdx}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50/80 text-indigo-700 border border-indigo-100 flex items-center gap-1 print:text-[9px] print:py-0"
                >
                  <Check className="w-2.5 h-2.5 text-indigo-600" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-zinc-500 line-clamp-3 mb-4 print:text-xs print:line-clamp-none print:mb-2">
          {job.description}
        </p>

        <div className="bg-zinc-50 p-3 rounded-xl mb-4 print:p-2 print:mb-2 print:border print:border-zinc-200">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 print:text-[9px]">
            Why you match & Work History Alignment
          </p>
          <p className="text-sm text-zinc-700 print:text-xs leading-relaxed">{job.whyMatch}</p>
        </div>
      </div>

      {/* Web Interactive Link */}
      <a
        href={job.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-between text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-all pt-2 print:hidden group/btn"
      >
        <span className="flex items-center gap-1.5">
          {isLinkedIn ? (
            <>
              <span className="w-4 h-4 rounded-xs bg-[#0A66C2] text-white flex items-center justify-center text-[10px] font-black">in</span>
              <span>Apply on LinkedIn</span>
            </>
          ) : (
            <span>View Verified Job</span>
          )}
        </span>
        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
      </a>

      {/* Print-Only Link Citation */}
      <div className="hidden print:block text-[9pt] text-zinc-600 pt-2 border-t border-zinc-100 font-mono truncate">
        Application: {job.url}
      </div>
    </motion.div>
  );
}

function SkillGapItem({ gap, index }: any) {
  const colors: any = {
    High: "bg-red-100 text-red-700 border-red-200",
    Medium: "bg-amber-100 text-amber-700 border-amber-200",
    Low: "bg-blue-100 text-blue-700 border-blue-200"
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white p-4 rounded-xl border border-zinc-200 flex items-start gap-4 print-avoid-break print:p-3 print:border-zinc-300 print:shadow-none"
    >
      <div className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase border shrink-0 print:text-[9px]", colors[gap.importance])}>
        {gap.importance}
      </div>
      <div>
        <h5 className="font-bold text-zinc-900 text-sm print:text-xs">{gap.skill}</h5>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed print:text-[10px]">{gap.description}</p>
      </div>
    </motion.div>
  );
}

function CourseCard({ course, index }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white p-5 rounded-2xl border border-zinc-200 hover:shadow-md transition-all flex flex-col justify-between print-avoid-break print:p-3.5 print:border-zinc-300 print:shadow-none"
    >
      <div>
        <div className="flex items-start justify-between gap-4 mb-2">
          <h5 className="font-bold text-zinc-900 leading-tight print:text-sm">{course.title}</h5>
          <ExternalLink className="w-4 h-4 text-zinc-400 shrink-0 print:hidden" />
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3 print:text-[10px] print:mb-1.5">
          <span className="font-medium text-indigo-600">{course.provider}</span>
          <span>•</span>
          <span>{course.duration}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4 print:mb-2">
          {course.skillsCovered.slice(0, 3).map((skill: string, i: number) => (
            <span key={i} className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded text-[10px] font-medium print:border print:border-zinc-200">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Web Interactive Link */}
      <a
        href={course.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center py-2 rounded-xl bg-zinc-50 text-zinc-900 text-sm font-bold hover:bg-zinc-100 transition-colors print:hidden"
      >
        Enroll on Coursera
      </a>

      {/* Print-Only Citation */}
      <div className="hidden print:block text-[9pt] text-zinc-600 pt-1.5 border-t border-zinc-100 font-mono truncate">
        Coursera: {course.url}
      </div>
    </motion.div>
  );
}

function CanadianInstitutionCard({ item, index }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white p-6 rounded-2xl border border-zinc-200 hover:border-red-300 transition-all flex flex-col justify-between shadow-xs group print-avoid-break print:p-4 print:border-zinc-300 print:shadow-none"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3 print:mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-full print:border print:border-zinc-200 print:text-[10px]">
            <MapPin className="w-3.5 h-3.5 text-red-600 print:w-3 print:h-3" />
            <span>{item.province}</span>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 print:text-[9.5pt]">
            {item.credentialType}
          </span>
        </div>

        {/* Institution & Program */}
        <div className="mb-3 print:mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-red-700 flex items-center gap-1 print:text-[9.5pt]">
            <School className="w-3.5 h-3.5 print:w-3 print:h-3" />
            {item.institutionName}
          </h4>
          <h3 className="font-bold text-lg text-zinc-900 mt-1 leading-snug group-hover:text-red-700 transition-colors print:text-base">
            {item.programName}
          </h3>
        </div>

        {/* Government of Canada Status Badges */}
        <div className="space-y-1.5 mb-4 print:mb-2">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 print:text-[10px] print:py-0.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 print:w-3.5 print:h-3.5" />
            <span className="font-medium">Designated Learning Institution (Canada.ca)</span>
          </div>
          {item.financialAidEligible && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 bg-zinc-50 px-2.5 py-1 rounded-lg border border-zinc-200 print:text-[10px] print:py-0.5">
              <BookOpen className="w-4 h-4 shrink-0 text-zinc-500 print:w-3.5 print:h-3.5" />
              <span>{item.financialAidDetails || 'Eligible for Canada Student Grants & Loans / Lifelong Learning Plan'}</span>
            </div>
          )}
        </div>

        {/* Relevance description */}
        {item.relevanceToTargetRole && (
          <div className="bg-zinc-50 p-3 rounded-xl mb-4 text-xs text-zinc-600 leading-relaxed print:p-2 print:mb-2 print:border print:border-zinc-200 print:text-[10px]">
            <span className="font-semibold text-zinc-700 block mb-0.5">Career & Upskilling Impact:</span>
            {item.relevanceToTargetRole}
          </div>
        )}

        {/* Skills covered */}
        {item.skillsCovered && item.skillsCovered.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 print:mb-2">
            {item.skillsCovered.map((skill: string, i: number) => (
              <span key={i} className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-[11px] font-medium print:border print:border-zinc-200 print:text-[9pt]">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Web Interactive Action Links */}
      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3 text-xs print:hidden">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-bold text-red-700 hover:text-red-800 transition-colors"
        >
          <span>Explore Program</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
        <a
          href={item.canadaCaDirectoryUrl || CANADA_DESIGNATED_SCHOOLS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-600 transition-colors"
          title="Verify on Government of Canada Designated Educational Institutions Master List"
        >
          <span>Canada.ca verify</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Print-Only Program Citation */}
      <div className="hidden print:block text-[9pt] text-zinc-600 pt-2 border-t border-zinc-100 font-mono truncate">
        Program Link: {item.url}
      </div>
    </motion.div>
  );
}
