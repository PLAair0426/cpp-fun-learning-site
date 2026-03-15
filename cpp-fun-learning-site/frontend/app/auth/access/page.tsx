import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthAccessPanel } from "../../../components/auth-access-panel";
import type { AuthAccessContext, AuthAccessMode } from "../../../lib/auth-links";

type SearchParams = Promise<{
  mode?: string | string[];
  redirect?: string | string[];
  context?: string | string[];
}>;

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveMode(value: string | undefined): AuthAccessMode {
  return value === "register" ? "register" : "login";
}

function resolveContext(value: string | undefined): AuthAccessContext {
  return value === "admin" ? "admin" : "default";
}

function resolveRedirect(value: string | undefined, context: AuthAccessContext) {
  if (value && value.startsWith("/")) {
    return value;
  }

  return context === "admin" ? "/admin" : "/auth";
}

export default async function AuthAccessPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const context = resolveContext(pickSingle(resolvedSearchParams.context));
  const mode = context === "admin" ? "login" : resolveMode(pickSingle(resolvedSearchParams.mode));
  const redirectTo = resolveRedirect(pickSingle(resolvedSearchParams.redirect), context);

  return (
    <div className="learn-page space-y-8 pb-10">
      <Link href={redirectTo === "/admin" ? "/admin" : "/auth"} className="nav-pill learn-page__back w-fit px-4 py-2 text-sm font-medium">
        <ArrowLeft className="h-4 w-4" />
        返回上一页
      </Link>

      <section className="panel-shell rounded-[40px] px-6 py-8 sm:px-8 sm:py-9">
        <div className="max-w-3xl">
          <p className="soft-kicker">{context === "admin" ? "后台登录页" : "账号访问页"}</p>
          <h1 className="mt-3 editorial-title text-[2.4rem] leading-[1.14] text-white md:text-[3rem]">
            {context === "admin" ? "先完成管理员登录，再进入后台。" : "登录和注册已经迁移到独立页面。"}
          </h1>
          <p className="mt-4 text-[15px] leading-8 text-slate-300 md:text-base">
            {context === "admin"
              ? "完成登录后会自动回到后台入口，继续管理用户、课程内容和运营数据。"
              : "完成账号操作后会自动返回对应页面，账号中心只保留个人状态与记录展示。"}
          </p>
        </div>
      </section>

      <AuthAccessPanel initialMode={mode} redirectTo={redirectTo} context={context} />
    </div>
  );
}
