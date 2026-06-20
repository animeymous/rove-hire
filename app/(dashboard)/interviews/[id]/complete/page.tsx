'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Interview {
  _id: string;
  candidateId: {
    _id: string;
    name: string;
    email: string;
  };
  date: string;
  time: string;
  type: 'Screening' | 'Technical';
  interviewerName: string;
  status: string;
  notes?: string;
}

export default function CompleteInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    feedback: '',
    recommendation: 'Maybe',
    status: 'Completed',
  });

  useEffect(() => {
    if (id) {
      fetchInterview();
    }
  }, [id]);

  const fetchInterview = async () => {
    try {
      // Use the single endpoint with query parameter
      const response = await fetch(`/api/interviews/single?id=${id}`);
      const data = await response.json();
      if (response.ok) {
        setInterview(data.interview);
      } else {
        setError(data.error || 'Failed to fetch interview');
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
      setError('Failed to fetch interview');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use the single endpoint with query parameter for PATCH
      const response = await fetch(`/api/interviews/single?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/candidates/${interview?.candidateId._id}`);
      } else {
        setError(data.error || 'Failed to complete interview');
      }
    } catch (error) {
      setError('Failed to complete interview');
    } finally {
      setLoading(false);
    }
  };

  if (!interview && !error) {
    return <div className="text-center py-8">Loading interview details...</div>;
  }

  if (error && !interview) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <Link href="/interviews" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          ← Back to Interviews
        </Link>
      </div>
    );
  }

  if (!interview) {
    return <div className="text-center py-8">Interview not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/candidates/${interview.candidateId._id}`} className="text-blue-600 hover:text-blue-800">
          ← Back to Candidate Profile
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Interview</h1>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Candidate</p>
              <p className="font-medium">{interview.candidateId.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Interviewer</p>
              <p className="font-medium">{interview.interviewerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{new Date(interview.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Time</p>
              <p className="font-medium">{interview.time}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Recommendation *
            </label>
            <select
              required
              value={formData.recommendation}
              onChange={(e) => setFormData({ ...formData, recommendation: e.target.value as 'Hire' | 'No Hire' | 'Maybe' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Hire">✅ Hire</option>
              <option value="Maybe">🤔 Maybe</option>
              <option value="No Hire">❌ No Hire</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Feedback / Notes *
            </label>
            <textarea
              required
              rows={4}
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              placeholder="Provide detailed feedback about the interview..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push(`/candidates/${interview.candidateId._id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Complete Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}