import { useCallback, useEffect } from 'react';
import { useAudioStore } from '@exo/audio';

export function useStoryAudioControls(initialVoiceEnabled?: boolean) {
  const isMuted = useAudioStore(s => s.isMuted);
  const voicesEnabled = useAudioStore(s => s.voicesEnabled);
  const effectsEnabled = useAudioStore(s => s.effectsEnabled);
  const toggleMute = useAudioStore(s => s.toggleMute);
  const setVoicesEnabled = useAudioStore(s => s.setVoicesEnabled);
  const voiceEnabled = !isMuted && voicesEnabled;
  const soundActive = !isMuted && (voicesEnabled || effectsEnabled);

  const toggleAudioMute = useCallback(() => {
    toggleMute();
  }, [toggleMute]);

  useEffect(() => {
    if (initialVoiceEnabled === false) {
      setVoicesEnabled(false);
    }
  }, [initialVoiceEnabled, setVoicesEnabled]);

  return {
    isMuted,
    voicesEnabled,
    voiceEnabled,
    soundActive,
    setVoiceEnabled: setVoicesEnabled,
    toggleAudioMute,
  };
}

