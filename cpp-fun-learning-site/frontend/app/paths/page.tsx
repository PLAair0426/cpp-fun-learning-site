import Link from "next/link";
import { ArrowRight, Compass, Layers3, Sparkles, Trophy } from "lucide-react";
import { SectionTitle } from "../../components/section-title";
import { getPath, getPaths, getProgressOverview } from "../../lib/server-api";

export default async function PathsPage() {
  const [paths, progress] = await Promise.all([getPaths(), getProgressOverview()]);
  const pathDetails = (
    await Promise.all(paths.map((path) => getPath(path.slug)))
  ).filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="space-y-8">
      <section className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
        <SectionTitle
          badge="Path Atlas"
          title="课程路径已经升级成可预览模块的学习地图"
          description="不只是列出路径名称，现在每条路径都会直接展示模块结构、代表课程和推荐练习，方便你按学习目标挑选推进路线。"
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <div className="rounded-[26px] border border-white/8 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">路径总数</p>
            <p className="mt-3 text-3xl font-semibold text-white">{paths.length}</p>
          </div>
          <div className="rounded-[26px] border border-white/8 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">课程总量</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {paths.reduce((sum, item) => sum + item.lessonCount, 0)}
            </p>
          </div>
          <div className="rounded-[26px] border border-white/8 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">练习总量</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {paths.reduce((sum, item) => sum + item.challengeCount, 0)}
            </p>
          </div>
          <div className="rounded-[26px] border border-white/8 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">当前主线</p>
            <p className="mt-3 text-lg font-semibold text-white">{progress.currentPath.title}</p>
            <p className="mt-2 text-sm text-slate-300">{progress.currentPath.progressPercent}% 已完成</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="space-y-6">
          {pathDetails.map((path) => (
            <article
              key={path.slug}
              className="panel-shell rounded-[34px] px-6 py-7 sm:px-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-cyan-100">
                      {path.theme}
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                      {path.estimatedHours} 小时 / {path.lessonCount} 节课 / {path.challengeCount} 道题
                    </span>
                  </div>
                  <h2 className="mt-4 text-3xl font-semibold text-white">{path.title}</h2>
                  <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">{path.subtitle}</p>
                </div>
                <Link
                  href={`/paths/${path.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-300/20 hover:bg-white/5"
                >
                  打开路径
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {path.focusTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/8 bg-slate-950/45 px-2.5 py-1 text-xs text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  {path.modules.map((module, index) => (
                    <div
                      key={module.title}
                      className="rounded-[26px] border border-white/8 bg-white/5 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-sm font-semibold text-cyan-100">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{module.title}</h3>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                              {module.lessons.length} 节课程
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-200">
                          {module.reward}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-300">{module.summary}</p>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {module.lessons.slice(0, 4).map((lesson) => (
                          <div
                            key={lesson.id}
                            className="rounded-[22px] border border-white/8 bg-slate-950/50 p-4"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                                {lesson.module}
                              </p>
                              <span className="rounded-full border border-white/8 px-2 py-1 text-[11px] text-slate-300">
                                {lesson.duration}
                              </span>
                            </div>
                            <p className="mt-2 text-base font-semibold text-white">{lesson.title}</p>
                            <p className="mt-2 text-sm leading-7 text-slate-300">{lesson.objective}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="rounded-[26px] border border-amber-300/15 bg-amber-300/8 p-5">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-amber-100" />
                      <p className="text-xs uppercase tracking-[0.28em] text-amber-100/80">
                        Boss Mission
                      </p>
                    </div>
                    <p className="mt-4 text-base leading-8 text-white">{path.bossMission}</p>
                  </div>

                  <div className="rounded-[26px] border border-white/8 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <Compass className="h-5 w-5 text-cyan-100" />
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                        Milestones
                      </p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {path.milestones.map((item) => (
                        <div
                          key={item}
                          className="rounded-[20px] border border-white/8 bg-slate-950/45 px-4 py-4 text-sm leading-7 text-slate-300"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-white/8 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <Layers3 className="h-5 w-5 text-violet-100" />
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                        Recommended Battles
                      </p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {path.recommendedProblems.slice(0, 4).map((problem) => (
                        <Link
                          key={problem.slug}
                          href={`/problems/${problem.slug}`}
                          className="group flex items-start justify-between gap-3 rounded-[20px] border border-white/8 bg-slate-950/45 px-4 py-4 transition hover:border-cyan-300/20 hover:bg-slate-950/65"
                        >
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                              {problem.type}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-white">{problem.title}</p>
                          </div>
                          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-cyan-100 transition group-hover:translate-x-1" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-6">
          <div className="panel-shell rounded-[34px] px-6 py-7">
            <SectionTitle
              badge="Current Route"
              title="当前推进主线"
              description="路径页右侧固定保留当前主线进度和下一步任务，方便你随时回到最近的学习上下文。"
            />
            <div className="mt-6 rounded-[24px] border border-white/8 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Current Path</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{progress.currentPath.title}</h2>
              <div className="mt-5 overflow-hidden rounded-full border border-white/8 bg-slate-950/70">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-300"
                  style={{ width: `${progress.currentPath.progressPercent}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                <span>当前进度 {progress.currentPath.progressPercent}%</span>
                <span>剩余任务 {progress.currentPath.remainingMissions}</span>
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-[20px] border border-white/8 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">下一节课</p>
                  <p className="mt-2 text-sm leading-7 text-white">{progress.currentPath.nextLessonTitle}</p>
                </div>
                <div className="rounded-[20px] border border-white/8 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">下一道题</p>
                  <p className="mt-2 text-sm leading-7 text-white">{progress.currentPath.nextProblemTitle}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-shell rounded-[34px] px-6 py-7">
            <SectionTitle
              badge="Path Strategy"
              title="怎么挑路径更顺手"
              description="如果你是第一次进入项目，可以按下面的顺序推进，先打基础，再进实验室，最后做 Linux 支线。"
            />
            <div className="mt-6 space-y-3">
              {[
                "先完成 C++ 新手村，把控制台输出、变量、常量和输入走通。",
                "接着进入运算竞技场，练顺条件、循环、优先级和 switch 兜底。",
                "函数与内存实验室适合在完成主线后强化结构化思维。",
                "Linux 支线适合在有基础后补齐终端编译与 gdb 调试。"
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-[22px] border border-white/8 bg-white/5 px-4 py-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-sm font-semibold text-cyan-100">
                    {index + 1}
                  </div>
                  <p className="flex-1 text-sm leading-7 text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-shell rounded-[34px] px-6 py-7">
            <SectionTitle
              badge="Why It Works"
              title="模块化课程的价值"
              description="每条路径现在都不是简单的“课程列表”，而是按模块拆开的学习任务包。"
            />
            <div className="mt-6 grid gap-3">
              {[
                ["模块先讲概念", "先把每个阶段要掌握的知识点讲清楚。"],
                ["课程再落代码", "每节课都保留了 snippet、标签和学习目标。"],
                ["练习形成闭环", "学完模块后可以直接进入推荐练习做即时反馈。"] 
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-4"
                >
                  <div className="flex items-center gap-2 text-cyan-100">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-sm font-semibold">{title}</p>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
