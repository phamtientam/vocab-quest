import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { DragDropGame } from './games/DragDropGame';
import { ShootingGame } from './games/ShootingGame';
import { RacingGame } from './games/RacingGame';
import { SpeakingGame } from './games/SpeakingGame';
import { QuizGame } from './games/QuizGame';
import { MemoryGame } from './games/MemoryGame';

gsap.registerPlugin(useGSAP, ScrollTrigger);

function AppShell() {
  const location = useLocation();
  const isGame = location.pathname.startsWith('/game/');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"              element={<HomePage />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/game/quiz"    element={<QuizGame />} />
          <Route path="/game/drag"    element={<DragDropGame />} />
          <Route path="/game/shoot"   element={<ShootingGame />} />
          <Route path="/game/race"    element={<RacingGame />} />
          <Route path="/game/speak"   element={<SpeakingGame />} />
          <Route path="/game/memory"  element={<MemoryGame />} />
        </Routes>
      </main>
      {!isGame && <Footer />}
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-white/60 border-t-4 border-white text-center py-6 mt-8">
      <p className="font-display text-xl text-gray-500">
        🎓 VocabQuest — Learn English the fun way!
      </p>
      <p className="text-gray-400 font-bold text-sm mt-1">
        {new Date().getFullYear()} · Works 100% offline 🌟
      </p>
    </footer>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
