import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useLoadingStore } from "../../state/loadingStore";
import { preloadImage } from "@exo/engine";
import { LOADING_CONFIG } from "../../config/loadingConfig";
import { LoadingIntroSplash } from "./LoadingIntroSplash";
import { LoadingCarouselStage } from "./LoadingCarouselStage";
import "./loadingScreen.css";

export const LoadingScreen: React.FC = () => {
  const isLoading = useLoadingStore((s) => s.isLoading);
  const isPaused = useLoadingStore((s) => s.isPaused);
  const backendProgress = useLoadingStore((s) => s.progress);
  const slides = useLoadingStore((s) => s.slides);
  const statusMessage = useLoadingStore((s) => s.statusMessage);
  const activeContext = useLoadingStore((s) => s.activeContext);
  const showIntroSplashStore = useLoadingStore((s) => s.showIntroSplash);
  const completeLoading = useLoadingStore((s) => s.completeLoading);
  const setIntroSplashShown = useLoadingStore((s) => s.setIntroSplashShown);

  const [showSplash, setShowSplash] = useState(showIntroSplashStore);
  const [splashFinished, setSplashFinished] = useState(!showIntroSplashStore);
  const [activeSlide, setActiveSlide] = useState(0);
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const isScreenExiting = Boolean(
    isLoading &&
    splashFinished &&
    displayedProgress >= 100 &&
    backendProgress >= 100,
  );

  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const splashRemainingMs = useRef(LOADING_CONFIG.introSplashDisplayMs);
  const splashLastStartRef = useRef<number | null>(null);
  const slideRemainingMs = useRef(LOADING_CONFIG.slideDisplayMinMs);
  const slideLastStartRef = useRef<number | null>(null);

  const prevLoadingRef = useRef(isLoading);
  useEffect(() => {
    if (isLoading && !prevLoadingRef.current) {
      setShowSplash(showIntroSplashStore);
      setSplashFinished(!showIntroSplashStore);
      setDisplayedProgress(0);
      setActiveSlide(0);
      splashRemainingMs.current = LOADING_CONFIG.introSplashDisplayMs;
      splashLastStartRef.current = null;
      slideRemainingMs.current = LOADING_CONFIG.slideDisplayMinMs;
      slideLastStartRef.current = null;
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, activeContext, showIntroSplashStore]);

  useEffect(() => {
    if (!isLoading || !showSplash) return;
    if (slides.length > 0) {
      preloadImage(slides[0].image).catch(() => {});
    }
    if (isPaused) return;

    splashLastStartRef.current = performance.now();
    const timer = setTimeout(() => {
      setShowSplash(false);
      setIntroSplashShown();
    }, splashRemainingMs.current);

    return () => {
      clearTimeout(timer);
      if (splashLastStartRef.current !== null) {
        const elapsed = performance.now() - splashLastStartRef.current;
        splashRemainingMs.current = Math.max(
          50,
          splashRemainingMs.current - elapsed,
        );
        splashLastStartRef.current = null;
      }
    };
  }, [isLoading, showSplash, slides, setIntroSplashShown, isPaused]);

  useEffect(() => {
    if (!isLoading || !splashFinished) return;

    let isCancelled = false;
    const multiplier = Math.max(1, LOADING_CONFIG.progressMultiplier);
    const tickInterval = Math.round(25 * multiplier);

    const interval = setInterval(() => {
      if (isCancelled || isPausedRef.current) return;
      setDisplayedProgress((prev) => {
        const target = useLoadingStore.getState().progress;
        if (prev < target) {
          const rawStep = Math.ceil((target - prev) * 0.15);
          const step = Math.max(
            1,
            Math.floor(rawStep / Math.sqrt(multiplier)) || 1,
          );
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

  useEffect(() => {
    if (!isScreenExiting || isPaused) return;
    const timer = setTimeout(() => {
      completeLoading();
    }, 550);
    return () => clearTimeout(timer);
  }, [isScreenExiting, isPaused, completeLoading]);

  useEffect(() => {
    if (!isLoading || !splashFinished || slides.length === 0) return;
    if (isPaused) return;

    slideLastStartRef.current = performance.now();
    const timer = setTimeout(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % slides.length;
        const future = slides[(next + 1) % slides.length];
        if (future) preloadImage(future.image).catch(() => {});
        return next;
      });
      slideRemainingMs.current = LOADING_CONFIG.slideDisplayMinMs;
    }, slideRemainingMs.current);

    return () => {
      clearTimeout(timer);
      if (slideLastStartRef.current !== null) {
        const elapsed = performance.now() - slideLastStartRef.current;
        slideRemainingMs.current = Math.max(
          100,
          slideRemainingMs.current - elapsed,
        );
        slideLastStartRef.current = null;
      }
    };
  }, [isLoading, splashFinished, slides, activeSlide, isPaused]);

  if (!isLoading) return null;

  const currentSlide = slides[activeSlide] ?? slides[0];

  return (
    <motion.div
      key="loading-screen-root"
      className="loading-screen-root"
      initial={{ opacity: 1 }}
      animate={{ opacity: isScreenExiting ? 0 : 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onAnimationComplete={() => {
        if (isScreenExiting && !isPausedRef.current) {
          completeLoading();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Mission Loading Console"
    >
      <LoadingIntroSplash
        showSplash={showSplash}
        onExitComplete={() => setSplashFinished(true)}
      />

      {splashFinished && (
        <LoadingCarouselStage
          currentSlide={currentSlide}
          statusMessage={statusMessage}
          displayedProgress={displayedProgress}
        />
      )}
    </motion.div>
  );
};
