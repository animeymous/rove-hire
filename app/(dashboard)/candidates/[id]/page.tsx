'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Candidate {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  currentRole?: string;
  noticePeriod?: string;
  salaryExpectation?: string;
  linkedinUrl?: string;
  status: string;
  resumeUrl?: string;
  jobId: { 
    _id: string;
    title: string;
  };
  magicLinkToken?: string;
  isMagicLinkUsed?: boolean;
  interviewRound?: 'Screening' | 'Technical' | 'Final' | 'Completed';
  interviewCount?: number;
  screeningPassed?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TimelineEvent {
  _id: string;
  type: string;
  description: string;
  metadata?: any;
  createdAt: string;
}

export default function CandidateProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [offerDoc, setOfferDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchCandidate();
    }
  }, [id]);

  const fetchCandidate = async () => {
    try {
      const response = await fetch(`/api/candidates/single?id=${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setCandidate(data.candidate);
        setTimeline(data.timeline || []);
        setOfferDoc(data.offerDoc);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching candidate:', error);
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

  const getTimelineIcon = (type: string) => {
    const icons: Record<string, string> = {
      'APPLIED': '📝',
      'FORM_SUBMITTED': '📋',
      'INTERVIEW_SCHEDULED': '📅',
      'INTERVIEW_COMPLETED': '✅',
      'OFFER_SENT': '📄',
      'HIRED': '🎉',
      'REJECTED': '❌',
      'NOTE_ADDED': '📌',
    };
    return icons[type] || '📌';
  };

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    try {
      const response = await fetch(`/api/candidates/single?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          reason 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        fetchCandidate();
        alert(`✅ Candidate ${newStatus.toLowerCase()} successfully!`);
      } else {
        alert(`❌ Error: ${data.error || 'Failed to update status'}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('❌ Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading candidate profile...</div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Candidate not found</h2>
        <Link href="/candidates" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          ← Back to candidates
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back button */}
      <div className="mb-4">
        <Link href="/candidates" className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
          ← Back to Candidates
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
            <p className="text-gray-600">{candidate.email}</p>
            <p className="text-sm text-gray-500 mt-1">
              Applied for: <span className="font-medium text-gray-700">{candidate.jobId?.title || 'N/A'}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(candidate.status)} flex items-center gap-2`}>
              <span>{getStatusEmoji(candidate.status)}</span>
              {candidate.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Overview
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 px-1 font-medium text-sm transition-colors ${
              activeTab === 'timeline'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⏱️ Timeline ({timeline.length})
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`pb-3 px-1 font-medium text-sm transition-colors ${
              activeTab === 'actions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚡ Actions
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-gray-400 text-lg">📞</span>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm text-gray-800">{candidate.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-400 text-lg">📍</span>
                <div>
                  <p className="text-xs text-gray-400">Location</p>
                  <p className="text-sm text-gray-800">{candidate.location || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-400 text-lg">💼</span>
                <div>
                  <p className="text-xs text-gray-400">Current Role</p>
                  <p className="text-sm text-gray-800">{candidate.currentRole || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-400 text-lg">⏰</span>
                <div>
                  <p className="text-xs text-gray-400">Notice Period</p>
                  <p className="text-sm text-gray-800">{candidate.noticePeriod || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-400 text-lg">💰</span>
                <div>
                  <p className="text-xs text-gray-400">Salary Expectation</p>
                  <p className="text-sm text-gray-800">{candidate.salaryExpectation || 'Not provided'}</p>
                </div>
              </div>
              {candidate.linkedinUrl && (
                <div className="flex items-start gap-3">
                  <span className="text-gray-400 text-lg">🔗</span>
                  <div>
                    <p className="text-xs text-gray-400">LinkedIn</p>
                    <a 
                      href={candidate.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View Profile →
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Documents & Magic Link */}
          <div className="space-y-6">
            {/* Magic Link */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">🔗 Application Link</h3>
              {!candidate?.isMagicLinkUsed && candidate?.magicLinkToken ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/apply/${candidate.magicLinkToken}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-600"
                  />
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/apply/${candidate.magicLinkToken}`;
                      navigator.clipboard.writeText(link);
                      alert('✅ Magic link copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm whitespace-nowrap"
                  >
                    📋 Copy Link
                  </button>
                </div>
              ) : candidate.isMagicLinkUsed ? (
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <span>✅</span> Candidate has already submitted the application
                </p>
              ) : (
                <p className="text-sm text-gray-400">No magic link available</p>
              )}
            </div>

            {/* Resume */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">📄 Documents</h3>
              {candidate.resumeUrl ? (
                <a
                  href={candidate.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                >
                  📄 Download Resume
                </a>
              ) : (
                <p className="text-sm text-gray-400">No resume uploaded</p>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">Applied On</p>
                <p className="text-sm text-gray-800 mt-1">
                  {new Date(candidate.createdAt).toLocaleDateString()} at {new Date(candidate.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {timeline.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No timeline events yet</p>
          ) : (
            <div className="space-y-4">
              {timeline.map((event) => (
                <div key={event._id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="text-2xl w-10 text-center flex-shrink-0">{getTimelineIcon(event.type)}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(event.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Available Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Schedule Interview - Show for Applied, Form Submitted, or Interview Scheduled with pending round */}
            {(candidate.status === 'Applied' || 
              candidate.status === 'Form Submitted' || 
              (candidate.status === 'Interview Scheduled' && candidate.interviewRound !== 'Completed')) && (
              <button
                onClick={() => router.push(`/candidates/${id}/schedule-interview`)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                📅 Schedule {candidate.interviewRound && candidate.interviewRound !== 'Screening' ? `${candidate.interviewRound} ` : ''}Interview
              </button>
            )}

            {/* Mark as Hired - Show when status is "Ready to Offer" */}
            {candidate.status === 'Ready to Offer' && (
              <button
                onClick={() => handleStatusChange('Hired')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                🎉 Mark as Hired
              </button>
            )}

            {/* Generate Offer - Show when status is "HIRED" */}
            {candidate.status === 'Hired' && (
              <button
                onClick={() => router.push(`/candidates/${id}/generate-offer`)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                📄 Generate Offer Documents
              </button>
            )}

            {/* Download Offer Documents - Show when status is "Offer Sent" */}
            {candidate.status === 'Offer Sent' && offerDoc && (
              <div className="col-span-full bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-3">✅ Offer Documents Ready</h4>
                <div className="flex flex-wrap gap-3">
                  {offerDoc.offerLetterUrl && (
                    <a
                      href={`/api/offers/download?candidateId=${candidate._id}&type=offer`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition text-sm font-medium"
                    >
                      📄 Download Offer Letter
                    </a>
                  )}
                  {offerDoc.ndaUrl && (
                    <a
                      href={`/api/offers/download?candidateId=${candidate._id}&type=nda`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition text-sm font-medium"
                    >
                      📄 Download NDA
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Reject - Show for any non-terminal status */}
            {!['Hired', 'Rejected', 'Offer Sent', 'Ready to Offer'].includes(candidate.status) && (
              <button
                onClick={() => {
                  const reason = prompt('Please provide a reason for rejection:');
                  if (reason !== null) {
                    handleStatusChange('Rejected', reason || 'No reason provided');
                  }
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                ❌ Reject Candidate
              </button>
            )}

            {/* Delete - Show for non-hired candidates */}
            {candidate.status !== 'Hired' && candidate.status !== 'Offer Sent' && (
              <button
                onClick={async () => {
                  if (confirm(`⚠️ Are you sure you want to delete ${candidate.name}? This cannot be undone.`)) {
                    try {
                      const response = await fetch(`/api/candidates/single?id=${id}`, {
                        method: 'DELETE',
                      });
                      if (response.ok) {
                        router.push('/candidates');
                      } else {
                        const data = await response.json();
                        alert('❌ Failed to delete: ' + data.error);
                      }
                    } catch (error) {
                      alert('❌ Failed to delete candidate');
                    }
                  }
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
              >
                🗑️ Delete Candidate
              </button>
            )}
          </div>

          {/* Status Messages */}
          <div className="mt-6">
            {candidate.status === 'Ready to Offer' && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-indigo-800">📋 Candidate is ready for offer. Click <strong>"Mark as Hired"</strong> to proceed.</p>
              </div>
            )}

            {candidate.status === 'Hired' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">✅ This candidate has been hired and is ready for offer generation!</p>
              </div>
            )}

            {candidate.status === 'Offer Sent' && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-orange-800">📄 Offer has been sent to the candidate. Download the documents above.</p>
              </div>
            )}

            {candidate.status === 'Rejected' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">❌ This candidate has been rejected.</p>
              </div>
            )}

            {candidate.status === 'Interview Scheduled' && candidate.interviewRound && candidate.interviewRound !== 'Completed' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  🔄 Currently in <strong>{candidate.interviewRound}</strong> round
                  {candidate.interviewCount && ` (Interview #${candidate.interviewCount + 1})`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}