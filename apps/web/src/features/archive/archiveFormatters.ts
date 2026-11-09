/**
 * Date and text formatting utilities for the NASA Mission Archive.
 */

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_MAP: Record<string, string> = {
  jan: "January",
  january: "January",
  feb: "February",
  february: "February",
  mar: "March",
  march: "March",
  apr: "April",
  april: "April",
  may: "May",
  jun: "June",
  june: "June",
  jul: "July",
  july: "July",
  aug: "August",
  august: "August",
  sep: "September",
  sept: "September",
  september: "September",
  oct: "October",
  october: "October",
  nov: "November",
  november: "November",
  dec: "December",
  december: "December",
};

/**
 * Returns ordinal string for a day number: 1st, 2nd, 3rd, 4th, 11th, 21st, etc.
 */
export function getOrdinalSuffix(day: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = day % 100;
  return `${day}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
}

/**
 * Formats date strings into "3rd July, 2026" standard.
 * Supports ISO (2030-08-11), full/abbreviated textual dates, and date ranges.
 */
export function formatOrdinalDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const trimmed = dateStr.trim();
  if (!trimmed) return "";

  // 1. ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const monthIdx = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const monthName = MONTH_NAMES[monthIdx] || "";
    return `${getOrdinalSuffix(day)} ${monthName}, ${year}`;
  }

  // 2. Textual format: "Month Day, Year" or "Month Day Year" (e.g. "Jul 3, 2026", "Feb 18, 2021")
  const mdyRegex =
    /\b([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/g;
  if (mdyRegex.test(trimmed)) {
    return trimmed.replace(mdyRegex, (_, m, d, y) => {
      const monthName = MONTH_MAP[m.toLowerCase()] || m;
      const dayNum = parseInt(d, 10);
      return `${getOrdinalSuffix(dayNum)} ${monthName}, ${y}`;
    });
  }

  // 3. Textual format: "Day Month Year" (e.g. "3 July 2026", "18 Feb 2021")
  const dmyRegex =
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9}),?\s+(\d{4})\b/g;
  if (dmyRegex.test(trimmed)) {
    return trimmed.replace(dmyRegex, (_, d, m, y) => {
      const monthName = MONTH_MAP[m.toLowerCase()] || m;
      const dayNum = parseInt(d, 10);
      return `${getOrdinalSuffix(dayNum)} ${monthName}, ${y}`;
    });
  }

  // 4. Fallback: Parse via Date if non-pure year
  if (!/^\d{4}$/.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const day = parsed.getDate();
      const monthName = MONTH_NAMES[parsed.getMonth()] || "";
      const year = parsed.getFullYear();
      return `${getOrdinalSuffix(day)} ${monthName}, ${year}`;
    }
  }

  return trimmed;
}
