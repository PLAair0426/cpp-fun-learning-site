import Link from "next/link";
import { ArrowRight, ClipboardList, FilePlus2, ShieldCheck, Users } from "lucide-react";
import type {
  AdminActivityEntry,
  AdminContentCatalog,
  AdminOverview,
  AdminUserDetail,
  UserSummary
} from "../lib/api";
import { type AdminWorkbenchVariant } from "../lib/experiments";
import { formatDisplayName } from "../lib/problem-labels";

type AdminHeroExperimentProps = {
  variant: AdminWorkbenchVariant;
  currentUser: UserSummary;
  overview: AdminOverview;
  users: AdminUserDetail[];
  content: AdminContentCatalog;
  activity: AdminActivityEntry[];
};

export function AdminHeroExperiment({
  variant,
  currentUser,
  overview,
  users,
  content,
  activity
}: AdminHeroExperimentProps) {
  const inactiveUsers = Math.max(overview.totalUsers - overview.activeUsers, 0);

  if (variant === "b") {
    return (
      <section className="panel-shell hero-orbit rounded-[40px] px-6 py-8 sm:px-8">
        <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="section-heading__badge">内容管理中心</span>
              <span className="site-chip site-chip--muted">
                当前管理员：{formatDisplayName(currentUser.name)}
              </span>
            </div>

            <h1 className="mt-6 editorial-title text-[clamp(2.4rem,4.4vw,4.2rem)] leading-[1.04] text-white">
              先补内容，再安排今天的后台工作。
            </h1>
            <p className="mt-4 max-w-3xl text-[15px] leading-8 text-slate-300 md:text-base">
              在这里可以继续新增题目、补课程路径，并检查内容完整度，让前台学习体验更稳定。
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#create-problem" className="nav-pill nav-pill--accent px-5 py-3 text-[15px] font-medium">
                新增题目
                <FilePlus2 className="h-4 w-4" />
              </a>
              <a href="#create-path" className="nav-pill px-5 py-3 text-[15px] font-medium">
                新增路径
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-card rounded-[24px] p-4">
              <p className="soft-kicker">内容规模</p>
              <p className="mt-3 text-[1.08rem] font-semibold leading-7 text-white md:text-[1.14rem]">
                {overview.totalPaths} 路径 / {overview.totalProblems} 题
              </p>
              <p className="mt-2 text-[15px] leading-8 text-slate-300">
                已覆盖 {content.lessons.length} 节课程，可继续扩展模块密度。
              </p>
            </div>
            <div className="surface-card rounded-[24px] p-4">
              <p className="soft-kicker text-emerald-100/80">内容健康</p>
              <p className="mt-3 text-[1.08rem] font-semibold leading-7 text-white md:text-[1.14rem]">
                {content.problems.filter((item) => item.tags.length === 0).length} 道题待补标签
              </p>
              <p className="mt-2 text-[15px] leading-8 text-slate-300">
                优先补齐标签、代码片段与焦点标签，能提升前台联动质量。
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel-shell hero-orbit rounded-[40px] px-6 py-8 sm:px-8">
      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="section-heading__badge">后台总览</span>
            <span className="site-chip site-chip--muted">
              当前管理员：{formatDisplayName(currentUser.name)}
            </span>
          </div>

          <h1 className="mt-6 editorial-title text-[clamp(2.4rem,4.4vw,4.2rem)] leading-[1.04] text-white">
            先看全局状态，再决定今天优先处理什么。
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-8 text-slate-300 md:text-base">
            在这里可以快速查看账号状态、最近活动和内容规模，再安排今天的处理顺序。
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#accounts" className="nav-pill nav-pill--accent px-5 py-3 text-[15px] font-medium">
              处理账号
              <Users className="h-4 w-4" />
            </a>
            <a href="#activity" className="nav-pill px-5 py-3 text-[15px] font-medium">
              查看活动
              <ClipboardList className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="surface-card rounded-[24px] p-4">
            <p className="soft-kicker">账号状态</p>
            <p className="mt-3 text-[1.08rem] font-semibold leading-7 text-white md:text-[1.14rem]">
              {overview.activeUsers}/{overview.totalUsers} 已启用
            </p>
            <p className="mt-2 text-[15px] leading-8 text-slate-300">
              当前有 {inactiveUsers} 个未启用账号，可直接筛查和恢复。
            </p>
          </div>
          <div className="surface-card rounded-[24px] p-4">
            <div className="inline-flex items-center gap-2 text-cyan-100">
              <ShieldCheck className="h-4 w-4" />
              <p className="soft-kicker text-cyan-100/80">运营快照</p>
            </div>
            <p className="mt-3 text-[1.08rem] font-semibold leading-7 text-white md:text-[1.14rem]">
              {activity.length} 条最近活动
            </p>
            <p className="mt-2 text-[15px] leading-8 text-slate-300">
              当前累计 {overview.totalSubmissions} 次提交，便于判断最近活跃质量。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
