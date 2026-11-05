import { useCallback, useEffect } from 'react';
import { useAudioStore } from '@exo/audio';

export function useStoryAudioControls(initialVoiceEnabled?: boolean) {
  const isMuted = useAudioStore(s => s.isMuted);
  const voicesEnabled = useAudioStore(s => s.voicesEnabled);
  const setAudioMuted = useAudioStore(s => s.setMuted);
  const setVoicesEnabled = useAudioStore(s => s.setVoicesEnabled);
  const voiceEnabled = !isMuted && voicesEnabled;

  const setVoiceEnabled = useCallback(
    (valueOrUpdater: boolean | ((prev: boolean) => boolean)) => {
      const audio = useAudioStore.getState();
      const current = !audio.isMuted && audio.voicesEnabled;
      const nextVal = typeof valueOrUpdater === 'function' ? valueOrUpdater(current) : valueOrUpdater;
      setVoicesEnabled(nextVal);
      if (nextVal && audio.isMuted) setAudioMuted(false);
    },
    [setAudioMuted, setVoicesEnabled],
  );

  const toggleAudioMute = useCallback(() => setVoiceEnabled(value => !value), [setVoiceEnabled]);

  useEffect(() => {
    if (initialVoiceEnabled === false) {
      setVoicesEnabled(false);
    }
  }, [initialVoiceEnabled, setVoicesEnabled]);

  return {
    isMuted,
    voicesEnabled,
    voiceEnabled,
    setVoiceEnabled,
    toggleAudioMute,
  };
}

