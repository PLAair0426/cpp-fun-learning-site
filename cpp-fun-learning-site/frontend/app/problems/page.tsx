import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, Compass, Sparkles, Target } from "lucide-react";
import { ProblemCatalog, type ProblemCatalogInsights } from "../../components/problem-catalog";
import { ProblemsHeroExperiment } from "../../components/problems-hero-experiment";
import {
  EXPERIMENT_COOKIE_NAMES,
  resolveProblemsStrategyVariant
} from "../../lib/experiments";
import { formatLearningTitle } from "../../lib/problem-labels";
import { getPath, getProblems, getProgressOverview } from "../../lib/server-api";

export default async function ProblemsPage() {
  const cookieStore = await cookies();
  const variant = resolveProblemsStrategyVariant(
    cookieStore.get(EXPERIMENT_COOKIE_NAMES.problemsStrategy)?.value
  );

  const [problems, progress] = await Promise.all([getProblems(), getProgressOverview()]);
  const currentPath = await getPath(progress.currentPath.slug);

  const insights: ProblemCatalogInsights | undefined = currentPath
    ? {
        currentPathTitle: currentPath.title,
        nextProblemTitle: progress.currentPath.nextProblemTitle,
        focusTags: currentPath.focusTags,
        recommendedProblemSlugs: currentPath.recommendedProblems.map((item) => item.slug),
        recentUnlocks: progress.recentUnlocks
      }
    : undefined;
  const recommendedProblemSlugs = insights?.recommendedProblemSlugs ?? [];
  const mainlineFocusCount = problems.filter((problem) => {
    if (problem.title === progress.currentPath.nextProblemTitle) return true;
    if (recommendedProblemSlugs.includes(problem.slug)) return true;
    return problem.tags.some((tag) => insights?.focusTags.includes(tag));
  }).length;
  const recommendedSlug = recommendedProblemSlugs[0] ?? problems[0]?.slug;
  const closingCopy =
    variant === "a"
      ? {
          title: "先按标签和难度缩小范围，再挑一题开始。",
          description:
            "如果今天目标明确，可以先筛出最贴近当前需求的题目。"
        }
      : {
          title: "先从推荐题开始，再逐步扩展到更多练习。",
          description:
            "如果你想少做选择，系统会把更贴近当前路径的题目放在前面。"
        };

  return (
    <div className="learn-page space-y-8 pb-10">
      <ProblemsHeroExperiment
        variant={variant}
        problems={problems}
        progress={progress}
        recommendedProblemSlugs={recommendedProblemSlugs}
        mainlineFocusCount={mainlineFocusCount}
      />

      <section className="problem-info-grid grid gap-4 xl:grid-cols-3">
        <div className="surface-card problem-info-card section-plane section-plane--muted rounded-[28px]">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-slate-100" />
            <p className="landing-card-title">主线联动练习</p>
          </div>
          <p className="landing-body-copy">
            题目不仅能按关键词出现，也会因为和当前主线高度相关而被提前展示。
          </p>
        </div>
        <div className="surface-card problem-info-card section-plane section-plane--muted rounded-[28px]">
          <div className="flex items-center gap-3">
            <Compass className="h-5 w-5 text-slate-100" />
            <p className="landing-card-title">两种浏览方式</p>
          </div>
          <p className="landing-body-copy">
            一种强调精确筛选，一种强调沿主线推进，让不同阶段的用户都能更顺手。
          </p>
        </div>
        <div className="surface-card problem-info-card section-plane section-plane--muted rounded-[28px]">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-slate-100" />
            <p className="landing-card-title">降低选择疲劳</p>
          </div>
          <p className="landing-body-copy">
            更清晰的统计、更柔和的卡片和更强的主线提示，都会让“做哪题”这件事更容易。
          </p>
        </div>
      </section>

      <ProblemCatalog problems={problems} insights={insights} variant={variant} />

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
              {recommendedSlug ? (
                <Link href={`/problems/${recommendedSlug}`} className="nav-pill nav-pill--accent px-5 py-3 text-sm font-medium">
                  打开推荐题
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
              <Link href="/paths" className="nav-pill px-5 py-3 text-sm font-medium">
                回到路径地图
              </Link>
            </div>
          </div>

          <div className="surface-card page-followup-side section-plane rounded-[28px] p-5">
            <p className="soft-kicker">当前建议</p>
            <p className="landing-card-title mt-2">
              {insights?.nextProblemTitle
                ? formatLearningTitle(insights.nextProblemTitle)
                : "先选一道热身题开始"}
            </p>
            <p className="landing-body-copy mt-3">
              {variant === "b"
                ? "系统会优先把这道题和同主题练习放在前面，方便你连续推进。"
                : "你可以先按关键词、标签和难度缩小范围，再决定从哪一道题开始。"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
