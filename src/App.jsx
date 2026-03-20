import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- ТОГТМОЛ УТГУУД ---
const KEYS = ['A', 'S', 'D', 'F']; 

const LEVELS = { 
  1: { name: "Show Me How", file: "/showmehow.mp3", speed: 6.5, interval: 950, theme: '#9575CD', bg: '#F3E5F5' },
  2: { name: "Creep", file: "/creep.mp3", speed: 8.0, interval: 800, theme: '#E57373', bg: '#FFEBEE' },
  3: { name: "Joyride", file: "/joyride.mp3", speed: 10.5, interval: 600, theme: '#4FC3F7', bg: '#E1F5FE' },
  4: { name: "Fashion", file: "/fashion.mp3", speed: 11.5, interval: 850, theme: '#F06292', bg: '#FCE4EC' },
  5: { name: "Sure Thing", file: "/surething.mp3", speed: 12.5, interval: 750, theme: '#81C784', bg: '#E8F5E9' }
};

export default function App() {
  const [currentLevel, setCurrentLevel] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [notes, setNotes] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(5);
  const [feedback, setFeedback] = useState({ text: "", key: 0 });
  const [activeLanes, setActiveLanes] = useState([false, false, false, false]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWin, setGameWin] = useState(false);

  const audioRef = useRef(null);

  const killAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  // --- ШИНЭ: ВЭБЭЭС ГАРАХАД ПАУЗ АВАХ ЛОГИК ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && gameStarted && !gameOver && !gameWin) {
        togglePause(true); // Хуудас нуугдахад пауз авна
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [gameStarted, gameOver, gameWin]);

  const handleBackToMenu = () => {
    killAudio();
    setGameStarted(false);
    setGameOver(false);
    setGameWin(false);
    setIsPaused(false);
  };

  const startGame = (levelId) => {
    killAudio();
    const audio = new Audio(LEVELS[levelId].file);
    audio.onended = () => setGameWin(true);
    audioRef.current = audio;
    setCurrentLevel(levelId);
    setGameStarted(true);
    setGameOver(false); setGameWin(false); setIsPaused(false);
    setScore(0); setCombo(0); setLives(5); setNotes([]);
    audio.play().catch(() => {});
  };

  const togglePause = useCallback((forceState) => {
    if (!gameStarted || gameOver || gameWin) return;
    const nextPaused = forceState !== undefined ? forceState : !isPaused;
    if (nextPaused) {
      audioRef.current?.pause();
      setIsPaused(true);
    } else {
      audioRef.current?.play().catch(() => {});
      setIsPaused(false);
    }
  }, [gameStarted, gameOver, gameWin, isPaused]);

  // --- ОНОХ ЛОГИК ---
  const handleKey = useCallback((lane) => {
    if (!gameStarted || gameOver || gameWin) return;
    if (isPaused) { togglePause(false); return; }
    
    setActiveLanes(prev => { const next = [...prev]; next[lane] = true; return next; });
    setTimeout(() => setActiveLanes(prev => { const next = [...prev]; next[lane] = false; return next; }), 70);

    setNotes(prev => {
      const inLane = prev.filter(n => n.lane === lane && n.top > -50);
      if (inLane.length > 0) {
        const lowest = inLane.reduce((p, c) => (p.top > c.top) ? p : c);
        let points = 10;
        let text = "HIT!";
        
        if (lowest.top > 450 && lowest.top < 550) { points = 50; text = "PERFECT"; }
        else if (lowest.top > 350 && lowest.top < 580) { points = 25; text = "GREAT"; }
        
        setScore(s => s + points);
        setCombo(c => c + 1);
        setFeedback({ text, key: Date.now() });
        return prev.filter(n => n.id !== lowest.id);
      }
      return prev;
    });
  }, [gameStarted, gameOver, isPaused, gameWin, togglePause]);

  // --- ХӨДӨЛГӨӨН БОЛОН НОТ ҮҮСГЭХ (Өмнөх логик хэвээрээ) ---
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused || gameWin || !currentLevel) return;
    const interval = setInterval(() => {
      setNotes(prev => [...prev, { id: Math.random(), lane: Math.floor(Math.random() * 4), top: -80 }]);
    }, LEVELS[currentLevel].interval);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused, gameWin, currentLevel]);

  useEffect(() => {
    if (!gameStarted || gameOver || isPaused || gameWin || !currentLevel) return;
    const moveLoop = setInterval(() => {
      setNotes(prev => {
        const speed = LEVELS[currentLevel].speed + (score / 6000);
        const moved = prev.map(n => ({ ...n, top: n.top + speed }));
        const missed = moved.filter(n => n.top > 600);
        if (missed.length > 0) {
          setLives(l => {
            if (l <= 1) { killAudio(); setGameOver(true); }
            return Math.max(0, l - 1);
          });
          setCombo(0);
          setFeedback({ text: "MISS", key: Date.now() });
          return moved.filter(n => n.top <= 600);
        }
        return moved;
      });
    }, 10);
    return () => clearInterval(moveLoop);
  }, [gameStarted, gameOver, isPaused, gameWin, currentLevel, score, killAudio]);

  useEffect(() => {
    const onDown = (e) => {
      if (e.repeat) return;
      if (e.key === 'Escape') togglePause();
      const idx = KEYS.indexOf(e.key.toUpperCase());
      if (idx !== -1) handleKey(idx);
    };
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, [handleKey, togglePause]);

  const currentTheme = currentLevel ? LEVELS[currentLevel] : { theme: '#5D4037', bg: '#FAF3E0' };

  return (
    <div style={{ height: '100vh', width: '100%', backgroundColor: currentTheme.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#4E342E', fontFamily: '"VT323", monospace', userSelect: 'none', overflow: 'hidden' }}>
      
      {!gameStarted ? (
        <div style={{ zIndex: 10, textAlign: 'center', background: '#FFF', padding: '40px', border: `8px solid ${currentTheme.theme}`, borderRadius: '12px', boxShadow: '0 10px 0 rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: '4rem', color: currentTheme.theme, marginBottom: '20px' }}>PIXEL BEAT</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {Object.keys(LEVELS).map(id => (
              <button key={id} onClick={() => startGame(id)} style={{ padding: '12px 40px', background: '#FFF', border: `4px solid ${LEVELS[id].theme}`, color: LEVELS[id].theme, cursor: 'pointer', fontSize: '1.6rem', fontWeight: 'bold' }}>
                {LEVELS[id].name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ width: '420px', display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#FFF', border: `5px solid ${currentTheme.theme}`, marginBottom: '10px', borderRadius: '8px' }}>
            <span style={{ fontSize: '2rem', color: '#E57373' }}>❤ {lives}</span>
            <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{score}</span>
            <span style={{ fontSize: '2rem', color: currentTheme.theme }}>x{combo}</span>
          </div>

          <div style={{ position: 'relative', width: '420px', height: '620px', backgroundColor: 'rgba(255, 255, 255, 0.95)', border: `6px solid ${currentTheme.theme}`, overflow: 'hidden', borderRadius: '10px', touchAction: 'none' }}>
            {/* LANES & TOUCH HANDLERS */}
            {KEYS.map((k, i) => (
              <div 
                key={i} 
                // УТАСНЫ МЭДРЭГЧ НЭМСЭН ХЭСЭГ:
                onTouchStart={(e) => { e.preventDefault(); handleKey(i); }}
                onMouseDown={(e) => { e.preventDefault(); handleKey(i); }}
                style={{ position: 'absolute', left: i * 105, width: '105px', height: '100%', borderRight: i < 3 ? `1px dashed ${currentTheme.theme}33` : 'none', background: activeLanes[i] ? `${currentTheme.theme}33` : 'transparent', cursor: 'pointer' }}
              >
                <div style={{ position: 'absolute', bottom: '15px', width: '100%', textAlign: 'center', color: `${currentTheme.theme}55`, fontSize: '1.8rem' }}>{k}</div>
              </div>
            ))}

            <div style={{ position: 'absolute', bottom: '100px', width: '100%', height: '5px', background: currentTheme.theme }} />
            
            {notes.map(n => (
              <div key={n.id} style={{ position: 'absolute', width: '85px', height: '40px', backgroundColor: currentTheme.theme, border: '3px solid #FFF', top: n.top, left: n.lane * 105 + 10, borderRadius: '4px', pointerEvents: 'none' }} />
            ))}

            {/* FEEDBACK (Perfect/Miss) */}
            {feedback.text && (
              <div key={feedback.key} style={{ position: 'absolute', top: '40%', width: '100%', textAlign: 'center', fontSize: '3rem', color: feedback.text === 'MISS' ? '#E57373' : currentTheme.theme, animation: 'scoreUp 0.5s ease-out forwards', pointerEvents: 'none', zIndex: 10 }}>
                {feedback.text}
              </div>
            )}

            {/* OVERLAYS (Paused, Win, Over) */}
            {isPaused && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                <h2 style={{ fontSize: '3.5rem', color: currentTheme.theme }}>PAUSED</h2>
                <button onClick={() => togglePause(false)} style={{ padding: '10px 30px', background: currentTheme.theme, color: '#FFF', border: 'none', cursor: 'pointer', fontSize: '1.5rem', marginBottom: '10px' }}>RESUME</button>
                <button onClick={handleBackToMenu} style={{ background: 'none', border: `2px solid ${currentTheme.theme}`, color: currentTheme.theme, cursor: 'pointer', padding: '5px 15px' }}>MENU</button>
              </div>
            )}
            
            {(gameWin || gameOver) && (
              <div style={{ position: 'absolute', inset: 0, background: gameWin ? '#FFF' : '#FFEBEE', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
                <h1 style={{ color: gameWin ? currentTheme.theme : '#C62828', fontSize: '3.5rem' }}>{gameWin ? 'RECORD SET!' : 'GAME OVER'}</h1>
                <p style={{ fontSize: '2rem', marginBottom: '30px' }}>SCORE: {score}</p>
                <button onClick={handleBackToMenu} style={{ padding: '12px 40px', background: gameWin ? currentTheme.theme : '#C62828', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>MENU</button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes scoreUp {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0; transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
