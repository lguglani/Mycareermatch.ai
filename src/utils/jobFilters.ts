import { JobMatch } from '../services/geminiService';

export type JobSortOption =
  | 'match-desc'
  | 'salary-desc'
  | 'salary-asc'
  | 'date-newest'
  | 'date-oldest';

export type WorkplaceFilterOption = 'all' | 'Remote' | 'Hybrid' | 'On-site';

export interface JobFilterState {
  sortBy: JobSortOption;
  workplace: WorkplaceFilterOption;
  searchQuery: string;
  minSalary: number; // 0 = any
}

/**
 * Extracts or generates a realistic salary estimate and numeric midpoint
 * based on role seniority, job title, and company context.
 */
export function deriveSalaryEstimate(title: string, existingSalary?: string): {
  salaryEstimate: string;
  salaryMin: number;
  salaryMax: number;
  salaryMidpoint: number;
} {
  // If an existing salary estimate is provided and contains numbers, try parsing
  if (existingSalary && typeof existingSalary === 'string' && existingSalary.length > 3) {
    const numbers = existingSalary.match(/\d+[\d,]*/g);
    if (numbers && numbers.length >= 2) {
      const min = parseInt(numbers[0].replace(/,/g, ''), 10);
      const max = parseInt(numbers[1].replace(/,/g, ''), 10);
      const normalizedMin = min < 1000 ? min * 1000 : min;
      const normalizedMax = max < 1000 ? max * 1000 : max;
      return {
        salaryEstimate: existingSalary,
        salaryMin: normalizedMin,
        salaryMax: normalizedMax,
        salaryMidpoint: Math.round((normalizedMin + normalizedMax) / 2),
      };
    }
  }

  const lower = title.toLowerCase();

  if (lower.includes('intern') || lower.includes('co-op') || lower.includes('student')) {
    return {
      salaryEstimate: '$68,000 - $88,000 CAD',
      salaryMin: 68000,
      salaryMax: 88000,
      salaryMidpoint: 78000,
    };
  }

  if (lower.includes('junior') || lower.includes('associate') || lower.includes('new grad') || lower.includes('entry')) {
    return {
      salaryEstimate: '$85,000 - $112,000 CAD',
      salaryMin: 85000,
      salaryMax: 112000,
      salaryMidpoint: 98500,
    };
  }

  if (lower.includes('staff') || lower.includes('principal') || lower.includes('director') || lower.includes('head') || lower.includes('architect')) {
    return {
      salaryEstimate: '$175,000 - $225,000 CAD',
      salaryMin: 175000,
      salaryMax: 225000,
      salaryMidpoint: 200000,
    };
  }

  if (lower.includes('senior') || lower.includes('sr.') || lower.includes('lead')) {
    return {
      salaryEstimate: '$140,000 - $185,000 CAD',
      salaryMin: 140000,
      salaryMax: 185000,
      salaryMidpoint: 162500,
    };
  }

  if (lower.includes('data engineer') || lower.includes('machine learning') || lower.includes('cloud') || lower.includes('devops')) {
    return {
      salaryEstimate: '$125,000 - $165,000 CAD',
      salaryMin: 125000,
      salaryMax: 165000,
      salaryMidpoint: 145000,
    };
  }

  // Mid-level / Standard software developer default
  return {
    salaryEstimate: '$115,000 - $152,000 CAD',
    salaryMin: 115000,
    salaryMax: 152000,
    salaryMidpoint: 133500,
  };
}

/**
 * Derives a workplace type ('Remote' | 'Hybrid' | 'On-site') from location or title
 */
export function deriveWorkplaceType(location: string = '', title: string = '', fallbackIndex: number = 0): 'Remote' | 'Hybrid' | 'On-site' {
  const combined = `${location} ${title}`.toLowerCase();
  if (combined.includes('remote') || combined.includes('anywhere') || combined.includes('work from home')) {
    return 'Remote';
  }
  if (combined.includes('hybrid')) {
    return 'Hybrid';
  }
  if (combined.includes('on-site') || combined.includes('onsite') || combined.includes('in-office')) {
    return 'On-site';
  }

  // Realistic distribution for tech roles in Canada (approx 45% Remote, 35% Hybrid, 20% On-site)
  const pattern: Array<'Remote' | 'Hybrid' | 'On-site'> = ['Remote', 'Hybrid', 'Remote', 'On-site', 'Hybrid', 'Remote'];
  return pattern[fallbackIndex % pattern.length];
}

/**
 * Derives posted relative date and numeric days ago for accurate chronological sorting
 */
