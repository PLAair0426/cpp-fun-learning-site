import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Flag,
  Layers3,
  Map
} from "lucide-react";
import { notFound } from "next/navigation";
import { PathDetailHeroExperiment } from "../../../components/path-detail-hero-experiment";
import { SectionTitle } from "../../../components/section-title";
import {
  EXPERIMENT_COOKIE_NAMES,
  resolvePathJourneyVariant
} from "../../../lib/experiments";
import { getPath } from "../../../lib/server-api";

type Params = Promise<{ slug: string }>;

function ModulesSection({ path }: { path: NonNullable<Awaited<ReturnType<typeof getPath>>> }) {
  return (
    <section id="modules" className="panel-shell rounded-[36px] px-6 py-7 sm:px-8">
      <SectionTitle
        badge="主线推进"
        title="沿着模块节奏推进，比散点学习更容易持续"
        description="每个模块都把课程说明、学习目标和代码片段打包在一起，让你能顺着一条清晰主线往前走。"
      />

      <div className="mt-6 space-y-5">
        {path.modules.map((module, index) => (
          <article
            key={`${module.title}-${index}`}
            className="admin-subcard section-plane p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="soft-kicker">模块 0{index + 1}</p>
                <h3 className="landing-card-title mt-2 text-[1.45rem] md:text-[1.58rem]">
                  {module.title}
                </h3>
                <p className="landing-body-copy mt-3 max-w-3xl">
                  {module.summary}
                </p>
              </div>
              <div className="site-chip site-chip--accent">
                {module.reward}
              </div>
            </div>

            <div className="path-lesson-grid mt-5 grid gap-4 lg:grid-cols-2">
              {module.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  id={`lesson-${lesson.id}`}
                  className="admin-subcard admin-subcard--muted path-lesson-card section-plane section-plane--muted p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="soft-kicker">{lesson.module}</p>
                      <p className="landing-card-title mt-2">
                        {lesson.title}
                      </p>
                    </div>
                    <span className="site-chip site-chip--muted">
                      {lesson.duration}
                    </span>
                  </div>
                  <p className="landing-body-copy">{lesson.objective}</p>
                  {lesson.contentTags.length > 0 ? (
                    <div className="page-tag-group page-tag-group--tight mt-4">
                      {lesson.contentTags.map((tag) => (
                        <span key={tag} className="site-chip site-chip--muted">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="page-empty-state page-empty-state--compact mt-4">
                      <p className="page-empty-state__title">标签待补充</p>
                      <p className="page-empty-state__body">这一节课的知识标签还在整理中。</p>
                    </div>
                  )}
                  <pre className="path-code-preview mt-4 overflow-x-auto rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-[13px] leading-7 text-slate-300">
                    {lesson.snippet}
                  </pre>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function KnowledgeMapSection({
  path
}: {
  path: NonNullable<Awaited<ReturnType<typeof getPath>>>;
}) {
  return (
    <section id="knowledge-map" className="panel-shell rounded-[36px] px-6 py-7 sm:px-8">
      <SectionTitle
        badge="知识地图"
        title="先看这条路径覆盖哪些知识节点"
        description="如果你更习惯按知识结构探索，这里会先把焦点标签、里程碑和配套练习露出来。"
      />

      <div className="path-detail-panel-grid mt-6 grid gap-4 xl:grid-cols-2">
        <div className="admin-subcard path-detail-panel section-plane p-5">
          <div className="flex items-center gap-3 text-emerald-100">
            <Map className="h-5 w-5" />
            <p className="landing-list-title">焦点标签</p>
          </div>
          {path.focusTags.length > 0 ? (
            <div className="page-tag-group mt-4">
              {path.focusTags.map((tag) => (
                <span key={tag} className="site-chip site-chip--accent">
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <div className="page-empty-state page-empty-state--compact mt-4">
              <p className="page-empty-state__title">焦点标签待补充</p>
              <p className="page-empty-state__body">这条路径的标签说明稍后会同步回来。</p>
            </div>
          )}

          <div className="path-stat-grid mt-6 grid gap-3 sm:grid-cols-2">
            <div className="admin-subcard admin-subcard--muted path-detail-metric-card section-strip p-4">
              <p className="soft-kicker">模块</p>
              <p className="mt-2 text-[1.55rem] font-semibold leading-[1.2] text-white">
                {path.modules.length}
              </p>
            </div>
            <div className="admin-subcard admin-subcard--muted path-detail-metric-card section-strip p-4">
              <p className="soft-kicker">里程碑</p>
              <p className="mt-2 text-[1.55rem] font-semibold leading-[1.2] text-white">
                {path.milestones.length}
              </p>
            </div>
          </div>
        </div>

        <div className="admin-subcard path-detail-panel section-plane p-5">
          <div className="flex items-center gap-3 text-amber-100">
            <Flag className="h-5 w-5" />
            <p className="landing-list-title">里程碑清单</p>
          </div>
          <div className="mt-4 space-y-3">
            {path.milestones.length > 0 ? (
              path.milestones.map((item, index) => (
                <div
                  key={item}
                className="admin-subcard admin-subcard--muted path-milestone-card section-strip flex gap-3 px-4 py-4"
                >
                  <div className="admin-step-badge">
                    {index + 1}
                  </div>
                  <p className="landing-body-copy flex-1">{item}</p>
                </div>
              ))
            ) : (
              <div className="page-empty-state page-empty-state--compact">
                <p className="page-empty-state__title">里程碑待编排</p>
                <p className="page-empty-state__body">路径结构已建立，关键阶段说明稍后补齐。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function RecommendedProblemsSection({
  path
}: {
  path: NonNullable<Awaited<ReturnType<typeof getPath>>>;
}) {
  return (
    <section id="recommended-problems" className="panel-shell rounded-[36px] px-6 py-7 sm:px-8">
      <SectionTitle
        badge="练习包"
        title="学完这条路线后，直接接这些配套练习"
        description="推荐题会把课程概念快速转成可执行练习，让路径不只停留在看懂，而是继续形成提交反馈。"
      />

      {path.recommendedProblems.length > 0 ? (
        <div className="path-atlas-grid mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {path.recommendedProblems.map((problem) => (
            <Link
              key={problem.slug}
              href={`/problems/${problem.slug}`}
              className="group surface-card path-problem-card section-plane rounded-[28px] p-5 transition hover:-translate-y-1"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="soft-kicker">{problem.type}</p>
                <span className="site-chip site-chip--muted">
                  {problem.difficulty}
                </span>
              </div>
              <h3 className="landing-card-title mt-4">{problem.title}</h3>
              <p className="landing-body-copy path-problem-copy">{problem.mission}</p>
              {problem.tags.length > 0 ? (
                <div className="page-tag-group page-tag-group--tight mt-4">
                  {problem.tags.map((tag) => (
                    <span key={tag} className="site-chip site-chip--muted">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-auto inline-flex items-center gap-2 pt-5 text-[15px] font-medium text-cyan-100 transition group-hover:gap-3">
                进入练习
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="page-empty-state page-empty-state--compact mt-6">
          <p className="page-empty-state__title">配套练习正在整理</p>
          <p className="page-empty-state__body">这条路径的推荐题会在内容同步后显示在这里。</p>
        </div>
      )}
    </section>
  );
}

function StrategySection({ path }: { path: NonNullable<Awaited<ReturnType<typeof getPath>>> }) {
  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <div className="panel-shell rounded-[34px] px-6 py-7">
      <SectionTitle
        badge="路径策略"
        title="怎么选这条路线会更顺手"
        description="如果你是第一次进入项目，可以先按固定节奏推进：先打基础，再练进阶专题，最后补 Linux 支线。"
      />
        <div className="mt-6 space-y-3">
          {[
            "先把基础语法、输入输出和控制流打通，再进入函数和内存。",
            "模块内先学概念，再看代码片段，最后做配套练习。",
            "每推进一段，就回头做一题推荐练习巩固反馈。"
          ].map((item, index) => (
            <div key={item} className="admin-subcard path-milestone-card section-strip flex gap-3 px-4 py-4">
              <div className="admin-step-badge">
                {index + 1}
              </div>
              <p className="landing-body-copy flex-1">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-shell rounded-[34px] px-6 py-7">
        <SectionTitle
          badge="学习建议"
          title="模块化路径更适合持续推进"
          description="它不是简单的课程列表，而是把内容拆成可以完成、可以复看、可以接练习的任务包。"
        />
        <div className="mt-6 grid gap-3">
          {[
            ["模块先讲概念", "先把每个阶段需要掌握的知识点讲清。"],
            ["课程再落代码", "每节课保留代码片段、标签与目标，降低断点感。"],
            ["最后接练习", "推荐练习把学习和提交反馈真正串起来。"]
          ].map(([title, desc]) => (
            <div key={title} className="admin-subcard path-detail-panel section-plane p-4">
              <div className="flex items-center gap-3 text-amber-100">
                <p className="landing-list-title">{title}</p>
              </div>
              <p className="landing-body-copy mt-3">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-shell rounded-[34px] px-6 py-7">
        <SectionTitle
          badge="地图快照"
          title="从全局看，这张学习地图已经具备稳定扩展性"
          description="路径、模块、课程与练习都被拆成可管理单元，这会让内容迭代和个性化推荐都更容易演进。"
        />
        <div className="path-stat-grid mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="admin-subcard path-detail-metric-card section-strip p-4">
            <p className="soft-kicker">课程与练习</p>
            <p className="mt-2 text-[1.08rem] font-semibold leading-7 text-white md:text-[1.14rem]">
              {path.lessonCount} 节课 / {path.challengeCount} 道题
            </p>
          </div>
          <div className="admin-subcard path-detail-metric-card section-strip p-4">
            <p className="soft-kicker">焦点标签</p>
            <p className="mt-2 text-[1.08rem] font-semibold leading-7 text-white md:text-[1.14rem]">
              {path.focusTags.length} 个
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function PathDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const variant = resolvePathJourneyVariant(
    cookieStore.get(EXPERIMENT_COOKIE_NAMES.pathJourney)?.value
  );
  const path = await getPath(slug);

  if (!path) {
    notFound();
  }

  return (
    <div className="learn-page space-y-8 pb-8">
      <Link href="/paths" className="nav-pill learn-page__back w-fit text-[15px] font-medium">
        <ArrowLeft className="h-4 w-4" />
        返回学习路径
      </Link>

      <PathDetailHeroExperiment variant={variant} path={path} />

      {variant === "a" ? (
        <>
          <ModulesSection path={path} />
          <RecommendedProblemsSection path={path} />
          <KnowledgeMapSection path={path} />
          <StrategySection path={path} />
        </>
      ) : (
        <>
          <KnowledgeMapSection path={path} />
          <RecommendedProblemsSection path={path} />
          <ModulesSection path={path} />
          <StrategySection path={path} />
        </>
      )}
    </div>
  );
}
