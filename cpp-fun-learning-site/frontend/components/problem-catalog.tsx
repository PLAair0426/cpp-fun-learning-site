"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RotateCcw, Search, Sparkles, Target } from "lucide-react";
import type { ProblemSummary } from "../lib/api";
import type { ProblemsStrategyVariant } from "../lib/experiments";
import {
  formatLearningTitle,
  formatProblemDifficultyLabel,
  formatProblemTagLabel,
  formatProblemTypeLabel
} from "../lib/problem-labels";

export type ProblemCatalogInsights = {
  currentPathTitle: string;
  nextProblemTitle: string;
  focusTags: string[];
  recommendedProblemSlugs: string[];
  recentUnlocks: string[];
};

type ProblemCatalogProps = {
  problems: ProblemSummary[];
  insights?: ProblemCatalogInsights;
  variant?: ProblemsStrategyVariant;
};

const ALL_LABEL = "全部";

function getFocusMatchCount(problem: ProblemSummary, insights?: ProblemCatalogInsights) {
  if (!insights) return 0;
  return problem.tags.filter((item) => insights.focusTags.includes(item)).length;
}

function getTrackLabel(problem: ProblemSummary, insights?: ProblemCatalogInsights) {
  if (problem.title === insights?.nextProblemTitle) return "下一题";
  if (insights?.recommendedProblemSlugs.includes(problem.slug)) return "推荐";
  if (getFocusMatchCount(problem, insights) > 0) return "主线相关";
  return "自由探索";
}

