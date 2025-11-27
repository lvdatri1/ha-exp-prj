import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Energy Data Dashboard",
  description: "Real-time energy consumption analytics and forecasting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
