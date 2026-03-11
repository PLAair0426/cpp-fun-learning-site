import Link from "next/link";
import { Binary, LockKeyhole, Sparkles } from "lucide-react";
import { getCurrentUser } from "../lib/server-api";

export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-[-120px] h-[420px] bg-[radial-gradient(circle_at_top,rgba(69,217,255,0.16),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-y-20 right-[-120px] h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(255,207,105,0.16),transparent_62%)] blur-3xl" />

      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="panel-shell sticky top-4 z-20 rounded-[28px] px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                <Binary className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.36em] text-slate-400">C++ Fun Learning Site</p>
                <Link href="/" className="mt-2 block text-2xl font-semibold text-white">
                  C++ 趣味学习网站
                </Link>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/5"
              >
                首页总览
              </Link>
              <Link
                href="/paths"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/5"
              >
                学习路径
              </Link>
              <Link
                href="/problems"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/5"
              >
                题库练习
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-300/15"
              >
                <LockKeyhole className="h-4 w-4" />
                {currentUser ? currentUser.name : "登录 / 注册"}
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100">
                <Sparkles className="h-4 w-4" />
                {currentUser ? "个人记录已隔离" : "登录后开启个人记录"}
              </span>
            </nav>
          </div>
        </header>

        <main className="flex-1 py-6">{children}</main>

        <footer className="px-2 pb-8 pt-4 text-sm text-slate-400">
          这里聚合了学习路线、课程内容、题库练习与个人成长记录，帮助你按自己的节奏持续推进 C++ 学习。
        </footer>
      </div>
    </div>
  );
}
