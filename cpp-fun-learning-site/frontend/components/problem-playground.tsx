"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Play,
  RotateCcw,
  Send,
  TerminalSquare,
  Timer
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  publicApiBaseUrl,
  type ProblemDetail,
  type SubmissionStatusResponse
} from "../lib/api";

type RunnerResponse = {
  mode: string;
  status: string;
  stdout: string;
  compileOutput: string;
  executionMs: number;
  memoryKb: number;
};

type SubmitResponse = {
  mode: string;
  status: string;
  submissionId: string;
  queuePosition: number;
  etaSeconds: number;
  nextPoll: string;
};

type RecommendationLink = {
  href: string;
  label: string;
  title: string;
};

type ProblemPlaygroundProps = {
  problem: ProblemDetail;
  recommendations?: {
    nextLesson?: RecommendationLink;
    nextProblem?: RecommendationLink;
    pathHome?: RecommendationLink;
  };
};

const phases = ["READY", "QUEUED", "RUNNING", "FINISHED"] as const;

const phaseDescriptions: Record<(typeof phases)[number], string> = {
  READY: "先补齐代码，再运行或正式提交。",
  QUEUED: "任务已经进入判题队列，正在等待处理。",
  RUNNING: "系统正在编译并执行你的代码。",
  FINISHED: "结果已经返回，可以继续修正或进入下一题。"
};

function getFeedbackState(
  error: string,
  runResult: RunnerResponse | null,
  submissionTicket: SubmitResponse | null,
  submissionStatus: SubmissionStatusResponse | null
) {
  if (error) {
    return {
      title: "请求异常",
      tone: "rose",
      icon: AlertTriangle,
      summary: error
    } as const;
  }

  if (submissionStatus) {
    if (submissionStatus.result === "ACCEPTED") {
      return {
        title: "正式提交通过",
        tone: "emerald",
        icon: CheckCircle2,
        summary: "这道题已经通过，个人记录也会同步累计到当前账号。"
      } as const;
    }

    if (submissionStatus.result === "COMPILE_ERROR") {
      return {
        title: "编译未通过",
        tone: "amber",
        icon: AlertTriangle,
        summary: "先修复语法或括号问题，再重新提交。"
      } as const;
    }

    return {
      title: "提交处理中",
      tone: "cyan",
      icon: Clock3,
      summary: "系统正在处理你的正式提交，请继续观察状态流。"
    } as const;
  }

  if (submissionTicket) {
    return {
      title: "已进入队列",
      tone: "cyan",
      icon: Clock3,
      summary: "正式提交已经创建，系统会持续刷新判题状态。"
    } as const;
  }

  if (runResult) {
    if (runResult.status === "ACCEPTED" || runResult.status === "RUN_FINISHED") {
      return {
        title: "试跑完成",
        tone: "emerald",
        icon: CheckCircle2,
        summary: "试跑结果已返回，可以继续优化后再正式提交。"
      } as const;
    }

    if (runResult.status === "COMPILE_ERROR") {
      return {
        title: "试跑编译失败",
        tone: "amber",
        icon: AlertTriangle,
        summary: "先根据编译信息修复代码，再继续运行。"
      } as const;
    }
  }

  return {
    title: "准备开始",
    tone: "slate",
    icon: TerminalSquare,
    summary: "推荐流程：先试跑验证逻辑，再登录后进行正式提交。"
  } as const;
}

