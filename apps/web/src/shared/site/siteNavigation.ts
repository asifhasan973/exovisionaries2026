export type SitePage =
  "home" | "mission" | "archive" | "engineering" | "atlas" | "signal";

export function navigatePage(page: SitePage) {
  window.location.assign(
    page === "home"
      ? "/"
      : page === "mission"
        ? "/?play=1"
        : `/?explore=${page}`,
  );
}
