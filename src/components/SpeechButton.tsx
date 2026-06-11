import { useRef } from 'react';
import gsap from 'gsap';
import { useSpeech } from '../hooks/useSpeech';

interface Props {
  word: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'text-2xl w-10 h-10',
  md: 'text-3xl w-14 h-14',
  lg: 'text-4xl w-16 h-16',
};

export function SpeechButton({ word, size = 'md' }: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const { speak, isSupported } = useSpeech();

  const handleClick = () => {
    speak(word);
    gsap.fromTo(
      btnRef.current,
      { scale: 0.85, rotate: -10 },
      { scale: 1, rotate: 0, duration: 0.4, ease: 'back.out(3)' }
    );
  };

  if (!isSupported) return null;

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      className={`${sizeMap[size]} flex items-center justify-center rounded-full bg-sky-400 hover:bg-sky-300 shadow-kid active:translate-y-1 transition-colors`}
      title={`Pronounce: ${word}`}
    >
      🔊
    </button>
  );
}
