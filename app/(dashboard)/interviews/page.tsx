'use client';

import { useState, useEffect } from 'react';
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
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
  feedback?: string;
  recommendation?: 'Hire' | 'No Hire' | 'Maybe';
  createdAt: string;
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchInterviews(currentPage);
  }, [currentPage, filter]);

  const fetchInterviews = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/interviews?page=${page}&limit=${itemsPerPage}&filter=${filter}`);
      const data = await response.json();
      
      if (response.ok) {
        setInterviews(data.interviews);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
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

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'Screening': 'bg-blue-100 text-blue-800',
      'Technical': 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  if (loading) {
    return <div className="text-center py-8">Loading interviews...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({totalItems})
          </button>
          <button
            onClick={() => handleFilterChange('upcoming')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'upcoming' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => handleFilterChange('completed')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'completed' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {interviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <p className="text-lg">No interviews found</p>
          <p className="text-sm mt-2">Schedule an interview from a candidate's profile.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interviewer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interviews.map((interview) => (
                  <tr key={interview._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link 
                        href={`/candidates/${interview.candidateId._id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {interview.candidateId.name}
                      </Link>
                      <p className="text-xs text-gray-500">{interview.candidateId.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(interview.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">{interview.time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeBadge(interview.type)}`}>
                        {interview.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {interview.interviewerName}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(interview.status)}`}>
                        {interview.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {interview.status === 'Scheduled' && (
                        <Link
                          href={`/interviews/${interview._id}/complete`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Mark Complete
                        </Link>
                      )}
                      {interview.status === 'Completed' && interview.feedback && (
                        <span className="text-gray-500 text-xs">✅ Feedback given</span>
                      )}
                      {interview.status === 'Completed' && !interview.feedback && (
                        <span className="text-gray-500 text-xs">⚠️ No feedback</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
            <div className="text-sm text-gray-500">
              Showing {interviews.length} of {totalItems} interviews
              {filter !== 'all' && ` (filtered: ${filter})`}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="px-4 py-2 flex items-center text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}