'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">ROVE Hire</h1>
          <p className="text-sm text-gray-400 mt-1">HR Dashboard</p>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard" className="block py-2.5 px-4 rounded hover:bg-gray-800 transition">
                📊 Dashboard
              </Link>
            </li>
            <li>
              <Link href="/candidates" className="block py-2.5 px-4 rounded hover:bg-gray-800 transition">
                👥 Candidates
              </Link>
            </li>
            <li>
              <Link href="/jobs" className="block py-2.5 px-4 rounded hover:bg-gray-800 transition">
                💼 Jobs
              </Link>
            </li>
            <li>
              <Link href="/interviews" className="block py-2.5 px-4 rounded hover:bg-gray-800 transition">
                📅 Interviews
              </Link>
            </li>
            <li>
              <Link href="/candidates/new" className="block py-2.5 px-4 rounded hover:bg-gray-800 transition">
                ➕ Add Candidate
              </Link>
            </li>
            
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400">
            {session?.user?.name}
          </div>
          <button
            onClick={() => router.push('/api/auth/signout')}
            className="mt-2 text-sm text-red-400 hover:text-red-300 transition"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}