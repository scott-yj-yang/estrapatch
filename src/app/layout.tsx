import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "EstaPatch",
  description: "Track your estradiol patch applications with love",
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
        <main className="pb-20">{children}</main>
      </body>
    </html>
  );
}
