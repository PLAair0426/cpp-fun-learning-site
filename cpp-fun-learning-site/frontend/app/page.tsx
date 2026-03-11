import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  ChevronRight,
  Compass,
  Flame,
  Layers3,
  Radar,
  Swords,
  TerminalSquare,
  Trophy,
  Zap
} from "lucide-react";
import { SectionTitle } from "../components/section-title";
import { getHome, getPath, getProblems, getProgressOverview } from "../lib/api";

export default async function HomePage() {
  const [home, progress, allProblems] = await Promise.all([
    getHome(),
    getProgressOverview(),
    getProblems()
  ]);

  const featuredPathDetails = (
    await Promise.all(home.featuredPaths.map((path) => getPath(path.slug)))
  ).filter((item): item is NonNullable<typeof item> => Boolean(item));

  const currentPathDetail = await getPath(progress.currentPath.slug);
  const nextLesson = currentPathDetail?.modules
    .flatMap((module) => module.lessons)
    .find((lesson) => lesson.title === progress.currentPath.nextLessonTitle);
  const nextProblem = allProblems.find(
    (problem) => problem.title === progress.currentPath.nextProblemTitle
  );

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.85fr)]">
        <div className="panel-shell relative overflow-hidden rounded-[36px] px-6 py-7 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.18),transparent_28%)]" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.36em] text-cyan-100">
                {home.hero.eyebrow}
              </span>
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.32em] text-amber-100">
                课程资产驱动
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                当前主线：{progress.currentPath.title}
              </span>
            </div>

            <div className="mt-6 max-w-4xl">
              <h1 className="text-glow text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                {home.hero.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                {home.hero.subtitle}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={home.hero.primaryAction.href}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/12 px-5 py-3 text-sm font-medium text-cyan-50 transition hover:bg-cyan-300/20"
              >
                {home.hero.primaryAction.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={home.hero.secondaryAction.href}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/5"
              >
                {home.hero.secondaryAction.label}
                <Radar className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {home.hero.metrics.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[24px] border border-white/8 bg-white/5 px-4 py-4 backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-400">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel-shell rounded-[30px] px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-emerald-100">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.36em] text-emerald-200/80">Daily Quest</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{home.dailyQuest.title}</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">{home.dailyQuest.objective}</p>
            <div className="mt-5 rounded-[24px] border border-white/8 bg-white/4 p-4">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-400">任务奖励</p>
              <p className="mt-2 text-lg font-medium text-amber-100">{home.dailyQuest.reward}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {home.dailyQuest.tips.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="panel-shell rounded-[30px] px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-3 text-violet-100">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.36em] text-violet-200/80">Progress Pulse</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{progress.currentPath.title}</h2>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-full border border-white/8 bg-slate-950/70">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-300"
                style={{ width: `${progress.currentPath.progressPercent}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-300">
              <span>当前进度 {progress.currentPath.progressPercent}%</span>
              <span>剩余任务 {progress.currentPath.remainingMissions}</span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href={
                  nextLesson
                    ? `/paths/${progress.currentPath.slug}#lesson-${nextLesson.id}`
                    : `/paths/${progress.currentPath.slug}`
                }
                className="rounded-[22px] border border-white/8 bg-white/5 p-4 transition hover:bg-white/8"
              >
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">下一节课</p>
                <p className="mt-2 text-sm leading-7 text-white">{progress.currentPath.nextLessonTitle}</p>
              </Link>
              <Link
                href={nextProblem ? `/problems/${nextProblem.slug}` : "/problems"}
                className="rounded-[22px] border border-white/8 bg-white/5 p-4 transition hover:bg-white/8"
              >
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">下一道练习</p>
                <p className="mt-2 text-sm leading-7 text-white">{progress.currentPath.nextProblemTitle}</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
          <SectionTitle
            badge="Next Actions"
            title="首页现在就是学习导航中枢，直接告诉你下一步该做什么"
            description="把当前主线、推荐动作、最近解锁和快速入口放到同一屏里，减少来回切页寻找上下文的成本。"
          />

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {[
              {
                title: progress.currentPath.nextLessonTitle,
                label: "继续课程",
                href: nextLesson
                  ? `/paths/${progress.currentPath.slug}#lesson-${nextLesson.id}`
                  : `/paths/${progress.currentPath.slug}`,
                icon: BookOpenText
              },
              {
                title: progress.currentPath.nextProblemTitle,
                label: "继续练题",
                href: nextProblem ? `/problems/${nextProblem.slug}` : "/problems",
                icon: Swords
              },
              {
                title: progress.currentPath.title,
                label: "返回主线",
                href: `/paths/${progress.currentPath.slug}`,
                icon: Compass
              }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group rounded-[26px] border border-white/8 bg-white/5 p-5 transition hover:border-cyan-300/20 hover:bg-white/8"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-cyan-100 transition group-hover:translate-x-1" />
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.28em] text-slate-400">{item.label}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[26px] border border-white/8 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">推荐动作</p>
              <div className="mt-4 space-y-3">
                {progress.recommendedActions.map((item, index) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-[20px] border border-white/8 bg-slate-950/45 px-4 py-4"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-sm font-semibold text-cyan-100">
                      {index + 1}
                    </div>
                    <p className="flex-1 text-sm leading-7 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[26px] border border-amber-300/15 bg-amber-300/8 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-amber-100/80">最近解锁</p>
              <div className="mt-4 space-y-3">
                {progress.recentUnlocks.map((item) => (
                  <div
                    key={item}
                    className="rounded-[20px] border border-white/10 bg-black/10 px-4 py-4 text-sm leading-7 text-slate-100"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel-shell rounded-[34px] px-6 py-7">
            <SectionTitle
              badge="Learning Stats"
              title="把训练节奏固定下来"
              description="首页右侧保留进度摘要，方便你快速判断今天是继续主线还是扩展刷题。"
            />
            <div className="mt-6 grid gap-3">
              <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">累计 XP</p>
                <p className="mt-2 text-3xl font-semibold text-white">{progress.xp}</p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">连续学习</p>
                <p className="mt-2 text-3xl font-semibold text-white">{progress.streak} 天</p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">课程进度</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {progress.completedLessons}/{progress.totalLessons}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">练习进度</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {progress.completedProblems}/{progress.totalProblems}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">本周目标</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {progress.weeklyCompleted}/{progress.weeklyTarget}
                </p>
              </div>
            </div>
          </div>

          <div className="panel-shell rounded-[34px] px-6 py-7">
            <SectionTitle
              badge="Stack"
              title="这套学习站现在已经是完整前后端联动"
              description="前端课程页、题库页、判题流程和持久化能力已经形成完整可运行骨架。"
            />
            <div className="mt-6 grid gap-3">
              <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                <div className="flex items-center gap-3 text-cyan-100">
                  <Layers3 className="h-5 w-5" />
                  <p className="text-sm font-medium">Web</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{home.stack.web}</p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                <div className="flex items-center gap-3 text-violet-100">
                  <TerminalSquare className="h-5 w-5" />
                  <p className="text-sm font-medium">Judge</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{home.stack.judge}</p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                <div className="flex items-center gap-3 text-amber-100">
                  <Radar className="h-5 w-5" />
                  <p className="text-sm font-medium">Persistence</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{home.stack.persistence}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
        <SectionTitle
          badge="Curriculum Preview"
          title="精选路径现在直接展开模块预览，首页就能判断该从哪条线推进"
          description="不只展示路径摘要，还把模块结构、代表课时和推荐练习提前展开，让你在进入详情页之前就看懂学习路线。"
        />

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {featuredPathDetails.map((path) => (
            <article
              key={path.slug}
              className="rounded-[30px] border border-white/8 bg-white/5 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{path.theme}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{path.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{path.subtitle}</p>
                </div>
                <Link
                  href={`/paths/${path.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-100 transition hover:border-cyan-300/20 hover:bg-white/5"
                >
                  打开路径
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                  {path.estimatedHours} 小时
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                  {path.lessonCount} 节课
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                  {path.challengeCount} 道题
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                {path.modules.slice(0, 2).map((module, index) => (
                  <div
                    key={module.title}
                    className="rounded-[24px] border border-white/8 bg-slate-950/45 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-sm font-semibold text-cyan-100">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Module</p>
                          <h3 className="mt-1 text-lg font-semibold text-white">{module.title}</h3>
                        </div>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                        {module.reward}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{module.summary}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {module.lessons.slice(0, 2).map((lesson) => (
                        <div
                          key={lesson.id}
                          className="rounded-[20px] border border-white/8 bg-white/5 p-4"
                        >
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                            {lesson.duration} · {lesson.difficulty}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">{lesson.title}</p>
                          <p className="mt-2 text-sm leading-7 text-slate-300">{lesson.objective}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[24px] border border-amber-300/15 bg-amber-300/8 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-amber-100/80">Boss Mission</p>
                <p className="mt-2 text-base font-semibold text-white">{path.bossMission}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {path.recommendedProblems.slice(0, 2).map((problem) => (
                    <Link
                      key={problem.slug}
                      href={`/problems/${problem.slug}`}
                      className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-2 text-xs text-slate-100 transition hover:bg-black/20"
                    >
                      {problem.title}
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <div className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
          <SectionTitle
            badge="Featured Problems"
            title="首页也能直接切进代表练习，保持课程与题库之间的短反馈回路"
            description="先看题目任务感，再跳到题目页直接运行或提交，让首页不只是展示页，而是进入练习的起点。"
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {home.featuredProblems.map((problem) => (
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
                <p className="mt-3 min-h-20 text-sm leading-7 text-slate-300">{problem.mission}</p>
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
        </div>

        <div className="space-y-6">
          <div className="panel-shell rounded-[34px] px-6 py-7">
            <SectionTitle
              badge="Featured Lessons"
              title="代表课时"
              description="首页保留重点课时入口，方便从学习路径直接切回知识讲解。"
            />
            <div className="mt-6 grid gap-3">
              {home.featuredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="rounded-[22px] border border-white/8 bg-white/5 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    {lesson.module} · {lesson.duration} · {lesson.difficulty}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{lesson.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{lesson.objective}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-shell rounded-[34px] px-6 py-7">
            <SectionTitle
              badge="Release Notes"
              title="最新完善"
              description="记录本地站点最近加入的课程化能力，方便确认当前演进方向。"
            />
            <div className="mt-6 grid gap-3">
              {home.releaseNotes.map((item, index) => (
                <div
                  key={`${item}-${index}`}
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
        </div>
      </section>
    </div>
  );
}
