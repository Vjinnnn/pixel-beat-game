import React, { useState, useEffect, useRef } from 'react';

// Дууны жагсаалт болон файлын замууд
// Анхаар: Дуунууд чинь public/ хавтас дотор байх ёстой
const pianoKeys = [
  { note: 'A', sound: '/showmehow.mp3' },
  { note: 'S', sound: '/creep.mp3' },
  { note: 'D', sound: '/fashion.mp3' },
  { note: 'F', sound: '/joyride.mp3' },
  { note: 'G', sound: '/surething.mp3' },
  { note: 'H', sound: '/showmehow.mp3' },
  { note: 'J', sound: '/creep.mp3' },
];

function App() {
  const [activeKey, setActiveKey] = useState(null);
  const audioRefs = useRef({});

  // Хуудас ачаалагдахад бүх дууг урьдчилж бэлдэх (Preload)
  useEffect(() => {
    pianoKeys.forEach((item) => {
      const audio = new Audio(item.sound);
      audio.preload = 'auto';
      audioRefs.current[item.note] = audio;
    });
  }, []);

  const playSound = (note) => {
    const audio = audioRefs.current[note];
    if (audio) {
      // 1. Өмнөх эгшиг явж байвал зогсоож, эхлэл рүү нь буцаана
      audio.pause();
      audio.currentTime = 0;
      
      // 2. Шинээр тоглуулна
      audio.play().catch((err) => console.log("Audio play error:", err));
      
      // 3. Товчлуурыг идэвхтэй харагдуулна
      setActiveKey(note);
      setTimeout(() => setActiveKey(null), 150);
    }
  };

  // Компьютерын гар (Keyboard) дээр тоглуулах хэсэг
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      const exists = pianoKeys.find(k => k.note === key);
      if (exists) {
        playSound(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-container" style={styles.app}>
      <h1 style={styles.title}>Pixel Beat 🎹</h1>
      <p style={styles.subtitle}>Гар эсвэл дэлгэц дээр дарж тоглоорой</p>
      
      <div className="piano-container" style={styles.piano}>
        {pianoKeys.map((item) => (
          <div
            key={item.note}
            // Хулганаар дарах болон Утсан дээр хүрэхийг хоёуланг нь дэмжинэ
            onMouseDown={() => playSound(item.note)}
            onTouchStart={(e) => {
              e.preventDefault(); // Утсан дээр дэлгэц томрохоос сэргийлнэ
              playSound(item.note);
            }}
            className={`key ${activeKey === item.note ? 'active' : ''}`}
            style={{
              ...styles.key,
              backgroundColor: activeKey === item.note ? '#4ade80' : 'white',
              transform: activeKey === item.note ? 'scale(0.95)' : 'scale(1)',
            }}
          >
            <span style={styles.keyLabel}>{item.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Энгийн CSS стилүүд (Үүнийг App.jsx дотор нь байлгаж болно)
const styles = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#1a1a1a',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
    overflow: 'hidden',
  },
  title: { fontSize: '2.5rem', marginBottom: '10px' },
  subtitle: { color: '#888', marginBottom: '30px' },
  piano: {
    display: 'flex',
    gap: '10px',
    padding: '20px',
    backgroundColor: '#333',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  },
  key: {
    width: '60px',
    height: '200px',
    borderRadius: '0 0 8px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: '20px',
    transition: 'all 0.1s ease',
    userSelect: 'none',
    touchAction: 'none', // Утасны зориулалттай
  },
  keyLabel: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: '1.2rem',
  }
};

export default App;
