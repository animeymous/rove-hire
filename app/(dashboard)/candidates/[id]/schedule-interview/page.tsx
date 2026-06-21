'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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

  useEffect(() => {
    fetchCandidateAndCheckRounds();
  }, [id]);

  const fetchCandidateAndCheckRounds = async () => {
    try {
      const response = await fetch(`/api/candidates/single?id=${id}`);
      const data = await response.json();
      if (response.ok) {
        setCandidate(data.candidate);
        
        // Determine allowed rounds based on candidate's progress
        const allowed = getAllowedRounds(data.candidate);
        setAllowedRounds(allowed);
        if (allowed.length > 0) {
          setFormData(prev => ({ ...prev, type: allowed[0] }));
        }
      }
    } catch (error) {
      console.error('Error fetching candidate:', error);
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
    
    // If screening failed or not passed yet
    if (!candidate.screeningPassed) {
      return ['Screening'];
    }
    
    // Default fallback
    return ['Screening'];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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

      if (response.ok) {
        router.push(`/candidates/${id}?tab=timeline`);
      } else {
        setError(data.error || 'Failed to schedule interview');
      }
    } catch (error) {
      setError('Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!candidate) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/candidates/${id}`} className="text-blue-600 hover:text-blue-800">
          ← Back to Candidate Profile
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Schedule Interview</h1>
        <p className="text-gray-600 mb-6">
          Scheduling interview for <strong>{candidate.name}</strong>
        </p>

        {/* Show current progress */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            📌 Current Progress:
            {candidate.interviewCount === 0 && ' No interviews completed yet'}
            {candidate.interviewCount && candidate.interviewCount > 0 && (
              <>
                {' '}{candidate.interviewCount} interview(s) completed
                {candidate.screeningPassed && ' ✅ Screening passed'}
                {candidate.interviewRound && ` | Current Round: ${candidate.interviewRound}`}
              </>
            )}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Allowed rounds: {allowedRounds.join(', ')}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Interview Round *</label>
            <select
              name="type"
              required
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select round...</option>
              {allowedRounds.map((round) => (
                <option key={round} value={round}>
                  {round}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date *</label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Time *</label>
            <input
              type="time"
              name="time"
              required
              value={formData.time}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Interviewer Name *</label>
            <input
              type="text"
              name="interviewerName"
              required
              value={formData.interviewerName}
              onChange={handleChange}
              placeholder="e.g., John Smith"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes about the interview..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push(`/candidates/${id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || allowedRounds.length === 0}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}