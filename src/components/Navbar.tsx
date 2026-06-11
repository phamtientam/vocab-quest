import { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { categories } from '../data';

const GAME_LINKS = [
  { to: '/game/quiz?category=all',   label: '🧩 Quiz'   },
  { to: '/game/memory?category=all', label: '🃏 Memory' },
  { to: '/game/drag?category=all',   label: '🎯 Drag'   },
  { to: '/game/shoot?category=all',  label: '🔫 Shoot'  },
  { to: '/game/race?category=all',   label: '🏎️ Race'   },
  { to: '/game/speak?category=all',  label: '🎤 Speak'  },
];

export function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const navRef    = useRef<HTMLElement>(null);
  const logoRef   = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef   = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(navRef.current, { y: -70, opacity: 1, duration: 0.55, ease: 'back.out(1.6)' });
  }, { scope: navRef });

  const handleLogoClick = () => {
    gsap.fromTo(logoRef.current,
      { rotation: -12, scale: 0.88 },
      { rotation: 0, scale: 1, duration: 0.4, ease: 'back.out(2.5)' }
    );
    navigate('/');
    if (menuOpen) closeMenu();
  };

  const openMenu = () => {
    setMenuOpen(true);
    gsap.fromTo(menuRef.current,
      { height: 0, opacity: 1 },
      { height: 'auto', opacity: 1, duration: 0.3, ease: 'power3.out' }
    );
  };

  const closeMenu = () => {
    gsap.to(menuRef.current, {
      height: 0, opacity: 1, duration: 0.22, ease: 'power3.in',
      onComplete: () => setMenuOpen(false),
    });
  };

  const toggleMenu = () => menuOpen ? closeMenu() : openMenu();

  return (
    <nav ref={navRef} className="sticky top-0 z-50 bg-white/92 backdrop-blur-md border-b-4 border-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-2">
        {/* Logo */}
        <button
  ref={logoRef}
  onClick={handleLogoClick}
  className="flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
>
  {/* Brand name */}
  <span
    className="sm:inline text-xs sm:text-sm text-black/50 font-medium tracking-wide"
  >
    created by
  </span>

  <span
    className="text-xs sm:text-sm font-semibold text-black/70"
  >
    Phạm Tiến Tâm
  </span>

  <span className="text-xl sm:text-2xl">🎓</span>

  {/* App name */}
  <span
    className="hidden md:inline text-transparent bg-clip-text font-display text-xl sm:text-2xl"
    style={{ backgroundImage: "linear-gradient(135deg,#0ea5e9,#a855f7)" }}
  >
    VocabQuest
  </span>
</button>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1 ml-3">
          <NavPill to="/" label="🏠" active={location.pathname === '/'} />
          {GAME_LINKS.map(g => (
            <NavPill key={g.to} to={g.to} label={g.label} active={location.pathname === g.to.split('?')[0]} />
          ))}
        </div>

        {/* Stats badge + hamburger */}
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden md:flex items-center gap-1 bg-lemon-400 rounded-full px-3 py-1 font-bold text-sm text-gray-700 shadow-kid">
            📚 {categories.length} topics
          </span>
          <button
            className="lg:hidden text-xl w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-gray-200 active:scale-90 transition-all font-bold"
            onClick={toggleMenu}
            aria-label="Menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="lg:hidden border-t-2 border-gray-100 overflow-hidden"
          style={{ height: 0, opacity: 1 }}
        >
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Games</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <MobileLink to="/" label="🏠 Home" onClick={closeMenu} />
              {GAME_LINKS.map(g => (
                <MobileLink key={g.to} to={g.to} label={g.label} onClick={closeMenu} />
              ))}
            </div>
          </div>
          <div className="px-4 pb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Topics</p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => { navigate(`/category/${c.id}`); closeMenu(); }}
                  className="rounded-xl px-2.5 py-1 font-bold text-xs text-white active:scale-90 transition-transform"
                  style={{ background: c.color }}
                >
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavPill({ to, label, active }: { to: string; label: string; active: boolean }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLButtonElement>(null);
  const handleClick = () => {
    gsap.fromTo(ref.current, { scale: 0.88 }, { scale: 1, duration: 0.25, ease: 'back.out(3)' });
    navigate(to);
  };
  return (
    <button
      ref={ref}
      onClick={handleClick}
      className={`font-bold text-sm px-3 py-1.5 rounded-xl transition-colors active:scale-95
        ${active ? 'bg-sky-500 text-white shadow-kid' : 'text-gray-600 hover:bg-sky-50 hover:text-sky-600'}`}
    >
      {label}
    </button>
  );
}

function MobileLink({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => { navigate(to); onClick(); }}
      className="bg-gray-50 hover:bg-sky-50 active:scale-95 rounded-2xl px-3 py-2.5 font-bold text-sm transition-all text-left"
    >
      {label}
    </button>
  );
}
