import { Rocket } from "lucide-react";
import { SettingsButton } from "@/shared/shell/settings";
import { sound } from "@exo/audio";
import { isEngineFrozen } from "@exo/ui";
import "./siteNavbar.css";

import type { SitePage } from "./siteNavigation";
export type { SitePage } from "./siteNavigation";

const pages: { id: SitePage; label: string; href: string }[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "mission", label: "Play Mission", href: "/" },
  { id: "archive", label: "NASA Archive", href: "/?explore=archive" },
  {
    id: "engineering",
    label: "Engineering Lab",
    href: "/?explore=engineering",
  },
  { id: "signal", label: "Orbit & Signal Lab", href: "/?explore=signal" },
];

/** Shared page navigation outside the active mission. */
export function SiteNavbar({
  activePage,
  onNavigate,
}: {
  activePage: SitePage;
  onNavigate(page: SitePage): void;
}) {
  const navigate = (page: SitePage) => {
    if (isEngineFrozen()) return;
    sound.playClick(650);
    onNavigate(page);
  };
  return (
    <header className="site-navbar">
      <button
        type="button"
        className="site-navbar-brand"
        aria-label="Zero To Beyond home"
        onClick={() => navigate("home")}
      >
        <span>
          <Rocket size={25} />
        </span>
        <strong>Zero To Beyond</strong>
      </button>
      <nav className="site-navbar-pages" aria-label="Main pages">
        {pages.map((page) => (
          <a
            key={page.id}
            href={page.href}
            aria-current={activePage === page.id ? "page" : undefined}
            onClick={(event) => {
              if (
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey ||
                event.button !== 0
              )
                return;
              event.preventDefault();
              navigate(page.id);
            }}
          >
            {page.label}
          </a>
        ))}
      </nav>
      <div className="site-navbar-settings">
        <SettingsButton />
      </div>
    </header>
  );
}
