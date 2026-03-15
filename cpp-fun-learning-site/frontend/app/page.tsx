import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowRight,
  BookOpenText,
  CirclePlay,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users
} from "lucide-react";
import { buildAuthAccessHref } from "../lib/auth-links";
import {
  EXPERIMENT_COOKIE_NAMES,
  resolveHomeHeroVariant
} from "../lib/experiments";
import {
  formatLearningTitle,
  formatProblemDifficultyLabel
} from "../lib/problem-labels";
import { getHome, getPath, getProblems, getProgressOverview } from "../lib/server-api";

const squadQuotes = [
  {
    name: "星火",
    role: "冲榜玩家",
    quote: "路径地图像学习导航图，打开之后就知道今天该做什么。"
  },
  {
    name: "回声",
    role: "社区队长",
    quote: "课程、练习和记录连在一起之后，推进节奏顺了很多。"
  },
  {
    name: "像素",
    role: "新手学员",
    quote: "我不用再翻很多页面找下一步，整个学习过程轻松了。"
  }
] as const;

export default async function HomePage() {
  const cookieStore = await cookies();
  const heroVariant = resolveHomeHeroVariant(
    cookieStore.get(EXPERIMENT_COOKIE_NAMES.homeHero)?.value
  );

  const [home, progress, problems] = await Promise.all([
    getHome(),
    getProgressOverview(),
    getProblems()
  ]);

  const featuredPathDetails = (
    await Promise.all(home.featuredPaths.map((path) => getPath(path.slug)))
  ).filter((item): item is NonNullable<typeof item> => Boolean(item));

  const nextProblem = problems.find(
    (problem) => problem.title === progress.currentPath.nextProblemTitle
  );

  const heroStory =
    heroVariant === "a"
      ? {
          eyebrow: "新学期学习面板",
          titleTop: "把 C++ 学习",
          titleAccent: "学得轻松，",
          titleBottom: "练得踏实。",
          description:
            "课程路径、题目练习和个人进度都被整理进同一页里，让你一打开就能接上今天的节奏。"
        }
      : {
          eyebrow: "学习路线已整理",
          titleTop: "从第一节课开始，",
          titleAccent: "每天都有",
          titleBottom: "清楚的下一步。",
          description:
            "系统会把当前路径、下一节课和推荐练习摆在眼前，少花时间切换，多花时间真正学习。"
        };

  const featuredPaths = featuredPathDetails.slice(0, 3).map((path, index) => ({
    slug: path.slug,
    title: path.title,
    subtitle: path.subtitle,
    lessonCount: path.lessonCount,
    challengeCount: path.challengeCount,
    estimatedHours: path.estimatedHours,
    reward: path.bossMission,
    tags: path.focusTags.slice(0, 3),
    mode: ["主线路径", "练习联动", "进阶挑战"][index] ?? "学习模块"
  }));

  const studyStats = [
    {
      value: `${progress.completedLessons}/${progress.totalLessons}`,
      label: "课程进度"
    },
    {
      value: `${progress.completedProblems}/${progress.totalProblems}`,
      label: "练习完成"
    },
    {
      value: `${progress.weeklyCompleted}/${progress.weeklyTarget}`,
      label: "本周目标"
    }
  ] as const;

  const spotlightLessons = home.featuredLessons.slice(0, 4);
  const spotlightProblems = home.featuredProblems.slice(0, 4);
  const leaderboardPreview = home.leaderboardPreview.slice(0, 3);

  const experienceNotes = [
    {
      title: "主线更清楚",
      body: home.stack.web,
      icon: CirclePlay
    },
    {
      title: "练习更顺手",
      body: home.stack.judge,
      icon: Trophy
    },
    {
      title: "记录已隔离",
      body: home.stack.persistence,
      icon: ShieldCheck
    }
  ] as const;

  return (
    <div className="learn-home">
      <section className="learn-hero">
        <div className="learn-hero__copy">
          <span className="learn-chip learn-chip--green">
            <Sparkles className="h-4 w-4" />
            {heroStory.eyebrow}
          </span>

          <h1 className="learn-hero__title">
            {heroStory.titleTop}
            <span className="learn-hero__accent">{heroStory.titleAccent}</span>
            {heroStory.titleBottom}
          </h1>

          <p className="learn-hero__body">{heroStory.description}</p>

          <div className="learn-hero__actions">
            <Link
              href={buildAuthAccessHref({ mode: "register", redirectTo: "/paths" })}
              className="learn-button learn-button--primary"
            >
              {heroVariant === "a" ? "开始学习" : "立即进入"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/paths"
              className="learn-button learn-button--secondary"
            >
              浏览学习路径
            </Link>
          </div>

          <div className="learn-stat-strip">
            {studyStats.map((item) => (
              <div key={item.label} className="learn-stat-strip__item">
                <p className="learn-stat-strip__value">{item.value}</p>
                <p className="learn-stat-strip__label">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="learn-progress-board">
          <div className="learn-floating-badge learn-floating-badge--peach" aria-hidden="true">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="learn-floating-badge learn-floating-badge--yellow" aria-hidden="true">
            <Star className="h-5 w-5 fill-current" />
          </div>
          <div className="learn-floating-badge learn-floating-badge--blue" aria-hidden="true">
            <Users className="h-5 w-5" />
          </div>

          <div className="learn-progress-board__inner">
            <div className="learn-progress-board__top">
              <div className="learn-progress-board__icon">
                <BookOpenText className="h-5 w-5" />
              </div>
              <div>
                <p className="learn-kicker">当前主线路径</p>
                <h2 className="learn-progress-board__title">{progress.currentPath.title}</h2>
                <p className="learn-progress-board__copy">
                  已完成 {progress.completedLessons} 节课程 · 还有{" "}
                  {progress.currentPath.remainingMissions} 个任务待推进
                </p>
              </div>
            </div>

            <div className="learn-progress-block">
              <div className="learn-progress-block__meta">
                <span>学习进度</span>
                <strong>{progress.currentPath.progressPercent}%</strong>
              </div>
              <div className="learn-progress-block__track" aria-hidden="true">
                <span
                  className="learn-progress-block__fill"
                  style={{ width: `${progress.currentPath.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="learn-progress-board__focus">
              <div className="learn-mini-note">
                <span>下一节课</span>
                <strong>{formatLearningTitle(progress.currentPath.nextLessonTitle)}</strong>
              </div>
              <div className="learn-mini-note learn-mini-note--soft">
                <span>下一关挑战</span>
                <strong>
                  {formatLearningTitle(
                    nextProblem?.title ?? progress.currentPath.nextProblemTitle
                  )}
                </strong>
              </div>
            </div>

            <Link
              href={`/paths/${progress.currentPath.slug}`}
              className="learn-button learn-button--primary learn-button--full"
            >
              继续当前学习
            </Link>
          </div>
        </div>
      </section>

      <section className="learn-section-panel learn-section-panel--split">
        <div>
          <div className="learn-section-header">
            <span className="learn-chip learn-chip--blue">热门路径</span>
            <h2 className="learn-section-header__title">主线路径已经按学习节奏整理好了</h2>
            <p className="learn-section-header__body">
              从基础、语法到练习挑战，都能从当前位置自然接上。
            </p>
          </div>

          <div className="learn-ledger">
            {featuredPaths.map((path, index) => (
              <Link key={path.slug} href={`/paths/${path.slug}`} className="learn-ledger__row">
                <div className="learn-ledger__main">
                  <div className="learn-ledger__top">
                    <span
                      className={`learn-ledger__tag ${
                        index === 0
                          ? "learn-ledger__tag--green"
                          : index === 1
                            ? "learn-ledger__tag--blue"
                            : "learn-ledger__tag--peach"
                      }`}
                    >
                      {path.mode}
                    </span>
                    <span className="learn-ledger__meta">
                      {path.lessonCount} 节课 · {path.challengeCount} 道挑战 · {path.estimatedHours} 小时
                    </span>
                  </div>
                  <h3 className="learn-ledger__title">{path.title}</h3>
                  <p className="learn-ledger__copy">{path.subtitle}</p>
                  <div className="learn-ledger__chips">
                    {path.tags.map((tag) => (
                      <span key={tag} className="learn-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="learn-ledger__aside">
                  <p className="learn-ledger__reward-label">完成后你会得到</p>
                  <p className="learn-ledger__reward">{path.reward}</p>
                  <span className="learn-ledger__action">
                    进入路径
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="learn-aside-panel">
          <span className="learn-chip learn-chip--peach">今日任务</span>
          <h3 className="learn-aside-panel__title">{home.dailyQuest.title}</h3>
          <p className="learn-aside-panel__body">{home.dailyQuest.objective}</p>

          <div className="learn-aside-panel__reward">
            <span>完成奖励</span>
            <strong>{home.dailyQuest.reward}</strong>
          </div>

          <div className="learn-aside-panel__list">
            {home.dailyQuest.tips.slice(0, 2).map((tip) => (
              <p key={tip}>{tip}</p>
            ))}
            {progress.recommendedActions.slice(0, 2).map((action) => (
              <p key={action}>{action}</p>
            ))}
          </div>

          <Link href="/problems" className="learn-button learn-button--secondary learn-button--full">
            去做一题热身
          </Link>
        </aside>
      </section>

      <section className="learn-section-panel">
        <div className="learn-section-header">
          <span className="learn-chip learn-chip--green">内容预览</span>
          <h2 className="learn-section-header__title">课程安排和练习任务放在同一张学习桌上</h2>
          <p className="learn-section-header__body">
            不需要来回切换页面，学完一个点马上就能接一题。
          </p>
        </div>

        <div className="learn-two-column">
          <div className="learn-column">
            <div className="learn-column__header">
              <h3>推荐课程</h3>
              <p>从当前阶段最值得继续的内容开始。</p>
            </div>

            <div className="learn-course-list">
              {spotlightLessons.map((lesson) => (
                <div key={lesson.id} className="learn-course-list__row">
                  <div className="learn-course-list__main">
                    <p className="learn-course-list__title">
                      {formatLearningTitle(lesson.title)}
                    </p>
                    <p className="learn-course-list__meta">
                      {lesson.module} · {lesson.duration}
                    </p>
                  </div>
                  <span className="learn-pill-badge">
                    {formatProblemDifficultyLabel(lesson.difficulty)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="learn-column">
            <div className="learn-column__header">
              <h3>推荐练习</h3>
              <p>边学边练，推进节奏会更稳。</p>
            </div>

            <div className="learn-course-list">
              {spotlightProblems.map((problem) => (
                <div key={problem.slug} className="learn-course-list__row">
                  <div className="learn-course-list__main">
                    <p className="learn-course-list__title">
                      {formatLearningTitle(problem.title)}
                    </p>
                    <p className="learn-course-list__meta">{problem.mission}</p>
                  </div>
                  <span className="learn-pill-badge learn-pill-badge--blue">
                    {formatProblemDifficultyLabel(problem.difficulty)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="learn-note-ribbon">
          {experienceNotes.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="learn-note-ribbon__item">
                <div className="learn-note-ribbon__icon">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="learn-note-ribbon__title">{item.title}</p>
                  <p className="learn-note-ribbon__body">{item.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="learn-section-panel">
        <div className="learn-section-header">
          <span className="learn-chip learn-chip--blue">学习反馈</span>
          <h2 className="learn-section-header__title">当布局更清楚，学习者更愿意继续推进</h2>
          <p className="learn-section-header__body">
            反馈、排行和账号隔离信息都放在一起，方便判断下一步。
          </p>
        </div>

        <div className="learn-two-column">
          <div className="learn-column">
            <div className="learn-column__header">
              <h3>学习者怎么说</h3>
              <p>我们更看重顺手、清楚和舒服，而不是堆很多复杂装饰。</p>
            </div>

            <div className="learn-feedback-list">
              {squadQuotes.map((quote, index) => (
                <article key={quote.name} className="learn-feedback-list__row">
                  <div className="learn-feedback-list__stars" aria-hidden="true">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                  <p className="learn-feedback-list__quote">“{quote.quote}”</p>
                  <div className="learn-feedback-list__person">
                    <span>0{index + 1}</span>
                    <strong>{quote.name}</strong>
                    <em>{quote.role}</em>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="learn-column">
            <div className="learn-column__header">
              <h3>本周活跃榜</h3>
              <p>经验值、连击和头衔会跟随账号一起累计。</p>
            </div>

            <div className="learn-ranking-list">
              {leaderboardPreview.length > 0 ? (
                leaderboardPreview.map((entry) => (
                  <div key={`${entry.rank}-${entry.name}`} className="learn-ranking-list__row">
                    <span className="learn-ranking-list__rank">#{entry.rank}</span>
                    <div className="learn-ranking-list__main">
                      <strong>{entry.name}</strong>
                      <p>
                        {entry.title} · {entry.xp} 经验值 · 连击 {entry.streak} 天
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="learn-ranking-list__empty">
                  本周排行榜准备中，完成练习后就会进入统计。
                </div>
              )}
            </div>

            <div className="learn-isolation-strip">
              <div className="learn-isolation-strip__icon">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="learn-isolation-strip__title">个人记录会按账号隔离保存</p>
                <p className="learn-isolation-strip__body">
                  登录后，你的提交历史、成长记录和后台权限会稳定挂在自己的账号下。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="learn-cta-strip">
        <div>
          <span className="learn-chip learn-chip--green">开始学习</span>
          <h2 className="learn-cta-strip__title">今天就把学习节奏重新接起来</h2>
          <p className="learn-cta-strip__body">
            创建账号后，你可以继续当前路径、保存个人记录，并在需要时进入后台管理内容。
          </p>

          <div className="learn-cta-strip__actions">
            <Link
              href={buildAuthAccessHref({ mode: "register", redirectTo: "/paths" })}
              className="learn-button learn-button--primary"
            >
              创建学习账号
            </Link>
            <Link href="/problems" className="learn-button learn-button--secondary">
              先看题目练习
            </Link>
          </div>
        </div>

        <div className="learn-cta-strip__meta">
          <div className="learn-cta-strip__meta-item">
            <span>当前路径</span>
            <strong>{progress.currentPath.title}</strong>
          </div>
          <div className="learn-cta-strip__meta-item">
            <span>连续学习</span>
            <strong>{progress.streak} 天</strong>
          </div>
          <div className="learn-cta-strip__meta-item">
            <span>推荐动作</span>
            <strong>
              {progress.recommendedActions[0] ?? home.releaseNotes[0] ?? "继续下一节课程"}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
}
