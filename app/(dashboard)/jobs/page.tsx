'use client';

import { useState, useEffect } from 'react';

interface Job {
  _id: string;
  title: string;
  description: string;
  skills: string[];
  status: 'Open' | 'On Hold' | 'Closed';
  createdAt: string;
  candidateCount?: number;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: '',
    status: 'Open',
  });

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      if (response.ok) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
          status: formData.status,
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({ title: '', description: '', skills: '', status: 'Open' });
        fetchJobs();
      }
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchJobs();
      }
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setShowDeleteConfirm(null);
        fetchJobs();
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('❌ Failed to delete job');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Open': 'bg-green-100 text-green-800',
      'On Hold': 'bg-yellow-100 text-yellow-800',
      'Closed': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusOptions = (currentStatus: string) => {
    const allStatuses = ['Open', 'On Hold', 'Closed'];
    return allStatuses.filter(s => s !== currentStatus);
  };

  if (loading) {
    return <div className="text-center py-8">Loading jobs...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Job Openings</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          + New Job
        </button>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No jobs created yet</p>
            <p className="text-gray-400 text-sm mt-2">Create your first job opening to start hiring!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Create First Job
            </button>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job._id} className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                  <button
                    onClick={() => setShowDeleteConfirm(job._id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    title="Delete job"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{job.description}</p>
              {job.skills && job.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {job.skills.map((skill, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {job.candidateCount || 0} candidates
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Status Change Dropdown */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Change status:</span>
                  <select
                    value={job.status}
                    onChange={(e) => handleStatusChange(job._id, e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Open">Open</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Job</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this job? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteJob(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create New Job</h2>
            <form onSubmit={handleCreateJob}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Job Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Senior Full-Stack Developer"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Job description..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="React, TypeScript, Node.js"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Open">Open</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Create Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}