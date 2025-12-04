"use client";

import { useEffect, useState } from "react";

interface User {
  id: number;
  username: string;
  email?: string;
  is_guest: number;
  is_admin: number;
  created_at: string;
}

interface SessionUser {
  id: number;
  username: string;
  email?: string;
  isGuest: boolean;
  isAdmin?: boolean;
}

export default function UsersAdminPage() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const s = await fetch("/api/auth/session").then((r) => r.json());
        setCurrentUser(s.user ?? null);
        if (s.user && s.user.isAdmin) {
          const response = await fetch("/api/admin/users");
          if (!response.ok) throw new Error("Failed to load users");
          const data = await response.json();
          setUsers(data.users ?? []);
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

  async function toggleAdmin(userId: number, currentIsAdmin: number) {
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_admin: currentIsAdmin === 1 ? 0 : 1 }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user");
      }

      const data = await response.json();
      setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }

  async function deleteUser(userId: number) {
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete user");
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center text-2xl">👥 User Management</h2>
            <p className="text-base-content/70">Authentication Required</p>
            <div className="divider"></div>
            <p>Please log in to access the user management panel.</p>
            <div className="card-actions justify-center">
              <a href="/" className="btn btn-primary">
                Go to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser.isAdmin) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center text-2xl">👥 User Management</h2>
            <p className="text-error font-semibold">Access Denied</p>
            <div className="divider"></div>
            <p>You need administrator privileges to manage users.</p>
            <div className="card-actions justify-center">
              <a href="/" className="btn btn-primary">
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 admin-layout">
      <div className="w-full max-w-[1200px] mx-auto px-4 lg:px-6 py-4 lg:py-6">
        {/* Header Card */}
        <div className="card bg-gradient-to-r from-primary to-secondary text-white shadow-xl mb-6">
          <div className="card-body">
            <h1 className="card-title text-3xl font-bold">👥 User Management</h1>
            <p className="text-white/80">Manage users and administrator privileges</p>
            {currentUser && (
              <div className="flex items-center gap-3 mt-2">
                <div className="badge badge-lg bg-white/20 border-white/30">
                  👤 {currentUser.username} {currentUser.isGuest && "(Guest)"}
                </div>
                <a
                  href="/admin"
                  className="btn btn-sm btn-outline text-white border-white/30 hover:bg-white hover:text-primary"
                >
                  Back to Dashboard
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stats shadow">
            <div className="stat bg-gradient-to-br from-primary to-primary/80 text-white">
              <div className="stat-title text-white/80">Total Users</div>
              <div className="stat-value">{users.length}</div>
              <div className="stat-desc text-white/70">All registered users</div>
            </div>
          </div>
          <div className="stats shadow">
            <div className="stat bg-gradient-to-br from-secondary to-secondary/80 text-white">
              <div className="stat-title text-white/80">Administrators</div>
              <div className="stat-value">{users.filter((u) => u.is_admin === 1).length}</div>
              <div className="stat-desc text-white/70">Admin accounts</div>
            </div>
          </div>
          <div className="stats shadow">
            <div className="stat bg-gradient-to-br from-accent to-accent/80 text-white">
              <div className="stat-title text-white/80">Guest Users</div>
              <div className="stat-value">{users.filter((u) => u.is_guest === 1).length}</div>
              <div className="stat-desc text-white/70">Temporary accounts</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">All Users</h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-gradient-to-br from-primary to-secondary text-white rounded-full w-10">
                              <span className="text-sm font-bold">{user.username.charAt(0).toUpperCase()}</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold">{user.username}</div>
                            <div className="text-sm text-base-content/50">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>{user.email || "—"}</td>
                      <td>
                        {user.is_guest === 1 ? (
                          <span className="badge badge-warning">Guest</span>
                        ) : (
                          <span className="badge badge-success">Registered</span>
                        )}
                      </td>
                      <td>
                        {user.is_admin === 1 ? (
                          <span className="badge badge-info">Admin</span>
                        ) : (
                          <span className="badge badge-ghost">User</span>
                        )}
                      </td>
                      <td>
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleAdmin(user.id, user.is_admin)}
                            disabled={user.id === currentUser.id}
                            className={`btn btn-sm ${
                              user.id === currentUser.id
                                ? "btn-disabled"
                                : user.is_admin === 1
                                ? "btn-warning"
                                : "btn-info"
                            }`}
                            title={user.id === currentUser.id ? "Cannot modify your own role" : ""}
                          >
                            {user.is_admin === 1 ? "Demote" : "Promote"}
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Are you sure you want to delete user "${user.username}"? This action cannot be undone.`
                                )
                              ) {
                                deleteUser(user.id);
                              }
                            }}
                            disabled={user.id === currentUser.id}
                            className={`btn btn-sm ${user.id === currentUser.id ? "btn-disabled" : "btn-error"}`}
                            title={user.id === currentUser.id ? "Cannot delete yourself" : "Delete user"}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg font-medium text-base-content/50">No users found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
