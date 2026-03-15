import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { buildAuthAccessHref } from "../lib/auth-links";
import { getCurrentUser } from "../lib/server-api";
import { formatDisplayName } from "../lib/problem-labels";
import { SiteNavigation } from "./site-navigation";

export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();

  return (
    <div className="learn-site-shell">
      <div className="learn-site-shell__orb learn-site-shell__orb--one" aria-hidden="true" />
      <div className="learn-site-shell__orb learn-site-shell__orb--two" aria-hidden="true" />
      <div className="learn-site-shell__orb learn-site-shell__orb--three" aria-hidden="true" />

      <div className="learn-site-frame flex min-h-screen w-full flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="learn-topbar">
          <Link href="/" className="learn-brand" aria-label="返回首页">
            <span className="learn-brand__mark">
              <BookOpenText className="h-5 w-5" />
            </span>
            <span className="learn-brand__text">
              <span className="learn-brand__title">C++ 学习站</span>
              <span className="learn-brand__subtitle">路径 · 练习 · 进度</span>
            </span>
          </Link>

          <SiteNavigation
            currentUser={
              currentUser
                ? {
                    name: formatDisplayName(currentUser.name),
                    role: currentUser.role
                  }
                : null
            }
          />
        </header>

        <main className="learn-main">{children}</main>

        <footer className="learn-footer">
          <div className="learn-footer__grid">
            <div>
              <p className="learn-footer__title">把课程、路径和题目整理进同一条学习主线</p>
              <p className="learn-footer__copy">
                现在整站统一为更明亮、更舒适的学习界面，登录、后台和个人记录仍然继续可用。
              </p>
            </div>

            <div className="learn-footer__links">
              <Link href="/paths" className="learn-footer__link">
                学习路径
              </Link>
              <Link href="/problems" className="learn-footer__link">
                题目练习
              </Link>
              <Link
                href={currentUser ? "/auth" : buildAuthAccessHref({ mode: "login", redirectTo: "/auth" })}
                className="learn-footer__link"
              >
                {currentUser ? "账号中心" : "登录入口"}
              </Link>
            </div>

            <div className="learn-footer__status">
              {currentUser
                ? `${formatDisplayName(currentUser.name)} 已登录，记录会继续按账号隔离保存。`
                : "当前为访客模式，登录后即可保存自己的学习记录。"}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
