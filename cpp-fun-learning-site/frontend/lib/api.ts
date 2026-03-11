export type Metric = {
  label: string;
  value: string;
};

export type PathSummary = {
  slug: string;
  title: string;
  subtitle: string;
  theme: string;
  estimatedHours: number;
  lessonCount: number;
  challengeCount: number;
  focusTags: string[];
  bossMission: string;
};

export type Lesson = {
  id: string;
  title: string;
  module: string;
  duration: string;
  difficulty: string;
  objective: string;
  contentTags: string[];
  snippet: string;
};

export type ProblemSummary = {
  slug: string;
  title: string;
  difficulty: string;
  type: string;
  tags: string[];
  mission: string;
};

export type ProblemExample = {
  input: string;
  output: string;
  explanation: string;
};

export type ProblemDetail = ProblemSummary & {
  description: string;
  starterCode: string;
  hints: string[];
  acceptance: string[];
  runtime: string;
  examples: ProblemExample[];
};

export type LeaderboardEntry = {
  rank: number;
  name: string;
  xp: number;
  streak: number;
  title: string;
};

export type ProgressOverview = {
  xp: number;
  streak: number;
  completedLessons: number;
  totalLessons: number;
  completedProblems: number;
  totalProblems: number;
  weeklyTarget: number;
  weeklyCompleted: number;
  currentPath: {
    slug: string;
    title: string;
    progressPercent: number;
    nextLessonTitle: string;
    nextProblemTitle: string;
    remainingMissions: number;
  };
  recentUnlocks: string[];
  recommendedActions: string[];
};

export type SubmissionStatusResponse = {
  mode: string;
  submissionId: string;
  status: string;
  result: string;
  detail: string;
  stdout: string;
  compileOutput: string;
  elapsedMs: number;
  finishedAt?: string;
};

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export type AuthResponse = {
  user: UserSummary;
};

export type UserSubmissionSummary = {
  submissionId: string;
  problemSlug: string;
  problemTitle: string;
  status: string;
  result: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminOverview = {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  totalPaths: number;
  totalLessons: number;
  totalProblems: number;
};

export type AdminUserDetail = UserSummary & {
  submissionCount: number;
  acceptedCount: number;
  lastActiveAt?: string;
};

export type AdminContentCatalog = {
  paths: PathSummary[];
  lessons: Lesson[];
  problems: ProblemSummary[];
};

export type PathModule = {
  title: string;
  summary: string;
  reward: string;
  lessons: Lesson[];
};

export type PathDetail = PathSummary & {
  description: string;
  milestones: string[];
  modules: PathModule[];
  recommendedProblems: ProblemSummary[];
};

export type HomeResponse = {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryAction: { label: string; href: string };
    secondaryAction: { label: string; href: string };
    metrics: Metric[];
  };
  dailyQuest: {
    title: string;
    reward: string;
    objective: string;
    tips: string[];
  };
  featuredPaths: PathSummary[];
  featuredLessons: Lesson[];
  featuredProblems: ProblemSummary[];
  leaderboardPreview: LeaderboardEntry[];
  releaseNotes: string[];
  stack: {
    web: string;
    judge: string;
    persistence: string;
  };
};

const serverApiBaseUrl =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8080";
export const publicApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${serverApiBaseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getHome(): Promise<HomeResponse> {
  return fetchApi<HomeResponse>("/api/v1/home");
}

export async function getPaths(): Promise<PathSummary[]> {
  return fetchApi<PathSummary[]>("/api/v1/paths");
}

export async function getPath(slug: string): Promise<PathDetail | null> {
  try {
    return await fetchApi<PathDetail>(`/api/v1/paths/${slug}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return null;
    }

    throw error;
  }
}

export async function getProblems(): Promise<ProblemSummary[]> {
  return fetchApi<ProblemSummary[]>("/api/v1/problems");
}

export async function getProgressOverview(): Promise<ProgressOverview> {
  return fetchApi<ProgressOverview>("/api/v1/progress/overview");
}

export async function getProblem(slug: string): Promise<ProblemDetail | null> {
  try {
    return await fetchApi<ProblemDetail>(`/api/v1/problems/${slug}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return null;
    }

    throw error;
  }
}

export async function getSubmissionStatus(
  submissionId: string
): Promise<SubmissionStatusResponse | null> {
  try {
    return await fetchApi<SubmissionStatusResponse>(`/api/v1/submissions/${submissionId}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return null;
    }

    throw error;
  }
}
