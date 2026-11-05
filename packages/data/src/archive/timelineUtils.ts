import type { TimelineYearItem, TimelineBubble, NasaMissionEvent } from './types';
import { NASA_MISSION_EVENTS } from './events';

/**
 * Returns complete timeline year structures from 1958 to 2030.
 * Formulates the exact bubble representation:
 * - If 1 event: 1 thumbnail bubble
 * - If 2 events: 2 thumbnail bubbles
 * - If > 2 events: 2 thumbnail bubbles + 3rd bubble with dots '...' and moreCount
 */
export function buildTimelineYears(startYear = 1958, endYear = 2030): TimelineYearItem[] {
  const eventMap = new Map<number, NasaMissionEvent[]>();
  NASA_MISSION_EVENTS.forEach(ev => {
    const list = eventMap.get(ev.year) ?? [];
    list.push(ev);
    eventMap.set(ev.year, list);
  });

  const timeline: TimelineYearItem[] = [];
  for (let y = startYear; y <= endYear; y++) {
    const events = eventMap.get(y) ?? [];
    const bubbles: TimelineBubble[] = [];

    if (events.length === 1) {
      bubbles.push({
        id: events[0].id,
        title: events[0].title,
        thumbnail: events[0].thumbnail
      });
    } else if (events.length === 2) {
      bubbles.push(
        { id: events[0].id, title: events[0].title, thumbnail: events[0].thumbnail },
        { id: events[1].id, title: events[1].title, thumbnail: events[1].thumbnail }
      );
    } else if (events.length > 2) {
      // First 2 events get thumbnail bubbles
      bubbles.push(
        { id: events[0].id, title: events[0].title, thumbnail: events[0].thumbnail },
        { id: events[1].id, title: events[1].title, thumbnail: events[1].thumbnail },
        // 3rd bubble represents '...' for the rest
        { id: `${y}-more`, isMore: true, moreCount: events.length - 2 }
      );
    }

    timeline.push({
      year: y,
      hasEvents: events.length > 0,
      events,
      bubbles
    });
  }

  return timeline;
}

/** Get all event thumbnail URLs for preloading */
export function getAllBubbleThumbnailUrls(): string[] {
  const set = new Set<string>();
  NASA_MISSION_EVENTS.forEach(ev => {
    if (ev.thumbnail) set.add(ev.thumbnail);
  });
  return Array.from(set);
}
