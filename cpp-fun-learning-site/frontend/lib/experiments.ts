export const EXPERIMENT_COOKIE_NAMES = {
  homeHero: "exp_home_hero",
  authAccess: "exp_auth_access",
  problemsStrategy: "exp_problems_strategy",
  problemDetailApproach: "exp_problem_detail_approach",
  adminWorkbench: "exp_admin_workbench",
  pathJourney: "exp_path_journey",
  pathAtlas: "exp_path_atlas"
} as const;

export const HOME_HERO_VARIANTS = ["a", "b"] as const;
export const AUTH_ACCESS_VARIANTS = ["a", "b"] as const;
export const PROBLEMS_STRATEGY_VARIANTS = ["a", "b"] as const;
export const PROBLEM_DETAIL_APPROACH_VARIANTS = ["a", "b"] as const;
export const ADMIN_WORKBENCH_VARIANTS = ["a", "b"] as const;
export const PATH_JOURNEY_VARIANTS = ["a", "b"] as const;
export const PATH_ATLAS_VARIANTS = ["a", "b"] as const;

export type HomeHeroVariant = (typeof HOME_HERO_VARIANTS)[number];
export type AuthAccessVariant = (typeof AUTH_ACCESS_VARIANTS)[number];
export type ProblemsStrategyVariant = (typeof PROBLEMS_STRATEGY_VARIANTS)[number];
export type ProblemDetailApproachVariant =
  (typeof PROBLEM_DETAIL_APPROACH_VARIANTS)[number];
export type AdminWorkbenchVariant = (typeof ADMIN_WORKBENCH_VARIANTS)[number];
export type PathJourneyVariant = (typeof PATH_JOURNEY_VARIANTS)[number];
export type PathAtlasVariant = (typeof PATH_ATLAS_VARIANTS)[number];

export const homeHeroVariantMeta: Record<
  HomeHeroVariant,
  { label: string; title: string; description: string }
> = {
  a: {
    label: "甲版",
    title: "指挥台优先",
    description: "突出主操作、整体进度和推荐动作，适合第一次进入站点的访客。"
  },
  b: {
    label: "乙版",
    title: "主线推进",
    description: "突出当前主线、下一步任务和连续推进感，适合已有学习目标的用户。"
  }
};

export const authAccessVariantMeta: Record<
  AuthAccessVariant,
  { label: string; title: string; description: string }
> = {
  a: {
    label: "甲版",
    title: "隐私保险库",
    description: "突出记录隔离、跨设备延续与账号安全感，适合先建立信任再登录。"
  },
  b: {
    label: "乙版",
    title: "极速开局",
    description: "突出快速注册、立即开练和即时反馈，适合强调转化效率。"
  }
};

export const problemsStrategyVariantMeta: Record<
  ProblemsStrategyVariant,
  { label: string; title: string; description: string }
> = {
  a: {
    label: "甲版",
    title: "先筛题目",
    description: "优先让用户快速搜索、筛选和横向浏览题库，更适合目标明确的刷题者。"
  },
  b: {
    label: "乙版",
    title: "先走主线",
    description: "优先把当前主线推荐、路径焦点与下一题放到前面，更适合沿路线持续推进。"
  }
};

export const problemDetailApproachVariantMeta: Record<
  ProblemDetailApproachVariant,
  { label: string; title: string; description: string }
> = {
  a: {
    label: "甲版",
    title: "先运行试错",
    description: "先打开运行面板快速试错，再回头补读题目细节，适合偏实操的用户。"
  },
  b: {
    label: "乙版",
    title: "先读题引导",
    description: "先消化题意、验收条件和样例，再进入运行区，适合更稳妥的解题流程。"
  }
};

export const adminWorkbenchVariantMeta: Record<
  AdminWorkbenchVariant,
  { label: string; title: string; description: string }
> = {
  a: {
    label: "甲版",
    title: "总览优先",
    description: "优先突出运营信号、账号状态和风险列表，适合先看全局再处理问题。"
  },
  b: {
    label: "乙版",
    title: "内容优先",
    description: "优先突出内容健康与新增入口，适合正在高频补课程、题目和路径的阶段。"
  }
};

export const pathJourneyVariantMeta: Record<
  PathJourneyVariant,
  { label: string; title: string; description: string }
> = {
  a: {
    label: "甲版",
    title: "剧情推进优先",
    description: "优先突出模块推进、里程碑和关底任务，更像一条剧情式学习主线。"
  },
  b: {
    label: "乙版",
    title: "知识地图优先",
    description: "优先突出标签、配套练习和知识结构，更像一张可探索的能力地图。"
  }
};

export const pathAtlasVariantMeta: Record<
  PathAtlasVariant,
  { label: string; title: string; description: string }
