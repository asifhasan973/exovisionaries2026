import React, { useState, useEffect } from "react";
import {
  Monitor,
  Smartphone,
  Apple,
  Download,
  X,
  CheckCircle2,
} from "lucide-react";
import { usePwaStore } from "../state/pwaStore";
import type { PwaPlatform } from "../state/pwaStore";
import { sound } from "@exo/audio";
import { DesktopInstructions } from "./install-modal/DesktopInstructions";
import { AndroidInstructions } from "./install-modal/AndroidInstructions";
import { IosInstructions } from "./install-modal/IosInstructions";
import { PwaPerksBox } from "./install-modal/PwaPerksBox";
import "./installAppModal.css";

export const InstallAppModal: React.FC = () => {
  const {
    isModalOpen,
    closeInstallModal,
    promptInstall,
    deferredPrompt,
    platform,
    isInstalled,
  } = usePwaStore();
  const [selectedTab, setSelectedTab] = useState<PwaPlatform | null>(null);
  const activeTab = selectedTab ?? platform;
  const setActiveTab = setSelectedTab;

  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        sound.playClick();
        closeInstallModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, closeInstallModal]);

  if (!isModalOpen || isInstalled) return null;

  const handleTabChange = (tab: PwaPlatform) => {
    sound.playPop();
    setActiveTab(tab);
  };

  const handleClose = () => {
    sound.playClick();
    closeInstallModal();
  };

  const handleDirectInstall = () => {
    sound.playClick();
    promptInstall();
  };

  return (
    <div
      className="pwa-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="pwa-modal-container">
        {/* Modal Header */}
        <div className="pwa-modal-header">
          <div className="pwa-modal-title-group">
            <div className="pwa-modal-icon-badge">
              <Download size={20} />
            </div>
            <div>
              <h2 id="pwa-modal-title" className="pwa-modal-title">
                Install Zero To Beyond
              </h2>
              <div className="pwa-modal-subtitle">
                Progressive Web App · Landscape Simulation
              </div>
            </div>
          </div>
          <button
            type="button"
            className="pwa-modal-close"
            onClick={handleClose}
            aria-label="Close installation guide"
          >
            <X size={16} />
          </button>
        </div>

        {/* Platform Selection Tabs */}
        <div className="pwa-modal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "desktop"}
            className={`pwa-tab-btn ${activeTab === "desktop" ? "is-active" : ""}`}
            onClick={() => handleTabChange("desktop")}
          >
            <Monitor size={15} />
            <span>PC & Mac</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "android"}
            className={`pwa-tab-btn ${activeTab === "android" ? "is-active" : ""}`}
            onClick={() => handleTabChange("android")}
          >
            <Smartphone size={15} />
            <span>Android</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "ios"}
            className={`pwa-tab-btn ${activeTab === "ios" ? "is-active" : ""}`}
            onClick={() => handleTabChange("ios")}
          >
            <Apple size={15} />
            <span>iPhone / iPad</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="pwa-modal-body">
          {activeTab === "desktop" && (
            <DesktopInstructions
              deferredPrompt={deferredPrompt}
              onDirectInstall={handleDirectInstall}
            />
          )}

          {activeTab === "android" && (
            <AndroidInstructions
              deferredPrompt={deferredPrompt}
              onDirectInstall={handleDirectInstall}
            />
          )}

          {activeTab === "ios" && <IosInstructions />}

          <PwaPerksBox />
        </div>

        {/* Modal Footer */}
        <div className="pwa-modal-footer">
          {deferredPrompt && (
            <button
              type="button"
              className="pwa-direct-install-btn"
              onClick={handleDirectInstall}
            >
              <Download size={15} />
              <span>Install Directly</span>
            </button>
          )}

          <button
            type="button"
            className="pwa-dismiss-btn"
            onClick={handleClose}
          >
            <CheckCircle2 size={14} className="inline mr-1 text-emerald-400" />
            <span>Got It</span>
          </button>
        </div>
      </div>
    </div>
  );
};
