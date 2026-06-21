'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getErrorMessage, getNetworkErrorMessage } from '@/lib/errors';

interface Candidate {
  _id: string;
  name: string;
  email: string;
  status: string;
  jobId?: { title: string };
  location?: string;
}

export default function GenerateOfferPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [offerData, setOfferData] = useState({
    roleTitle: '',
    salaryAmount: '',
    salaryCurrency: 'USD',
    startDate: '',
    reportingManager: '',
    location: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const fetchCandidate = async () => {
    setFetching(true);
    setError('');

    try {
      const response = await fetch(`/api/candidates/single?id=${id}`);
      const data = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(response.status, data));
        setFetching(false);
        return;
      }

      setCandidate(data.candidate);
      // Pre-fill with candidate data
      setOfferData(prev => ({
        ...prev,
        roleTitle: data.candidate.jobId?.title || '',
        location: data.candidate.location || '',
      }));
    } catch (error) {
      setError(getNetworkErrorMessage(error));
    } finally {
      setFetching(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!offerData.roleTitle.trim()) errors.roleTitle = 'Role title is required';
    if (!offerData.salaryAmount || parseFloat(offerData.salaryAmount) <= 0) {
      errors.salaryAmount = 'Valid salary amount is required';
    }
    if (!offerData.startDate) errors.startDate = 'Start date is required';
    if (!offerData.reportingManager.trim()) errors.reportingManager = 'Reporting manager is required';
    if (!offerData.location.trim()) errors.location = 'Location is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/offers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: id,
          ...offerData,
          salaryAmount: parseFloat(offerData.salaryAmount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(response.status, data));
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      
      // Redirect to candidate profile after 3 seconds
      setTimeout(() => {
        router.push(`/candidates/${id}`);
      }, 3000);

    } catch (error) {
      setError(getNetworkErrorMessage(error));
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOfferData({
      ...offerData,
      [name]: value,
    });
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) setError('');
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-500 text-sm">Loading candidate details...</p>
        </div>
      </div>
    );
  }

  if (error && !candidate) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load candidate</h3>
        <p className="text-gray-500 text-sm max-w-md">{error}</p>
        <button
          onClick={fetchCandidate}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-5xl mb-4">👤</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Candidate not found</h3>
        <Link href="/candidates" className="text-blue-600 hover:text-blue-800">
          ← Back to candidates
        </Link>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Offer Documents Generated!</h2>
          <p className="text-gray-600 mb-2">
            The offer letter and NDA have been generated and saved.
          </p>
          <p className="text-sm text-gray-400">
            Redirecting to candidate profile...
          </p>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-green-500 h-1.5 rounded-full animate-pulse w-full"></div>
          </div>
          <Link
            href={`/candidates/${id}`}
            className="inline-block mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            Go to Profile Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <div className="mb-6">
        <Link href={`/candidates/${id}`} className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
          ← Back to Candidate Profile
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-emerald-700 px-8 py-5">
          <h1 className="text-xl font-bold text-white">Generate Offer Documents</h1>
          <p className="text-green-100 text-sm mt-0.5">
            Generating offer for <strong className="text-white">{candidate.name}</strong>
          </p>
        </div>

        <div className="px-8 py-6">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              📄 This will generate an <strong>Offer Letter</strong> and a <strong>Non-Disclosure Agreement (NDA)</strong>
              with the details below. Both documents will be saved as PDFs.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-3" role="alert">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Role Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="roleTitle"
                value={offerData.roleTitle}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border ${formErrors.roleTitle ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all bg-white`}
                placeholder="e.g., Senior Full-Stack Developer"
              />
              {formErrors.roleTitle && (
                <p className="mt-1.5 text-sm text-red-600">{formErrors.roleTitle}</p>
              )}
            </div>

            {/* Salary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Salary Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="salaryAmount"
                  value={offerData.salaryAmount}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border ${formErrors.salaryAmount ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all bg-white`}
                  placeholder="120000"
                  min="0"
                  step="1000"
                />
                {formErrors.salaryAmount && (
                  <p className="mt-1.5 text-sm text-red-600">{formErrors.salaryAmount}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  name="salaryCurrency"
                  value={offerData.salaryCurrency}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                </select>
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={offerData.startDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2.5 border ${formErrors.startDate ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all bg-white`}
              />
              {formErrors.startDate && (
                <p className="mt-1.5 text-sm text-red-600">{formErrors.startDate}</p>
              )}
            </div>

            {/* Reporting Manager */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Reporting Manager <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="reportingManager"
                value={offerData.reportingManager}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border ${formErrors.reportingManager ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all bg-white`}
                placeholder="e.g., John Smith"
              />
              {formErrors.reportingManager && (
                <p className="mt-1.5 text-sm text-red-600">{formErrors.reportingManager}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={offerData.location}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border ${formErrors.location ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all bg-white`}
                placeholder="e.g., San Francisco, CA"
              />
              {formErrors.location && (
                <p className="mt-1.5 text-sm text-red-600">{formErrors.location}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push(`/candidates/${id}`)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-green-500/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  'Generate Offer & NDA'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}