> = {
  a: {
    label: "甲版",
    title: "先自由浏览",
    description: "优先强调横向浏览与自由比较，适合先挑路线再决定从哪里开始。"
  },
  b: {
    label: "乙版",
    title: "先看推荐",
    description: "优先突出当前推荐路径与下一步动作，适合减少选择成本并快速进入主线。"
  }
};

export function isHomeHeroVariant(value: string | null | undefined): value is HomeHeroVariant {
  return value === "a" || value === "b";
}

export function isAuthAccessVariant(
  value: string | null | undefined
): value is AuthAccessVariant {
  return value === "a" || value === "b";
}

export function isProblemsStrategyVariant(
  value: string | null | undefined
): value is ProblemsStrategyVariant {
  return value === "a" || value === "b";
}

export function isProblemDetailApproachVariant(
  value: string | null | undefined
): value is ProblemDetailApproachVariant {
  return value === "a" || value === "b";
}

export function isAdminWorkbenchVariant(
  value: string | null | undefined
): value is AdminWorkbenchVariant {
  return value === "a" || value === "b";
}

export function isPathJourneyVariant(
  value: string | null | undefined
): value is PathJourneyVariant {
  return value === "a" || value === "b";
}

export function isPathAtlasVariant(
  value: string | null | undefined
): value is PathAtlasVariant {
  return value === "a" || value === "b";
}

export function pickRandomHomeHeroVariant(): HomeHeroVariant {
  return Math.random() < 0.5 ? "a" : "b";
}

export function pickRandomAuthAccessVariant(): AuthAccessVariant {
  return Math.random() < 0.5 ? "a" : "b";
}

export function pickRandomProblemsStrategyVariant(): ProblemsStrategyVariant {
  return Math.random() < 0.5 ? "a" : "b";
}

export function pickRandomProblemDetailApproachVariant(): ProblemDetailApproachVariant {
  return Math.random() < 0.5 ? "a" : "b";
}

export function pickRandomAdminWorkbenchVariant(): AdminWorkbenchVariant {
  return Math.random() < 0.5 ? "a" : "b";
}

export function pickRandomPathJourneyVariant(): PathJourneyVariant {
  return Math.random() < 0.5 ? "a" : "b";
}

export function pickRandomPathAtlasVariant(): PathAtlasVariant {
  return Math.random() < 0.5 ? "a" : "b";
}

export function resolveHomeHeroVariant(value: string | null | undefined): HomeHeroVariant {
  return isHomeHeroVariant(value) ? value : "a";
}

export function resolveAuthAccessVariant(
  value: string | null | undefined
): AuthAccessVariant {
  return isAuthAccessVariant(value) ? value : "a";
}

export function resolveProblemsStrategyVariant(
  value: string | null | undefined
): ProblemsStrategyVariant {
  return isProblemsStrategyVariant(value) ? value : "a";
}

export function resolveProblemDetailApproachVariant(
  value: string | null | undefined
): ProblemDetailApproachVariant {
  return isProblemDetailApproachVariant(value) ? value : "a";
}

export function resolveAdminWorkbenchVariant(
  value: string | null | undefined
): AdminWorkbenchVariant {
  return isAdminWorkbenchVariant(value) ? value : "a";
}

export function resolvePathJourneyVariant(
  value: string | null | undefined
): PathJourneyVariant {
  return isPathJourneyVariant(value) ? value : "a";
}

export function resolvePathAtlasVariant(
  value: string | null | undefined
): PathAtlasVariant {
  return isPathAtlasVariant(value) ? value : "a";
}

export function getHomeHeroVariantLabel(variant: HomeHeroVariant) {
  return `${homeHeroVariantMeta[variant].label} · ${homeHeroVariantMeta[variant].title}`;
}

export function getAuthAccessVariantLabel(variant: AuthAccessVariant) {
  return `${authAccessVariantMeta[variant].label} · ${authAccessVariantMeta[variant].title}`;
}

export function getProblemsStrategyVariantLabel(variant: ProblemsStrategyVariant) {
  return `${problemsStrategyVariantMeta[variant].label} · ${problemsStrategyVariantMeta[variant].title}`;
}

export function getProblemDetailApproachVariantLabel(
  variant: ProblemDetailApproachVariant
) {
  return `${problemDetailApproachVariantMeta[variant].label} · ${problemDetailApproachVariantMeta[variant].title}`;
}

export function getAdminWorkbenchVariantLabel(variant: AdminWorkbenchVariant) {
  return `${adminWorkbenchVariantMeta[variant].label} · ${adminWorkbenchVariantMeta[variant].title}`;
}

export function getPathJourneyVariantLabel(variant: PathJourneyVariant) {
  return `${pathJourneyVariantMeta[variant].label} · ${pathJourneyVariantMeta[variant].title}`;
}

export function getPathAtlasVariantLabel(variant: PathAtlasVariant) {
  return `${pathAtlasVariantMeta[variant].label} · ${pathAtlasVariantMeta[variant].title}`;
}
