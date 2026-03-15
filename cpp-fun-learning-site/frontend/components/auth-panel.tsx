"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LogOut, Sparkles } from "lucide-react";
import type { UserSummary } from "../lib/api";
import { publicApiBaseUrl } from "../lib/api";
import { buildAuthAccessHref } from "../lib/auth-links";
import type { AuthAccessVariant } from "../lib/experiments";
import { formatDisplayName } from "../lib/problem-labels";

type AuthPanelProps = {
  currentUser: UserSummary | null;
  variant?: AuthAccessVariant;
};

const variantCopy: Record<AuthAccessVariant, { badge: string; title: string; points: string[] }> =
  {
    a: {
      badge: "学习档案",
      title: "把每一次练习结果稳定地留在你自己的学习空间里。",
      points: [
        "提交历史会牢牢绑定在当前登录账号下。",
        "进度、连击和推荐动作会跟随你的学习会话持续保存。",
        "管理员仍可进入后台，但不会和普通用户的记录混在一起。"
      ]
    },
    b: {
      badge: "开始学习",
      title: "创建账号后，就能立刻回到你的学习主线。",
      points: [
        "更少点击就能回到下一节课或下一道题。",
        "保存连贯进度，让练习节奏不断档。",
        "无论何时再次打开，都能继续同一条学习轨迹。"
      ]
    }
  };

export function AuthPanel({
  currentUser,
  variant = "a"
}: AuthPanelProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeVariant = variantCopy[variant];

  async function handleLogout() {
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${publicApiBaseUrl}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        throw new Error(`退出失败：${response.status}`);
      }

      setMessage("你已安全退出登录。");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "退出失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (currentUser) {
    return (
      <section id="auth-panel" className="panel-shell auth-panel-column rounded-[36px] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="soft-kicker">账号已激活</p>
            <h2 className="mt-2 text-[2rem] font-semibold leading-[1.2] text-white md:text-[2.15rem]">
              {formatDisplayName(currentUser.name)}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-8 text-slate-300 md:text-base">
              你的学习记录已经与当前账号绑定，新的提交和成长数据都会单独归档。
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isSubmitting}
            className="nav-pill px-4 py-2 text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            {isSubmitting ? "退出中..." : "退出登录"}
          </button>
        </div>

        <div className="auth-status-grid mt-6 grid gap-4 md:grid-cols-3">
          <div className="admin-subcard admin-subcard--muted auth-status-card rounded-[24px] p-5">
            <p className="soft-kicker">邮箱</p>
            <p className="mt-3 text-[1.02rem] font-semibold leading-7 text-white">
              {currentUser.email}
            </p>
          </div>
          <div className="admin-subcard admin-subcard--muted auth-status-card rounded-[24px] p-5">
            <p className="soft-kicker">角色</p>
            <p className="mt-3 text-[1.02rem] font-semibold leading-7 text-white">
              {currentUser.role === "admin" ? "管理员" : "学习者"}
            </p>
          </div>
          <div className="admin-subcard admin-subcard--muted auth-status-card rounded-[24px] p-5">
            <p className="soft-kicker">状态</p>
            <p className="mt-3 text-[1.02rem] font-semibold leading-7 text-white">
              {currentUser.isActive ? "可以继续学习" : "暂未启用"}
            </p>
          </div>
        </div>

        <div className="page-action-row mt-6">
          <Link href="/paths" className="nav-pill nav-pill--accent px-5 py-3 text-sm font-medium">
            打开学习路径
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/problems" className="nav-pill px-5 py-3 text-sm font-medium">
            进入题目练习
            <Sparkles className="h-4 w-4" />
          </Link>
        </div>

        {message ? <p className="site-note site-note--success mt-5">{message}</p> : null}
        {error ? <p className="site-note site-note--danger mt-5">{error}</p> : null}
      </section>
    );
  }

  return (
    <section id="auth-panel" className="auth-panel-grid grid gap-5 xl:grid-cols-2">
      <div className="panel-shell auth-panel-column auth-panel-column--context rounded-[36px] p-6">
        <div className="section-heading__badge">
          <Sparkles className="h-4 w-4" />
          <span>{activeVariant.badge}</span>
        </div>

        <h2 className="mt-5 text-[1.9rem] font-semibold leading-[1.24] text-white md:text-[2.05rem]">
          {activeVariant.title}
        </h2>
        <p className="mt-4 text-[15px] leading-8 text-slate-300 md:text-base">
          登录和注册已经迁移到独立入口页；这里保留账号状态、学习记录和后续操作入口。
        </p>

        <div className="auth-point-list mt-5 grid gap-3">
          {activeVariant.points.map((point) => (
            <div
              key={point}
              className="admin-subcard admin-subcard--muted auth-point-card rounded-[24px] p-4"
            >
              <p className="landing-body-copy">{point}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-shell auth-panel-column auth-panel-column--form rounded-[36px] p-6">
        <p className="soft-kicker">账号入口</p>
        <h2 className="mt-2 text-[1.9rem] font-semibold leading-[1.22] text-white md:text-[2.05rem]">
          前往独立页面完成登录或注册
        </h2>
        <p className="mt-3 text-[15px] leading-8 text-slate-300 md:text-base">
          完成账号操作后，会自动返回账号中心或当前学习入口，不再和用户面板混在一起。
        </p>

        <div className="page-action-row mt-6">
          <Link
            href={buildAuthAccessHref({ mode: "login", redirectTo: "/auth" })}
            className="nav-pill nav-pill--accent px-5 py-3 text-sm font-medium"
          >
            前往登录页
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={buildAuthAccessHref({ mode: "register", redirectTo: "/auth" })}
            className="nav-pill px-5 py-3 text-sm font-medium"
          >
            前往注册页
            <Sparkles className="h-4 w-4" />
          </Link>
        </div>

        <div className="auth-helper-grid mt-6 grid gap-3 md:grid-cols-2">
          <div className="admin-subcard admin-subcard--muted auth-helper-card rounded-[22px] px-4 py-4">
            <p className="landing-list-copy text-slate-300">
              登录后会自动回到你的账号中心，并继续显示个人记录。
            </p>
          </div>
          <div className="admin-subcard admin-subcard--muted auth-helper-card rounded-[22px] px-4 py-4">
            <p className="landing-list-copy text-slate-300">
              注册完成后会立刻生成独立学习空间，提交与成长数据会按账号保存。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
