'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFoundPage() {
  const router = useRouter();

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
            <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
            <p className="text-gray-600 text-sm mb-6">
              The page you're looking for doesn't exist or has been moved.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => router.back()}
                className="w-full px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700"
              >
                ← Go Back
              </button>
              <Link
                href="/dashboard"
                className="block w-full px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium shadow-sm shadow-blue-500/20"
              >
                Go to Dashboard
              </Link>
            </div>
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