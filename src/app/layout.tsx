import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { RoleSwitcher } from "@/components/ui/RoleSwitcher";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Rafiqui - Reciclaje Solar Inteligente",
  description: "Plataforma de reciclaje de paneles solares. Dona, recicla y transforma.",
  keywords: ["reciclaje", "paneles solares", "sostenibilidad", "ESG", "economía circular"],
  icons: {
    icon: "https://res.cloudinary.com/dszhbfyki/image/upload/v1768532345/logo-min.png?v=2",
    shortcut: "https://res.cloudinary.com/dszhbfyki/image/upload/v1768532345/logo-min.png?v=2",
    apple: "https://res.cloudinary.com/dszhbfyki/image/upload/v1768532345/logo-min.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <Navbar />
        <main className="pt-16 min-h-screen">
          {children}
        </main>
        <RoleSwitcher />
      </body>
    </html>
  );
}
