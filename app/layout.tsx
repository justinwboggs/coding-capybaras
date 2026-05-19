import type { Metadata } from "next";

import { Toaster } from "@/platform/components/ui/sonner";
import { getBranding } from "@/platform/lib/config";

import "./globals.css";

// Title comes from configured branding (configuration over code). Falls back
// to the default app name if platform_config is empty or unreachable.
export async function generateMetadata(): Promise<Metadata> {
  const { appName } = await getBranding();
  return {
    title: appName,
    description: "Ship a real, paying SaaS in a weekend.",
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
