'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getErrorMessage, getNetworkErrorMessage } from '@/lib/errors';

interface Interview {
  _id: string;
  candidateId: {
    _id: string;
    name: string;
    email: string;
  } | null;
  date: string;
  time: string;
  round: 'Screening' | 'Technical' | 'Final';
  type: 'Screening' | 'Technical' | 'Final';
  interviewerName: string;
  status: string;
  notes?: string;
}

type Recommendation = 'Pass' | 'Fail' | 'Ready to Offer' | 'Maybe' | 'Reject';

export default function CompleteInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    feedback: '',
    recommendation: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInterview();
    }
  }, [id]);

  const fetchInterview = async () => {
    setFetching(true);
    setError('');

    try {
      const response = await fetch(`/api/interviews/single?id=${id}`);
      const data = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(response.status, data));
        setFetching(false);
        return;
      }

      setInterview(data.interview);
    } catch (error) {
      setError(getNetworkErrorMessage(error));
    } finally {
      setFetching(false);
    }
  };

  const getRecommendationsForRound = (round: string): { value: Recommendation; label: string }[] => {
    switch (round) {
      case 'Screening':
        return [
          { value: 'Pass', label: '✅ Pass - Move to Technical' },
          { value: 'Fail', label: '❌ Fail - Reject Candidate' },
        ];
      case 'Technical':
        return [
          { value: 'Ready to Offer', label: '✅ Ready to Offer - Move for HR Approval' },
          { value: 'Maybe', label: '🤔 Maybe - Move to Final' },
          { value: 'Reject', label: '❌ Reject' },
        ];
      case 'Final':
        return [
          { value: 'Ready to Offer', label: '✅ Ready to Offer - Move for HR Approval' },
          { value: 'Maybe', label: '🤔 Maybe - Hold' },
          { value: 'Reject', label: '❌ Reject' },
        ];
      default:
        return [
          { value: 'Pass', label: '✅ Pass' },
          { value: 'Fail', label: '❌ Fail' },
        ];
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.feedback.trim()) errors.feedback = 'Feedback is required';
    if (!formData.recommendation) errors.recommendation = 'Decision is required';
    
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
      const response = await fetch(`/api/interviews/single?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Completed',
          feedback: formData.feedback,
          recommendation: formData.recommendation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(response.status, data));
        setSubmitting(false);
        return;
      }

      // Success message
      let message = '✅ Interview completed successfully!';
      if (data.nextAction) {
        message += `\n\nNext Action: ${data.nextAction}`;
      }
      if (data.nextRound) {
        message += `\nNext Round: ${data.nextRound}`;
      }
      alert(message);
      
      // Redirect to interviews page
      router.push('/interviews');
    } catch (error) {
      setError(getNetworkErrorMessage(error));
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
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
          <p className="text-gray-500 text-sm">Loading interview details...</p>
        </div>
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load interview</h3>
        <p className="text-gray-500 text-sm max-w-md">{error}</p>
        <button
          onClick={fetchInterview}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Interview not found</h3>
        <Link href="/interviews" className="text-blue-600 hover:text-blue-800">
          ← Back to Interviews
        </Link>
      </div>
    );
  }

  const candidateName = interview.candidateId?.name || 'Unknown Candidate';
  const candidateId = interview.candidateId?._id || '';
  const round = interview.round || interview.type || 'Screening';
  const recommendations = getRecommendationsForRound(round);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/interviews" className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
          ← Back to Interviews
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-8 py-5">
          <h1 className="text-xl font-bold text-white">Complete {round} Interview</h1>
          <p className="text-blue-100 text-sm mt-0.5">
            {candidateName} · {interview.interviewerName}
          </p>
        </div>

        <div className="px-8 py-6">
          {/* Interview Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Candidate</p>
                <p className="text-sm font-medium text-gray-900">
                  {candidateId ? (
                    <Link href={`/candidates/${candidateId}`} className="text-blue-600 hover:text-blue-800">
                      {candidateName}
                    </Link>
                  ) : (
                    candidateName
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Interviewer</p>
                <p className="text-sm font-medium text-gray-900">{interview.interviewerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-gray-900">{new Date(interview.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="text-sm font-medium text-gray-900">{interview.time}</p>
              </div>
            </div>
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Recommendation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Decision <span className="text-red-500">*</span>
              </label>
              <select
                name="recommendation"
                required
                value={formData.recommendation}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border ${formErrors.recommendation ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all bg-white`}
              >
                <option value="">Select decision...</option>
                {recommendations.map((rec) => (
                  <option key={rec.value} value={rec.value}>
                    {rec.label}
                  </option>
                ))}
              </select>
              {formErrors.recommendation && (
                <p className="mt-1.5 text-sm text-red-600">{formErrors.recommendation}</p>
              )}
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Feedback / Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                name="feedback"
                required
                rows={4}
                value={formData.feedback}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border ${formErrors.feedback ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all bg-white`}
                placeholder="Provide detailed feedback about the interview..."
              />
              {formErrors.feedback && (
                <p className="mt-1.5 text-sm text-red-600">{formErrors.feedback}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/interviews')}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-green-500/20"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Complete Interview'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}