import { useCallback, useRef } from 'react';

interface VoiceCoachOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useVoiceCoach(options: VoiceCoachOptions = {}) {
  const { rate = 1, pitch = 1, volume = 1 } = options;
  const isSpeakingRef = useRef(false);

  const speak = useCallback((text: string, priority = false) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel previous speech if priority or not currently speaking
    if (priority || !isSpeakingRef.current) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Try to get a friendly voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('en') && v.name.includes('Female')
    ) || voices.find((v) => v.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
    };

    window.speechSynthesis.speak(utterance);
  }, [rate, pitch, volume]);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
    }
  }, []);

  return { speak, stop };
}
