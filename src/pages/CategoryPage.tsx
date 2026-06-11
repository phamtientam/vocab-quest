import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { getCategoryById } from '../data';
import { VocabularyCard } from '../components/VocabularyCard';
import { AnimatedButton } from '../components/AnimatedButton';
import type { VocabWord } from '../data/types';


const GAME_LINKS = [
  { label: '🧩 Quiz',   path: (id: string) => `/game/quiz?category=${id}`,   color: 'grape' as const },
  { label: '🃏 Memory', path: (id: string) => `/game/memory?category=${id}`, color: 'rose'  as const },
  { label: '🎯 Drag',   path: (id: string) => `/game/drag?category=${id}`,   color: 'coral' as const },
  { label: '🔫 Shoot',  path: (id: string) => `/game/shoot?category=${id}`,  color: 'coral' as const },
  { label: '🏎️ Race',   path: (id: string) => `/game/race?category=${id}`,   color: 'green' as const },
  { label: '🎤 Speak',  path: (id: string) => `/game/speak?category=${id}`,  color: 'blue'  as const },
];

export function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const category = getCategoryById(id!);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef  = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'grid'|'flashcard'>('grid');
  const [currentIndex, setCurrentIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const changePage = (newPage: number) => {
    setPage(newPage);

    setTimeout(() => {
      contentRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  };
  

  useGSAP(() => {
    gsap.from(headerRef.current, { y: -40, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' });
    const cards = cardsRef.current?.querySelectorAll('.vocab-item');
    if (cards) {
      gsap.from(cards, { y: 50, opacity: 1, stagger: 0.05, duration: 0.4, ease: 'back.out(1.4)', delay: 0.15 });
    }
  });

  if (!category) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
        <p className="text-6xl">😕</p>
        <p className="font-display text-2xl text-gray-600">Category not found</p>
        <AnimatedButton onClick={() => navigate('/')} color="blue">← Home</AnimatedButton>
      </div>
    );
  }

  const goNext   = () => setCurrentIndex(i => Math.min(i + 1, category.words.length - 1));
  const goPrev   = () => setCurrentIndex(i => Math.max(i - 1, 0));
  const goRandom = () => setCurrentIndex(Math.floor(Math.random() * category.words.length));

  const ITEMS_PER_PAGE = 10;

const [page, setPage] = useState(1);

const totalPages = Math.ceil(category.words.length / ITEMS_PER_PAGE);

const currentWords = category.words.slice(
  (page - 1) * ITEMS_PER_PAGE,
  page * ITEMS_PER_PAGE
);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div
        ref={headerRef}
        className="px-4 pt-5 pb-4 bg-white/70 backdrop-blur-sm border-b-4 border-white shadow-md"
      >
        <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate('/')}
            className="text-lg bg-gray-100 hover:bg-gray-200 rounded-2xl px-4 py-2 font-bold transition-colors active:scale-95"
          >
            ← Back
          </button>
          <h1 className="font-display text-3xl md:text-4xl flex items-center gap-2" style={{ color: category.color }}>
            {category.emoji} {category.name}
          </h1>
          <span className="text-gray-400 font-bold text-sm ml-1">{category.words.length} words</span>
          <div className="ml-auto flex gap-2">
            {(['grid','flashcard'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-xl font-bold text-sm capitalize transition-colors
                  ${mode === m ? 'bg-sky-500 text-white shadow-kid' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
              >
                {m === 'grid' ? '📋 Grid' : '🃏 Cards'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={contentRef}
        className="max-w-5xl mx-auto px-4 py-6"
      >
        {mode === 'grid' ? (
          <div
            ref={cardsRef}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
          >
            {currentWords.map((word: VocabWord) => (
              <div key={word.id} className="vocab-item">
                <VocabularyCard word={word} color={category.color} bgColor={category.bgColor} />
              </div>
            ))}
            <div className="flex items-center justify-end md:justify-between gap-2 md:gap-4 mt-6 mr-2 md:mr-0">
            <button
              onClick={() => changePage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="
                px-3 py-2 md:px-5 md:py-3
                rounded-xl md:rounded-2xl
                bg-white
                border-2 md:border-4 border-white
                shadow-kid
                font-bold
                text-sm md:text-base
                text-gray-700
                transition-all duration-200
                hover:scale-105 hover:-translate-y-1
                active:scale-95
                disabled:opacity-40
              "
            >
              ← <span className="hidden sm:inline">Prev</span>
            </button>

            <div
              className="
                min-w-[60px] md:min-w-[90px]
                h-10 md:h-14
                px-2
                rounded-xl md:rounded-2xl
                bg-white
                border-2 md:border-4 border-white
                shadow-kid
                flex items-center justify-center
                font-display
                text-sm md:text-xl
                text-gray-800
              "
            >
              {page} / {totalPages}
            </div>

            <button
              onClick={() => changePage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="
                px-3 py-2 md:px-5 md:py-3
                rounded-xl md:rounded-2xl
                bg-gradient-to-r
                from-sky-400 to-blue-500
                text-white
                font-bold
                text-sm md:text-base
                shadow-kid
                transition-all duration-200
                hover:scale-105 hover:-translate-y-1
                active:scale-95
                disabled:opacity-40
              "
            >
              <span className="hidden sm:inline">Next</span> →
            </button>
          </div>
          </div>
        ) : (
          <FlashcardMode
            words={category.words}
            color={category.color}
            bgColor={category.bgColor}
            currentIndex={currentIndex}
            onNext={goNext}
            onPrev={goPrev}
            onRandom={goRandom}
          />
        )}

        {/* Games section */}
        <div
          className="
            mt-6 md:mt-10
            bg-white/60
            rounded-2xl md:rounded-3xl
            p-3 md:p-5
            border-4 border-white
            shadow-lg
          "
        >
          <h2
            className="
              font-display
              text-lg md:text-2xl
              text-gray-700
              mb-3 md:mb-4
              text-center
            "
          >
            🎮 Play with {category.name}!
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {GAME_LINKS.map(g => (
              <AnimatedButton
                key={g.label}
                color={g.color}
                size="sm"
                onClick={() => navigate(g.path(category.id))}
                className="
                  w-full
                  text-center
                  text-xs md:text-sm
                  min-h-[48px] md:min-h-[56px]
                "
              >
                {g.label}
              </AnimatedButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FlashcardMode({ words, color, bgColor, currentIndex, onNext, onPrev, onRandom }:
  { words: VocabWord[]; color: string; bgColor: string; currentIndex: number; onNext: () => void; onPrev: () => void; onRandom: () => void }
) {
  const cardRef = useRef<HTMLDivElement>(null);

  const animateSwap = (fn: () => void, dir: 'left'|'right'|'random' = 'right') => {
    const x = dir === 'left' ? 80 : dir === 'right' ? -80 : (Math.random() > 0.5 ? 80 : -80);
    gsap.to(cardRef.current, {
      x, opacity: 1, duration: 0.18, ease: 'power2.in',
      onComplete: () => {
        fn();
        gsap.fromTo(cardRef.current, { x: -x, opacity: 1 }, { x: 0, opacity: 1, duration: 0.28, ease: 'back.out(1.6)' });
      },
    });
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="font-bold text-gray-400">{currentIndex + 1} / {words.length}</p>
      {/* Progress dots */}
      <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
        {words.map((_, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full transition-all duration-300"
            style={{ background: i === currentIndex ? color : i < currentIndex ? color + '55' : '#e5e7eb' }}
          />
        ))}
      </div>
      <div ref={cardRef} className="w-full max-w-sm">
        <VocabularyCard word={words[currentIndex]} color={color} bgColor={bgColor} />
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        <AnimatedButton color="blue" onClick={() => animateSwap(onPrev, 'left')} disabled={currentIndex === 0}>← Prev</AnimatedButton>
        <AnimatedButton color="yellow" onClick={() => animateSwap(onRandom, 'random')}>🎲 Random</AnimatedButton>
        <AnimatedButton color="coral" onClick={() => animateSwap(onNext, 'right')} disabled={currentIndex === words.length - 1}>Next →</AnimatedButton>
      </div>
    </div>
  );
}
