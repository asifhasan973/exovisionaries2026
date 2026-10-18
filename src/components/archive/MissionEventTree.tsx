import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  Rocket,
  Compass,
  CheckCircle2,
  Loader2,
  Globe,
  Radio
} from 'lucide-react';
import { NASA_MISSION_EVENTS, NasaMissionEvent, NASA_BUBBLE_PLACEHOLDER } from '../../data/nasaArchiveData';
import { fetchNasaYearUpdates, NasaLiveMediaItem } from '../../services/nasaApiService';
import { sound } from '../../audio/soundEngine';

interface MissionEventTreeProps {
  year: number | null;
  selectedEventId?: string | null;
  onClose: () => void;
  isVisible: boolean;
}

export const MissionEventTree: React.FC<MissionEventTreeProps> = ({
  year,
  selectedEventId,
  onClose,
  isVisible
}) => {
  const [events, setEvents] = useState<NasaMissionEvent[]>([]);
  const [liveMedia, setLiveMedia] = useState<NasaLiveMediaItem[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);

  useEffect(() => {
    if (!year) {
      setEvents([]);
      setLiveMedia([]);
      return;
    }

    // Load bundled curated events for this year immediately
    const bundled = NASA_MISSION_EVENTS.filter((e) => e.year === year);
    setEvents(bundled);

    // Asynchronously fetch live NASA image library enrichment on demand
    let isCancelled = false;
    setIsLoadingLive(true);

    fetchNasaYearUpdates(year, bundled.length > 0 ? bundled[0].title.split(' ')[0] : 'NASA')
      .then((items) => {
        if (!isCancelled) {
          setLiveMedia(items);
          setIsLoadingLive(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsLoadingLive(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [year]);

  if (!year) return null;

  return (
    <div className={`nasa-event-tree-panel ${isVisible ? 'is-slid-in' : 'is-slid-down'}`}>
      {/* Panel Navigation Bar */}
      <div className="tree-panel-header">
        <button
          type="button"
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="tree-back-button group"
          title="Return to Horizontal Timeline"
        >
          <ArrowLeft size={16} className="transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Year Timeline</span>
        </button>

        <div className="tree-header-title-block">
          <span className="tree-year-badge font-mono">
            <Radio size={13} className="text-cyan-400 animate-pulse" />
            <span>YEAR {year} MANIFEST</span>
          </span>
          <h2 className="tree-heading">
            {events.length > 0 ? events[0].title.split('—')[0].trim() : `NASA Events in ${year}`}
          </h2>
        </div>

        <div className="tree-header-meta">
          <span className="tree-count-pill font-mono">
            {events.length} {events.length === 1 ? 'MISSION RECORD' : 'MISSION RECORDS'}
          </span>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="tree-panel-body">
        {/* On-Demand Loading Spinner */}
        {isLoadingLive && (
          <div className="tree-live-sync-indicator" role="status">
            <Loader2 size={16} className="animate-spin text-cyan-400" />
            <span>Synchronizing live imagery with NASA Image & Video Library archives…</span>
          </div>
        )}

        {/* Tree Track and Events */}
        {events.length > 0 ? (
          <div className="tree-structure-container">
            <div className="tree-vertical-spine" aria-hidden="true" />

            <div className="tree-events-list">
              <AnimatePresence>
                {events.map((event, idx) => {
                  const isHighlight = selectedEventId === event.id;

                  return (
                    <motion.article
                      key={event.id}
                      className={`tree-event-card ${isHighlight ? 'is-highlighted' : ''}`}
                      initial={{ opacity: 0, x: -35 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{
                        duration: 0.45,
                        delay: idx * 0.12,
                        ease: [0.25, 0.45, 0.3, 1]
                      }}
                    >
                      {/* Spine Connector Node */}
                      <div className="event-spine-node">
                        <span className="spine-dot" />
                        <span className="spine-pulse" />
                      </div>

                      {/* Card Inner Content */}
                      <div className="event-card-inner">
                        {/* Header Badges */}
                        <div className="event-card-top">
                          <span className="event-category-badge">
                            {event.category === 'Crewed' && <Rocket size={12} />}
                            {event.category === 'Planetary' && <Globe size={12} />}
                            {event.category === 'Astrophysics' && <Sparkles size={12} />}
                            {event.category === 'Solar & Space' && <Radio size={12} />}
                            {event.category === 'Infrastructure' && <Compass size={12} />}
                            <span>{event.category.toUpperCase()}</span>
                          </span>

                          <div className="event-time-badges">
                            <span className="time-pill period-pill">
                              <Calendar size={12} className="text-cyan-400" />
                              <span>{event.period}</span>
                            </span>
                            <span className="time-pill duration-pill">
                              <Clock size={12} className="text-amber-400" />
                              <span>{event.duration}</span>
                            </span>
                          </div>
                        </div>

                        {/* Event Title */}
                        <h3 className="event-card-title">{event.title}</h3>

                        {/* Media Banner & Description Grid */}
                        <div className="event-media-grid">
                          <div className="event-thumbnail-box">
                            <img
                              src={event.thumbnail || NASA_BUBBLE_PLACEHOLDER}
                              alt={event.title}
                              className="event-img"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = NASA_BUBBLE_PLACEHOLDER;
                              }}
                            />
                            <div className="thumbnail-lens-flare" />
                          </div>

                          <div className="event-copy-box">
                            <p className="event-description">{event.description}</p>

                            {/* Highlighted Milestones */}
                            {event.highlights && event.highlights.length > 0 && (
                              <div className="event-highlights-list">
                                {event.highlights.map((hl, hIdx) => (
                                  <div key={hIdx} className="highlight-item">
                                    <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                                    <span>{hl}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Action Link: Redirect to official NASA page */}
                            <div className="event-actions-bar">
                              <a
                                href={event.nasaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="event-redirect-btn group"
                                onClick={() => sound.playClick(800)}
                              >
                                <span>Official NASA Mission Page</span>
                                <ExternalLink
                                  size={14}
                                  className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                                />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="tree-empty-state">
            <Compass size={40} className="text-slate-600 mb-3" />
            <h3 className="text-base text-slate-300 font-semibold mb-1">
              No Primary Milestones Cataloged for {year}
            </h3>
            <p className="text-xs text-slate-400 max-w-md text-center">
              NASA operational milestones in this year focused on ongoing orbital missions, planetary cruise phases, or ground aerospace research.
            </p>
          </div>
        )}

        {/* Live Enriched Media Library Strip */}
        {liveMedia.length > 0 && (
          <div className="tree-live-media-section">
            <div className="live-media-heading">
              <Sparkles size={14} className="text-amber-400" />
              <span>NASA IMAGE & VIDEO LIBRARY ARCHIVAL RECORDS ({year})</span>
            </div>

            <div className="live-media-grid">
              {liveMedia.map((item) => (
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
                    <span className="live-media-date">{item.dateCreated}</span>
                    <strong className="live-media-title">{item.title}</strong>
                    <p className="live-media-desc">{item.description.slice(0, 110)}…</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
