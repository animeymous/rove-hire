'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getErrorMessage, getNetworkErrorMessage } from '@/lib/errors';

interface Candidate {
  _id: string;
  name: string;
  email: string;
  status: string;
  jobId: { title: string };
  createdAt: string;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCandidates(currentPage);
  }, [currentPage, filterStatus]);

  const fetchCandidates = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/candidates?page=${page}&limit=${itemsPerPage}&status=${filterStatus}`
      );
      const data = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(response.status, data));
        setLoading(false);
        return;
      }

      setCandidates(data.candidates || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (error) {
      setError(getNetworkErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // Debounced search would be better, but this works for now
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Applied': 'bg-blue-100 text-blue-800',
      'Form Submitted': 'bg-purple-100 text-purple-800',
      'Interview Scheduled': 'bg-yellow-100 text-yellow-800',
      'Ready to Offer': 'bg-indigo-100 text-indigo-800',
      'Offer Sent': 'bg-orange-100 text-orange-800',
      'Hired': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusEmoji = (status: string) => {
    const emojis: Record<string, string> = {
      'Applied': '📝',
      'Form Submitted': '📋',
      'Interview Scheduled': '📅',
      'Ready to Offer': '✅',
      'Offer Sent': '📄',
      'Hired': '🎉',
      'Rejected': '❌',
    };
    return emojis[status] || '📌';
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch = candidate.name.toLowerCase().includes(search.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === '' || candidate.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-500 text-sm">Loading candidates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load candidates</h3>
        <p className="text-gray-500 text-sm max-w-md">{error}</p>
        <button
          onClick={() => fetchCandidates(currentPage)}
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
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-500 text-sm">Manage all your candidates in one place</p>
        </div>
        <Link
          href="/candidates/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-500/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Candidate
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white min-w-[150px]"
        >
          <option value="">All Status</option>
          <option value="Applied">Applied</option>
          <option value="Form Submitted">Form Submitted</option>
          <option value="Interview Scheduled">Interview Scheduled</option>
          <option value="Ready to Offer">Ready to Offer</option>
          <option value="Offer Sent">Offer Sent</option>
          <option value="Hired">Hired</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {filteredCandidates.length} of {totalItems} candidates
        {filterStatus && ` (filtered: ${filterStatus})`}
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">No candidates found</p>
            <p className="text-sm text-gray-400 mt-1">
              {search || filterStatus ? 'Try adjusting your filters' : 'Add your first candidate to get started!'}
            </p>
            {!search && !filterStatus && (
              <Link
                href="/candidates/new"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add Candidate
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <Link 
                        href={`/candidates/${candidate._id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 transition"
                      >
                        {candidate.name}
                      </Link>
                      <p className="text-xs text-gray-500">{candidate.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {candidate.jobId?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                        <span>{getStatusEmoji(candidate.status)}</span>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(candidate.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/candidates/${candidate._id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
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