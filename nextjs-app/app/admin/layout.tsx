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

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => setUser(s.user ?? null))
      .catch(console.error);
  }, []);

  const tabs = [
    { name: "Dashboard", href: "/admin" },
    { name: "Power Plans", href: "/admin/power-plans" },
    { name: "Users", href: "/admin/users" },
  ];

  return (
    <div data-theme="energyadmin" className="min-h-screen bg-base-200">
      {/* Header with tabs */}
      <div className="bg-base-100 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="font-bold text-primary text-xl">
                ⚙️ Admin
              </Link>

              {/* Tabs navigation */}
              <nav className="hidden md:flex gap-1">
                {tabs.map((tab) => {
                  const isActive = pathname === tab.href;
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-content"
                          : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                      }`}
                    >
                      {tab.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3">
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
              <Link href="/" className="btn btn-sm btn-ghost">
                Back to App
              </Link>
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="md:hidden pb-3">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-primary text-primary-content"
                        : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                    }`}
                  >
                    {tab.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}
