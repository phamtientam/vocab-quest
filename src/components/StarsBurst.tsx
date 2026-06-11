import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface Props {
  count?: number;
  visible: boolean;
}

export function StarsBurst({ count = 3, visible }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || !ref.current) return;
    const stars = ref.current.querySelectorAll('.star');
    gsap.fromTo(
      stars,
      { scale: 0, rotation: -30, opacity: 1 },
      {
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 0.4,
        stagger: 0.1,
        ease: 'back.out(2)',
      }
    );
  }, [visible]);

  if (!visible) return null;

  return (
    <div ref={ref} className="flex gap-2 items-center justify-center">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="star text-4xl md:text-5xl" style={{ opacity: 1 }}>
          ⭐
        </span>
      ))}
    </div>
  );
}
