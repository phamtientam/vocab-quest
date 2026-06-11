import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { categories } from '../data';

interface Props {
  title: string;
  emoji: string;
  children: React.ReactNode;
  categoryId?: string;
  score?: number;
  showScore?: boolean;
}

export function GameLayout({ title, emoji, children, categoryId, score, showScore }: Props) {
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(headerRef.current, { y: -50, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' });
    gsap.from(contentRef.current, { y: 30, opacity: 1, duration: 0.5, delay: 0.1, ease: 'power3.out' });
  });

  const category = categoryId ? categories.find(c => c.id === categoryId) : null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sub-header */}
      <div
        ref={headerRef}
        className="bg-white/85 backdrop-blur-sm border-b-4 border-white shadow-md px-4 py-3 flex items-center gap-3 flex-wrap"
      >
        <button
          onClick={() => navigate(categoryId ? `/category/${categoryId}` : '/')}
          className="text-lg bg-gray-100 hover:bg-gray-200 rounded-2xl px-4 py-2 font-bold transition-colors active:scale-95 flex-shrink-0"
        >
          ← Back
        </button>

        {/* Title */}
        <h1 className="font-display text-2xl md:text-3xl flex items-center gap-2 text-gray-800">
          {emoji} {title}
        </h1>

        {/* Category badge */}
        {category && (
          <span
            className="px-3 py-1 rounded-full font-bold text-sm text-white"
            style={{ background: category.color }}
          >
            {category.emoji} {category.name}
          </span>
        )}
        {!category && (
          <span className="px-3 py-1 rounded-full font-bold text-sm bg-gradient-to-r from-sky-400 to-purple-400 text-white">
            🌍 All Topics
          </span>
        )}

        {/* Score */}
        {showScore && (
          <div className="ml-auto bg-lemon-400 rounded-2xl px-4 py-2 font-display text-xl text-gray-800 shadow-kid flex-shrink-0">
            ⭐ {score ?? 0}
          </div>
        )}
      </div>

      {/* Category quick-switcher */}
      <div className="bg-white/50 border-b-2 border-white/80 px-4 py-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          <QuickLink
            label="🌍 All"
            active={!categoryId}
            currentPath={window.location.pathname}
            catId="all"
          />
          {categories.map(c => (
            <QuickLink
              key={c.id}
              label={`${c.emoji} ${c.name}`}
              active={categoryId === c.id}
              currentPath={window.location.pathname}
              catId={c.id}
              color={c.color}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} className="flex-1 p-4 md:p-6" style={{ opacity: 1 }}>
        {children}
      </div>
    </div>
  );
}

function QuickLink({
  label, active, currentPath, catId, color,
}: {
  label: string;
  active: boolean;
  currentPath: string;
  catId: string;
  color?: string;
}) {
  const navigate = useNavigate();
  const ref = useRef<HTMLButtonElement>(null);

 const handleClick = () => {
  gsap.fromTo(
    ref.current,
    { scale: 0.9 },
    { scale: 1, duration: 0.2, ease: 'back.out(3)' }
  );

  navigate(`${currentPath}?category=${catId}`);
};

  return (
    <button
      ref={ref}
      onClick={handleClick}
      className={`px-3 py-1 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex-shrink-0 ${
        active ? 'text-white shadow-md' : 'bg-white/70 text-gray-600 hover:bg-white'
      }`}
      style={active ? { background: color ?? 'linear-gradient(135deg,#38bdf8,#a855f7)' } : {}}
    >
      {label}
    </button>
  );
}
