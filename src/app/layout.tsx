import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TerraSwiftFlow — Gestion immobilière Côte d'Ivoire",
  description:
    "SaaS B2B de gestion immobilière pour lotisseurs et promoteurs ivoiriens. Terrains, maisons VEFA, échéanciers, reçus PDF.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
