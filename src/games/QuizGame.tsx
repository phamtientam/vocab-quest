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
import { launchConfetti } from '../animations/effects';
import type { VocabWord } from '../data/types';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

type QuizMode = 'emoji-to-word' | 'word-to-emoji' | 'word-to-meaning';

interface Question {
  prompt: string;         // what to show as the question
  promptType: 'emoji' | 'word';
  correct: VocabWord;
  options: VocabWord[];
  mode: QuizMode;
}

function buildQuestion(pool: VocabWord[], mode: QuizMode): Question {
  const shuffled = shuffle(pool);
  const correct = shuffled[0];
  const distractors = shuffle(pool.filter(w => w.id !== correct.id)).slice(0, 3);
  const options = shuffle([correct, ...distractors]);
  console.log("distractors", distractors)
  console.log("correct", correct)
  return {
    prompt: mode === 'emoji-to-word' ? correct.emoji : correct.word,
    promptType: mode === 'emoji-to-word' ? 'emoji' : 'word',
    correct,
    options,
    mode,
  };
}

function getPool(catId: string): VocabWord[] {
  if (catId === 'all') return shuffle(getAllWords());
  const cat = getCategoryById(catId);
  return cat ? shuffle(cat.words) : [];
}

const TOTAL_QUESTIONS = 10;

