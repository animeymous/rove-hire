# ROVE Hire - Internal Recruitment Tool

A full-stack recruitment management application built for ROVE's HR team.

## 🚀 Live Demo

[Insert your deployed URL here]

## 📋 Features

- ✅ HR Authentication (Signup/Login)
- ✅ Job Opening Management (Create, List, Open/Close)
- ✅ Candidate Management with Resume Upload
- ✅ Magic Link Generation for Candidates
- ✅ Public Candidate Application Form
- ✅ Candidate Profile with Timeline
- ✅ Interview Scheduling (Multiple Rounds)
- ✅ Interview Feedback & Recommendations
- ✅ Offer Letter & NDA PDF Generation
- ✅ Mark as Hired/Rejected

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React-PDF** - PDF generation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB Atlas** - Database (via Mongoose)
- **NextAuth.js** - Authentication

### Storage
- **Local File System** - Resume and PDF storage (public/uploads/)

## 🏗️ Project Structure

rove-hire/
├── app/
│ ├── (auth)/ # Authentication pages (login, signup)
│ ├── (dashboard)/ # Protected dashboard pages
│ ├── api/ # API routes
│ ├── apply/ # Public candidate application page
│ └── layout.tsx # Root layout
├── components/ # Reusable components
├── lib/ # Utilities and models
│ ├── models/ # MongoDB models
│ └── mongodb.ts # Database connection
├── public/ # Static files and uploads
│ └── uploads/ # User-uploaded files (resumes, PDFs)
├── types/ # TypeScript type definitions
├── .env.example # Environment variables example
├── middleware.ts # Auth middleware
└── package.json
