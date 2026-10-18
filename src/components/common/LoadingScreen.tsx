import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoadingStore } from '../../state/loadingStore';
import { preloadImage } from '../../engine/loadingEngine';
import { LOADING_CONFIG } from '../../config/loadingConfig';
import './loadingScreen.css';

export const LoadingScreen: React.FC = () => {
  const isLoading = useLoadingStore(s => s.isLoading);
  const isPaused = useLoadingStore(s => s.isPaused);
  const backendProgress = useLoadingStore(s => s.progress);
  const slides = useLoadingStore(s => s.slides);
  const statusMessage = useLoadingStore(s => s.statusMessage);
  const activeContext = useLoadingStore(s => s.activeContext);
  const showIntroSplashStore = useLoadingStore(s => s.showIntroSplash);
  const completeLoading = useLoadingStore(s => s.completeLoading);
  const setIntroSplashShown = useLoadingStore(s => s.setIntroSplashShown);

  // Splash visibility for the active loading sequence
  const [showSplash, setShowSplash] = useState(showIntroSplashStore);
  const [splashFinished, setSplashFinished] = useState(!showIntroSplashStore);

  // Carousel & displayed progress (starts strictly from 0 once splash completes)
  const [activeSlide, setActiveSlide] = useState(0);
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [isScreenExiting, setIsScreenExiting] = useState(false);

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const splashRemainingMs = useRef(LOADING_CONFIG.introSplashDisplayMs);
  const splashLastStartRef = useRef<number | null>(null);
  const slideRemainingMs = useRef(LOADING_CONFIG.slideDisplayMinMs);
  const slideLastStartRef = useRef<number | null>(null);

  // --------------------------------------------------------------------------
  // Reset state on new loading session or context switch
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (isLoading) {
      setShowSplash(showIntroSplashStore);
      setSplashFinished(!showIntroSplashStore);
      setDisplayedProgress(0);
      setIsScreenExiting(false);
      setActiveSlide(0);
      splashRemainingMs.current = LOADING_CONFIG.introSplashDisplayMs;
      splashLastStartRef.current = null;
      slideRemainingMs.current = LOADING_CONFIG.slideDisplayMinMs;
      slideLastStartRef.current = null;
    }
  }, [isLoading, activeContext, showIntroSplashStore]);

  // --------------------------------------------------------------------------
  // Phase 1: Intro Splash Timing (pausable with exact millisecond preservation)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isLoading || !showSplash) {
      return;
    }

    // Preload first carousel image concurrently while text animates
    if (slides.length > 0) {
      preloadImage(slides[0].image).catch(() => { });
    }

    // Freeze splash screen timer while blocked in portrait orientation
    if (isPaused) {
      return;
    }

    splashLastStartRef.current = performance.now();
    const timer = setTimeout(() => {
      setShowSplash(false);
      setIntroSplashShown();
    }, splashRemainingMs.current);

    return () => {
      clearTimeout(timer);
      if (splashLastStartRef.current !== null) {
        const elapsed = performance.now() - splashLastStartRef.current;
        splashRemainingMs.current = Math.max(50, splashRemainingMs.current - elapsed);
        splashLastStartRef.current = null;
      }
    };
  }, [isLoading, showSplash, slides, setIntroSplashShown, isPaused]);

  // --------------------------------------------------------------------------
  // Phase 2: Progress Bar from Zero (starts once splash is finished)
  // Multiplier mechanism simulates weak network delay by scaling loading speed
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isLoading || !splashFinished) {
      return;
    }

    let isCancelled = false;
    const multiplier = Math.max(1, LOADING_CONFIG.progressMultiplier);

    // Ticks occur `multiplier` times slower (e.g. 25ms * multiplier)
    const tickInterval = Math.round(25 * multiplier);

    // Smoothly animate displayedProgress from 0% towards backendProgress
    const interval = setInterval(() => {
      if (isCancelled || isPausedRef.current) return;

      setDisplayedProgress(prev => {
        const target = useLoadingStore.getState().progress;
        if (prev < target) {
          // Dynamic step: adjust rate to keep progress bar motion fluid and realistic
          const rawStep = Math.ceil((target - prev) * 0.15);
          const step = Math.max(1, Math.floor(rawStep / Math.sqrt(multiplier)) || 1);
          return Math.min(target, prev + step);
        }
        return prev;
      });
    }, tickInterval);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [isLoading, splashFinished]);

  // --------------------------------------------------------------------------
  // Phase 3: Screen Dismissal on 100% Completion (guarded against orientation block)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isLoading || !splashFinished) {
      return;
    }

    // When both displayed progress and backend progress hit 100%, trigger exit (only when not paused)
    if (displayedProgress >= 100 && backendProgress >= 100 && !isScreenExiting && !isPaused) {
      setIsScreenExiting(true);
    }
  }, [isLoading, splashFinished, displayedProgress, backendProgress, isScreenExiting, isPaused]);

  // Guaranteed dismissal fallback when isScreenExiting is triggered
  useEffect(() => {
    if (!isScreenExiting || isPaused) return;

    const timer = setTimeout(() => {
      completeLoading();
    }, 550);

    return () => clearTimeout(timer);
  }, [isScreenExiting, isPaused, completeLoading]);

  // --------------------------------------------------------------------------
  // Phase 4: Looping Carousel (pausable with exact millisecond preservation)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isLoading || !splashFinished || slides.length === 0) {
      return;
    }

    // Freeze carousel slide timer while blocked in portrait orientation
    if (isPaused) {
      return;
    }

    slideLastStartRef.current = performance.now();
    const timer = setTimeout(() => {
      setActiveSlide(prev => {
        const next = (prev + 1) % slides.length;
        // Warm up next image in memory
        const future = slides[(next + 1) % slides.length];
        if (future) preloadImage(future.image).catch(() => { });
        return next;
      });
      slideRemainingMs.current = LOADING_CONFIG.slideDisplayMinMs;
    }, slideRemainingMs.current);

    return () => {
      clearTimeout(timer);
      if (slideLastStartRef.current !== null) {
        const elapsed = performance.now() - slideLastStartRef.current;
        slideRemainingMs.current = Math.max(100, slideRemainingMs.current - elapsed);
        slideLastStartRef.current = null;
      }
    };
  }, [isLoading, splashFinished, slides, activeSlide, isPaused]);

  if (!isLoading) {
    return null;
  }

  const currentSlide = slides[activeSlide] ?? slides[0];

  return (
    <motion.div
      key="loading-screen-root"
      className="loading-screen-root"
      initial={{ opacity: 1 }}
      animate={{ opacity: isScreenExiting ? 0 : 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      onAnimationComplete={() => {
        if (isScreenExiting && !isPausedRef.current) {
          completeLoading();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Mission Loading Console"
    >
      {/* ================================================================ */}
      {/* PITCH-BLACK INTRO SPLASH SCREEN                                  */}
      {/* Mounts with NO animation; text animates sequentially; exits with  */}
      {/* animation before carousel & progress start from zero.             */}
      {/* ================================================================ */}
      <AnimatePresence onExitComplete={() => setSplashFinished(true)}>
        {showSplash && (
          <motion.div
            key="intro-splash-screen"
            className="loading-intro-splash"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
          >
            {/* 1st line: "NASA Space Apps Challenge 2026" (400ms delay, 800ms duration) */}
            <motion.div
              className="loading-splash-line-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
            >
              <span>NASA Space Apps Challenge 2026</span>
            </motion.div>

            {/* 2nd line: "A JOURNEY BEYOND THE HORIZON" (2000ms delay, 800ms duration) */}
            <motion.h1
              className="loading-splash-line-2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.0, duration: 0.8, ease: 'easeOut' }}
            >
              A JOURNEY BEYOND THE HORIZON
            </motion.h1>

            {/* 3rd line: "ExoVisionaries-2k26 PRESENTS" (1200ms delay, 800ms duration) */}
            <motion.div
              className="loading-splash-line-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8, ease: 'easeOut' }}
            >
              <span>ExoVisionaries-2k26 PRESENTS</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* CAROUSEL & PROGRESS BAR (ACTIVATES ONCE SPLASH IS GONE)          */}
      {/* ================================================================ */}
      {splashFinished && (
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
      )}
    </motion.div>
  );
};
