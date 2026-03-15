"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildAuthAccessHref } from "../lib/auth-links";
import { formatDisplayName } from "../lib/problem-labels";

type SiteNavigationProps = {
  currentUser: {
    name: string;
    role: string;
  } | null;
};

const primaryNav = [
  {
    href: "/",
    label: "首页"
  },
  {
    href: "/paths",
    label: "学习路径"
  },
  {
    href: "/problems",
    label: "题目练习"
  }
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNavigation({ currentUser }: SiteNavigationProps) {
  const pathname = usePathname();

  return (
    <div className="learn-nav-shell">
      <nav className="learn-nav" aria-label="主导航">
        {primaryNav.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`learn-nav__link ${active ? "learn-nav__link--active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="learn-nav__actions">
        <Link
          href={currentUser ? "/auth" : buildAuthAccessHref({ mode: "login", redirectTo: "/auth" })}
          className="learn-nav__ghost"
        >
          {currentUser ? formatDisplayName(currentUser.name) : "登录"}
        </Link>

        {currentUser?.role === "admin" ? (
          <Link href="/admin" className="learn-nav__cta learn-nav__cta--soft">
            进入后台
          </Link>
        ) : (
          <Link
            href={currentUser ? "/paths" : buildAuthAccessHref({ mode: "register", redirectTo: "/paths" })}
            className="learn-nav__cta"
          >
            {currentUser ? "继续学习" : "开始学习"}
          </Link>
        )}
      </div>
    </div>
  );
}