export function QuizGame() {
  const [params] = useSearchParams();
  const catId = params.get('category') || categories[0].id;
  // const [pool] = useState(() => getPool(catId));
  const pool = getPool(catId);
  const [mode, setMode] = useState<QuizMode>('emoji-to-word');
  const [gameState, setGameState] = useState<'mode-select' | 'playing' | 'result'>('mode-select');
  const [question, setQuestion] = useState<Question | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null); // option index
  const [answers, setAnswers] = useState<boolean[]>([]);
  const { speak } = useSpeech();
  const { play } = useSound();

  const questionRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const optionEls = useRef<(HTMLButtonElement | null)[]>([]);
  const streakRef = useRef(0);

  useEffect(() => {
    setGameState('mode-select');
    setQuestion(null);
    setQIndex(0);
    setScore(0);
    setSelected(null);
    setAnswers([]);
    streakRef.current = 0;
  }, [catId]);

  const nextQuestion = useCallback(() => {
    const q = buildQuestion(pool, mode);
    setQuestion(q);
    setSelected(null);
    speak(q.correct.word);
    // entrance animation
    gsap.fromTo(questionRef.current,
        { scale: 0.85, opacity: 1, y: -20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.7)' }
      );
    gsap.fromTo(
      optionEls.current.filter(Boolean),
      { x: 40, opacity: 1 },
      { x: 0, opacity: 1, stagger: 0.07, duration: 0.35, ease: 'power3.out', delay: 0.15 }
    );
  }, [pool, mode, speak]);

  const startGame = useCallback(() => {
    setQIndex(0);
    setScore(0);
    setAnswers([]);
    streakRef.current = 0;
    setGameState('playing');
  }, []);

  useEffect(() => {
    if (gameState === 'playing') nextQuestion();
  }, [gameState, qIndex]); // eslint-disable-line

  const handleAnswer = (optionIdx: number) => {
    if (selected !== null || !question) return;
    setSelected(optionIdx);

    const isCorrect = question.options[optionIdx].id === question.correct.id;
    const btn = optionEls.current[optionIdx];
    const correctIdx = question.options.findIndex(o => o.id === question.correct.id);
    const correctBtn = optionEls.current[correctIdx];

    if (isCorrect) {
      play('correct');
      speak(question.correct.word);
      streakRef.current++;
      const bonus = streakRef.current >= 3 ? 20 : 10;
      setScore(s => s + bonus);
      if (btn) {
        gsap.to(btn, { scale: 1.08, duration: 0.15, yoyo: true, repeat: 1 });
        launchConfetti(btn);
      }
    } else {
      play('wrong');
      streakRef.current = 0;
      if (btn) {
        gsap.fromTo(btn, { x: -8 }, { x: 8, duration: 0.06, repeat: 5, yoyo: true, clearProps: 'x' });
      }
      // Highlight correct answer
      if (correctBtn) {
        gsap.to(correctBtn, { scale: 1.05, duration: 0.2 });
      }
    }

    setAnswers(prev => [...prev, isCorrect]);

    // Advance after delay
    setTimeout(() => {
      if (qIndex + 1 >= TOTAL_QUESTIONS) {
        setGameState('result');
      } else {
        setQIndex(i => i + 1);
      }
    }, 1200);
  };

  const getOptionStyle = (idx: number): string => {
    if (selected === null) return 'bg-white hover:bg-sky-50 hover:border-sky-400 hover:scale-[1.02] active:scale-[0.98]';
    const isThis = idx === selected;
    const isCorrect = question?.options[idx].id === question?.correct.id;

    if (isCorrect) return 'bg-lime-100 border-lime-500 text-lime-800 scale-[1.02]';
    if (isThis && !isCorrect) return 'bg-rose-100 border-rose-400 text-rose-800';
    return 'bg-white opacity-50';
  };

  const getOptionLabel = (idx: number): string => {
    if (selected === null) return '';
    const isCorrect = question?.options[idx].id === question?.correct.id;
    if (isCorrect) return ' ✅';
    if (idx === selected) return ' ❌';
    return '';
  };

  const renderOptionText = (opt: VocabWord): string => {
    switch (question?.mode) {
      case 'emoji-to-word': return opt.word;
      case 'word-to-emoji': return opt.emoji;
      case 'word-to-meaning': return opt.meaning;
      default: return opt.word;
    }
  };

  const percent = Math.round((score / (TOTAL_QUESTIONS * 10)) * 100);

  return (
    <GameLayout
      title="Quiz Game"
      emoji="🧩"
      categoryId={catId !== 'all' ? catId : undefined}
      score={score}
      showScore={gameState === 'playing'}
    >
      <div className="max-w-xl mx-auto">

        {/* MODE SELECT */}
        {gameState === 'mode-select' && (
          <ModeSelect onSelect={(m) => { setMode(m); startGame(); }} />
        )}

        {/* PLAYING */}
        {gameState === 'playing' && question && (
          <>
            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex justify-between text-sm font-bold text-gray-500 mb-1">
                <span>Question {qIndex + 1} / {TOTAL_QUESTIONS}</span>
                {streakRef.current >= 2 && (
                  <span className="text-coral-500">🔥 {streakRef.current} streak!</span>
                )}
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-lime-400 rounded-full transition-all duration-500"
                  style={{ width: `${((qIndex) / TOTAL_QUESTIONS) * 100}%` }}
                />
              </div>
            </div>

            {/* Question prompt */}
            <div
              ref={questionRef}
              className="bg-white rounded-3xl border-4 border-white shadow-xl p-8 text-center mb-5"
              style={{ opacity: 1 }}
            >
              {question.promptType === 'emoji' ? (
                <div className="text-8xl mb-3 leading-none">{question.prompt}</div>
              ) : (
                <div className="font-display text-5xl text-gray-800 capitalize mb-3">{question.prompt}</div>
              )}
              <p className="text-gray-500 font-bold text-base">
                {question.mode === 'emoji-to-word' && 'What is this?'}
                {question.mode === 'word-to-emoji' && 'Find the matching emoji'}
                {question.mode === 'word-to-meaning' && 'What does this mean?'}
              </p>
              <button
                className="mt-2 text-xl hover:scale-110 active:scale-95 transition-transform"
                onClick={() => speak(question.correct.word)}
              >
                🔊
              </button>
            </div>

            {/* Options */}
            <div ref={optionsRef} className="grid grid-cols-2 gap-3">
              {question.options.map((opt, i) => (
                <button
                  key={opt.id}
                  ref={el => { optionEls.current[i] = el; }}
                  onClick={() => handleAnswer(i)}
                  disabled={selected !== null}
                  className={`rounded-2xl border-4 p-4 font-bold text-lg md:text-xl text-gray-800 transition-all duration-150 border-gray-200 select-none ${getOptionStyle(i)}`}
                  style={{ opacity: 1 }}
                >
                  {question.mode === 'word-to-emoji'
                    ? <span className="text-4xl block">{opt.emoji}</span>
                    : null
                  }
                  <span className={question.mode === 'word-to-emoji' ? 'text-base' : ''}>
                    {renderOptionText(opt)}{getOptionLabel(i)}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* RESULT */}
        {gameState === 'result' && (
          <ResultScreen
            score={score}
            answers={answers}
            percent={percent}
            onReplay={startGame}
            onChangeMode={() => setGameState('mode-select')}
          />
        )}
      </div>
    </GameLayout>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ModeSelect({ onSelect }: { onSelect: (m: QuizMode) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.from(ref.current?.querySelectorAll('.mode-card') ?? [], {
      y: 40, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'back.out(1.5)',
    });
  }, { scope: ref });

  const modes: { id: QuizMode; emoji: string; title: string; desc: string; color: string }[] = [
    { id: 'emoji-to-word', emoji: '🍎', title: 'Emoji → Word', desc: 'See an emoji, pick the right English word', color: '#ef4444' },
    { id: 'word-to-emoji', emoji: '✏️', title: 'Word → Emoji', desc: 'Read the word, find the matching emoji', color: '#f97316' },
    { id: 'word-to-meaning', emoji: '📖', title: 'Word → Meaning', desc: 'English word → Vietnamese meaning', color: '#a855f7' },
  ];

  return (
    <div ref={ref} className="text-center py-4">
      <p className="text-7xl mb-3">🧩</p>
      <h2 className="font-display text-4xl text-gray-700 mb-2">Quiz Game!</h2>
      <p className="text-gray-500 font-bold text-lg mb-8">Choose your quiz mode</p>
      <div className="grid grid-cols-1 gap-4">
        {modes.map(m => (
          <button
            key={m.id}
            className="mode-card rounded-3xl border-4 border-white bg-white/80 hover:scale-[1.02] active:scale-[0.98] shadow-kid p-5 flex items-center gap-4 text-left transition-transform"
            style={{ opacity: 1 }}
            onClick={() => onSelect(m.id)}
          >
            <span className="text-5xl flex-shrink-0">{m.emoji}</span>
            <div>
              <p className="font-display text-2xl" style={{ color: m.color }}>{m.title}</p>
              <p className="text-gray-500 font-bold text-sm mt-0.5">{m.desc}</p>
            </div>
            <span className="ml-auto text-2xl text-gray-300">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultScreen({
  score, answers, percent, onReplay, onChangeMode,
}: {
  score: number;
  answers: boolean[];
  percent: number;
  onReplay: () => void;
  onChangeMode: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const correct = answers.filter(Boolean).length;

  useGSAP(() => {
    gsap.from(ref.current, { scale: 0.8, opacity: 1, duration: 0.5, ease: 'back.out(2)' });
    if (correct >= 7) launchConfetti(ref.current);
  }, { scope: ref });

  const getMessage = () => {
    if (correct >= 9) return { msg: 'Perfect! 🏆', color: '#facc15' };
    if (correct >= 7) return { msg: 'Excellent! 🌟', color: '#84cc16' };
    if (correct >= 5) return { msg: 'Good job! 👍', color: '#38bdf8' };
    return { msg: 'Keep Practicing! 💪', color: '#f97316' };
  };

  const { msg, color } = getMessage();

  return (
    <div ref={ref} className="text-center py-6">
      <h2 className="font-display text-5xl mb-2" style={{ color }}>{msg}</h2>
      <p className="text-gray-500 font-bold text-xl mb-6">
        {correct} / {answers.length} correct &nbsp;•&nbsp; ⭐ {score} pts
      </p>

      {/* Score ring */}
      <div className="relative w-36 h-36 mx-auto mb-6">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${percent} ${100 - percent}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl text-gray-800">{percent}%</span>
        </div>
      </div>

      <StarsBurst count={correct >= 7 ? 3 : correct >= 5 ? 2 : 1} visible />

      {/* Answer breakdown */}
      <div className="flex justify-center gap-1 mt-4 mb-8 flex-wrap">
        {answers.map((a, i) => (
          <span key={i} className={`text-xl ${a ? '' : 'opacity-40'}`}>
            {a ? '✅' : '❌'}
          </span>
        ))}
      </div>

      <div className="flex gap-4 justify-center flex-wrap">
        <AnimatedButton color="coral" size="lg" onClick={onReplay}>🔄 Play Again</AnimatedButton>
        <AnimatedButton color="blue" size="md" onClick={onChangeMode}>🧩 Change Mode</AnimatedButton>
      </div>
    </div>
  );
}
