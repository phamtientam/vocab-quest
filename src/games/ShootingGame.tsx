import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { categories, getAllWords, getCategoryById } from '../data';
import { GameLayout } from '../layouts/GameLayout';
import { AnimatedButton } from '../components/AnimatedButton';
import { useSpeech } from '../hooks/useSpeech';
import { useSound } from '../hooks/useSound';
import { useProgress } from '../hooks/useProgress';
import { launchConfetti, shakeElement } from '../animations/effects';
import type { VocabWord } from '../data/types';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}
function getWordPool(catId: string): VocabWord[] {
  if (catId === 'all') return shuffle(getAllWords()).slice(0, 24);
  const cat = getCategoryById(catId);
  return cat ? shuffle(cat.words) : [];
}

interface Target {
  id: number;
  word: VocabWord;
  lane: number;   // vertical band 0-3
  done: boolean;
  active: boolean;
}

let uid = 0;

export function ShootingGame() {
  const [params] = useSearchParams();
  const catId = params.get('category') || categories[0].id;
  const wordPool  = useRef(getWordPool(catId));
  const [currentTarget, setCurrentTarget] = useState<VocabWord | null>(null);
  const [flyingTargets, setFlyingTargets]  = useState<Target[]>([]);
  const [score, setScore]   = useState(0);
  const [lives, setLives]   = useState(3);
  const [round, setRound]   = useState(0);
  const [gameState, setGameState] = useState<'idle'|'playing'|'gameover'>('idle');

  const { speak }  = useSpeech();
  const { play }   = useSound();
  const { addScore, markWordLearned } = useProgress();

  const arenaRef   = useRef<HTMLDivElement>(null);
  const tweensRef  = useRef<Map<number, gsap.core.Tween>>(new Map());
  const elMap      = useRef<Map<number, HTMLDivElement>>(new Map());
  const usedWords  = useRef<Set<number>>(new Set());
  const targetRef  = useRef<VocabWord | null>(null);
  const roundRef   = useRef(0);

  /* ─── speed ramps up every 5 hits ─── */
  const speed = useCallback(() => {
    const base = 7;
    const min  = 3.2;
    return Math.max(min, base - roundRef.current * 0.18);
  }, []);

  /* ─── pick correct word ─── */
  const pickWord = useCallback(() => {
    const pool = wordPool.current.filter(w => !usedWords.current.has(w.id));
    if (pool.length === 0) { usedWords.current.clear(); return wordPool.current[0]; }
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  /* ─── spawn a batch of flying targets ─── */
  const spawnBatch = useCallback((correct: VocabWord) => {
    const distractors = shuffle(wordPool.current.filter(w => w.id !== correct.id)).slice(0, 3);
    const all = shuffle([correct, ...distractors]);
    const lanes = shuffle([0, 1, 2, 3]).slice(0, all.length);
    return all.map((w, i): Target => ({
      id: ++uid,
      word: w,
      lane: lanes[i],
      done: false,
      active: false,
    }));
  }, []);

  /* ─── start a round ─── */
  const startRound = useCallback(() => {
    // kill old tweens
    tweensRef.current.forEach(t => t.kill());
    tweensRef.current.clear();

    const word = pickWord();
    usedWords.current.add(word.id);
    targetRef.current = word;
    setCurrentTarget(word);
    speak(word.word);

    const batch = spawnBatch(word);
    setFlyingTargets(batch);
  }, [pickWord, spawnBatch, speak]);

  useEffect(() => {
    wordPool.current = getWordPool(catId);

    usedWords.current.clear();
    targetRef.current = null;

    setCurrentTarget(null);
    setFlyingTargets([]);
    setScore(0);
    setLives(3);
    setRound(0);

    roundRef.current = 0;

    if (gameState === 'playing') {
      setTimeout(startRound, 100);
    }
  }, [catId]);

  /* ─── animate targets flying across screen ─── */
  useGSAP(() => {
    if (gameState !== 'playing' || flyingTargets.length === 0) return;

    flyingTargets.forEach(t => {
      const el = elMap.current.get(t.id);
      if (!el) return;
      if (tweensRef.current.has(t.id)) {
        return;
      }
      const dur = speed() + Math.random() * 1.5;
      gsap.set(el, { x: window.innerWidth + 80, opacity: 1, scale: 1 });
      
      const tween = gsap.to(el, {
        x: -(el.offsetWidth + 80),
        duration: dur,
        ease: 'none',
        delay: t.lane * 0.45,

        onStart: () => {
          if (window.innerWidth < 500) {
            setTimeout(() => {
              activeTargetsRef.current.add(t.id);
            }, 1500 - score)
          } else {
            setTimeout(() => {
              activeTargetsRef.current.add(t.id);
            }, 2500 - score)
          }
        },
        onComplete: () => {
          activeTargetsRef.current.delete(t.id);
          tweensRef.current.delete(t.id);
          const correct = targetRef.current;
          if (!t.done && correct && t.word.id === correct.id) {
            // missed the correct target — lose a life
            setLives(l => {
              const nl = l - 1;
              play('wrong');
              if (nl <= 0) {
                addScore('shoot', score);
                setGameState('gameover');
              }
              return nl;
            });
          }
          const tween = tweensRef.current.get(t.id);

          if (tween) {
            tween.kill();
            tweensRef.current.delete(t.id);
          }
          setFlyingTargets(prev => prev.filter(x => x.id !== t.id));
        },
      });
      tweensRef.current.set(t.id, tween);
    });
  }, { scope: arenaRef, dependencies: [flyingTargets, gameState] });

  /* ─── auto-advance when all targets gone ─── */
  useEffect(() => {
    if (gameState === 'playing' && flyingTargets.length === 0 && currentTarget) {
      const t = setTimeout(startRound, 500);
      return () => clearTimeout(t);
    }
  }, [flyingTargets, gameState, currentTarget, startRound]);

  /* ─── shoot handler ─── */
  const handleShoot = useCallback((t: Target) => {
    if (t.done) return;
    const el = elMap.current.get(t.id);
    const correct = targetRef.current;

    if (correct && t.word.id === correct.id) {
      // ✅ Hit
      tweensRef.current.get(t.id)?.kill();
      play('correct');
      speak(t.word.word);
      markWordLearned(t.word.word);

      roundRef.current++;
      setRound(r => r + 1);
      setScore(s => s + 15);

      // Explosion timeline
      if (el) {
        const tl = gsap.timeline({
          onComplete: () => {
            setFlyingTargets(prev => prev.map(x => x.id === t.id ? { ...x, done: true } : x));
          },
        });
        tl.to(el, { scale: 1.8, duration: 0.1, ease: 'power3.out' })
          .to(el, { scale: 0, opacity: 1, duration: 0.2, ease: 'back.in(2)' });
        launchConfetti(el);
      }

      // Clear remaining and start next round after short delay
      setTimeout(() => {
        tweensRef.current.forEach(tw => tw.kill());
        tweensRef.current.clear();
        setFlyingTargets([]);
      }, 300);

    } else {
      // ❌ Wrong
      play('wrong');
      if (el) shakeElement(el);
    }
  }, [play, speak, markWordLearned]);

  const startGame = () => {
    setScore(0); setLives(3); setRound(0);
    roundRef.current = 0;
    usedWords.current.clear();
    wordPool.current = getWordPool(catId);
    setGameState('playing');
    setTimeout(startRound, 100);
  };

  const activeTargetsRef = useRef(new Set<number>());

  const laneHeights = ['14%', '34%', '55%', '74%'];

  return (
    <GameLayout title="Shooting Game" emoji="🎯" categoryId={catId !== 'all' ? catId : undefined} score={score} showScore>
      <div className="max-w-3xl mx-auto">

        {/* ── IDLE ── */}
        {gameState === 'idle' && (
          <div className="text-center py-14">
            <div className="text-8xl mb-4 animate-bounce">🎯</div>
            <h2 className="font-display text-4xl text-gray-700 mb-3">Shooting Game!</h2>
            <p className="text-gray-500 font-bold text-lg mb-2">
              Tap the correct emoji that matches the word!
            </p>
            <p className="text-gray-400 text-sm font-bold mb-8">
              Targets speed up as you score more — watch out! 🔥
            </p>
            <AnimatedButton color="coral" size="lg" onClick={startGame}>🚀 Start!</AnimatedButton>
          </div>
        )}

        {/* ── GAME OVER ── */}
        {gameState === 'gameover' && (
          <div className="text-center py-14">
            <div className="text-8xl mb-4">💥</div>
            <h2 className="font-display text-4xl text-rose-500 mb-2">Game Over!</h2>
            <p className="text-xl font-bold text-gray-600 mb-1">Hits: {round}</p>
            <p className="text-2xl font-bold text-gray-700 mb-6">Final Score: ⭐ {score}</p>
            <AnimatedButton color="coral" size="lg" onClick={startGame}>🔄 Try Again</AnimatedButton>
          </div>
        )}

        {/* ── PLAYING ── */}
        {gameState === 'playing' && (
          <>
            {/* HUD */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className={`text-2xl transition-all ${i < lives ? '' : 'opacity-20 grayscale'}`}>❤️</span>
                ))}
              </div>

              <button
                className="flex-1 bg-white/90 rounded-2xl px-4 py-2 font-display text-xl md:text-2xl shadow-kid text-center hover:bg-white transition-colors"
                onClick={() => speak(currentTarget?.word || '')}
              >
                Find: <span className="text-coral-500 uppercase">{currentTarget?.word}</span>
                <span className="ml-2 text-base">🔊</span>
              </button>

              <div className="bg-lemon-400 rounded-2xl px-3 py-2 font-display text-lg shadow-kid text-gray-800">
                #{round}
              </div>
            </div>

            {/* Arena */}
            <div
              ref={arenaRef}
              className="relative rounded-3xl border-4 border-white shadow-xl overflow-hidden"
              style={{
                height: 340,
                background: 'linear-gradient(160deg, #bae6fd 0%, #e0f2fe 40%, #bfdbfe 100%)',
              }}
            >
              {/* Cloud decorations */}
              <div className="absolute opacity-30 text-6xl select-none pointer-events-none" style={{ top: '5%', left: '10%' }}>☁️</div>
              <div className="absolute opacity-20 text-4xl select-none pointer-events-none" style={{ top: '45%', left: '60%' }}>☁️</div>

              {/* Lane guide lines */}
              {laneHeights.map((top, i) => (
                <div key={i} className="absolute w-full" style={{ top, height: 2, background: 'rgba(255,255,255,0.4)' }} />
              ))}

              {/* Flying targets */}
              {flyingTargets.map(t => (
        <div
          key={t.id}
          className="absolute w-full cursor-pointer"
          style={{
            top: laneHeights[t.lane],
            height: '70px',
            transform: 'translateY(-50%)',
            // pointerEvents: activeTargetsRef.current.has(t.id)
            //   ? 'auto'
            //   : 'none',
          }}
          onClick={() => {
            console.log('Clicked target', t.id, 'active:', activeTargetsRef.current.has(t.id));
            if (!activeTargetsRef.current.has(t.id)) {
              return;
            }

            const correct = targetRef.current;

            if (!correct) return;

            if (t.word.id !== correct.id) {
              play('wrong');
              return;
            }

            handleShoot(t);
          }}
        >
    <div
      ref={el => {
        if (el) elMap.current.set(t.id, el);
        else elMap.current.delete(t.id);
      }}
      className="absolute"
    >
      <div className="flex flex-col items-center">
        <div className="text-6xl">{t.word.emoji}</div>
      </div>
    </div>
  </div>
))}

              {flyingTargets.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-sky-400 text-xl animate-pulse">Get ready…</span>
                </div>
              )}
            </div>

            {/* Speed indicator */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">Speed:</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (round / 25) * 100)}%`,
                    background: round < 10 ? '#a3e635' : round < 20 ? '#fb923c' : '#ef4444',
                  }}
                />
              </div>
              <span className="text-xs font-bold text-gray-400">🔥</span>
            </div>
          </>
        )}
      </div>
    </GameLayout>
  );
}
