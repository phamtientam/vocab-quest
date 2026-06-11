
import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { categories, getAllWords, getCategoryById } from '../data';
import { GameLayout } from '../layouts/GameLayout';
import { AnimatedButton } from '../components/AnimatedButton';
import { StarsBurst } from '../components/StarsBurst';
import { useSpeech } from '../hooks/useSpeech';
import { useSound } from '../hooks/useSound';
import { useProgress } from '../hooks/useProgress';
import { launchConfetti } from '../animations/effects';
import type { VocabWord } from '../data/types';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getWordPool(catId: string): VocabWord[] {
  if (catId === 'all') return shuffle(getAllWords()).slice(0, 8);
  const cat = getCategoryById(catId);
  return cat ? shuffle(cat.words).slice(0, 6) : [];
}

type CardType = 'emoji' | 'word';

interface Card {
  id: number;
  word: VocabWord;
  type: CardType;
  pairId: number;
  flipped: boolean;
  matched: boolean;
}

let cardUid = 0;

function buildCards(words: VocabWord[]): Card[] {
  const cards: Card[] = [];
  words.forEach((w, i) => {
    const pairId = i;
    cards.push({ id: ++cardUid, word: w, type: 'emoji', pairId, flipped: false, matched: false });
    cards.push({ id: ++cardUid, word: w, type: 'word', pairId, flipped: false, matched: false });
  });
  return shuffle(cards);
}

