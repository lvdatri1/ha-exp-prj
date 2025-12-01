import React from "react";
import Link from "next/link";

interface QuickActionCardProps {
  href: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "purple" | "indigo";
}

const gradMap: Record<string, string> = {
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  purple: "from-purple-500 to-purple-600",
  indigo: "from-indigo-500 to-indigo-600",
};

export function QuickActionCard({ href, title, description, icon, color = "blue" }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-lg p-5 shadow-md bg-gradient-to-r ${gradMap[color]} hover:shadow-lg transition-shadow flex items-center`}
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
          {icon || (
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <h3 className="text-lg font-semibold text-white truncate">{title}</h3>
          <p className="text-sm text-blue-100 mt-1 truncate" title={description}>
            {description}
          </p>
        </div>
        <svg
          className="w-6 h-6 text-white flex-shrink-0 transform group-hover:translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export default QuickActionCard;
