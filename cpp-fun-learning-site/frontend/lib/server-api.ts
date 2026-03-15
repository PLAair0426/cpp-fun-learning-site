import "server-only";

import { headers } from "next/headers";
import type {
  AdminActivityEntry,
  AdminContentCatalog,
  AdminOverview,
  AdminUserDetail,
  AuthResponse,
  HomeResponse,
  PathDetail,
  PathSummary,
  ProblemDetail,
  ProblemSummary,
  ProgressOverview,
  SubmissionStatusResponse,
  UserSubmissionSummary,
  UserSummary
} from "./api";

const serverApiBaseUrl =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8080";

async function fetchServerApi<T>(path: string, init?: RequestInit): Promise<T> {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie");

  const response = await fetch(`${serverApiBaseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(init?.headers ?? {})
    }
  });

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (response.status === 403) {
    throw new Error("FORBIDDEN");
  }
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export async function getHome(): Promise<HomeResponse> {
  const home = await fetchServerApi<HomeResponse>("/api/v1/home");
  return {
    ...home,
    releaseNotes: [
      "课程地图已经覆盖多条引导式主线，方便按阶段逐步推进。",
      "题目与课程保持联动，学完一个概念后就能立刻进入练习。",
      "登录之后，提交记录、成长数据与最近进度都会按账号单独保存。",
      "首页推荐会根据你当前所在路径与最近动作动态调整。"
    ],
    stack: {
      web: "课程地图、题目页和学习路径已经连成一条连续的推进主线。",
      judge: "你可以先试跑、再正式提交，更适合一步步验证代码逻辑。",
      persistence: "登录后，提交历史、成长数据和最近进度都会稳定挂在自己的账号下。"
    }
  };
}

export async function getPaths(): Promise<PathSummary[]> {
  return ensureArray(await fetchServerApi<PathSummary[] | null>("/api/v1/paths"));
}

export async function getPath(slug: string): Promise<PathDetail | null> {
  try {
    return await fetchServerApi<PathDetail>(`/api/v1/paths/${slug}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return null;
    }
    throw error;
  }
}

export async function getProblems(): Promise<ProblemSummary[]> {
  return ensureArray(await fetchServerApi<ProblemSummary[] | null>("/api/v1/problems"));
}

export async function getProgressOverview(): Promise<ProgressOverview> {
  return fetchServerApi<ProgressOverview>("/api/v1/progress/overview");
}

export async function getProblem(slug: string): Promise<ProblemDetail | null> {
  try {
    return await fetchServerApi<ProblemDetail>(`/api/v1/problems/${slug}`);
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
    return await fetchServerApi<SubmissionStatusResponse>(`/api/v1/submissions/${submissionId}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return null;
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return null;
    }
    throw error;
  }
}

export async function getCurrentUser(): Promise<UserSummary | null> {
  try {
    const response = await fetchServerApi<AuthResponse>("/api/v1/auth/me");
    return response.user;
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return null;
    }
    throw error;
  }
}

export async function getMySubmissions(): Promise<UserSubmissionSummary[]> {
  try {
    const response = await fetchServerApi<UserSubmissionSummary[] | null>("/api/v1/submissions");
    return ensureArray(response);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return [];
    }
    throw error;
  }
}

export async function getAdminOverview(): Promise<AdminOverview | null> {
  try {
    return await fetchServerApi<AdminOverview>("/api/v1/admin/overview");
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return null;
    }
    if (error instanceof Error && error.message.startsWith("API request failed: 403")) {
      return null;
    }
    throw error;
  }
}

export async function getAdminUsers(): Promise<AdminUserDetail[]> {
  try {
    return ensureArray(await fetchServerApi<AdminUserDetail[] | null>("/api/v1/admin/users"));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("API request failed: 403")) {
      return [];
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return [];
    }
    throw error;
  }
}

export async function getAdminContent(): Promise<AdminContentCatalog | null> {
  try {
    const response = await fetchServerApi<AdminContentCatalog | null>("/api/v1/admin/content");
    if (!response) {
      return null;
    }

    return {
      ...response,
      paths: ensureArray(response.paths),
      lessons: ensureArray(response.lessons),
      problems: ensureArray(response.problems)
    };
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return null;
    }
    if (error instanceof Error && error.message.startsWith("API request failed: 403")) {
      return null;
    }
    throw error;
  }
}

export async function getAdminActivity(): Promise<AdminActivityEntry[]> {
  try {
    return ensureArray(await fetchServerApi<AdminActivityEntry[] | null>("/api/v1/admin/activity"));
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return [];
    }
    if (error instanceof Error && error.message.startsWith("API request failed: 403")) {
      return [];
    }
    throw error;
  }
}
