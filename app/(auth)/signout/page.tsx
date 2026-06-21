'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignOutPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    // Auto sign out after 3 seconds
    const timer = setTimeout(() => {
      setIsSigningOut(true);
      signOut({ 
        callbackUrl: '/login',
        redirect: true 
      });
    }, 3000);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
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
            {isSigningOut ? (
              // Signing out state
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Signing Out...</h2>
                <p className="text-gray-500 text-sm">Please wait while we sign you out.</p>
              </>
            ) : (
              // Countdown state
              <>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">See You Soon!</h2>
                <p className="text-gray-500 text-sm mb-4">
                  You are being signed out in <span className="font-bold text-blue-600 text-lg">{countdown}</span> seconds
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => {
                    setIsSigningOut(true);
                    signOut({ callbackUrl: '/login', redirect: true });
                  }}
                  className="mt-6 text-sm text-blue-600 hover:text-blue-700 transition"
                >
                  Sign out now →
                </button>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 text-center">
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600 transition">
              ← Go back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}