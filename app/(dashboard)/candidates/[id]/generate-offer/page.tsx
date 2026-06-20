'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GenerateOfferPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [candidate, setCandidate] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [offerData, setOfferData] = useState({
    roleTitle: '',
    salaryAmount: '',
    salaryCurrency: 'USD',
    startDate: '',
    reportingManager: '',
    location: '',
  });

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const fetchCandidate = async () => {
    try {
      const response = await fetch(`/api/candidates/single?id=${id}`);
      const data = await response.json();
      if (response.ok) {
        setCandidate(data.candidate);
        // Pre-fill with candidate data
        setOfferData(prev => ({
          ...prev,
          roleTitle: data.candidate.jobId?.title || '',
          location: data.candidate.location || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching candidate:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/offers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: id,
          ...offerData,
          salaryAmount: parseFloat(offerData.salaryAmount),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to candidate profile after 2 seconds
        setTimeout(() => {
          router.push(`/candidates/${id}`);
        }, 3000);
      } else {
        setError(data.error || 'Failed to generate offer');
      }
    } catch (error) {
      setError('Failed to generate offer');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setOfferData({
      ...offerData,
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Generate Offer Documents</h1>
        <p className="text-gray-600 mb-6">
          Generating offer for <strong>{candidate.name}</strong>
        </p>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-green-800 mb-2">Offer Documents Generated!</h2>
            <p className="text-green-700">
              The offer letter and NDA have been generated and saved.
              Redirecting to candidate profile...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Role Title *</label>
              <input
                type="text"
                name="roleTitle"
                required
                value={offerData.roleTitle}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Salary Amount *</label>
                <input
                  type="number"
                  name="salaryAmount"
                  required
                  value={offerData.salaryAmount}
                  onChange={handleChange}
                  placeholder="120000"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency *</label>
                <select
                  name="salaryCurrency"
                  required
                  value={offerData.salaryCurrency}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date *</label>
              <input
                type="date"
                name="startDate"
                required
                value={offerData.startDate}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Reporting Manager *</label>
              <input
                type="text"
                name="reportingManager"
                required
                value={offerData.reportingManager}
                onChange={handleChange}
                placeholder="e.g., John Smith"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location *</label>
              <input
                type="text"
                name="location"
                required
                value={offerData.location}
                onChange={handleChange}
                placeholder="e.g., San Francisco, CA"
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
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Offer & NDA'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}