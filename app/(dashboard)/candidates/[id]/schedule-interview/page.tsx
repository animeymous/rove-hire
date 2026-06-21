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
  interviewRound?: 'Screening' | 'Technical' | 'Final' | 'Completed';
  interviewCount?: number;
  screeningPassed?: boolean;
  jobId?: { title: string };
}

export default function ScheduleInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [error, setError] = useState('');
  const [allowedRounds, setAllowedRounds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    type: '',
    interviewerName: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCandidateAndCheckRounds();
  }, [id]);

  const fetchCandidateAndCheckRounds = async () => {
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
      
      // Determine allowed rounds based on candidate's progress
      const allowed = getAllowedRounds(data.candidate);
      setAllowedRounds(allowed);
      if (allowed.length > 0) {
        setFormData(prev => ({ ...prev, type: allowed[0] }));
      }
    } catch (error) {
      setError(getNetworkErrorMessage(error));
    } finally {
      setFetching(false);
    }
  };

  const getAllowedRounds = (candidate: any): string[] => {
    // If candidate has no interviews completed, only allow Screening
    if (!candidate.interviewCount || candidate.interviewCount === 0) {
      return ['Screening'];
    }
    
    // Check if screening was passed
    if (candidate.screeningPassed) {
      // If screening passed, check current round
      if (candidate.interviewRound === 'Screening' || candidate.interviewRound === 'Technical') {
        return ['Technical'];
      }
      if (candidate.interviewRound === 'Final') {
        return ['Final'];
      }
    }
    
    // If screening not passed
    if (!candidate.screeningPassed) {
      return ['Screening'];
    }
    
    // Default fallback
    return ['Screening'];
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.date) errors.date = 'Date is required';
    if (!formData.time) errors.time = 'Time is required';
    if (!formData.type) errors.type = 'Interview round is required';
    if (!formData.interviewerName.trim()) errors.interviewerName = 'Interviewer name is required';
    
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

    setSubmitting(true);

    try {
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(response.status, data));
        setSubmitting(false);
        return;
      }

      // Success - redirect to candidate profile
      router.push(`/candidates/${id}?tab=timeline`);
    } catch (error) {
      setError(getNetworkErrorMessage(error));
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
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
          onClick={fetchCandidateAndCheckRounds}
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
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-8 py-5">
          <h1 className="text-xl font-bold text-white">Schedule Interview</h1>
          <p className="text-blue-100 text-sm mt-0.5">
            Scheduling interview for <strong className="text-white">{candidate.name}</strong>
          </p>
        </div>

        <div className="px-8 py-6">
          {/* Progress Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              📌 <strong>Current Progress:</strong>
              {candidate.interviewCount === 0 ? ' No interviews completed yet' : (
                <>
                  {' '}{candidate.interviewCount} interview(s) completed
                  {candidate.screeningPassed && ' ✅ Screening passed'}
                  {candidate.interviewRound && ` | Current Round: ${candidate.interviewRound}`}
                </>
              )}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Allowed rounds: <strong>{allowedRounds.join(', ') || 'None'}</strong>
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
            {/* Interview Round */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Interview Round <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                required
                value={formData.type}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border ${formErrors.type ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all bg-white`}
              >
                <option value="">Select round...</option>
                {allowedRounds.map((round) => (
                  <option key={round} value={round}>
                    {round}
                  </option>
                ))}
              </select>
              {formErrors.type && (
                <p className="mt-1.5 text-sm text-red-600">{formErrors.type}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2.5 border ${formErrors.date ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all bg-white`}
              />
              {formErrors.date && (
                <p className="mt-1.5 text-sm text-red-600">{formErrors.date}</p>
              )}
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="time"
                required
                value={formData.time}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border ${formErrors.time ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all bg-white`}
              />
              {formErrors.time && (
                <p className="mt-1.5 text-sm text-red-600">{formErrors.time}</p>
              )}
            </div>

            {/* Interviewer Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Interviewer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="interviewerName"
                required
                value={formData.interviewerName}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border ${formErrors.interviewerName ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all bg-white`}
                placeholder="e.g., John Smith"
              />
              {formErrors.interviewerName && (
                <p className="mt-1.5 text-sm text-red-600">{formErrors.interviewerName}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Notes <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                placeholder="Any additional notes about the interview..."
              />
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
                disabled={submitting || allowedRounds.length === 0}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-500/20"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Scheduling...
                  </span>
                ) : (
                  'Schedule Interview'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}