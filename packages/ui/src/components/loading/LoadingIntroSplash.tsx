import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface LoadingIntroSplashProps {
  showSplash: boolean;
  onExitComplete: () => void;
}

export const LoadingIntroSplash: React.FC<LoadingIntroSplashProps> = ({
  showSplash,
  onExitComplete,
}) => {
  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {showSplash && (
        <motion.div
          key="intro-splash-screen"
          className="loading-intro-splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
        >
          {/* 1st line: "NASA Space Apps Challenge 2026" */}
          <motion.div
            className="loading-splash-line-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
          >
            <span>NASA Space Apps Challenge 2026</span>
          </motion.div>

          {/* 2nd line: "A JOURNEY BEYOND THE HORIZON" */}
          <motion.h1
            className="loading-splash-line-2"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0, duration: 0.8, ease: 'easeOut' }}
          >
            A JOURNEY BEYOND THE HORIZON
          </motion.h1>

          {/* 3rd line: "ExoVisionaries-2k26 PRESENTS" */}
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
  );
};

