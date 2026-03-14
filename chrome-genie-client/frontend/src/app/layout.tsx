import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChromeGenie Control Dashboard",
  description: "Advanced Browser Automation Control by InnoSynth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Neutralino client library - only loaded in app mode */}
        <script src="/js/neutralino.js" />
        <script src="/preload.js" />
      </head>
      <body
        className={`${inter.variable} ${mono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
