import type { Metadata } from "next";
import { SiteChrome } from "../components/site-chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "C++ 竞技学习站",
  description: "面向 C++ 路径学习、题目练习、个人账号和后台管理的一体化学习平台。"
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
