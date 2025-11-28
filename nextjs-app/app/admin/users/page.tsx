"use client";

import { useEffect, useMemo, useState } from "react";

interface SessionUser {
  id: number;
  username: string;
  email?: string;
  isGuest: boolean;
  isAdmin?: boolean;
}

interface UserRow {
  id: number;
  username: string;
  email?: string;
  is_guest: number;
  is_admin: number;
  created_at: string;
  last_login: string;
}

export default function AdminUsersPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const s = await fetch("/api/auth/session").then((r) => r.json());
        setUser(s.user ?? null);
        if (s.user && s.user.isAdmin) {
          const j = await fetch("/api/admin/users").then((r) => r.json());
          setRows(j.users ?? []);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const canAdmin = useMemo(() => user && user.isAdmin === true, [user]);

  async function toggleAdmin(id: number, current: number) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: current === 1 ? false : true }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Failed to update");
      }
      const j = await res.json();
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_admin: j.user.is_admin } : r)));
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }

  if (loading) return <div className="p-4">Loading…</div>;
  if (!user) return <div className="p-4">Please log in to continue.</div>;
  if (!canAdmin) return <div className="p-4">Access denied: Admins only.</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Manage Users</h1>
      {error && <div className="text-red-600">{error}</div>}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Guest</th>
            <th>Admin</th>
            <th>Created</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td>{r.id}</td>
              <td>{r.username}</td>
              <td>{r.email ?? ""}</td>
              <td>{r.is_guest === 1 ? "Yes" : "No"}</td>
              <td>{r.is_admin === 1 ? "Yes" : "No"}</td>
              <td>{new Date(r.created_at).toLocaleString()}</td>
              <td>{new Date(r.last_login).toLocaleString()}</td>
              <td>
                <button className="px-2 py-1 border rounded" onClick={() => toggleAdmin(r.id, r.is_admin)}>
                  {r.is_admin === 1 ? "Revoke Admin" : "Make Admin"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
