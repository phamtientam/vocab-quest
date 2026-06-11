import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { categories } from '../data';
import { CategoryCard } from '../components/CategoryCard';
import { useProgress } from '../hooks/useProgress';

const FLOATERS = ['🌟','🎉','🌈','✨','🎊','💫','🌸','🎯'];

const GAMES = [
  { id:'quiz',   emoji:'🧩', title:'Quiz',    desc:'4-choice Q&A',       color:'#a855f7', path:'/game/quiz?category=all'   },
  { id:'memory', emoji:'🃏', title:'Memory',  desc:'Match pairs',        color:'#ec4899', path:'/game/memory?category=all' },
  { id:'drag',   emoji:'🎯', title:'Drag',    desc:'Word to emoji',      color:'#f97316', path:'/game/drag?category=all'   },
  { id:'shoot',  emoji:'🔫', title:'Shoot',   desc:'Hit flying emojis',  color:'#ef4444', path:'/game/shoot?category=all'  },
  { id:'race',   emoji:'🏎️', title:'Race',    desc:'Steer to right lane',color:'#22c55e', path:'/game/race?category=all'   },
  { id:'speak',  emoji:'🎤', title:'Speak',   desc:'Say it out loud!',   color:'#0ea5e9', path:'/game/speak?category=all'  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { progress, resetProgress } = useProgress();
  const rootRef        = useRef<HTMLDivElement>(null);
  const titleRef       = useRef<HTMLHeadingElement>(null);
  const subtitleRef    = useRef<HTMLParagraphElement>(null);
  const statsRef       = useRef<HTMLDivElement>(null);
  const floatersRef    = useRef<HTMLDivElement>(null);
  const gamesRef       = useRef<HTMLDivElement>(null);
  const categoriesRef  = useRef<HTMLDivElement>(null);
  const bannerRef      = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // ── Hero entrance ──
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from(titleRef.current,    { y: -55, opacity: 1, duration: 0.7, ease: 'back.out(1.7)' })
      .from(subtitleRef.current, { y: -20, opacity: 1, duration: 0.5 }, '-=0.35')
      .from(statsRef.current,    { y: 20,  opacity: 1, duration: 0.5 }, '-=0.25');

    // ── Floating emojis loop ──
    floatersRef.current?.querySelectorAll('.floater').forEach((el, i) => {
      gsap.to(el, {
        y: -20, rotation: (i % 2 ? 1 : -1) * 14,
        duration: 2 + i * 0.18, repeat: -1, yoyo: true,
        ease: 'sine.inOut', delay: i * 0.22,
      });
    });

    // ── ScrollTrigger: game cards ──
    ScrollTrigger.create({
      trigger: gamesRef.current,
      start: 'top 82%',
      onEnter: () => gsap.from(gamesRef.current!.querySelectorAll('.game-card'), {
        y: 45, opacity: 1, stagger: 0.07, duration: 0.5, ease: 'back.out(1.4)',
      }),
      once: true,
    });

    // ── ScrollTrigger: category cards ──
    ScrollTrigger.create({
      trigger: categoriesRef.current,
      start: 'top 82%',
      onEnter: () => gsap.from(categoriesRef.current!.querySelectorAll('.cat-wrap'), {
        y: 40, opacity: 1, stagger: 0.07, duration: 0.45, ease: 'back.out(1.4)',
      }),
      once: true,
    });

    // ── ScrollTrigger: banner ──
    ScrollTrigger.create({
      trigger: bannerRef.current,
      start: 'top 85%',
      onEnter: () => gsap.from(bannerRef.current, {
        scale: 0.92, opacity: 1, duration: 0.5, ease: 'back.out(1.5)',
      }),
      once: true,
    });
  }, { scope: rootRef });

  const wordsLearned = progress.wordsLearned.size;
  const totalWords   = categories.reduce((s, c) => s + c.words.length, 0);

  return (
    <div ref={rootRef} className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden text-center px-4 pt-10 pb-8">
        <div ref={floatersRef} className="absolute inset-0 pointer-events-none overflow-hidden">
          {FLOATERS.map((e, i) => (
            <span key={i} className="floater absolute text-3xl md:text-4xl opacity-[0.15] select-none"
              style={{ left: `${5 + i * 11.8}%`, top: `${8 + (i % 3) * 30}%` }}>
              {e}
            </span>
          ))}
        </div>

        <h1
          ref={titleRef}
          className="font-display text-5xl md:text-7xl text-transparent bg-clip-text relative"
          style={{ backgroundImage: 'linear-gradient(135deg,#0ea5e9 0%,#a855f7 50%,#f97316 100%)' }}
        >
          VocabQuest 🎓
        </h1>
        <p ref={subtitleRef} className="mt-3 text-gray-600 text-xl md:text-2xl font-bold">
          Learn English words through fun games! 🎮
        </p>

        {/* ── Stats ── */}
        <div ref={statsRef} className="mt-5 inline-flex flex-wrap justify-center gap-2 md:gap-3">
          <StatChip emoji="⭐" label="Total Score" value={progress.totalScore.toLocaleString()} color="#f97316" />
          <StatChip emoji="📚" label="Words Learned" value={`${wordsLearned} / ${totalWords}`} color="#38bdf8" />
          <StatChip emoji="🎮" label="Games Played" value={String(progress.gamesPlayed)} color="#a3e635" />
          {progress.gamesPlayed > 0 && (
            <button
              onClick={() => { if (window.confirm('Reset all progress?')) resetProgress(); }}
              className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-gray-100 text-gray-400 font-bold text-sm transition-colors shadow-kid"
            >
              🔄 Reset
            </button>
          )}
        </div>
      </section>

      {/* ── Games ── */}
      <section className="max-w-5xl mx-auto px-4 pb-6">
        <SectionHeading emoji="🎮" text="Choose a Game" />
        <div ref={gamesRef} className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {GAMES.map(g => (
            
            <button
              key={g.id}
              onClick={() => navigate(g.path)}
              className="
                game-card
                h-full
                min-h-[150px]
                rounded-3xl
                border-4 border-white
                bg-white
                p-3 md:p-4
                flex flex-col items-center
                justify-center
                gap-1
                hover:shadow-kid-hover active:scale-95 cursor-pointer text-center
              "
            >
              <span className="text-4xl md:text-5xl leading-none">{g.emoji}</span>
              <span className="font-display text-base md:text-lg leading-tight" style={{ color: g.color }}>{g.title}</span>
              <span className="text-gray-400 font-bold text-xs leading-snug hidden md:block">{g.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section ref={categoriesRef} className="max-w-5xl mx-auto px-4 pb-12">
        <SectionHeading emoji="✨" text="Choose a Topic" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {categories.map((cat, i) => (
            <div key={cat.id} className="cat-wrap">
              <CategoryCard category={cat} index={i} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Mixed challenge banner ── */}
      <section ref={bannerRef} className="max-w-5xl mx-auto px-4 pb-16">
        <div
          className="rounded-3xl border-4 border-white/30 p-8 text-center shadow-2xl"
          style={{ background: 'linear-gradient(135deg,#0ea5e9 0%,#a855f7 100%)' }}
        >
          <p className="font-display text-3xl md:text-4xl text-white mb-1">🚀 Mixed Challenge</p>
          <p className="text-white/75 font-bold text-base md:text-lg mb-6">
            All {totalWords} words · {categories.length} categories · Maximum fun!
          </p>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {GAMES.map(g => (
              <button
                key={g.id}
                onClick={() => navigate(g.path)}
                className="bg-white/20 hover:bg-white/35 active:scale-95 text-white font-display text-base md:text-xl
                           rounded-2xl px-4 py-2 transition-all border-2 border-white/25 hover:border-white/50"
              >
                {g.emoji} {g.title}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ emoji, text }: { emoji: string; text: string }) {
  return (
    <h2 className="font-display text-3xl md:text-4xl text-center text-gray-700 mb-5 mt-2">
      {emoji} {text}
    </h2>
  );
}

function StatChip({ emoji, label, value, color }: { emoji: string; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-2xl bg-white border-4 border-white shadow-kid font-bold">
      <span className="text-xl md:text-2xl">{emoji}</span>
      <div className="text-left">
        <p className="text-xs text-gray-400 leading-none">{label}</p>
        <p className="text-lg md:text-xl font-display leading-tight" style={{ color }}>{value}</p>
      </div>
    </div>
  );
}
