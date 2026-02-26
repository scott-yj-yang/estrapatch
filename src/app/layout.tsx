import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import NavBar from "@/components/NavBar";
import NotificationSetup from "@/components/NotificationSetup";
import ReminderPoller from "@/components/ReminderPoller";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "estrapatch",
  description: "Track your estradiol patch applications with love",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "estrapatch",
  },
};

export const viewport: Viewport = {
  themeColor: "#5BCEFA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} font-sans antialiased`}>
        <main className="pb-20">
          {children}
          <footer className="text-center py-4 px-4 mb-4 border-t border-kawaii-pink/20 space-y-3">
            <p className="text-xs text-gray-500 font-medium">
              <a
                href="https://github.com/scott-yj-yang/estrapatch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-kawaii-pink hover:text-kawaii-pink-dark underline"
              >
                GitHub
              </a>
              {" · "}
              <a
                href="https://github.com/scott-yj-yang/estrapatch/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-kawaii-pink hover:text-kawaii-pink-dark underline"
              >
                Request a Feature
              </a>
            </p>
            <p className="text-[10px] text-gray-400 leading-snug max-w-lg mx-auto">
              estrapatch is not a medical device. Estimates are for informational and educational purposes only. Use at your own risk.
            </p>
          </footer>
        </main>
        <NavBar />
        <NotificationSetup />
        <ReminderPoller />
        <Analytics />
      </body>
    </html>
  );
}
