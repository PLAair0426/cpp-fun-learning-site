import Link from "next/link";
import {
  ArrowRight,
  Fingerprint,
  ShieldCheck,
  UserRoundPlus
} from "lucide-react";
import type { UserSubmissionSummary, UserSummary } from "../lib/api";
import { buildAuthAccessHref } from "../lib/auth-links";
import { type AuthAccessVariant } from "../lib/experiments";

type AuthHeroExperimentProps = {
  variant: AuthAccessVariant;
  currentUser: UserSummary | null;
  submissions: UserSubmissionSummary[];
};

function formatLastActivity(value?: string) {
  if (!value) {
    return "首次登录后这里会显示最新记录";
  }

  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function AuthHeroExperiment({
  variant,
  currentUser,
  submissions
}: AuthHeroExperimentProps) {
  const acceptedCount = submissions.filter((item) =>
    /(accepted|通过|ac)/i.test(`${item.status} ${item.result}`)
  ).length;
  const totalCount = submissions.length;
  const lastSubmissionAt = submissions[0]?.updatedAt;

  if (variant === "b") {
    return (
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="panel-shell hero-orbit rounded-[40px] px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="section-heading__badge">快速开始</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-200">
                {currentUser ? `已登录：${currentUser.name}` : "未登录 · 可立即创建账户"}
              </span>
            </div>

            <h1 className="mt-6 max-w-3xl editorial-title text-[clamp(2.35rem,4vw,3.9rem)] leading-[1.06] text-white">
              <span className="block">30 秒创建学习身份，</span>
              <span className="block">把刷题和课程进度</span>
              <span className="block">马上绑定到你自己。</span>
            </h1>
            <p className="mt-4 max-w-2xl text-[0.98rem] leading-8 text-slate-300 sm:text-[1.02rem]">
              创建账号后，就能继续题库练习。登录后会直接看到只属于你自己的提交记录、
              学习进度和成长轨迹。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={
                  currentUser
                    ? "#auth-panel"
                    : buildAuthAccessHref({ mode: "register", redirectTo: "/auth" })
                }
                className="nav-pill nav-pill--accent px-5 py-3 text-sm font-medium"
              >
                {currentUser ? "查看账户面板" : "立即注册 / 登录"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/problems" className="nav-pill px-5 py-3 text-sm font-medium">
                先去题库热身
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="admin-subcard p-5">
                <p className="soft-kicker">注册速度</p>
                <p className="mt-3 text-2xl font-semibold text-white">≈ 30s</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">只需昵称、邮箱和密码即可开始。</p>
              </div>
              <div className="admin-subcard p-5">
                <p className="soft-kicker">当前记录</p>
                <p className="mt-3 text-2xl font-semibold text-white">{totalCount}</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">最近提交会同步回到你的个人历史区。</p>
              </div>
              <div className="admin-subcard p-5">
                <p className="soft-kicker text-cyan-100/80">有效结果</p>
                <p className="mt-3 text-2xl font-semibold text-white">{acceptedCount}</p>
                <p className="mt-2 text-sm leading-7 text-slate-200">通过结果与练习轨迹都与账号绑定。</p>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-shell rounded-[36px] px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-amber-100">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="soft-kicker text-amber-50/70">启动引导</p>
              <h2 className="mt-1 editorial-title text-2xl text-white">新用户也能快速进入学习状态</h2>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {[
              "创建账户后，正式提交会被记到你的个人学习档案里。",
              "重新打开站点时，可以继续查看自己的最近题目状态和更新时间。",
              "如果你是管理员，登录后还能继续进入后台内容管理。"
            ].map((item, index) => (
              <div
                key={item}
                className="admin-subcard flex gap-3 px-4 py-4"
              >
                <div className="admin-step-badge">
                  0{index + 1}
                </div>
                <p className="text-sm leading-7 text-slate-300">{item}</p>
              </div>
            ))}
          </div>

          <div className="admin-subcard mt-6 p-5">
            <p className="soft-kicker">最近活动</p>
            <p className="mt-3 text-lg font-semibold text-white">{formatLastActivity(lastSubmissionAt)}</p>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              {currentUser
                ? "已登录状态下，面板会随时刷新为你的专属记录。"
                : "登录后这里会显示你自己的最近提交，而不是其他用户的数据。"}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <div className="panel-shell hero-orbit rounded-[40px] px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="section-heading__badge">账号保护</span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-200">
              {currentUser ? `已登录：${currentUser.name}` : "登录后可保存个人学习记录"}
            </span>
          </div>

          <h1 className="mt-6 max-w-3xl editorial-title text-[clamp(2.4rem,4.15vw,4rem)] leading-[1.05] text-white">
            <span className="block">登录之后，</span>
            <span className="block">你的每一次提交都会进入</span>
            <span className="block">自己的学习档案。</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[0.98rem] leading-8 text-slate-300 sm:text-[1.02rem]">
            你的练习记录、通过结果、最近活跃时间和成长数据都只与当前账号绑定，
            不会与其他使用者混在一起。换设备登录，也能继续看自己的学习轨迹。
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="admin-subcard p-5">
              <div className="flex items-center gap-2 text-emerald-100">
                <ShieldCheck className="h-4 w-4" />
                <p className="soft-kicker text-emerald-50/80">数据隔离</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                正式提交、结果状态与个人面板只对当前账号开放。
              </p>
            </div>
            <div className="admin-subcard p-5">
              <div className="flex items-center gap-2 text-cyan-100">
                <Fingerprint className="h-4 w-4" />
                <p className="soft-kicker text-cyan-50/80">身份延续</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                同一账户在不同设备登录，依然能看到自己的历史记录。
              </p>
            </div>
            <div className="admin-subcard p-5">
              <div className="flex items-center gap-2 text-amber-100">
                <UserRoundPlus className="h-4 w-4" />
                <p className="soft-kicker text-amber-50/80">后台入口</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                管理员登录后可继续使用后台管理用户、课程和内容模块。
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={
                currentUser
                  ? "#auth-panel"
                  : buildAuthAccessHref({ mode: "login", redirectTo: "/auth" })
              }
              className="nav-pill nav-pill--accent px-5 py-3 text-sm font-medium"
            >
              {currentUser ? "继续进入个人空间" : "进入登录 / 注册页"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/problems" className="nav-pill px-5 py-3 text-sm font-medium">
              浏览题库
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="panel-shell rounded-[36px] px-6 py-7">
        <p className="soft-kicker">个人快照</p>
        <h2 className="mt-3 editorial-title text-2xl text-white">
          {currentUser ? `${currentUser.name} 的账户状态` : "登录后会生成你的专属学习档案"}
        </h2>

        <div className="mt-6 grid gap-3">
          <div className="admin-subcard px-4 py-4">
            <p className="soft-kicker">总提交数</p>
            <p className="mt-2 text-2xl font-semibold text-white">{totalCount}</p>
          </div>
          <div className="admin-subcard px-4 py-4">
            <p className="soft-kicker">已通过</p>
            <p className="mt-2 text-2xl font-semibold text-white">{acceptedCount}</p>
          </div>
          <div className="admin-subcard px-4 py-4">
            <p className="soft-kicker">最近活动</p>
            <p className="mt-2 text-lg font-semibold text-white">{formatLastActivity(lastSubmissionAt)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
