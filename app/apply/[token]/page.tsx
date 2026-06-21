'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getErrorMessage, getNetworkErrorMessage } from '@/lib/errors';

interface CandidateData {
  _id: string;
  name: string;
  email: string;
  jobId: { title: string };
  status: string;
}

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    location: '',
    currentRole: '',
    noticePeriod: '',
    salaryExpectation: '',
    linkedinUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Verify the magic link
  useEffect(() => {
    const verifyLink = async () => {
      try {
        const response = await fetch(`/api/public/verify/${token}`);
        const data = await response.json();

        if (!response.ok) {
          // Check if it's an expired link (410) or not found (404)
          if (response.status === 410 || response.status === 404) {
            router.push('/apply/expired');
            return;
          }
          setError(getErrorMessage(response.status, data));
          setVerifying(false);
          setLoading(false);
          return;
        }

        setCandidate(data.candidate);
        setVerifying(false);
        setLoading(false);
      } catch (error) {
        setError(getNetworkErrorMessage(error));
        setVerifying(false);
        setLoading(false);
      }
    };

    if (token) {
      verifyLink();
    }
  }, [token, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error for this field
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    // Validate field
    if (!formData[field as keyof typeof formData]?.trim()) {
      setErrors(prev => ({ ...prev, [field]: 'This field is required' }));
    } else {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const requiredFields = ['phone', 'location', 'currentRole', 'noticePeriod', 'salaryExpectation'];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]?.trim()) {
        newErrors[field] = 'This field is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/public/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for expired/used link
        if (response.status === 410 || response.status === 404) {
          router.push('/apply/expired');
          return;
        }
        setError(getErrorMessage(response.status, data));
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);
      
      // Redirect to success page after 2 seconds
      setTimeout(() => {
        router.push('/apply/success');
      }, 2000);

    } catch (error) {
      setError(getNetworkErrorMessage(error));
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading || verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-500 text-sm">Verifying your link...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 text-sm">{error}</p>
            <Link
              href="/"
              className="inline-block mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state (before redirect)
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Submitting...</h2>
            <p className="text-gray-500 text-sm">Please wait while we process your application.</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-green-500 h-1.5 rounded-full animate-pulse w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-8 py-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-xl font-bold text-white">R</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">ROVE</h1>
            </div>
            <p className="text-blue-100 text-sm font-medium tracking-wide">Application Form</p>
          </div>

          <div className="px-8 py-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Complete Your Application</h2>
              <p className="text-gray-600 text-sm mt-1">
                Hello <strong>{candidate?.name}</strong>! Please complete your application for{' '}
                <strong>{candidate?.jobId?.title}</strong>.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-3" role="alert">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={() => handleBlur('phone')}
                  className={`w-full px-4 py-3 border ${errors.phone ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all bg-gray-50/50`}
                  placeholder="+1 (555) 123-4567"
                  aria-required="true"
                />
                {errors.phone && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Current Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  onBlur={() => handleBlur('location')}
                  className={`w-full px-4 py-3 border ${errors.location ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all bg-gray-50/50`}
                  placeholder="City, State, Country"
                  aria-required="true"
                />
                {errors.location && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.location}</p>
                )}
              </div>

              {/* Current Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Current Role <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="currentRole"
                  value={formData.currentRole}
                  onChange={handleChange}
                  onBlur={() => handleBlur('currentRole')}
                  className={`w-full px-4 py-3 border ${errors.currentRole ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all bg-gray-50/50`}
                  placeholder="e.g., Senior Software Engineer at Google"
                  aria-required="true"
                />
                {errors.currentRole && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.currentRole}</p>
                )}
              </div>

              {/* Notice Period */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Notice Period <span className="text-red-500">*</span>
                </label>
                <select
                  name="noticePeriod"
                  value={formData.noticePeriod}
                  onChange={handleChange}
                  onBlur={() => handleBlur('noticePeriod')}
                  className={`w-full px-4 py-3 border ${errors.noticePeriod ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all bg-gray-50/50`}
                  aria-required="true"
                >
                  <option value="">Select notice period</option>
                  <option value="Immediate">Immediate</option>
                  <option value="1 Week">1 Week</option>
                  <option value="2 Weeks">2 Weeks</option>
                  <option value="1 Month">1 Month</option>
                  <option value="2 Months">2 Months</option>
                  <option value="3 Months">3 Months</option>
                </select>
                {errors.noticePeriod && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.noticePeriod}</p>
                )}
              </div>

              {/* Salary Expectation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Salary Expectation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="salaryExpectation"
                  value={formData.salaryExpectation}
                  onChange={handleChange}
                  onBlur={() => handleBlur('salaryExpectation')}
                  className={`w-full px-4 py-3 border ${errors.salaryExpectation ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all bg-gray-50/50`}
                  placeholder="e.g., $120,000 USD per year"
                  aria-required="true"
                />
                {errors.salaryExpectation && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.salaryExpectation}</p>
                )}
              </div>

              {/* LinkedIn URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  LinkedIn URL <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50/50"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Application'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}