export function ProblemCatalog({
  problems,
  insights,
  variant = "a"
}: ProblemCatalogProps) {
  const [keyword, setKeyword] = useState("");
  const [tag, setTag] = useState(ALL_LABEL);
  const [difficulty, setDifficulty] = useState(ALL_LABEL);
  const [routeOnly, setRouteOnly] = useState(variant === "b");

  const tags = useMemo(
    () => [ALL_LABEL, ...new Set(problems.flatMap((problem) => problem.tags))],
    [problems]
  );
  const difficulties = useMemo(
    () => [ALL_LABEL, ...new Set(problems.map((problem) => problem.difficulty))],
    [problems]
  );
  const activeSummary = [
    keyword.trim() ? `搜索：${keyword.trim()}` : null,
    tag !== ALL_LABEL ? `标签：${formatProblemTagLabel(tag)}` : null,
    difficulty !== ALL_LABEL ? `难度：${formatProblemDifficultyLabel(difficulty)}` : null,
    routeOnly ? "当前范围：推荐题" : "当前范围：全部题目"
  ].filter((item): item is string => Boolean(item));

  const orderedProblems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const filtered = problems.filter((problem) => {
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        problem.title.toLowerCase().includes(normalizedKeyword) ||
        formatLearningTitle(problem.title).toLowerCase().includes(normalizedKeyword) ||
        problem.mission.toLowerCase().includes(normalizedKeyword) ||
        problem.tags.some(
          (item) =>
            item.toLowerCase().includes(normalizedKeyword) ||
            formatProblemTagLabel(item).toLowerCase().includes(normalizedKeyword)
        );
      const matchesTag = tag === ALL_LABEL || problem.tags.includes(tag);
      const matchesDifficulty = difficulty === ALL_LABEL || problem.difficulty === difficulty;
      const matchesRoute =
        !routeOnly ||
        getFocusMatchCount(problem, insights) > 0 ||
        Boolean(insights?.recommendedProblemSlugs.includes(problem.slug));

      return matchesKeyword && matchesTag && matchesDifficulty && matchesRoute;
    });

    return filtered.sort((left, right) => {
      const leftRecommended = insights?.recommendedProblemSlugs.includes(left.slug) ? 1 : 0;
      const rightRecommended = insights?.recommendedProblemSlugs.includes(right.slug) ? 1 : 0;
      const leftFocus = getFocusMatchCount(left, insights);
      const rightFocus = getFocusMatchCount(right, insights);
      const leftNext = left.title === insights?.nextProblemTitle ? 1 : 0;
      const rightNext = right.title === insights?.nextProblemTitle ? 1 : 0;

      if (routeOnly) {
        return (
          rightNext - leftNext ||
          rightRecommended - leftRecommended ||
          rightFocus - leftFocus ||
          left.title.localeCompare(right.title)
        );
      }

      return (
        rightRecommended - leftRecommended ||
        rightFocus - leftFocus ||
        left.title.localeCompare(right.title)
      );
    });
  }, [difficulty, insights, keyword, problems, routeOnly, tag, variant]);

  return (
    <section id="problem-catalog" className="space-y-5">
      <div className="panel-shell rounded-[34px] p-5">
        <div className="problem-toolbar-grid grid gap-5 xl:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="soft-kicker">题库总览</p>
              <h2 className="mt-2 text-[1.95rem] font-semibold leading-[1.22] text-white md:text-[2.1rem]">
                用更少犹豫，找到更适合现在的那一道题
              </h2>
              <p className="mt-3 max-w-3xl text-[15px] leading-8 text-slate-300 md:text-base">
                你可以按主题搜索、按难度缩小范围，也可以让当前主线把更合适的题目顶到前面。
              </p>
            </div>

            <div className="problem-filter-grid grid gap-4 lg:grid-cols-3">
              <label className="space-y-2">
                <span className="clay-field__label">搜索</span>
                <div className="field-surface flex items-center gap-3 px-4">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    className="min-h-[54px] w-full bg-transparent text-[15px] leading-7 text-slate-100 outline-none"
                    placeholder="例如：数组、指针、循环"
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="clay-field__label">标签</span>
                <select value={tag} onChange={(event) => setTag(event.target.value)} className="field-surface text-[15px]">
                  {tags.map((item) => (
                    <option key={item} value={item}>
                      {item === ALL_LABEL ? item : formatProblemTagLabel(item)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="clay-field__label">难度</span>
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className="field-surface text-[15px]"
                >
                  {difficulties.map((item) => (
                    <option key={item} value={item}>
                      {item === ALL_LABEL ? item : formatProblemDifficultyLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {insights?.focusTags?.length ? (
              <div className="page-tag-group">
                {insights.focusTags.slice(0, 8).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTag(item)}
                    className={`site-chip ${tag === item ? "site-chip--accent" : "site-chip--muted"}`}
                  >
                    {formatProblemTagLabel(item)}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="page-tag-group page-tag-group--tight">
              {activeSummary.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className={
                    index === activeSummary.length - 1
                      ? "site-chip site-chip--accent"
                      : "site-chip site-chip--muted"
                  }
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="problem-side-stack flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setRouteOnly((current) => !current)}
              className={`nav-pill justify-center px-4 py-3 text-sm font-medium ${routeOnly ? "nav-pill--accent" : ""}`}
            >
              <Sparkles className="h-4 w-4" />
              {routeOnly ? "显示全部题目" : "只看推荐题"}
            </button>

            <div className="surface-card problem-result-card rounded-[24px] p-4">
              <p className="soft-kicker">当前结果</p>
              <p className="mt-3 text-[2rem] font-semibold leading-none text-white md:text-[2.2rem]">
                {orderedProblems.length}
              </p>
              <p className="mt-2 text-[15px] leading-8 text-slate-300">
                会结合推荐权重、主线相关度和你的筛选条件自动排序。
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setKeyword("");
                setTag(ALL_LABEL);
                setDifficulty(ALL_LABEL);
                setRouteOnly(variant === "b");
              }}
              className="nav-pill justify-center px-4 py-3 text-sm font-medium"
            >
              <RotateCcw className="h-4 w-4" />
              重置筛选
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {orderedProblems.map((problem, index) => {
          const accentLabel = index % 4 === 0 ? "重点推荐" : index % 4 === 1 ? "稳定推进" : index % 4 === 2 ? "热身练习" : "延伸挑战";

          return (
            <Link key={problem.slug} href={`/problems/${problem.slug}`} className="group">
              <article
                className="surface-card problem-card-balanced h-full rounded-[28px] p-5 transition-transform duration-200 group-hover:-translate-y-1"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="site-chip">{formatProblemDifficultyLabel(problem.difficulty)}</span>
                  <span className="site-chip site-chip--muted">{formatProblemTypeLabel(problem.type)}</span>
                  <span className="site-chip site-chip--accent">{getTrackLabel(problem, insights)}</span>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <div className="admin-step-badge">
                    <Target className="h-4 w-4 text-slate-100" />
                  </div>
                  <div>
                    <p className="soft-kicker">{accentLabel}</p>
                    <h3 className="landing-card-title mt-1">
                      {formatLearningTitle(problem.title)}
                    </h3>
                  </div>
                </div>

                <p className="landing-body-copy problem-card-copy mt-4">{problem.mission}</p>

                <div className="page-tag-group page-tag-group--tight mt-4">
                  {problem.tags.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        setTag(item);
                      }}
                      className="site-chip site-chip--muted"
                    >
                      {formatProblemTagLabel(item)}
                    </button>
                  ))}
                </div>

                <div className="mt-auto inline-flex items-center gap-2 pt-5 text-[15px] font-semibold text-slate-100">
                  查看题目
                  <Sparkles className="h-4 w-4" />
                </div>
              </article>
            </Link>
          );
        })}
      </div>

      {orderedProblems.length === 0 ? (
        <div className="page-empty-state p-6">
          <p className="soft-kicker">当前没有匹配结果</p>
          <h3 className="page-empty-state__title mt-2">
            试着放宽筛选条件，或切回全部题目。
          </h3>
          <p className="page-empty-state__body max-w-2xl">
            你可以先清空关键词、恢复全部标签和难度，或者先显示全部题目，再挑更适合当前阶段的练习。
          </p>
          <div className="page-empty-state__actions mt-4">
            <button
              type="button"
              onClick={() => {
                setKeyword("");
                setTag(ALL_LABEL);
                setDifficulty(ALL_LABEL);
                setRouteOnly(variant === "b");
              }}
              className="nav-pill nav-pill--accent px-5 py-3 text-sm font-medium"
            >
              恢复默认筛选
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
