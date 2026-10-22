# Canadian Career Pathways & Resume Optimization Platform

A modern, full-stack career acceleration and resume optimization platform designed for professionals navigating the Canadian job market. The application evaluates resumes against Canadian National Occupational Classification (NOC) standards, validates credentials via LinkedIn integration, delivers real-time Canadian job market matches with dynamic filtering, and optimizes resumes for Applicant Tracking Systems (ATS).

---

## 🚀 Key Features

- **LinkedIn Integration & Verified Match**:
  - Live LinkedIn profile and skill analysis.
  - Interactive verification status badge with comprehensive protocol details ("Validated via LinkedIn API", synchronized attributes, REST protocol audit).
  - Dynamic LinkedIn job listings query aligned with verified work history and specialized Canadian NOC codes.
- **Dynamic Job Matching & Filtering Panel**:
  - Sort job matches dynamically without a full-page refresh by:
    - **Salary (Estimate)**: Highest to lowest or entry-level salary ranges.
    - **Posted Date**: Most recent to older postings.
    - **Work Mode**: Remote, Hybrid, or On-site Canadian locations (Toronto, Vancouver, Montreal, Calgary, Ottawa, etc.).
- **Canadian Market Alignment**:
  - Direct mapping to Canadian NOC (National Occupational Classification) codes and TEER categories.
  - Canadian format resume structuring (removing biased demographic details, emphasizing Canadian accomplishments and measurable metrics).
- **Interactive Resume Editor & ATS Scoring**:
  - Real-time ATS readiness scoring against target Canadian job descriptions.
  - Bullet-point optimization and keyword density enhancement.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons
- **Backend / API**: Node.js, Express, TypeScript (TSX)
- **Tooling**: ESLint, Vite Dev Server

---

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or bun

### Installation

1. Clone or download the repository:
   ```bash
   git clone <your-github-repo-url>
   cd <repo-name>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (if any):
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be live at `http://localhost:3000`.

### Building for Production

To create an optimized production build:
```bash
npm run build
```
To run the production server:
```bash
npm start
```

---

## 📄 License

MIT
