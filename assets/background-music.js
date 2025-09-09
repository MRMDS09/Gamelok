// ملف موسيقى خلفية بسيط باستخدام Web Audio API
// يمكن استخدامه في React Native Web أو كبديل للمكتبات الخارجية

export const createBackgroundMusic = () => {
  // إنشاء نغمة موسيقية بسيطة
  const notes = [
    { frequency: 261.63, duration: 0.5 }, // C4
    { frequency: 293.66, duration: 0.5 }, // D4
    { frequency: 329.63, duration: 0.5 }, // E4
    { frequency: 349.23, duration: 0.5 }, // F4
    { frequency: 392.00, duration: 0.5 }, // G4
    { frequency: 440.00, duration: 0.5 }, // A4
    { frequency: 493.88, duration: 0.5 }, // B4
    { frequency: 523.25, duration: 1.0 }, // C5
  ];

  return {
    notes,
    totalDuration: notes.reduce((sum, note) => sum + note.duration, 0),
    loop: true
  };
};

// نغمة نقر بسيطة
export const createClickSound = () => {
  return {
    frequency: 800,
    duration: 0.1,
    type: 'square'
  };
};

// نغمة إكمال المربع
export const createBoxCompleteSound = () => {
  return {
    frequency: 1000,
    duration: 0.2,
    type: 'sine'
  };
};

// نغمة نهاية اللعبة
export const createGameOverSound = () => {
  return {
    frequency: 600,
    duration: 0.5,
    type: 'triangle'
  };
};
