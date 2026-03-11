import { ProblemCatalog } from "../../components/problem-catalog";
import { SectionTitle } from "../../components/section-title";
import { getPath, getProblems, getProgressOverview } from "../../lib/api";

function extractProblemSlugsFromActions(actions: string[]) {
  return actions.flatMap((item) => {
    const matches = item.match(/`([^`]+)`/g) ?? [];
    return matches.map((match) => match.slice(1, -1));
  });
}

export default async function ProblemsPage() {
  const [problems, progress] = await Promise.all([getProblems(), getProgressOverview()]);
  const currentPath = await getPath(progress.currentPath.slug);

  const totalTags = new Set(problems.flatMap((problem) => problem.tags)).size;
  const totalTypes = new Set(problems.map((problem) => problem.type)).size;
  const beginnerCount = problems.filter(
    (problem) => problem.difficulty.includes("入门") || problem.difficulty.includes("基础")
  ).length;
  const recommendedProblemSlugs = extractProblemSlugsFromActions(progress.recommendedActions);
  const mainlineFocusCount = currentPath
    ? problems.filter((problem) =>
        problem.tags.some((tag) => currentPath.focusTags.includes(tag))
      ).length
    : 0;

  return (
    <div className="space-y-8">
      <section className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
        <SectionTitle
          badge="Problem Arena"
          title="题库页升级成带主线联动的训练广场，当前推荐、已解锁与筛题视图合到一起"
          description="当前题库已经覆盖输入输出、注释命名、常量、运算符、优先级、流程控制、函数、返回值、sizeof、字符类型、指针，以及 Linux 编译与 gdb 调试等模块。现在你既能自由筛题，也能顺着当前学习路径继续推进下一题。"
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <div className="rounded-[26px] border border-white/8 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">题目总量</p>
            <p className="mt-3 text-3xl font-semibold text-white">{problems.length}</p>
          </div>
          <div className="rounded-[26px] border border-white/8 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">知识点覆盖</p>
            <p className="mt-3 text-base leading-7 text-slate-200">
              已整理 {totalTags} 个知识标签、{totalTypes} 类题型，支持围绕同一模块连续刷题。
            </p>
          </div>
          <div className="rounded-[26px] border border-white/8 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">入门友好度</p>
            <p className="mt-3 text-base leading-7 text-slate-200">
              当前有 {beginnerCount} 道基础 / 入门题可直接上手，适合先建立手感再逐步加难度。
            </p>
          </div>
          <div className="rounded-[26px] border border-cyan-300/15 bg-cyan-300/8 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/80">当前主线</p>
            <p className="mt-3 text-lg font-semibold text-white">{progress.currentPath.title}</p>
            <p className="mt-2 text-sm leading-7 text-slate-200">
              已联动 {mainlineFocusCount} 道相关题，当前下一题是「{progress.currentPath.nextProblemTitle}」。
            </p>
          </div>
        </div>
      </section>

      <ProblemCatalog
        problems={problems}
        insights={{
          currentPathTitle: progress.currentPath.title,
          nextProblemTitle: progress.currentPath.nextProblemTitle,
          focusTags: currentPath?.focusTags ?? [],
          recommendedProblemSlugs,
          recentUnlocks: progress.recentUnlocks
        }}
      />
    </div>
  );
}
