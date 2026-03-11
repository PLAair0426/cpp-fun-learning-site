import Link from "next/link";
import {
  ArrowLeft,
  CheckCheck,
  Cpu,
  Flag,
  Layers3,
  ScrollText,
  Sparkles,
  Trophy
} from "lucide-react";
import { notFound } from "next/navigation";
import { ProblemPlayground } from "../../../components/problem-playground";
import { SectionTitle } from "../../../components/section-title";
import { getPath, getProblem, getProblems, getProgressOverview } from "../../../lib/server-api";

type Params = Promise<{ slug: string }>;

export default async function ProblemDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
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
          label: "继续练下一题",
          title: nextProblem.title
        }
      : undefined,
    pathHome: {
      href: `/paths/${progress.currentPath.slug}`,
      label: "返回当前学习路径",
      title: progress.currentPath.title
    }
  };

  return (
    <div className="space-y-8">
      <Link
        href="/problems"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/5"
      >
        <ArrowLeft className="h-4 w-4" />
        返回题库
      </Link>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.94fr)_minmax(420px,1.06fr)]">
        <div className="space-y-6">
          <div className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-violet-100">
                {problem.type}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                {problem.difficulty}
              </span>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                {problem.runtime}
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-semibold text-white">{problem.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-cyan-50/90">{problem.mission}</p>
            <p className="mt-5 text-base leading-8 text-slate-300">{problem.description}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {problem.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/8 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">样例数量</p>
                <p className="mt-3 text-3xl font-semibold text-white">{problem.examples.length}</p>
              </div>
              <div className="rounded-[24px] border border-white/8 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">通过条件</p>
                <p className="mt-3 text-3xl font-semibold text-white">{problem.acceptance.length}</p>
              </div>
              <div className="rounded-[24px] border border-white/8 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">提示数量</p>
                <p className="mt-3 text-3xl font-semibold text-white">{problem.hints.length}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[28px] border border-white/8 bg-white/5 p-5">
              <div className="flex items-center gap-3 text-cyan-100">
                <CheckCheck className="h-5 w-5" />
                <p className="text-sm font-medium">通关条件</p>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                {problem.acceptance.map((item) => (
                  <li key={item} className="rounded-[18px] border border-white/8 bg-slate-950/45 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-white/5 p-5">
              <div className="flex items-center gap-3 text-amber-100">
                <Flag className="h-5 w-5" />
                <p className="text-sm font-medium">解题提示</p>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                {problem.hints.map((item) => (
                  <li key={item} className="rounded-[18px] border border-white/8 bg-slate-950/45 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-slate-950/55 p-5">
            <SectionTitle
              badge="Examples"
              title="样例输入输出拆解"
              description="先看样例理解题目，再打开右侧 playground 快速验证。每个样例都对应一次完整的输入、处理与输出流程。"
            />
            <div className="mt-5 space-y-4">
              {problem.examples.map((example, index) => (
                <div
                  key={`${example.input}-${index}`}
                  className="rounded-[24px] border border-white/8 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                      Example {index + 1}
                    </p>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                      适合先手推再运行
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Input</p>
                      <pre className="mt-2 overflow-x-auto rounded-[20px] border border-white/8 bg-slate-950/80 p-4 text-sm text-cyan-100">
                        <code>{example.input}</code>
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Output</p>
                      <pre className="mt-2 overflow-x-auto rounded-[20px] border border-white/8 bg-slate-950/80 p-4 text-sm text-emerald-100">
                        <code>{example.output}</code>
                      </pre>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-300">{example.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel-shell rounded-[34px] px-4 py-4 sm:px-5 sm:py-5">
            <div className="mb-4 flex items-center justify-between gap-4 px-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Runner</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">在线试跑与正式提交</h2>
              </div>
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100">
                <Cpu className="h-5 w-5" />
              </div>
            </div>
            <ProblemPlayground problem={problem} recommendations={recommendations} />
          </div>

          <div className="panel-shell rounded-[30px] px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-3 text-violet-100">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.36em] text-violet-200/80">Progress Pulse</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">{progress.currentPath.title}</h2>
                </div>
              </div>
              <Link
                href={`/paths/${progress.currentPath.slug}`}
                className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-100 transition hover:border-cyan-300/20 hover:bg-white/5"
              >
                查看路径
              </Link>
            </div>

            <div className="mt-5 overflow-hidden rounded-full border border-white/8 bg-slate-950/70">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-300"
                style={{ width: `${progress.currentPath.progressPercent}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-300">
              <span>当前进度 {progress.currentPath.progressPercent}%</span>
              <span>剩余任务 {progress.currentPath.remainingMissions}</span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href={recommendations.nextLesson.href}
                className="rounded-[22px] border border-white/8 bg-white/5 p-4 transition hover:bg-white/8"
              >
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">下一节课</p>
                <p className="mt-2 text-sm leading-7 text-white">{progress.currentPath.nextLessonTitle}</p>
              </Link>
              <Link
                href={recommendations.nextProblem?.href ?? "/problems"}
                className="rounded-[22px] border border-white/8 bg-white/5 p-4 transition hover:bg-white/8"
              >
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">下一道练习</p>
                <p className="mt-2 text-sm leading-7 text-white">{progress.currentPath.nextProblemTitle}</p>
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">累计 XP</p>
                <p className="mt-2 text-2xl font-semibold text-white">{progress.xp}</p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">连续学习</p>
                <p className="mt-2 text-2xl font-semibold text-white">{progress.streak} 天</p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">本周目标</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {progress.weeklyCompleted}/{progress.weeklyTarget}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[28px] border border-white/8 bg-white/5 p-5">
              <div className="flex items-center gap-3 text-violet-100">
                <ScrollText className="h-5 w-5" />
                <p className="text-sm font-medium">作答节奏</p>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                <li>先根据描述补齐核心逻辑，再对照样例检查边界。</li>
                <li>输入题建议先手写一轮标准输入输出格式。</li>
                <li>提交前查看 Console Output，确认没有编译警告。</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-white/5 p-5">
              <div className="flex items-center gap-3 text-cyan-100">
                <Layers3 className="h-5 w-5" />
                <p className="text-sm font-medium">推荐动作</p>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                {progress.recommendedActions.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-[28px] border border-amber-300/15 bg-amber-300/8 p-5">
              <div className="flex items-center gap-3 text-amber-100">
                <Sparkles className="h-5 w-5" />
                <p className="text-sm font-medium">最近解锁</p>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-200">
                {progress.recentUnlocks.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
