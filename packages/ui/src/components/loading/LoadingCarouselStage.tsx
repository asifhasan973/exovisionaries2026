import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LoadingSlide } from '../../types/loading';

export interface LoadingCarouselStageProps {
  currentSlide?: LoadingSlide;
  statusMessage: string;
  displayedProgress: number;
}

export const LoadingCarouselStage: React.FC<LoadingCarouselStageProps> = ({
  currentSlide,
  statusMessage,
  displayedProgress,
}) => {
  return (
    <motion.div
      key="carousel-stage"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* FULL-SCREEN CAROUSEL BACKGROUND */}
      <div className="loading-carousel-container" aria-hidden="true">
        <AnimatePresence mode="popLayout">
          {currentSlide && (
            <motion.img
              key={currentSlide.id}
              src={currentSlide.image}
              alt=""
              className="loading-slide-image"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
              loading="eager"
            />
          )}
        </AnimatePresence>
        <div className="loading-vignette" />
      </div>

      {/* TOP HUD HEADER */}
      <header className="loading-hud-header">
        <div className="loading-hud-brand">
          <span className="loading-hud-pulse" aria-hidden="true" />
          <span className="loading-hud-title">EXOVISIONARIES · FLIGHT INITIALIZATION</span>
        </div>
      </header>

      {/* BOTTOM HUD FOOTER (CAPTION CARD + GLOWING PROGRESS BAR FROM ZERO) */}
      <footer className="loading-hud-footer">
        <AnimatePresence mode="wait">
          {currentSlide && (
            <motion.div
              key={currentSlide.id}
              className="loading-caption-card"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {currentSlide.tag && (
                <span className="loading-caption-tag">✦ {currentSlide.tag}</span>
              )}
              <h2 className="loading-caption-title">{currentSlide.title}</h2>
              <p className="loading-caption-desc">{currentSlide.caption}</p>
              {currentSlide.credit && (
                <span className="loading-caption-credit">Image credit: {currentSlide.credit}</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="loading-progress-cluster">
          <div className="loading-progress-metrics">
            <span className="loading-status-text">
              <span className="loading-hud-pulse" style={{ width: 6, height: 6 }} />
              {statusMessage}
            </span>
            <span className="loading-percentage-value">{displayedProgress}%</span>
          </div>

          <div
            className="loading-bar-track"
            role="progressbar"
            aria-valuenow={displayedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Mission initialization progress"
          >
            <motion.div
              className="loading-bar-fill"
              initial={{ width: '0%' }}
              animate={{ width: `${displayedProgress}%` }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
            />
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

