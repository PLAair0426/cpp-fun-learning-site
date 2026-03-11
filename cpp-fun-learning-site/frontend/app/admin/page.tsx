import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AdminDashboard } from "../../components/admin-dashboard";
import { AuthPanel } from "../../components/auth-panel";
import { SectionTitle } from "../../components/section-title";
import {
  getAdminActivity,
  getAdminContent,
  getAdminOverview,
  getAdminUsers,
  getCurrentUser
} from "../../lib/server-api";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="space-y-8">
        <BackHomeLink />

        <section className="panel-shell rounded-[36px] px-6 py-8 sm:px-8">
          <SectionTitle
            badge="Admin Access"
            title="请先登录管理员账号"
            description="后台管理系统需要管理员身份才能查看用户数据、管理账号状态和新增课程内容。"
          />
          <div className="mt-8">
            <AuthPanel currentUser={null} />
          </div>
        </section>
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="space-y-8">
        <BackHomeLink />

        <section className="panel-shell rounded-[36px] px-6 py-8 sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-amber-100">
            <ShieldCheck className="h-4 w-4" />
            Access Restricted
          </div>
          <h1 className="mt-5 text-4xl font-semibold text-white">当前账号不是管理员</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
            请使用管理员账号重新登录。默认管理员凭据来自后端环境变量 `ADMIN_EMAIL` 和
            `ADMIN_PASSWORD`。
          </p>
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
    return null;
  }

  return (
    <div className="space-y-8">
      <BackHomeLink />

      <section className="panel-shell rounded-[36px] px-6 py-8 sm:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-100">
          <ShieldCheck className="h-4 w-4" />
          Admin Console
        </div>
        <h1 className="mt-5 text-4xl font-semibold text-white">后台管理系统</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
          这里可以统一管理用户账号、查看学习数据概况，并直接新增课程路径与题库内容。
        </p>
      </section>

      <AdminDashboard overview={overview} users={users} content={content} activity={activity} />
    </div>
  );
}

function BackHomeLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/5"
    >
      <ArrowLeft className="h-4 w-4" />
      返回首页
    </Link>
  );
}
