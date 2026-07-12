import type { Metadata } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-nunito",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito-sans",
});

export const metadata: Metadata = {
  title: "Jiminee",
  description: "The task board where AI writes the instructions and a friendly conscience keeps work on task.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${nunitoSans.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
