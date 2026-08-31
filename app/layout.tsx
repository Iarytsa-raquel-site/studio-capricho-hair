import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio Capricho Hair | Jundiaí",
  description:
    "Cabelos com técnica, cuidado e capricho. Consulte serviços e solicite seu horário no Studio Capricho Hair.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
