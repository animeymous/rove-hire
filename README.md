# ROVE Hire - Internal Recruitment Tool

A full-stack recruitment management application built for ROVE's HR team to manage candidates from application to offer letter generation.

## 🚀 Live Demo

**Production URL:** [https://rove-hire.vercel.app](https://rove-hire.vercel.app)

**Test HR Credentials:**
- Email: `hr@rovedashcam.com`
- Password: `password123`

> ⚠️ **Note:** If the sample data doesn't load, visit `/api/seed` to populate the database with sample jobs and candidates.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [API Routes](#-api-routes)
- [Database Schema](#-database-schema)
- [PDF Generation](#-pdf-generation)
- [Deployment](#-deployment)
- [What I'd Do Next](#-what-id-do-next)
- [Known Issues](#-known-issues)
- [Screenshots](#-screenshots)
- [License](#-license)

---

## ✨ Features

### 🔐 Authentication
- HR sign-up and sign-in with email/password
- Secure session management with NextAuth.js (JWT)
- Protected routes for authenticated users only
- Password hashing with bcryptjs

### 💼 Job Management
- Create job openings with title, description, skills (tags), and status
- Job statuses: Open, On Hold, Closed
- View all jobs with candidate count
- Change job status anytime
- Delete jobs (only if no candidates associated)

### 👤 Candidate Management
- Add candidates manually with resume upload (PDF, max 10MB)
- Associate candidates with job openings
- Resume storage via Vercel Blob Storage
- Candidate statuses: Applied, Form Submitted, Interview Scheduled, Ready to Offer, Offer Sent, Hired, Rejected
- Search candidates by name or email
- Filter candidates by status
- Pagination on candidates list

### 🔗 Magic Link System
- Generate secure one-time-use magic links for candidates
- Links expire after 14 days
- One-time use: link becomes invalid after submission
- Copy magic link from candidate profile or after creation
- Clean "link expired" page with contact information

### 📝 Public Application Form
- No login required for candidates
- Fields: Phone, Location, Current Role, Notice Period, Salary Expectation, LinkedIn URL
- Form validation with Zod
- Auto-redirects to success page after submission
- Status updates to "Form Submitted"

### 📅 Interview Management
- Schedule interviews with date, time, type (Screening/Technical), interviewer name, notes
- Multi-round interview support (Screening → Technical → Final)
- Automated round progression based on recommendations
- Complete interviews with feedback and recommendations
- Feedback options vary by round:
  - Screening: Pass / Fail
  - Technical/Final: Ready to Offer / Maybe / Reject
- Interview status: Scheduled, Completed, Cancelled

### 📄 Offer Generation
- Generate professional Offer Letter and NDA (PDF)
- Customizable fields: Role Title, Salary, Start Date, Reporting Manager, Location
- PDFs stored on Vercel Blob Storage
- Download offer documents from candidate profile
- Candidate status updates to "Offer Sent"

### 📊 Dashboard
- Key metrics: Total Candidates, Open Jobs, Interviews Today, Hired This Month
- Recent candidates list with status badges
- Quick action buttons to add candidates

### ⏱️ Timeline
- Complete activity timeline for each candidate
- Events: Applied, Form Submitted, Interview Scheduled, Interview Completed, Offer Sent, Hired, Rejected
- Metadata stored with each event for detailed history

### 🎨 Design
- Modern, clean UI inspired by Linear/Notion
- Fully responsive (mobile-first)
- Accessibility: ARIA labels, keyboard navigation, focus states
- Consistent design language across all pages
- Loading and error states for all actions

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **TypeScript** | Type safety and better developer experience |
| **Tailwind CSS** | Styling and responsive design |
| **Zod** | Schema validation for forms |
| **React-PDF** | PDF generation (Offer Letter & NDA) |

### Backend
| Technology | Purpose |
|------------|---------|
| **Next.js API Routes** | Serverless API endpoints |
| **MongoDB Atlas** | Database (cloud) |
| **Mongoose** | MongoDB ODM |
| **NextAuth.js** | Authentication (JWT strategy) |
| **bcryptjs** | Password hashing |

### Storage & Hosting
| Technology | Purpose |
|------------|---------|
| **Vercel Blob Storage** | File storage (resumes, PDFs) |
| **Vercel** | Hosting and deployment |

### Development Tools
| Technology | Purpose |
|------------|---------|
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **npm** | Package manager |

### Why This Stack?

- **Next.js**: Full-stack capabilities with App Router, API routes, and server components
- **MongoDB**: Flexible schema, excellent for relational data with embedded documents
- **MongoDB Atlas**: Managed cloud database with built-in backups and monitoring
- **Mongoose**: Clean ODM with schema validation and hooks
- **NextAuth.js**: Easy authentication setup with JWT support
- **Tailwind CSS**: Rapid UI development with consistent styling
- **Vercel Blob Storage**: Simple, scalable file storage integrated with Vercel
- **Zod**: Type-safe validation with excellent TypeScript integration

---

## 📁 Project Structure

rove-hire/
├── app/
│ ├── (auth)/ # Authentication pages
│ │ ├── login/
│ │ │ └── page.tsx # Login page
│ │ ├── signout/
│ │ │ └── page.tsx # Sign out page
│ │ └── signup/
│ │ └── page.tsx # Sign up page
│ ├── (dashboard)/ # Protected dashboard pages
│ │ ├── dashboard/
│ │ │ └── page.tsx # Dashboard with stats
│ │ ├── candidates/
│ │ │ ├── page.tsx # Candidates list (with pagination)
│ │ │ ├── [id]/
│ │ │ │ └── page.tsx # Candidate profile
│ │ │ ├── new/
│ │ │ │ └── page.tsx # Add candidate
│ │ │ └── [id]/
│ │ │ ├── schedule-interview/
│ │ │ │ └── page.tsx # Schedule interview
│ │ │ └── generate-offer/
│ │ │ └── page.tsx # Generate offer
│ │ ├── jobs/
│ │ │ └── page.tsx # Jobs management
│ │ └── interviews/
│ │ ├── page.tsx # Interviews list
│ │ └── [id]/
│ │ └── complete/
│ │ └── page.tsx # Complete interview
│ ├── api/ # API Routes
│ │ ├── auth/
│ │ │ ├── [...nextauth]/
│ │ │ │ └── route.ts # NextAuth configuration
│ │ │ └── signup/
│ │ │ └── route.ts # Signup API
│ │ ├── candidates/
│ │ │ ├── route.ts # GET all, POST new
│ │ │ └── single/
│ │ │ └── route.ts # GET single, PATCH, DELETE
│ │ ├── jobs/
│ │ │ ├── route.ts # GET all, POST new
│ │ │ └── [id]/
│ │ │ └── route.ts # GET single, PATCH status, DELETE
│ │ ├── interviews/
│ │ │ ├── route.ts # GET all, POST new
│ │ │ └── single/
│ │ │ └── route.ts # GET single, PATCH complete
│ │ ├── offers/
│ │ │ ├── generate/
│ │ │ │ └── route.ts # Generate offer PDFs
│ │ │ └── download/
│ │ │ └── route.ts # Download offer PDFs
│ │ ├── public/
│ │ │ ├── verify/
│ │ │ │ └── [token]/
│ │ │ │ └── route.ts # Verify magic link
│ │ │ └── submit/
│ │ │ └── route.ts # Submit application form
│ │ ├── upload/
│ │ │ └── route.ts # File upload (resumes)
│ │ └── seed/
│ │ └── route.ts # Seed sample data
│ ├── apply/ # Public pages
│ │ ├── expired/
│ │ │ └── page.tsx # Link expired page
│ │ ├── success/
│ │ │ └── page.tsx # Application success page
│ │ └── [token]/
│ │ └── page.tsx # Public application form
│ ├── layout.tsx # Root layout
│ ├── providers.tsx # NextAuth provider
│ ├── error.tsx # Global error page
│ └── not-found.tsx # 404 page
├── lib/
│ ├── models/ # Mongoose models
│ │ ├── User.ts # HR user model
│ │ ├── Candidate.ts # Candidate model
│ │ ├── Job.ts # Job model
│ │ ├── Interview.ts # Interview model
│ │ ├── OfferDocument.ts # Offer document model
│ │ └── TimelineEvent.ts # Timeline event model
│ ├── mongodb.ts # MongoDB connection
│ └── errors.ts # Shared error utilities
├── components/ # Reusable components
│ ├── ui/
│ └── layouts/
├── middleware.ts # Auth middleware
├── types/ # TypeScript type definitions
├── public/ # Static files
│ └── uploads/ # User-uploaded files (resumes, PDFs)
├── .env.example # Environment variables template
├── .gitignore # Git ignore
├── package.json # Dependencies
├── tsconfig.json # TypeScript configuration
├── tailwind.config.js # Tailwind CSS configuration
├── next.config.js # Next.js configuration
└── README.md # This file

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Vercel account (for deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rove-hire.git
   cd rove-hire

2. **Install dependencies**
    npm install

3. **Set up environment variables**
    cp .env.example .env.local

4. **Run the development server**
    npm run dev

5. **(Optional) Seed sample data**
    Visit http://localhost:3000/api/seed to populate the database with sample jobs and candidates.

### Environment Variables

   |- Variable	Description	Required
   |- MONGODB_URI	MongoDB Atlas connection string	✅ Yes
   |- NEXTAUTH_SECRET	Secret for NextAuth.js (32+ characters)	✅ Yes
   |- NEXTAUTH_URL	Application URL (http://localhost:3000 for development)	✅ Yes
   |- BLOB_READ_WRITE_TOKEN	Vercel Blob Storage token for file uploads	✅ Yes (for production)
