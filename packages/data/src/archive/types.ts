// NASA Mission Archive Types

export interface NasaMissionEvent {
  id: string;
  year: number;
  title: string;
  period: string;
  duration: string;
  category:
    | "Crewed"
    | "Planetary"
    | "Astrophysics"
    | "Solar & Space"
    | "Infrastructure"
    | "Defense";
  thumbnail: string;
  description: string;
  highlights: string[];
  nasaUrl: string;
  badge?: string;
}

export interface TimelineBubble {
  id: string;
  title?: string;
  thumbnail?: string;
  isMore?: boolean;
  moreCount?: number;
}

export interface TimelineYearItem {
  year: number;
  hasEvents: boolean;
  events: NasaMissionEvent[];
  bubbles: TimelineBubble[];
}

export const NASA_BUBBLE_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><radialGradient id="bg" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%231e293b"/><stop offset="70%" stop-color="%230f172a"/><stop offset="100%" stop-color="%23020617"/></radialGradient><linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238ce2c2"/><stop offset="100%" stop-color="%230891b2"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(%23bg)"/><circle cx="28" cy="24" r="1.5" fill="%23ffffff" opacity="0.8"/><circle cx="76" cy="30" r="1.5" fill="%238ce2c2" opacity="0.9"/><circle cx="34" cy="74" r="1.2" fill="%23ffffff" opacity="0.6"/><circle cx="72" cy="70" r="1.8" fill="%23ffdf89" opacity="0.8"/><circle cx="50" cy="50" r="22" fill="%23091428" stroke="%2338bdf8" stroke-width="1.5"/><ellipse cx="50" cy="50" rx="34" ry="10" fill="none" stroke="url(%23ring)" stroke-width="2.5" transform="rotate(-24 50 50)"/><circle cx="50" cy="50" r="17" fill="none" stroke="%238ce2c2" stroke-width="0.8" opacity="0.4"/><polygon points="50,40 54,48 62,50 56,56 57,64 50,60 43,64 44,56 38,50 46,48" fill="%23ffdf89" opacity="0.95"/></svg>`;
