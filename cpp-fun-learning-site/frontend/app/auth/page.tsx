import Link from "next/link";
import { ArrowLeft, LockKeyhole, Sparkles } from "lucide-react";
import { AuthPanel } from "../../components/auth-panel";
import { SectionTitle } from "../../components/section-title";
import { getCurrentUser, getMySubmissions } from "../../lib/server-api";

export default async function AuthPage() {
  const currentUser = await getCurrentUser();
  const submissions = currentUser ? await getMySubmissions() : [];

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/5"
      >
        <ArrowLeft className="h-4 w-4" />
        返回首页
      </Link>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <div className="panel-shell relative overflow-hidden rounded-[36px] px-6 py-7 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.16),transparent_32%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-100">
              <LockKeyhole className="h-4 w-4" />
              Personal Space
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold text-white sm:text-5xl">
              登录后，你的提交记录、通过结果和成长数据只属于你自己。
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              现在这个学习站点已经支持用户注册与登录。正式提交会绑定账号，其他使用者无法查看你的记录，首页成长面板也会按你的个人进度生成。
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">个人记录</p>
                <p className="mt-3 text-lg font-medium text-white">题目状态流只对当前账号开放</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">成长面板</p>
                <p className="mt-3 text-lg font-medium text-white">XP、连续学习和周目标按账号累计</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">跨设备继续</p>
                <p className="mt-3 text-lg font-medium text-white">同一账号登录后可继续查看自己的历史提交</p>
              </div>
            </div>
          </div>
        </div>

        <AuthPanel currentUser={currentUser} />
      </section>

      <section className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
        <SectionTitle
          badge="My History"
          title={currentUser ? "最近提交记录" : "登录后查看你的提交记录"}
          description={
            currentUser
              ? "这里展示当前账号最近的正式提交，用来快速回看题目状态与结果。"
              : "注册或登录后，这里会显示只属于你的最近提交历史。"
          }
        />

        {currentUser ? (
          submissions.length > 0 ? (
            <div className="mt-6 grid gap-3">
              {submissions.map((item) => (
                <div
                  key={item.submissionId}
                  className="flex flex-col gap-3 rounded-[24px] border border-white/8 bg-white/5 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      {item.problemSlug}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{item.problemTitle}</h3>
                    <p className="mt-2 text-sm text-slate-300">
                      提交状态：{item.status} · 结果：{item.result || "待判定"}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">
                    <Sparkles className="h-4 w-4 text-cyan-100" />
                    {new Date(item.updatedAt).toLocaleString("zh-CN")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[26px] border border-dashed border-white/12 bg-white/5 px-5 py-8 text-sm leading-7 text-slate-300">
              当前账号还没有正式提交记录。去题库完成第一次提交后，这里就会开始累计你的个人历史。
            </div>
          )
        ) : (
          <div className="mt-6 rounded-[26px] border border-dashed border-white/12 bg-white/5 px-5 py-8 text-sm leading-7 text-slate-300">
            未登录时不会展示任何他人的提交数据。请先登录或注册，系统只会读取当前账号对应的记录。
          </div>
        )}
      </section>
    </div>
  );
}
