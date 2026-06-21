'use client';

import { useState, useEffect } from 'react';
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
  type: 'Screening' | 'Technical' | 'Final';
  interviewerName: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  round?: 'Screening' | 'Technical' | 'Final';
  notes?: string;
  feedback?: string;
  recommendation?: string;
  createdAt: string;
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchInterviews(currentPage);
  }, [currentPage, filter]);

  const fetchInterviews = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/interviews?page=${page}&limit=${itemsPerPage}&filter=${filter}`);
      const data = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(response.status, data));
        setLoading(false);
        return;
      }

      setInterviews(data.interviews || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (error) {
      setError(getNetworkErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Scheduled': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusEmoji = (status: string) => {
    const emojis: Record<string, string> = {
      'Scheduled': '📅',
      'Completed': '✅',
      'Cancelled': '❌',
    };
    return emojis[status] || '📌';
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'Screening': 'bg-blue-100 text-blue-800',
      'Technical': 'bg-purple-100 text-purple-800',
      'Final': 'bg-indigo-100 text-indigo-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getRecommendationLabel = (recommendation?: string) => {
    if (!recommendation) return null;
    const labels: Record<string, string> = {
      'Pass': '✅ Pass',
      'Fail': '❌ Fail',
      'Ready to Offer': '🎯 Ready to Offer',
      'Hire': '✅ Hire',
      'Maybe': '🤔 Maybe',
      'Reject': '❌ Reject',
    };
    return labels[recommendation] || recommendation;
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-500 text-sm">Loading interviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load interviews</h3>
        <p className="text-gray-500 text-sm max-w-md">{error}</p>
        <button
          onClick={() => fetchInterviews(currentPage)}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
          <p className="text-gray-500 text-sm">Manage all scheduled interviews</p>
        </div>
        <div className="flex gap-2">
          {['all', 'upcoming', 'completed'].map((option) => (
            <button
              key={option}
              onClick={() => handleFilterChange(option)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === option
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
              {option === 'all' && ` (${totalItems})`}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {interviews.length} of {totalItems} interviews
        {filter !== 'all' && ` (filtered: ${filter})`}
      </div>

      {/* Interviews Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {interviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-gray-500">No interviews found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter !== 'all' ? `No ${filter} interviews` : 'Schedule an interview from a candidate\'s profile.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Interviewer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Decision</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {interviews.map((interview) => {
                  const candidateName = interview.candidateId?.name || 'Unknown Candidate';
                  const candidateId = interview.candidateId?._id || '';
                  const recommendation = getRecommendationLabel(interview.recommendation);

                  return (
                    <tr key={interview._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        {candidateId ? (
                          <Link
                            href={`/candidates/${candidateId}`}
                            className="font-medium text-gray-900 hover:text-blue-600 transition"
                          >
                            {candidateName}
                          </Link>
                        ) : (
                          <span className="font-medium text-gray-400">{candidateName}</span>
                        )}
                        <p className="text-xs text-gray-500">{interview.candidateId?.email || ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{new Date(interview.date).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{interview.time}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadge(interview.type)}`}>
                          {interview.type || interview.round || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {interview.interviewerName || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                          <span>{getStatusEmoji(interview.status)}</span>
                          {interview.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {recommendation ? (
                          <span className="font-medium">{recommendation}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {interview.status === 'Scheduled' && candidateId ? (
                          <Link
                            href={`/interviews/${interview._id}/complete`}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Complete →
                          </Link>
                        ) : interview.status === 'Completed' ? (
                          <span className="text-sm text-gray-400">
                            {interview.feedback ? '✅ Done' : '⚠️ No feedback'}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}