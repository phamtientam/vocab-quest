import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface Props {
  children: React.ReactNode;
}

export function PageTransition({ children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(
      ref.current,
      { opacity: 1, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
    );
  }, { scope: ref });

  return (
    <div ref={ref} style={{ opacity: 1 }}>
      {children}
    </div>
  );
}
