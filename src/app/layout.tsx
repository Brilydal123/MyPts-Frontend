import { ReactQueryProvider } from "@/components/providers/query-provider";
import { NextAuthProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TokenRefreshProvider } from "@/components/providers/token-refresh-provider";
import { TokenDebugProvider } from "@/components/providers/token-debug-provider";
// import { LoadingProvider } from "@/contexts/loading-context";
// import { ExchangeRateProvider } from "@/contexts/exchange-rate-context";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyPts Manager",
  description: "Manage your MyPts virtual currency",
  icons: {
    icon: "/profileblack.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.className}  antialiased`}>
        <NextAuthProvider>
          <ReactQueryProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
              <TokenDebugProvider>
                <TokenRefreshProvider>
                  <ProfileProvider>
                    {/* <ExchangeRateProvider baseCurrency="USD"> */}
                    {/* <LoadingProvider>/ */}
                    <div className="font-manrope">
                      {children}
                    </div>
                    <Toaster position="top-right" richColors />
                    {/* </LoadingProvider> */}
                    {/* </ExchangeRateProvider> */}
                  </ProfileProvider>
                </TokenRefreshProvider>
              </TokenDebugProvider>
            </ThemeProvider>
          </ReactQueryProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
