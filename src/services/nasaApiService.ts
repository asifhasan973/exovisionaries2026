// NASA Image and Video Library Live Integration Service
// Fetches real-time mission assets and imagery from images-api.nasa.gov with offline fallback

export interface NasaLiveMediaItem {
  nasaId: string;
  title: string;
  description: string;
  dateCreated: string;
  center?: string;
  imageUrl?: string;
  keywords?: string[];
}

const memoryCache = new Map<string, NasaLiveMediaItem[]>();

/**
 * Queries NASA's public Image and Video Library API for historical mission media.
 * Does not require an API key and supports CORS for browser applications.
 */
export async function fetchNasaYearUpdates(year: number, query = 'mission'): Promise<NasaLiveMediaItem[]> {
  const cacheKey = `${year}_${query}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // Check localStorage cache if available
  try {
    const stored = window.localStorage.getItem(`nasa_archive_${cacheKey}`);
    if (stored) {
      const parsed = JSON.parse(stored) as NasaLiveMediaItem[];
      memoryCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch {}

  const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&year_start=${year}&year_end=${year}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6500); // 6.5s timeout

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const json = await response.json();
    const items = json?.collection?.items || [];

    const mapped: NasaLiveMediaItem[] = items.slice(0, 6).map((item: {
      data?: Array<{
        nasa_id?: string;
        title?: string;
        description?: string;
        date_created?: string;
        center?: string;
        keywords?: string[];
      }>;
      links?: Array<{ href?: string; rel?: string }>;
    }) => {
      const data = item.data?.[0] || {};
      const imageLink = item.links?.find(l => l.rel === 'preview')?.href;
      return {
        nasaId: data.nasa_id || `nasa-${Math.random()}`,
        title: data.title || 'NASA Mission Record',
        description: data.description || '',
        dateCreated: data.date_created ? data.date_created.substring(0, 10) : String(year),
        center: data.center || 'NASA',
        imageUrl: imageLink,
        keywords: data.keywords || []
      };
    });

    memoryCache.set(cacheKey, mapped);
    try {
      window.localStorage.setItem(`nasa_archive_${cacheKey}`, JSON.stringify(mapped));
    } catch {}

    return mapped;
  } catch {
    // Return empty list on timeout or network error so UI falls back seamlessly to bundled records
    return [];
  }
}
