import { useRef } from 'react';
import gsap from 'gsap';

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  color?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const colorMap = {
  blue: 'bg-sky-500 hover:bg-sky-400 border-b-sky-700',
  yellow: 'bg-lemon-400 hover:bg-lemon-300 border-b-lemon-500 text-gray-800',
  green: 'bg-lime-500 hover:bg-lime-400 border-b-lime-700',
  coral: 'bg-coral-500 hover:bg-coral-400 border-b-coral-700',
  grape: 'bg-grape-500 hover:bg-grape-400 border-b-grape-700',
  rose: 'bg-rose-500 hover:bg-rose-400 border-b-rose-700',
};

const sizeMap = {
  sm: 'text-base px-4 py-2',
  md: 'text-xl px-6 py-3',
  lg: 'text-2xl px-8 py-4',
};

export function AnimatedButton({
  children,
  onClick,
  color = 'blue',
  className = '',
  disabled = false,
  size = 'md',
}: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleEnter = () => {
    gsap.to(btnRef.current, { scale: 1.05, duration: 0.1, ease: 'power2.out' });
  };
  const handleLeave = () => {
    gsap.to(btnRef.current, { scale: 1, duration: 0.15, ease: 'power2.out' });
  };
  const handleClick = () => {
    if (disabled) return;
    gsap.fromTo(
      btnRef.current,
      { scale: 0.92 },
      { scale: 1, duration: 0.3, ease: 'back.out(3)' }
    );
    onClick?.();
  };

  const colorClass = colorMap[color as keyof typeof colorMap] || colorMap.blue;
  const sizeClass = sizeMap[size];

  return (
    <button
      ref={btnRef}
      className={`btn-kid ${colorClass} ${sizeClass} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ borderBottomWidth: '5px', borderStyle: 'solid' }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