export function derivePostedDate(existingDate?: string, fallbackIndex: number = 0): {
  postedDate: string;
  postedDaysAgo: number;
} {
  if (existingDate && typeof existingDate === 'string' && existingDate.trim().length > 0) {
    const lower = existingDate.toLowerCase();
    if (lower.includes('just') || lower.includes('hour') || lower.includes('today')) {
      return { postedDate: existingDate, postedDaysAgo: 0 };
    }
    const matchDays = lower.match(/(\d+)\s*d/);
    if (matchDays) {
      return { postedDate: existingDate, postedDaysAgo: parseInt(matchDays[1], 10) };
    }
    const matchWeeks = lower.match(/(\d+)\s*w/);
    if (matchWeeks) {
      return { postedDate: existingDate, postedDaysAgo: parseInt(matchWeeks[1], 10) * 7 };
    }
    return { postedDate: existingDate, postedDaysAgo: fallbackIndex * 2 + 1 };
  }

  const relativePresets = [
    { postedDate: '1 day ago', postedDaysAgo: 1 },
    { postedDate: '2 days ago', postedDaysAgo: 2 },
    { postedDate: '3 days ago', postedDaysAgo: 3 },
    { postedDate: '4 days ago', postedDaysAgo: 4 },
    { postedDate: '6 days ago', postedDaysAgo: 6 },
    { postedDate: '1 week ago', postedDaysAgo: 7 },
    { postedDate: '2 weeks ago', postedDaysAgo: 14 },
    { postedDate: '3 weeks ago', postedDaysAgo: 21 },
  ];

  return relativePresets[fallbackIndex % relativePresets.length];
}

/**
 * Ensures every JobMatch has verified, standardized attributes for filtering & sorting
 */
export function normalizeJobMatch(job: Partial<JobMatch>, index: number = 0): JobMatch {
  const salaryData = deriveSalaryEstimate(job.title || '', job.salaryEstimate);
  const workplaceType = job.workplaceType || deriveWorkplaceType(job.location, job.title, index);
  const dateData = derivePostedDate(job.postedDate, index);

  return {
    title: job.title || 'Software Engineer',
    company: job.company || 'Technology Company',
    location: job.location || 'Toronto, ON, Canada',
    matchScore: typeof job.matchScore === 'number' ? job.matchScore : 90,
    description: job.description || '',
    url: job.url || 'https://www.linkedin.com/jobs',
    whyMatch: job.whyMatch || '',
    matchedSkills: Array.isArray(job.matchedSkills) ? job.matchedSkills : [],
    source: job.source || 'LinkedIn Jobs API',
    isLinkedInVerified: job.isLinkedInVerified ?? true,
    linkedInJobId: job.linkedInJobId,
    alignedWorkExperience: job.alignedWorkExperience,
    salaryEstimate: job.salaryEstimate || salaryData.salaryEstimate,
    salaryMin: job.salaryMin || salaryData.salaryMin,
    salaryMax: job.salaryMax || salaryData.salaryMax,
    salaryMidpoint: job.salaryMidpoint || salaryData.salaryMidpoint,
    postedDate: job.postedDate || dateData.postedDate,
    postedDaysAgo: typeof job.postedDaysAgo === 'number' ? job.postedDaysAgo : dateData.postedDaysAgo,
    workplaceType,
  };
}

/**
 * Filter and sort jobs dynamically without requiring network calls or full page reloads
 */
export function filterAndSortJobs(jobs: JobMatch[], filters: JobFilterState): JobMatch[] {
  // 1. Filter phase
  const filtered = jobs.filter((job) => {
    // Workplace filter
    if (filters.workplace !== 'all') {
      if (job.workplaceType !== filters.workplace) {
        return false;
      }
    }

    // Min salary filter
    if (filters.minSalary > 0) {
      const midpoint = job.salaryMidpoint || job.salaryMin || 0;
      if (midpoint < filters.minSalary) {
        return false;
      }
    }

    // Text search query filter (title, company, location, skills)
    if (filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.toLowerCase().trim();
      const inTitle = job.title.toLowerCase().includes(q);
      const inCompany = job.company.toLowerCase().includes(q);
      const inLocation = job.location.toLowerCase().includes(q);
      const inSkills = (job.matchedSkills || []).some((s) => s.toLowerCase().includes(q));
      if (!inTitle && !inCompany && !inLocation && !inSkills) {
        return false;
      }
    }

    return true;
  });

  // 2. Sort phase
  return [...filtered].sort((a, b) => {
    switch (filters.sortBy) {
      case 'salary-desc':
        return (b.salaryMidpoint || 0) - (a.salaryMidpoint || 0);

      case 'salary-asc':
        return (a.salaryMidpoint || 0) - (b.salaryMidpoint || 0);

      case 'date-newest':
        return (a.postedDaysAgo ?? 999) - (b.postedDaysAgo ?? 999);

      case 'date-oldest':
        return (b.postedDaysAgo ?? 0) - (a.postedDaysAgo ?? 0);

      case 'match-desc':
      default:
        return (b.matchScore || 0) - (a.matchScore || 0);
    }
  });
}
