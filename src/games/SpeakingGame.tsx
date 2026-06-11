import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { categories, getAllWords, getCategoryById } from '../data';
import { GameLayout } from '../layouts/GameLayout';
import { AnimatedButton } from '../components/AnimatedButton';
import { StarsBurst } from '../components/StarsBurst';
import { useSpeech } from '../hooks/useSpeech';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSound } from '../hooks/useSound';
import { useProgress } from '../hooks/useProgress';
import { launchConfetti, shakeElement } from '../animations/effects';
import type { VocabWord } from '../data/types';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}
function getPool(catId: string): VocabWord[] {
  if (catId === 'all') return shuffle(getAllWords());
  const cat = getCategoryById(catId);
  return cat ? shuffle(cat.words) : [];
}

type Feedback = 'correct' | 'wrong' | null;

export function SpeakingGame() {
  const [params] = useSearchParams();
  const catId = params.get('category') || categories[0].id;
  const [pool]      = useState(() => getPool(catId));
  const [idx, setIdx] = useState(0);
  const [score, setScore]     = useState(0);
  const [streak, setStreak]   = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [heard, setHeard]     = useState('');
  const [attempts, setAttempts] = useState(0);

  const { speak }  = useSpeech();
  const { play }   = useSound();
  const { markWordLearned } = useProgress();

  const cardRef     = useRef<HTMLDivElement>(null);
  const micRef      = useRef<HTMLButtonElement>(null);
  const waveRef     = useRef<HTMLDivElement>(null);
  const micAnimRef  = useRef<gsap.core.Tween | null>(null);

  const currentWord = pool[idx % pool.length];

  /* ── Mic pulse while listening ── */
  const startMicAnim = () => {
    micAnimRef.current?.kill();
    micAnimRef.current = gsap.to(micRef.current, {
      scale: 1.15, duration: 0.4, repeat: -1, yoyo: true, ease: 'sine.inOut',
    });
    // wave rings
    gsap.to(waveRef.current?.querySelectorAll('.ring') ?? [], {
      scale: 2.2, opacity: 1, duration: 1,
      stagger: { each: 0.3, repeat: -1 },
      ease: 'power2.out',
    });
  };
  const stopMicAnim = () => {
    micAnimRef.current?.kill();
    gsap.killTweensOf(waveRef.current?.querySelectorAll('.ring') ?? []);
    gsap.set(micRef.current, { scale: 1 });
    gsap.set(waveRef.current?.querySelectorAll('.ring') ?? [], { scale: 1, opacity: 1 });
  };

  const handleResult = useCallback((transcript: string) => {
    stopMicAnim();
    setHeard(transcript);
    setAttempts(a => a + 1);

    // const match = transcript.toLowerCase().includes(currentWord.word.toLowerCase());
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[^a-z]/g, '');

    const match =
      normalize(transcript) === normalize(currentWord.word);
    if (match) {
      play('correct');
      speak(currentWord.word);
      markWordLearned(currentWord.word);
      setStreak(s => s + 1);
      const bonus = streak >= 2 ? 25 : 15;
      setScore(s => s + bonus);
      setFeedback('correct');
      launchConfetti(cardRef.current);
      gsap.timeline()
        .to(cardRef.current, { scale: 1.12, duration: 0.15, ease: 'back.out(2)' })
        .to(cardRef.current, { scale: 1, duration: 0.2, ease: 'elastic.out(1,0.4)' });
    } else {
      play('wrong');
      setStreak(0);
      setFeedback('wrong');
      shakeElement(cardRef.current);
    }
  }, [currentWord, streak, speak, play, markWordLearned]);

  const { isListening, startListening, isSupported } = useSpeechRecognition({
    onResult: handleResult,
    onError: () => { stopMicAnim(); setFeedback('wrong'); },
  });

  /* ── Card entrance ── */
  useGSAP(() => {
    gsap.fromTo(cardRef.current,
      { scale: 0.85, opacity: 1, y: 20 },
      { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(2)' }
    );
  }, { dependencies: [idx] });

  /* ── Sync mic anim with listening state ── */
  useEffect(() => {
    if (isListening) startMicAnim();
    else stopMicAnim();
  }, [isListening]);

  const handleMicPress = () => {
      if (isListening) return;
      startListening();
  };

  const nextWord = () => {
    setIdx(i => i + 1);
    setFeedback(null);
    setHeard('');
    setAttempts(0);
  };

  const pct = Math.round(((idx % pool.length) / pool.length) * 100);

  return (
    <GameLayout title="Speaking" emoji="🎤" categoryId={catId !== 'all' ? catId : undefined} score={score} showScore>
      <div className="max-w-md mx-auto text-center">

        {/* Browser support warning */}
        {!isSupported && (
          <div className="bg-yellow-50 border-4 border-yellow-300 rounded-2xl p-4 mb-5 font-bold text-yellow-700 text-base">
            ⚠️ Speech recognition requires Chrome or Edge. Try opening in Chrome!
          </div>
        )}

        {/* Streak badge */}
        {streak >= 2 && (
          <div className="mb-3 font-display text-xl text-coral-500 animate-bounce">
            🔥 {streak} in a row!
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-5 flex items-center gap-2">
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(to right,#38bdf8,#a855f7)',
              }}
            />
          </div>
          <span className="text-sm font-bold text-gray-400">{(idx % pool.length) + 1}/{pool.length}</span>
        </div>

        {/* Word card */}
        <div
          ref={cardRef}
          className="bg-white rounded-3xl border-4 border-white shadow-xl p-8 mb-6"
          style={{ opacity: 1 }}
        >
          <div className="text-8xl mb-4 leading-none">{currentWord.emoji}</div>
          <h2 className="font-display text-4xl text-gray-800 capitalize mb-1">{currentWord.word}</h2>
          <p className="text-gray-400 font-bold text-base mb-4">{currentWord.meaning}</p>
          <button
            onClick={() => speak(currentWord.word)}
            className="text-3xl hover:scale-110 active:scale-90 transition-transform"
            title="Hear pronunciation"
          >
            🔊
          </button>
        </div>

        {/* Mic button with wave rings */}
        {isSupported && (
          <div className="relative flex justify-center mb-5">
            {/* Wave rings */}
            <div ref={waveRef} className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[0,1,2].map(i => (
                <div
                  key={i}
                  className="ring absolute w-24 h-24 rounded-full border-4 border-sky-400"
                  style={{ opacity: 1 }}
                />
              ))}
            </div>
            <button
              ref={micRef}
              onClick={handleMicPress}
              disabled={isListening}
              className={`relative z-10 w-24 h-24 rounded-full text-5xl flex items-center justify-center shadow-xl border-4 transition-colors
                ${isListening
                  ? 'bg-rose-400 border-rose-600'
                  : 'bg-sky-400 border-sky-600 hover:bg-sky-300 active:scale-90'
                }`}
            >
              {isListening ? '🎙️' : '🎤'}
            </button>
          </div>
        )}
        <p className="font-bold text-gray-500 mb-4">
          {isListening ? '🔴 Listening…' : 'Tap the mic and say the word!'}
        </p>

        {/* Feedback */}
        {feedback === 'correct' && (
          <div className="mb-4 animate-pop">
            <p className="font-display text-3xl text-lime-600 mb-2">🎉 Excellent!</p>
            <StarsBurst count={streak >= 3 ? 3 : 2} visible />
            {heard && <p className="text-gray-400 mt-2 font-bold text-sm">You said: "{heard}"</p>}
          </div>
        )}

        {feedback === 'wrong' && (
          <div className="mb-4">
            <p className="font-display text-2xl text-rose-500 mb-1">🤔 Try Again!</p>
            {heard && <p className="text-gray-400 font-bold text-sm">I heard: "{heard}"</p>}
            <p className="text-gray-400 font-bold text-sm mt-1">
              Say: <span className="text-sky-500 font-display text-lg">{currentWord.word}</span>
            </p>
            {attempts >= 2 && (
              <button
                onClick={() => speak(currentWord.word)}
                className="mt-2 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-xl px-4 py-1.5 font-bold text-sm transition-colors"
              >
                🔊 Hear it again
              </button>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 justify-center">
          {feedback === 'correct' ? (
            <AnimatedButton color="coral" size="lg" onClick={nextWord}>Next Word ➡️</AnimatedButton>
          ) : (
            <AnimatedButton color="yellow" size="md" onClick={nextWord}>⏭️ Skip</AnimatedButton>
          )}
        </div>
      </div>
    </GameLayout>
  );
}
