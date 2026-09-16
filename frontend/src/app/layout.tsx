import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LocationProvider } from "@/context/LocationContext";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Atmosense — Dynamic Open-Meteo Severe Weather Intelligence",
  description: "Severe Weather Nowcasting & Flash-Flood Intelligence Platform powered by Open-Meteo real-time atmospheric feeds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-page text-navy h-screen w-screen overflow-hidden flex`} suppressHydrationWarning>
        <LocationProvider>
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0 h-full relative">
            <Header />
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </main>
        </LocationProvider>
      </body>
    </html>
  );
}
