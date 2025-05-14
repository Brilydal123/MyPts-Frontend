import { ReactQueryProvider } from "@/components/providers/query-provider";
import { NextAuthProvider } from "@/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { NetworkStatusProvider } from "@/contexts/NetworkStatusContext";
import { UserProvider } from "@/contexts/UserContext";
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
              <AuthProvider>
                <UserProvider>
                  <ProfileProvider>
                    <NetworkStatusProvider>
                      <div className="font-manrope">
                        {children}
                      </div>
                      <Toaster
                        position="top-center"
                        richColors
                        closeButton
                        toastOptions={{
                          style: {
                            minWidth: '300px',
                          },
                        }}
                      />
                    </NetworkStatusProvider>
                  </ProfileProvider>
                </UserProvider>
              </AuthProvider>
            </ThemeProvider>
          </ReactQueryProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
