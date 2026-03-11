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

export async function getHome(): Promise<HomeResponse> {
  const home = await fetchServerApi<HomeResponse>("/api/v1/home");
  return {
    ...home,
    releaseNotes: [
      "课程地图已补全为多条主路线，可按阶段连续推进。",
      "题库与课程讲解已经对齐，学完概念就能立即进入练习。",
      "登录后会自动累计个人提交记录与成长数据。",
      "首页推荐会围绕你的学习路径和最近进度持续更新。"
    ],
    stack: {
      web: "课程地图、题目页和学习路径已经串成一套连续的练习体验。",
      judge: "支持先试跑、再正式提交，帮助你逐步验证代码结果。",
      persistence: "登录后会按账号保存你的提交历史、成长数据和近期进度。"
    }
  };
}

export async function getPaths(): Promise<PathSummary[]> {
  return fetchServerApi<PathSummary[]>("/api/v1/paths");
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
  return fetchServerApi<ProblemSummary[]>("/api/v1/problems");
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
    return await fetchServerApi<UserSubmissionSummary[]>("/api/v1/submissions");
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
    return await fetchServerApi<AdminUserDetail[]>("/api/v1/admin/users");
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
    return await fetchServerApi<AdminContentCatalog>("/api/v1/admin/content");
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
    return await fetchServerApi<AdminActivityEntry[]>("/api/v1/admin/activity");
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
