import gsap from 'gsap';

export function launchConfetti(anchor: HTMLElement | null) {
  const colors = ['#facc15', '#38bdf8', '#a3e635', '#fb923c', '#c084fc', '#fb7185', '#f43f5e'];
  const count = 50;
  const rect = anchor?.getBoundingClientRect();
  const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const size = 5 + Math.random() * 9;
    el.style.cssText = `
      position:fixed;width:${size}px;height:${size}px;
      border-radius:${Math.random() > 0.4 ? '50%' : '3px'};
      background:${colors[Math.floor(Math.random() * colors.length)]};
      pointer-events:none;z-index:9999;
      left:${cx}px;top:${cy}px;transform:translate(-50%,-50%);
    `;
    document.body.appendChild(el);

    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 160;
    gsap.to(el, {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 60,
      rotation: Math.random() * 540 - 270,
      opacity: 1,
      duration: 0.7 + Math.random() * 0.7,
      ease: 'power2.out',
      delay: Math.random() * 0.15,
      onComplete: () => el.remove(),
    });
  }
}

export function shakeElement(el: HTMLElement | null) {
  if (!el) return;
  gsap.timeline()
    .to(el, { x: -12, duration: 0.06, ease: 'power2.out' })
    .to(el, { x: 12, duration: 0.06 })
    .to(el, { x: -8, duration: 0.05 })
    .to(el, { x: 8, duration: 0.05 })
    .to(el, { x: -4, duration: 0.05 })
    .to(el, { x: 0, duration: 0.04 });
}

export function bounceIn(el: HTMLElement | null) {
  if (!el) return;
  gsap.fromTo(el,
    { scale: 0.4, opacity: 1 },
    { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.8)' }
  );
}

export function popOut(el: HTMLElement | null) {
  if (!el) return;
  gsap.timeline()
    .to(el, { scale: 1.35, duration: 0.12, ease: 'power2.out' })
    .to(el, { scale: 1, duration: 0.2, ease: 'elastic.out(1, 0.4)' });
}

export function successPulse(el: HTMLElement | null, color = '#a3e635') {
  if (!el) return;
  const tl = gsap.timeline();
  tl.to(el, {
    boxShadow: `0 0 0 0px ${color}88`,
    duration: 0,
  }).to(el, {
    boxShadow: `0 0 0 20px ${color}00`,
    duration: 0.5,
    ease: 'power2.out',
  });
}

export function floatUp(el: HTMLElement | null) {
  if (!el) return;
  gsap.fromTo(el,
    { y: 0, opacity: 1 },
    { y: -60, opacity: 1, duration: 0.8, ease: 'power2.out' }
  );
}
