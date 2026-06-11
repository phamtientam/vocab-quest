import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { Category } from '../data/types';

interface Props {
  category: Category;
  index: number;
}

export function CategoryCard({ category, index }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLSpanElement>(null);
  const navigate = useNavigate();

  useGSAP(() => {
    gsap.from(cardRef.current, {
      opacity: 1,
      duration: 0.6,
      delay: index * 0.08,
      ease: 'back.out(1.4)',
    });
  }, { scope: cardRef });

  const handleEnter = () => {
    gsap.to(cardRef.current, {
      scale: 1.05,
      duration: 0.2,
      ease: 'power2.out',
      boxShadow: `0 20px 0 rgba(0,0,0,0.18), 0 0 40px ${category.color}44`,
    });
    gsap.to(emojiRef.current, {
      rotation: 15,
      scale: 1.3,
      duration: 0.2,
      ease: 'back.out(2)',
    });
  };

  const handleLeave = () => {
    gsap.to(cardRef.current, {
      // y: 0,
      scale: 1,
      duration: 0.25,
      ease: 'power2.out',
      boxShadow: '0 8px 0 rgba(0,0,0,0.15)',
    });
    gsap.to(emojiRef.current, { rotation: 0, scale: 1, duration: 0.2 });
  };

  const handleClick = () => {
    const tl = gsap.timeline({
      onComplete: () => navigate(`/category/${category.id}`),
    });
    tl.to(cardRef.current, { scale: 0.95, duration: 0.1 })
      .to(cardRef.current, { scale: 1.1, duration: 0.15, ease: 'back.out(3)' })
      .to(cardRef.current, { scale: 0.9, opacity: 1, duration: 0.2 });
  };

  return (
    <div
      ref={cardRef}
      className="card-kid flex flex-col items-center justify-center gap-4 p-8 cursor-pointer select-none min-h-[200px]"
      style={{ background: category.bgColor, borderColor: category.color, borderWidth: '4px' }}
      // onMouseEnter={handleEnter}
      // onMouseLeave={handleLeave}
      onClick={handleClick}
    >
      <span ref={emojiRef} className="text-7xl leading-none block">
        {category.emoji}
      </span>
      <p className="font-display text-2xl md:text-3xl" style={{ color: category.color }}>
        {category.name}
      </p>
      <p className="text-gray-500 font-bold text-sm">
        {category.words.length} words
      </p>
    </div>
  );
}
