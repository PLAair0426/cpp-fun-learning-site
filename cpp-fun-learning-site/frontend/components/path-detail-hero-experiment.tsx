import Link from "next/link";
import { ArrowRight, Compass, Map, Swords } from "lucide-react";
import type { PathDetail } from "../lib/api";
import { type PathJourneyVariant } from "../lib/experiments";

type PathDetailHeroExperimentProps = {
  variant: PathJourneyVariant;
  path: PathDetail;
};

export function PathDetailHeroExperiment({
  variant,
  path
}: PathDetailHeroExperimentProps) {
  if (variant === "b") {
    return (
      <section className="panel-shell hero-orbit rounded-[40px] px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
        <div className="relative z-10 grid gap-8 xl:grid-cols-2">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="section-heading__badge">{path.theme}</span>
              <span className="site-chip site-chip--accent">知识梳理</span>
              <span className="site-chip site-chip--muted">
                {path.estimatedHours} 小时 · {path.lessonCount} 节课 · {path.challengeCount} 道题
              </span>
            </div>

            <h1 className="editorial-title text-glow mt-6 max-w-4xl text-[clamp(2.6rem,4.7vw,4.7rem)] leading-[1.02] text-white">
              {path.title}
            </h1>
            <p className="mt-5 max-w-3xl text-[1.08rem] leading-8 text-cyan-50/88 md:text-[1.14rem] md:leading-9">
              {path.subtitle}
            </p>
            <p className="mt-5 max-w-4xl text-[15px] leading-8 text-slate-300 md:text-base">
              {path.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#knowledge-map" className="nav-pill nav-pill--accent px-5 py-3 text-[15px] font-medium">
                先看知识地图
                <Map className="h-4 w-4" />
              </Link>
              <Link href="#recommended-problems" className="nav-pill px-5 py-3 text-[15px] font-medium">
                直接看配套练习
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="admin-subcard p-6">
              <div className="flex items-center gap-3 text-emerald-100">
                <Map className="h-5 w-5" />
                <p className="soft-kicker text-emerald-100/80">知识地图</p>
              </div>
              <p className="mt-4 editorial-title text-[1.5rem] leading-[1.28] text-white md:text-[1.62rem]">
                先看焦点标签与配套练习，再决定怎么探索这条路线。
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {path.focusTags.map((tag) => (
                  <span key={tag} className="site-chip">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="metric-tile">
                <p className="soft-kicker">里程碑</p>
                <p className="mt-3 text-[2rem] font-semibold leading-none text-white">{path.milestones.length}</p>
              </div>
              <div className="metric-tile">
                <p className="soft-kicker">推荐练习</p>
                <p className="mt-3 text-[2rem] font-semibold leading-none text-white">
                  {path.recommendedProblems.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel-shell hero-orbit rounded-[40px] px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
      <div className="relative z-10 grid gap-8 xl:grid-cols-2">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="section-heading__badge">{path.theme}</span>
            <span className="site-chip site-chip--accent">主线推进</span>
            <span className="site-chip site-chip--muted">
              {path.estimatedHours} 小时 · {path.lessonCount} 节课 · {path.challengeCount} 道题
            </span>
          </div>

          <h1 className="editorial-title text-glow mt-6 max-w-4xl text-[clamp(2.6rem,4.7vw,4.7rem)] leading-[1.02] text-white">
            {path.title}
          </h1>
          <p className="mt-5 max-w-3xl text-[1.08rem] leading-8 text-cyan-50/88 md:text-[1.14rem] md:leading-9">
            {path.subtitle}
          </p>
          <p className="mt-5 max-w-4xl text-[15px] leading-8 text-slate-300 md:text-base">{path.description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#modules" className="nav-pill nav-pill--accent px-5 py-3 text-[15px] font-medium">
              查看模块推进
              <Compass className="h-4 w-4" />
            </Link>
            <Link href="#recommended-problems" className="nav-pill nav-pill--success px-5 py-3 text-[15px] font-medium">
              直连配套练习
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="space-y-4">
            <div className="admin-subcard p-6">
              <div className="flex items-center gap-3 text-amber-100">
                <Swords className="h-5 w-5" />
                <p className="soft-kicker text-amber-100/80">关底任务</p>
              </div>
            <p className="mt-4 editorial-title text-[1.5rem] leading-[1.28] text-white md:text-[1.62rem]">
              {path.bossMission}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {path.focusTags.map((tag) => (
                <span key={tag} className="site-chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="metric-tile">
              <p className="soft-kicker">模块数</p>
              <p className="mt-3 text-[2rem] font-semibold leading-none text-white">{path.modules.length}</p>
            </div>
            <div className="metric-tile">
              <p className="soft-kicker">里程碑</p>
              <p className="mt-3 text-[2rem] font-semibold leading-none text-white">{path.milestones.length}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
