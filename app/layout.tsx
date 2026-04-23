import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "STM Radar — Alertas Inteligentes de Milhas",
  description:
    "Não perca mais nenhuma promoção de milhas. O STM Radar monitora o mercado e te avisa quando uma oportunidade bate com seus objetivos.",
  keywords: ["milhas", "pontos", "passagens", "promoções", "alertas", "STM"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "STM Radar",
  },
  openGraph: {
    title: "STM Radar",
    description: "Alertas inteligentes de milhas para a Comunidade STM",
    type: "website",
    locale: "pt_BR",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152.png", sizes: "152x152" },
      { url: "/icons/icon-192.png", sizes: "192x192" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0A1628",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