export function MemoryGame() {
  const [params] = useSearchParams();
  const catId = params.get('category') || categories[0].id;
  const [cards, setCards]         = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [score, setScore]         = useState(0);
  const [moves, setMoves]         = useState(0);
  const [matches, setMatches]     = useState(0);
  const [gameState, setGameState] = useState<'idle'|'playing'|'won'>('idle');
  const [lock, setLock]           = useState(false);
  // Track whether this is the very first deal (for entrance anim)
  const isFirstDeal = useRef(false);

  const { speak }  = useSpeech();
  const { play }   = useSound();
  const { addScore, markWordLearned } = useProgress();

  const boardRef    = useRef<HTMLDivElement>(null);
  const cardElRefs  = useRef<Map<number, HTMLDivElement>>(new Map());
  const totalPairs  = useRef(0);

  const startGame = useCallback(() => {
    const pool = getWordPool(catId);
    totalPairs.current = pool.length;
    const built = buildCards(pool);
    // Kill ALL existing GSAP tweens on card elements before replacing cards
    cardElRefs.current.forEach(el => gsap.killTweensOf(el));
    cardElRefs.current.clear();
    isFirstDeal.current = true;
    setCards(built);
    setFlippedIds([]);
    setScore(0);
    setMoves(0);
    setMatches(0);
    setLock(false);
    setGameState('playing');
  }, [catId]);

  /* ─── Entrance animation — only on fresh deal ─── */
  useGSAP(() => {
    if (gameState !== 'playing' || !isFirstDeal.current) return;
    isFirstDeal.current = false; // reset flag so future state updates don't re-trigger
    const els = boardRef.current?.querySelectorAll('.mem-card');
    if (!els || els.length === 0) return;
    gsap.fromTo(
      els,
      { scale: 0.6, opacity: 0, rotation: 0 }, // ← no rotation in FROM
      {
        scale: 1, opacity: 1, rotation: 0,
        stagger: { each: 0.04, from: 'random' },
        duration: 0.4,
        ease: 'back.out(1.8)',
        clearProps: 'transform', // ← clean up after animation finishes
      }
    );
  }, { scope: boardRef, dependencies: [cards] });

  /* ─── Flip a card ─── */
  const flipCard = useCallback((card: Card) => {
    if (lock || card.flipped || card.matched || gameState !== 'playing') return;

    const el = cardElRefs.current.get(card.id);
    if (el) {
      gsap.timeline()
        .to(el,  { rotateY: 90, duration: 0.12, ease: 'power2.in' })
        .to(el,  { rotateY: 0,  duration: 0.18, ease: 'back.out(1.5)', clearProps: 'rotateY' });
    }
    speak(card.word.word);
    play('click');

    const newFlipped = [...flippedIds, card.id];
    setFlippedIds(newFlipped);
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, flipped: true } : c));

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setLock(true);

      const [id1] = newFlipped;
      const c1 = cards.find(c => c.id === id1)!;
      const c2 = card;

      if (c1.pairId === c2.pairId && c1.type !== c2.type) {
        // ✅ Match!
        play('correct');
        markWordLearned(c1.word.word);
        const pts = Math.max(10, 30 - moves);
        setScore(s => s + pts);
        setMatches(m => {
          const nm = m + 1;
          if (nm === totalPairs.current) {
            addScore('memory', score + pts);
            setTimeout(() => setGameState('won'), 600);
          }
          return nm;
        });

        setTimeout(() => {
          [id1, card.id].forEach(id => {
            const el2 = cardElRefs.current.get(id);
            if (el2) {
              launchConfetti(el2);
              // clearProps after bounce so transform is clean
              gsap.to(el2, {
                scale: 1.12, duration: 0.15, yoyo: true, repeat: 1,
                ease: 'power2.out', clearProps: 'scale',
              });
            }
          });
          setCards(prev => prev.map(c =>
            (c.id === id1 || c.id === card.id) ? { ...c, matched: true } : c
          ));
          setFlippedIds([]);
          setLock(false);
        }, 250);

      } else {
        // ❌ No match — flip back
        play('wrong');
        setTimeout(() => {
          [id1, card.id].forEach(id => {
            const el2 = cardElRefs.current.get(id);
            if (el2) {
              gsap.timeline()
                .to(el2, { rotateY: 90, duration: 0.15, ease: 'power2.in' })
                .to(el2, { rotateY: 0,  duration: 0.2,  clearProps: 'rotateY' });
            }
          });
          setCards(prev => prev.map(c =>
            (c.id === id1 || c.id === card.id) ? { ...c, flipped: false } : c
          ));
          setFlippedIds([]);
          setLock(false);
        }, 900);
      }
    }
  }, [lock, flippedIds, cards, gameState, moves, score, speak, play, markWordLearned, addScore]);

  /* ─── Won confetti ─── */
  useEffect(() => {
    if (gameState === 'won') launchConfetti(boardRef.current);
  }, [gameState]);

  const cols = 4;

  return (
    <GameLayout title="Memory Game" emoji="🃏" categoryId={catId !== 'all' ? catId : undefined} score={score} showScore={gameState === 'playing'}>
      <div className="max-w-2xl mx-auto">

        {/* IDLE */}
        {gameState === 'idle' && (
          <div className="text-center py-12">
            <div className="text-8xl mb-4 animate-bounce">🃏</div>
            <h2 className="font-display text-4xl text-gray-700 mb-3">Memory Game!</h2>
            <p className="text-gray-500 font-bold text-lg mb-2">Match each emoji with its English word!</p>
            <p className="text-gray-400 text-sm font-bold mb-8">Fewer moves = more points ✨</p>
            <AnimatedButton color="grape" size="lg" onClick={startGame}>🎴 Start!</AnimatedButton>
          </div>
        )}

        {/* PLAYING */}
        {gameState === 'playing' && (
          <>
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="bg-white/80 rounded-2xl px-4 py-2 font-display text-lg shadow-kid">
                🎯 {matches}/{totalPairs.current}
              </div>
              <div className="bg-white/80 rounded-2xl px-4 py-2 font-display text-lg shadow-kid">
                👆 {moves} moves
              </div>
              <AnimatedButton color="yellow" size="sm" onClick={startGame}>🔄</AnimatedButton>
            </div>

            <div
              ref={boardRef}
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            >
              {cards.map(card => (
                <MemCard
                  key={card.id}
                  card={card}
                  onFlip={flipCard}
                  elRef={el => {
                    if (el) cardElRefs.current.set(card.id, el);
                    else cardElRefs.current.delete(card.id);
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* WON */}
        {gameState === 'won' && (
          <WonScreen score={score} moves={moves} pairs={totalPairs.current} onReplay={startGame} />
        )}
      </div>
    </GameLayout>
  );
}

/* ─── MemCard — no inline transform style, let GSAP own it fully ─── */
function MemCard({ card, onFlip, elRef }: {
  card: Card;
  onFlip: (c: Card) => void;
  elRef: (el: HTMLDivElement | null) => void;
}) {
  const showFace = card.flipped || card.matched;

  return (
    <div
      ref={elRef}
      className={`
        mem-card aspect-square rounded-2xl border-4 flex items-center justify-center
        cursor-pointer select-none
        ${card.matched
          ? 'bg-lime-100 border-lime-400 opacity-60 cursor-default'
          : showFace
            ? 'bg-white border-sky-400 shadow-kid'
            : 'bg-gradient-to-br from-sky-400 to-indigo-500 border-sky-500 shadow-kid'
        }
      `}
      // ← removed style={{ transform:'none' }} — was fighting GSAP
      onClick={() => onFlip(card)}
    >
      {showFace ? (
        <div className="text-center p-1">
          {card.type === 'emoji'
            ? <span className="text-4xl leading-none">{card.word.emoji}</span>
            : <span className="font-display text-base md:text-xl text-gray-800 capitalize leading-tight">{card.word.word}</span>
          }
        </div>
      ) : (
        <span className="text-3xl select-none">❓</span>
      )}
    </div>
  );
}

/* ─── Won Screen ─── */
function WonScreen({ score, moves, pairs, onReplay }: {
  score: number; moves: number; pairs: number; onReplay: () => void;
}) {
  const ref    = useRef<HTMLDivElement>(null);
  const rating = moves <= pairs + 2 ? 3 : moves <= pairs + 6 ? 2 : 1;

  useGSAP(() => {
    gsap.fromTo(ref.current,
      { scale: 0.7, opacity: 0 },
      { scale: 1,   opacity: 1, duration: 0.5, ease: 'back.out(2)' }
    );
  }, { scope: ref });

  return (
    <div ref={ref} className="text-center py-8" style={{ opacity: 0 }}>
      <div className="text-7xl mb-3">🏆</div>
      <h2 className="font-display text-4xl text-lime-600 mb-2">You Won!</h2>
      <p className="text-gray-500 font-bold text-xl mb-1">⭐ {score} points</p>
      <p className="text-gray-400 font-bold mb-5">Completed in {moves} moves</p>
      <StarsBurst count={rating} visible />
      <div className="mt-6 flex gap-4 justify-center">
        <AnimatedButton color="grape" size="lg" onClick={onReplay}>🔄 Play Again</AnimatedButton>
      </div>
    </div>
  );
}
