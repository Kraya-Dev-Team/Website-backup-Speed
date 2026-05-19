import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import CustomCursor from "@/components/ui/CustomCursor";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SmoothScroll from "@/components/layout/SmoothScroll";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import CartOverlay from "@/components/layout/CartOverlay";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  icons: {
    icon: "/logo-initial.jpeg",
    shortcut: "/logo-initial.jpeg",
    apple: "/logo-initial.jpeg",
  },
  title: "KRAYA — The Art of Invisible Luxury",
  description:
    "Discover KRAYA, a luxury fragrance brand crafting genderless, timeless, and ageless perfumes. From Karma to Moksha — a journey told through essence and molecule.",
  keywords: [
    "Luxury Fragrance", 
    "Perfume", 
    "KRAYA", 
    "Genderless Perfume", 
    "Ageless Perfume", 
    "Karma", 
    "Moksha",
    "Invisible Luxury",
    "Premium Scents"
  ],
  authors: [{ name: "KRAYA" }],
  creator: "KRAYA",
  publisher: "KRAYA",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "KRAYA — The Art of Invisible Luxury",
    description: "Discover KRAYA, a luxury fragrance brand crafting genderless, timeless, and ageless perfumes. From Karma to Moksha — a journey told through essence and molecule.",
    url: "/",
    siteName: "KRAYA",
    images: [
      {
        url: "/demo.png",
        width: 1200,
        height: 630,
        alt: "KRAYA Luxury Perfumes",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KRAYA — The Art of Invisible Luxury",
    description: "Discover KRAYA, a luxury fragrance brand crafting genderless, timeless, and ageless perfumes. From Karma to Moksha — a journey told through essence and molecule.",
    creator: "@kraya",
    images: ["/demo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
  category: "beauty",
  appleWebApp: {
    title: "KRAYA",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kraya-web.vercel.app";
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KRAYA",
    url: siteUrl,
    logo: `${siteUrl}/icon.jpeg`,
    description: "A luxury fragrance brand crafting genderless, timeless, and ageless perfumes.",
    sameAs: [
      process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
      process.env.NEXT_PUBLIC_TWITTER_URL || ""
    ].filter(Boolean)
  };

  return (
    <html lang="en">
      <head>
        {/* Preload the hero LCP image + logo so the browser starts fetching
            them during HTML parse, before React mounts. Saves ~200-500 ms
            of LCP time on cold cache. */}
        <link
          rel="preload"
          as="image"
          href="/home/hero/main.jpeg"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/logo-landscape.svg"
          type="image/svg+xml"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${playfair.variable} ${jakarta.variable} antialiased`}>
        <AuthProvider>
          <CartProvider>
            <CustomCursor />
            <CartOverlay />
            <SmoothScroll>
              <Navbar />
                {children}
              <Footer />
            </SmoothScroll>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
