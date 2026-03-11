"use client";

import { useMemo, useState } from "react";
import {
  type AdminActivityEntry,
  publicApiBaseUrl,
  type AdminContentCatalog,
  type AdminOverview,
  type AdminUserDetail
} from "../lib/api";

type AdminDashboardProps = {
  overview: AdminOverview;
  users: AdminUserDetail[];
  content: AdminContentCatalog;
  activity: AdminActivityEntry[];
};

type AdminMutationResponse = {
  ok?: boolean;
  error?: string;
  overview: AdminOverview;
  content: AdminContentCatalog;
  activity?: AdminActivityEntry[];
};

type ProblemFormState = {
  slug: string;
  title: string;
  difficulty: string;
  type: string;
  tags: string;
  mission: string;
  description: string;
  starterCode: string;
  hints: string;
  acceptance: string;
  runtime: string;
  exampleInput: string;
  exampleOutput: string;
  exampleExplanation: string;
};

type LessonDraft = {
  id: string;
  title: string;
  duration: string;
  difficulty: string;
  objective: string;
  contentTags: string;
  snippet: string;
};

type ModuleDraft = {
  title: string;
  summary: string;
  reward: string;
  lessons: LessonDraft[];
};

type PathFormState = {
  slug: string;
  title: string;
  subtitle: string;
  theme: string;
  estimatedHours: string;
  focusTags: string;
  bossMission: string;
  description: string;
  milestones: string;
  recommendedProblemSlugs: string;
  modules: ModuleDraft[];
};

const defaultProblemForm = (): ProblemFormState => ({
  slug: "",
  title: "",
  difficulty: "Easy",
  type: "编程题",
  tags: "",
  mission: "",
  description: "",
  starterCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n  return 0;\n}",
  hints: "",
  acceptance: "",
  runtime: "mock runtime · C++17",
  exampleInput: "",
  exampleOutput: "",
  exampleExplanation: ""
});

const defaultLessonDraft = (): LessonDraft => ({
  id: "",
  title: "",
  duration: "15 分钟",
  difficulty: "Beginner",
  objective: "",
  contentTags: "",
  snippet: ""
});

const defaultModuleDraft = (): ModuleDraft => ({
  title: "",
  summary: "",
  reward: "",
  lessons: [defaultLessonDraft()]
});

const defaultPathForm = (): PathFormState => ({
  slug: "",
  title: "",
  subtitle: "",
  theme: "",
  estimatedHours: "6",
  focusTags: "",
  bossMission: "",
  description: "",
  milestones: "",
  recommendedProblemSlugs: "",
  modules: [defaultModuleDraft()]
});

