import type { Metadata } from "next";
import { SiteChrome } from "../components/site-chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "C++ 趣味学习网站",
  description: "把 C++ 基础课、Linux 支线与判题练习做成一张可闯关的学习地图。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
