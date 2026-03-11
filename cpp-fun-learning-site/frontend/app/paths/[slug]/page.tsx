import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldAlert } from "lucide-react";
import { notFound } from "next/navigation";
import { SectionTitle } from "../../../components/section-title";
import { getPath } from "../../../lib/api";

type Params = Promise<{ slug: string }>;

export default async function PathDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const path = await getPath(slug);

  if (!path) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/5"
      >
        <ArrowLeft className="h-4 w-4" />
        返回总地图
      </Link>

      <section className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.32em] text-cyan-100">
            {path.theme}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
            {path.estimatedHours} 小时 / {path.lessonCount} 节课 / {path.challengeCount} 道题
          </span>
        </div>
        <h1 className="mt-5 text-4xl font-semibold text-white sm:text-5xl">{path.title}</h1>
        <p className="mt-3 max-w-4xl text-lg leading-8 text-slate-300">{path.subtitle}</p>
        <p className="mt-5 max-w-4xl text-base leading-8 text-slate-300">{path.description}</p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[28px] border border-white/8 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Milestones</p>
            <div className="mt-4 space-y-3">
              {path.milestones.map((item, index) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-[22px] border border-white/8 bg-slate-950/50 px-4 py-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-sm font-semibold text-cyan-100">
                    {index + 1}
                  </div>
                  <p className="flex-1 text-sm leading-7 text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-amber-300/15 bg-amber-300/8 p-5">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-100" />
              <p className="text-xs uppercase tracking-[0.32em] text-amber-100/80">Boss Mission</p>
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">{path.bossMission}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {path.focusTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-slate-950/40 px-2.5 py-1 text-xs text-slate-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
        <SectionTitle
          badge="Mission Flow"
          title="模块式推进"
          description="每个模块先用课程讲清概念，再挂一组练习任务，让“学、练、反馈”连成一条清晰路径。"
        />
        <div className="mt-6 space-y-5">
          {path.modules.map((module, index) => (
            <article
              key={module.title}
              className="rounded-[28px] border border-white/8 bg-white/5 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-lg font-semibold text-cyan-100">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Module</p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">{module.title}</h2>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                    {module.lessons.length} 节课
                  </span>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                    奖励：{module.reward}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">{module.summary}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {module.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    id={`lesson-${lesson.id}`}
                    className="scroll-mt-28 rounded-[24px] border border-white/8 bg-slate-950/45 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                        {lesson.module}
                      </p>
                      <span className="rounded-full border border-white/8 px-2.5 py-1 text-xs text-slate-300">
                        {lesson.duration} · {lesson.difficulty}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-white">{lesson.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{lesson.objective}</p>
                    <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/8 bg-slate-950/60 p-3 text-xs leading-6 text-cyan-100">
                      <code>{lesson.snippet}</code>
                    </pre>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {lesson.contentTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
        <SectionTitle
          badge="Recommended Battles"
          title="配套练习"
          description="路径页直接挂练习入口，学完概念后就能立刻进入编程题，形成短反馈闭环。"
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {path.recommendedProblems.map((problem) => (
            <Link
              key={problem.slug}
              href={`/problems/${problem.slug}`}
              className="group rounded-[26px] border border-white/8 bg-white/5 p-5 transition hover:border-cyan-300/20 hover:bg-white/8"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{problem.type}</p>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-200">
                  {problem.difficulty}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">{problem.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{problem.mission}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {problem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/8 bg-slate-950/45 px-2.5 py-1 text-xs text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan-100 transition group-hover:gap-3">
                进入练习 <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
