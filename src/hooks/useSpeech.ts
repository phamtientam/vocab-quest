import { useCallback, useRef } from 'react';

interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useSpeech() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    if (!window.speechSynthesis) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = options.rate ?? 0.85;
    utterance.pitch = options.pitch ?? 1.1;
    utterance.volume = options.volume ?? 1;

    // Try to find an English voice
    const voices = window.speechSynthesis.getVoices();
    const engVoice = voices.find(
      (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('google')
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (engVoice) utterance.voice = engVoice;

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return { speak, stop, isSupported };
}
