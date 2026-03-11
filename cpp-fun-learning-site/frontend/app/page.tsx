import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Flame,
  Layers3,
  Radar,
  Sparkles,
  Trophy
} from "lucide-react";
import { SectionTitle } from "../components/section-title";
import { getHome, getPath, getProblems, getProgressOverview } from "../lib/server-api";

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
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
        <div className="panel-shell relative overflow-hidden rounded-[36px] px-6 py-7 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.14),transparent_26%)]" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.32em] text-cyan-100">
                {home.hero.eyebrow}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                当前路线：{progress.currentPath.title}
              </span>
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              {home.hero.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              {home.hero.subtitle}
            </p>

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
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-5 py-3 text-sm font-medium text-emerald-50 transition hover:bg-emerald-300/15"
              >
                登录 / 注册
                <Sparkles className="h-4 w-4" />
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
                <p className="text-xs uppercase tracking-[0.36em] text-emerald-200/80">
                  Daily Quest
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">{home.dailyQuest.title}</h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-300">{home.dailyQuest.objective}</p>

            <div className="mt-5 rounded-[24px] border border-white/8 bg-white/4 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">今日奖励</p>
              <p className="mt-2 text-lg font-medium text-white">{home.dailyQuest.reward}</p>
            </div>

            <div className="mt-5 space-y-3">
              {home.dailyQuest.tips.map((tip) => (
                <div
                  key={tip}
                  className="rounded-[20px] border border-white/8 bg-white/5 px-4 py-3 text-sm leading-7 text-slate-300"
                >
                  {tip}
                </div>
              ))}
            </div>
          </div>

          <div className="panel-shell rounded-[30px] px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.36em] text-cyan-200/80">
                  Progress Snapshot
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">个人成长面板</h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">题目进度</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {progress.completedProblems}/{progress.totalProblems}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
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
            badge="Learning Support"
            title="学习、练习和成长记录已经串成一条连续反馈链路"
            description="这里展示的是学习者真正会感知到的能力：看课、试跑、正式提交与个人记录沉淀。"
          />

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[24px] border border-white/8 bg-white/5 p-5">
              <div className="flex items-center gap-3 text-cyan-100">
                <Layers3 className="h-5 w-5" />
                <p className="text-sm font-medium">学习入口</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">{home.stack.web}</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/5 p-5">
              <div className="flex items-center gap-3 text-violet-100">
                <Radar className="h-5 w-5" />
                <p className="text-sm font-medium">练习反馈</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">{home.stack.judge}</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/5 p-5">
              <div className="flex items-center gap-3 text-amber-100">
                <Trophy className="h-5 w-5" />
                <p className="text-sm font-medium">个人记录</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">{home.stack.persistence}</p>
            </div>
          </div>
        </div>

        <div className="panel-shell rounded-[34px] px-6 py-7">
          <SectionTitle
            badge="Latest Updates"
            title="最近补全的学习内容"
            description="这里记录课程、题库和个人学习能力方面的最新完善内容。"
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
      </section>

      <section className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
        <SectionTitle
          badge="Featured Paths"
          title="先选路线，再按模块推进"
          description="每条路线都带着推荐课程与练习，你可以从当前基础直接继续。"
        />

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {featuredPathDetails.map((path) => (
            <article key={path.slug} className="rounded-[30px] border border-white/8 bg-white/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{path.theme}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{path.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{path.subtitle}</p>
                </div>
                <Link
                  href={`/paths/${path.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-100 transition hover:border-white/20 hover:bg-white/5"
                >
                  查看路线
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] border border-white/8 bg-slate-950/35 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">预计时长</p>
                  <p className="mt-2 text-lg font-medium text-white">{path.estimatedHours} 小时</p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-slate-950/35 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">课程数量</p>
                  <p className="mt-2 text-lg font-medium text-white">{path.lessonCount}</p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-slate-950/35 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">练习数量</p>
                  <p className="mt-2 text-lg font-medium text-white">{path.challengeCount}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
        <SectionTitle
          badge="Featured Problems"
          title="从首页也能直接切进练习"
          description="挑一道代表题试跑或正式提交，系统会按你的账号累计记录。"
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
                进入练习
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
        <SectionTitle
          badge="Featured Lessons"
          title="关键课程入口"
          description="不想先看完整路线时，也可以从这里直接切入重点课程。"
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {home.featuredLessons.map((lesson) => (
            <div key={lesson.id} className="rounded-[22px] border border-white/8 bg-white/5 p-4">
              <div className="flex items-center gap-3 text-cyan-100">
                <BookOpenText className="h-5 w-5" />
                <p className="text-sm font-medium">{lesson.module}</p>
              </div>
              <p className="mt-3 text-lg font-semibold text-white">{lesson.title}</p>
              <p className="mt-2 text-sm text-slate-400">
                {lesson.duration} · {lesson.difficulty}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{lesson.objective}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
