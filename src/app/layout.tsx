import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TBO Saathi – Agentic Travel Consultant",
  description: "Multilingual, voice-first AI travel consultant for Indian travellers and travel agents: plan, compare, book and rescue trips.",
};

export const viewport: Viewport = { themeColor: "#0b0f19", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
