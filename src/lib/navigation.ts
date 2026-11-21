export type PublicRoute = "/" | "/privacy" | "/terms";

export function normalizeAppPath(pathname: string): PublicRoute {
  const cleaned = (pathname || "/").replace(/\/+$/, "") || "/";
  if (cleaned === "/privacy") return "/privacy";
  if (cleaned === "/terms") return "/terms";
  return "/";
}

export function getCurrentAppPath(): PublicRoute {
  if (typeof window === "undefined") return "/";
  return normalizeAppPath(window.location.pathname);
}

const listeners = new Set<(path: PublicRoute) => void>();

export function navigateToPath(target: PublicRoute): void {
  if (typeof window === "undefined") return;
  const next = normalizeAppPath(target);
  if (normalizeAppPath(window.location.pathname) !== next) {
    window.history.pushState({ path: next }, "", next);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
  listeners.forEach(cb => cb(next));
}

export function subscribeToNavigation(cb: (path: PublicRoute) => void): () => void {
  listeners.add(cb);
  const handlePopState = () => {
    cb(getCurrentAppPath());
  };
  if (typeof window !== "undefined") {
    window.addEventListener("popstate", handlePopState);
  }
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener("popstate", handlePopState);
    }
  };
}
