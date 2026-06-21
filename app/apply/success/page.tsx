'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ApplicationSuccessPage() {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted! 🎉</h2>
            <p className="text-gray-600 text-sm mb-2">
              Thank you for completing your application.
            </p>
            <p className="text-gray-500 text-sm">
              The HR team will review your application and contact you soon.
            </p>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-gray-600">
                What happens next?
              </p>
              <ul className="mt-2 text-sm text-gray-500 space-y-1 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  HR reviews your application
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  You may be contacted for an interview
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  Check your email for updates
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-400 mb-2">
                Redirecting to home in {countdown}s
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-green-600 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                />
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
              ROVE · Application Received
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}