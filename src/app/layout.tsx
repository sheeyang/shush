import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shush-sidebar";
import { cookies } from "next/headers"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shush App",
  description: "Command line utilities in the browser",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}  >
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <div className="flex-1 relative">
            <SidebarTrigger className="absolute top-2 left-2 z-10 size-10" />
            <div className="flex justify-center items-start w-full p-8">
              {children}
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
