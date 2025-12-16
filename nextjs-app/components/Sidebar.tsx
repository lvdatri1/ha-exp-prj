"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const itemClasses = (active: boolean) =>
    `menu-item flex items-center gap-2 px-3 py-2 rounded ${active ? "bg-base-200 font-medium" : "hover:bg-base-200"}`;

  return (
    <aside className="w-64 bg-base-100 border-r border-base-300">
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary/15 text-primary grid place-items-center">⚡</div>
          <span className="font-semibold">FlipHQ — Smarter Power Plans, Lower Bills</span>
        </div>
      </div>
      <nav className="menu p-4">
        <ul className="space-y-1">
          <li>
            <Link href="/" className={itemClasses(pathname === "/")}>
              <span className="size-4 icon-[tabler--home]"></span>
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/data" className={itemClasses(pathname?.startsWith("/data") ?? false)}>
              <span className="size-4 icon-[tabler--table]"></span>
              Data
            </Link>
          </li>
          <li>
            <Link href="/charts" className={itemClasses(pathname?.startsWith("/charts") ?? false)}>
              <span className="size-4 icon-[tabler--chart-line]"></span>
              Charts
            </Link>
          </li>
          <li>
            <Link href="/import" className={itemClasses(pathname?.startsWith("/import") ?? false)}>
              <span className="size-4 icon-[tabler--upload]"></span>
              Import
            </Link>
          </li>
          <li>
            <Link href="/admin" className={itemClasses(pathname?.startsWith("/admin") ?? false)}>
              <span className="size-4 icon-[tabler--settings]"></span>
              Admin
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
