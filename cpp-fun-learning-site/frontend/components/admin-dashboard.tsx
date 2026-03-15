"use client";

import { useMemo, useState } from "react";
import {
  type AdminActivityEntry,
  publicApiBaseUrl,
  type AdminContentCatalog,
  type AdminOverview,
  type AdminUserDetail
} from "../lib/api";
import type { AdminWorkbenchVariant } from "../lib/experiments";
import {
  formatAdminActivityDetail,
  formatDisplayName,
  formatLearningTitle,
  formatProblemDifficultyLabel,
  formatProblemTypeLabel
} from "../lib/problem-labels";

type AdminDashboardProps = {
  overview: AdminOverview;
  users: AdminUserDetail[];
  content: AdminContentCatalog;
  activity: AdminActivityEntry[];
  variant?: AdminWorkbenchVariant;
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

type AdminWorkspace = "overview" | "accounts" | "content" | "paths";
type ContentWorkspace = "health" | "problems";
type PathWorkspace = "planning" | "modules";

const USER_PAGE_SIZE = 6;

const defaultProblemForm = (): ProblemFormState => ({
  slug: "",
  title: "",
  difficulty: "简单",
  type: "编程题",
  tags: "",
  mission: "",
  description: "",
  starterCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n  return 0;\n}",
  hints: "",
  acceptance: "",
  runtime: "模拟运行环境 · C++17",
  exampleInput: "",
  exampleOutput: "",
  exampleExplanation: ""
});

