'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function DashboardPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    openJobs: 0,
    interviewsToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch candidates
      const candidatesRes = await fetch('/api/candidates');
      const candidatesData = await candidatesRes.json();
      
      if (candidatesRes.ok && candidatesData.candidates) {
        setCandidates(candidatesData.candidates);
        // Calculate stats
        const total = candidatesData.candidates.length;
        const hired = candidatesData.candidates.filter((c: Candidate) => c.status === 'Hired').length;
        const rejected = candidatesData.candidates.filter((c: Candidate) => c.status === 'Rejected').length;
        const active = total - hired - rejected;
        
        setStats(prev => ({
          ...prev,
          totalCandidates: total,
        }));
      } else {
        console.error('Failed to fetch candidates:', candidatesData);
      }

      // Fetch jobs
      const jobsRes = await fetch('/api/jobs');
      const jobsData = await jobsRes.json();
      
      if (jobsRes.ok && jobsData.jobs) {
        setJobs(jobsData.jobs);
        const openJobs = jobsData.jobs.filter((j: Job) => j.status === 'Open');
        setStats(prev => ({
          ...prev,
          openJobs: openJobs.length,
        }));
      } else {
        console.error('Failed to fetch jobs:', jobsData);
      }

      // Fetch interviews (for today's count)
      const interviewsRes = await fetch('/api/interviews');
      const interviewsData = await interviewsRes.json();
      
      if (interviewsRes.ok && interviewsData.interviews) {
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

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Applied': 'bg-blue-100 text-blue-800',
      'Form Submitted': 'bg-purple-100 text-purple-800',
      'Interview Scheduled': 'bg-yellow-100 text-yellow-800',
      'Offer Sent': 'bg-orange-100 text-orange-800',
      'Hired': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/candidates/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          + Add Candidate
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Candidates</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCandidates}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Open Jobs</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.openJobs}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Interviews Today</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.interviewsToday}</p>
        </div>
      </div>

      {/* Recent Candidates */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Recent Candidates</h2>
          <Link href="/candidates" className="text-sm text-blue-600 hover:text-blue-800">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          {candidates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No candidates yet. Add your first candidate!
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidates.slice(0, 10).map((candidate) => (
                  <tr key={candidate._id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      <Link href={`/candidates/${candidate._id}`}>
                        {candidate.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidate.jobId?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(candidate.status)}`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(candidate.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {candidates.length > 10 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Link href="/candidates" className="text-sm text-blue-600 hover:text-blue-800">
              View all candidates →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}