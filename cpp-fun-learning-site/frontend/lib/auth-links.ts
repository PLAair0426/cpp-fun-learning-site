export type AuthAccessMode = "login" | "register";
export type AuthAccessContext = "default" | "admin";

type BuildAuthAccessHrefOptions = {
  mode?: AuthAccessMode;
  redirectTo?: string;
  context?: AuthAccessContext;
};

function normalizeRedirectTo(redirectTo?: string) {
  if (!redirectTo || !redirectTo.startsWith("/")) {
    return undefined;
  }

  return redirectTo;
}

export function buildAuthAccessHref({
  mode = "login",
  redirectTo,
  context = "default"
}: BuildAuthAccessHrefOptions = {}) {
  const searchParams = new URLSearchParams();
  searchParams.set("mode", mode);

  const safeRedirect = normalizeRedirectTo(redirectTo);
  if (safeRedirect) {
    searchParams.set("redirect", safeRedirect);
  }

  if (context !== "default") {
    searchParams.set("context", context);
  }

  return `/auth/access?${searchParams.toString()}`;
}

