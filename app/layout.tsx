import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LeadGen AI",
  description: "AI-Powered LinkedIn Lead Generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-[#0A0A0A] text-white`}
    >
      <body className="min-h-full flex h-screen overflow-hidden selection:bg-indigo-500/30 bg-[#0A0A0A]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative bg-[#0A0A0A]">
          <div className="absolute top-0 z-0 h-full w-full bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]"></div>
          <div className="relative z-10 min-h-full">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
