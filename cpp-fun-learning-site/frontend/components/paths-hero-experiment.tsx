import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Layers3,
  Route,
  Trophy
} from "lucide-react";
import type { PathDetail, ProgressOverview } from "../lib/api";
import { type PathAtlasVariant } from "../lib/experiments";
import { formatLearningTitle } from "../lib/problem-labels";

type PathsHeroExperimentProps = {
  variant: PathAtlasVariant;
  paths: PathDetail[];
  progress: ProgressOverview;
  currentPath: PathDetail | null;
  totalModules: number;
};

export function PathsHeroExperiment({
  variant,
  paths,
  progress,
  currentPath,
  totalModules
}: PathsHeroExperimentProps) {
  const totalLessons = paths.reduce((sum, item) => sum + item.lessonCount, 0);
  const totalChallenges = paths.reduce((sum, item) => sum + item.challengeCount, 0);
  const topThemes = Array.from(new Set(paths.map((item) => item.theme))).slice(0, 4);

  if (variant === "a") {
    return (
      <section className="panel-shell hero-orbit rounded-[40px] px-6 py-8 sm:px-8 sm:py-9">
        <div className="grid gap-7 xl:grid-cols-2">
          <div>
            <div className="section-heading__badge">
              <Compass className="h-4 w-4" />
              路径地图
            </div>
            <h1 className="mt-5 editorial-title text-4xl text-white sm:text-5xl">
              先横向探索整张学习地图，再决定你的主线入口。
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
              先比较路径主题、模块密度和挑战风格，再挑选最适合自己的起步方式。
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {topThemes.map((theme) => (
                <span
                  key={theme}
                  className="site-chip"
                >
                  {theme}
                </span>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#atlas-grid" className="nav-pill nav-pill--accent px-5 py-3 text-sm">
                浏览全部路径
                <ArrowRight className="h-4 w-4" />
              </Link>
              {currentPath ? (
                <Link href={`/paths/${currentPath.slug}`} className="nav-pill px-5 py-3 text-sm">
                  查看当前主线
                  <Route className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="admin-subcard p-5">
              <p className="soft-kicker">地图密度</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="admin-subcard admin-subcard--muted p-4">
                  <p className="text-3xl font-semibold text-white">{paths.length}</p>
                  <p className="mt-2 text-sm text-slate-300">条学习路径</p>
                </div>
                <div className="admin-subcard admin-subcard--muted p-4">
                  <p className="text-3xl font-semibold text-white">{totalModules}</p>
                  <p className="mt-2 text-sm text-slate-300">个模块节点</p>
                </div>
                <div className="admin-subcard admin-subcard--muted p-4">
                  <p className="text-3xl font-semibold text-white">{totalLessons}</p>
                  <p className="mt-2 text-sm text-slate-300">节课程</p>
                </div>
                <div className="admin-subcard admin-subcard--muted p-4">
                  <p className="text-3xl font-semibold text-white">{totalChallenges}</p>
                  <p className="mt-2 text-sm text-slate-300">道练习题</p>
                </div>
              </div>
            </div>

            <div className="admin-subcard p-5">
              <div className="flex items-center gap-3 text-cyan-100">
                <Compass className="h-5 w-5" />
                <p className="text-sm font-medium text-white">探索模式推荐</p>
              </div>
              <p className="mt-4 text-lg font-semibold text-white">
                先看路径主题，再比较模块节奏与关底任务。
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                如果你还没想好是先补基础、先刷题，还是先做项目，这里会先把选项铺开，减少一开始就被单一路线锁住的感觉。
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel-shell hero-orbit rounded-[40px] px-6 py-8 sm:px-8 sm:py-9">
      <div className="grid gap-7 xl:grid-cols-2">
        <div>
          <div className="section-heading__badge">
            <Trophy className="h-4 w-4" />
            推荐主线
          </div>
          <h1 className="mt-5 editorial-title text-4xl text-white sm:text-5xl">
            先给你一条最该继续的路线，再展开整张地图。
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
            系统会先突出当前推荐路径、下一节课和下一道题，帮助你直接进入主线，减少选择成本。
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <div className="metric-tile">
              <p className="soft-kicker">当前路径</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {progress.currentPath.title}
              </p>
            </div>
            <div className="metric-tile">
              <p className="soft-kicker">主线进度</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {progress.currentPath.progressPercent}%
              </p>
            </div>
            <div className="metric-tile">
              <p className="soft-kicker">剩余节点</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {progress.currentPath.remainingMissions}
              </p>
            </div>
          </div>
        </div>

        <div className="admin-subcard p-5">
          <p className="soft-kicker">推荐路径</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            {currentPath?.title ?? progress.currentPath.title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            {currentPath?.description ??
              "继续沿着当前主线路径推进，优先完成下一节课与下一道练习，能更稳定地积累阶段性成就感。"}
          </p>

          <div className="mt-5 grid gap-3">
            <div className="admin-subcard admin-subcard--muted p-4">
              <p className="soft-kicker">下一节课</p>
              <p className="mt-2 text-base font-semibold text-white">
                {formatLearningTitle(progress.currentPath.nextLessonTitle)}
              </p>
            </div>
            <div className="admin-subcard admin-subcard--muted p-4">
              <p className="soft-kicker">下一道题</p>
              <p className="mt-2 text-base font-semibold text-white">
                {formatLearningTitle(progress.currentPath.nextProblemTitle)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {currentPath ? (
              <Link
                href={`/paths/${currentPath.slug}`}
                className="nav-pill nav-pill--accent px-5 py-3 text-sm"
              >
                继续当前主线
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
            <Link href="#atlas-grid" className="nav-pill px-5 py-3 text-sm">
              查看推荐编排
              <Layers3 className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
