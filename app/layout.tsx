import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RUNEBLADE — เกมผจญภัยฝึกพิมพ์",
  description: "เปลี่ยนทุกคำให้เป็นคมดาบ ผจญภัยในป่าแฟนตาซีด้วยความเร็วพิมพ์ของคุณ",
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
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  );
}
