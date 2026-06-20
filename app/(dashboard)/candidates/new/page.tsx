'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    jobId: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [magicLink, setMagicLink] = useState('');
  const [error, setError] = useState('');

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs');
        const data = await response.json();
        if (response.ok) {
          setJobs(data.jobs.filter((j: Job) => j.status === 'Open'));
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
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
  const uploadResume = async () => {
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
      if (response.ok) {
        setUploading(false);
        return data.fileUrl;
      } else {
        setError(data.error || 'Failed to upload resume');
        setUploading(false);
        return null;
      }
    } catch (error) {
      setError('Failed to upload resume');
      setUploading(false);
      return null;
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

      if (response.ok) {
        setMagicLink(data.magicLink);
        setFormData({ name: '', email: '', jobId: '' });
        setResumeFile(null);
        setResumeUrl('');
        // Reset file input
        const fileInput = document.getElementById('resume') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setError(data.error || 'Failed to create candidate');
      }
    } catch (error) {
      setError('Failed to create candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Candidate</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {magicLink ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Candidate Added Successfully!</h3>
          <p className="text-sm text-green-700 mb-2">Copy this magic link to share with the candidate:</p>
          <div className="bg-white p-3 rounded border border-green-300 mb-3">
            <code className="text-sm break-all">{magicLink}</code>
          </div>
          <button
            onClick={() => setMagicLink('')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Another Candidate
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Candidate Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Job Opening *</label>
            <select
              required
              value={formData.jobId}
              onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a job</option>
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title}
                </option>
              ))}
            </select>
            {jobs.length === 0 && (
              <p className="text-sm text-yellow-600 mt-1">
                No open jobs available. Please create a job first.
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Resume (PDF) *</label>
            <input
              id="resume"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required={!resumeUrl}
            />
            {resumeFile && (
              <p className="text-sm text-green-600 mt-1">
                Selected: {resumeFile.name}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || uploading || jobs.length === 0}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading Resume...' : loading ? 'Creating Candidate...' : 'Add Candidate'}
          </button>
        </form>
      )}
    </div>
  );
}