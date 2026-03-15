import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, Layers3, Route } from "lucide-react";
import { PathsHeroExperiment } from "../../components/paths-hero-experiment";
import {
  EXPERIMENT_COOKIE_NAMES,
  resolvePathAtlasVariant
} from "../../lib/experiments";
import { getPath, getPaths, getProgressOverview } from "../../lib/server-api";

export default async function PathsPage() {
  const cookieStore = await cookies();
  const variant = resolvePathAtlasVariant(
    cookieStore.get(EXPERIMENT_COOKIE_NAMES.pathAtlas)?.value
  );

  const [paths, progress] = await Promise.all([getPaths(), getProgressOverview()]);
  const pathDetails = (
    await Promise.all(paths.map((path) => getPath(path.slug)))
  ).filter((item): item is NonNullable<typeof item> => Boolean(item));

  const currentPath =
    pathDetails.find((item) => item.slug === progress.currentPath.slug) ?? pathDetails[0];
  const orderedPaths = [...pathDetails].sort((left, right) => {
    if (left.slug === progress.currentPath.slug) return -1;
    if (right.slug === progress.currentPath.slug) return 1;
    return left.title.localeCompare(right.title);
  });

  const totalModules = orderedPaths.reduce((sum, item) => sum + item.modules.length, 0);

  return (
    <div className="learn-page space-y-8 pb-10">
      <PathsHeroExperiment
        variant={variant}
        paths={orderedPaths}
        progress={progress}
        currentPath={currentPath ?? null}
        totalModules={totalModules}
      />

      {currentPath ? (
        <section className="path-feature-grid grid gap-4 xl:grid-cols-2">
          <div className="panel-shell rounded-[36px] p-6">
            <p className="soft-kicker">推荐路径</p>
            <h2 className="mt-2 text-[1.95rem] font-semibold leading-[1.22] text-white md:text-[2.1rem]">
              {currentPath.title}
            </h2>
            <p className="mt-4 max-w-3xl text-[15px] leading-8 text-slate-300 md:text-base">
              {currentPath.description}
            </p>

            <div className="path-module-preview-grid mt-5 grid gap-3 md:grid-cols-2">
              {currentPath.modules.slice(0, 4).map((module) => (
                <div
                  key={module.title}
                  className="surface-card path-module-preview-card section-plane section-plane--muted rounded-[28px] p-5"
                >
                  <p className="soft-kicker">模块预览</p>
                  <h3 className="landing-card-title mt-2">
                    {module.title}
                  </h3>
                  <p className="landing-body-copy">{module.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-shell rounded-[36px] p-6">
            <p className="soft-kicker">关键里程碑</p>
            <div className="mt-4 grid gap-3">
              {currentPath.milestones.slice(0, 4).map((milestone) => (
                <div
                  key={milestone}
                  className="surface-card path-milestone-card section-strip rounded-[24px] px-4 py-4"
                >
                  <p className="landing-body-copy">{milestone}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {!currentPath ? (
        <section className="page-empty-state">
          <p className="soft-kicker">路径暂未载入</p>
          <h2 className="page-empty-state__title mt-2">
            当前还没有可展示的学习路径。
          </h2>
          <p className="page-empty-state__body">
            可以先返回首页或稍后刷新，等内容同步完成后再继续浏览主线地图。
          </p>
          <div className="page-empty-state__actions mt-4">
            <Link href="/" className="nav-pill nav-pill--accent px-5 py-3 text-sm font-medium">
              返回首页
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      ) : null}

      <section id="atlas-grid" className="path-atlas-grid grid gap-4 xl:grid-cols-3">
        {orderedPaths.map((path, index) => (
          <article
            key={path.slug}
            className="surface-card path-atlas-card section-plane rounded-[30px] p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="soft-kicker">{path.theme}</p>
                <h3 className="landing-card-title mt-2 text-[1.5rem] md:text-[1.62rem]">
                  {path.title}
                </h3>
              </div>
              <Route className="h-5 w-5 text-slate-100" />
            </div>

            <p className="landing-body-copy path-atlas-copy mt-4">{path.subtitle}</p>

            <div className="page-tag-group page-tag-group--tight mt-4">
              {path.focusTags.slice(0, 4).map((tag) => (
                <span key={tag} className="site-chip site-chip--muted">
                  {tag}
                </span>
              ))}
            </div>

            <div className="path-stat-grid mt-5 grid gap-3 sm:grid-cols-3">
              <div className="admin-subcard admin-subcard--muted path-stat-card px-3 py-3 text-center">
                <p className="soft-kicker">时长</p>
                <p className="mt-2 text-[1.08rem] font-semibold leading-7 text-white">
                  {path.estimatedHours}
                </p>
              </div>
              <div className="admin-subcard admin-subcard--muted path-stat-card px-3 py-3 text-center">
                <p className="soft-kicker">课程</p>
                <p className="mt-2 text-[1.08rem] font-semibold leading-7 text-white">
                  {path.lessonCount}
                </p>
              </div>
              <div className="admin-subcard admin-subcard--muted path-stat-card px-3 py-3 text-center">
                <p className="soft-kicker">挑战</p>
                <p className="mt-2 text-[1.08rem] font-semibold leading-7 text-white">
                  {path.challengeCount}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="landing-list-copy">{path.bossMission}</p>
              <Link href={`/paths/${path.slug}`} className="nav-pill px-4 py-2 text-sm font-medium">
                打开
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="panel-shell rounded-[36px] px-6 py-6 md:px-8 md:py-8">
        <div className="page-followup-grid grid gap-5 xl:grid-cols-2">
          <div>
            <p className="soft-kicker">浏览建议</p>
            <h2 className="landing-section-title text-white">
              先看推荐路径，再按主题比较，会更容易找到适合自己的路线。
            </h2>
            <p className="mt-3 max-w-2xl text-[1.02rem] leading-8 text-slate-300 md:text-[1.06rem] md:leading-9">
              每条路径都把模块预览、里程碑和练习方向放在一起，方便你快速判断下一步。
            </p>
          </div>

          <div className="surface-card page-followup-side section-plane rounded-[28px] p-5">
            <div className="flex items-center gap-3">
              <Layers3 className="h-5 w-5 text-slate-100" />
              <p className="landing-card-title">
                怎么使用
              </p>
            </div>
            <p className="landing-body-copy mt-3">
              先看模块预览和里程碑，再决定从哪条路线开始，能更快找到适合自己的学习节奏。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
