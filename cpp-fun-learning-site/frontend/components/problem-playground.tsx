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
import { buildAuthAccessHref } from "../lib/auth-links";
import type { ProblemDetailApproachVariant } from "../lib/experiments";
import { formatLearningTitle } from "../lib/problem-labels";

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

function getModeLabel(mode: string | null | undefined) {
  if (!mode) return "试跑";
  if (mode === "submit") return "正式提交";
  if (mode === "run") return "试跑";
  return mode;
}

function formatExecutionStatus(value: string | null | undefined) {
  if (!value) return "待处理";

  const statusMap: Record<string, string> = {
    READY: "准备中",
    QUEUED: "排队中",
    RUNNING: "运行中",
    FINISHED: "已完成",
    ACCEPTED: "通过",
    NEEDS_WORK: "待补全",
    COMPILE_ERROR: "编译错误",
    RUN_FINISHED: "试跑完成"
  };

  return statusMap[value] ?? value;
}

type ProblemPlaygroundProps = {
  problem: ProblemDetail;
  variant?: ProblemDetailApproachVariant;
  recommendations?: {
    nextLesson?: RecommendationLink;
    nextProblem?: RecommendationLink;
    pathHome?: RecommendationLink;
  };
};

const phases = ["READY", "QUEUED", "RUNNING", "FINISHED"] as const;

const phaseLabels: Record<(typeof phases)[number], string> = {
  READY: "准备中",
  QUEUED: "排队中",
  RUNNING: "运行中",
  FINISHED: "已完成"
};

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
    if (runResult.status === "NEEDS_WORK") {
      return {
        title: "还差一步",
        tone: "amber",
        icon: AlertTriangle,
        summary: "起始代码还没补完整，先补齐关键输出或核心逻辑，再继续试跑。"
      } as const;
    }

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

