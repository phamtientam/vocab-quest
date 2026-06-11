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
import { launchConfetti, shakeElement, successPulse } from '../animations/effects';
import type { VocabWord } from '../data/types';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

type GameWord = VocabWord & {
  uid: string;
};

function getWords(catId: string): GameWord[] {
  const base =
    catId === 'all'
      ? getAllWords()
      : getCategoryById(catId)?.words || [];
  return shuffle(base) 
    .slice(0, 8)
    .map((w, index) => ({
      ...w,
      uid: `${w.id}-${w.word}-${index}`
    }));
}

// Detect mobile/touch device
const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export function DragDropGame() {
  const [params] = useSearchParams();
  const catId = params.get('category') || categories[0].id;

  const [words, setWords] = useState<GameWord[]>(() => getWords(catId));
  const [wordOrder, setWordOrder] = useState<GameWord[]>(() =>
    shuffle(getWords(catId))
  );
  // const [matched,   setMatched]   = useState<Set<number>>(new Set());
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState<GameWord | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  // Tap-to-select state (mobile)
  const [selected, setSelected]  = useState<GameWord | null>(null);

  const [score,     setScore]     = useState(0);
  const [feedback,  setFeedback]  = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const [allDone,   setAllDone]   = useState(false);
  const [isTouch]  = useState(isTouchDevice);

  const { speak }  = useSpeech();
  const { play }   = useSound();
  const { addScore, markWordLearned } = useProgress();

  const containerRef  = useRef<HTMLDivElement>(null);
  const dropRefs      = useRef<Map<string, HTMLDivElement>>(new Map());
  const feedbackRef   = useRef<HTMLDivElement>(null);
  const dragImgRef    = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const w = getWords(catId);
    setWords(w); setWordOrder(shuffle([...w])); setMatched(new Set());
    setScore(0); setFeedback(null); setAllDone(false);
  }, [catId]);

  useGSAP(() => {
    const items = containerRef.current?.querySelectorAll('.drag-item, .drop-target');
    if (items) gsap.from(items, { y: 30, opacity: 1, stagger: 0.05, duration: 0.4, ease: 'back.out(1.5)' });
  }, { scope: containerRef, dependencies: [words] });

  useEffect(() => {
    if (feedback) {
      gsap.fromTo(feedbackRef.current,
        { scale: 0.6, opacity: 1 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' }
      );
      const t = setTimeout(() => setFeedback(null), 1600);
      return () => clearTimeout(t);
    }
  }, [feedback]);
  /* ── Match logic (shared by both drag and tap) ── */
  const tryMatch = useCallback((source: GameWord, target: GameWord) => {
    const dropEl = dropRefs.current.get(target.uid);

    if (source.id === target.id && source.word === target.word) {
      play('correct');
      speak(target.word);
      markWordLearned(target.word);
      setMatched(prev => {
        const next = new Set([...prev, target.uid]);
        if (next.size === words.length) {
          addScore('drag', score + 10);
          setTimeout(() => setAllDone(true), 400);
        }
        return next;
      });
      setScore(s => s + 10);
      setFeedback({ msg: '✅ Correct! +10', type: 'success' });
      if (dropEl) { launchConfetti(dropEl); successPulse(dropEl, '#a3e635'); }
    } else {
      play('wrong');
      setFeedback({ msg: '❌ Try again!', type: 'error' });
      if (dropEl) shakeElement(dropEl);
    }
  }, [words, score, speak, play, markWordLearned, addScore]);

  /* ── Desktop: drag handlers ── */
  const handleDrop = useCallback((target: GameWord) => {
    if (!dragging) return;
    tryMatch(dragging, target);
    setDragging(null);
    setDragOver(null);
  }, [dragging, tryMatch]);

  /* ── Mobile: tap handlers ── */
  const handleTapWord = useCallback((word: GameWord) => {
    if (matched.has(word.uid)) return;
    speak(word.word);
    // Toggle select
    setSelected(prev => prev?.uid === word.uid ? null : word);
  }, [matched, speak]);

  const handleTapEmoji = useCallback((target: GameWord) => {
    if (matched.has(target.uid)) return;
    if (!selected) {
      // No word selected yet — hint
      const hintEl = dropRefs.current.get(target.uid);
      if (hintEl) gsap.fromTo(
        hintEl,
        { x: -6 }, { x: 6, duration: 0.05, repeat: 3, yoyo: true, clearProps: 'x' }
      );
      return;
    }
    tryMatch(selected, target);
    setSelected(null);
  }, [selected, matched, tryMatch]);

  const restart = () => {
    const w = getWords(catId);
    setWords(w); setWordOrder(shuffle([...w])); setMatched(new Set());
    setScore(0); setFeedback(null); setAllDone(false);
  };

  return (
  <GameLayout title="Drag & Drop" emoji="🎯" categoryId={catId !== 'all' ? catId : undefined} score={score} showScore>
      <div ref={containerRef} className="max-w-lg mx-auto px-2">

        {/* Toast feedback */}
        {feedback && (
          <div
            ref={feedbackRef}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-3xl font-display text-xl text-white shadow-2xl pointer-events-none
              ${feedback.type === 'success' ? 'bg-lime-500' : 'bg-rose-500'}`}
          >
            {feedback.msg}
          </div>
        )}

        {allDone ? (
          <AllDoneScreen score={score} total={words.length} onReplay={restart} />
        ) : (
          <>
            {/* Instruction */}
            <p className="text-center text-gray-500 font-bold text-base mb-3">
              {isTouch
                ? selected
                  ? `"${selected.word.toUpperCase()}" selected — tap an emoji! 👇`
                  : 'Tap a word, then tap the matching emoji! 👆'
                : 'Drag each word onto the matching emoji! 🖱️'
              }
            </p>

            {/* Selected word indicator (mobile) */}
            {isTouch && selected && (
              <div className="text-center mb-3">
                <span className="inline-block bg-sky-400 text-white font-display text-lg px-5 py-2 rounded-2xl shadow-kid animate-bounce">
                  {selected.word.toUpperCase()} →?
                </span>
              </div>
            )}

            {/* Headers */}
            <div className="grid grid-cols-2 gap-3 mb-1 px-1">
              <h3 className="font-display text-lg text-gray-500 text-center">📝 Words</h3>
              <h3 className="font-display text-lg text-gray-500 text-center">🎯 Emojis</h3>
            </div>

            {/* Paired rows */}
            <div className="flex flex-col gap-2">
              {words.map((emojiWord, rowIdx) => {
                const dragWord = wordOrder[rowIdx];
                const dragDone = matched.has(dragWord?.uid);
                const dropDone = matched.has(emojiWord.uid);
                const isOver   = dragOver === emojiWord.uid;
                const isSelectedWord = selected?.uid === dragWord?.uid;

                return (
                  <div key={emojiWord.uid} className="grid grid-cols-2 gap-3 items-stretch">

                    {/* ── Word chip ── */}
                    <div
                      // Desktop drag
                      draggable={!isTouch && !dragDone}
                      onDragStart={!isTouch ? () => { setDragging(dragWord); speak(dragWord.word); } : undefined}
                      onDragEnd={!isTouch ? () => { setDragging(null); setDragOver(null); } : undefined}
                      // Mobile tap
                      onClick={isTouch ? () => handleTapWord(dragWord) : undefined}
                      className={`drag-item rounded-2xl px-3 py-4 font-display text-lg text-center
                        border-4 select-none transition-all duration-150
                        flex items-center justify-center min-h-[60px]
                        ${dragDone
                          ? 'bg-lime-100 text-lime-600 border-lime-300 opacity-50 cursor-default'
                          : isSelectedWord
                            ? 'bg-sky-400 text-white border-sky-500 scale-105 shadow-xl cursor-pointer'
                            : isTouch
                              ? 'bg-white border-white shadow-kid cursor-pointer active:scale-95 active:bg-sky-50'
                              : dragging?.uid === dragWord?.uid
                                ? 'bg-sky-100 border-sky-400 scale-105 shadow-xl cursor-grabbing opacity-80'
                                : 'bg-white border-white shadow-kid cursor-grab hover:scale-[1.02] hover:bg-sky-50'
                        }`}
                    >
                      {dragDone ? '✅ ' : ''}{dragWord?.word.toUpperCase()}
                    </div>

                    {/* ── Emoji drop target ── */}
                    <div
                      ref={el => {
                        if (el) dropRefs.current.set(emojiWord.uid, el);
                        else dropRefs.current.delete(emojiWord.uid);
                      }}
                      // Desktop drag
                      onDragOver={!isTouch ? (e) => { e.preventDefault(); setDragOver(emojiWord.uid); } : undefined}
                      onDragLeave={!isTouch ? () => setDragOver(null) : undefined}
                      onDrop={!isTouch ? () => handleDrop(emojiWord) : undefined}
                      // Mobile tap
                      onClick={isTouch ? () => handleTapEmoji(emojiWord) : undefined}
                      className={`drop-target rounded-2xl px-3 py-4 text-center
                        border-4 transition-all duration-150
                        flex items-center justify-center gap-2 min-h-[60px]
                        ${dropDone
                          ? 'bg-lime-100 border-lime-400'
                          : isTouch && selected
                            ? 'bg-white border-sky-300 border-dashed cursor-pointer active:scale-95 active:bg-sky-50'
                            : isOver
                              ? 'bg-sky-100 border-sky-500 scale-[1.03] shadow-xl'
                              : 'bg-white/70 border-dashed border-gray-300'
                        }`}
                    >
                      <span className="text-3xl">{emojiWord.emoji}</span>
                      {dropDone && (
                        <span className="font-display text-sm text-lime-700">{emojiWord.word}</span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-lime-400 to-sky-400 rounded-full transition-all duration-500"
                  style={{ width: `${(matched.size / words.length) * 100}%` }}
                />
              </div>
              <span className="font-bold text-gray-500 text-sm">{matched.size}/{words.length}</span>
              <AnimatedButton color="yellow" size="sm" onClick={restart}>🔄</AnimatedButton>
            </div>
          </>
        )}
      </div>
    </GameLayout>
  );
}

function AllDoneScreen({ score, total, onReplay }: { score: number; total: number; onReplay: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.from(ref.current, { scale: 0.7, opacity: 1, duration: 0.5, ease: 'back.out(2)' });
    launchConfetti(ref.current);
  }, { scope: ref });

  return (
    <div ref={ref} className="text-center py-12">
      <div className="text-8xl mb-4">🎉</div>
      <h2 className="font-display text-4xl text-lime-600 mb-2">All Matched!</h2>
      <p className="text-xl font-bold text-gray-600 mb-1">You matched all {total} words!</p>
      <p className="text-2xl font-bold text-gray-700 mb-5">Score: ⭐ {score}</p>
      <StarsBurst count={3} visible />
      <div className="mt-6 flex gap-3 justify-center flex-wrap">
        <AnimatedButton color="coral" size="lg" onClick={onReplay}>🔄 Play Again</AnimatedButton>
      </div>
    </div>
  );
}
