"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, LockKeyhole, UserRoundPlus } from "lucide-react";
import { publicApiBaseUrl } from "../lib/api";
import type { AuthAccessContext, AuthAccessMode } from "../lib/auth-links";

type AuthAccessPanelProps = {
  initialMode?: AuthAccessMode;
  redirectTo?: string;
  context?: AuthAccessContext;
};

const defaultRedirectByContext: Record<AuthAccessContext, string> = {
  default: "/auth",
  admin: "/admin"
};

const modeCopy: Record<
  AuthAccessMode,
  { title: string; description: string; action: string; endpoint: string }
> = {
  login: {
    title: "欢迎回来",
    description: "登录后即可继续查看你的学习轨迹、提交历史和当前路径进度。",
    action: "登录账号",
    endpoint: "/api/v1/auth/login"
  },
  register: {
    title: "创建学习账号",
    description: "注册后会生成独立学习空间，任务、连击和提交记录都会按账号隔离保存。",
    action: "创建账号",
    endpoint: "/api/v1/auth/register"
  }
};

const contextCopy: Record<
  AuthAccessContext,
  {
    badge: string;
    title: string;
    description: string;
    points: string[];
    allowRegister: boolean;
  }
> = {
  default: {
    badge: "账号访问",
    title: "登录或注册已迁移到独立入口页。",
    description: "在这里完成账号操作后，会自动返回你的学习页面，不再和账号面板混在一起。",
    points: [
      "登录后可继续查看自己的学习记录和提交历史。",
      "注册完成后会生成独立学习空间，记录自动归档。",
      "完成账号操作后，会按页面来源返回到对应入口。"
    ],
    allowRegister: true
  },
  admin: {
    badge: "管理员登录",
    title: "后台登录已单独放到独立页面。",
    description: "请先登录管理员账号，完成后会自动返回后台入口页。",
    points: [
      "这里只开放管理员登录，不提供普通学习者注册。",
      "登录成功后会直接返回后台，继续处理账号、内容和活动数据。",
      "如果你当前使用的是普通账号，建议先回账号中心退出后再切换。"
    ],
    allowRegister: false
  }
};

function resolveRedirectTo(redirectTo: string | undefined, context: AuthAccessContext) {
  if (redirectTo && redirectTo.startsWith("/")) {
    return redirectTo;
  }

  return defaultRedirectByContext[context];
}

export function AuthAccessPanel({
  initialMode = "login",
  redirectTo,
  context = "default"
}: AuthAccessPanelProps) {
  const router = useRouter();
  const contextConfig = contextCopy[context];
  const safeInitialMode =
    contextConfig.allowRegister && initialMode === "register" ? "register" : "login";
  const [mode, setMode] = useState<AuthAccessMode>(safeInitialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCopy = useMemo(() => modeCopy[mode], [mode]);
  const targetAfterSuccess = resolveRedirectTo(redirectTo, context);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${publicApiBaseUrl}${activeCopy.endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          name: mode === "register" ? name : "",
          email,
          password
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? `请求失败：${response.status}`);
      }

      setMessage(
        mode === "login"
          ? "登录成功，正在返回你的页面。"
          : "注册成功，正在创建你的学习空间并返回。"
      );
      setPassword("");
      setName("");
      router.push(targetAfterSuccess);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "发生未知错误");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-panel-grid grid gap-5 xl:grid-cols-2">
      <div className="panel-shell auth-panel-column auth-panel-column--context rounded-[36px] p-6">
        <div className="section-heading__badge">
          <LockKeyhole className="h-4 w-4" />
          <span>{contextConfig.badge}</span>
        </div>

        <h2 className="mt-5 text-[1.9rem] font-semibold leading-[1.24] text-white md:text-[2.05rem]">
          {contextConfig.title}
        </h2>
        <p className="mt-4 text-[15px] leading-8 text-slate-300 md:text-base">
          {contextConfig.description}
        </p>

        <div className="auth-point-list mt-5 grid gap-3">
          {contextConfig.points.map((point) => (
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
        {contextConfig.allowRegister ? (
          <div className="auth-mode-grid grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`nav-pill w-full justify-center px-4 py-3 text-sm font-medium ${mode === "login" ? "nav-pill--accent" : ""}`}
            >
              <LockKeyhole className="h-4 w-4" />
              登录
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`nav-pill w-full justify-center px-4 py-3 text-sm font-medium ${mode === "register" ? "nav-pill--accent" : ""}`}
            >
              <UserRoundPlus className="h-4 w-4" />
              注册
            </button>
          </div>
        ) : (
          <div className="section-heading__badge">
            <LockKeyhole className="h-4 w-4" />
            <span>仅登录</span>
          </div>
        )}

        <div className="mt-6">
          <p className="soft-kicker">{mode === "login" ? "账号进入" : "新用户创建"}</p>
          <h2 className="mt-2 text-[1.9rem] font-semibold leading-[1.22] text-white md:text-[2.05rem]">
            {activeCopy.title}
          </h2>
          <p className="mt-3 text-[15px] leading-8 text-slate-300 md:text-base">
            {activeCopy.description}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-stack mt-6 grid gap-4">
          {mode === "register" ? (
            <label className="block space-y-2">
              <span className="clay-field__label">昵称</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="field-surface text-[15px]"
                placeholder="例如：星火、回声、像素"
                minLength={2}
                required
              />
            </label>
          ) : null}

          <label className="block space-y-2">
            <span className="clay-field__label">邮箱</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field-surface text-[15px]"
              placeholder="请输入邮箱"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="clay-field__label">密码</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field-surface text-[15px]"
              placeholder="至少 6 位"
              minLength={6}
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="nav-pill nav-pill--accent justify-center px-5 py-3 text-sm font-medium"
          >
            {isSubmitting ? "提交中..." : activeCopy.action}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {message ? <p className="site-note site-note--success mt-5">{message}</p> : null}
        {error ? <p className="site-note site-note--danger mt-5">{error}</p> : null}
      </div>
    </section>
  );
}

