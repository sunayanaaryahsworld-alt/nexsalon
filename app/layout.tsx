import "./globals.css";
import type { ReactNode } from "react";
import { Inter, DM_Sans, Cormorant_Garamond } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-dm" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant"
});

export const metadata = {
  title: "NexSalon SuperAdmin Dashboard",
  description: "Premium Salon Management Software",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${dmSans.variable} ${cormorant.variable} font-sans`}>{children}</body>
    </html>
  );
}