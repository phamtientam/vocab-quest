import { useCallback, useRef } from 'react';

type SoundType = 'correct' | 'wrong' | 'click' | 'levelup' | 'whoosh';

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return ctxRef.current;
  };

  const playTone = useCallback((
    frequency: number,
    type: OscillatorType,
    duration: number,
    gain = 0.3,
    startDelay = 0
  ) => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime + startDelay);

      gainNode.gain.setValueAtTime(0, ctx.currentTime + startDelay);
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + startDelay + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);

      osc.start(ctx.currentTime + startDelay);
      osc.stop(ctx.currentTime + startDelay + duration);
    } catch {
      // AudioContext unavailable or blocked
    }
  }, []);

  const play = useCallback((sound: SoundType) => {
    switch (sound) {
      case 'correct':
        playTone(523, 'sine', 0.1, 0.25);
        playTone(659, 'sine', 0.1, 0.25, 0.1);
        playTone(784, 'sine', 0.2, 0.25, 0.2);
        break;
      case 'wrong':
        playTone(220, 'sawtooth', 0.15, 0.2);
        playTone(180, 'sawtooth', 0.15, 0.2, 0.15);
        break;
      case 'click':
        playTone(800, 'sine', 0.05, 0.1);
        break;
      case 'levelup':
        [523, 659, 784, 1047].forEach((freq, i) => {
          playTone(freq, 'sine', 0.2, 0.3, i * 0.12);
        });
        break;
      case 'whoosh':
        playTone(400, 'sine', 0.08, 0.15);
        playTone(200, 'sine', 0.08, 0.1, 0.05);
        break;
    }
  }, [playTone]);

  return { play };
}
