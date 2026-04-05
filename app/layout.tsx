import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tex Axes UI",
  description: "Tex Axes frontend",
  icons: {
    icon: "/images/texaxes-favicon.svg",
    shortcut: "/images/texaxes-favicon.svg",
    apple: "/images/texaxes-favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
