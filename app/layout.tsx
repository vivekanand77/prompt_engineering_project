import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import { ThemeProvider } from "@/lib/useTheme";
import { AuthProvider } from "@/lib/useAuth";

// Using system font stack to prevent build failures in restricted environments
const interVariable = "font-inter";

export const metadata: Metadata = {
  title: "Prompt Engineering Hub — Learn · Build · Test",
  description:
    "Master prompt engineering with interactive lessons, a live tokenizer, and professional tools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={interVariable} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>
            <Navbar />
            <main className="page" role="main">
              {children}
            </main>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
