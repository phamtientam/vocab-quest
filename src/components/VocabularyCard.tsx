import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useSpeech } from '../hooks/useSpeech';
import type { VocabWord } from '../data/types';

interface Props {
  word: VocabWord;
  color?: string;
  bgColor?: string;
  showMeaning?: boolean;
  onCardClick?: (word: VocabWord) => void;
}

export function VocabularyCard({ word, color = '#3b82f6', bgColor = '#eff6ff', showMeaning = true, onCardClick }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);
  const { speak } = useSpeech();

  useGSAP(() => {
    gsap.from(cardRef.current, {
      scale: 0.8,
      opacity: 1,
      duration: 0.4,
      ease: 'back.out(1.7)',
    });
  }, { scope: cardRef });

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, {
      scale: 1.07,
      duration: 0.2,
      ease: 'power2.out',
      boxShadow: `0 16px 0 rgba(0,0,0,0.15), 0 0 30px ${color}55`,
    });
    gsap.to(emojiRef.current, {
      y: -8,
      duration: 0.2,
      ease: 'power2.out',
    });
    speak(word.word);
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, {
      scale: 1,
      duration: 0.2,
      ease: 'power2.out',
      boxShadow: '0 8px 0 rgba(0,0,0,0.15)',
    });
    gsap.to(emojiRef.current, { y: 0, duration: 0.2 });
  };

  const handleClick = () => {
    speak(word.word);
    setFlipped(!flipped);
    onCardClick?.(word);

    // 360 spin + bounce
    const tl = gsap.timeline();
    tl.to(cardRef.current, { rotationY: 180, duration: 0.3, ease: 'power2.in' })
      .to(cardRef.current, { rotationY: 0, duration: 0.4, ease: 'back.out(2)' });

    gsap.to(emojiRef.current, {
      scale: 1.4,
      duration: 0.15,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
    });
  };

  return (
    <div
      ref={cardRef}
      className="card-kid flex flex-col items-center justify-center gap-3 p-6 min-w-[140px] min-h-[160px] cursor-pointer select-none"
      style={{ background: bgColor, borderColor: color }}
      // onMouseEnter={handleMouseEnter}
      // onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div ref={emojiRef} className="text-6xl leading-none">
        {word.emoji}
      </div>
      <p className="font-display text-2xl text-gray-800 capitalize">{word.word}</p>
      {showMeaning && (
        <p className="text-base text-gray-500 font-bold">{word.meaning}</p>
      )}
    </div>
  );
}