const defaultLessonDraft = (): LessonDraft => ({
  id: "",
  title: "",
  duration: "15 分钟",
  difficulty: "入门",
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

export function AdminDashboard({
  overview,
  users,
  content,
  activity,
  variant = "a"
}: AdminDashboardProps) {
  const [overviewState, setOverviewState] = useState(overview);
  const [items, setItems] = useState(users);
  const [contentState, setContentState] = useState(content);
  const [activityState, setActivityState] = useState(activity);
  const [busyUserId, setBusyUserId] = useState("");
  const [busyDeleteKey, setBusyDeleteKey] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "active" | "inactive" | "admin">("all");
  const [userSort, setUserSort] = useState<"recent" | "name" | "submissions" | "accepted">("recent");
  const [userPage, setUserPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [problemForm, setProblemForm] = useState(defaultProblemForm);
  const [pathForm, setPathForm] = useState(defaultPathForm);
  const [savingProblem, setSavingProblem] = useState(false);
  const [savingPath, setSavingPath] = useState(false);
  const [workspace, setWorkspace] = useState<AdminWorkspace>(variant === "b" ? "content" : "overview");
  const [contentWorkspace, setContentWorkspace] = useState<ContentWorkspace>("health");
  const [pathWorkspace, setPathWorkspace] = useState<PathWorkspace>("planning");

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

  function getUserRoleLabel(role: string) {
    return role === "admin" ? "管理员" : "学习者";
  }

  function getUserStatusLabel(isActive: boolean) {
    return isActive ? "已启用" : "已禁用";
  }

  const filteredUsers = useMemo(() => {
    const keyword = userQuery.trim().toLowerCase();
    return items.filter((user) => {
      const localizedName = formatDisplayName(user.name).toLowerCase();
      const localizedRole = getUserRoleLabel(user.role).toLowerCase();
      const localizedStatus = getUserStatusLabel(user.isActive).toLowerCase();

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
        localizedName.includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.role.toLowerCase().includes(keyword) ||
        localizedRole.includes(keyword) ||
        localizedStatus.includes(keyword)
      );
    });
  }, [items, userFilter, userQuery]);
  const sortedUsers = useMemo(() => {
    const nextUsers = [...filteredUsers];

    if (userSort === "name") {
      return nextUsers.sort((left, right) =>
        formatDisplayName(left.name).localeCompare(formatDisplayName(right.name), "zh-CN")
      );
    }

    if (userSort === "submissions") {
      return nextUsers.sort((left, right) => {
        if (right.submissionCount !== left.submissionCount) {
          return right.submissionCount - left.submissionCount;
        }

        return formatDisplayName(left.name).localeCompare(formatDisplayName(right.name), "zh-CN");
      });
    }

    if (userSort === "accepted") {
      return nextUsers.sort((left, right) => {
        if (right.acceptedCount !== left.acceptedCount) {
          return right.acceptedCount - left.acceptedCount;
        }

        return right.submissionCount - left.submissionCount;
      });
    }

    return nextUsers.sort((left, right) => {
      const leftTime = left.lastActiveAt ? new Date(left.lastActiveAt).getTime() : 0;
      const rightTime = right.lastActiveAt ? new Date(right.lastActiveAt).getTime() : 0;

      if (rightTime !== leftTime) {
        return rightTime - leftTime;
      }

      return right.submissionCount - left.submissionCount;
    });
  }, [filteredUsers, userSort]);
  const totalUserPages = Math.max(1, Math.ceil(sortedUsers.length / USER_PAGE_SIZE));
  const currentUserPage = Math.min(userPage, totalUserPages);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentUserPage - 1) * USER_PAGE_SIZE;
    return sortedUsers.slice(startIndex, startIndex + USER_PAGE_SIZE);
  }, [currentUserPage, sortedUsers]);
  const userPageStart = sortedUsers.length === 0 ? 0 : (currentUserPage - 1) * USER_PAGE_SIZE + 1;
  const userPageEnd = Math.min(currentUserPage * USER_PAGE_SIZE, sortedUsers.length);
  const selectedUser = useMemo(
    () => items.find((user) => user.id === selectedUserId) ?? sortedUsers[0] ?? items[0] ?? null,
    [items, selectedUserId, sortedUsers]
  );
  const selectedUserAcceptedRate = useMemo(() => {
    if (!selectedUser || selectedUser.submissionCount === 0) {
      return "0%";
    }

    return `${Math.round((selectedUser.acceptedCount / selectedUser.submissionCount) * 100)}%`;
  }, [selectedUser]);
  const selectedUserHint = selectedUser
    ? !selectedUser.isActive
      ? "当前账号处于禁用状态，恢复后才能继续保存提交和学习记录。"
      : selectedUser.submissionCount === 0
        ? "这个账号还没有开始做题，适合先引导进入第一题建立个人记录。"
        : selectedUser.acceptedCount === 0
          ? "最近已经有提交动作，但还没有通过记录，适合先检查题目说明、标签和示例。"
          : "账号状态健康，已经形成稳定的提交与通过记录，可以继续观察持续活跃度。"
    : "从左侧表格选择一个账号，右侧会显示更详细的账号画像。";

  const latestPaths = useMemo(() => [...contentState.paths].slice(-5).reverse(), [contentState.paths]);
  const latestProblems = useMemo(() => [...contentState.problems].slice(-6).reverse(), [contentState.problems]);
  const latestLessons = useMemo(() => [...contentState.lessons].slice(-6).reverse(), [contentState.lessons]);
  const userFilterLabel =
    userFilter === "active"
      ? "仅启用"
      : userFilter === "inactive"
        ? "仅禁用"
        : userFilter === "admin"
          ? "仅管理员"
          : "全部账号";
  const inactiveUsers = Math.max(overviewState.totalUsers - overviewState.activeUsers, 0);
  const beginnerProblems = contentState.problems.filter((problem) =>
    problem.difficulty.includes("Easy") ||
    problem.difficulty.includes("入门") ||
    problem.difficulty.includes("基础")
  ).length;
  const untaggedProblems = contentState.problems.filter((problem) => problem.tags.length === 0).length;
  const lessonsWithoutSnippet = contentState.lessons.filter(
    (lesson) => !lesson.snippet.trim()
  ).length;
  const pathsWithoutFocusTags = contentState.paths.filter((path) => path.focusTags.length === 0).length;
  const topContributor = [...items].sort((left, right) => right.submissionCount - left.submissionCount)[0];
  const recentActiveUsers = items.filter((user) => {
    if (!user.lastActiveAt) {
      return false;
    }

    const lastActiveTime = new Date(user.lastActiveAt).getTime();
    if (Number.isNaN(lastActiveTime)) {
      return false;
    }

    return Date.now() - lastActiveTime <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const actionFrequency = activityState.reduce<Record<string, number>>((result, item) => {
    result[item.action] = (result[item.action] ?? 0) + 1;
    return result;
  }, {});
  const hottestActionEntry = Object.entries(actionFrequency).sort((left, right) => right[1] - left[1])[0];
  const hottestActionLabel = hottestActionEntry
    ? `${formatActionLabel(hottestActionEntry[0])} × ${hottestActionEntry[1]}`
    : "暂无操作";
  const contentHealthItems = [
    {
      title: "未打标签题目",
      value: `${untaggedProblems}`,
      description: "题目没有标签会影响题库筛选和路径联动。"
    },
    {
      title: "缺代码片段课程",
      value: `${lessonsWithoutSnippet}`,
      description: "课程缺代码片段时，路径详情页的复盘价值会下降。"
    },
    {
      title: "缺焦点标签路径",
      value: `${pathsWithoutFocusTags}`,
      description: "路径缺焦点标签时，题库里的主线联动会变弱。"
    }
  ];
  const opsSignals = [
    {
      title: "近 7 天活跃用户",
      value: `${recentActiveUsers}`,
      description: "用于观察近期是否真的有人持续回到项目。"
    },
    {
      title: "最高提交用户",
      value: topContributor ? formatDisplayName(topContributor.name) : "暂无",
      description: topContributor ? `累计 ${topContributor.submissionCount} 次提交` : "还没有足够的用户行为数据。"
    },
    {
      title: "最近高频操作",
      value: hottestActionLabel,
      description: "可以帮助判断最近后台主要在维护账号还是在补内容。"
    }
  ];
  const overviewRiskItems = [
    {
      title: "禁用账号",
      value: `${inactiveUsers}`,
      description: "如果数量持续上升，说明账号策略或内容质量可能需要调整。"
    },
    {
      title: "入门题占比",
      value:
        overviewState.totalProblems === 0
          ? "0%"
          : `${Math.round((beginnerProblems / overviewState.totalProblems) * 100)}%`,
      description: "入门题太少会让新用户首次体验变差，太多又会影响后续进阶节奏。"
    }
  ];

  function focusWorkspace(
    nextWorkspace: AdminWorkspace,
    anchorId?: string,
    nextContentWorkspace?: ContentWorkspace,
    nextPathWorkspace?: PathWorkspace
  ) {
    setWorkspace(nextWorkspace);
    if (nextWorkspace === "content" && nextContentWorkspace) {
      setContentWorkspace(nextContentWorkspace);
    }
    if (nextWorkspace === "paths" && nextPathWorkspace) {
      setPathWorkspace(nextPathWorkspace);
    }

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        if (anchorId) {
          document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 80);
    }
  }

  const quickAccountActions = [
    {
      label: "查看禁用账号",
      description: `当前 ${inactiveUsers} 个`,
      onClick: () => {
        focusWorkspace("accounts", "accounts");
        setUserFilter("inactive");
        setUserQuery("");
        setUserPage(1);
      }
    },
    {
      label: "查看管理员",
      description: `当前 ${overviewState.adminUsers} 个`,
      onClick: () => {
        focusWorkspace("accounts", "accounts");
        setUserFilter("admin");
        setUserQuery("");
        setUserPage(1);
      }
    },
    {
      label: "恢复全部视图",
      description: "清空账号筛选",
      onClick: () => {
        focusWorkspace("accounts", "accounts");
        setUserFilter("all");
        setUserQuery("");
        setUserPage(1);
      }
    }
  ];
  const contentFocusActions = [
    {
      label: "去检查内容健康",
      description: "先看缺标签 / 缺代码片段 / 缺焦点标签",
      onClick: () => {
        focusWorkspace("content", "content-health", "health");
      }
    },
    {
      label: "去新增题目",
      description: "补练习最快的入口",
      onClick: () => {
        focusWorkspace("content", "create-problem", "problems");
      }
    },
    {
      label: "去新增路径",
      description: "补主线路线的入口",
      onClick: () => {
        focusWorkspace("paths", "path-planning", undefined, "planning");
      }
    }
  ];
  const priorityQueueItems =
    variant === "b"
      ? [
          {
            title: "先补缺标签题目",
            description: `当前还有 ${untaggedProblems} 道题没有标签，最先影响前台筛选与推荐联动。`
          },
          {
            title: "再补课程代码片段",
            description: `当前还有 ${lessonsWithoutSnippet} 节课缺代码片段，会削弱路径详情页的复盘质量。`
          },
          {
            title: "最后补路径焦点标签",
            description: `当前还有 ${pathsWithoutFocusTags} 条路径缺焦点标签，会降低主线题目命中率。`
          }
        ]
      : [
          {
            title: "先检查账号状态",
            description: `当前有 ${inactiveUsers} 个未启用账号，优先影响可用性与登录体验。`
          },
          {
            title: "再看最近运营动作",
            description: `后台最近累计 ${activityState.length} 条活动，适合先判断近期处理重心。`
          },
          {
            title: "最后再进入内容补齐",
            description: `当前有 ${untaggedProblems} 道题待补标签、${lessonsWithoutSnippet} 节课待补代码片段。`
          }
        ];
  const overviewSignalActions = [
    {
      label: "查看最近活动",
      description: `最近 ${activityState.length} 条后台操作`,
      onClick: () => {
        focusWorkspace("overview", "activity");
      }
    },
    {
      label: "查看运营信号",
      description: `近 7 天活跃 ${recentActiveUsers} 人`,
      onClick: () => {
        focusWorkspace("overview", "overview-signals");
      }
    },
    {
      label: "查看风险提醒",
      description: `当前 ${inactiveUsers} 个待关注账号`,
      onClick: () => {
        focusWorkspace("overview", "overview-risk");
      }
    }
  ];
  const overviewTaskFlowCatalog = {
    accounts: {
      key: "accounts",
      title: "先筛账号稳定性",
      description: "先确认谁无法正常学习、谁拥有高权限，再进入账号区做具体处理。",
      signal: `${inactiveUsers} 个待关注`,
      hint: `管理员 ${overviewState.adminUsers} 个 / 近 7 天活跃 ${recentActiveUsers} 个`,
      actionLabel: "执行",
      actions: quickAccountActions
    },
    content: {
      key: "content",
      title: "再补内容缺口",
      description: "账号稳定后再补标签、代码片段和路径主线，前台体验会更连贯。",
      signal: `${untaggedProblems + lessonsWithoutSnippet + pathsWithoutFocusTags} 项待补`,
      hint: `题目 ${untaggedProblems} / 课程 ${lessonsWithoutSnippet} / 路径 ${pathsWithoutFocusTags}`,
      actionLabel: "前往",
      actions: contentFocusActions
    },
    signals: {
      key: "signals",
      title: "最后回看运营动向",
      description: "把刚处理的动作和后台信号对照，避免多个方向同时偏离。",
      signal: hottestActionLabel,
      hint: `最近活动 ${activityState.length} 条 / 最高提交 ${topContributor ? formatDisplayName(topContributor.name) : "暂无"}`,
      actionLabel: "查看",
      actions: overviewSignalActions
    }
  } as const;
  const overviewTaskFlowOrder: Array<keyof typeof overviewTaskFlowCatalog> =
    variant === "b" ? ["content", "accounts", "signals"] : ["accounts", "content", "signals"];
  const overviewTaskFlows = overviewTaskFlowOrder.map((key, index) => ({
    ...overviewTaskFlowCatalog[key],
    eyebrow: `第 ${index + 1} 步`
  }));
  const overviewSummaryCards = [
    {
      key: "total-users",
      eyebrow: "核心指标",
      title: "用户总数",
      value: String(overviewState.totalUsers),
      description: "当前平台已经注册的账号总量。",
      badge: "账号规模",
      emphasis: "standard" as const
    },
    {
      key: "active-users",
      eyebrow: "核心指标",
      title: "活跃账号",
      value: String(overviewState.activeUsers),
      description: `当前启用账号占比约为 ${activeRate}。`,
      badge: "可用状态",
      emphasis: "standard" as const
    },
    {
      key: "total-submissions",
      eyebrow: "核心指标",
      title: "累计提交",
      value: String(overviewState.totalSubmissions),
      description: `所有用户累计提交的记录数，当前通过率 ${acceptanceRate}。`,
      badge: "判题数据",
      emphasis: "standard" as const
    },
    {
      key: "content-scale",
      eyebrow: "核心指标",
      title: "内容规模",
      value: `${overviewState.totalPaths} / ${overviewState.totalLessons} / ${overviewState.totalProblems}`,
      description: "路径、课程和题目的总规模概览。",
      badge: "路径 / 课程 / 题目",
      emphasis: "standard" as const
    },
    {
      key: "active-rate",
      eyebrow: "平台洞察",
      title: "账号活跃度",
      value: activeRate,
      description: "按当前启用账号占比估算平台可服务的学习用户。",
      badge: "活跃信号",
      emphasis: "focus" as const
    },
    {
      key: "acceptance-rate",
      eyebrow: "平台洞察",
      title: "判题通过率",
      value: acceptanceRate,
      description: "统计全部提交里结果为通过的占比。",
      badge: "结果质量",
      emphasis: "focus" as const
    },
    {
      key: "admin-users",
      eyebrow: "平台洞察",
      title: "管理员账号",
      value: String(overviewState.adminUsers),
      description: "建议只保留极少数管理账号，减少误操作范围。",
      badge: "权限控制",
      emphasis: "focus" as const
    }
  ];
  const draftLessonCount = pathForm.modules.reduce((count, module) => count + module.lessons.length, 0);
  const availableProblemReference = contentState.problems.slice(0, 12);
  const problemPublishingChecklist = [
    "唯一标识尽量短且稳定，避免后续改动影响题目链接。",
    "标签至少补齐一个知识点，方便题库筛选和路径推荐。",
    "示例输入输出尽量覆盖边界，降低首次提交失败的挫败感。"
  ];
  const pathPublishingChecklist = [
    "路径标题、副标题和主题最好一起填写，前台识别度更高。",
    "模块奖励与关底任务会直接影响整条主线的推进感。",
    "推荐题目标识只填已存在题目，避免前台出现空链接。"
  ];
  const pathDraftOutline = useMemo(
    () =>
      pathForm.modules.map((module, index) => {
        const readyLessons = module.lessons.filter(
          (lesson) => countCompletedLessonFields(lesson) >= 5
        ).length;
        const missingObjective = module.lessons.filter((lesson) => !lesson.objective.trim()).length;
        const missingTags = module.lessons.filter((lesson) => !lesson.contentTags.trim()).length;
        const missingSnippet = module.lessons.filter((lesson) => !lesson.snippet.trim()).length;

        return {
          anchor: `module-draft-${index + 1}`,
          label: module.title.trim() || `模块 ${index + 1}`,
          lessonCount: module.lessons.length,
          readyLessons,
          missingObjective,
          missingTags,
          missingSnippet,
          isUntitled: !module.title.trim()
        };
      }),
    [pathForm.modules]
  );
  const unnamedModules = pathDraftOutline.filter((module) => module.isUntitled).length;
  const lessonsWithoutObjectiveDraft = pathDraftOutline.reduce(
    (count, module) => count + module.missingObjective,
    0
  );
  const lessonsWithoutTagsDraft = pathDraftOutline.reduce(
    (count, module) => count + module.missingTags,
    0
  );
  const lessonsReadyForPublish = pathDraftOutline.reduce(
    (count, module) => count + module.readyLessons,
    0
  );
  const accountQuickFilters = [
    {
      key: "all",
      label: "全部账号",
      description: `共 ${overviewState.totalUsers} 个`,
      onClick: () => {
        setUserFilter("all");
        setUserQuery("");
        setUserPage(1);
      }
    },
    {
      key: "active",
      label: "已启用",
      description: `${overviewState.activeUsers} 个可用`,
      onClick: () => {
        setUserFilter("active");
        setUserQuery("");
        setUserPage(1);
      }
    },
    {
      key: "inactive",
      label: "已禁用",
      description: `${inactiveUsers} 个待关注`,
      onClick: () => {
        setUserFilter("inactive");
        setUserQuery("");
        setUserPage(1);
      }
    },
    {
      key: "admin",
      label: "管理员",
      description: `${overviewState.adminUsers} 个高权限`,
      onClick: () => {
        setUserFilter("admin");
        setUserQuery("");
        setUserPage(1);
      }
    }
  ];
  const workspaceTabs: Array<{
    key: AdminWorkspace;
    label: string;
    title: string;
    description: string;
    stat: string;
    anchorId?: string;
  }> = [
    {
      key: "overview",
      label: "总览",
      title: "看整体信号",
      description: "先看活跃、风险和最近处理方向。",
      stat: `${activityState.length} 条动态`
    },
    {
      key: "accounts",
      label: "账号",
      title: "管用户状态",
      description: "筛查启用状态、查看详情和处理异常账号。",
      stat: `${overviewState.totalUsers} 个账号`,
      anchorId: "accounts"
    },
    {
      key: "content",
      label: "内容",
      title: "补题目内容",
      description: "查看内容健康、删除旧内容和新增题目。",
      stat: `${overviewState.totalProblems} 题 / ${overviewState.totalLessons} 课`,
      anchorId: contentWorkspace === "health" ? "content-health" : "content-catalog"
    },
    {
      key: "paths",
      label: "路径",
      title: "编排课程主线",
      description: "集中处理路径结构、模块和课程草稿。",
      stat: `${overviewState.totalPaths} 条路径`,
      anchorId: pathWorkspace === "planning" ? "path-planning" : "path-modules"
    }
  ];
  const activeWorkspaceMeta = workspaceTabs.find((item) => item.key === workspace) ?? workspaceTabs[0];
  const contentWorkspaceTabs: Array<{
    key: ContentWorkspace;
    label: string;
    title: string;
    description: string;
    stat: string;
    anchorId: string;
  }> = [
    {
      key: "health",
      label: "内容健康",
      title: "先看缺口",
      description: "先检查标签、代码片段和路径焦点是否完整，避免前台筛选和学习主线出现断层。",
      stat: `${untaggedProblems + lessonsWithoutSnippet + pathsWithoutFocusTags} 项提醒`,
      anchorId: "content-health"
    },
    {
      key: "problems",
      label: "题目管理",
      title: "再处理题目",
      description: "集中查看最新路径、最新题目、删除动作和新增题目入口，适合连贯补内容。",
      stat: `${overviewState.totalProblems} 题 / ${latestPaths.length} 条路径`,
      anchorId: "content-catalog"
    }
  ];
  const activeContentWorkspaceMeta =
    contentWorkspaceTabs.find((item) => item.key === contentWorkspace) ?? contentWorkspaceTabs[0];
  const pathWorkspaceTabs: Array<{
    key: PathWorkspace;
    label: string;
    title: string;
    description: string;
    stat: string;
    anchorId: string;
  }> = [
    {
      key: "planning",
      label: "路径信息",
      title: "先定主线",
      description: "先补路径标题、焦点标签、关底任务和推荐题，让这条学习主线先有完整轮廓。",
      stat: `${pathForm.modules.length} 个模块草稿`,
      anchorId: "path-planning"
    },
    {
      key: "modules",
      label: "模块编排",
      title: "再排课程节奏",
      description: "集中处理模块导航、课程结构与发布检查，适合连续补完一整条路径。",
      stat: `${draftLessonCount} 节课程草稿`,
      anchorId: "path-modules"
    }
  ];
  const activePathWorkspaceMeta =
    pathWorkspaceTabs.find((item) => item.key === pathWorkspace) ?? pathWorkspaceTabs[0];

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
      setMessage(`${formatDisplayName(user.name)} 已${user.isActive ? "禁用" : "启用"}。`);
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
    <div className="space-y-8">
      <section className="panel-shell hero-orbit rounded-[36px] px-6 py-7 sm:px-8">
                <div className="grid gap-5 xl:grid-cols-2">
          <div>
            <p className="section-heading__badge">控制总览</p>
            <h2 className="mt-5 editorial-title text-[clamp(2.1rem,3.7vw,3.4rem)] leading-[0.98] text-white">
              管理台把账号、内容与运营反馈压缩进同一块控制面板
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-300 sm:text-base">
              下面这组区块会同时给出用户活跃度、判题效果、内容规模和最近改动，方便你快速判断现在该优先修哪一块。
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="nav-pill nav-pill--accent px-4 py-2 text-sm font-medium">
                活跃率 {activeRate}
              </span>
              <span className="nav-pill nav-pill--success px-4 py-2 text-sm font-medium">
                通过率 {acceptanceRate}
              </span>
              <span className="nav-pill px-4 py-2 text-sm font-medium">
                最近活动 {activityState.length} 条
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="admin-subcard p-4">
              <p className="soft-kicker">用户状态</p>
              <p className="mt-3 text-xl font-semibold text-white">
                {overviewState.activeUsers}/{overviewState.totalUsers} 已启用
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">后台可直接筛选、禁用或恢复普通账号。</p>
            </div>
            <div className="admin-subcard p-4">
              <p className="soft-kicker">内容规模</p>
              <p className="mt-3 text-xl font-semibold text-white">
                {overviewState.totalPaths} 路径 / {overviewState.totalProblems} 题
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">新内容发布后会立即出现在公开前台。</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel-shell rounded-[36px] px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-heading__badge">工作区切换</p>
            <h2 className="mt-4 editorial-title text-3xl text-white">把后台切成四个更清爽的处理区</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              当前工作区只展示一类任务，减少同屏信息量，让你先处理最重要的那一块。
            </p>
          </div>

          <div className="admin-subcard rounded-[24px] px-4 py-4">
            <p className="soft-kicker">当前工作区</p>
            <p className="mt-2 text-[1.15rem] font-semibold text-white">
              {activeWorkspaceMeta.label} · {activeWorkspaceMeta.title}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-300">{activeWorkspaceMeta.description}</p>
            <span className="mt-3 inline-flex admin-chip admin-chip--soft">{activeWorkspaceMeta.stat}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {workspaceTabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                focusWorkspace(item.key, item.anchorId);
              }}
              className={`admin-choice-card p-4 text-left ${workspace === item.key ? "admin-choice-card--active" : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="admin-chip admin-chip--muted">{item.label}</span>
                <span className="text-sm font-medium text-slate-300">{item.stat}</span>
              </div>
              <p className="mt-4 text-[1.05rem] font-semibold text-white">{item.title}</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">{item.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className={workspace === "overview" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-4" : "hidden"}>
        {overviewSummaryCards.map((card) => (
          <OverviewSummaryCard
            key={card.key}
            eyebrow={card.eyebrow}
            title={card.title}
            value={card.value}
            description={card.description}
            badge={card.badge}
            emphasis={card.emphasis}
          />
        ))}
      </section>

      <section
        id="overview-signals"
        className={
          workspace === "overview"
            ? "grid gap-4"
            : "hidden"
        }
      >
        <div className="panel-shell rounded-[36px] px-6 py-7 sm:px-8">
          <p className="section-heading__badge">平台概览</p>
          <h2 className="mt-4 editorial-title text-3xl text-white">把运营信号和风险提醒放进同一组卡片</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            先看平台在发生什么，再看哪些地方需要优先介入。两类信息放在同一组里，更适合快速扫一眼后立即行动。
          </p>

          <div className="mt-6 space-y-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="soft-kicker">运营信号</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    用来判断平台当前更像是在内容建设期还是用户增长期。
                  </p>
                </div>
                <span className="admin-chip admin-chip--soft">{activityState.length} 条动态</span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {opsSignals.map((item) => (
                  <div key={item.title} className="admin-subcard admin-overview-signal-card p-4">
                    <p className="soft-kicker">{item.title}</p>
                    <p className="mt-3 text-xl font-semibold text-white">{item.value}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div id="overview-risk">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="soft-kicker">风险提醒</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    这几项最容易直接影响学习体验，适合优先处理。
                  </p>
                </div>
                <span className="admin-chip admin-chip--muted">{inactiveUsers} 个待关注账号</span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {overviewRiskItems.map((item) => (
                  <div key={item.title} className="admin-subcard admin-overview-risk-card p-4">
                    <p className="soft-kicker">{item.title}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className={
          workspace === "content"
                          ? "grid gap-4 xl:grid-cols-2"
            : "hidden"
        }
      >
        <div className="panel-shell rounded-[36px] px-6 py-7 sm:px-8 xl:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-heading__badge">内容子页</p>
              <h2 className="mt-4 editorial-title text-3xl text-white">把内容区再拆成检查和管理两块</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                先决定现在是要排查内容缺口，还是要连续处理题目和路径，避免两类任务混在一起。
              </p>
            </div>

            <div className="admin-subcard rounded-[24px] px-4 py-4">
              <p className="soft-kicker">当前内容子页</p>
              <p className="mt-2 text-[1.15rem] font-semibold text-white">
                {activeContentWorkspaceMeta.label} · {activeContentWorkspaceMeta.title}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                {activeContentWorkspaceMeta.description}
              </p>
              <span className="mt-3 inline-flex admin-chip admin-chip--soft">
                {activeContentWorkspaceMeta.stat}
              </span>
            </div>
          </div>

          <div className="admin-filter-grid mt-6">
            {contentWorkspaceTabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  focusWorkspace("content", item.anchorId, item.key);
                }}
                className={`admin-segment-button ${
                  contentWorkspace === item.key ? "admin-segment-button--active" : ""
                }`}
              >
                <span className="admin-segment-button__title">{item.label}</span>
                <span className="admin-segment-button__description">{item.description}</span>
                <span className="mt-1 text-xs tracking-[0.08em] text-slate-400">{item.stat}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          id="content-health"
          className={contentWorkspace === "health" ? "panel-shell rounded-[36px] px-6 py-7 sm:px-8" : "hidden"}
        >
              <p className="section-heading__badge">内容健康</p>
          <h2 className="mt-4 editorial-title text-3xl text-white">内容健康检查</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            这块不是编辑入口，而是告诉你现有内容是否足够完整。标签、代码片段和路径焦点缺失，都会直接影响前台体验。
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {contentHealthItems.map((item) => (
              <div key={item.title} className="admin-subcard p-4">
                <p className="soft-kicker">{item.title}</p>
                <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={contentWorkspace === "health" ? "panel-shell rounded-[36px] px-6 py-7 sm:px-8" : "hidden"}>
          <p className="section-heading__badge">发布提示</p>
          <h2 className="mt-4 editorial-title text-3xl text-white">发布检查建议</h2>
          <div className="mt-6 space-y-3">
            {[
              "新增题目前先确认唯一标识、标签和路径推荐关系，否则前台搜索与主线联动会变弱。",
              "新增课程路径时优先补焦点标签和关底任务，这两项最影响路径页的辨识度。",
              "删除内容前先看最近后台操作，避免多个管理员同时处理同一批数据。"
            ].map((item, index) => (
              <div
                key={item}
                className="admin-subcard flex gap-3 px-4 py-4"
              >
                <div className="admin-step-badge">
                  {index + 1}
                </div>
                <p className="flex-1 text-sm leading-7 text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className={
          workspace === "overview"
                          ? "grid gap-4 xl:grid-cols-2"
            : "hidden"
        }
      >
        <div className="panel-shell rounded-[36px] px-6 py-7 sm:px-8">
          <p className="section-heading__badge">今日处理顺序</p>
          <h2 className="mt-4 editorial-title text-3xl text-white">
            {variant === "b" ? "按“内容 → 账号 → 复盘”走一遍今天的后台安排" : "按“账号 → 内容 → 复盘”走一遍今天的后台安排"}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            {variant === "b"
              ? "如果今天重点在补充课程和题目，可以先处理内容，再回看账号与活动状态。"
              : "如果今天重点在稳定可用性，可以先检查账号与活动，再进入内容补充。"}
          </p>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {overviewTaskFlows.map((flow) => (
              <OverviewTaskFlowCard
                key={flow.key}
                eyebrow={flow.eyebrow}
                title={flow.title}
                description={flow.description}
                signal={flow.signal}
                hint={flow.hint}
                actionLabel={flow.actionLabel}
                actions={flow.actions}
              />
            ))}
          </div>
        </div>

        <div className="panel-shell rounded-[36px] px-6 py-7 sm:px-8">
          <p className="section-heading__badge">今日建议</p>
          <h2 className="mt-4 editorial-title text-3xl text-white">
            {variant === "b" ? "建议先补内容，再回看账号与活动" : "如果只做一轮，就按这个顺序处理"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            {variant === "b"
              ? "先处理最影响前台学习体验的内容缺口，再回头检查账号与活动状态。"
              : "先看账号可用性，再看活动信号，最后进入内容补齐。"}
          </p>
          <div className="mt-6 space-y-3">
            {priorityQueueItems.map((item, index) => (
              <div
                key={item.title}
                className="admin-subcard flex gap-3 px-4 py-4"
              >
                <div className="admin-step-badge">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {message ? (
        <div className="admin-inline-note admin-inline-note--success px-5 py-4 text-sm text-slate-100">
          <p className="soft-kicker text-slate-300">操作反馈</p>
          <p className="mt-2 leading-7">{message}</p>
        </div>
      ) : null}
      {error ? (
        <div className="admin-inline-note admin-inline-note--danger px-5 py-4 text-sm text-slate-100">
          <p className="soft-kicker text-slate-300">错误提示</p>
          <p className="mt-2 leading-7">{error}</p>
        </div>
      ) : null}

      <section
        id="accounts"
        className={workspace === "accounts" ? "panel-shell hero-orbit rounded-[36px] px-6 py-7 sm:px-8" : "hidden"}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-heading__badge">账号</p>
            <h2 className="mt-4 editorial-title text-3xl text-white">用户账号管理</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              支持搜索、筛选账号状态，并对普通用户执行启用或禁用操作。
            </p>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search-shell">
              <input
                value={userQuery}
                onChange={(event) => {
                  setUserQuery(event.target.value);
                  setUserPage(1);
                }}
                placeholder="搜索姓名 / 邮箱 / 角色 / 状态"
                className="field-surface admin-field min-w-[240px]"
              />
              {userQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setUserQuery("");
                    setUserPage(1);
                  }}
                  className="admin-toolbar-button"
                >
                  清空搜索
                </button>
              ) : null}
            </div>
            <select
              value={userFilter}
              onChange={(event) => {
                setUserFilter(event.target.value as "all" | "active" | "inactive" | "admin");
                setUserPage(1);
              }}
              className="field-surface admin-field"
            >
              <option value="all">全部账号</option>
              <option value="active">仅启用</option>
              <option value="inactive">仅禁用</option>
              <option value="admin">仅管理员</option>
            </select>
            <select
              value={userSort}
              onChange={(event) => {
                setUserSort(event.target.value as "recent" | "name" | "submissions" | "accepted");
                setUserPage(1);
              }}
              className="field-surface admin-field"
            >
              <option value="recent">按最近活跃排序</option>
              <option value="submissions">按提交次数排序</option>
              <option value="accepted">按通过次数排序</option>
              <option value="name">按姓名排序</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <div className="admin-chip admin-chip--muted px-4 py-2 text-sm tracking-[0.08em] text-slate-200">
            当前筛选：{userFilterLabel}
          </div>
          <div className="admin-chip admin-chip--soft px-4 py-2 text-sm tracking-[0.08em] text-slate-200">
            命中账号：{filteredUsers.length}
          </div>
          {userQuery ? (
            <div className="admin-chip admin-chip--muted px-4 py-2 text-sm tracking-[0.08em] text-slate-200">
              搜索关键词：{userQuery}
            </div>
          ) : null}
        </div>

        <div className="admin-filter-grid mt-6">
          {accountQuickFilters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className={`admin-segment-button ${
                userFilter === item.key && !userQuery ? "admin-segment-button--active" : ""
              }`}
            >
              <span className="admin-segment-button__title">{item.label}</span>
              <span className="admin-segment-button__description">{item.description}</span>
            </button>
          ))}
        </div>

        <div className="admin-reference-grid mt-6">
          <ReferenceCard
            label="待关注账号"
            value={`${inactiveUsers}`}
            hint="优先检查长期禁用账号，避免影响正常登录。"
          />
          <ReferenceCard
            label="管理员账号"
            value={`${overviewState.adminUsers}`}
            hint="建议保持少量管理员，减少误操作范围。"
          />
          <ReferenceCard
            label="近 7 天活跃"
            value={`${recentActiveUsers}`}
            hint="能快速判断平台近期是否有人持续回来练习。"
          />
        </div>

        <div className="admin-accounts-layout mt-6">
          <div className="space-y-6">
            <div className="admin-control-strip">
              <div className="admin-table-summary">
                {sortedUsers.length === 0
                  ? "当前没有可展示账号。"
                  : `当前显示第 ${userPageStart} - ${userPageEnd} 个，共 ${sortedUsers.length} 个账号`}
              </div>
              <div className="admin-chip admin-chip--muted px-4 py-2 text-sm tracking-[0.08em] text-slate-200">
                排序方式：{
                  userSort === "recent"
                    ? "最近活跃"
                    : userSort === "submissions"
                      ? "提交次数"
                      : userSort === "accepted"
                        ? "通过次数"
                        : "姓名"
                }
              </div>
            </div>

            <div className="admin-table-shell">
              <div className="admin-table-scroll">
                <table className="admin-table text-left">
                  <thead>
                    <tr>
                      <th className="admin-table__head">用户</th>
                      <th className="admin-table__head">角色</th>
                      <th className="admin-table__head">状态</th>
                      <th className="admin-table__head">提交</th>
                      <th className="admin-table__head">通过</th>
                      <th className="admin-table__head">最近活跃</th>
                      <th className="admin-table__head">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.length === 0 ? (
                      <tr className="admin-table__row">
                        <td colSpan={7} className="admin-table__empty">
                          当前筛选下没有账号，试试清空关键词或切换筛选条件。
                        </td>
                      </tr>
                    ) : null}
                    {paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={`admin-table__row ${
                          selectedUser?.id === user.id ? "admin-table__row--active" : ""
                        }`}
                      >
                        <td className="admin-table__cell">
                          <div>
                            <p className="font-medium text-white">{formatDisplayName(user.name)}</p>
                            <p className="admin-table__meta">{user.email}</p>
                          </div>
                        </td>
                        <td className="admin-table__cell">
                          <span className="admin-chip admin-chip--muted">
                            {getUserRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="admin-table__cell">
                          <span
                            className={`admin-chip ${
                              user.isActive
                                ? "admin-chip--soft"
                                : "admin-chip--danger"
                            }`}
                          >
                            {getUserStatusLabel(user.isActive)}
                          </span>
                        </td>
                        <td className="admin-table__cell">{user.submissionCount}</td>
                        <td className="admin-table__cell">{user.acceptedCount}</td>
                        <td className="admin-table__cell">
                          {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString("zh-CN") : "暂无"}
                        </td>
                        <td className="admin-table__cell">
                          <div className="admin-table__actions">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserId(user.id);
                              }}
                              className={`admin-action-button px-4 py-2 text-[13px] ${
                                selectedUser?.id === user.id ? "admin-action-button--soft" : ""
                              }`}
                            >
                              {selectedUser?.id === user.id ? "已展开" : "查看详情"}
                            </button>
                            {user.role === "admin" ? (
                              <span className="admin-table__meta">管理员账号不可在这里禁用</span>
                            ) : (
                              <button
                                type="button"
                                disabled={busyUserId === user.id}
                                onClick={() => {
                                  void toggleUser(user);
                                }}
                                className="admin-action-button px-4 py-2 text-[13px] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {busyUserId === user.id ? "处理中..." : user.isActive ? "禁用账号" : "启用账号"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-pagination">
              <button
                type="button"
                disabled={currentUserPage <= 1}
                onClick={() => {
                  setUserPage((current) => Math.max(1, current - 1));
                }}
                className="admin-page-button disabled:cursor-not-allowed disabled:opacity-50"
              >
                上一页
              </button>
              <div className="admin-page-indicator">
                第 {currentUserPage} / {totalUserPages} 页
              </div>
              <button
                type="button"
                disabled={currentUserPage >= totalUserPages}
                onClick={() => {
                  setUserPage((current) => Math.min(totalUserPages, current + 1));
                }}
                className="admin-page-button disabled:cursor-not-allowed disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>

          <aside className="admin-account-drawer">
            {selectedUser ? (
              <>
                <div className="admin-account-drawer__header">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="section-heading__badge">账号详情抽屉</p>
                    <span
                      className={`admin-chip ${
                        selectedUser.isActive ? "admin-chip--soft" : "admin-chip--danger"
                      }`}
                    >
                      {getUserStatusLabel(selectedUser.isActive)}
                    </span>
                  </div>
                  <div className="mt-5">
                    <h3 className="text-[1.75rem] font-semibold leading-[1.16] text-white">
                      {formatDisplayName(selectedUser.name)}
                    </h3>
                    <p className="mt-2 text-[15px] leading-7 text-slate-300">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="admin-account-drawer__metrics">
                  <DrawerMetric label="角色" value={getUserRoleLabel(selectedUser.role)} />
                  <DrawerMetric label="提交次数" value={`${selectedUser.submissionCount}`} />
                  <DrawerMetric label="通过次数" value={`${selectedUser.acceptedCount}`} />
                  <DrawerMetric label="通过率" value={selectedUserAcceptedRate} />
                </div>

                <div className="admin-account-drawer__panel">
                  <p className="soft-kicker">账号观察</p>
                  <p className="mt-3 text-[15px] leading-8 text-slate-200">{selectedUserHint}</p>
                </div>

                <div className="admin-account-drawer__panel">
                  <p className="soft-kicker">时间轴</p>
                  <div className="mt-4 space-y-3">
                    <DrawerInfoRow
                      label="注册时间"
                      value={new Date(selectedUser.createdAt).toLocaleString("zh-CN")}
                    />
                    <DrawerInfoRow
                      label="最近活跃"
                      value={
                        selectedUser.lastActiveAt
                          ? new Date(selectedUser.lastActiveAt).toLocaleString("zh-CN")
                          : "暂无记录"
                      }
                    />
                    <DrawerInfoRow
                      label="活跃判断"
                      value={formatRelativeActivity(selectedUser.lastActiveAt)}
                    />
                  </div>
                </div>

                <div className="admin-account-drawer__panel">
                  <p className="soft-kicker">快捷动作</p>
                  <div className="admin-account-drawer__actions mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setUserQuery(selectedUser.email);
                        setUserPage(1);
                      }}
                      className="admin-action-button admin-action-button--soft px-4 py-2 text-[13px]"
                    >
                      按邮箱筛选
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserFilter(selectedUser.role === "admin" ? "admin" : "all");
                        setUserPage(1);
                      }}
                      className="admin-action-button px-4 py-2 text-[13px]"
                    >
                      聚焦同类账号
                    </button>
                    {selectedUser.role !== "admin" ? (
                      <button
                        type="button"
                        disabled={busyUserId === selectedUser.id}
                        onClick={() => {
                          void toggleUser(selectedUser);
                        }}
                        className={`admin-action-button px-4 py-2 text-[13px] ${
                          selectedUser.isActive
                            ? "admin-action-button--danger"
                            : "admin-action-button--primary"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {busyUserId === selectedUser.id
                          ? "处理中..."
                          : selectedUser.isActive
                            ? "立即禁用"
                            : "恢复启用"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="admin-account-drawer__empty">
                从左侧账号表里选择一个用户，这里会显示更详细的账号信息。
              </div>
            )}
          </aside>
        </div>
      </section>

      <section
        id="content-catalog"
        className={workspace === "content" && contentWorkspace === "problems" ? "grid gap-4 xl:grid-cols-3" : "hidden"}
      >
        <ContentListCard
          eyebrow="路径"
          title="现有路径"
          description="最新发布的课程路径会立即显示在公开学习地图中。"
          items={latestPaths.map((path) => ({
            key: path.slug,
            title: formatLearningTitle(path.title),
            meta: `${formatLearningTitle(path.subtitle)} · ${path.slug}`,
            badge: `${path.lessonCount} 节课 / ${path.estimatedHours} 小时`
          }))}
        />
        <ContentListCard
          eyebrow="题目"
          title="最新题目"
          description="新增题目可立即出现在题库页，并可关联到新的课程路径。"
          items={latestProblems.map((problem) => ({
            key: problem.slug,
            title: formatLearningTitle(problem.title),
            meta: `${formatProblemTypeLabel(problem.type)} · ${problem.slug}`,
            badge: formatProblemDifficultyLabel(problem.difficulty)
          }))}
        />
        <ContentListCard
          eyebrow="课程"
          title="最新课程"
          description="路径中嵌入的课程会自动计入课程总数和首页推荐池。"
          items={latestLessons.map((lesson) => ({
            key: lesson.id,
            title: formatLearningTitle(lesson.title),
            meta: `${formatLearningTitle(lesson.module)} · ${lesson.id}`,
            badge: formatProblemDifficultyLabel(lesson.difficulty)
          }))}
        />
      </section>

      <section
        className={workspace === "content" && contentWorkspace === "problems" ? "grid gap-4 xl:grid-cols-2" : "hidden"}
      >
        <AdminActionListCard
                eyebrow="删除内容"
          title="删除课程路径"
          description="删除后路径会从公开学习地图消失，首页统计会同步更新。"
          items={latestPaths.map((path) => ({
            key: path.slug,
            title: formatLearningTitle(path.title),
            subtitle: path.slug,
            busy: busyDeleteKey === `path:${path.slug}`,
            onDelete: () => {
              void deletePath(path.slug);
            }
          }))}
        />
        <AdminActionListCard
                eyebrow="删除内容"
          title="删除题目"
          description="删除后题目会从题库列表隐藏，并从课程推荐题目中移除。"
          items={latestProblems.map((problem) => ({
            key: problem.slug,
            title: formatLearningTitle(problem.title),
            subtitle: problem.slug,
            busy: busyDeleteKey === `problem:${problem.slug}`,
            onDelete: () => {
              void deleteProblem(problem.slug);
            }
          }))}
        />
      </section>

      <section id="activity" className={workspace === "overview" ? "panel-shell rounded-[36px] px-6 py-7 sm:px-8" : "hidden"}>
              <p className="section-heading__badge">最近活动</p>
        <h2 className="mt-4 editorial-title text-3xl text-white">最近后台操作</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          保留最近 20 条管理员行为，方便回查谁在什么时候修改了账号或内容。
        </p>

        <div className="mt-6 space-y-3">
          {activityState.length === 0 ? (
            <div className="admin-subcard admin-subcard--muted px-4 py-3 text-sm text-slate-400">
              暂无后台操作记录
            </div>
          ) : null}
          {activityState.map((item) => (
            <div
              key={`${item.id}-${item.createdAt}`}
              className="admin-activity-card"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="admin-chip admin-chip--soft">{formatActionLabel(item.action)}</span>
                  <span className="admin-chip admin-chip--muted">{formatTargetLabel(item.targetType)}</span>
                  <span className="admin-chip admin-chip--muted">{item.targetKey}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">
                    {formatAdminActivityDetail(item.action, item.detail)}
                  </p>
                  <p className="admin-activity-card__meta">
                    {formatDisplayName(item.actorName)}（{item.actorEmail}）
                  </p>
                </div>
              </div>
              <p className="admin-activity-card__time">
                {new Date(item.createdAt).toLocaleString("zh-CN")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        className={
          workspace === "paths" || (workspace === "content" && contentWorkspace === "problems")
            ? "grid gap-6"
            : "hidden"
        }
      >
        <div className={workspace === "paths" ? "panel-shell rounded-[36px] px-6 py-7 sm:px-8" : "hidden"}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-heading__badge">路径子页</p>
              <h2 className="mt-4 editorial-title text-3xl text-white">把路径区拆成规划和编排两步</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                先把主线故事和推荐关系定清楚，再进入模块与课程编排，能减少来回滚动和信息混杂。
              </p>
            </div>

            <div className="admin-subcard rounded-[24px] px-4 py-4">
              <p className="soft-kicker">当前路径子页</p>
              <p className="mt-2 text-[1.15rem] font-semibold text-white">
                {activePathWorkspaceMeta.label} · {activePathWorkspaceMeta.title}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">{activePathWorkspaceMeta.description}</p>
              <span className="mt-3 inline-flex admin-chip admin-chip--soft">
                {activePathWorkspaceMeta.stat}
              </span>
            </div>
          </div>

          <div className="admin-filter-grid mt-6">
            {pathWorkspaceTabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  focusWorkspace("paths", item.anchorId, undefined, item.key);
                }}
                className={`admin-segment-button ${
                  pathWorkspace === item.key ? "admin-segment-button--active" : ""
                }`}
              >
                <span className="admin-segment-button__title">{item.label}</span>
                <span className="admin-segment-button__description">{item.description}</span>
                <span className="mt-1 text-xs tracking-[0.08em] text-slate-400">{item.stat}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          id="create-problem"
          className={
            workspace === "content" && contentWorkspace === "problems"
              ? "panel-shell rounded-[36px] px-6 py-7 sm:px-8"
              : "hidden"
          }
        >
          <div>
            <p className="section-heading__badge">新增题目</p>
            <h2 className="mt-4 editorial-title text-3xl text-white">新增题目</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              适合补齐题库练习。标签用英文逗号分隔，提示与验收规则按行填写。
            </p>
          </div>

          <div className="admin-reference-grid mt-6">
            <ReferenceCard
              label="当前题库"
              value={`${overviewState.totalProblems}`}
              hint="新增后会立即进入题库列表与推荐池。"
            />
            <ReferenceCard
              label="入门题占比"
              value={
                overviewState.totalProblems === 0
                  ? "0%"
                  : `${Math.round((beginnerProblems / overviewState.totalProblems) * 100)}%`
              }
              hint="保持足够的入门题，首次体验会更平滑。"
            />
            <ReferenceCard
              label="无标签题目"
              value={`${untaggedProblems}`}
              hint="发布前顺手补标签，能减少后续整理成本。"
            />
          </div>

          <div className="mt-6 space-y-5">
            <div className="admin-form-section">
              <div className="admin-form-section__header">
                <div>
                  <p className="admin-form-section__title">基础信息</p>
                  <p className="admin-form-section__description">先建立题目身份、难度和类型，后续字段会更顺手。</p>
                </div>
                <span className="admin-chip admin-chip--muted">第一步</span>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field
                  label="题目唯一标识"
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
                  options={["简单", "中等", "困难"]}
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
            </div>

            <div className="admin-form-section">
              <div className="admin-form-section__header">
                <div>
                  <p className="admin-form-section__title">内容主体</p>
                  <p className="admin-form-section__description">把任务目标、题面和起始代码整理完整，前台体验会更稳定。</p>
                </div>
                <span className="admin-chip admin-chip--muted">第二步</span>
              </div>
              <div className="mt-5 space-y-4">
                <Field
                  label="标签"
                  value={problemForm.tags}
                  placeholder="例如：数组、排序、字符串"
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
              </div>
            </div>

            <div className="admin-form-section">
              <div className="admin-form-section__header">
                <div>
                  <p className="admin-form-section__title">提示与示例</p>
                  <p className="admin-form-section__description">发布前补齐提示、验收与示例，能明显降低用户卡住的概率。</p>
                </div>
                <span className="admin-chip admin-chip--muted">第三步</span>
              </div>
              <div className="mt-5 space-y-4">
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
            </div>

            <div className="admin-inline-note admin-inline-note--success px-5 py-4 text-sm text-slate-100">
              <p className="soft-kicker text-slate-300">发布前检查</p>
              <div className="admin-reference-tags mt-3">
                {problemPublishingChecklist.map((item) => (
                  <span key={item} className="admin-reference-tag">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setProblemForm(defaultProblemForm());
              }}
              className="admin-action-button px-4 py-2"
            >
              重置
            </button>
            <button
              type="button"
              disabled={savingProblem}
              onClick={() => {
                void submitProblem();
              }}
              className="admin-action-button admin-action-button--primary px-5 py-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProblem ? "创建中..." : "发布题目"}
            </button>
          </div>
        </div>

        <div
          id="path-planning"
          className={workspace === "paths" ? "panel-shell rounded-[36px] px-6 py-7 sm:px-8" : "hidden"}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-heading__badge">新增路径</p>
              <h2 className="mt-4 editorial-title text-3xl text-white">新增课程路径</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                路径支持动态添加模块和课程。推荐题目填写已存在题目的标识，多个值用英文逗号分隔。
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (pathWorkspace === "planning") {
                  focusWorkspace("paths", "path-modules", undefined, "modules");
                  return;
                }

                addModule();
              }}
              className="admin-action-button px-4 py-2"
            >
              {pathWorkspace === "planning" ? "去模块编排" : "添加模块"}
            </button>
          </div>

          <div className={pathWorkspace === "planning" ? "admin-reference-grid mt-6" : "hidden"}>
            <ReferenceCard
              label="路径总数"
              value={`${overviewState.totalPaths}`}
              hint="新增路径会马上进入首页推荐与学习地图。"
            />
            <ReferenceCard
              label="草稿模块"
              value={`${pathForm.modules.length}`}
              hint="模块越清晰，路径页越像一条完整主线。"
            />
            <ReferenceCard
              label="草稿课程"
              value={`${draftLessonCount}`}
              hint="课程数会决定这条路径的节奏与停留时长。"
            />
          </div>

          <div id="path-modules" className={pathWorkspace === "modules" ? "admin-builder-grid mt-6" : "hidden"}>
            <div className="admin-builder-panel">
              <p className="soft-kicker">编排摘要</p>
              <div className="admin-builder-stats mt-4">
                <BuilderStatCard
                  label="未命名模块"
                  value={`${unnamedModules}`}
                  hint="先补模块标题，学习地图与后台检索都会更清晰。"
                />
                <BuilderStatCard
                  label="待补课程目标"
                  value={`${lessonsWithoutObjectiveDraft}`}
                  hint="课程目标清楚，用户更容易判断这一节到底要学什么。"
                />
                <BuilderStatCard
                  label="待补课程标签"
                  value={`${lessonsWithoutTagsDraft}`}
                  hint="标签会影响题库与路径联动命中率。"
                />
                <BuilderStatCard
                  label="接近完成课程"
                  value={`${lessonsReadyForPublish}/${draftLessonCount || 0}`}
                  hint="已补齐大部分字段的课程，更适合优先发布。"
                />
              </div>
            </div>

            <div className="admin-builder-panel">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="soft-kicker">模块导航</p>
                  <p className="mt-2 text-[15px] leading-7 text-slate-300">
                    点一下就能跳到对应模块，适合路径开始变长之后快速定位。
                  </p>
                </div>
                <span className="admin-chip admin-chip--muted">
                  共 {pathDraftOutline.length} 个模块
                </span>
              </div>
              <div className="admin-outline-links mt-4">
                {pathDraftOutline.map((module) => (
                  <a key={module.anchor} href={`#${module.anchor}`} className="admin-outline-link">
                    <span className="admin-outline-link__title">{module.label}</span>
                    <span className="admin-outline-link__meta">
                      {module.lessonCount} 节课 · 已就绪 {module.readyLessons}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className={pathWorkspace === "planning" ? "admin-form-section" : "hidden"}>
              <div className="admin-form-section__header">
                <div>
                  <p className="admin-form-section__title">路径基础信息</p>
                  <p className="admin-form-section__description">先定义标题、主题和焦点标签，再写主线叙述会更顺。</p>
                </div>
                <span className="admin-chip admin-chip--muted">第一步</span>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field
                  label="路径唯一标识"
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
            </div>

            <div className={pathWorkspace === "planning" ? "admin-form-section" : "hidden"}>
              <div className="admin-form-section__header">
                <div>
                  <p className="admin-form-section__title">路径叙述与推荐</p>
                  <p className="admin-form-section__description">关底任务、里程碑与推荐题共同决定这条主线的推进感。</p>
                </div>
                <span className="admin-chip admin-chip--muted">第二步</span>
              </div>
              <div className="mt-5 space-y-4">
                <TextAreaField
                  label="关底任务"
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
                  label="里程碑（每行一条）"
                  value={pathForm.milestones}
                  rows={4}
                  onChange={(value) => {
                    setPathForm((current) => ({ ...current, milestones: value }));
                  }}
                />
                <TextAreaField
                  label="推荐题目标识"
                  value={pathForm.recommendedProblemSlugs}
                  rows={3}
                  placeholder="vector-sum-board, sort-ranking-list"
                  onChange={(value) => {
                    setPathForm((current) => ({ ...current, recommendedProblemSlugs: value }));
                  }}
                />
                <div className="admin-subcard admin-subcard--muted px-4 py-4 text-sm text-slate-300">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-white">可选题目标识参考</p>
                    <span className="admin-chip admin-chip--muted">显示前 12 个 / 共 {contentState.problems.length} 个</span>
                  </div>
                  <div className="admin-reference-tags mt-3">
                    {availableProblemReference.map((problem) => (
                      <span key={problem.slug} className="admin-reference-tag">
                        {problem.slug}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={
                pathWorkspace === "planning"
                  ? "admin-inline-note admin-inline-note--success px-5 py-4 text-sm text-slate-100"
                  : "hidden"
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="soft-kicker text-slate-300">下一步建议</p>
                  <p className="mt-2 leading-7">
                    主线信息确认后，再切到模块编排补课程结构和发布检查，整条路径会更完整。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    focusWorkspace("paths", "path-modules", undefined, "modules");
                  }}
                  className="admin-action-button admin-action-button--primary px-4 py-2"
                >
                  前往模块编排
                </button>
              </div>
            </div>

            <div className={pathWorkspace === "modules" ? "space-y-5" : "hidden"}>
            <div className="admin-form-section">
              <div className="admin-form-section__header">
                <div>
                  <p className="admin-form-section__title">模块与课程编排</p>
                  <p className="admin-form-section__description">把模块拆得清楚一点，前台学习路径会更像连续闯关。</p>
                </div>
                <span className="admin-chip admin-chip--muted">
                  {pathForm.modules.length} 个模块 / {draftLessonCount} 节课
                </span>
              </div>
              <div className="mt-5 space-y-5">
                {pathForm.modules.map((module, moduleIndex) => {
                  const moduleSummary = pathDraftOutline[moduleIndex];

                  return (
                    <div
                      key={`module-${moduleIndex}`}
                      id={moduleSummary.anchor}
                      className="admin-module-card"
                    >
                      <div className="admin-module-card__header">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="admin-chip admin-chip--soft">模块 {moduleIndex + 1}</span>
                            <span className="admin-chip admin-chip--muted">
                              {module.lessons.length} 节课程
                            </span>
                            <span className="admin-chip admin-chip--muted">
                              已就绪 {moduleSummary.readyLessons}/{moduleSummary.lessonCount}
                            </span>
                          </div>
                          <p className="text-sm leading-7 text-slate-300">
                            先写模块摘要和奖励，再逐节补课程内容，整体节奏会更清晰。
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              addLesson(moduleIndex);
                            }}
                            className="admin-action-button px-3 py-1.5 text-[13px]"
                          >
                            添加课程
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              removeModule(moduleIndex);
                            }}
                            className="admin-action-button admin-action-button--danger px-3 py-1.5 text-[13px]"
                          >
                            删除模块
                          </button>
                        </div>
                      </div>

                      <div className="admin-module-card__summary mt-4">
                        <span className="admin-chip admin-chip--muted">
                          缺课程目标 {moduleSummary.missingObjective}
                        </span>
                        <span className="admin-chip admin-chip--muted">
                          缺课程标签 {moduleSummary.missingTags}
                        </span>
                        <span className="admin-chip admin-chip--muted">
                          缺代码片段 {moduleSummary.missingSnippet}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-3">
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
                        {module.lessons.map((lesson, lessonIndex) => {
                          const lessonCompletion = countCompletedLessonFields(lesson);

                          return (
                            <div key={`lesson-${moduleIndex}-${lessonIndex}`} className="admin-lesson-card">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="admin-chip admin-chip--muted">课程 {lessonIndex + 1}</span>
                                  <span className="admin-chip admin-chip--soft">{lesson.difficulty}</span>
                                  <span className="admin-chip admin-chip--muted">
                                    完成度 {lessonCompletion}/6
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    removeLesson(moduleIndex, lessonIndex);
                                  }}
                                  className="admin-action-button admin-action-button--danger px-3 py-1 text-[13px]"
                                >
                                  删除课程
                                </button>
                              </div>

                              <div className="admin-lesson-card__summary mt-4">
                                {!lesson.objective.trim() ? (
                                  <span className="admin-chip admin-chip--danger">待补课程目标</span>
                                ) : null}
                                {!lesson.contentTags.trim() ? (
                                  <span className="admin-chip admin-chip--danger">待补标签</span>
                                ) : null}
                                {!lesson.snippet.trim() ? (
                                  <span className="admin-chip admin-chip--danger">待补代码片段</span>
                                ) : (
                                  <span className="admin-chip admin-chip--soft">代码片段已补齐</span>
                                )}
                              </div>

                              <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <Field
                                  label="课程编号"
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
                                  options={["入门", "进阶", "高级"]}
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
                                  placeholder="例如：数组、循环、排序"
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
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="admin-inline-note admin-inline-note--success px-5 py-4 text-sm text-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="soft-kicker text-slate-300">发布前检查</p>
                  <div className="admin-reference-tags mt-3">
                    {pathPublishingChecklist.map((item) => (
                      <span key={item} className="admin-reference-tag">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    focusWorkspace("paths", "path-planning", undefined, "planning");
                  }}
                  className="admin-action-button px-4 py-2"
                >
                  返回路径信息
                </button>
              </div>
            </div>
            </div>
          </div>

          <div className={pathWorkspace === "modules" ? "mt-6 flex flex-wrap justify-end gap-3" : "hidden"}>
            <button
              type="button"
              onClick={() => {
                setPathForm(defaultPathForm());
              }}
              className="admin-action-button px-4 py-2"
            >
              重置
            </button>
            <button
              type="button"
              disabled={savingPath}
              onClick={() => {
                void submitPath();
              }}
              className="admin-action-button admin-action-button--primary px-5 py-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPath ? "发布中..." : "发布课程路径"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function OverviewSummaryCard({
  eyebrow,
  title,
  value,
  description,
  badge,
  emphasis
}: {
  eyebrow: string;
  title: string;
  value: string;
  description: string;
  badge: string;
  emphasis: "standard" | "focus";
}) {
  return (
    <div className="panel-shell admin-overview-card rounded-[30px] px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-heading__badge">{eyebrow}</p>
          <h3 className="mt-4 text-[1.05rem] font-semibold text-white">{title}</h3>
        </div>
        <span className={`admin-chip ${emphasis === "focus" ? "admin-chip--soft" : "admin-chip--muted"}`}>
          {badge}
        </span>
      </div>
      <p
        className={
          emphasis === "focus"
            ? "mt-4 editorial-title text-4xl text-white"
            : "mt-4 text-3xl font-semibold text-white"
        }
      >
        {value}
      </p>
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
  items: Array<{
    key: string;
    title: string;
    meta: string;
    badge?: string;
  }>;
}) {
  return (
    <div className="panel-shell rounded-[30px] px-5 py-5">
      <p className="section-heading__badge">{eyebrow}</p>
      <h3 className="mt-4 text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
      <div className="mt-5 space-y-2 text-sm text-slate-200">
        {items.length === 0 ? <p className="text-slate-500">暂无内容</p> : null}
        {items.map((item) => (
          <div key={item.key} className="admin-list-item">
            <div>
              <p className="text-sm font-medium text-white">{item.title}</p>
              <p className="admin-list-item__meta">{item.meta}</p>
            </div>
            {item.badge ? <span className="admin-chip admin-chip--muted">{item.badge}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReferenceCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="admin-reference-card">
      <p className="soft-kicker">{label}</p>
      <p className="admin-reference-card__value">{value}</p>
      <p className="admin-reference-card__hint">{hint}</p>
    </div>
  );
}

function DrawerMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-account-metric">
      <p className="soft-kicker">{label}</p>
      <p className="admin-account-metric__value">{value}</p>
    </div>
  );
}

function DrawerInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-info-row">
      <span className="admin-info-row__label">{label}</span>
      <span className="admin-info-row__value">{value}</span>
    </div>
  );
}

function BuilderStatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="admin-builder-stat">
      <p className="soft-kicker">{label}</p>
      <p className="admin-builder-stat__value">{value}</p>
      <p className="admin-builder-stat__hint">{hint}</p>
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
    <div className="panel-shell rounded-[30px] px-5 py-5">
      <p className="section-heading__badge">{eyebrow}</p>
      <h3 className="mt-4 text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <div className="admin-subcard admin-subcard--muted px-4 py-3 text-sm text-slate-500">
            暂无可删除内容
          </div>
        ) : null}
        {items.map((item) => (
          <div
            key={item.key}
            className="admin-subcard admin-subcard--muted flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-white">{item.title}</p>
              <p className="mt-1 text-[13px] text-slate-400">{item.subtitle}</p>
            </div>
            <button
              type="button"
              disabled={item.busy}
              onClick={item.onDelete}
              className="admin-action-button admin-action-button--danger px-4 py-2 text-[13px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {item.busy ? "删除中..." : "删除"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewTaskFlowCard({
  eyebrow,
  title,
  description,
  signal,
  hint,
  actionLabel,
  actions
}: {
  eyebrow: string;
  title: string;
  description: string;
  signal: string;
  hint: string;
  actionLabel: string;
  actions: Array<{
    label: string;
    description: string;
    onClick: () => void;
  }>;
}) {
  return (
    <div className="admin-subcard admin-task-flow-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-heading__badge">{eyebrow}</p>
          <h3 className="mt-4 text-[1.2rem] font-semibold text-white">{title}</h3>
        </div>
        <span className="admin-chip admin-chip--soft">{signal}</span>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
      <p className="mt-3 text-[13px] leading-6 text-slate-400">{hint}</p>
      <div className="mt-5 grid gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="admin-row-action px-4 py-4 text-left"
          >
            <div>
              <p className="text-sm font-medium text-white">{action.label}</p>
              <p className="mt-1 text-[13px] leading-6 text-slate-400">{action.description}</p>
            </div>
            <span className="admin-row-action__suffix">{actionLabel}</span>
          </button>
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
      <span className="admin-form-label">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="field-surface admin-field"
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
      <span className="admin-form-label">{label}</span>
      <select
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="field-surface admin-field"
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
      <span className="admin-form-label">{label}</span>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="field-surface admin-field admin-field--textarea"
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

function countCompletedLessonFields(lesson: LessonDraft) {
  return [
    lesson.id,
    lesson.title,
    lesson.duration,
    lesson.objective,
    lesson.contentTags,
    lesson.snippet
  ].filter((item) => item.trim().length > 0).length;
}

function formatRelativeActivity(lastActiveAt?: string) {
  if (!lastActiveAt) {
    return "暂无活跃记录";
  }

  const timestamp = new Date(lastActiveAt).getTime();
  if (Number.isNaN(timestamp)) {
    return "暂无活跃记录";
  }

  const diffHours = Math.max(Math.round((Date.now() - timestamp) / (1000 * 60 * 60)), 0);
  if (diffHours < 1) {
    return "1 小时内活跃";
  }
  if (diffHours < 24) {
    return `${diffHours} 小时前活跃`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} 天前活跃`;
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
