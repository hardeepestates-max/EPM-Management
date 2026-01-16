import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Elevate Property Management | Cliffside Park & North Jersey Property Management",
  description: "Professional property management services in Cliffside Park, Bergen County & Northern New Jersey. Tenant screening, maintenance, rent collection & 24/7 support. 10+ years experience.",
  keywords: ["property management", "Cliffside Park", "Bergen County", "North Jersey", "NJ property management", "tenant management", "landlord services", "rent collection", "maintenance services"],
  authors: [{ name: "Elevate Property Management" }],
  openGraph: {
    title: "Elevate Property Management | North Jersey Property Experts",
    description: "Professional property management in Cliffside Park & Bergen County, NJ. Trusted by property owners for 10+ years.",
    url: "https://elevateproperty.management",
    siteName: "Elevate Property Management",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elevate Property Management | North Jersey",
    description: "Professional property management in Cliffside Park & Bergen County, NJ.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://elevateproperty.management",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Elevate Property Management",
  "description": "Professional property management services in Cliffside Park, Bergen County & Northern New Jersey.",
  "url": "https://elevateproperty.management",
  "telephone": "+1-201-887-7766",
  "email": "elevatepropertymanagement@outlook.com",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Cliffside Park",
    "addressRegion": "NJ",
    "addressCountry": "US"
  },
  "areaServed": [
    { "@type": "City", "name": "Cliffside Park" },
    { "@type": "County", "name": "Bergen County" },
    { "@type": "County", "name": "Hudson County" },
    { "@type": "County", "name": "Passaic County" },
    { "@type": "State", "name": "New Jersey" }
  ],
  "serviceType": ["Property Management", "Tenant Screening", "Rent Collection", "Maintenance Services"],
  "openingHours": "Mo-Su 09:00-18:00",
  "priceRange": "$$"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
