import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, Clock3, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { AuthHeroExperiment } from "../../components/auth-hero-experiment";
import { AuthPanel } from "../../components/auth-panel";
import { buildAuthAccessHref } from "../../lib/auth-links";
import {
  EXPERIMENT_COOKIE_NAMES,
  resolveAuthAccessVariant
} from "../../lib/experiments";
import { getCurrentUser, getMySubmissions } from "../../lib/server-api";

function formatResultLabel(status: string, result: string) {
  if (result && result.trim()) {
    return result;
  }

  return status || "待处理";
}

export default async function AuthPage() {
  const cookieStore = await cookies();
  const variant = resolveAuthAccessVariant(
    cookieStore.get(EXPERIMENT_COOKIE_NAMES.authAccess)?.value
  );

  const currentUser = await getCurrentUser();
  const submissions = currentUser ? (await getMySubmissions()) ?? [] : [];
  const lastSubmission = submissions?.[0];
  const closingCopy =
    variant === "a"
      ? {
          title: "登录之后，学习记录会一直跟着你。",
          description:
            "无论是继续做题、回看提交，还是重新打开网站，你都能从自己的进度继续。"
        }
      : {
          title: "创建账号后，就能直接回到今天的学习任务。",
          description:
            "注册和登录都保持轻量，进入后可以继续课程路径、练习题目和个人记录。"
        };

  return (
    <div className="learn-page space-y-8 pb-10">
      <Link href="/" className="nav-pill learn-page__back w-fit px-4 py-2 text-sm font-medium">
        <ArrowLeft className="h-4 w-4" />
        返回首页
      </Link>

      <AuthHeroExperiment variant={variant} currentUser={currentUser} submissions={submissions} />

      <AuthPanel currentUser={currentUser} variant={variant} />

      <section className="auth-info-grid grid gap-4 xl:grid-cols-3">
        <div className="surface-card auth-info-card section-plane section-plane--muted rounded-[28px]">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-slate-100" />
            <p className="landing-card-title">账号隔离</p>
          </div>
          <p className="landing-body-copy">
            每个学习者都拥有独立的提交记录、连击天数和后续推荐，不会与其他人互相影响。
          </p>
        </div>
        <div className="surface-card auth-info-card section-plane section-plane--muted rounded-[28px]">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-slate-100" />
            <p className="landing-card-title">最近动作</p>
          </div>
          <p className="landing-body-copy">
            {lastSubmission
              ? `${lastSubmission.problemTitle} · ${formatResultLabel(
                  lastSubmission.status,
                  lastSubmission.result
                )}`
              : "登录之后，最近一次通过、待判定或失败的提交会出现在这里。"}
            </p>
        </div>
        <div className="surface-card auth-info-card section-plane section-plane--muted rounded-[28px]">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-slate-100" />
            <p className="landing-card-title">为什么重要</p>
          </div>
          <p className="landing-body-copy">
            登录体验越顺滑，学习者越容易持续推进，不会在关键时刻被流程打断。
          </p>
        </div>
      </section>

      <section className="panel-shell rounded-[36px] px-6 py-6 md:px-8 md:py-8">
        <div className="page-followup-grid grid gap-5 xl:grid-cols-2">
          <div>
            <p className="soft-kicker">下一步</p>
            <h2 className="landing-section-title text-white">
              {closingCopy.title}
            </h2>
            <p className="mt-3 max-w-2xl text-[1.02rem] leading-8 text-slate-300 md:text-[1.06rem] md:leading-9">
              {closingCopy.description}
            </p>
            <div className="page-action-row mt-5">
              <Link
                href={currentUser ? "#auth-panel" : buildAuthAccessHref({ mode: "register", redirectTo: "/auth" })}
                className="nav-pill nav-pill--accent px-5 py-3 text-sm font-medium"
              >
                {currentUser ? "打开账号面板" : "前往登录 / 注册"}
                <Sparkles className="h-4 w-4" />
              </Link>
              <Link href="/paths" className="nav-pill px-5 py-3 text-sm font-medium">
                去看学习路径
              </Link>
            </div>
          </div>

          <div className="surface-card page-followup-side section-plane rounded-[28px] p-5">
            <p className="soft-kicker">账号说明</p>
            <p className="landing-card-title mt-2">
              登录和注册已经迁移到独立入口页。
            </p>
            <p className="landing-body-copy mt-3">
              当前页面只保留账号状态、最近记录和学习入口；账号操作请前往独立页面完成。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
