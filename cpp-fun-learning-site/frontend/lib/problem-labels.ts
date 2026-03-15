const difficultyRules = [
  { pattern: /(easy|beginner|basic|入门|基础|简单)/i, label: "入门" },
  { pattern: /(medium|intermediate|normal|进阶|中等)/i, label: "进阶" },
  { pattern: /(hard|advanced|expert|困难|高阶|挑战)/i, label: "挑战" }
];

const titleMap: Record<string, string> = {
  "输出 Hello C++": "输出你好，C++",
  "Linux 终端里的 Hello World": "Linux 终端里的你好世界",
  "if 与 for：做一个闯关循环": "条件判断与循环控制：做一个闯关循环",
  "Linux Compile Route": "Linux 编译路线",
  "Logic Smoke Path": "逻辑冒烟测试路径",
  "Logic Smoke Problem": "逻辑冒烟测试题目"
};

const displayNameMap: Record<string, string> = {
  "Site Admin": "站点管理员",
  "Audit User": "审计测试用户",
  "Smoke User": "冒烟测试用户",
  "No Admin": "非管理员测试用户",
  "Logic Finish": "逻辑完结用户",
  "Logic User A": "逻辑用户 A",
  "Logic User B": "逻辑用户 B"
};

const adminActivityDetailMap: Record<string, string> = {
  "Removed path from managed content": "已从后台内容目录中移除这条路径。",
  "Removed problem from managed content": "已从后台内容目录中移除这道题目。"
};

const tagMap: Record<string, string> = {
  if: "条件判断",
  new: "动态分配",
  delete: "内存释放",
  linux: "Linux 环境",
  "g++": "编译命令"
};

const typeMap: Record<string, string> = {
  programming: "编程题",
  "programming problem": "编程题",
  challenge: "挑战题",
  quiz: "测验题",
  environment: "环境引导题",
  "environment setup": "环境引导题"
};

export function isBeginnerDifficulty(value: string) {
  return difficultyRules[0].pattern.test(value);
}

export function formatLearningTitle(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "未命名内容";
  }

  if (titleMap[normalized]) {
    return titleMap[normalized];
  }

  return normalized
    .replace(/Hello World/gi, "你好世界")
    .replace(/Hello C\+\+/gi, "你好，C++")
    .replace(/\bif\b/gi, "条件判断")
    .replace(/\bfor\b/gi, "循环控制")
    .replace(/\bnew\b/gi, "动态分配")
    .replace(/\bdelete\b/gi, "内存释放")
    .replace(/\broute\b/gi, "路线")
    .replace(/\bpath\b/gi, "路径")
    .replace(/\bproblem\b/gi, "题目")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function formatProblemDifficultyLabel(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "未标注";
  }

  const matchedRule = difficultyRules.find((rule) => rule.pattern.test(normalized));
  return matchedRule?.label ?? normalized;
}

export function formatProblemTypeLabel(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "练习";
  }

  if (/[\u4e00-\u9fa5]/.test(normalized)) {
    return normalized;
  }

  const mapped = typeMap[normalized.toLowerCase()];
  return mapped ?? normalized;
}

export function formatProblemTagLabel(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "未分类";
  }

  if (/[\u4e00-\u9fa5]/.test(normalized)) {
    return formatLearningTitle(normalized);
  }

  const mapped = tagMap[normalized.toLowerCase()];
  return mapped ?? formatLearningTitle(normalized);
}

export function formatDisplayName(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "未命名用户";
  }

  return displayNameMap[normalized] ?? normalized;
}

export function formatAdminActivityDetail(action: string, detail: string) {
  const normalized = detail.trim();
  if (!normalized) {
    if (action === "delete_problem") {
      return "已删除题目内容。";
    }
    if (action === "delete_path") {
      return "已删除课程路径内容。";
    }
    return "已完成后台操作。";
  }

  const mapped = adminActivityDetailMap[normalized];
  if (mapped) {
    return mapped;
  }

  return formatLearningTitle(normalized);
}
