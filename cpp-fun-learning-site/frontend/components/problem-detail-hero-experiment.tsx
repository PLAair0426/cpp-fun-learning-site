import Link from "next/link";
import { ArrowRight, BookOpenText, PlayCircle } from "lucide-react";
import type { ProblemDetail, ProgressOverview } from "../lib/api";
import { type ProblemDetailApproachVariant } from "../lib/experiments";
import { formatLearningTitle } from "../lib/problem-labels";

type ProblemDetailHeroExperimentProps = {
  variant: ProblemDetailApproachVariant;
  problem: ProblemDetail;
  progress: ProgressOverview;
};

export function ProblemDetailHeroExperiment({
  variant,
  problem,
  progress
}: ProblemDetailHeroExperimentProps) {
  const isRunFirst = variant === "a";

  return (
    <section className="panel-shell hero-orbit rounded-[40px] px-6 py-7 sm:px-8 sm:py-8">
      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="section-heading__badge">题目详情</span>
          <span className="site-chip site-chip--accent">
            {isRunFirst ? "先试跑" : "先读题"}
          </span>
          <span className="site-chip site-chip--muted">
            当前主线：{progress.currentPath.title}
          </span>
        </div>

        <h1 className="mt-6 editorial-title text-[clamp(2.45rem,4.6vw,4.45rem)] leading-[1.04] text-white">
          {formatLearningTitle(problem.title)}
        </h1>
        <p className="mt-4 max-w-3xl text-[1.08rem] leading-8 text-cyan-50/88 md:text-[1.14rem] md:leading-9">
          {problem.mission}
        </p>
        <p className="mt-5 max-w-3xl text-[15px] leading-8 text-slate-300 md:text-base">
          {isRunFirst
            ? "你可以先打开运行面板做一次快速验证，再回到题目说明补齐细节。"
            : "建议先读清题意、样例和通过条件，再进入运行与提交。"}
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={isRunFirst ? "#playground" : "#brief"}
            className="nav-pill nav-pill--accent px-5 py-3 text-[15px] font-medium"
          >
            {isRunFirst ? "先打开运行面板" : "先看题目说明"}
            {isRunFirst ? <PlayCircle className="h-4 w-4" /> : <BookOpenText className="h-4 w-4" />}
          </Link>
          <Link
            href={isRunFirst ? "#brief" : "#playground"}
            className="nav-pill px-5 py-3 text-[15px] font-medium"
          >
            {isRunFirst ? "再看题目说明" : "再进入运行面板"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="admin-subcard p-4">
            <p className="soft-kicker">样例数</p>
            <p className="mt-3 text-[2rem] font-semibold leading-none text-white">{problem.examples.length}</p>
          </div>
          <div className="admin-subcard p-4">
            <p className="soft-kicker">提示数</p>
            <p className="mt-3 text-[2rem] font-semibold leading-none text-white">{problem.hints.length}</p>
          </div>
          <div className="admin-subcard p-4">
            <p className="soft-kicker">下一题</p>
            <p className="mt-3 text-[1.08rem] font-semibold leading-7 text-white md:text-[1.14rem]">
              {formatLearningTitle(progress.currentPath.nextProblemTitle)}
            </p>
          </div>
        </div>

        <div className="admin-subcard mt-8 p-5">
          <div className="flex items-center gap-2 text-amber-100">
            <BookOpenText className="h-4 w-4" />
            <p className="soft-kicker text-amber-50/80">建议节奏</p>
          </div>
          <p className="mt-3 text-[15px] leading-8 text-slate-300">
            先读题目和样例 → 确认输入输出格式 → 写最小可运行版本 → 本地运行后再正式提交。
          </p>
        </div>
      </div>
    </section>
  );
}
