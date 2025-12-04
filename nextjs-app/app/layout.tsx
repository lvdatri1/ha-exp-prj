import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HA Energy Portal",
  description: "Real-time energy consumption analytics and forecasting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-base-100">
        {/* Main content area */}
        <main className="p-6 mx-auto w-full max-w-[1200px]">{children}</main>
      </body>
    </html>
  );
}
