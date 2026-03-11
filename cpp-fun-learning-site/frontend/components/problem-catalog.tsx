"use client";

import Link from "next/link";
import { ArrowRight, Search, Sparkles, Target, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProblemSummary } from "../lib/api";

const allLabel = "全部";

type ProblemCatalogProps = {
  problems: ProblemSummary[];
  insights?: {
    currentPathTitle: string;
    nextProblemTitle: string;
    focusTags: string[];
    recommendedProblemSlugs: string[];
    recentUnlocks: string[];
  };
};

function getTrackLabel(problem: ProblemSummary) {
  if (problem.difficulty.includes("入门") || problem.difficulty.includes("基础")) {
    return "基础巩固";
  }

  if (problem.difficulty.includes("进阶") || problem.difficulty.includes("提高")) {
    return "进阶冲刺";
  }

  return "主线任务";
}

export function ProblemCatalog({ problems, insights }: ProblemCatalogProps) {
  const [keyword, setKeyword] = useState("");
  const [tag, setTag] = useState(allLabel);
  const [difficulty, setDifficulty] = useState(allLabel);

  const tags = useMemo(
    () => [allLabel, ...Array.from(new Set(problems.flatMap((item) => item.tags)))],
    [problems]
  );

  const difficulties = useMemo(
    () => [allLabel, ...Array.from(new Set(problems.map((item) => item.difficulty)))],
    [problems]
  );

  const filtered = useMemo(() => {
    return problems.filter((item) => {
      const normalizedKeyword = keyword.trim().toLowerCase();
      const matchesKeyword =
        !normalizedKeyword ||
        item.title.toLowerCase().includes(normalizedKeyword) ||
        item.mission.toLowerCase().includes(normalizedKeyword) ||
        item.tags.some((currentTag) => currentTag.toLowerCase().includes(normalizedKeyword));
      const matchesTag = tag === allLabel || item.tags.includes(tag);
      const matchesDifficulty = difficulty === allLabel || item.difficulty === difficulty;
      return matchesKeyword && matchesTag && matchesDifficulty;
    });
  }, [difficulty, keyword, problems, tag]);

  const typeCount = useMemo(() => new Set(problems.map((item) => item.type)).size, [problems]);
  const highlightedTags = useMemo(() => tags.slice(1, 7), [tags]);
  const mainlineCount = useMemo(() => {
    if (!insights) {
      return 0;
    }

    return problems.filter((problem) =>
      problem.tags.some((problemTag) => insights.focusTags.includes(problemTag))
    ).length;
  }, [insights, problems]);

  return (
    <section className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-cyan-100">
              Arena Filter
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
              已收录 {problems.length} 道练习
            </span>
            {insights ? (
              <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs text-violet-100">
                当前主线：{insights.currentPathTitle}
              </span>
            ) : null}
          </div>

          <h2 className="mt-4 max-w-3xl text-3xl font-semibold text-white sm:text-[2rem]">
            像选课程模块一样筛选题目，主线推荐和已解锁提示都会直接浮到前面
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            这里把题库整理成「任务 + 标签 + 难度 + 主线联动」四层视角。你既能手动筛题，也能跟着当前学习路径继续做下一题，
            把课程节奏、练习反馈和后续行动串成连续推进流。
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <label className="block rounded-[24px] border border-white/8 bg-slate-950/55 p-4">
              <span className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-slate-400">
                <Search className="h-4 w-4" />
                搜索任务
              </span>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="例如：hello、switch、gdb、指针"
                className="w-full rounded-[18px] border border-white/10 bg-[#070b14] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/30"
              />
            </label>

            <label className="block rounded-[24px] border border-white/8 bg-slate-950/55 p-4">
              <span className="mb-3 block text-xs uppercase tracking-[0.28em] text-slate-400">
                难度分层
              </span>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                className="w-full rounded-[18px] border border-white/10 bg-[#070b14] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/30"
              >
                {difficulties.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 rounded-[24px] border border-white/8 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">知识点标签</p>
              <p className="text-sm text-slate-300">
                当前命中 <span className="font-semibold text-white">{filtered.length}</span> /{" "}
                {problems.length} 题
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((item) => {
                const active = tag === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTag(item)}
                    className={`rounded-full border px-3 py-2 text-xs transition ${
                      active
                        ? "border-cyan-300/30 bg-cyan-300/14 text-cyan-100"
                        : "border-white/10 bg-slate-950/45 text-slate-300 hover:bg-white/8"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="grid gap-4">
          <div className="rounded-[28px] border border-white/8 bg-slate-950/60 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">题库画像</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">题型数量</p>
                <p className="mt-2 text-3xl font-semibold text-white">{typeCount}</p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">高频标签</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {highlightedTags.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-200"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              {insights ? (
                <div className="rounded-[22px] border border-cyan-300/15 bg-cyan-300/8 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/80">主线覆盖</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{mainlineCount} 题</p>
                  <p className="mt-2 text-sm leading-7 text-slate-200">
                    当前路径相关题目会额外标记，方便你沿着主线连续推进。
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {insights ? (
            <div className="rounded-[28px] border border-violet-300/15 bg-violet-300/8 p-5">
              <div className="flex items-center gap-3 text-violet-100">
                <Trophy className="h-5 w-5" />
                <p className="text-sm font-medium">当前主线推荐</p>
              </div>
              <p className="mt-4 text-base font-semibold text-white">{insights.nextProblemTitle}</p>
              <p className="mt-2 text-sm leading-7 text-slate-200">
                这是进度面板里正在推荐的下一题，在题卡中会被高亮为“主线下一题”。
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {insights.recentUnlocks.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-xs text-slate-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-[28px] border border-amber-300/15 bg-amber-300/8 p-5">
            <div className="flex items-center gap-3 text-amber-100">
              <Sparkles className="h-5 w-5" />
              <p className="text-sm font-medium">使用建议</p>
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-200">
              <li>先看“主线下一题”，再按标签扩展做同模块练习。</li>
              <li>看到“已解锁推荐”标签时，说明它已经进入当前学习节奏。</li>
              <li>遇到 Linux / gdb 题时，配合课程页命令示例一起练更顺手。</li>
            </ul>
          </div>
        </aside>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((problem, index) => {
          const isMainlineNext = insights?.nextProblemTitle === problem.title;
          const isUnlockedRecommendation = insights?.recommendedProblemSlugs.includes(problem.slug);
          const isCurrentPathFocus = insights?.focusTags.some((tagValue) => problem.tags.includes(tagValue));

          return (
            <Link
              key={problem.slug}
              href={`/problems/${problem.slug}`}
              className="group relative overflow-hidden rounded-[28px] border border-white/8 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-violet-300/25 hover:bg-white/8"
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-cyan-300/12 via-transparent to-violet-300/10" />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-violet-100">
                    {problem.type}
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-200">
                    {problem.difficulty}
                  </span>
                </div>

                {(isMainlineNext || isUnlockedRecommendation || isCurrentPathFocus) ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {isMainlineNext ? (
                      <span className="rounded-full border border-cyan-300/25 bg-cyan-300/12 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-100">
                        主线下一题
                      </span>
                    ) : null}
                    {isUnlockedRecommendation ? (
                      <span className="rounded-full border border-emerald-300/25 bg-emerald-300/12 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-100">
                        已解锁推荐
                      </span>
                    ) : null}
                    {isCurrentPathFocus ? (
                      <span className="rounded-full border border-amber-300/25 bg-amber-300/12 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-amber-100">
                        当前路径
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      Lesson Mission #{index + 1}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-white">{problem.title}</h3>
                  </div>
                </div>

                <p className="mt-4 min-h-20 text-sm leading-7 text-slate-300">{problem.mission}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {problem.tags.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/8 bg-slate-950/45 px-2.5 py-1 text-xs text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">推荐轨道</p>
                    <p className="mt-1 text-sm font-medium text-slate-100">
                      {isMainlineNext ? "优先完成" : getTrackLabel(problem)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-cyan-100 transition group-hover:translate-x-1">
                    进入练习
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-[26px] border border-dashed border-white/12 bg-white/4 px-5 py-10 text-center text-sm text-slate-300">
          当前筛选条件下没有匹配题目，可以放宽关键词、切换难度，或点击“全部”查看完整题库。
        </div>
      ) : null}
    </section>
  );
}