export function ProblemPlayground({ problem, recommendations }: ProblemPlaygroundProps) {
  const [sourceCode, setSourceCode] = useState(problem.starterCode);
  const [stdin, setStdin] = useState(problem.examples[0]?.input ?? "");
  const [runResult, setRunResult] = useState<RunnerResponse | null>(null);
  const [submissionTicket, setSubmissionTicket] = useState<SubmitResponse | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatusResponse | null>(null);
  const [error, setError] = useState("");
  const [loadingMode, setLoadingMode] = useState<"run" | "submit" | null>(null);

  useEffect(() => {
    setSourceCode(problem.starterCode);
    setStdin(problem.examples[0]?.input ?? "");
    setRunResult(null);
    setSubmissionTicket(null);
    setSubmissionStatus(null);
    setError("");
  }, [problem]);

  useEffect(() => {
    if (!submissionTicket) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let eventSource: EventSource | null = null;
    let usingPolling = false;

    const poll = async () => {
      try {
        const response = await fetch(`${publicApiBaseUrl}${submissionTicket.nextPoll}`, {
          credentials: "include",
          headers: { Accept: "application/json" }
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("请先登录，再查看自己的提交状态。");
          }
          throw new Error(`提交轮询失败：${response.status}`);
        }

        const payload = (await response.json()) as SubmissionStatusResponse;
        if (cancelled) {
          return;
        }

        setSubmissionStatus(payload);
        if (payload.status !== "FINISHED") {
          timer = setTimeout(poll, 1200);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "提交状态读取失败");
        }
      }
    };

    const startPolling = () => {
      if (usingPolling || cancelled) {
        return;
      }

      usingPolling = true;
      timer = setTimeout(poll, 1200);
    };

    if (typeof EventSource !== "undefined") {
      eventSource = new EventSource(
        `${publicApiBaseUrl}/api/v1/submissions/${submissionTicket.submissionId}/stream`,
        { withCredentials: true }
      );

      eventSource.addEventListener("status", (event) => {
        if (cancelled) {
          return;
        }

        const payload = JSON.parse((event as MessageEvent<string>).data) as SubmissionStatusResponse;
        setSubmissionStatus(payload);

        if (payload.status === "FINISHED") {
          eventSource?.close();
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
        startPolling();
      };
    } else {
      startPolling();
    }

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
      eventSource?.close();
    };
  }, [submissionTicket]);

  const resultLines = useMemo(() => {
    if (submissionStatus) {
      return [
        `状态：${submissionStatus.status}`,
        `结果：${submissionStatus.result || "待判定"}`,
        submissionStatus.detail ? `说明：${submissionStatus.detail}` : "",
        submissionStatus.finishedAt ? `完成时间：${submissionStatus.finishedAt}` : ""
      ].filter(Boolean);
    }

    if (submissionTicket) {
      return [
        `状态：${submissionTicket.status}`,
        `任务编号：${submissionTicket.submissionId}`,
        `排队位置：${submissionTicket.queuePosition}`,
        `预计完成：${submissionTicket.etaSeconds}s`
      ];
    }

    if (runResult) {
      return [
        `状态：${runResult.status}`,
        `运行耗时：${runResult.executionMs}ms`,
        `内存占用：${runResult.memoryKb}KB`
      ];
    }

    return ["尚未开始运行。"];
  }, [runResult, submissionStatus, submissionTicket]);

  const currentPhase = useMemo(() => {
    const status = submissionStatus?.status ?? submissionTicket?.status;
    if (status === "QUEUED") return "QUEUED";
    if (status === "RUNNING") return "RUNNING";
    if (status === "FINISHED") return "FINISHED";
    return "READY";
  }, [submissionStatus?.status, submissionTicket?.status]);

  const feedback = useMemo(
    () => getFeedbackState(error, runResult, submissionTicket, submissionStatus),
    [error, runResult, submissionTicket, submissionStatus]
  );

  const feedbackTone =
    feedback.tone === "emerald"
      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-50"
      : feedback.tone === "amber"
        ? "border-amber-300/20 bg-amber-300/10 text-amber-50"
        : feedback.tone === "rose"
          ? "border-rose-300/20 bg-rose-300/10 text-rose-50"
          : feedback.tone === "cyan"
            ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-50"
            : "border-white/10 bg-white/5 text-slate-100";

  const FeedbackIcon = feedback.icon;
  const showNextSteps = feedback.tone === "emerald" && recommendations;

  async function submit(kind: "run" | "submit") {
    setLoadingMode(kind);
    setError("");

    try {
      const response = await fetch(`${publicApiBaseUrl}/api/v1/${kind}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          problemSlug: problem.slug,
          language: "cpp17",
          sourceCode,
          input: stdin
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("正式提交前请先登录或注册账号。");
        }
        throw new Error(`请求失败：${response.status}`);
      }

      if (kind === "run") {
        const payload = (await response.json()) as RunnerResponse;
        setRunResult(payload);
        setSubmissionTicket(null);
        setSubmissionStatus(null);
      } else {
        const payload = (await response.json()) as SubmitResponse;
        setSubmissionTicket(payload);
        setSubmissionStatus(null);
        setRunResult(null);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "发生未知错误");
    } finally {
      setLoadingMode(null);
    }
  }

  function resetPlayground() {
    setSourceCode(problem.starterCode);
    setStdin(problem.examples[0]?.input ?? "");
    setRunResult(null);
    setSubmissionTicket(null);
    setSubmissionStatus(null);
    setError("");
  }

  return (
    <div className="grid gap-4">
      <div className={`rounded-[28px] border p-5 ${feedbackTone}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-current/20 bg-black/10 p-3">
              <FeedbackIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] opacity-80">Result Feedback</p>
              <h3 className="mt-2 text-xl font-semibold">{feedback.title}</h3>
              <p className="mt-2 text-sm leading-7 opacity-90">{feedback.summary}</p>
            </div>
          </div>

          <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] border border-white/10 bg-black/10 p-3">
              <p className="text-xs uppercase tracking-[0.22em] opacity-70">当前阶段</p>
              <p className="mt-2 text-sm font-medium">{currentPhase}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-black/10 p-3">
              <p className="text-xs uppercase tracking-[0.22em] opacity-70">阶段说明</p>
              <p className="mt-2 text-sm font-medium">{phaseDescriptions[currentPhase]}</p>
            </div>
          </div>
        </div>

        {showNextSteps ? (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {recommendations.nextLesson ? (
              <Link
                href={recommendations.nextLesson.href}
                className="rounded-[22px] border border-white/12 bg-black/10 p-4 transition hover:bg-black/20"
              >
                <p className="text-xs uppercase tracking-[0.22em] opacity-70">下一节课</p>
                <p className="mt-2 text-sm font-medium">{recommendations.nextLesson.title}</p>
                <p className="mt-2 text-xs opacity-80">{recommendations.nextLesson.label}</p>
              </Link>
            ) : null}

            {recommendations.nextProblem ? (
              <Link
                href={recommendations.nextProblem.href}
                className="rounded-[22px] border border-white/12 bg-black/10 p-4 transition hover:bg-black/20"
              >
                <p className="text-xs uppercase tracking-[0.22em] opacity-70">下一题</p>
                <p className="mt-2 text-sm font-medium">{recommendations.nextProblem.title}</p>
                <p className="mt-2 text-xs opacity-80">{recommendations.nextProblem.label}</p>
              </Link>
            ) : null}

            {recommendations.pathHome ? (
              <Link
                href={recommendations.pathHome.href}
                className="rounded-[22px] border border-white/12 bg-black/10 p-4 transition hover:bg-black/20"
              >
                <p className="text-xs uppercase tracking-[0.22em] opacity-70">返回路线</p>
                <p className="mt-2 text-sm font-medium">{recommendations.pathHome.title}</p>
                <p className="mt-2 text-xs opacity-80">{recommendations.pathHome.label}</p>
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-[30px] border border-white/8 bg-slate-950/55 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Code Editor</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{problem.title}</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  void submit("run");
                }}
                disabled={loadingMode !== null}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-50 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMode === "run" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                试跑
              </button>
              <button
                type="button"
                onClick={() => {
                  void submit("submit");
                }}
                disabled={loadingMode !== null}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-50 transition hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMode === "submit" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                正式提交
              </button>
              <button
                type="button"
                onClick={resetPlayground}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-100 transition hover:border-white/20 hover:bg-white/5"
              >
                <RotateCcw className="h-4 w-4" />
                重置
              </button>
            </div>
          </div>

          <textarea
            value={sourceCode}
            onChange={(event) => setSourceCode(event.target.value)}
            className="mt-5 min-h-[420px] w-full rounded-[26px] border border-white/8 bg-[#07111f] px-4 py-4 font-mono text-sm leading-7 text-cyan-50 outline-none transition focus:border-cyan-300/30"
            spellCheck={false}
          />
        </div>

        <div className="grid gap-4">
          <div className="rounded-[30px] border border-white/8 bg-white/5 p-5">
            <div className="flex items-center gap-3 text-slate-100">
              <TerminalSquare className="h-5 w-5 text-cyan-100" />
              <p className="text-sm font-medium">输入与输出</p>
            </div>

            <label className="mt-4 grid gap-2">
              <span className="text-xs uppercase tracking-[0.22em] text-slate-400">标准输入</span>
              <textarea
                value={stdin}
                onChange={(event) => setStdin(event.target.value)}
                className="min-h-[120px] rounded-[20px] border border-white/8 bg-slate-950/55 px-4 py-3 font-mono text-sm text-slate-100 outline-none transition focus:border-cyan-300/30"
              />
            </label>

            <div className="mt-5 rounded-[20px] border border-white/8 bg-slate-950/55 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">结果摘要</p>
              <div className="mt-3 space-y-2 text-sm leading-7 text-slate-200">
                {resultLines.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/8 bg-white/5 p-5">
            <div className="flex items-center gap-3 text-slate-100">
              <Timer className="h-5 w-5 text-amber-100" />
              <p className="text-sm font-medium">输出详情</p>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="rounded-[20px] border border-white/8 bg-slate-950/55 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Stdout</p>
                <pre className="mt-3 whitespace-pre-wrap font-mono text-sm leading-7 text-slate-100">
                  {submissionStatus?.stdout || runResult?.stdout || "暂无输出"}
                </pre>
              </div>
              <div className="rounded-[20px] border border-white/8 bg-slate-950/55 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Compile Output</p>
                <pre className="mt-3 whitespace-pre-wrap font-mono text-sm leading-7 text-slate-100">
                  {submissionStatus?.compileOutput || runResult?.compileOutput || "暂无编译信息"}
                </pre>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-dashed border-white/12 bg-white/5 p-5 text-sm leading-7 text-slate-300">
            正式提交需要登录账号。登录后，提交记录、状态流和通过结果都会绑定到当前用户，其他使用者无法访问。
            <div className="mt-4">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/5"
              >
                去登录 / 注册
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
