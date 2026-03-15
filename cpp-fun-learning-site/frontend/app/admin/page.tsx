import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AdminDashboard } from "../../components/admin-dashboard";
import { AdminHeroExperiment } from "../../components/admin-hero-experiment";
import { SectionTitle } from "../../components/section-title";
import { buildAuthAccessHref } from "../../lib/auth-links";
import {
  EXPERIMENT_COOKIE_NAMES,
  resolveAdminWorkbenchVariant
} from "../../lib/experiments";
import {
  getAdminActivity,
  getAdminContent,
  getAdminOverview,
  getAdminUsers,
  getCurrentUser
} from "../../lib/server-api";

function BackHomeLink() {
  return (
    <Link href="/" className="nav-pill learn-page__back w-fit px-4 py-2 text-[15px]">
      <ArrowLeft className="h-4 w-4" />
      返回首页
    </Link>
  );
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const variant = resolveAdminWorkbenchVariant(
    cookieStore.get(EXPERIMENT_COOKIE_NAMES.adminWorkbench)?.value
  );
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="learn-page admin-light-page space-y-8 pb-8">
        <BackHomeLink />

        <section className="panel-shell hero-orbit rounded-[40px] px-6 py-8 sm:px-8 sm:py-9">
          <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
            <div>
              <SectionTitle
                badge="后台入口"
                title="请使用管理员账号登录"
                description="管理后台只对管理员开放，用于处理用户账号、课程内容和最近活动数据。"
              />
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="metric-tile">
                  <p className="soft-kicker">进入条件</p>
                  <p className="mt-3 text-lg font-semibold text-white">管理员角色</p>
                </div>
                <div className="metric-tile">
                  <p className="soft-kicker">处理范围</p>
                  <p className="mt-3 text-lg font-semibold text-white">用户 / 内容 / 数据</p>
                </div>
                <div className="metric-tile">
                  <p className="soft-kicker">校验时机</p>
                  <p className="mt-3 text-lg font-semibold text-white">登录后自动检查</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="admin-subcard rounded-[24px] p-5">
                  <p className="soft-kicker">进入后可做什么</p>
                  <p className="mt-3 text-[15px] leading-8 text-slate-300">
                    查看账号启用状态、最近活动、题目与路径内容，并继续补全课程模块。
                  </p>
                </div>
                <div className="admin-subcard rounded-[24px] p-5">
                  <p className="soft-kicker">建议登录方式</p>
                  <p className="mt-3 text-[15px] leading-8 text-slate-300">
                    直接使用管理员账号登录即可，不需要在后台入口重新注册普通学习者账号。
                  </p>
                </div>
              </div>
            </div>

            <div className="surface-card rounded-[30px] p-5">
              <p className="soft-kicker">登录入口</p>
              <h2 className="mt-3 text-[1.4rem] font-semibold leading-8 text-white md:text-[1.55rem]">
                前往独立登录页完成管理员登录
              </h2>
              <p className="mt-3 text-[15px] leading-8 text-slate-300">
                管理员登录已迁移到单独页面。登录成功后会自动返回后台入口，继续处理用户和内容数据。
              </p>
              <div className="page-action-row mt-5">
                <Link
                  href={buildAuthAccessHref({
                    mode: "login",
                    redirectTo: "/admin",
                    context: "admin"
                  })}
                  className="nav-pill nav-pill--accent px-5 py-3 text-sm font-medium"
                >
                  前往管理员登录
                </Link>
                <Link href="/auth" className="nav-pill px-5 py-3 text-sm font-medium">
                  查看账号中心
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="learn-page admin-light-page space-y-8 pb-8">
        <BackHomeLink />

        <section className="panel-shell hero-orbit rounded-[40px] px-6 py-8 sm:px-8 sm:py-9">
          <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
            <div>
              <div className="nav-pill nav-pill--admin px-4 py-2 text-[12px] uppercase tracking-[0.16em]">
                <ShieldCheck className="h-4 w-4" />
                访问受限
              </div>
              <h1 className="mt-5 editorial-title text-[2.2rem] leading-[1.16] text-white md:text-[2.5rem]">
                当前账号不是管理员
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-8 text-slate-300 md:text-base">
                请先退出当前账号，再使用已开通后台权限的管理员账号登录。为安全起见，
                管理员登录信息不会在页面内展示。
              </p>
            </div>

            <div className="grid gap-4">
              <div className="surface-card rounded-[26px] p-5">
                <p className="soft-kicker">当前限制</p>
                <p className="mt-3 text-[1.08rem] font-semibold leading-7 text-white md:text-[1.14rem]">
                  用户数据和内容数据暂不可见
                </p>
              </div>
              <div className="surface-card rounded-[26px] p-5">
                <p className="soft-kicker">下一步</p>
                <p className="mt-3 text-[15px] leading-8 text-slate-300">
                  先到账号中心退出当前账号，再前往独立登录页切换为管理员账号。
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const [overview, users, content, activity] = await Promise.all([
    getAdminOverview(),
    getAdminUsers(),
    getAdminContent(),
    getAdminActivity()
  ]);
  if (!overview || !content) {
    return (
      <div className="learn-page admin-light-page space-y-8 pb-8">
        <BackHomeLink />

        <section className="panel-shell hero-orbit rounded-[40px] px-6 py-8 sm:px-8 sm:py-9">
          <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
            <div>
              <SectionTitle
                badge="后台状态"
                title="后台数据暂时不可用"
                description="页面框架仍然可用，但当前还没拿到完整的后台统计与内容数据。请先确认 API、数据库和管理员会话是否正常。"
              />
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="metric-tile">
                  <p className="soft-kicker">当前状态</p>
                  <p className="mt-3 text-lg font-semibold text-white">数据加载中断</p>
                </div>
                <div className="metric-tile">
                  <p className="soft-kicker">建议优先检查</p>
                  <p className="mt-3 text-lg font-semibold text-white">API 与会话</p>
                </div>
                <div className="metric-tile">
                  <p className="soft-kicker">页面表现</p>
                  <p className="mt-3 text-lg font-semibold text-white">已避免空白页</p>
                </div>
              </div>
            </div>

            <div className="surface-card rounded-[30px] p-5">
              <p className="soft-kicker">快速处理建议</p>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-slate-300">
                <p>1. 先确认后端服务是否已启动。</p>
                <p>2. 再确认管理员账号仍然处于登录状态。</p>
                <p>3. 如果刚改了内容结构，刷新页面重新拉取数据。</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="learn-page admin-light-page space-y-8 pb-8">
      <BackHomeLink />

      <AdminHeroExperiment
        variant={variant}
        currentUser={currentUser}
        overview={overview}
        users={users}
        content={content}
        activity={activity}
      />

      <AdminDashboard
        overview={overview}
        users={users}
        content={content}
        activity={activity}
        variant={variant}
      />
    </div>
  );
}
