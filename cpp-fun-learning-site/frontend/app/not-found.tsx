import Link from "next/link";

export default function NotFound() {
  return (
    <div className="panel-shell mx-auto mt-24 max-w-2xl rounded-[32px] px-8 py-12 text-center">
      <p className="text-sm uppercase tracking-[0.4em] text-cyan-200/70">Signal Lost</p>
      <h1 className="mt-4 text-4xl font-semibold text-white">这个关卡暂时没有找到</h1>
      <p className="mt-4 text-base leading-7 text-slate-300">
        可能是路径代号变更，或者这部分内容还在从原始课件资产里继续整理。
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/18"
        >
          返回首页
        </Link>
        <Link
          href="/problems"
          className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
        >
          进入练习场
        </Link>
      </div>
    </div>
  );
}
