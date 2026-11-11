import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { NASA_BUBBLE_PLACEHOLDER } from "@exo/engine";
import type { NasaLiveMediaItem } from "@/shared/services/nasaApiService";
import { sound } from "@exo/audio";
import { formatOrdinalDate } from "./archiveFormatters";

interface LiveMediaSectionProps {
  liveMedia: NasaLiveMediaItem[];
  year: number;
}

const TRUNCATE_LIMIT = 110;

export const LiveMediaSection: React.FC<LiveMediaSectionProps> = ({
  liveMedia,
  year,
}) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {},
  );

  const toggleExpand = (id: string) => {
    sound.playClick(650);
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!liveMedia || liveMedia.length === 0) return null;

  return (
    <div className="tree-live-media-section">
      <div className="live-media-heading">
        <Sparkles size={14} className="text-amber-200" />
        <span>NASA IMAGE & VIDEO LIBRARY ARCHIVAL RECORDS ({year})</span>
      </div>

      <div className="live-media-grid">
        {liveMedia.map((item) => {
          const isExpanded = Boolean(expandedCards[item.nasaId]);
          const isLong = item.description.length > TRUNCATE_LIMIT;
          const displayText =
            isLong && !isExpanded
              ? `${item.description.slice(0, TRUNCATE_LIMIT)}…`
              : item.description;

          return (
            <div key={item.nasaId} className="live-media-card">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="live-media-img"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = NASA_BUBBLE_PLACEHOLDER;
                  }}
                />
              )}
              <div className="live-media-caption">
                <span className="live-media-date">
                  {formatOrdinalDate(item.dateCreated)}
                </span>
                <strong className="live-media-title">{item.title}</strong>
                <p className="live-media-desc">
                  <span>{displayText}</span>
                  {isLong && (
                    <button
                      type="button"
                      className="see-more-toggle-btn"
                      onClick={() => toggleExpand(item.nasaId)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? "See less" : "See more"}
                    </button>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
