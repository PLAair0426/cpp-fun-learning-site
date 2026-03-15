import Link from "next/link";
import { ArrowRight, Compass, Filter } from "lucide-react";
import type { ProblemSummary, ProgressOverview } from "../lib/api";
import { type ProblemsStrategyVariant } from "../lib/experiments";
import { formatLearningTitle, isBeginnerDifficulty } from "../lib/problem-labels";

type ProblemsHeroExperimentProps = {
  variant: ProblemsStrategyVariant;
  problems: ProblemSummary[];
  progress: ProgressOverview;
  recommendedProblemSlugs: string[];
  mainlineFocusCount: number;
};

function isBeginnerProblem(problem: ProblemSummary) {
  return isBeginnerDifficulty(problem.difficulty);
}

export function ProblemsHeroExperiment({
  variant,
  problems,
  progress,
  recommendedProblemSlugs,
  mainlineFocusCount
}: ProblemsHeroExperimentProps) {
  const beginnerCount = problems.filter(isBeginnerProblem).length;
  const isRouteFirst = variant === "b";

  const heroCopy = isRouteFirst
    ? {
        title: "先从推荐题开始，再逐步扩展练习范围",
        description:
          "系统会优先突出当前学习路径的下一题、推荐题和焦点标签题，适合希望连续推进的人。",
        primaryHref: "#problem-catalog",
        primaryLabel: "先看推荐练习",
        secondaryHref: `/paths/${progress.currentPath.slug}`,
        secondaryLabel: "查看当前路径"
      }
    : {
        title: "先缩小范围，再快速进入练习",
        description:
          "你可以先按关键词、标签与难度筛选，适合已经知道目标、想快速定位题目的人。",
        primaryHref: "#problem-catalog",
        primaryLabel: "先去筛选题目",
        secondaryHref: "/paths",
        secondaryLabel: "先看路径地图"
      };

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <div className="panel-shell hero-orbit rounded-[40px] px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="section-heading__badge">题目练习</span>
            <span className="rounded-full border border-cyan-300/18 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-50">
              {isRouteFirst ? "推荐练习" : "自由筛选"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-200">
              当前主线：{progress.currentPath.title}
            </span>
          </div>

          <h1 className="mt-7 max-w-4xl editorial-title text-[clamp(2.9rem,5.2vw,5.2rem)] leading-[0.95] text-white">
            {heroCopy.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            {heroCopy.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={heroCopy.primaryHref} className="nav-pill nav-pill--accent px-5 py-3 text-sm font-medium">
              {heroCopy.primaryLabel}
              {isRouteFirst ? <ArrowRight className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            </Link>
            <Link href={heroCopy.secondaryHref} className="nav-pill px-5 py-3 text-sm font-medium">
              {heroCopy.secondaryLabel}
              <Compass className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="admin-subcard p-5">
              <p className="soft-kicker">题库总量</p>
              <p className="mt-3 text-3xl font-semibold text-white">{problems.length}</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">覆盖当前站点可练习的全部题目。</p>
            </div>
            <div className="admin-subcard p-5">
              <p className="soft-kicker">入门题</p>
              <p className="mt-3 text-3xl font-semibold text-white">{beginnerCount}</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">适合热身、巩固基础和快速反馈。</p>
            </div>
            <div className="admin-subcard p-5">
              <p className="soft-kicker text-cyan-100/80">下一题</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {formatLearningTitle(progress.currentPath.nextProblemTitle)}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-200">继续当前主线时，优先完成这一题。</p>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-shell rounded-[36px] px-6 py-7">
        <p className="soft-kicker">主线快照</p>
        <h2 className="mt-3 editorial-title text-2xl text-white">当前题库与主线的关系</h2>

        <div className="mt-6 grid gap-4">
          <div className="admin-subcard p-4">
            <p className="soft-kicker">主线相关题</p>
            <p className="mt-2 text-3xl font-semibold text-white">{mainlineFocusCount}</p>
          </div>
          <div className="admin-subcard p-4">
            <p className="soft-kicker">推荐题</p>
            <p className="mt-2 text-3xl font-semibold text-white">{recommendedProblemSlugs.length}</p>
          </div>
          <div className="admin-subcard p-4">
            <div className="inline-flex items-center gap-2 text-amber-50">
              {isRouteFirst ? <Compass className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
              <p className="soft-kicker text-amber-50/80">
                {isRouteFirst ? "推荐练习" : "自由筛选"}
              </p>
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-200">
              {isRouteFirst
                ? `建议优先完成：${formatLearningTitle(progress.currentPath.nextProblemTitle)}；当前主线还剩 ${progress.currentPath.remainingMissions} 个关键任务。`
                : "你可以先用关键词、标签和难度把范围缩小，再决定进入哪一道题。"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
