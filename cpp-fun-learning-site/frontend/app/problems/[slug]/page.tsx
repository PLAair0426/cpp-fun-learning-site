import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CheckCheck,
  Layers3,
  ScrollText,
  Trophy
} from "lucide-react";
import { notFound } from "next/navigation";
import { ProblemDetailHeroExperiment } from "../../../components/problem-detail-hero-experiment";
import { ProblemPlayground } from "../../../components/problem-playground";
import { SectionTitle } from "../../../components/section-title";
import {
  EXPERIMENT_COOKIE_NAMES,
  resolveProblemDetailApproachVariant
} from "../../../lib/experiments";
import { formatLearningTitle } from "../../../lib/problem-labels";
import {
  getPath,
  getProblem,
  getProblems,
  getProgressOverview
} from "../../../lib/server-api";

type Params = Promise<{ slug: string }>;

export default async function ProblemDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const variant = resolveProblemDetailApproachVariant(
    cookieStore.get(EXPERIMENT_COOKIE_NAMES.problemDetailApproach)?.value
  );

  const [problem, progress, problems] = await Promise.all([
    getProblem(slug),
    getProgressOverview(),
    getProblems()
  ]);

  if (!problem) {
    notFound();
  }

  const currentPath = await getPath(progress.currentPath.slug);
  const nextProblem = problems.find((item) => item.title === progress.currentPath.nextProblemTitle);
  const nextLesson = currentPath?.modules
    .flatMap((module) => module.lessons)
    .find((lesson) => lesson.title === progress.currentPath.nextLessonTitle);

  const recommendations = {
    nextLesson: {
      href: nextLesson
        ? `/paths/${progress.currentPath.slug}#lesson-${nextLesson.id}`
        : `/paths/${progress.currentPath.slug}`,
      label: "继续主线课程",
      title: progress.currentPath.nextLessonTitle
    },
    nextProblem: nextProblem
      ? {
          href: `/problems/${nextProblem.slug}`,
          label: "继续做下一题",
          title: nextProblem.title
        }
      : undefined,
    pathHome: {
      href: `/paths/${progress.currentPath.slug}`,
      label: "返回当前学习路径",
      title: progress.currentPath.title
    }
  };

  const pathProgress = progress.currentPath.progressPercent;
  const progressRingStyle = {
    background: `conic-gradient(from 210deg, rgba(91,221,255,0.95) 0 ${pathProgress}%, rgba(255,210,124,0.78) ${pathProgress}% ${Math.min(pathProgress + 10, 100)}%, rgba(255,255,255,0.08) ${Math.min(pathProgress + 10, 100)}% 100%)`
  };

  const briefSection = (
    <section id="brief" className="panel-shell rounded-[36px] px-6 py-7 sm:px-8">
      <SectionTitle
        badge="题目摘要"
        title="先读清目标、样例和通过条件"
        description="这一部分帮助你快速建立题目模型，确认输入输出、边界条件和最值得先验证的点。"
      />

      <div className="problem-brief-stats mt-6 grid gap-4 lg:grid-cols-3">
        <div className="admin-subcard problem-brief-card section-strip p-4">
          <p className="soft-kicker">样例数量</p>
          <p className="mt-3 text-[2rem] font-semibold leading-none text-white">{problem.examples.length}</p>
        </div>
        <div className="admin-subcard problem-brief-card section-strip p-4">
          <p className="soft-kicker">通过条件</p>
          <p className="mt-3 text-[2rem] font-semibold leading-none text-white">{problem.acceptance.length}</p>
        </div>
        <div className="admin-subcard problem-brief-card section-strip p-4">
          <p className="soft-kicker">提示条目</p>
          <p className="mt-3 text-[2rem] font-semibold leading-none text-white">{problem.hints.length}</p>
        </div>
      </div>

      <div className="admin-subcard problem-detail-card section-plane mt-6 p-5">
        <div className="flex items-center gap-3 text-cyan-100">
          <ScrollText className="h-5 w-5" />
          <p className="landing-list-title">题目说明</p>
        </div>
        <p className="landing-body-copy problem-detail-copy mt-4">{problem.description}</p>
      </div>

      <div className="problem-detail-columns mt-5 grid gap-5 xl:grid-cols-3">
        <div className="admin-subcard problem-detail-card section-plane p-5">
          <div className="flex items-center gap-3 text-cyan-100">
            <CheckCheck className="h-5 w-5" />
            <p className="landing-list-title">通过条件</p>
          </div>
          {problem.acceptance.length > 0 ? (
            <ul className="mt-4 space-y-3 landing-body-copy">
              {problem.acceptance.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <div className="page-empty-state page-empty-state--compact mt-4">
              <p className="page-empty-state__title">通过条件待补充</p>
              <p className="page-empty-state__body">当前可先结合题意与样例理解目标，条件说明稍后补齐。</p>
            </div>
          )}
        </div>

        <div className="admin-subcard problem-detail-card section-plane p-5">
          <div className="flex items-center gap-3 text-amber-100">
            <BookOpenText className="h-5 w-5" />
            <p className="landing-list-title">解题提示</p>
          </div>
          {problem.hints.length > 0 ? (
            <ul className="mt-4 space-y-3 landing-body-copy">
              {problem.hints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <div className="page-empty-state page-empty-state--compact mt-4">
              <p className="page-empty-state__title">提示暂未开放</p>
              <p className="page-empty-state__body">可以先自己试跑样例，后续会补充这道题的思考引导。</p>
            </div>
          )}
        </div>

        <div className="admin-subcard problem-detail-card section-plane p-5">
          <div className="flex items-center gap-3 text-emerald-100">
            <Trophy className="h-5 w-5" />
            <p className="landing-list-title">样例演练</p>
          </div>
          <div className="mt-4 space-y-4">
            {problem.examples.length > 0 ? (
              problem.examples.map((item, index) => (
                <div key={`${item.input}-${index}`} className="admin-subcard admin-subcard--muted problem-example-card section-plane section-plane--muted p-4">
                  <p className="text-[0.8rem] uppercase tracking-[0.12em] text-slate-400">样例 {index + 1}</p>
                  <div className="mt-3 space-y-2 text-[15px] text-slate-200">
                    <p>
                      <span className="text-slate-400">输入：</span>
                      {item.input}
                    </p>
                    <p>
                      <span className="text-slate-400">输出：</span>
                      {item.output}
                    </p>
                    <p className="landing-list-copy text-slate-300">{item.explanation}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="page-empty-state page-empty-state--compact">
                <p className="page-empty-state__title">样例稍后补充</p>
                <p className="page-empty-state__body">你可以先阅读题意并尝试自己构造输入。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );

  const pathSection = (
    <section className="panel-shell rounded-[36px] px-6 py-7 sm:px-8">
      <SectionTitle
        badge="路径联动"
        title="把这道题放回你的学习路径里"
        description="题目不是孤立存在的。做完这道题后，你可以继续主线课程、下一题，或者回到当前路径总览。"
      />

      <div className="problem-path-grid mt-6 grid gap-4 lg:grid-cols-2">
        <div className="admin-subcard problem-path-progress-card section-plane p-5">
          <div className="atlas-progress" style={progressRingStyle}>
            <div className="atlas-progress__content">
              <div className="atlas-progress__value">{progress.currentPath.progressPercent}%</div>
              <div className="atlas-progress__label">进度</div>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-[15px] text-slate-300">
            <p>当前路径：{progress.currentPath.title}</p>
            <p>剩余任务：{progress.currentPath.remainingMissions}</p>
            <p>连续学习：{progress.streak} 天</p>
          </div>
        </div>

          <div className="grid gap-4">
            <div className="problem-brief-stats grid gap-4 md:grid-cols-3">
              <div className="admin-subcard problem-brief-card section-strip p-4">
                <p className="soft-kicker">经验值</p>
                <p className="mt-2 text-[1.55rem] font-semibold leading-[1.2] text-white">{progress.xp}</p>
              </div>
              <div className="admin-subcard problem-brief-card section-strip p-4">
                <p className="soft-kicker">连续学习</p>
                <p className="mt-2 text-[1.55rem] font-semibold leading-[1.2] text-white">{progress.streak} 天</p>
              </div>
              <div className="admin-subcard problem-brief-card section-strip p-4">
                <p className="soft-kicker">本周目标</p>
                <p className="mt-2 text-[1.55rem] font-semibold leading-[1.2] text-white">
                  {progress.weeklyCompleted}/{progress.weeklyTarget}
              </p>
            </div>
          </div>

            <div className="problem-link-grid grid gap-4 md:grid-cols-3">
              {[recommendations.nextLesson, recommendations.nextProblem, recommendations.pathHome]
                .filter(Boolean)
                .map((item) => (
                  <Link
                    key={item!.href}
                    href={item!.href}
                    className="surface-card problem-nav-card section-plane rounded-[24px] p-5 transition hover:-translate-y-1"
                  >
                    <p className="soft-kicker">{item!.label}</p>
                    <p className="landing-card-title mt-3">
                      {formatLearningTitle(item!.title)}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-2 pt-4 text-[15px] text-cyan-100">
                      继续前往
                      <ArrowRight className="h-4 w-4" />
                    </span>
                </Link>
              ))}
          </div>
        </div>
      </div>

      <div className="problem-detail-columns mt-5 grid gap-4 md:grid-cols-3">
        <div className="admin-subcard problem-detail-card section-plane p-5">
          <div className="flex items-center gap-3 text-violet-100">
            <ScrollText className="h-5 w-5" />
            <p className="landing-list-title">作答节奏</p>
          </div>
          <ul className="mt-4 space-y-3 landing-body-copy">
            <li>先确认输入输出格式，再补边界条件。</li>
            <li>先跑通样例，再考虑优化表达与结构。</li>
            <li>正式提交前先看运行日志，避免把明显错误带入判题。</li>
          </ul>
        </div>

        <div className="admin-subcard problem-detail-card section-plane p-5">
          <div className="flex items-center gap-3 text-cyan-100">
            <Layers3 className="h-5 w-5" />
            <p className="landing-list-title">推荐动作</p>
          </div>
          <ul className="mt-4 space-y-3 landing-body-copy">
            {progress.recommendedActions.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="admin-subcard problem-detail-card section-plane p-5">
          <div className="flex items-center gap-3 text-amber-100">
            <BookOpenText className="h-5 w-5" />
            <p className="landing-list-title">最近解锁</p>
          </div>
          <ul className="mt-4 space-y-3 landing-body-copy text-slate-200">
            {progress.recentUnlocks.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );

  const playgroundSection = (
    <div id="playground">
      <ProblemPlayground problem={problem} recommendations={recommendations} variant={variant} />
    </div>
  );

  return (
    <div className="learn-page space-y-8 pb-8">
      <Link href="/problems" className="nav-pill learn-page__back w-fit text-[15px] font-medium">
        <ArrowLeft className="h-4 w-4" />
        返回题库
      </Link>

      <ProblemDetailHeroExperiment variant={variant} problem={problem} progress={progress} />

      {variant === "a" ? (
        <div className="space-y-8">
          {playgroundSection}
          <div className="grid gap-6 xl:grid-cols-2">
            {briefSection}
            {pathSection}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-6 xl:grid-cols-2">
            {briefSection}
            {pathSection}
          </div>
          {playgroundSection}
        </div>
      )}
    </div>
  );
}
