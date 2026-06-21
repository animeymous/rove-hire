'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getErrorMessage, getFileUploadErrorMessage, getNetworkErrorMessage } from '@/lib/errors';

interface Job {
  _id: string;
  title: string;
  status: string;
}

export default function AddCandidatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [fetchingJobs, setFetchingJobs] = useState(true);
  const [jobsError, setJobsError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    jobId: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [magicLink, setMagicLink] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs');
        const data = await response.json();
        if (response.ok) {
          setJobs(data.jobs.filter((j: Job) => j.status === 'Open'));
        } else {
          setJobsError(getErrorMessage(response.status, data));
        }
      } catch (error) {
        setJobsError(getNetworkErrorMessage(error));
      } finally {
        setFetchingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setResumeFile(file);
      setError('');
    }
  };

  // Upload resume
  const uploadResume = async (): Promise<string | null> => {
    if (!resumeFile) return null;

    setUploading(true);
    const formData = new FormData();
    formData.append('resume', resumeFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(getFileUploadErrorMessage(data));
        setUploading(false);
        return null;
      }

      setUploading(false);
      return data.fileUrl;
    } catch (error) {
      setError(getNetworkErrorMessage(error));
      setUploading(false);
      return null;
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCopied(false);
    setLoading(true);

    try {
      // Upload resume first
      let uploadedResumeUrl = resumeUrl;
      if (resumeFile) {
        const url = await uploadResume();
        if (!url) {
          setLoading(false);
          return;
        }
        uploadedResumeUrl = url;
      }

      // Create candidate
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          jobId: formData.jobId,
          resumeUrl: uploadedResumeUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(response.status, data));
        setLoading(false);
        return;
      }

      setMagicLink(data.magicLink);
      setFormData({ name: '', email: '', jobId: '' });
      setResumeFile(null);
      setResumeUrl('');
      // Reset file input
      const fileInput = document.getElementById('resume') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      setLoading(false);
    } catch (error) {
      setError(getNetworkErrorMessage(error));
      setLoading(false);
    }
  };

  // Copy magic link to clipboard
  const copyMagicLink = async () => {
    try {
      await navigator.clipboard.writeText(magicLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = magicLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (fetchingJobs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-500 text-sm">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/candidates" className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
          ← Back to Candidates
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Candidate</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-3" role="alert">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {magicLink ? (
        // Success state with magic link
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Candidate Added Successfully!</h3>
              <p className="text-sm text-gray-500">Share this magic link with the candidate</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                readOnly
                value={magicLink}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 font-mono focus:outline-none"
                aria-label="Magic link"
              />
              <button
                onClick={copyMagicLink}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2 ${
                  copied 
                    ? 'bg-green-600 text-white' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                setMagicLink('');
                setFormData({ name: '', email: '', jobId: '' });
                setResumeFile(null);
                setCopied(false);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              + Add Another Candidate
            </button>
            <Link
              href={`/candidates`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              View All Candidates
            </Link>
          </div>
        </div>
      ) : (
        // Form
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Candidate Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50/50"
                placeholder="e.g., John Doe"
                aria-required="true"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50/50"
                placeholder="john@example.com"
                aria-required="true"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Job Opening <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.jobId}
                onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50/50"
                aria-required="true"
              >
                <option value="">Select a job...</option>
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title}
                  </option>
                ))}
              </select>
              {jobs.length === 0 && (
                <p className="mt-2 text-sm text-yellow-600 flex items-center gap-1">
                  ⚠️ No open jobs available. Please create a job first.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Resume (PDF) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="resume"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  required={!resumeUrl}
                  aria-required="true"
                />
                {resumeFile && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    ✅ {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
              <p className="mt-1.5 text-xs text-gray-400">Maximum size: 10MB, PDF only</p>
            </div>

            <button
              type="submit"
              disabled={loading || uploading || jobs.length === 0}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </span>
              ) : loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Candidate...
                </span>
              ) : (
                'Add Candidate'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}