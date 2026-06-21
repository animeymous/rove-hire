'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ExpiredLinkPage() {
  const [copied, setCopied] = useState(false);

  const handleCopySupportEmail = () => {
    navigator.clipboard.writeText('hr@rovedashcam.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Brand Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-8 py-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl font-bold text-white">R</span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">ROVE</h1>
            </div>
            <p className="text-blue-100 text-sm font-medium tracking-wide">Hire · Manage · Grow</p>
          </div>

          {/* Content */}
          <div className="px-8 py-10 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h2>
            <p className="text-gray-600 text-sm mb-2">
              This application link has expired.
            </p>
            <p className="text-gray-500 text-sm">
              Magic links expire after 14 days for security reasons.
            </p>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                Need a new link? Contact the HR team:
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-mono text-gray-800">hr@rovedashcam.com</span>
                <button
                  onClick={handleCopySupportEmail}
                  className="p-1.5 text-gray-400 hover:text-blue-600 transition"
                  title="Copy email"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Link
              href="/"
              className="inline-block mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              Return to Home
            </Link>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              ROVE · Secure Application Portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}