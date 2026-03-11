"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { publicApiBaseUrl, type UserSummary } from "../lib/api";

type AuthPanelProps = {
  currentUser: UserSummary | null;
};

type Mode = "login" | "register";

const modeCopy: Record<
  Mode,
  {
    title: string;
    description: string;
    action: string;
    endpoint: string;
  }
> = {
  login: {
    title: "欢迎回来",
    description: "登录后可查看自己的提交记录、进度和成长数据。",
    action: "登录",
    endpoint: "/api/v1/auth/login"
  },
  register: {
    title: "创建学习账号",
    description: "注册后每位使用者都会拥有独立的题目记录与成长面板。",
    action: "注册并开始学习",
    endpoint: "/api/v1/auth/register"
  }
};

export function AuthPanel({ currentUser }: AuthPanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCopy = useMemo(() => modeCopy[mode], [mode]);

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
          name,
          email,
          password
        })
      });

      const payload = (await response.json()) as { error?: string; user?: UserSummary };
      if (!response.ok) {
        throw new Error(payload.error ?? `请求失败：${response.status}`);
      }

      setMessage(mode === "login" ? "登录成功，正在刷新你的个人面板。" : "注册成功，已为你创建个人学习空间。");
      setPassword("");
      if (mode === "register") {
        setName("");
      }
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "发生未知错误");
    } finally {
      setIsSubmitting(false);
    }
  }

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

      setMessage("你已安全退出。");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "退出失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (currentUser) {
    return (
      <section className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
        <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/80">Account</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">{currentUser.name}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          你已登录，后续正式提交、提交结果和成长数据都会隔离到当前账号下。
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">账号邮箱</p>
            <p className="mt-3 text-lg font-medium text-white">{currentUser.email}</p>
          </div>
          <div className="rounded-[24px] border border-emerald-300/20 bg-emerald-300/10 p-5 text-emerald-50">
            <p className="text-xs uppercase tracking-[0.24em] opacity-80">记录隔离</p>
            <p className="mt-3 text-lg font-medium">已启用个人提交记录与成长面板</p>
          </div>
        </div>

        {message ? (
          <div className="mt-5 rounded-[22px] border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-5 rounded-[22px] border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-50">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              void handleLogout();
            }}
            disabled={isSubmitting}
            className="rounded-full border border-white/10 px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "正在退出..." : "退出登录"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/80">Account</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">{activeCopy.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{activeCopy.description}</p>
        </div>

        <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
          {(["login", "register"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item);
                setError("");
                setMessage("");
              }}
              className={`rounded-full px-4 py-2 text-sm transition ${
                mode === item ? "bg-cyan-300/15 text-cyan-50" : "text-slate-300 hover:text-white"
              }`}
            >
              {item === "login" ? "登录" : "注册"}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
        {mode === "register" ? (
          <label className="grid gap-2">
            <span className="text-sm text-slate-300">昵称</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-[20px] border border-white/10 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
              placeholder="例如：小林同学"
            />
          </label>
        ) : (
          <div className="rounded-[24px] border border-cyan-300/10 bg-cyan-300/5 p-4 text-sm leading-7 text-cyan-50/90 md:row-span-2">
            登录后，正式提交的状态流、通过记录和成长数据都会绑定到当前账号，不再与其他使用者混在一起。
          </div>
        )}

        <label className="grid gap-2">
          <span className="text-sm text-slate-300">邮箱</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-[20px] border border-white/10 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
            placeholder="name@example.com"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-slate-300">密码</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-[20px] border border-white/10 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
            placeholder="至少 6 位"
          />
        </label>

        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
          <p className="font-medium text-white">为什么要登录？</p>
          <ul className="mt-3 space-y-2">
            <li>· 每位学习者拥有独立提交记录</li>
            <li>· 进度与 XP 不会和其他人互相污染</li>
            <li>· 题目状态流只对当前账号可见</li>
          </ul>
        </div>

        <div className="md:col-span-2">
          {message ? (
            <div className="rounded-[22px] border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-[22px] border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-50">
              {error}
            </div>
          ) : null}
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full border border-cyan-300/20 bg-cyan-300/15 px-5 py-3 text-sm font-medium text-cyan-50 transition hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "提交中..." : activeCopy.action}
          </button>
        </div>
      </form>
    </section>
  );
}
