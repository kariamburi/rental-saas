import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://landmanagement.com"),

  title: {
    default: "Rental Property Management System",
    template: "%s | Rental Property Management System",
  },

  description:
    "Modern property management software for landlords, property managers and real estate companies. Manage properties, units, tenants, leases, invoices, rent collection, expenses, maintenance and reports.",

  keywords: [
    "Property Management Software",
    "Rental Management System",
    "Landlord Software",
    "Tenant Management",
    "Lease Management",
    "Rent Collection",
    "Property Management Kenya",
    "Rental Property Software",
    "Apartment Management",
    "Real Estate Software",
    "Property Accounting",
    "Rental SaaS",
  ],

  authors: [
    {
      name: "Craft Inventors",
    },
  ],

  creator: "Craft Inventors",
  publisher: "Craft Inventors",

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Rental Property Management System",
    description:
      "Manage properties, units, tenants, leases, rent invoices, payments, maintenance and financial reports from one platform.",
    siteName: "Rental Property Management System",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Rental Property Management System",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Rental Property Management System",
    description:
      "Property management software for landlords and property managers.",
    images: ["/logo.png"],
  },

  icons: {
    icon: "/rental-saas-icon.ico",
    shortcut: "/rental-saas-icon.ico",
    apple: "/logo.png",
  },

  category: "business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}