import type { Metadata } from "next";
import "./globals.css";
import { TemaProvider } from "@/contexts/TemaContext";

export const metadata: Metadata = {
  title: "Gestão de RH | Hospital Municipal Ronaldo Gazolla",
  description: "Sistema de Gestão de RH",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <TemaProvider>{children}</TemaProvider>
      </body>
    </html>
  );
}

