"use client";

import { useMemo, useState } from "react";
import { publicApiBaseUrl, type AdminOverview, type AdminUserDetail } from "../lib/api";

type AdminDashboardProps = {
  overview: AdminOverview;
  users: AdminUserDetail[];
};

export function AdminDashboard({ overview, users }: AdminDashboardProps) {
  const [items, setItems] = useState(users);
  const [busyUserId, setBusyUserId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeRate = useMemo(() => {
    if (overview.totalUsers === 0) {
      return "0%";
    }
    return `${Math.round((overview.activeUsers / overview.totalUsers) * 100)}%`;
  }, [overview.activeUsers, overview.totalUsers]);

  async function toggleUser(user: AdminUserDetail) {
    setBusyUserId(user.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${publicApiBaseUrl}/api/v1/admin/users/${user.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ isActive: !user.isActive })
      });

      const payload = (await response.json()) as { error?: string; ok?: boolean };
      if (!response.ok) {
        throw new Error(payload.error ?? `请求失败：${response.status}`);
      }

      setItems((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                isActive: !item.isActive
              }
            : item
        )
      );
      setMessage(`${user.name} 已${user.isActive ? "禁用" : "启用"}。`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "更新失败");
    } finally {
      setBusyUserId("");
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="用户总数" value={String(overview.totalUsers)} />
        <MetricCard label="活跃账号" value={String(overview.activeUsers)} hint={`占比 ${activeRate}`} />
        <MetricCard label="累计提交" value={String(overview.totalSubmissions)} />
        <MetricCard label="课程容量" value={`${overview.totalPaths} / ${overview.totalLessons} / ${overview.totalProblems}`} hint="路线 / 课程 / 题目" />
      </section>

      <section className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/80">Accounts</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">用户账号管理</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              可以查看账号状态、提交数量和最近活跃时间，并对普通账号进行启用或禁用。
            </p>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            管理员账号：{overview.adminUsers}
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

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-white/8 text-left text-sm text-slate-200">
            <thead>
              <tr className="text-xs uppercase tracking-[0.22em] text-slate-400">
                <th className="pb-3 pr-4">用户</th>
                <th className="pb-3 pr-4">角色</th>
                <th className="pb-3 pr-4">状态</th>
                <th className="pb-3 pr-4">提交</th>
                <th className="pb-3 pr-4">通过</th>
                <th className="pb-3 pr-4">最近活跃</th>
                <th className="pb-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {items.map((user) => (
                <tr key={user.id}>
                  <td className="py-4 pr-4">
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="mt-1 text-xs text-slate-400">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        user.isActive
                          ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-50"
                          : "border border-rose-300/20 bg-rose-300/10 text-rose-50"
                      }`}
                    >
                      {user.isActive ? "启用中" : "已禁用"}
                    </span>
                  </td>
                  <td className="py-4 pr-4">{user.submissionCount}</td>
                  <td className="py-4 pr-4">{user.acceptedCount}</td>
                  <td className="py-4 pr-4">
                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString("zh-CN") : "暂无"}
                  </td>
                  <td className="py-4">
                    {user.role === "admin" ? (
                      <span className="text-xs text-slate-500">管理员账号</span>
                    ) : (
                      <button
                        type="button"
                        disabled={busyUserId === user.id}
                        onClick={() => {
                          void toggleUser(user);
                        }}
                        className="rounded-full border border-white/10 px-4 py-2 text-xs text-white transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyUserId === user.id ? "处理中..." : user.isActive ? "禁用账号" : "启用账号"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="panel-shell rounded-[28px] px-5 py-5">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-400">{hint}</p> : null}
    </div>
  );
}
