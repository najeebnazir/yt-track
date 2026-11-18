import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "yt-track",
  description: "Track your progress through YouTube playlists and courses.",
};

function Logo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
      <rect x="1" y="1" width="18" height="18" rx="5" fill="currentColor" />
      <path d="M8 6.5v7l5.5-3.5z" fill="var(--background)" />
    </svg>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh font-sans antialiased`}>
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              <Logo />
              yt-track
            </Link>
            <span className="text-border-strong" aria-hidden>
              /
            </span>
            <Link href="/" className="text-sm text-muted transition-colors hover:text-foreground">
              Library
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
