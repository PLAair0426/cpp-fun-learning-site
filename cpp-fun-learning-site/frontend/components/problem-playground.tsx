"use client";

import Link from "next/link";
import {
  AlertTriangle,
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
  READY: "等待你点击运行或提交",
  QUEUED: "任务已进入判题队列",
  RUNNING: "正在编译并执行代码",
  FINISHED: "结果已经写回控制台"
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
      summary: "接口请求或轮询过程中出现异常，请检查本地服务和网络状态。"
    } as const;
  }

  if (submissionStatus) {
    if (submissionStatus.result === "ACCEPTED") {
      return {
        title: "提交通过",
        tone: "emerald",
        icon: CheckCircle2,
        summary: "正式提交流程已经完成，这道题当前通过。"
      } as const;
    }

    if (submissionStatus.result === "COMPILE_ERROR") {
      return {
        title: "编译未通过",
        tone: "amber",
        icon: AlertTriangle,
        summary: "请先修复语法、分号或括号问题，再重新提交。"
      } as const;
    }

    return {
      title: "提交处理中",
      tone: "cyan",
      icon: Clock3,
      summary: "任务已进入异步判题链路，请继续观察状态流转。"
    } as const;
  }

  if (submissionTicket) {
    return {
      title: "排队中",
      tone: "cyan",
      icon: Clock3,
      summary: "票据已创建，系统将通过 SSE 或轮询持续刷新结果。"
    } as const;
  }

  if (runResult) {
    if (runResult.status === "ACCEPTED" || runResult.status === "RUN_FINISHED") {
      return {
        title: "试跑完成",
        tone: "emerald",
        icon: CheckCircle2,
        summary: "本地试跑已经拿到结果，可以继续正式提交或推进下一任务。"
      } as const;
    }

    if (runResult.status === "COMPILE_ERROR") {
      return {
        title: "试跑编译失败",
        tone: "amber",
        icon: AlertTriangle,
        summary: "先根据编译信息修正代码，再重新运行。"
      } as const;
    }
  }

  return {
    title: "准备开始",
    tone: "slate",
    icon: TerminalSquare,
    summary: "先补齐代码，再用快速运行验证逻辑，最后正式提交。"
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
          headers: { Accept: "application/json" }
        });

        if (!response.ok) {
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
        `${publicApiBaseUrl}/api/v1/submissions/${submissionTicket.submissionId}/stream`
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
      eventSource?.close();
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [submissionTicket]);

  const output = useMemo(() => {
    if (submissionStatus) {
      return [
        `状态：${submissionStatus.status}`,
        `结果：${submissionStatus.result}`,
        `说明：${submissionStatus.detail}`,
        `耗时：${submissionStatus.elapsedMs} ms`,
        submissionStatus.stdout ? `输出：\n${submissionStatus.stdout}` : "",
        submissionStatus.compileOutput ? `编译信息：\n${submissionStatus.compileOutput}` : ""
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    if (submissionTicket) {
      return [
        `状态：${submissionTicket.status}`,
        `任务编号：${submissionTicket.submissionId}`,
        `排队位置：${submissionTicket.queuePosition}`,
        `预计完成：${submissionTicket.etaSeconds}s`,
        `轮询地址：${submissionTicket.nextPoll}`
      ].join("\n");
    }

    if (runResult) {
      return [
        `状态：${runResult.status}`,
        `模式：${runResult.mode}`,
        `耗时：${runResult.executionMs} ms`,
        `内存：${runResult.memoryKb} KB`,
        runResult.stdout ? `输出：\n${runResult.stdout}` : "",
        runResult.compileOutput ? `编译信息：\n${runResult.compileOutput}` : ""
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    return "控制台正在待命。点击“快速运行”可立即看到结果，点击“正式提交”可体验完整判题流程。";
  }, [runResult, submissionStatus, submissionTicket]);

  const currentPhase = useMemo<(typeof phases)[number]>(() => {
    const status = submissionStatus?.status ?? submissionTicket?.status;
    if (status && phases.includes(status as (typeof phases)[number])) {
      return status as (typeof phases)[number];
    }

    return "READY";
  }, [submissionStatus?.status, submissionTicket?.status]);

  const feedback = useMemo(
    () => getFeedbackState(error, runResult, submissionTicket, submissionStatus),
    [error, runResult, submissionTicket, submissionStatus]
  );

  const feedbackTone =
    feedback.tone === "emerald"
      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
      : feedback.tone === "amber"
        ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
        : feedback.tone === "rose"
          ? "border-rose-300/20 bg-rose-300/10 text-rose-100"
          : feedback.tone === "cyan"
            ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
            : "border-white/10 bg-white/5 text-slate-100";

  const FeedbackIcon = feedback.icon;
  const showNextSteps = feedback.tone === "emerald" && recommendations;

  async function submit(kind: "run" | "submit") {
    setLoadingMode(kind);
    setError("");

    try {
      const response = await fetch(`${publicApiBaseUrl}/api/v1/${kind}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          problemSlug: problem.slug,
          language: "cpp17",
          sourceCode,
          input: stdin
        })
      });

      if (!response.ok) {
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
              <p className="text-xs uppercase tracking-[0.22em] opacity-70">建议动作</p>
              <p className="mt-2 text-sm font-medium">
                {feedback.tone === "emerald"
                  ? "继续主线或切到下一题"
                  : feedback.tone === "amber"
                    ? "先修复编译与语法问题"
                    : feedback.tone === "cyan"
                      ? "等待最终判定返回"
                      : "先运行再提交"}
              </p>
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
                <p className="text-xs uppercase tracking-[0.22em] opacity-70">下一课</p>
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
                <p className="text-xs uppercase tracking-[0.22em] opacity-70">主线路径</p>
                <p className="mt-2 text-sm font-medium">{recommendations.pathHome.title}</p>
                <p className="mt-2 text-xs opacity-80">{recommendations.pathHome.label}</p>
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-[28px] border border-white/8 bg-slate-950/55 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Judge Flow</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                从本地试跑到异步提交，当前页面会完整展示判题状态变化。
              </p>
            </div>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
              当前阶段：{currentPhase}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {phases.map((phase, index) => {
              const activeIndex = phases.indexOf(currentPhase);
              const isReached = activeIndex >= index;
              return (
                <div
                  key={phase}
                  className={`rounded-[22px] border px-4 py-4 transition ${
                    isReached
                      ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
                      : "border-white/8 bg-white/5 text-slate-400"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.28em]">{phase}</p>
                  <p className="mt-2 text-sm leading-7">{phaseDescriptions[phase]}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/8 bg-slate-950/55 p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Action Panel</p>
          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={() => submit("run")}
              disabled={loadingMode !== null}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/12 px-4 py-3 text-sm font-medium text-cyan-50 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingMode === "run" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              快速运行
            </button>

            <button
              type="button"
              onClick={() => submit("submit")}
              disabled={loadingMode !== null}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-300/30 bg-violet-300/12 px-4 py-3 text-sm font-medium text-violet-50 transition hover:bg-violet-300/20 disabled:cursor-not-allowed disabled:opacity-70"
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
              disabled={loadingMode !== null}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <RotateCcw className="h-4 w-4" />
              重置代码
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-[20px] border border-white/8 bg-white/5 p-3">
              <div className="flex items-center gap-2 text-cyan-100">
                <Timer className="h-4 w-4" />
                <p className="text-xs uppercase tracking-[0.22em]">执行观察</p>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                先看运行结果，再决定是否进入正式提交。
              </p>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-white/5 p-3">
              <div className="flex items-center gap-2 text-slate-100">
                <Clock3 className="h-4 w-4 text-violet-100" />
                <p className="text-xs uppercase tracking-[0.22em]">提交模式</p>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                会展示队列、运行和完成三个阶段，更接近真实线上判题体验。
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <label className="block rounded-[28px] border border-white/8 bg-slate-950/55 p-4">
          <span className="text-xs uppercase tracking-[0.28em] text-slate-400">Source Code</span>
          <textarea
            value={sourceCode}
            onChange={(event) => setSourceCode(event.target.value)}
            spellCheck={false}
            className="mt-4 h-[420px] w-full resize-none rounded-[22px] border border-white/8 bg-[#070b14] p-4 text-sm leading-7 text-cyan-100 outline-none transition focus:border-cyan-300/25"
          />
        </label>

        <div className="grid gap-4">
          <label className="block rounded-[28px] border border-white/8 bg-slate-950/55 p-4">
            <span className="text-xs uppercase tracking-[0.28em] text-slate-400">
              Standard Input
            </span>
            <textarea
              value={stdin}
              onChange={(event) => setStdin(event.target.value)}
              spellCheck={false}
              className="mt-4 h-32 w-full resize-none rounded-[22px] border border-white/8 bg-[#070b14] p-4 text-sm leading-7 text-emerald-100 outline-none transition focus:border-emerald-300/25"
            />
          </label>

          <div className="rounded-[28px] border border-white/8 bg-slate-950/55 p-4">
            <div className="flex items-center gap-3 text-slate-200">
              <TerminalSquare className="h-5 w-5 text-cyan-100" />
              <p className="text-sm font-medium">Runner Checklist</p>
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
              <li>确认函数名、返回值和题目要求一致。</li>
              <li>如果题目有输入，先在右侧输入框填好测试数据。</li>
              <li>提交前先快速运行一次，更容易定位编译错误。</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/8 bg-slate-950/55 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Console Output</p>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              这里会显示编译信息、运行输出和提交后的最终判定结果。
            </p>
          </div>
          {error ? (
            <span className="rounded-full border border-rose-300/25 bg-rose-300/10 px-3 py-1 text-xs text-rose-100">
              请求异常
            </span>
          ) : null}
        </div>

        <pre className="mt-4 min-h-56 overflow-x-auto rounded-[22px] border border-white/8 bg-[#05070d] p-4 text-sm leading-7 text-slate-200">
          <code>{error || output}</code>
        </pre>
      </div>
    </div>
  );
}
