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

interface Job {
  _id: string;
  title: string;
  status: string;
  candidateCount?: number;
}

interface Stats {
  totalCandidates: number;
  openJobs: number;
  interviewsToday: number;
  hiredThisMonth: number;
}

export default function DashboardPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCandidates: 0,
    openJobs: 0,
    interviewsToday: 0,
    hiredThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch candidates
      const candidatesRes = await fetch('/api/candidates');
      if (!candidatesRes.ok) {
        const data = await candidatesRes.json();
        setError(getErrorMessage(candidatesRes.status, data));
        setLoading(false);
        return;
      }
      const candidatesData = await candidatesRes.json();
      
      if (candidatesData.candidates) {
        setCandidates(candidatesData.candidates);
        const total = candidatesData.candidates.length;
        const hired = candidatesData.candidates.filter((c: Candidate) => c.status === 'Hired').length;
        
        // Calculate hired this month
        const now = new Date();
        const hiredThisMonth = candidatesData.candidates.filter((c: Candidate) => {
          if (c.status !== 'Hired') return false;
          const hiredDate = new Date(c.createdAt);
          return hiredDate.getMonth() === now.getMonth() && 
                 hiredDate.getFullYear() === now.getFullYear();
        }).length;

        setStats(prev => ({
          ...prev,
          totalCandidates: total,
          hiredThisMonth,
        }));
      }

      // Fetch jobs
      const jobsRes = await fetch('/api/jobs');
      if (!jobsRes.ok) {
        const data = await jobsRes.json();
        setError(getErrorMessage(jobsRes.status, data));
        setLoading(false);
        return;
      }
      const jobsData = await jobsRes.json();
      
      if (jobsData.jobs) {
        setJobs(jobsData.jobs);
        const openJobs = jobsData.jobs.filter((j: Job) => j.status === 'Open');
        setStats(prev => ({
          ...prev,
          openJobs: openJobs.length,
        }));
      }

      // Fetch interviews
      const interviewsRes = await fetch('/api/interviews');
      if (interviewsRes.ok) {
        const interviewsData = await interviewsRes.json();
        if (interviewsData.interviews) {
          const today = new Date().toDateString();
          const todayInterviews = interviewsData.interviews.filter((interview: any) => {
            const interviewDate = new Date(interview.date).toDateString();
            return interviewDate === today && interview.status === 'Scheduled';
          });
          setStats(prev => ({
            ...prev,
            interviewsToday: todayInterviews.length,
          }));
        }
      }

    } catch (error) {
      setError(getNetworkErrorMessage(error));
    } finally {
      setLoading(false);
    }
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load dashboard</h3>
        <p className="text-gray-500 text-sm max-w-md">{error}</p>
        <button
          onClick={fetchDashboardData}
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back! Here's what's happening with your candidates.</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCandidates}</p>
              <p className="text-sm text-gray-500">Total Candidates</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.openJobs}</p>
              <p className="text-sm text-gray-500">Open Jobs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.interviewsToday}</p>
              <p className="text-sm text-gray-500">Interviews Today</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.hiredThisMonth}</p>
              <p className="text-sm text-gray-500">Hired This Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Candidates Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Recent Candidates</h2>
          <Link href="/candidates" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all →
          </Link>
        </div>
        
        {candidates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">No candidates yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your first candidate to get started!</p>
            <Link
              href="/candidates/new"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add Candidate
            </Link>
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
                {candidates.slice(0, 5).map((candidate) => (
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
    </div>
  );
}