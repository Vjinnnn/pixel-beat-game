import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- ТОГТМОЛ УТГУУД ---
const KEYS = ['A', 'S', 'D', 'F']; // Тоглоомын үндсэн 4 замд харгалзах товчлуурууд

const LEVELS = { // Түвшин бүрийн өгөгдөл: Дууны зам, хурд, нот гарч ирэх хугацаа болон өнгө төрх
  1: { name: "Show Me How", file: "/showmehow.mp3", speed: 6.5, interval: 950, theme: '#9575CD', bg: '#F3E5F5' },
  2: { name: "Creep", file: "/creep.mp3", speed: 8.0, interval: 800, theme: '#E57373', bg: '#FFEBEE' },
  3: { name: "Joyride", file: "/joyride.mp3", speed: 10.5, interval: 600, theme: '#4FC3F7', bg: '#E1F5FE' },
  4: { name: "Fashion", file: "/fashion.mp3", speed: 11.5, interval: 850, theme: '#F06292', bg: '#FCE4EC' },
  5: { name: "Sure Thing", file: "/surething.mp3", speed: 12.5, interval: 750, theme: '#81C784', bg: '#E8F5E9' }
};

export default function App() {
  // --- ТОГЛООМЫН ТӨЛӨВ (STATE) ---
  const [currentLevel, setCurrentLevel] = useState(null); // Сонгогдсон түвшинг хадгална
  const [gameStarted, setGameStarted] = useState(false);  // Тоглоом эхэлсэн эсэхийг шийднэ (Boolean)
  const [isPaused, setIsPaused] = useState(false);        // Түр зогсолтыг хянана
  const [notes, setNotes] = useState([]);                 // Дэлгэц дээрх бүх нотнуудын объектуудыг массив дотор хадгална
  const [score, setScore] = useState(0);                  // Тоглогчийн цуглуулсан нийт оноо
  const [combo, setCombo] = useState(0);                  // Алдалгүй оносон дараалсан тоо
  const [lives, setLives] = useState(5);                  // Тоглогчийн үлдсэн амь (0 болоход Game Over)
  const [feedback, setFeedback] = useState({ text: "", key: 0 }); // Дэлгэц дээрх Perfect/Miss бичвэр
  const [activeLanes, setActiveLanes] = useState([false, false, false, false]); // Зам дээр товч дарахад гэрэлтэх эффект
  const [gameOver, setGameOver] = useState(false);        // Хожигдсон төлөв
  const [gameWin, setGameWin] = useState(false);          // Хожсон төлөв (Дуу дууссан үед)

  const audioRef = useRef(null); // Хөгжмийг санах ойд тогтвортой хадгалах объект (Play/Pause удирдана)

  // --- ОНЦЛОГ: ДУУ ЗОГСООХ (CLEANUP) ---
  const killAudio = useCallback(() => { // Хөгжмийг бүрэн зогсоож, хугацааг нь эхэнд аваачих функц
    if (audioRef.current) {
      audioRef.current.pause(); // Дууг түр зогсооно
      audioRef.current.currentTime = 0; // Хугацааг тэгэлнэ
      audioRef.current = null; // Объектыг санах ойгоос чөлөөлнө
    }
  }, []);

  // --- ОНЦЛОГ: ЦЭС РҮҮ БУЦАХ ---
  const handleBackToMenu = () => { // Тоглогч "Back to Menu" дарахад бүх зүйлийг Reset хийнэ
    killAudio();             // Хөгжмийг унтраана
    setGameStarted(false);   // Эхлэх цэс рүү буцна
    setGameOver(false);      // Хожигдсон төлөвийг арилгана
    setGameWin(false);       // Хожсон төлөвийг арилгана
    setIsPaused(false);      // Паузыг цуцална
  };

  // --- ТОГЛООМ ЭХЛҮҮЛЭХ ЛОГИК ---
  const startGame = (levelId) => { // Сонгосон түвшний дагуу тоглоомыг шинээр эхлүүлнэ
    killAudio(); // Өмнөх дууг унтраах
    const audio = new Audio(LEVELS[levelId].file); // Шинэ аудио файл ачаална
    audio.onended = () => setGameWin(true); // Дуу дуусах үед "Хожлоо" гэж тооцно
    audioRef.current = audio; // Аудиог тогтмол хадгалах
    setCurrentLevel(levelId); // Түвшинг оноох
    setGameStarted(true); // Тоглоом эхэлснийг мэдэгдэх
    setGameOver(false); setGameWin(false); setIsPaused(false); // Төлөвүүдийг цэвэрлэх
    setScore(0); setCombo(0); setLives(5); setNotes([]); // Тоглоомын утгуудыг тэглэх
    audio.play().catch(() => {}); // Хөгжмийг тоглуулж эхэлнэ
  };

  // --- ПАУЗЫН ЛОГИК ---
  const togglePause = useCallback((forceState) => { // Тоглоомыг түр зогсоох болон үргэлжлүүлэх
    if (!gameStarted || gameOver || gameWin) return; // Тоглоом ажиллаагүй үед пауз авахгүй
    const nextPaused = forceState !== undefined ? forceState : !isPaused;
    if (nextPaused) {
      audioRef.current?.pause(); // Хөгжмийг зогсооно
      setIsPaused(true); // Төлөвийг "Пауз" болгоно
    } else {
      audioRef.current?.play().catch(() => {}); // Хөгжмийг үргэлжлүүлнэ
      setIsPaused(false); // Төлөвийг "Тоглож байна" болгоно
    }
  }, [gameStarted, gameOver, gameWin, isPaused]);

  // --- ОНЦЛОГ: НОТ ҮҮСГЭХ (SPAWNER) ---
  useEffect(() => { // Түвшний interval-ийн дагуу шинэ нотуудыг дээрээс гарч ирүүлнэ
    if (!gameStarted || gameOver || isPaused || gameWin || !currentLevel) return;
    const interval = setInterval(() => {
      setNotes(prev => [...prev, { 
        id: Math.random(), // Нот бүрт дахин давтагдахгүй ID өгнө
        lane: Math.floor(Math.random() * 4), // 4 замын аль нэгт санамсаргүй онооно
        top: -80 // Дэлгэцийн хамгийн дээрээс гарч ирэх байрлал
      }]);
    }, LEVELS[currentLevel].interval); // Түвшнээс хамаарч нот гарах давтамж өөр байна
    return () => clearInterval(interval); // useEffect дуусахад таймерыг цэвэрлэнэ
  }, [gameStarted, gameOver, isPaused, gameWin, currentLevel]);

  // --- ОНЦЛОГ: ХӨДӨЛГӨӨН (GAME LOOP) ---
  useEffect(() => { // Нотнуудыг тасралтгүй доош нь хөдөлгөх хэсэг
    if (!gameStarted || gameOver || isPaused || gameWin || !currentLevel) return;
    const moveLoop = setInterval(() => {
      setNotes(prev => {
        // Хурд: Суурь хурд дээр онооны 6000-ны нэгийг нэмж хурдыг аажмаар нэмнэ (Dynamic Difficulty)
        const speed = LEVELS[currentLevel].speed + (score / 6000);
        const moved = prev.map(n => ({ ...n, top: n.top + speed })); // Бүх нотыг доош нь speed-ээр нэмнэ
        
        // MISS ШАЛГАХ: Хэрэв нот дэлгэцийн доод хэсэг (600px) өнгөрвөл
        const missed = moved.filter(n => n.top > 600);
        if (missed.length > 0) {
          setLives(l => {
            if (l <= 1) { killAudio(); setGameOver(true); } // Амь 0 болоход тоглоомыг зогсооно
            return Math.max(0, l - 1); // Амь хасна
          });
          setCombo(0); // Дараалсан оноог тэглэнэ
          setFeedback({ text: "MISS", key: Date.now() }); // MISS бичиг харуулна
          return moved.filter(n => n.top <= 600); // Алдсан нотыг массиваас хасаж устгана
        }
        return moved;
      });
    }, 10); // Энэ цикл 10мс тутамд ажиллаж хөдөлгөөнийг зөөлөн харагдуулна
    return () => clearInterval(moveLoop);
  }, [gameStarted, gameOver, isPaused, gameWin, currentLevel, score, killAudio]);

  // --- ОНЦЛОГ: ОНОХ ЛОГИК (COLLISION) ---
  const handleKey = useCallback((lane) => { // Товч дарах үед нотыг оносон эсэхийг шалгана
    if (!gameStarted || gameOver || gameWin) return;
    if (isPaused) { togglePause(false); return; } // Паузтай үед дурын товч дарж үргэлжлүүлнэ
    
    // LANE EFFECT: Дарагдсан замыг гэрэлтүүлээд 70мс дараа унтраана
    setActiveLanes(prev => { const next = [...prev]; next[lane] = true; return next; });
    setTimeout(() => setActiveLanes(prev => { const next = [...prev]; next[lane] = false; return next; }), 70);

    setNotes(prev => {
      const inLane = prev.filter(n => n.lane === lane && n.top > -50); // Тухайн замд байгаа нотуудыг шүүх
      if (inLane.length > 0) {
        // Хамгийн доор байгаа (оноход хамгийн ойр) нотыг сонгоно
        const lowest = inLane.reduce((p, c) => (p.top > c.top) ? p : c);
        let points = 10;
        let text = "HIT!";
        
        // ACCURACY: Нотны байрлалыг шалгаж PERFECT эсвэл GREAT оноо өгнө
        if (lowest.top > 450 && lowest.top < 550) { points = 50; text = "PERFECT"; } // Яг шугам дээр
        else if (lowest.top > 350 && lowest.top < 580) { points = 25; text = "GREAT"; } // Ойролцоо
        
        setScore(s => s + points); // Оноо нэмэх
        setCombo(c => c + 1); // Комбо нэмэх
        setFeedback({ text, key: Date.now() }); // Үр дүнг харуулах
        return prev.filter(n => n.id !== lowest.id); // Оносон нотыг дэлгэцээс хасна
      }
      return prev;
    });
  }, [gameStarted, gameOver, isPaused, gameWin, togglePause]);

  // --- KEYBOARD LISTENERS ---
  useEffect(() => { // Гарнаас товчлуур дарахыг байнга сонсож байх хэсэг
    const onDown = (e) => {
      if (e.repeat) return; // Товч удаан дарахад олон ажиллахаас сэргийлнэ
      if (e.key === 'Escape') togglePause(); // ESC дарвал пауз авна
      const idx = KEYS.indexOf(e.key.toUpperCase()); // Аль товч дарсныг шалгах (A=0, S=1...)
      if (idx !== -1) handleKey(idx); // Хэрэв тохирох товч бол handleKey ажиллуулна
    };
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, [handleKey, togglePause]);

  const currentTheme = currentLevel ? LEVELS[currentLevel] : { theme: '#5D4037', bg: '#FAF3E0' };

  return (
    <div style={{ height: '100vh', width: '100%', backgroundColor: currentTheme.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#4E342E', fontFamily: '"VT323", monospace' }}>
      
      {!gameStarted ? (
        /* --- MENU SCREEN: Түвшин сонгох хэсэг --- */
        <div style={{ zIndex: 10, textAlign: 'center', background: '#FFF', padding: '40px', border: `8px solid ${currentTheme.theme}`, borderRadius: '12px' }}>
          <h1 style={{ fontSize: '4rem', color: currentTheme.theme, marginBottom: '20px' }}>PIXEL BEAT</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {Object.keys(LEVELS).map(id => (
              <button key={id} onClick={() => startGame(id)} style={{ padding: '12px 40px', background: '#FFF', border: `4px solid ${LEVELS[id].theme}`, color: LEVELS[id].theme, cursor: 'pointer', fontSize: '1.6rem' }}>
                {LEVELS[id].name} {/* Түвшний нэрсийг жагсаалт болгож харуулна */}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* --- GAME SCREEN: Тоглоом явагдах хэсэг --- */
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* HUD: Оноо болон амь харуулах дээд хэсэг */}
          <div style={{ width: '420px', display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#FFF', border: `5px solid ${currentTheme.theme}`, marginBottom: '10px', borderRadius: '8px' }}>
            <span style={{ fontSize: '2rem', color: '#E57373' }}>❤ {lives}</span>
            <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>SCORE: {score}</span>
            <span style={{ fontSize: '2rem', color: currentTheme.theme }}>x{combo}</span>
          </div>

          <div style={{ position: 'relative', width: '420px', height: '620px', backgroundColor: 'rgba(255, 255, 255, 0.95)', border: `6px solid ${currentTheme.theme}`, overflow: 'hidden', borderRadius: '10px' }}>
            {/* LANES: 4 зам болон товчлуурын нэрс */}
            {KEYS.map((k, i) => (
              <div key={i} style={{ position: 'absolute', left: i * 105, width: '105px', height: '100%', borderRight: i < 3 ? `1px dashed ${currentTheme.theme}33` : 'none', background: activeLanes[i] ? `${currentTheme.theme}22` : 'transparent' }}>
                <div style={{ position: 'absolute', bottom: '15px', width: '100%', textAlign: 'center', color: `${currentTheme.theme}55`, fontSize: '1.8rem' }}>{k}</div>
              </div>
            ))}
            {/* HIT LINE: Нотнуудыг онох ёстой хэвтээ шугам */}
            <div style={{ position: 'absolute', bottom: '100px', width: '100%', height: '5px', background: currentTheme.theme }} />
            
            {/* RENDER NOTES: Массив доторх нот бүрийг дэлгэцэнд зурах */}
            {notes.map(n => (
              <div key={n.id} style={{ position: 'absolute', width: '85px', height: '40px', backgroundColor: currentTheme.theme, border: '3px solid #FFF', top: n.top, left: n.lane * 105 + 10, borderRadius: '4px' }} />
            ))}

            {/* PAUSE OVERLAY: Пауз авахад гарч ирэх дэлгэц */}
            {isPaused && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                <h2 style={{ fontSize: '3.5rem', color: currentTheme.theme }}>PAUSED</h2>
                <button onClick={handleBackToMenu} style={{ padding: '10px 30px', background: 'none', border: `3px solid ${currentTheme.theme}`, color: currentTheme.theme, cursor: 'pointer', fontSize: '1.2rem', fontFamily: '"VT323"' }}>
                  BACK TO MENU
                </button>
              </div>
            )}
            
            {/* GAME WIN: Дуу дуустал амжилттай тоглож дуусгавал харагдана */}
            {gameWin && (
              <div style={{ position: 'absolute', inset: 0, background: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
                <h1 style={{ color: currentTheme.theme, fontSize: '3.5rem' }}>RECORD SET!</h1>
                <p style={{ fontSize: '2rem', marginBottom: '30px' }}>FINAL SCORE: {score}</p>
                <button onClick={handleBackToMenu} style={{ padding: '12px 40px', background: currentTheme.theme, color: '#FFF', border: 'none', cursor: 'pointer', fontSize: '1.5rem', fontFamily: '"VT323"' }}>
                  BACK TO MENU
                </button>
              </div>
            )}

            {/* GAME OVER: Амь дуусах үед харагдах дэлгэц */}
            {gameOver && (
              <div style={{ position: 'absolute', inset: 0, background: '#FFEBEE', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 120 }}>
                <h1 style={{ color: '#C62828', fontSize: '3.5rem', marginBottom: '20px' }}>TRY AGAIN</h1>
                <button onClick={handleBackToMenu} style={{ padding: '12px 40px', background: '#C62828', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: '1.5rem', fontFamily: '"VT323"' }}>
                  BACK TO MENU
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}