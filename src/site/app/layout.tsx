import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "智能时代蛮子 · 工程预览",
    template: "%s · 智能时代蛮子",
  },
  description: "本地博客工程预览；内容与排版待确认，未公开发布。",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