export function ProblemPlayground({
  problem,
  variant = "a",
  recommendations
}: ProblemPlaygroundProps) {
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
        `状态：${formatExecutionStatus(submissionStatus.status)}`,
        `结果：${formatExecutionStatus(submissionStatus.result || "待判定")}`,
        submissionStatus.detail ? `说明：${submissionStatus.detail}` : "",
        submissionStatus.finishedAt ? `完成时间：${submissionStatus.finishedAt}` : ""
      ].filter(Boolean);
    }

    if (submissionTicket) {
      return [
        `状态：${formatExecutionStatus(submissionTicket.status)}`,
        `任务编号：${submissionTicket.submissionId}`,
        `排队位置：${submissionTicket.queuePosition}`,
        `预计完成：${submissionTicket.etaSeconds} 秒`
      ];
    }

    if (runResult) {
      return [
        `状态：${formatExecutionStatus(runResult.status)}`,
        `运行耗时：${runResult.executionMs} 毫秒`,
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
      ? "site-note--success"
      : feedback.tone === "amber"
        ? "site-note--warning"
        : feedback.tone === "rose"
          ? "site-note--danger"
          : feedback.tone === "cyan"
            ? "site-note--info"
            : "site-note--info";

  const FeedbackIcon = feedback.icon;
  const showNextSteps = feedback.tone === "emerald" && recommendations;
  const phaseIndex = phases.findIndex((phase) => phase === currentPhase);
  const codeLineCount = sourceCode.split("\n").length;
  const stdout = submissionStatus?.stdout || runResult?.stdout || "暂无输出";
  const compileOutput = submissionStatus?.compileOutput || runResult?.compileOutput || "暂无编译信息";

  const summaryCards = [
    {
      label: "执行模式",
      value: getModeLabel(
        submissionStatus?.mode ||
          submissionTicket?.mode ||
          runResult?.mode ||
          (loadingMode === "submit" ? "submit" : "run")
      ),
      tone: "text-cyan-100"
    },
    {
      label: "代码行数",
      value: `${codeLineCount}`,
      tone: "text-violet-100"
    },
    {
      label: "样例可切换",
      value: `${problem.examples.length}`,
      tone: "text-amber-100"
    }
  ];
  const modeBanner =
    variant === "a"
      ? {
          eyebrow: "先试跑",
          title: "先试跑样例，快速看见反馈",
          description:
            "推荐顺序：装入样例输入 → 点击试跑 → 根据输出和编译信息补修代码 → 再正式提交。"
        }
      : {
          eyebrow: "先读题",
          title: "先确认题意和通过条件，再运行",
          description:
            "推荐顺序：先对照题目说明与样例 → 写最小可运行版本 → 试跑验证 → 再进入正式提交。"
        };

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
    <div className="grid gap-5">
      <div className={`site-note rounded-[30px] p-5 sm:p-6 ${feedbackTone}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="admin-step-badge">
              <FeedbackIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="soft-kicker opacity-80">控制反馈</p>
              <h3 className="mt-2 text-[1.3rem] font-semibold leading-[1.24]">{feedback.title}</h3>
              <p className="mt-2 max-w-2xl text-[15px] leading-8 opacity-90">{feedback.summary}</p>
            </div>
          </div>

          <div className="playground-status-grid grid min-w-[220px] gap-3 sm:grid-cols-2">
            <div className="admin-subcard admin-subcard--muted playground-status-card p-3">
              <p className="text-[0.8rem] uppercase tracking-[0.12em] opacity-70">当前阶段</p>
              <p className="mt-2 text-[15px] font-medium">{phaseLabels[currentPhase]}</p>
            </div>
            <div className="admin-subcard admin-subcard--muted playground-status-card p-3">
              <p className="text-[0.8rem] uppercase tracking-[0.12em] opacity-70">阶段说明</p>
              <p className="mt-2 text-[15px] leading-7 font-medium">{phaseDescriptions[currentPhase]}</p>
            </div>
          </div>
        </div>

        <div className="playground-phase-grid mt-5 grid gap-3 sm:grid-cols-4">
          {phases.map((phase, index) => {
            const active = index <= phaseIndex;

            return (
              <div
                key={phase}
                className={`admin-subcard playground-phase-card px-4 py-3 transition ${active ? "" : "opacity-70"}`}
              >
                <p className="text-[0.8rem] uppercase tracking-[0.12em] opacity-70">阶段 {index + 1}</p>
                <p className="mt-2 text-[15px] font-medium">{phaseLabels[phase]}</p>
              </div>
            );
          })}
        </div>

        {showNextSteps ? (
          <div className="playground-recommend-grid mt-5 grid gap-3 md:grid-cols-3">
            {recommendations.nextLesson ? (
              <Link
                href={recommendations.nextLesson.href}
                className="surface-card playground-recommend-card rounded-[22px] p-4 transition hover:-translate-y-1"
              >
                <p className="text-[0.8rem] uppercase tracking-[0.12em] opacity-70">下一节课</p>
                <p className="mt-2 text-[15px] font-medium">
                  {formatLearningTitle(recommendations.nextLesson.title)}
                </p>
                <p className="mt-2 text-[13px] opacity-80">{recommendations.nextLesson.label}</p>
              </Link>
            ) : null}

            {recommendations.nextProblem ? (
              <Link
                href={recommendations.nextProblem.href}
                className="surface-card playground-recommend-card rounded-[22px] p-4 transition hover:-translate-y-1"
              >
                <p className="text-[0.8rem] uppercase tracking-[0.12em] opacity-70">下一题</p>
                <p className="mt-2 text-[15px] font-medium">
                  {formatLearningTitle(recommendations.nextProblem.title)}
                </p>
                <p className="mt-2 text-[13px] opacity-80">{recommendations.nextProblem.label}</p>
              </Link>
            ) : null}

            {recommendations.pathHome ? (
              <Link
                href={recommendations.pathHome.href}
                className="surface-card playground-recommend-card rounded-[22px] p-4 transition hover:-translate-y-1"
              >
                <p className="text-[0.8rem] uppercase tracking-[0.12em] opacity-70">返回路线</p>
                <p className="mt-2 text-[15px] font-medium">
                  {formatLearningTitle(recommendations.pathHome.title)}
                </p>
                <p className="mt-2 text-[13px] opacity-80">{recommendations.pathHome.label}</p>
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="playground-shell-grid grid gap-5 xl:grid-cols-2">
        <div className="panel-shell rounded-[34px] p-5 sm:p-6">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="soft-kicker">代码面板</p>
                <h3 className="mt-2 editorial-title text-[1.5rem] leading-[1.22] text-white md:text-[1.62rem]">
                  {formatLearningTitle(problem.title)}
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="site-chip site-chip--accent">
                  C++17
                </span>
                <span className="site-chip site-chip--muted">
                  已载入起始代码
                </span>
              </div>
            </div>

            <div className="admin-subcard mt-5 px-4 py-4">
              <p className="soft-kicker">{modeBanner.eyebrow}</p>
              <p className="mt-2 text-[1.02rem] font-semibold leading-7 text-white">{modeBanner.title}</p>
              <p className="mt-2 text-[15px] leading-8 text-slate-200">{modeBanner.description}</p>
            </div>

            <div className="playground-summary-grid mt-5 grid gap-3 md:grid-cols-3">
              {summaryCards.map((card) => (
                <div key={card.label} className="admin-subcard playground-summary-card p-4">
                  <p className="soft-kicker">{card.label}</p>
                  <p className={`mt-3 text-[1.08rem] font-semibold leading-7 ${card.tone}`}>{card.value}</p>
                </div>
              ))}
            </div>

            <div className="page-action-row mt-5">
              <button
                type="button"
                onClick={() => {
                  void submit("run");
                }}
                disabled={loadingMode !== null}
                className={`px-5 py-3 text-[15px] font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                  variant === "a" ? "nav-pill nav-pill--accent" : "nav-pill"
                }`}
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
                className={`px-5 py-3 text-[15px] font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                  variant === "a" ? "nav-pill nav-pill--success" : "nav-pill nav-pill--accent"
                }`}
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
                className="nav-pill px-5 py-3 text-[15px] font-medium"
              >
                <RotateCcw className="h-4 w-4" />
                重置
              </button>
            </div>

            {problem.examples.length > 0 ? (
              <div className="surface-card mt-5 rounded-[24px] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[15px] font-medium text-white md:text-base">快速载入样例输入</p>
                  <span className="text-[0.8rem] uppercase tracking-[0.12em] text-slate-400">
                    样例输入预设
                  </span>
                </div>
                <div className="page-tag-group page-tag-group--tight mt-3">
                  {problem.examples.map((example, index) => (
                    <button
                      key={`${example.input}-${index}`}
                      type="button"
                      onClick={() => setStdin(example.input)}
                      className="site-chip site-chip--muted"
                    >
                      样例 {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="page-empty-state page-empty-state--compact mt-5">
                <p className="page-empty-state__title">当前没有预设样例</p>
                <p className="page-empty-state__body">可以先手动输入一组测试数据，再试跑代码。</p>
              </div>
            )}

            <textarea
              value={sourceCode}
              onChange={(event) => setSourceCode(event.target.value)}
              className="code-surface mt-5 min-h-[460px] w-full px-5 py-4 font-mono text-[14px] leading-7 outline-none"
              spellCheck={false}
            />
          </div>
        </div>

        <div className="playground-side-stack grid gap-5">
          <div className="panel-shell playground-side-panel rounded-[34px] p-5 sm:p-6">
            <div className="relative z-10">
              <div className="flex items-center gap-3 text-slate-100">
                <TerminalSquare className="h-5 w-5 text-cyan-100" />
                <div>
                  <p className="soft-kicker">输入面板</p>
                  <p className="mt-1 text-[15px] font-medium text-white md:text-base">输入与结果摘要</p>
                </div>
              </div>

              <label className="mt-5 grid gap-2">
                <span className="text-[0.8rem] uppercase tracking-[0.12em] text-slate-400">标准输入</span>
                <textarea
                  value={stdin}
                  onChange={(event) => setStdin(event.target.value)}
                  className="code-surface min-h-[150px] rounded-[22px] px-4 py-3 font-mono text-[14px] leading-7 outline-none"
                />
              </label>

              <div className="surface-card mt-5 rounded-[22px] p-4">
                <p className="text-[0.8rem] uppercase tracking-[0.12em] text-slate-400">结果摘要</p>
                <div className="mt-3 space-y-2 text-[15px] leading-8 text-slate-200">
                  {resultLines.map((item, index) => (
                    <p key={`${item}-${index}`}>{item}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="panel-shell playground-side-panel rounded-[34px] p-5 sm:p-6">
            <div className="relative z-10">
              <div className="flex items-center gap-3 text-slate-100">
                <Timer className="h-5 w-5 text-amber-100" />
                <div>
                  <p className="soft-kicker">输出面板</p>
                  <p className="mt-1 text-[15px] font-medium text-white md:text-base">程序输出与编译信息</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="admin-subcard admin-subcard--muted p-4">
                  <p className="text-[0.8rem] uppercase tracking-[0.12em] text-slate-400">标准输出</p>
                  <pre className="mt-3 whitespace-pre-wrap font-mono text-[14px] leading-7 text-slate-100">
                    {stdout}
                  </pre>
                </div>
                <div className="admin-subcard admin-subcard--muted p-4">
                  <p className="text-[0.8rem] uppercase tracking-[0.12em] text-slate-400">编译输出</p>
                  <pre className="mt-3 whitespace-pre-wrap font-mono text-[14px] leading-7 text-slate-100">
                    {compileOutput}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-shell playground-side-panel rounded-[34px] p-5 sm:p-6">
            <div className="relative z-10">
              <div className="flex items-center gap-3 text-slate-100">
                <ArrowRight className="h-5 w-5 text-emerald-100" />
                <div>
                  <p className="soft-kicker">提交规则</p>
                  <p className="mt-1 text-[15px] font-medium text-white md:text-base">账号隔离与记录归属</p>
                </div>
              </div>
              <p className="mt-4 text-[15px] leading-8 text-slate-300">
                正式提交需要登录账号。登录后，提交记录、状态流和通过结果都会绑定到当前用户，其他使用者无法访问。
              </p>
              <div className="mt-5">
                <Link
                  href={buildAuthAccessHref({ mode: "login", redirectTo: `/problems/${problem.slug}` })}
                  className="nav-pill nav-pill--success px-4 py-2 text-[15px] font-medium"
                >
                  去登录 / 注册
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
