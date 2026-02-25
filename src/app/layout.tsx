import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import NavBar from "@/components/NavBar";
import NotificationSetup from "@/components/NotificationSetup";
import ReminderPoller from "@/components/ReminderPoller";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "EstaPatch",
  description: "Track your estradiol patch applications with love",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EstaPatch",
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
          <footer className="text-center py-3 px-4 border-t border-kawaii-pink/20">
            <p className="text-[10px] text-gray-400 leading-snug max-w-lg mx-auto">
              EstaPatch is not a medical device. Estimates are for informational and educational purposes only. Use at your own risk.
            </p>
          </footer>
        </main>
        <NavBar />
        <NotificationSetup />
        <ReminderPoller />
      </body>
    </html>
  );
}