export function AdminDashboard({ overview, users, content, activity }: AdminDashboardProps) {
  const [overviewState, setOverviewState] = useState(overview);
  const [items, setItems] = useState(users);
  const [contentState, setContentState] = useState(content);
  const [activityState, setActivityState] = useState(activity);
  const [busyUserId, setBusyUserId] = useState("");
  const [busyDeleteKey, setBusyDeleteKey] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "active" | "inactive" | "admin">("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [problemForm, setProblemForm] = useState(defaultProblemForm);
  const [pathForm, setPathForm] = useState(defaultPathForm);
  const [savingProblem, setSavingProblem] = useState(false);
  const [savingPath, setSavingPath] = useState(false);

  const activeRate = useMemo(() => {
    if (overviewState.totalUsers === 0) {
      return "0%";
    }
    return `${Math.round((overviewState.activeUsers / overviewState.totalUsers) * 100)}%`;
  }, [overviewState.activeUsers, overviewState.totalUsers]);

  const acceptanceRate = useMemo(() => {
    if (overviewState.totalSubmissions === 0) {
      return "0%";
    }
    return `${Math.round((overviewState.acceptedSubmissions / overviewState.totalSubmissions) * 100)}%`;
  }, [overviewState.acceptedSubmissions, overviewState.totalSubmissions]);

  const filteredUsers = useMemo(() => {
    const keyword = userQuery.trim().toLowerCase();
    return items.filter((user) => {
      if (userFilter === "active" && !user.isActive) {
        return false;
      }
      if (userFilter === "inactive" && user.isActive) {
        return false;
      }
      if (userFilter === "admin" && user.role !== "admin") {
        return false;
      }
      if (!keyword) {
        return true;
      }
      return (
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.role.toLowerCase().includes(keyword)
      );
    });
  }, [items, userFilter, userQuery]);

  const latestPaths = useMemo(() => [...contentState.paths].slice(-5).reverse(), [contentState.paths]);
  const latestProblems = useMemo(() => [...contentState.problems].slice(-6).reverse(), [contentState.problems]);
  const latestLessons = useMemo(() => [...contentState.lessons].slice(-6).reverse(), [contentState.lessons]);

  async function toggleUser(user: AdminUserDetail) {
    setBusyUserId(user.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${publicApiBaseUrl}/api/v1/admin/users/${user.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ isActive: !user.isActive })
      });

      const payload = (await response.json()) as { error?: string; activity?: AdminActivityEntry[] };
      if (!response.ok) {
        throw new Error(payload.error ?? `请求失败：${response.status}`);
      }

      setItems((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                isActive: !item.isActive
              }
            : item
        )
      );
      if (payload.activity) {
        setActivityState(payload.activity);
      }
      setMessage(`${user.name} 已${user.isActive ? "禁用" : "启用"}。`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "更新失败");
    } finally {
      setBusyUserId("");
    }
  }

  async function submitProblem() {
    setSavingProblem(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        slug: problemForm.slug.trim(),
        title: problemForm.title.trim(),
        difficulty: problemForm.difficulty,
        type: problemForm.type.trim(),
        tags: splitCommaList(problemForm.tags),
        mission: problemForm.mission.trim(),
        description: problemForm.description.trim(),
        starterCode: problemForm.starterCode,
        hints: splitLineList(problemForm.hints),
        acceptance: splitLineList(problemForm.acceptance),
        runtime: problemForm.runtime.trim(),
        examples:
          problemForm.exampleInput || problemForm.exampleOutput || problemForm.exampleExplanation
            ? [
                {
                  input: problemForm.exampleInput,
                  output: problemForm.exampleOutput,
                  explanation: problemForm.exampleExplanation
                }
              ]
            : []
      };

      const response = await fetch(`${publicApiBaseUrl}/api/v1/admin/content/problems`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = (await response.json()) as AdminMutationResponse;
      if (!response.ok) {
        throw new Error(result.error ?? `创建题目失败：${response.status}`);
      }

      setOverviewState(result.overview);
      setContentState(result.content);
      if (result.activity) {
        setActivityState(result.activity);
      }
      setProblemForm(defaultProblemForm());
      setMessage(`题目《${payload.title}》已加入题库。`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "创建题目失败");
    } finally {
      setSavingProblem(false);
    }
  }

  async function submitPath() {
    setSavingPath(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        slug: pathForm.slug.trim(),
        title: pathForm.title.trim(),
        subtitle: pathForm.subtitle.trim(),
        theme: pathForm.theme.trim(),
        estimatedHours: Number(pathForm.estimatedHours),
        focusTags: splitCommaList(pathForm.focusTags),
        bossMission: pathForm.bossMission.trim(),
        description: pathForm.description.trim(),
        milestones: splitLineList(pathForm.milestones),
        recommendedProblemSlugs: splitCommaList(pathForm.recommendedProblemSlugs),
        modules: pathForm.modules.map((module) => ({
          title: module.title.trim(),
          summary: module.summary.trim(),
          reward: module.reward.trim(),
          lessons: module.lessons.map((lesson) => ({
            id: lesson.id.trim(),
            title: lesson.title.trim(),
            module: module.title.trim(),
            duration: lesson.duration.trim(),
            difficulty: lesson.difficulty.trim(),
            objective: lesson.objective.trim(),
            contentTags: splitCommaList(lesson.contentTags),
            snippet: lesson.snippet
          }))
        }))
      };

      const response = await fetch(`${publicApiBaseUrl}/api/v1/admin/content/paths`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = (await response.json()) as AdminMutationResponse;
      if (!response.ok) {
        throw new Error(result.error ?? `创建路径失败：${response.status}`);
      }

      setOverviewState(result.overview);
      setContentState(result.content);
      if (result.activity) {
        setActivityState(result.activity);
      }
      setPathForm(defaultPathForm());
      setMessage(`课程路径《${payload.title}》已发布。`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "创建路径失败");
    } finally {
      setSavingPath(false);
    }
  }

  function updateModule(index: number, patch: Partial<ModuleDraft>) {
    setPathForm((current) => ({
      ...current,
      modules: current.modules.map((module, moduleIndex) =>
        moduleIndex === index ? { ...module, ...patch } : module
      )
    }));
  }

  function updateLesson(moduleIndex: number, lessonIndex: number, patch: Partial<LessonDraft>) {
    setPathForm((current) => ({
      ...current,
      modules: current.modules.map((module, currentModuleIndex) =>
        currentModuleIndex === moduleIndex
          ? {
              ...module,
              lessons: module.lessons.map((lesson, currentLessonIndex) =>
                currentLessonIndex === lessonIndex ? { ...lesson, ...patch } : lesson
              )
            }
          : module
      )
    }));
  }

  function addModule() {
    setPathForm((current) => ({
      ...current,
      modules: [...current.modules, defaultModuleDraft()]
    }));
  }

  function removeModule(index: number) {
    setPathForm((current) => ({
      ...current,
      modules:
        current.modules.length === 1 ? current.modules : current.modules.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function addLesson(moduleIndex: number) {
    setPathForm((current) => ({
      ...current,
      modules: current.modules.map((module, currentModuleIndex) =>
        currentModuleIndex === moduleIndex
          ? {
              ...module,
              lessons: [...module.lessons, defaultLessonDraft()]
            }
          : module
      )
    }));
  }

  function removeLesson(moduleIndex: number, lessonIndex: number) {
    setPathForm((current) => ({
      ...current,
      modules: current.modules.map((module, currentModuleIndex) =>
        currentModuleIndex === moduleIndex
          ? {
              ...module,
              lessons:
                module.lessons.length === 1
                  ? module.lessons
                  : module.lessons.filter((_, itemIndex) => itemIndex !== lessonIndex)
            }
          : module
      )
    }));
  }

  async function deleteProblem(slug: string) {
    const confirmed = window.confirm(`确认删除题目 ${slug} 吗？`);
    if (!confirmed) {
      return;
    }

    setBusyDeleteKey(`problem:${slug}`);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${publicApiBaseUrl}/api/v1/admin/content/problems/${slug}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      });

      const result = (await response.json()) as AdminMutationResponse;
      if (!response.ok) {
        throw new Error(result.error ?? `删除题目失败：${response.status}`);
      }

      setOverviewState(result.overview);
      setContentState(result.content);
      if (result.activity) {
        setActivityState(result.activity);
      }
      setMessage(`题目 ${slug} 已删除。`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "删除题目失败");
    } finally {
      setBusyDeleteKey("");
    }
  }

  async function deletePath(slug: string) {
    const confirmed = window.confirm(`确认删除路径 ${slug} 吗？`);
    if (!confirmed) {
      return;
    }

    setBusyDeleteKey(`path:${slug}`);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${publicApiBaseUrl}/api/v1/admin/content/paths/${slug}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      });

      const result = (await response.json()) as AdminMutationResponse;
      if (!response.ok) {
        throw new Error(result.error ?? `删除路径失败：${response.status}`);
      }

      setOverviewState(result.overview);
      setContentState(result.content);
      if (result.activity) {
        setActivityState(result.activity);
      }
      setMessage(`路径 ${slug} 已删除。`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "删除路径失败");
    } finally {
      setBusyDeleteKey("");
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="用户总数" value={String(overviewState.totalUsers)} />
        <MetricCard label="活跃账号" value={String(overviewState.activeUsers)} hint={`活跃率 ${activeRate}`} />
        <MetricCard
          label="累计提交"
          value={String(overviewState.totalSubmissions)}
          hint={`通过率 ${acceptanceRate}`}
        />
        <MetricCard
          label="内容规模"
          value={`${overviewState.totalPaths} / ${overviewState.totalLessons} / ${overviewState.totalProblems}`}
          hint="路径 / 课程 / 题目"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <InsightCard
          title="账号活跃度"
          value={activeRate}
          description="按当前启用账号占比估算平台可服务的学习用户。"
        />
        <InsightCard
          title="判题通过率"
          value={acceptanceRate}
          description="统计全部提交里结果为 ACCEPTED 的占比。"
        />
        <InsightCard
          title="管理员账号"
          value={String(overviewState.adminUsers)}
          description="建议只保留极少数管理账号，减少误操作范围。"
        />
      </section>

      {message ? (
        <div className="rounded-[22px] border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-[22px] border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-50">
          {error}
        </div>
      ) : null}

      <section className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/80">Accounts</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">用户账号管理</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              支持搜索、筛选账号状态，并对普通用户执行启用或禁用操作。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              value={userQuery}
              onChange={(event) => {
                setUserQuery(event.target.value);
              }}
              placeholder="搜索姓名 / 邮箱 / 角色"
              className="min-w-[220px] rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
            />
            <select
              value={userFilter}
              onChange={(event) => {
                setUserFilter(event.target.value as "all" | "active" | "inactive" | "admin");
              }}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
            >
              <option value="all">全部账号</option>
              <option value="active">仅启用</option>
              <option value="inactive">仅禁用</option>
              <option value="admin">仅管理员</option>
            </select>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-white/8 text-left text-sm text-slate-200">
            <thead>
              <tr className="text-xs uppercase tracking-[0.22em] text-slate-400">
                <th className="pb-3 pr-4">用户</th>
                <th className="pb-3 pr-4">角色</th>
                <th className="pb-3 pr-4">状态</th>
                <th className="pb-3 pr-4">提交</th>
                <th className="pb-3 pr-4">通过</th>
                <th className="pb-3 pr-4">最近活跃</th>
                <th className="pb-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="py-4 pr-4">
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="mt-1 text-xs text-slate-400">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs">{user.role}</span>
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        user.isActive
                          ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-50"
                          : "border border-rose-300/20 bg-rose-300/10 text-rose-50"
                      }`}
                    >
                      {user.isActive ? "已启用" : "已禁用"}
                    </span>
                  </td>
                  <td className="py-4 pr-4">{user.submissionCount}</td>
                  <td className="py-4 pr-4">{user.acceptedCount}</td>
                  <td className="py-4 pr-4">
                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString("zh-CN") : "暂无"}
                  </td>
                  <td className="py-4">
                    {user.role === "admin" ? (
                      <span className="text-xs text-slate-500">管理员账号</span>
                    ) : (
                      <button
                        type="button"
                        disabled={busyUserId === user.id}
                        onClick={() => {
                          void toggleUser(user);
                        }}
                        className="rounded-full border border-white/10 px-4 py-2 text-xs text-white transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyUserId === user.id ? "处理中..." : user.isActive ? "禁用账号" : "启用账号"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <ContentListCard
          eyebrow="Paths"
          title="现有路径"
          description="最新发布的课程路径会立即显示在公开学习地图中。"
          items={latestPaths.map((path) => `${path.title} · ${path.slug}`)}
        />
        <ContentListCard
          eyebrow="Problems"
          title="最新题目"
          description="新增题目可立即出现在题库页，并可关联到新的课程路径。"
          items={latestProblems.map((problem) => `${problem.title} · ${problem.slug}`)}
        />
        <ContentListCard
          eyebrow="Lessons"
          title="最新课程"
          description="路径中嵌入的 lessons 会自动计入课程总数和首页推荐池。"
          items={latestLessons.map((lesson) => `${lesson.title} · ${lesson.id}`)}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <AdminActionListCard
          eyebrow="Delete Content"
          title="删除课程路径"
          description="删除后路径会从公开学习地图消失，首页统计会同步更新。"
          items={latestPaths.map((path) => ({
            key: path.slug,
            title: path.title,
            subtitle: path.slug,
            busy: busyDeleteKey === `path:${path.slug}`,
            onDelete: () => {
              void deletePath(path.slug);
            }
          }))}
        />
        <AdminActionListCard
          eyebrow="Delete Content"
          title="删除题目"
          description="删除后题目会从题库列表隐藏，并从课程推荐题目中移除。"
          items={latestProblems.map((problem) => ({
            key: problem.slug,
            title: problem.title,
            subtitle: problem.slug,
            busy: busyDeleteKey === `problem:${problem.slug}`,
            onDelete: () => {
              void deleteProblem(problem.slug);
            }
          }))}
        />
      </section>

      <section className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
        <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/80">Activity</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">最近后台操作</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          保留最近 20 条管理员行为，方便回查谁在什么时候修改了账号或内容。
        </p>

        <div className="mt-6 space-y-3">
          {activityState.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-3 text-sm text-slate-400">
              暂无后台操作记录
            </div>
          ) : null}
          {activityState.map((item) => (
            <div
              key={`${item.id}-${item.createdAt}`}
              className="flex flex-wrap items-start justify-between gap-3 rounded-[24px] border border-white/8 bg-slate-950/45 px-4 py-4"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">
                  {formatActionLabel(item.action)} · {formatTargetLabel(item.targetType)} · {item.targetKey}
                </p>
                <p className="text-xs text-slate-400">
                  {item.actorName} ({item.actorEmail})
                </p>
                <p className="text-sm text-slate-300">{item.detail}</p>
              </div>
              <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("zh-CN")}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/80">Create Problem</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">新增题目</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              适合补齐题库练习。标签用英文逗号分隔，提示与验收规则按行填写。
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field
              label="题目标识 slug"
              value={problemForm.slug}
              onChange={(value) => {
                setProblemForm((current) => ({ ...current, slug: value }));
              }}
            />
            <Field
              label="题目标题"
              value={problemForm.title}
              onChange={(value) => {
                setProblemForm((current) => ({ ...current, title: value }));
              }}
            />
            <SelectField
              label="难度"
              value={problemForm.difficulty}
              options={["Easy", "Medium", "Hard"]}
              onChange={(value) => {
                setProblemForm((current) => ({ ...current, difficulty: value }));
              }}
            />
            <Field
              label="题目类型"
              value={problemForm.type}
              onChange={(value) => {
                setProblemForm((current) => ({ ...current, type: value }));
              }}
            />
          </div>

          <div className="mt-4 space-y-4">
            <Field
              label="标签"
              value={problemForm.tags}
              placeholder="vector, sort, string"
              onChange={(value) => {
                setProblemForm((current) => ({ ...current, tags: value }));
              }}
            />
            <TextAreaField
              label="任务目标"
              value={problemForm.mission}
              rows={3}
              onChange={(value) => {
                setProblemForm((current) => ({ ...current, mission: value }));
              }}
            />
            <TextAreaField
              label="题目描述"
              value={problemForm.description}
              rows={4}
              onChange={(value) => {
                setProblemForm((current) => ({ ...current, description: value }));
              }}
            />
            <TextAreaField
              label="起始代码"
              value={problemForm.starterCode}
              rows={9}
              onChange={(value) => {
                setProblemForm((current) => ({ ...current, starterCode: value }));
              }}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextAreaField
                label="提示（每行一条）"
                value={problemForm.hints}
                rows={4}
                onChange={(value) => {
                  setProblemForm((current) => ({ ...current, hints: value }));
                }}
              />
              <TextAreaField
                label="验收规则（每行一条）"
                value={problemForm.acceptance}
                rows={4}
                onChange={(value) => {
                  setProblemForm((current) => ({ ...current, acceptance: value }));
                }}
              />
            </div>
            <Field
              label="运行环境"
              value={problemForm.runtime}
              onChange={(value) => {
                setProblemForm((current) => ({ ...current, runtime: value }));
              }}
            />
            <div className="grid gap-4 md:grid-cols-3">
              <TextAreaField
                label="示例输入"
                value={problemForm.exampleInput}
                rows={4}
                onChange={(value) => {
                  setProblemForm((current) => ({ ...current, exampleInput: value }));
                }}
              />
              <TextAreaField
                label="示例输出"
                value={problemForm.exampleOutput}
                rows={4}
                onChange={(value) => {
                  setProblemForm((current) => ({ ...current, exampleOutput: value }));
                }}
              />
              <TextAreaField
                label="示例说明"
                value={problemForm.exampleExplanation}
                rows={4}
                onChange={(value) => {
                  setProblemForm((current) => ({ ...current, exampleExplanation: value }));
                }}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setProblemForm(defaultProblemForm());
              }}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/5"
            >
              重置
            </button>
            <button
              type="button"
              disabled={savingProblem}
              onClick={() => {
                void submitProblem();
              }}
              className="rounded-full border border-cyan-300/30 bg-cyan-300/15 px-5 py-2 text-sm text-cyan-50 transition hover:border-cyan-300/50 hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProblem ? "创建中..." : "发布题目"}
            </button>
          </div>
        </div>

        <div className="panel-shell rounded-[34px] px-6 py-7 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/80">Create Path</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">新增课程路径</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                路径支持动态添加模块和 lessons。推荐题目填写已存在题目的 slug，多个值用英文逗号分隔。
              </p>
            </div>
            <button
              type="button"
              onClick={addModule}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/5"
            >
              添加模块
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field
              label="路径 slug"
              value={pathForm.slug}
              onChange={(value) => {
                setPathForm((current) => ({ ...current, slug: value }));
              }}
            />
            <Field
              label="路径标题"
              value={pathForm.title}
              onChange={(value) => {
                setPathForm((current) => ({ ...current, title: value }));
              }}
            />
            <Field
              label="副标题"
              value={pathForm.subtitle}
              onChange={(value) => {
                setPathForm((current) => ({ ...current, subtitle: value }));
              }}
            />
            <Field
              label="主题"
              value={pathForm.theme}
              onChange={(value) => {
                setPathForm((current) => ({ ...current, theme: value }));
              }}
            />
            <Field
              label="预计小时"
              type="number"
              value={pathForm.estimatedHours}
              onChange={(value) => {
                setPathForm((current) => ({ ...current, estimatedHours: value }));
              }}
            />
            <Field
              label="焦点标签"
              value={pathForm.focusTags}
              placeholder="vector, string, sort"
              onChange={(value) => {
                setPathForm((current) => ({ ...current, focusTags: value }));
              }}
            />
          </div>

          <div className="mt-4 space-y-4">
            <TextAreaField
              label="Boss Mission"
              value={pathForm.bossMission}
              rows={3}
              onChange={(value) => {
                setPathForm((current) => ({ ...current, bossMission: value }));
              }}
            />
            <TextAreaField
              label="路径描述"
              value={pathForm.description}
              rows={4}
              onChange={(value) => {
                setPathForm((current) => ({ ...current, description: value }));
              }}
            />
            <TextAreaField
              label="Milestones（每行一条）"
              value={pathForm.milestones}
              rows={4}
              onChange={(value) => {
                setPathForm((current) => ({ ...current, milestones: value }));
              }}
            />
            <TextAreaField
              label="推荐题目 slug"
              value={pathForm.recommendedProblemSlugs}
              rows={3}
              placeholder="vector-sum-board, sort-ranking-list"
              onChange={(value) => {
                setPathForm((current) => ({ ...current, recommendedProblemSlugs: value }));
              }}
            />
            <div className="rounded-[24px] border border-white/10 bg-slate-950/45 px-4 py-4 text-sm text-slate-300">
              <p className="font-medium text-white">可选题目 slug 参考</p>
              <p className="mt-2 leading-7">{contentState.problems.map((problem) => problem.slug).join(", ")}</p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {pathForm.modules.map((module, moduleIndex) => (
              <div key={`module-${moduleIndex}`} className="rounded-[28px] border border-white/10 bg-slate-950/45 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">模块 {moduleIndex + 1}</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        addLesson(moduleIndex);
                      }}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-200 transition hover:border-white/20 hover:bg-white/5"
                    >
                      添加课程
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        removeModule(moduleIndex);
                      }}
                      className="rounded-full border border-rose-300/20 px-3 py-1.5 text-xs text-rose-100 transition hover:bg-rose-300/10"
                    >
                      删除模块
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <Field
                    label="模块标题"
                    value={module.title}
                    onChange={(value) => {
                      updateModule(moduleIndex, { title: value });
                    }}
                  />
                  <Field
                    label="模块摘要"
                    value={module.summary}
                    onChange={(value) => {
                      updateModule(moduleIndex, { summary: value });
                    }}
                  />
                  <Field
                    label="模块奖励"
                    value={module.reward}
                    onChange={(value) => {
                      updateModule(moduleIndex, { reward: value });
                    }}
                  />
                </div>

                <div className="mt-5 space-y-4">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={`lesson-${moduleIndex}-${lessonIndex}`} className="rounded-[24px] border border-white/8 bg-slate-950/55 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white">课程 {lessonIndex + 1}</p>
                        <button
                          type="button"
                          onClick={() => {
                            removeLesson(moduleIndex, lessonIndex);
                          }}
                          className="rounded-full border border-rose-300/20 px-3 py-1 text-xs text-rose-100 transition hover:bg-rose-300/10"
                        >
                          删除课程
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <Field
                          label="课程 ID"
                          value={lesson.id}
                          onChange={(value) => {
                            updateLesson(moduleIndex, lessonIndex, { id: value });
                          }}
                        />
                        <Field
                          label="课程标题"
                          value={lesson.title}
                          onChange={(value) => {
                            updateLesson(moduleIndex, lessonIndex, { title: value });
                          }}
                        />
                        <Field
                          label="课程时长"
                          value={lesson.duration}
                          onChange={(value) => {
                            updateLesson(moduleIndex, lessonIndex, { duration: value });
                          }}
                        />
                        <SelectField
                          label="难度"
                          value={lesson.difficulty}
                          options={["Beginner", "Intermediate", "Advanced"]}
                          onChange={(value) => {
                            updateLesson(moduleIndex, lessonIndex, { difficulty: value });
                          }}
                        />
                      </div>

                      <div className="mt-4 space-y-4">
                        <TextAreaField
                          label="课程目标"
                          value={lesson.objective}
                          rows={3}
                          onChange={(value) => {
                            updateLesson(moduleIndex, lessonIndex, { objective: value });
                          }}
                        />
                        <Field
                          label="标签"
                          value={lesson.contentTags}
                          placeholder="vector, loop, sort"
                          onChange={(value) => {
                            updateLesson(moduleIndex, lessonIndex, { contentTags: value });
                          }}
                        />
                        <TextAreaField
                          label="代码片段"
                          value={lesson.snippet}
                          rows={7}
                          onChange={(value) => {
                            updateLesson(moduleIndex, lessonIndex, { snippet: value });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setPathForm(defaultPathForm());
              }}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/5"
            >
              重置
            </button>
            <button
              type="button"
              disabled={savingPath}
              onClick={() => {
                void submitPath();
              }}
              className="rounded-full border border-cyan-300/30 bg-cyan-300/15 px-5 py-2 text-sm text-cyan-50 transition hover:border-cyan-300/50 hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPath ? "发布中..." : "发布课程路径"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="panel-shell rounded-[28px] px-5 py-5">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-400">{hint}</p> : null}
    </div>
  );
}

function InsightCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="panel-shell rounded-[28px] px-5 py-5">
      <p className="text-sm text-slate-300">{title}</p>
      <p className="mt-3 text-4xl font-semibold text-white">{value}</p>
      <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
    </div>
  );
}

function ContentListCard({
  eyebrow,
  title,
  description,
  items
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <div className="panel-shell rounded-[28px] px-5 py-5">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
      <div className="mt-5 space-y-2 text-sm text-slate-200">
        {items.length === 0 ? <p className="text-slate-500">暂无内容</p> : null}
        {items.map((item) => (
          <div key={item} className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-2">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminActionListCard({
  eyebrow,
  title,
  description,
  items
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: Array<{
    key: string;
    title: string;
    subtitle: string;
    busy: boolean;
    onDelete: () => void;
  }>;
}) {
  return (
    <div className="panel-shell rounded-[28px] px-5 py-5">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-3 text-sm text-slate-500">
            暂无可删除内容
          </div>
        ) : null}
        {items.map((item) => (
          <div
            key={item.key}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-3"
          >
            <div>
              <p className="text-sm font-medium text-white">{item.title}</p>
              <p className="mt-1 text-xs text-slate-400">{item.subtitle}</p>
            </div>
            <button
              type="button"
              disabled={item.busy}
              onClick={item.onDelete}
              className="rounded-full border border-rose-300/20 px-4 py-2 text-xs text-rose-100 transition hover:bg-rose-300/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {item.busy ? "删除中..." : "删除"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-300">{label}</span>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
      />
    </label>
  );
}

function splitCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLineList(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatActionLabel(action: string) {
  switch (action) {
    case "create_problem":
      return "创建题目";
    case "delete_problem":
      return "删除题目";
    case "create_path":
      return "创建路径";
    case "delete_path":
      return "删除路径";
    case "enable_user":
      return "启用用户";
    case "disable_user":
      return "禁用用户";
    default:
      return action;
  }
}

function formatTargetLabel(targetType: string) {
  switch (targetType) {
    case "problem":
      return "题目";
    case "path":
      return "路径";
    case "user":
      return "用户";
    default:
      return targetType;
  }
}
