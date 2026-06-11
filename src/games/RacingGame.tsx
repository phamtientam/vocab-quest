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
  if (catId === 'all') return shuffle(getAllWords());
  const cat = getCategoryById(catId);
  return cat ? shuffle(cat.words) : [];
}

const LANE_COUNT = 3;
const ROUND_SCORE = 10;

export function RacingGame() {
  const [params] = useSearchParams();
  const catId = params.get('category') || categories[0].id;
  const wordPool    = useRef<VocabWord[]>(getWordPool(catId));
  const [lanes, setLanes]     = useState<VocabWord[]>([]);
  const [target, setTarget]   = useState<VocabWord | null>(null);
  const [carLane, setCarLane] = useState(1);
  const [score, setScore]     = useState(0);
  const [lives, setLives]     = useState(3);
  const [streak, setStreak]   = useState(0);
  const [gameState, setGameState] = useState<'idle'|'playing'|'checking'|'gameover'>('idle');
  const [feedback, setFeedback]   = useState<'correct'|'wrong'|null>(null);

  const { speak }  = useSpeech();
  const { play }   = useSound();
  const { addScore, markWordLearned } = useProgress();

  const arenaRef = useRef<HTMLDivElement>(null);
  const carRef   = useRef<HTMLDivElement>(null);
  const roadRef  = useRef<HTMLDivElement>(null);
  const emojiRefs = useRef<(HTMLDivElement|null)[]>([null,null,null]);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const usedIdx  = useRef(0);
  const canAct   = useRef(true);
  const roadTween = useRef<gsap.core.Tween|null>(null);
  const touchStartX = useRef(0);

  /* ─── Road scroll animation ─── */
  const startRoadScroll = useCallback(() => {
    if (!roadRef.current) return;
    roadTween.current?.kill();
    gsap.set(roadRef.current, { backgroundPositionY: '0px' });
    roadTween.current = gsap.to(roadRef.current, {
      backgroundPositionY: '120px',
      duration: 0.6,
      ease: 'none',
      repeat: -1,
    });
  }, []);

  const stopRoadScroll = useCallback(() => {
    roadTween.current?.kill();
  }, []);

  /* ─── Setup round ─── */
  const setupRound = useCallback(() => {
    const pool  = wordPool.current;
    const start = usedIdx.current % pool.length;
    // Pick 3 distinct words
    const picked = [
      pool[start % pool.length],
      pool[(start + 1) % pool.length],
      pool[(start + 2) % pool.length],
    ];
    usedIdx.current += 3;

    const correctLane = Math.floor(Math.random() * LANE_COUNT);
    setLanes(picked);
    setTarget(picked[correctLane]);
    speak(picked[correctLane].word);
    setFeedback(null);
    canAct.current = true;
  }, [speak]);

  /* ─── Animate emoji targets dropping in ─── */
  useGSAP(() => {
    if (gameState !== 'playing' && gameState !== 'checking') return;
    emojiRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el,
        { y: -80, opacity: 1, scale: 0.7 },
        { y: 0, opacity: 1, scale: 1, duration: 0.45, delay: i * 0.08, ease: 'back.out(1.8)' }
      );
    });
  }, { scope: arenaRef, dependencies: [lanes, gameState] });

  /* ─── Move car ─── */
  const moveCar = useCallback((lane: number) => {
    if (!canAct.current) return;
    const clamped = Math.max(0, Math.min(LANE_COUNT - 1, lane));
    setCarLane(clamped);
    const laneW = 100 / LANE_COUNT;
    gsap.to(carRef.current, {
      left: `${laneW * clamped + laneW / 2}%`,
      duration: 0.18,
      ease: 'power3.out',
    });
    play('whoosh');
  }, [play]);

  /* ─── Check collision ─── */
  const checkCollision = useCallback(() => {
    if (gameState !== 'playing' || !canAct.current || !target) return;
    const hit = lanes[carLane];
    if (!hit) return;

    canAct.current = false;
    setGameState('checking');

    if (hit.id === target.id) {
      play('correct');
      speak(target.word);
      markWordLearned(target.word);
      const newStreak = streak + 1;
      setStreak(newStreak);
      const bonus = newStreak >= 3 ? ROUND_SCORE * 2 : ROUND_SCORE;
      setScore(s => s + bonus);
      setFeedback('correct');
      launchConfetti(carRef.current);

      // Car victory bounce
      gsap.timeline()
        .to(carRef.current, { scale: 1.5, y: -20, duration: 0.2, ease: 'back.out(2)' })
        .to(carRef.current, { scale: 1, y: 0, duration: 0.3, ease: 'bounce.out' });

      // Target grows & fades
      const tgt = emojiRefs.current[carLane];
      if (tgt) gsap.to(tgt, { scale: 2, opacity: 1, duration: 0.3 });

      setTimeout(() => { setGameState('playing'); setupRound(); }, 1300);
    } else {
      play('wrong');
      setStreak(0);
      setFeedback('wrong');
      shakeElement(carRef.current);

      // Flash wrong target red
      const wrongEl = emojiRefs.current[carLane];
      if (wrongEl) {
        gsap.to(wrongEl, { backgroundColor: '#fecaca', duration: 0.1, yoyo: true, repeat: 3 });
      }

      setLives(l => {
        const nl = l - 1;
        if (nl <= 0) {
          stopRoadScroll();
          addScore('race', score);
          setTimeout(() => setGameState('gameover'), 1200);
        } else {
          setTimeout(() => { setGameState('playing'); setupRound(); }, 1300);
        }
        return nl;
      });
    }
  }, [gameState, carLane, lanes, target, streak, score, speak, play, markWordLearned, addScore, setupRound, stopRoadScroll]);

  /* ─── Keyboard ─── */
  useEffect(() => {
    if (gameState !== 'playing') return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); moveCar(carLane - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); moveCar(carLane + 1); }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); checkCollision(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [gameState, carLane, moveCar, checkCollision]);

  /* ─── Touch swipe ─── */
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      moveCar(dx > 0 ? carLane + 1 : carLane - 1);
    }
  };

  /* ─── Start game ─── */
  const startGame = () => {
    setScore(0); setLives(3); setStreak(0);
    setCarLane(1);
    usedIdx.current = 0;
    wordPool.current = getWordPool(catId);
    gsap.set(carRef.current, { left: '50%', scale: 1, y: 0 });
    setGameState('playing');
    startRoadScroll();
    setTimeout(setupRound, 80);
  };

  const laneColors = ['#38bdf8', '#a3e635', '#fb923c'];
  const laneW = 100 / LANE_COUNT;
  const isActive = gameState === 'playing' || gameState === 'checking';

  return (
    <GameLayout title="Racing Game" emoji="🏎️" categoryId={catId !== 'all' ? catId : undefined} score={score} showScore>
      <div className="max-w-lg mx-auto select-none">

        {/* ── IDLE ── */}
        {gameState === 'idle' && (
          <div className="text-center py-10">
            <div className="text-8xl mb-4 animate-bounce">🏎️</div>
            <h2 className="font-display text-4xl text-gray-700 mb-3">Racing Game!</h2>
            <p className="text-gray-500 font-bold text-lg mb-2">
              Steer your car into the lane with the correct emoji!
            </p>
            <p className="text-gray-400 font-bold text-sm mb-8">
              ← → arrow keys &nbsp;|&nbsp; swipe &nbsp;|&nbsp; tap buttons
            </p>
            <AnimatedButton color="green" size="lg" onClick={startGame}>🚀 Start Race!</AnimatedButton>
          </div>
        )}

        {/* ── GAME OVER ── */}
        {gameState === 'gameover' && (
          <div className="text-center py-10">
            <div className="text-8xl mb-4">🏁</div>
            <h2 className="font-display text-4xl text-rose-500 mb-2">Race Over!</h2>
            <p className="text-2xl font-bold text-gray-600 mb-6">Final Score: ⭐ {score}</p>
            <AnimatedButton color="green" size="lg" onClick={startGame}>🔄 Race Again</AnimatedButton>
          </div>
        )}

        {/* ── PLAYING ── */}
        {isActive && (
          <>
            {/* HUD */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className={`text-2xl transition-all duration-300 ${i < lives ? '' : 'opacity-20 grayscale'}`}>❤️</span>
                ))}
              </div>

              <button
                className="bg-white/90 rounded-2xl px-5 py-2 font-display text-xl shadow-kid flex items-center gap-2"
                onClick={() => speak(target?.word || '')}
              >
                <span className="text-coral-500 uppercase tracking-wide">{target?.word}</span>
                <span className="text-lg">🔊</span>
              </button>

              <div className="font-display text-lg text-gray-500">
                {streak >= 2 ? <span className="text-coral-500">🔥{streak}</span> : <span>⭐{score}</span>}
              </div>
            </div>

            {/* Feedback flash */}
            {feedback && (
              <div
                ref={feedbackRef}
                className={`text-center font-display text-2xl mb-2 transition-all ${
                  feedback === 'correct' ? 'text-lime-600' : 'text-rose-500'
                }`}
              >
                {feedback === 'correct'
                  ? (streak >= 3 ? `🔥 ${streak}x Streak! +${ROUND_SCORE * 2}` : '✅ Correct!')
                  : '❌ Wrong lane!'}
              </div>
            )}

            {/* Race track */}
            <div
              ref={arenaRef}
              className="relative rounded-3xl overflow-hidden border-4 border-white shadow-xl cursor-pointer"
              style={{ height: 300 }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={checkCollision}
            >
              {/* Scrolling road */}
              <div
                ref={roadRef}
                className="absolute inset-0"
                style={{
                  background: `
                    repeating-linear-gradient(
                      to bottom,
                      #475569 0px, #475569 50px,
                      #334155 50px, #334155 60px
                    )
                  `,
                  backgroundSize: '100% 120px',
                }}
              />

              {/* Kerb stripes left/right */}
              <div className="absolute left-0 top-0 bottom-0 w-5"
                style={{ background: 'repeating-linear-gradient(to bottom, #ef4444 0,#ef4444 15px, white 15px, white 30px)' }} />
              <div className="absolute right-0 top-0 bottom-0 w-5"
                style={{ background: 'repeating-linear-gradient(to bottom, #ef4444 0,#ef4444 15px, white 15px, white 30px)' }} />

              {/* Lane dividers */}
              {[laneW, laneW * 2].map(pos => (
                <div
                  key={pos}
                  className="absolute top-0 bottom-0 w-1"
                  style={{
                    left: `${pos}%`,
                    background: 'repeating-linear-gradient(to bottom, #facc15 0, #facc15 20px, transparent 20px, transparent 40px)',
                  }}
                />
              ))}

              {/* Emoji targets */}
              {lanes.map((w, i) => (
                <div
                  key={`${w.id}-lane${i}`}
                  ref={el => { emojiRefs.current[i] = el; }}
                  className="absolute flex flex-col items-center rounded-2xl px-2 py-2"
                  style={{
                    left: `${laneW * i + laneW / 2}%`,
                    top: 16,
                    transform: 'translateX(-50%)',
                    background: laneColors[i] + '33',
                    border: `3px solid ${laneColors[i]}`,
                    opacity: 1,
                  }}
                >
                  <span className="text-4xl leading-none">{w.emoji}</span>
                  {/* <span className="font-bold text-xs text-gray-700 mt-0.5 bg-white/80 rounded px-1">{w.word}</span> */}
                </div>
              ))}

              {/* Car */}
              <div
                ref={carRef}
                className="absolute text-5xl -translate-x-1/2"
                style={{ bottom: 20, left: '50%' }}
              >
                🏎️
              </div>

              {/* Tap hint overlay when checking */}
              {gameState === 'playing' && (
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="text-white/50 font-bold text-xs">Tap road or press ENTER to go!</span>
                </div>
              )}
            </div>

            {/* Touch controls */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <AnimatedButton
                color="blue" size="lg"
                onClick={() => moveCar(carLane - 1)}
                disabled={carLane === 0}
                className="w-full"
              >
                ◀ Left
              </AnimatedButton>
              <AnimatedButton
                color="coral" size="lg"
                onClick={checkCollision}
                className="w-full"
              >
                🏁 GO!
              </AnimatedButton>
              <AnimatedButton
                color="blue" size="lg"
                onClick={() => moveCar(carLane + 1)}
                disabled={carLane === LANE_COUNT - 1}
                className="w-full"
              >
                Right ▶
              </AnimatedButton>
            </div>
          </>
        )}
      </div>
    </GameLayout>
  );
}
