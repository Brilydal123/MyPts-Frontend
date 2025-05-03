import { ReactQueryProvider } from "@/components/providers/query-provider";
import { NextAuthProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
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
              <div className="font-manrope">
                {/* <nav className="shadow-sm text-white px-6 py-6 flex items-center justify-between">
                  <Link href="/" className="flex items-center">
                    <Image
                      src="/profilewhite.png"
                      alt="MyPts"
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                    />
                  </Link>
                  <div className="hidden md:flex space-x-4">
                    <Link href="/dashboard" className="hover:underline">
                      Dashboard
                    </Link>
                    <Link href="/buy" className="hover:underline">
                      Buy
                    </Link>
                    <Link href="/sell" className="hover:underline">
                      Sell
                    </Link>
                    <Link href="/transactions" className="hover:underline">
                      Transactions
                    </Link>
                  </div>
                </nav> */}
                {children}
              </div>
              <Toaster position="top-right" richColors />
            </ThemeProvider>
          </ReactQueryProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
