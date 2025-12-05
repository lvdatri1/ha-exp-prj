"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface SessionUser {
  id: number;
  username: string;
  email?: string;
  isGuest: boolean;
  isAdmin?: boolean;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => setUser(s.user ?? null))
      .catch(console.error);
  }, []);

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      name: "Power Plans",
      href: "/admin/power-plans",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div data-theme="energyadmin" className="min-h-screen bg-base-100">
      {/* Mobile drawer */}
      <input id="admin-drawer-mobile" type="checkbox" className="drawer-toggle" checked={sidebarOpen} onChange={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Mobile navbar */}
      <div className="drawer-content lg:hidden sticky top-0 z-40 bg-base-100 border-b shadow-sm">
        <label htmlFor="admin-drawer-mobile" className="btn btn-ghost btn-square drawer-button">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </label>
        <div className="flex-1 px-4 py-3">
          <Link href="/admin" className="font-bold text-primary text-lg">
            Energy Admin
          </Link>
        </div>
        <div className="flex-none hidden md:flex items-center gap-3 pr-4">
          <div className="avatar placeholder">
            <div className="bg-primary text-white rounded-full w-10">
              <span className="text-sm font-semibold">{user?.username?.charAt(0).toUpperCase() || "A"}</span>
            </div>
          </div>
          <div className="text-sm">
            <div className="font-medium">{user?.username || "Admin"}</div>
            <div className="text-xs opacity-70">{user?.email || "Administrator"}</div>
          </div>
        </div>
      </div>

      {/* Mobile drawer sidebar */}
      <div className="drawer-side z-50 lg:hidden">
        <label htmlFor="admin-drawer-mobile" aria-label="close sidebar" className="drawer-overlay"></label>
        <aside className="w-72 bg-base-200 flex flex-col border-r">
          <div className="px-6 py-4 border-b bg-base-100">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-lg">Energy Admin</span>
            </Link>
          </div>
          <nav className="menu p-4 flex-1 overflow-y-auto">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? "bg-primary text-primary-content" : "hover:bg-base-300"
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {item.icon}
                      <span className="font-medium text-sm">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="p-4 border-t bg-base-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="avatar placeholder">
                <div className="bg-primary text-white rounded-full w-10">
                  <span className="text-sm font-semibold">{user?.username?.charAt(0).toUpperCase() || "A"}</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user?.username || "Admin"}</p>
                <p className="text-xs opacity-70 truncate">{user?.email || "Administrator"}</p>
              </div>
            </div>
            <Link href="/" className="btn btn-outline btn-sm w-full" onClick={() => setSidebarOpen(false)}>
              Back to App
            </Link>
          </div>
        </aside>
      </div>

      {/* Desktop layout: flex with sidebar + content */}
      <div className="flex">
        {/* Desktop sidebar - always visible */}
        <aside className="hidden lg:flex flex-col w-72 bg-base-200 border-r fixed h-screen">
          <div className="px-6 py-4 border-b bg-base-100">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-lg">Energy Admin</span>
            </Link>
          </div>
          <nav className="menu p-4 flex-1 overflow-y-auto">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? "bg-primary text-primary-content" : "hover:bg-base-300"
                      }`}
                    >
                      {item.icon}
                      <span className="font-medium text-sm">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="p-4 border-t bg-base-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="avatar placeholder">
                <div className="bg-primary text-white rounded-full w-10">
                  <span className="text-sm font-semibold">{user?.username?.charAt(0).toUpperCase() || "A"}</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user?.username || "Admin"}</p>
                <p className="text-xs opacity-70 truncate">{user?.email || "Administrator"}</p>
              </div>
            </div>
            <Link href="/" className="btn btn-outline btn-sm w-full">
              Back to App
            </Link>
          </div>
        </aside>

        {/* Main content area - takes remaining space on desktop */}
        <main className="w-full lg:ml-72 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
