import React from "react";

export interface RecentUserItem {
  id: number;
  username: string;
  created_at: string; // ISO
}

export interface RecentPlanItem {
  id: number;
  retailer: string;
  name: string;
  updated_at: string; // ISO
}

interface RecentListProps {
  title: string;
  emptyText?: string;
  items: Array<RecentUserItem | RecentPlanItem>;
  type: "users" | "plans";
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-NZ", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit" })
  );
}

export function RecentList({ title, emptyText, items, type }: RecentListProps) {
  const isUsers = type === "users";
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">
        {items && items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((item) => {
              const anyItem: any = item;
              return (
                <li
                  key={anyItem.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isUsers ? "bg-blue-100" : "bg-green-100"
                      }`}
                    >
                      {isUsers ? (
                        <span className="text-sm font-semibold text-blue-600">
                          {anyItem.username.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {isUsers ? anyItem.username : `${anyItem.retailer} - ${anyItem.name}`}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {isUsers ? formatDateTime(anyItem.created_at) : `Updated ${formatDateTime(anyItem.updated_at)}`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full ml-2 flex-shrink-0 font-medium ${
                      isUsers ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    #{anyItem.id}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-8">{emptyText || "No items"}</p>
        )}
      </div>
    </div>
  );
}

export default RecentList;
